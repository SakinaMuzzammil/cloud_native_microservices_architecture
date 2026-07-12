/**
 * Product Service
 * Responsibility: product catalog management.
 * Stateless by design so it can be horizontally scaled behind a load balancer.
 */
const express = require('express');
const morgan = require('morgan');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');

const PORT = process.env.PORT || 4002;
const INSTANCE_ID = process.env.INSTANCE_ID || `product-${PORT}`;

// Seed catalog (in production: RDS/Aurora, DynamoDB, or Cloud SQL)
let PRODUCTS = [
  { id: 'p1', name: 'Wireless Mouse', price: 19.99, stock: 120 },
  { id: 'p2', name: 'Mechanical Keyboard', price: 59.99, stock: 75 },
  { id: 'p3', name: '27" Monitor', price: 199.99, stock: 40 },
  { id: 'p4', name: 'USB-C Hub', price: 29.99, stock: 200 }
];

const app = express();
app.use(cors());
app.use(express.json());
app.use(morgan('tiny'));

app.get('/health', (req, res) => res.json({ status: 'UP', service: 'product', instance: INSTANCE_ID }));

app.get('/products', (req, res) => {
  // Simulate a small, realistic amount of processing work (serialization, filtering)
  const result = PRODUCTS.filter(p => p.stock > 0);
  res.json({ instance: INSTANCE_ID, count: result.length, products: result });
});

app.get('/products/:id', (req, res) => {
  const product = PRODUCTS.find(p => p.id === req.params.id);
  if (!product) return res.status(404).json({ error: 'not_found' });
  res.json({ instance: INSTANCE_ID, product });
});

app.post('/products', (req, res) => {
  const { name, price, stock } = req.body || {};
  if (!name || price == null) return res.status(400).json({ error: 'invalid_payload' });
  const product = { id: uuidv4(), name, price, stock: stock || 0 };
  PRODUCTS.push(product);
  res.status(201).json({ instance: INSTANCE_ID, product });
});

// Internal endpoint used by the order service to check/decrement stock atomically
app.post('/products/:id/reserve', (req, res) => {
  const { qty } = req.body || {};
  const product = PRODUCTS.find(p => p.id === req.params.id);
  if (!product) return res.status(404).json({ error: 'not_found' });
  if (product.stock < qty) return res.status(409).json({ error: 'insufficient_stock' });
  product.stock -= qty;
  res.json({ instance: INSTANCE_ID, product });
});

if (require.main === module) {
  app.listen(PORT, () => console.log(`[product-service] instance=${INSTANCE_ID} listening on ${PORT}`));
}

module.exports = app;
