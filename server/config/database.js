import mongoose from 'mongoose';
import logger from './logger.js';

const connectDB = async () => {
  try {
    // In test environment, MongoDB connection is handled by test setup
    if (process.env.NODE_ENV === 'test') {
      return;
    }

    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 30000, // Increase timeout to 30s for initial connection
      socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
      connectTimeoutMS: 30000, // Give up initial connection after 30 seconds
      ssl: true,
      retryWrites: true,
      w: 'majority',
      family: 4 // Force IPv4
    });

    logger.info(`MongoDB Connected: ${conn.connection.host} (${process.env.NODE_ENV} environment)`);

    // Handle connection events
    mongoose.connection.on('connected', () => {
      logger.info('MongoDB connection established');
    });

    mongoose.connection.on('error', (err) => {
      logger.error('MongoDB connection error:', err);
    });

    mongoose.connection.on('disconnected', () => {
      logger.warn('MongoDB connection disconnected');
    });

    // Handle process termination
    process.on('SIGINT', async () => {
      try {
        await mongoose.connection.close();
        logger.info('MongoDB connection closed through app termination');
        process.exit(0);
      } catch (err) {
        logger.error('Error while closing MongoDB connection:', err);
        process.exit(1);
      }
    });

  } catch (error) {
    logger.error('MongoDB connection error:', error);
    process.exit(1);
  }
};

// Schema-level options for all models
mongoose.set('strictQuery', true); // Strict query mode for improved type safety
mongoose.set('debug', process.env.NODE_ENV === 'development'); // Log queries in development

// Configure mongoose to use native ES6 Promises
mongoose.Promise = global.Promise;

export default connectDB;
