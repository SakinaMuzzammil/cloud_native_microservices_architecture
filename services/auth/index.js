/**
 * Auth Service
 * Responsibility: user authentication & JWT issuance.
 * Part of the cloud-native microservices reference architecture.
 */
const express = require('express');
const jwt = require('jsonwebtoken');
const morgan = require('morgan');
const cors = require('cors');

const PORT = process.env.PORT || 4001;
const JWT_SECRET = process.env.JWT_SECRET || 'demo-secret-do-not-use-in-prod';

// In-memory user store (would be a managed DB, e.g. RDS/DynamoDB, in production)
const USERS = [
  { id: 1, username: 'alice', password: 'password123', role: 'customer' },
  { id: 2, username: 'bob', password: 'password123', role: 'admin' }
];

const app = express();
app.use(cors());
app.use(express.json());
app.use(morgan('tiny'));

app.get('/health', (req, res) => res.json({ status: 'UP', service: 'auth' }));

app.post('/login', (req, res) => {
  const { username, password } = req.body || {};
  const user = USERS.find(u => u.username === username && u.password === password);
  if (!user) return res.status(401).json({ error: 'invalid_credentials' });

  const token = jwt.sign(
    { sub: user.id, username: user.username, role: user.role },
    JWT_SECRET,
    { expiresIn: '1h' }
  );
  res.json({ token, expiresIn: 3600 });
});

app.post('/verify', (req, res) => {
  const { token } = req.body || {};
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    res.json({ valid: true, decoded });
  } catch (e) {
    res.status(401).json({ valid: false, error: e.message });
  }
});

if (require.main === module) {
  app.listen(PORT, () => console.log(`[auth-service] listening on ${PORT}`));
}

module.exports = app;
