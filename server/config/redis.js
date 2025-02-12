import Redis from 'ioredis';
import { logger } from './logger.js';

class MockRedisClient {
  constructor() {
    this.status = 'ready';
    this.store = new Map();
  }

  async get(key) { return this.store.get(key); }
  async set(key, value) { this.store.set(key, value); }
  async del(key) { this.store.delete(key); }
  on() { return this; }
  quit() { return Promise.resolve(); }
}

const redisConfig = {
  url: process.env.REDIS_URL || 'redis://localhost:6379',
  retryStrategy: (times) => {
    if (times > 5) return null;
    return Math.min(times * 100, 3000);
  },
  maxRetriesPerRequest: 3,
};

let redis = null;

export const initRedis = () => {
  return new Promise((resolve) => {
    try {
      if (redis && redis.status === 'ready') {
        logger.info('Reusing existing Redis connection');
        return resolve(redis);
      }

      if (process.env.NODE_ENV === 'development') {
        logger.warn('Using mock Redis client for development');
        redis = new MockRedisClient();
        return resolve(redis);
      }

      redis = new Redis(redisConfig);

      redis.on('connect', () => {
        logger.info('Redis connected successfully');
        resolve(redis);
      });

      redis.on('error', (error) => {
        logger.error('Redis connection error:', error);
        if (process.env.NODE_ENV === 'development') {
          logger.warn('Falling back to mock Redis client');
          redis = new MockRedisClient();
          resolve(redis);
        }
      });

      redis.on('close', () => {
        logger.warn('Redis connection closed');
        if (process.env.NODE_ENV !== 'development') {
          redis = null;
        }
      });

      // Add timeout for initial connection
      setTimeout(() => {
        if (redis.status !== 'ready' && process.env.NODE_ENV === 'development') {
          logger.warn('Redis connection timeout, using mock client');
          redis = new MockRedisClient();
          resolve(redis);
        }
      }, 5000);

    } catch (error) {
      logger.error('Redis initialization error:', error);
      if (process.env.NODE_ENV === 'development') {
        logger.warn('Using mock Redis client due to initialization error');
        redis = new MockRedisClient();
        resolve(redis);
      } else {
        throw error;
      }
    }
  });
};

export const getRedisClient = () => {
  if (!redis) {
    redis = new MockRedisClient();
  }
  return redis;
};

export default {
  initRedis,
  getRedisClient,
};
