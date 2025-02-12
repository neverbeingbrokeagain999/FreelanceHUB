// Configure dotenv before any imports
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from root .env
dotenv.config({ path: path.resolve(__dirname, '../.env') });

// Log loaded config
console.log('Loaded environment:', {
  NODE_ENV: process.env.NODE_ENV,
  MONGODB_URI: process.env.MONGODB_URI ? 'Set' : 'Not set'
});

import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import { connectDB } from './config/database.js';
import { initRedis } from './config/redis.js';
import { errorHandler } from './utils/errorHandler.js';
import { logger } from './config/logger.js';
import { getConfig } from './config/index.js';

import mongoose from 'mongoose';
import authRoutes from './routes/auth.js';
import projectTemplateRoutes from './routes/projectTemplate.js';
import jobRoutes from './routes/job.js';
import userRoutes from './routes/user.js';
import reviewRoutes from './routes/review.js';
import chatRoutes from './routes/chat.js';
import notificationRoutes from './routes/notification.js';
import paymentRoutes from './routes/payment.js';
import adminRoutes from './routes/admin.js';

// Initialize express
const app = express();

// Configure middleware
const configureMiddleware = () => {
  // Security middleware
  app.use(helmet());

  // Rate limiting
  const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100 // limit each IP to 100 requests per windowMs
  });
  app.use('/api/', limiter);

  // Body parsing middleware
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));
  app.use(cookieParser());

  // CORS configuration
  if (process.env.NODE_ENV !== 'production') {
    app.use((req, res, next) => {
      res.header('Access-Control-Allow-Origin', req.headers.origin);
      res.header('Access-Control-Allow-Credentials', 'true');
      res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS');
      res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
      
      if (req.method === 'OPTIONS') {
        return res.status(200).end();
      }
      next();
    });
  } else {
    const corsOptions = {
      origin: process.env.CORS_ORIGIN,
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization'],
      optionsSuccessStatus: 200
    };
    app.use(cors(corsOptions));
  }
};

// Configure routes
const configureRoutes = () => {
  // API routes
  app.use('/api/auth', authRoutes);
  app.use('/api/project-templates', projectTemplateRoutes);
  app.use('/api/jobs', jobRoutes);
  app.use('/api/users', userRoutes);
  app.use('/api/reviews', reviewRoutes);
  app.use('/api/chat', chatRoutes);
  app.use('/api/notifications', notificationRoutes);
  app.use('/api/payments', paymentRoutes);
  app.use('/api/admin', adminRoutes);
};

// Initialize server function
const initializeServer = async () => {
  try {
    // Configure express middleware
    logger.info('Configuring middleware...');
    configureMiddleware();

    // Connect to MongoDB
    logger.info('Connecting to MongoDB...');
    const dbConnection = await connectDB().catch(err => {
      logger.error('MongoDB connection error:', err);
      throw new Error('Failed to connect to MongoDB');
    });

    // Connect to Redis
    logger.info('Connecting to Redis...');
    const redisClient = await initRedis().catch(err => {
      logger.error('Redis connection error:', err);
      throw new Error('Failed to connect to Redis');
    });

    // Store redis client for health checks
    app.set('redisClient', redisClient);

    // Configure routes after database connections are established
    logger.info('Configuring routes...');
    configureRoutes();

    // Health check route
    app.get('/health', (req, res) => {
      const redis = app.get('redisClient');
      res.status(200).json({
        status: 'success',
        message: 'Server is healthy',
        timestamp: new Date().toISOString(),
        redis: redis?.status || 'not connected',
        mongodb: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected'
      });
    });

    // Error handling
    app.use(errorHandler);

    // Handle unhandled routes
    app.use('*', (req, res) => {
      res.status(404).json({
        success: false,
        message: `Cannot ${req.method} ${req.originalUrl}`
      });
    });

    // Start server
    const PORT = process.env.PORT || 5000;
    const server = app.listen(PORT, () => {
      logger.info(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
    });

    // Store server instance for graceful shutdown
    app.set('server', server);

    // Return server instance
    return server;
  } catch (error) {
    logger.error('Failed to initialize server:', error);
    process.exit(1);
  }
};

const config = getConfig();

// Graceful shutdown handler
const shutdownGracefully = async () => {
  try {
    logger.info('Received shutdown signal. Closing server gracefully...');
    
    // Set a global shutdown timeout
    const shutdownTimeout = setTimeout(() => {
      logger.error('Forced shutdown due to timeout');
      process.exit(1);
    }, config.server.shutdownTimeout);

    // Close HTTP server and drain connections
    const server = app.get('server');
    if (server) {
      logger.info('Stopping new connections...');
      server.unref(); // Stop accepting new connections

      // Wait for connection draining
      await new Promise(resolve => setTimeout(resolve, config.server.drainTimeout));
      
      try {
        await Promise.race([
          new Promise((resolve) => {
            server.close(() => {
              logger.info('HTTP server closed');
              resolve();
            });
          }),
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Server close timeout')), config.server.connectionTimeout)
          )
        ]);
      } catch (err) {
        logger.warn('HTTP server close warning:', err.message);
      }
    }

    // Close database connections
    if (mongoose.connection.readyState === 1) {
      try {
        await Promise.race([
          mongoose.connection.close(),
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error('MongoDB close timeout')), config.server.databaseTimeout)
          )
        ]);
        logger.info('MongoDB connection closed');
      } catch (err) {
        logger.warn('MongoDB close warning:', err.message);
      }
    }
    
    const redis = app.get('redisClient');
    if (redis && redis.status === 'ready') {
      try {
        await Promise.race([
          redis.quit(),
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Redis close timeout')), config.server.databaseTimeout)
          )
        ]);
        logger.info('Redis connection closed');
      } catch (err) {
        logger.warn('Redis close warning:', err.message);
      }
    }

    // Clear the global shutdown timeout
    clearTimeout(shutdownTimeout);
    
    logger.info('Server shutdown complete');
    process.exit(0);
  } catch (error) {
    logger.error('Error during graceful shutdown:', error);
    process.exit(1);
  }
};

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', error);
  shutdownGracefully();
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (error) => {
  logger.error('Unhandled Rejection:', error);
  shutdownGracefully();
});

// Handle termination signals
process.on('SIGTERM', shutdownGracefully);
process.on('SIGINT', shutdownGracefully);

// Start server
initializeServer().catch((error) => {
  logger.error('Initialization error:', error);
  process.exit(1);
});

export default app;
