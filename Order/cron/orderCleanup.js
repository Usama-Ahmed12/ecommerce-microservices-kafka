const cron = require("node-cron");
const { cancelOldPendingOrders } = require("../services/orderService");
const logger = require("../utils/logger");

// Run every hour
cron.schedule("0 * * * *", async () => {
  logger.info(" Running Order Cleanup Cron...");
  const result = await cancelOldPendingOrders();
  logger.info(`Cron Job Result: ${JSON.stringify(result)}`);
});