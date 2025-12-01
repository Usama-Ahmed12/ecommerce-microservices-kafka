const { Kafka } = require('kafkajs');
const logger = require('../utils/logger');

const kafka = new Kafka({
  clientId: 'auth-service',
  brokers: [process.env.KAFKA_BROKER || 'localhost:9092'],
  retry: {
    initialRetryTime: 300,
    retries: 10
  },
  connectionTimeout: 10000,
  requestTimeout: 30000
});

module.exports = kafka;