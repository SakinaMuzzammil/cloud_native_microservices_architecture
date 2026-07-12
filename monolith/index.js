/**
 * Monolithic baseline application.
 * Implements the SAME auth/product/order functionality as the microservices
 * system, but as a single deployable process with in-process function calls
 * instead of network calls. Used strictly as a performance/scalability
 * comparison baseline in the evaluation section of the paper.
 */
const express = require('express');
const jwt = require('jsonwebtoken');
const morgan = require('morgan');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');

const PORT = process.env.PORT || 5000;
const JWT_SECRET = 'demo-secret-do-not-use-in-prod';

const USERS = [
  { id: 1, username: 'alice', password: 'password123', role: 'customer' },
  { id: 2, username: 'bob', password: 'password123', role: 'admin' }
];

let PRODUCTS = [
  { id: 'p1', name: 'Wireless Mouse', price: 19.99, stock: 120 },
  { id: 'p2', name: 'Mechanical Keyboard', price: 59.99, stock: 75 },
  { id: 'p3', name: '27" Monitor', price: 199.99, stock: 40 },
  { id: 'p4', name: 'USB-C Hub', price: 29.99, stock: 200 }
];

const ORDERS = new Map();

const app = express();
app.use(cors());
app.use(express.json());
app.use(morgan('tiny'));

app.get('/health', (req, res) => res.json({ status: 'UP', service: 'monolith' }));

app.post('/api/auth/login', (req, res) => {
  const { username, password } = req.body || {};
  const user = USERS.find(u => u.username === username && u.password === password);
  if (!user) return res.status(401).json({ error: 'invalid_credentials' });
  const token = jwt.sign({ sub: user.id, username: user.username, role: user.role }, JWT_SECRET, { expiresIn: '1h' });
  res.json({ token, expiresIn: 3600 });
});

app.get('/api/products', (req, res) => {
  const result = PRODUCTS.filter(p => p.stock > 0);
  res.json({ count: result.length, products: result });
});

app.get('/api/products/:id', (req, res) => {
  const product = PRODUCTS.find(p => p.id === req.params.id);
  if (!product) return res.status(404).json({ error: 'not_found' });
  res.json({ product });
});

app.post('/api/orders', (req, res) => {
  const { productId, qty, userId } = req.body || {};
  if (!productId || !qty) return res.status(400).json({ error: 'invalid_payload' });
  const product = PRODUCTS.find(p => p.id === productId);
  if (!product) return res.status(404).json({ error: 'not_found' });
  if (product.stock < qty) return res.status(409).json({ error: 'insufficient_stock' });
  product.stock -= qty;
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
});

app.get('/api/orders/:id', (req, res) => {
  const order = ORDERS.get(req.params.id);
  if (!order) return res.status(404).json({ error: 'not_found' });
  res.json({ order });
});

if (require.main === module) {
  app.listen(PORT, () => console.log(`[monolith] listening on ${PORT}`));
}

module.exports = app;
