const kafka = require('./config');
const logger = require('../utils/logger');

class KafkaConsumer {
  constructor() {
    this.consumer = kafka.consumer({ 
      groupId: 'order-service-group',
      sessionTimeout: 30000,
      heartbeatInterval: 3000
    });
    this.isConnected = false;
  }

  async connect() {
    if (this.isConnected) return;
    
    try {
      await this.consumer.connect();
      this.isConnected = true;
      logger.info(' Kafka Consumer connected successfully');
    } catch (error) {
      logger.error(' Kafka Consumer connection failed:', { error: error.message });
      setTimeout(() => this.connect(), 5000);
    }
  }

  async subscribe(topics, messageHandler) {
    if (!this.isConnected) {
      await this.connect();
    }

    try {
      // Subscribe to multiple topics
      for (const topic of topics) {
        await this.consumer.subscribe({ 
          topic, 
          fromBeginning: false 
        });
        logger.info(` Subscribed to topic: ${topic}`);
      }

      // Start consuming messages
      await this.consumer.run({
        eachMessage: async ({ topic, partition, message }) => {
          try {
            const event = JSON.parse(message.value.toString());
            const headers = message.headers || {};
            
            logger.info(`📨 Received event from ${topic}`, { 
              topic, 
              partition,
              offset: message.offset,
              eventType: headers['event-type']?.toString(),
              correlationId: headers['correlation-id']?.toString()
            });

            // Call the message handler
            await messageHandler(topic, event, headers);
            
          } catch (error) {
            logger.error(` Error processing message from ${topic}`, { 
              error: error.message,
              topic,
              partition,
              offset: message.offset
            });
            
            // Optional: Send to Dead Letter Queue
            // await this.sendToDLQ(topic, message, error);
          }
        }
      });

      logger.info(' Kafka Consumer started successfully');
    } catch (error) {
      logger.error(' Consumer subscription failed:', { error: error.message });
    }
  }

  async disconnect() {
    if (!this.isConnected) return;
    
    try {
      await this.consumer.disconnect();
      this.isConnected = false;
      logger.info('Kafka Consumer disconnected');
    } catch (error) {
      logger.error('Error disconnecting consumer:', error);
    }
  }
}

// Singleton instance
const kafkaConsumer = new KafkaConsumer();

module.exports = kafkaConsumer;