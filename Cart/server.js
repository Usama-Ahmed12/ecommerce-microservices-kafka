const app = require('./app');
const kafkaProducer = require('./kafka/producer');
const kafkaConsumer = require('./kafka/consumer');
const eventHandlers = require('./kafka/handlers');
const TOPICS = require('./kafka/topics');

// Load Cron Jobs
require('./cron/cartCleanup');

const PORT = process.env.PORT || 3004;

// 🔥 Kafka Setup
const startKafka = async () => {
  try {
    console.log('🔄 Initializing Kafka...');
    
    await kafkaProducer.connect();
    await kafkaConsumer.connect();
    
    const topicsToSubscribe = [
      TOPICS.PRODUCT_UPDATED,
      TOPICS.PRODUCT_DELETED,
      TOPICS.PRODUCT_OUT_OF_STOCK,
      TOPICS.PRICE_CHANGED
    ];
    
    await kafkaConsumer.subscribe(topicsToSubscribe, (topic, event, headers) => {
      return eventHandlers.handleEvent(topic, event, headers);
    });
    
    console.log('✅ Kafka Producer & Consumer ready');
  } catch (error) {
    console.error('❌ Kafka setup failed:', error.message);
  }
};

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🛒 Cart Service is running on http://localhost:${PORT}`);
  
  startKafka().catch(err => {
    console.error('Kafka initialization error:', err);
  });
});

const gracefulShutdown = async () => {
  console.log('\n🛑 Shutting down gracefully...');
  
  try {
    await kafkaProducer.disconnect();
    await kafkaConsumer.disconnect();
  } catch (error) {
    console.error('Shutdown error:', error);
  }
  
  process.exit(0);
};

process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);