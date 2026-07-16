/**
 * API Gateway
 * Responsibility: single entry point, request routing, and client-side
 * load balancing across horizontally scaled service instances.
 * In production this role is typically filled by AWS ALB / API Gateway,
 * NGINX Ingress, or Kubernetes Service (kube-proxy) doing the same job.
 *
 * Routing strategy for the product-service pool is selectable via the
 * ROUTING_STRATEGY env var:
 *   - "round-robin" (default) : original baseline behaviour, unchanged.
 *   - "adaptive"                : proposed contribution -- power-of-two-choices
 *                                  load balancing + per-instance circuit breaker.
 *                                  See services/gateway/router-strategies.js.
 */
const express = require('express');
const morgan = require('morgan');
const cors = require('cors');
const { InstancePool } = require('./router-strategies');

const PORT = process.env.PORT || 4000;
const AUTH_URL = process.env.AUTH_URL || 'http://localhost:4001';
const ORDER_URL = process.env.ORDER_URL || 'http://localhost:4003';
// Comma-separated list -> supports N horizontally scaled product-service instances
const PRODUCT_URLS = (process.env.PRODUCT_URLS || 'http://localhost:4002').split(',');
const ROUTING_STRATEGY = process.env.ROUTING_STRATEGY === 'adaptive' ? 'adaptive' : 'round-robin';
const REQUEST_TIMEOUT_MS = parseInt(process.env.REQUEST_TIMEOUT_MS || '3000', 10);

const productPool = new InstancePool(PRODUCT_URLS);

const app = express();
app.use(cors());
app.use(express.json());
app.use(morgan('tiny'));

app.get('/health', (req, res) => res.json({ status: 'UP', service: 'gateway', productInstances: PRODUCT_URLS.length, routingStrategy: ROUTING_STRATEGY }));

// Exposes live per-instance state (in-flight count, circuit state, latency EWMA).
// Used by the fault-tolerance benchmark and for the paper's live-recovery figure.
app.get('/gateway/status', (req, res) => res.json({ routingStrategy: ROUTING_STRATEGY, instances: productPool.snapshot() }));

async function proxy(req, res, targetBase) {
  const url = targetBase + req.originalUrl.replace(/^\/api\/(auth|products|orders)/, m => ({
    '/api/auth': '', '/api/products': '/products', '/api/orders': '/orders'
  }[m] ?? ''));
  try {
    const resp = await fetch(url, {
      method: req.method,
      headers: { 'Content-Type': 'application/json' },
      body: ['GET', 'HEAD'].includes(req.method) ? undefined : JSON.stringify(req.body)
    });
    const data = await resp.json().catch(() => ({}));
    res.status(resp.status).json(data);
  } catch (e) {
    console.error("Gateway proxy error:", e);
    res.status(502).json({ error: 'bad_gateway', message: e.message });
  }
}

// Product-service requests go through the selectable routing strategy (round-robin
// or adaptive), with a per-request timeout so a hanging instance is treated as a
// failure for circuit-breaker purposes instead of hanging the client indefinitely.
async function proxyToProductPool(req, res) {
  const inst = productPool.select(ROUTING_STRATEGY);
  const url = inst.url + req.originalUrl.replace(/^\/api\/products/, '/products');
  const start = Date.now();
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    const resp = await fetch(url, {
      method: req.method,
      headers: { 'Content-Type': 'application/json' },
      body: ['GET', 'HEAD'].includes(req.method) ? undefined : JSON.stringify(req.body),
      signal: controller.signal,
    });
    const data = await resp.json().catch(() => ({}));
    productPool.recordResult(inst, { success: resp.ok, latencyMs: Date.now() - start });
    res.status(resp.status).json(data);
  } catch (e) {
    productPool.recordResult(inst, { success: false, latencyMs: Date.now() - start });
    console.error("Gateway proxy error:", e);
    res.status(502).json({ error: 'bad_gateway', message: e.message, instance: inst.url });
  } finally {
    clearTimeout(timer);
  }
}

app.use('/api/auth', (req, res) => proxy(req, res, AUTH_URL));
app.use('/api/orders', (req, res) => proxy(req, res, ORDER_URL));
app.use('/api/products', proxyToProductPool);

if (require.main === module) {
  app.listen(PORT, () => console.log(`[gateway] listening on ${PORT}; strategy=${ROUTING_STRATEGY}; product instances: ${PRODUCT_URLS.join(', ')}`));
}

module.exports = app;
