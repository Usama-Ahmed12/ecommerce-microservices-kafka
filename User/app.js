require('dotenv').config();
const express = require('express');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const connectDB = require('./config/db');
const logger = require('./utils/logger');
const cookieParser = require('cookie-parser');

connectDB();

const app = express();

app.use(cors());
app.use(helmet());

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: "Too many requests from this IP, please try again later."
});
app.use(limiter);

app.use(express.json());
app.use(cookieParser());

app.use((req, res, next) => {
  logger.info(`${req.method} ${req.originalUrl} - Body: ${JSON.stringify(req.body)}`);
  next();
});

//  ONLY USER ROUTES
const userRoutes = require('./routes/userRoutes');
app.use('/api/users', userRoutes);

app.get('/health', (req, res) => {
  res.json({ 
    service: "User Service",
    status: "OK",
    port: process.env.PORT || 3005
  });
});

app.use((req, res, next) => {
  logger.warn(`404 - Route Not Found: ${req.originalUrl}`);
  res.status(404).json({
    success: false,
    message: `Route ${req.originalUrl} not found`
  });
});

app.use((err, req, res, next) => {
  logger.error(`${err.status || 500} - ${err.message} - ${req.method} ${req.originalUrl}`);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || "Something went wrong!",
    data: null
  });
});

module.exports = app;
