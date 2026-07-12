/**
 * Order Service
 * Responsibility: order placement & orchestration.
 * Demonstrates synchronous inter-service communication with the Product Service.
 */
const express = require('express');
const morgan = require('morgan');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');

const PORT = process.env.PORT || 4003;
const PRODUCT_SERVICE_URL = process.env.PRODUCT_SERVICE_URL || 'http://localhost:4002';

const ORDERS = new Map();

const app = express();
app.use(cors());
app.use(express.json());
app.use(morgan('tiny'));

app.get('/health', (req, res) => res.json({ status: 'UP', service: 'order' }));

app.post('/orders', async (req, res) => {
  const { productId, qty, userId } = req.body || {};
  if (!productId || !qty) return res.status(400).json({ error: 'invalid_payload' });

  try {
    // Synchronous call to Product Service to reserve stock (inter-service call)
    const reserveResp = await fetch(`${PRODUCT_SERVICE_URL}/products/${productId}/reserve`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ qty })
    });

    if (!reserveResp.ok) {
      const err = await reserveResp.json();
      return res.status(reserveResp.status).json({ error: 'order_failed', reason: err });
    }
    const { product } = await reserveResp.json();

    const order = {
      id: uuidv4(),
      userId: userId || 'anonymous',
      productId,
      qty,
      unitPrice: product.price,
      total: +(product.price * qty).toFixed(2),
      status: 'CONFIRMED',
      createdAt: new Date().toISOString()
    };
    ORDERS.set(order.id, order);
    res.status(201).json({ order });
  } catch (e) {
    res.status(502).json({ error: 'downstream_unavailable', message: e.message });
  }
});

app.get('/orders/:id', (req, res) => {
  const order = ORDERS.get(req.params.id);
  if (!order) return res.status(404).json({ error: 'not_found' });
  res.json({ order });
});

app.get('/orders', (req, res) => {
  res.json({ count: ORDERS.size, orders: Array.from(ORDERS.values()) });
});

if (require.main === module) {
  app.listen(PORT, () => console.log(`[order-service] listening on ${PORT}, product-service=${PRODUCT_SERVICE_URL}`));
}

module.exports = app;
