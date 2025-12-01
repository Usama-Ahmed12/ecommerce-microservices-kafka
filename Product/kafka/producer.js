const kafka = require('./config');
const logger = require('../utils/logger');

class KafkaProducer {
  constructor() {
    this.producer = kafka.producer({
      allowAutoTopicCreation: true,
      transactionTimeout: 30000
    });
    this.isConnected = false;
  }

  async connect() {
    if (this.isConnected) return;
    
    try {
      await this.producer.connect();
      this.isConnected = true;
      logger.info('✅ Kafka Producer connected successfully');
    } catch (error) {
      logger.error('❌ Kafka Producer connection failed:', { error: error.message });
      setTimeout(() => this.connect(), 5000);
    }
  }

  async publishEvent(topic, message) {
    if (!this.isConnected) {
      logger.warn('⚠️ Producer not connected, attempting to connect...');
      await this.connect();
    }

    try {
      const result = await this.producer.send({
        topic,
        messages: [
          {
            key: message.productId || message.id,
            value: JSON.stringify({
              ...message,
              timestamp: new Date().toISOString(),
              service: 'product-service'
            }),
            headers: {
              'event-type': topic,
              'correlation-id': message.correlationId || Date.now().toString()
            }
          }
        ]
      });

      logger.info(`📤 Event published to ${topic}`, { 
        topic, 
        partition: result[0].partition,
        offset: result[0].offset,
        messageId: message.productId || message.id
      });
      
      return { success: true, result };
    } catch (error) {
      logger.error(`❌ Failed to publish event to ${topic}`, { 
        error: error.message, 
        topic,
        message 
      });
      return { success: false, error: error.message };
    }
  }

  async disconnect() {
    if (!this.isConnected) return;
    
    try {
      await this.producer.disconnect();
      this.isConnected = false;
      logger.info('Kafka Producer disconnected');
    } catch (error) {
      logger.error('Error disconnecting producer:', error);
    }
  }
}

const kafkaProducer = new KafkaProducer();

module.exports = kafkaProducer;