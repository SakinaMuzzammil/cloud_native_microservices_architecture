/**
 * Demo bundle entrypoint.
 *
 * This is NOT a different architecture -- it is the exact same auth/product/
 * order/gateway microservices from services/*, each still communicating over
 * real HTTP, just started on internal loopback ports within a single
 * container so the whole system can be deployed as ONE free-tier web
 * service (Render, Railway, Fly.io, etc. each expose only one public port
 * on a free plan). The production deployment target for this architecture
 * remains the multi-node Kubernetes/EKS setup documented in docs/DEPLOYMENT.md;
 * this file exists purely to give reviewers and readers a clickable, public
 * demo without requiring a paid multi-service cloud plan.
 */
const path = require('path');
const express = require('express');

const EXTERNAL_PORT = process.env.PORT || 8080;

// Internal loopback ports for each microservice (not exposed publicly)
const AUTH_PORT = 14001;
const PRODUCT_PORT = 14002;
const ORDER_PORT = 14003;
const GATEWAY_PORT = 14000;

process.env.JWT_SECRET = process.env.JWT_SECRET || 'demo-secret-do-not-use-in-prod';

// Start Auth Service
process.env.PORT = String(AUTH_PORT);
require('../services/auth/index.js').listen(AUTH_PORT, () => console.log(`[demo] auth-service internal:${AUTH_PORT}`));

// Start Product Service
delete require.cache[require.resolve('../services/product/index.js')];
process.env.PORT = String(PRODUCT_PORT);
process.env.INSTANCE_ID = 'product-demo-1';
require('../services/product/index.js').listen(PRODUCT_PORT, () => console.log(`[demo] product-service internal:${PRODUCT_PORT}`));

// Start Order Service (points at internal Product Service)
delete require.cache[require.resolve('../services/order/index.js')];
process.env.PORT = String(ORDER_PORT);
process.env.PRODUCT_SERVICE_URL = `http://127.0.0.1:${PRODUCT_PORT}`;
require('../services/order/index.js').listen(ORDER_PORT, () => console.log(`[demo] order-service internal:${ORDER_PORT}`));

// Start Gateway (points at internal Auth/Order/Product)
delete require.cache[require.resolve('../services/gateway/index.js')];
process.env.PORT = String(GATEWAY_PORT);
process.env.AUTH_URL = `http://127.0.0.1:${AUTH_PORT}`;
process.env.ORDER_URL = `http://127.0.0.1:${ORDER_PORT}`;
process.env.PRODUCT_URLS = `http://127.0.0.1:${PRODUCT_PORT}`;
require('../services/gateway/index.js').listen(GATEWAY_PORT, () => console.log(`[demo] gateway internal:${GATEWAY_PORT}`));

// Public-facing app: serves the static frontend AND forwards /api + /health to the gateway
const app = express();
app.use(express.static(path.join(__dirname, '..', 'public')));
app.use(express.json());

app.use(['/api', '/health'], async (req, res) => {
  try {
    const target = `http://127.0.0.1:${GATEWAY_PORT}${req.originalUrl}`;
    const resp = await fetch(target, {
      method: req.method,
      headers: { 'Content-Type': 'application/json' },
      body: ['GET', 'HEAD'].includes(req.method) ? undefined : JSON.stringify(req.body || {})
    });
    const data = await resp.json().catch(() => ({}));
    res.status(resp.status).json(data);
  } catch (e) {
    res.status(502).json({ error: 'demo_bundle_bad_gateway', message: e.message });
  }
});

app.listen(EXTERNAL_PORT, () => {
  console.log(`[demo] public entrypoint listening on ${EXTERNAL_PORT}`);
  console.log(`[demo] internal services: auth:${AUTH_PORT} product:${PRODUCT_PORT} order:${ORDER_PORT} gateway:${GATEWAY_PORT}`);
});
