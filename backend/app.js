// app.js
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
require('dotenv').config();

const placesRoutes = require('./routes/places-routes');
const usersRoutes = require('./routes/users-routes');
const HttpError = require('./models/http-error');

const app = express();

// --- CORS ---
const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS || '').split(',').map(s => s.trim()).filter(Boolean);
app.use(cors({
  origin: (origin, cb) => {
    // allow no-origin requests (Postman/health checks) and any origin in list
    if (!origin || ALLOWED_ORIGINS.includes(origin) || ALLOWED_ORIGINS.includes('*')) return cb(null, true);
    return cb(null, false);
  },
  credentials: true
}));

app.use(express.json());

// --- Health / root ---
app.get('/healthz', (_req, res) => res.status(200).send('ok'));
app.get('/', (_req, res) => res.json({ status: 'place-sharing API up' }));

// --- Routes ---
app.use('/api/places', placesRoutes);
app.use('/api/users', usersRoutes);

// --- 404 ---
app.use((_req, _res, next) => {
  next(new HttpError('Could not find this route.', 404));
});

// --- Error handler ---
app.use((error, _req, res, _next) => {
  if (res.headersSent) return;
  res.status(error.code || 500).json({ message: error.message || 'An unknown error occurred!' });
});

// --- Start server after DB connects ---
(async () => {
  try {
    if (!process.env.MONGO_URI) {
      console.error('❌ Missing MONGO_URI env var');
      process.exit(1);
    }

    await mongoose.connect(process.env.MONGO_URI, {
      // safe defaults; works fine with older mongoose too
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log('✅ MongoDB Connected');

    const PORT = process.env.PORT || 5000; // Render provides PORT
    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
    });

  } catch (err) {
    console.error('❌ MongoDB connection error:', err);
    process.exit(1);
  }
})();

// Optional: graceful shutdown on Render
process.on('SIGTERM', () => {
  console.log('🧹 SIGTERM received, closing server');
  mongoose.connection.close(() => process.exit(0));
});
