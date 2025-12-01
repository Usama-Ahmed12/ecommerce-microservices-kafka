require('dotenv').config();
const express = require('express');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const connectDB = require('./config/db');
const logger = require('./utils/logger');
const cookieParser = require('cookie-parser');

// Connect to MongoDB
connectDB();

const app = express();

// Enable CORS
app.use(cors());

// Enable Helmet
app.use(helmet());

// Rate limiter
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: "Too many requests from this IP, please try again later."
});
app.use(limiter);

// Middleware
app.use(express.json());
app.use(cookieParser());

// Request logger
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.originalUrl} - Body: ${JSON.stringify(req.body)}`);
  next();
});

// ✅ ONLY PRODUCT ROUTES
const productRoutes = require('./routes/productRoutes');
app.use('/api/products', productRoutes);

// Static folder for uploaded images
app.use('/uploads', express.static('uploads'));

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    service: "Product Service",
    status: "OK",
    port: process.env.PORT || 3003
  });
});

// 404 handler
app.use((req, res, next) => {
  logger.warn(`404 - Route Not Found: ${req.originalUrl}`);
  res.status(404).json({
    success: false,
    message: `Route ${req.originalUrl} not found`
  });
});

// Global Error Handler
app.use((err, req, res, next) => {
  logger.error(`${err.status || 500} - ${err.message} - ${req.method} ${req.originalUrl}`);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || "Something went wrong!",
    data: null
  });
});

module.exports = app;