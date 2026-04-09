require('dotenv').config();
const express     = require('express');
const cors        = require('cors');
const rateLimit   = require('express-rate-limit');
const connectDB   = require('./config/db');
const { notFound, errorHandler } = require('./middleware/errorHandler');

connectDB();

const app = express();

// ── CORS (manual headers — most reliable) ────────────────────────────────
const allowedOrigins = [
  "https://studenthub-psi.vercel.app",
  "http://localhost:5173",
];

app.use((req, res, next) => {
  const origin = req.headers.origin;

  if (allowedOrigins.includes(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
  }

  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  res.setHeader("Access-Control-Allow-Credentials", "true");

  if (req.method === "OPTIONS") return res.sendStatus(200);

  next();
});

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  skip: (req) => req.method === 'OPTIONS',
  message: { success: false, message: 'Too many requests, please try again later.' },
});
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  skip: (req) => req.method === 'OPTIONS',
});

app.use('/api/auth', authLimiter);
app.use('/api',      apiLimiter);

app.get('/health', (req, res) => res.json({ status: 'OK', timestamp: new Date().toISOString() }));

app.use('/api/auth',       require('./routes/auth'));
app.use('/api/students',   require('./routes/students'));
app.use('/api/attendance', require('./routes/attendance'));
app.use('/api/results',    require('./routes/results'));

app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT} [${process.env.NODE_ENV}]`));
