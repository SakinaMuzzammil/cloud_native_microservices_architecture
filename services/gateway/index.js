/**
 * API Gateway
 * Responsibility: single entry point, request routing, and client-side
 * round-robin load balancing across horizontally scaled service instances.
 * In production this role is typically filled by AWS ALB / API Gateway,
 * NGINX Ingress, or Kubernetes Service (kube-proxy) doing the same job.
 */
const express = require('express');
const morgan = require('morgan');
const cors = require('cors');

const PORT = process.env.PORT || 4000;
const AUTH_URL = process.env.AUTH_URL || 'http://localhost:4001';
const ORDER_URL = process.env.ORDER_URL || 'http://localhost:4003';
// Comma-separated list -> supports N horizontally scaled product-service instances
const PRODUCT_URLS = (process.env.PRODUCT_URLS || 'http://localhost:4002').split(',');

let rrIndex = 0;
function nextProductUrl() {
  const url = PRODUCT_URLS[rrIndex % PRODUCT_URLS.length];
  rrIndex += 1;
  return url;
}

const app = express();
app.use(cors());
app.use(express.json());
app.use(morgan('tiny'));

app.get('/health', (req, res) => res.json({ status: 'UP', service: 'gateway', productInstances: PRODUCT_URLS.length }));

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
    res.status(502).json({ error: 'bad_gateway', message: e.message });
  }
}

app.use('/api/auth', (req, res) => proxy(req, res, AUTH_URL));
app.use('/api/orders', (req, res) => proxy(req, res, ORDER_URL));
app.use('/api/products', (req, res) => proxy(req, res, nextProductUrl()));

if (require.main === module) {
  app.listen(PORT, () => console.log(`[gateway] listening on ${PORT}; product instances: ${PRODUCT_URLS.join(', ')}`));
}

module.exports = app;
