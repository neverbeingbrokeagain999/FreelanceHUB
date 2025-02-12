import mongoose from 'mongoose';
import { logger } from './logger.js';
import { getConfig } from './index.js';

export const connectDB = async () => {
  try {
    const MONGO_URI = process.env.MONGODB_URI;
    
    // Log connection attempt (without sensitive data)
    logger.info('Initializing MongoDB connection...');
    logger.debug('Database configuration:', {
      uri: MONGO_URI?.replace(/\/\/([^:]+):([^@]+)@/, '//***:***@'),
      env: process.env.NODE_ENV
    });

    if (!MONGO_URI) {
      throw new Error('MONGODB_URI environment variable is not defined');
    }

    const conn = await mongoose.connect(MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 30000,
      socketTimeoutMS: 45000,
      connectTimeoutMS: 30000,
      family: 4,
      retryWrites: true,
      w: 'majority',
      maxPoolSize: 10
    });

    logger.info(`MongoDB Connected: ${conn.connection.host}`);

    // Handle connection events
    mongoose.connection.on('connected', () => {
      logger.info('MongoDB connection established successfully');
    });

    mongoose.connection.on('error', (err) => {
      logger.error('MongoDB connection error:', {
        error: err.message,
        stack: err.stack,
        code: err.code
      });
    });

    mongoose.connection.on('disconnected', () => {
      logger.warn('MongoDB connection disconnected');
    });

    mongoose.connection.on('reconnected', () => {
      logger.info('MongoDB connection reestablished');
    });

    return conn;
  } catch (error) {
    logger.error('MongoDB connection error:', {
      error: error.message,
      stack: error.stack,
      code: error.code,
      name: error.name
    });

    if (error.name === 'MongoServerSelectionError') {
      logger.error('Could not connect to MongoDB server. Please check if MongoDB is running and accessible.');
    }

    throw error;
  }
};

export const closeDB = async () => {
  try {
    logger.info('Closing MongoDB connection...');
    await mongoose.connection.close();
    logger.info('MongoDB connection closed successfully');
  } catch (error) {
    logger.error('Error closing MongoDB connection:', {
      error: error.message,
      stack: error.stack
    });
    throw error;
  }
};

export default {
  connectDB,
  closeDB
};
