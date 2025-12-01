const app = require('./app');
const kafkaProducer = require('./kafka/producer');
const kafkaConsumer = require('./kafka/consumer');
const eventHandlers = require('./kafka/handlers');
const TOPICS = require('./kafka/topics');

// Load Cron Jobs
require('./cron/orderCleanup');

const PORT = process.env.PORT || 3005;

// 🔥 Kafka Setup
const startKafka = async () => {
  try {
    // Connect Producer
    await kafkaProducer.connect();
    
    // Connect Consumer
    await kafkaConsumer.connect();
    
    // Subscribe to topics
    const topicsToSubscribe = [
      TOPICS.PAYMENT_SUCCESS,
      TOPICS.PAYMENT_FAILED,
      TOPICS.PRODUCT_UPDATED,
      TOPICS.CART_UPDATED
    ];
    
    await kafkaConsumer.subscribe(topicsToSubscribe, (topic, event, headers) => {
      return eventHandlers.handleEvent(topic, event, headers);
    });
    
    console.log('✅ Kafka Producer & Consumer ready');
  } catch (error) {
    console.error('❌ Kafka setup failed:', error);
    // Don't crash the app, Kafka will retry
  }
};

// Start Server
app.listen(PORT, '0.0.0.0', async () => {
  console.log(`📦 Order Service is running on http://localhost:${PORT}`);
  
  // Initialize Kafka
  await startKafka();
});

// Graceful Shutdown
const gracefulShutdown = async () => {
  console.log('\n🛑 Shutting down gracefully...');
  
  await kafkaProducer.disconnect();
  await kafkaConsumer.disconnect();
  
  process.exit(0);
};

process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);