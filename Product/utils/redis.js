const { createClient } = require("redis");
const logger = require("./logger");

const redisClient = createClient({
  url: process.env.REDIS_URL || "redis://127.0.0.1:6379"
});

redisClient.on("error", (err) => logger.error("Redis Client Error", { error: err }));

redisClient.connect()
  .then(() => logger.info("Product Service: Redis connected"))
  .catch((err) => logger.error("Product Service: Redis connection failed", { error: err }));

module.exports = redisClient;