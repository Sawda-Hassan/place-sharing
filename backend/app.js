const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const placesRoutes = require('./routes/places-routes');
const usersRoutes = require('./routes/users-routes');
const HttpError = require('./models/http-error');

const app = express();
app.use(express.json());

// --- CORS (single source of truth) ---
const ALLOWED = new Set([
  'https://place-sharing-128o.vercel.app', // prod frontend
  'http://localhost:3000',                 // dev
]);

app.use(cors({
  origin: (origin, cb) => {
    // allow no-origin (Postman/cURL) and whitelisted origins
    if (!origin || ALLOWED.has(origin) || /\.vercel\.app$/.test(origin)) {
      return cb(null, true);
    }
    return cb(new Error(`CORS: ${origin} not allowed`));
  },
  methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Origin', 'X-Requested-With', 'Content-Type', 'Accept', 'Authorization']
}));

// Fast exit for preflight
app.options('*', cors());

// --- Routes ---
app.use('/api/places', placesRoutes);
app.use('/api/users', usersRoutes);

// Health (handy for Render checks)
app.get('/', (_req, res) => res.send('OK'));
app.get('/health', (_req, res) => res.status(200).json({ ok: true, uptime: process.uptime(), ts: Date.now() }));
app.get('/api/health', (_req, res) => res.status(200).json({ ok: true, uptime: process.uptime(), ts: Date.now() }));

// 404
app.use((req, res, next) => next(new HttpError('Could not find this route.', 404)));

// Error handler
app.use((error, req, res, next) => {
  if (res.headersSent) return next(error);
  res.status(error.code || 500).json({ message: error.message || 'An unknown error occurred!' });
});

// --- Mongo connect & start ---
const URI = process.env.MONGODB_URI || process.env.MONGO_URI;
const PORT = process.env.PORT || 5000;

(async () => {
  try {
    if (!URI) throw new Error('Missing MONGODB_URI/MONGO_URI');
    await mongoose.connect(URI, { maxPoolSize: 10 });
    console.log('✅ MongoDB Connected');
    app.listen(PORT, () => console.log(`🚀 Server running on :${PORT}`));
  } catch (err) {
    console.error('❌ MongoDB connection error:', err.message);
    process.exit(1);
  }
})();
