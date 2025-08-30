const express = require('express');
const mongoose = require('mongoose');
require('dotenv').config();

const placesRoutes = require('./routes/places-routes');
const usersRoutes = require('./routes/users-routes');
const HttpError = require('./models/http-error');

const app = express();
app.use(express.json()); // body parser

// CORS
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'Origin, X-Requested-With, Content-Type, Accept, Authorization'
  );
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PATCH, DELETE, OPTIONS');
  if (req.method === 'OPTIONS') return res.sendStatus(200);
  next();
});

// Routes
app.use('/api/places', placesRoutes);
app.use('/api/users', usersRoutes);

// Root + health (add these BEFORE the 404)
app.get('/', (_req, res) => res.send('OK'));
app.get('/health', (_req, res) =>
  res.status(200).json({ ok: true, uptime: process.uptime(), timestamp: new Date().toISOString() })
);

// 404
app.use((req, res, next) => next(new HttpError('Could not find this route.', 404)));

// Error handler
app.use((error, req, res, next) => {
  if (res.headersSent) return next(error);
  res.status(error.code || 500).json({ message: error.message || 'An unknown error occurred!' });
});

// Mongo connect
const URI = process.env.MONGODB_URI || process.env.MONGO_URI;
const PORT = process.env.PORT || 5000;

(async () => {
  try {
    if (!URI) throw new Error('Missing MONGODB_URI/MONGO_URI');
    // If you're on Mongoose v7+ you don't need useNewUrlParser/useUnifiedTopology
    await mongoose.connect(URI, { maxPoolSize: 10 });
    console.log('✅ MongoDB Connected');
    app.listen(PORT, () => console.log(`🚀 Server running at http://localhost:${PORT}`));
  } catch (err) {
    console.error('❌ MongoDB connection error:', err.message);
    process.exit(1);
  }
})();
