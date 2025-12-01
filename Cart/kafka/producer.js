const kafka = require('./config');
const logger = require('../utils/logger');

class KafkaProducer {
  constructor() {
    this.producer = kafka.producer({
      allowAutoTopicCreation: true,
      transactionTimeout: 30000,
      retry: {
        retries: 3,
        initialRetryTime: 100,
        multiplier: 2
      }
    });
    this.isConnected = false;
    this.connecting = false;
    this.pendingMessages = [];
  }

  async connect() {
    if (this.isConnected) return true;
    if (this.connecting) {
      // Already connecting, wait for it
      return new Promise((resolve) => {
        const checkConnection = setInterval(() => {
          if (this.isConnected) {
            clearInterval(checkConnection);
            resolve(true);
          }
        }, 100);
        
        // Timeout after 5 seconds
        setTimeout(() => {
          clearInterval(checkConnection);
          resolve(false);
        }, 5000);
      });
    }

    this.connecting = true;
    
    try {
      await this.producer.connect();
      this.isConnected = true;
      this.connecting = false;
      logger.info(' Kafka Producer connected successfully');
      
      // Process pending messages
      if (this.pendingMessages.length > 0) {
        logger.info(` Processing ${this.pendingMessages.length} pending messages`);
        const pending = [...this.pendingMessages];
        this.pendingMessages = [];
        
        for (const msg of pending) {
          await this.publishEvent(msg.topic, msg.message).catch(err => 
            logger.error('Error processing pending message:', err)
          );
        }
      }
      
      return true;
    } catch (error) {
      logger.error(' Kafka Producer connection failed:', { error: error.message });
      this.isConnected = false;
      this.connecting = false;
      
      // Retry connection after 5 seconds
      setTimeout(() => this.connect(), 5000);
      return false;
    }
  }

  async publishEvent(topic, message) {
    //  NON-BLOCKING: If not connected, queue the message
    if (!this.isConnected && !this.connecting) {
      logger.warn(' Producer not connected, queueing message');
      this.pendingMessages.push({ topic, message });
      this.connect().catch(err => logger.error('Connection retry failed:', err));
      return { success: false, queued: true };
    }

    // If connecting, queue it
    if (this.connecting) {
      this.pendingMessages.push({ topic, message });
      return { success: false, queued: true };
    }

    try {
      const result = await this.producer.send({
        topic,
        messages: [
          {
            key: message.userId || message.cartId || 'default',
            value: JSON.stringify({
              ...message,
              timestamp: new Date().toISOString(),
              service: 'cart-service'
            }),
            headers: {
              'event-type': topic,
              'correlation-id': message.correlationId || Date.now().toString()
            }
          }
        ],
        timeout: 5000 //  5 second timeout
      });

      logger.info(` Event published to ${topic}`, { 
        topic, 
        partition: result[0].partition,
        offset: result[0].offset
      });
      
      return { success: true, result };
    } catch (error) {
      logger.error(` Failed to publish event to ${topic}`, { 
        error: error.message, 
        topic
      });
      
      // Queue for retry
      this.pendingMessages.push({ topic, message });
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

// Connect on startup (non-blocking)
kafkaProducer.connect().catch(err => 
  logger.error('Initial Kafka connection failed:', err)
);

module.exports = kafkaProducer;