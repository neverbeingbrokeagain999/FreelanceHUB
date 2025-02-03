import Redis from 'ioredis';
import logger from './logger.js';

class RedisClient {
  constructor() {
    this.client = null;
    this.subscriber = null;
    this.publisher = null;
    this.retryAttempts = 0;
    this.maxRetryAttempts = 5;
    this.retryDelay = 5000; // 5 seconds
  }

  async connect() {
    try {
      const redisConfig = {
        host: process.env.REDIS_HOST || 'localhost',
        port: process.env.REDIS_PORT || 6379,
        password: process.env.REDIS_PASSWORD,
        db: process.env.REDIS_DB || 0,
        retryStrategy: (times) => {
          if (times > this.maxRetryAttempts) {
            logger.error('Max Redis retry attempts reached');
            return null;
          }
          return this.retryDelay;
        },
        reconnectOnError: (err) => {
          logger.error('Redis reconnect error:', err);
          return true;
        }
      };

      // Create main client
      this.client = new Redis(redisConfig);
      
      // Create subscriber client
      this.subscriber = new Redis(redisConfig);
      
      // Create publisher client
      this.publisher = new Redis(redisConfig);

      // Set up event handlers
      this.setupEventHandlers(this.client, 'Main');
      this.setupEventHandlers(this.subscriber, 'Subscriber');
      this.setupEventHandlers(this.publisher, 'Publisher');

      logger.info('Redis clients initialized');
      return true;
    } catch (error) {
      logger.error('Redis initialization error:', error);
      throw error;
    }
  }

  setupEventHandlers(client, name) {
    client.on('connect', () => {
      logger.info(`Redis ${name} client connected`);
    });

    client.on('ready', () => {
      logger.info(`Redis ${name} client ready`);
      this.retryAttempts = 0;
    });

    client.on('error', (error) => {
      logger.error(`Redis ${name} client error:`, error);
    });

    client.on('close', () => {
      logger.warn(`Redis ${name} client closed`);
    });

    client.on('reconnecting', () => {
      this.retryAttempts++;
      logger.info(`Redis ${name} client reconnecting... Attempt ${this.retryAttempts}`);
    });

    client.on('end', () => {
      logger.warn(`Redis ${name} client ended`);
    });
  }

  async quit() {
    try {
      await Promise.all([
        this.client.quit(),
        this.subscriber.quit(),
        this.publisher.quit()
      ]);
      logger.info('Redis clients closed');
    } catch (error) {
      logger.error('Error closing Redis clients:', error);
      throw error;
    }
  }

  // Cache operations
  async get(key) {
    try {
      const value = await this.client.get(key);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      logger.error('Redis get error:', error);
      return null;
    }
  }

  async set(key, value, ttl = null) {
    try {
      const stringValue = JSON.stringify(value);
      if (ttl) {
        await this.client.set(key, stringValue, 'EX', ttl);
      } else {
        await this.client.set(key, stringValue);
      }
      return true;
    } catch (error) {
      logger.error('Redis set error:', error);
      return false;
    }
  }

  async del(key) {
    try {
      await this.client.del(key);
      return true;
    } catch (error) {
      logger.error('Redis del error:', error);
      return false;
    }
  }

  // Pub/Sub operations
  async publish(channel, message) {
    try {
      await this.publisher.publish(channel, JSON.stringify(message));
      return true;
    } catch (error) {
      logger.error('Redis publish error:', error);
      return false;
    }
  }

  async subscribe(channel, callback) {
    try {
      await this.subscriber.subscribe(channel);
      this.subscriber.on('message', (ch, message) => {
        if (ch === channel) {
          callback(JSON.parse(message));
        }
      });
      return true;
    } catch (error) {
      logger.error('Redis subscribe error:', error);
      return false;
    }
  }

  // List operations
  async lpush(key, value) {
    try {
      await this.client.lpush(key, JSON.stringify(value));
      return true;
    } catch (error) {
      logger.error('Redis lpush error:', error);
      return false;
    }
  }

  async rpop(key) {
    try {
      const value = await this.client.rpop(key);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      logger.error('Redis rpop error:', error);
      return null;
    }
  }

  // Hash operations
  async hset(key, field, value) {
    try {
      await this.client.hset(key, field, JSON.stringify(value));
      return true;
    } catch (error) {
      logger.error('Redis hset error:', error);
      return false;
    }
  }

  async hget(key, field) {
    try {
      const value = await this.client.hget(key, field);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      logger.error('Redis hget error:', error);
      return null;
    }
  }

  // Session management
  async setSession(sessionId, data, ttl = 3600) { // 1 hour default
    return this.set(`session:${sessionId}`, data, ttl);
  }

  async getSession(sessionId) {
    return this.get(`session:${sessionId}`);
  }

  async deleteSession(sessionId) {
    return this.del(`session:${sessionId}`);
  }

  // Rate limiting
  async incrementCounter(key, ttl) {
    try {
      const multi = this.client.multi();
      multi.incr(key);
      multi.expire(key, ttl);
      const results = await multi.exec();
      return results[0][1]; // Get the incremented value
    } catch (error) {
      logger.error('Redis rate limit error:', error);
      return -1;
    }
  }

  // Cache management
  async clearCache(pattern) {
    try {
      const keys = await this.client.keys(pattern);
      if (keys.length > 0) {
        await this.client.del(...keys);
        logger.info(`Cleared ${keys.length} cache keys matching pattern: ${pattern}`);
      }
      return true;
    } catch (error) {
      logger.error('Redis clear cache error:', error);
      return false;
    }
  }

  // Health check
  async ping() {
    try {
      const result = await this.client.ping();
      return result === 'PONG';
    } catch (error) {
      logger.error('Redis ping error:', error);
      return false;
    }
  }
}

// Create singleton instance
const redisClient = new RedisClient();

export { redisClient as default };
