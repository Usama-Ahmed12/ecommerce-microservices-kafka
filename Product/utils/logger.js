const { createLogger, format, transports } = require('winston');
const { combine, timestamp, printf, colorize } = format;

// Custom log format
const logFormat = printf(({ level, message, timestamp }) => {
  return `${timestamp} [${level.toUpperCase()}]: ${message}`;
});

const logger = createLogger({
  level: 'info',
  format: combine(
    colorize(),         // colors console output
    timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    logFormat
  ),
  transports: [
    // Console pe log karega
    new transports.Console(),

    // ✅ All logs file me
    new transports.File({ filename: 'logs/combined.log' }),

    // ❌ Sirf error logs
    new transports.File({ filename: 'logs/error.log', level: 'error' })
  ],
});

module.exports = logger;
