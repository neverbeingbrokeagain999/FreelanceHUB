import winston from 'winston';
import 'winston-daily-rotate-file';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Define log levels
const levels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4,
};

// Define log level based on environment
const level = () => {
  const env = process.env.NODE_ENV || 'development';
  const isDevelopment = env === 'development';
  return isDevelopment ? 'debug' : 'warn';
};

// Define colors for each level
const colors = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  http: 'magenta',
  debug: 'blue',
};

// Add colors to winston
winston.addColors(colors);

// Mask sensitive data in logs
const maskSensitiveData = (info) => {
  const sensitiveFields = ['password', 'token', 'jwt', 'secret', 'key', 'auth', 'authorization'];
  let message = info.message;

  if (typeof message === 'object') {
    message = JSON.stringify(message);
  }

  // Mask MongoDB connection strings
  message = message.replace(
    /(mongodb(?:\+srv)?:\/\/[^:]+:)([^@]+)(@[^/]+)/g,
    '$1*****$3'
  );

  // Mask other sensitive fields
  sensitiveFields.forEach(field => {
    const regex = new RegExp(`(${field}["']?\\s*[:=]\\s*["']?)([^"'\\s]+)(["']?)`, 'gi');
    message = message.replace(regex, `$1*****$3`);
  });

  info.message = message;
  return info;
};

// Define the format for logs
const format = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss:ms' }),
  winston.format.colorize({ all: true }),
  winston.format(maskSensitiveData)(),
  winston.format.printf(
    (info) => `${info.timestamp} ${info.level}: ${info.message}`
  )
);

// Define file transport options
const fileOptions = {
  dirname: process.env.LOG_FILE_PATH || path.join(__dirname, '../../logs'),
  datePattern: 'YYYY-MM-DD',
  zippedArchive: true,
  maxSize: process.env.LOG_MAX_SIZE || '20m',
  maxFiles: process.env.LOG_MAX_FILES || '14d',
};

// Create transports array
const transports = [
  // Console transport
  new winston.transports.Console({
    format: winston.format.combine(
      winston.format.colorize(),
      winston.format.simple()
    )
  }),
  
  // Error logs
  new winston.transports.DailyRotateFile({
    ...fileOptions,
    filename: 'error-%DATE%.log',
    level: 'error',
  }),
  
  // All logs
  new winston.transports.DailyRotateFile({
    ...fileOptions,
    filename: 'combined-%DATE%.log',
  }),
];

// Create the logger instance
export const logger = winston.createLogger({
  level: level(),
  levels,
  format,
  transports,
  exceptionHandlers: [
    new winston.transports.DailyRotateFile({
      ...fileOptions,
      filename: 'exceptions-%DATE%.log',
    }),
  ],
  rejectionHandlers: [
    new winston.transports.DailyRotateFile({
      ...fileOptions,
      filename: 'rejections-%DATE%.log',
    }),
  ],
});

// If we're in development, also log to the console with simple format
if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.simple(),
  }));
}

// Create a stream object for Morgan middleware
export const stream = {
  write: (message) => logger.http(message.trim()),
};

// Export a function to get a logger instance with a specific context
export const getContextLogger = (context) => {
  return {
    error: (message, meta = {}) => logger.error(`[${context}] ${message}`, meta),
    warn: (message, meta = {}) => logger.warn(`[${context}] ${message}`, meta),
    info: (message, meta = {}) => logger.info(`[${context}] ${message}`, meta),
    http: (message, meta = {}) => logger.http(`[${context}] ${message}`, meta),
    debug: (message, meta = {}) => logger.debug(`[${context}] ${message}`, meta),
  };
};

export default {
  logger,
  stream,
  getContextLogger,
};
