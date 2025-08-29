const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
require('dotenv').config();

const placesRoutes = require('./routes/places-routes');
const usersRoutes = require('./routes/users-routes');
const HttpError = require('./models/http-error');

const app = express();
app.use(bodyParser.json());

// CORS setup
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'Origin, X-Requested-With, Content-Type, Accept, Authorization'
  );
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PATCH, DELETE');
  next();
});

app.use('/api/places', placesRoutes);
app.use('/api/users', usersRoutes);

// 404
app.use((req, res, next) => {
  throw new HttpError('Could not find this route.', 404);
});

// Error handler
app.use((error, req, res, next) => {
  if (res.headersSent) return next(error);
  res.status(error.code || 500).json({ message: error.message || 'An unknown error occurred!' });
});

// ✅ Connect to Mongo
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => {
  console.log('✅ MongoDB Connected');
  app.listen(process.env.PORT || 5000, () =>
    console.log(`🚀 Server running at http://localhost:${process.env.PORT || 5000}`)
  );
})
.catch(err => {
  console.error('❌ MongoDB connection error:', err);
});
