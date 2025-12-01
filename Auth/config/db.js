const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const User = require("../models/userModel");
const logger = require("../utils/logger");

const connectDB = async () => {
  try {
    if (!process.env.MONGO_URI) {
      logger.error("Database: MONGO_URI environment variable is not defined.");
      process.exit(1);
    }

    const conn = await mongoose.connect(process.env.MONGO_URI);
    logger.info("Auth Service: MongoDB Connected successfully.", { dbName: conn.connection.name, dbHost: conn.connection.host });

    await seedAdmin();
  } catch (error) {
    logger.error("Database: MongoDB connection error", { error: error.message, stack: error.stack });
    process.exit(1);
  }
};

const seedAdmin = async () => {
  try {
    const adminEmail = process.env.ADMIN_EMAIL;
    const adminPass = process.env.ADMIN_PASS;

    if (!adminEmail || !adminPass) {
      logger.warn("Admin Seeder: ADMIN_EMAIL or ADMIN_PASS environment variables are not defined. Skipping admin seeding.");
      return;
    }

    let admin = await User.findOne({ email: adminEmail });
    if (admin) {
      logger.info("Admin Seeder: Admin already exists, skipping creation.", { email: adminEmail });
      return;
    }

    const hashedPassword = await bcrypt.hash(adminPass, 10);

    admin = new User({
      firstName: "Super",
      lastName: "Admin",
      phoneNumber: "0000000000",
      email: adminEmail,
      password: hashedPassword,
      role: "admin",
      isVerified: true,
    });

    await admin.save();
    logger.info("Admin Seeder: Default admin created successfully.", { email: adminEmail });
  } catch (error) {
    logger.error("Admin Seeder: Error seeding default admin user", { error: error.message, stack: error.stack, adminEmail: process.env.ADMIN_EMAIL });
  }
};

module.exports = connectDB;

