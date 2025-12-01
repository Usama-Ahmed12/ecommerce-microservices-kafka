const app = require('./app');
const kafkaProducer = require('./kafka/producer');
const kafkaConsumer = require('./kafka/consumer');
const eventHandlers = require('./kafka/handlers');
const TOPICS = require('./kafka/topics');

const PORT = process.env.PORT || 3001;

//  Kafka Setup Function
const startKafka = async () => {
  try {
    console.log(' Initializing Kafka...');
    
    // Connect Producer
    await kafkaProducer.connect();
    
    // Connect Consumer
    await kafkaConsumer.connect();
    
    // Subscribe to topics
    const topicsToSubscribe = [
      TOPICS.ORDER_CREATED,
      TOPICS.ORDER_PAID
    ];
    
    await kafkaConsumer.subscribe(topicsToSubscribe, (topic, event, headers) => {
      return eventHandlers.handleEvent(topic, event, headers);
    });
    
    console.log(' Kafka Producer & Consumer ready');
  } catch (error) {
    console.error(' Kafka setup failed:', error.message);
    // Don't crash the app - Kafka will retry in background
  }
};

// Start Server
app.listen(PORT, '0.0.0.0', () => {
  console.log(` Auth Service is running on http://localhost:${PORT}`);
  
  // Initialize Kafka after server starts
  startKafka().catch(err => {
    console.error('Kafka initialization error:', err);
  });
});

// Graceful Shutdown
const gracefulShutdown = async () => {
  console.log('\n Shutting down gracefully...');
  
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