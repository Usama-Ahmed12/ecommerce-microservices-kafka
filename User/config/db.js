const mongoose = require("mongoose");
const logger = require("../utils/logger");

const connectDB = async () => {
  try {
    if (!process.env.MONGO_URI) {
      logger.error("Database: MONGO_URI environment variable is not defined.");
      process.exit(1);
    }

    const conn = await mongoose.connect(process.env.MONGO_URI);
    logger.info("User Service: MongoDB Connected successfully.", { 
      dbName: conn.connection.name, 
      dbHost: conn.connection.host 
    });

  } catch (error) {
    logger.error("Database: MongoDB connection error", { 
      error: error.message, 
      stack: error.stack 
    });
    process.exit(1);
  }
};

module.exports = connectDB;
