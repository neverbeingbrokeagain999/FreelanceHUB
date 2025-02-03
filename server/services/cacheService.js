import redis from '../config/redis.js';
import logger from '../config/logger.js';

class CacheService {
  constructor() {
    this.defaultTTL = 3600; // 1 hour
    this.keyPrefix = 'cache:';
  }

  /**
   * Generate cache key
   */
  createKey(type, identifier) {
    return `${this.keyPrefix}${type}:${identifier}`;
  }

  /**
   * Get data from cache
   */
  async get(type, identifier) {
    const key = this.createKey(type, identifier);
    try {
      const data = await redis.get(key);
      if (data) {
        logger.debug('Cache hit', { type, identifier });
        return data;
      }
      logger.debug('Cache miss', { type, identifier });
      return null;
    } catch (error) {
      logger.error('Cache get error:', error);
      return null;
    }
  }

  /**
   * Set data in cache
   */
  async set(type, identifier, data, ttl = this.defaultTTL) {
    const key = this.createKey(type, identifier);
    try {
      await redis.set(key, data, ttl);
      logger.debug('Cache set', { type, identifier, ttl });
      return true;
    } catch (error) {
      logger.error('Cache set error:', error);
      return false;
    }
  }

  /**
   * Delete data from cache
   */
  async delete(type, identifier) {
    const key = this.createKey(type, identifier);
    try {
      await redis.del(key);
      logger.debug('Cache delete', { type, identifier });
      return true;
    } catch (error) {
      logger.error('Cache delete error:', error);
      return false;
    }
  }

  /**
   * Clear cache by pattern
   */
  async clear(pattern) {
    try {
      await redis.clearCache(`${this.keyPrefix}${pattern}*`);
      logger.info('Cache cleared', { pattern });
      return true;
    } catch (error) {
      logger.error('Cache clear error:', error);
      return false;
    }
  }

  /**
   * Cache wrapper for async functions
   */
  async wrapper(type, identifier, callback, ttl = this.defaultTTL) {
    try {
      // Try to get from cache first
      const cached = await this.get(type, identifier);
      if (cached) {
        return cached;
      }

      // If not in cache, execute callback
      const data = await callback();
      
      // Store in cache
      await this.set(type, identifier, data, ttl);
      
      return data;
    } catch (error) {
      logger.error('Cache wrapper error:', error);
      // If cache fails, just execute callback
      return callback();
    }
  }

  /**
   * Cached query wrapper for mongoose
   */
  async queryWrapper(type, identifier, query, ttl = this.defaultTTL) {
    return this.wrapper(
      type,
      identifier,
      async () => query.exec(),
      ttl
    );
  }

  /**
   * Cache user data
   */
  async cacheUser(userId, userData, ttl = 3600) {
    return this.set('user', userId, userData, ttl);
  }

  /**
   * Get cached user data
   */
  async getCachedUser(userId) {
    return this.get('user', userId);
  }

  /**
   * Cache job data
   */
  async cacheJob(jobId, jobData, ttl = 3600) {
    return this.set('job', jobId, jobData, ttl);
  }

  /**
   * Get cached job data
   */
  async getCachedJob(jobId) {
    return this.get('job', jobId);
  }

  /**
   * Cache profile data
   */
  async cacheProfile(profileId, profileData, ttl = 3600) {
    return this.set('profile', profileId, profileData, ttl);
  }

  /**
   * Get cached profile data
   */
  async getCachedProfile(profileId) {
    return this.get('profile', profileId);
  }

  /**
   * Cache search results
   */
  async cacheSearchResults(searchKey, results, ttl = 1800) { // 30 minutes
    return this.set('search', searchKey, results, ttl);
  }

  /**
   * Get cached search results
   */
  async getCachedSearchResults(searchKey) {
    return this.get('search', searchKey);
  }

  /**
   * Cache API response
   */
  async cacheAPIResponse(endpoint, response, ttl = 300) { // 5 minutes
    return this.set('api', endpoint, response, ttl);
  }

  /**
   * Get cached API response
   */
  async getCachedAPIResponse(endpoint) {
    return this.get('api', endpoint);
  }

  /**
   * Cache aggregate results
   */
  async cacheAggregateResults(key, results, ttl = 3600) {
    return this.set('aggregate', key, results, ttl);
  }

  /**
   * Get cached aggregate results
   */
  async getCachedAggregateResults(key) {
    return this.get('aggregate', key);
  }

  /**
   * Invalidate user-related caches
   */
  async invalidateUserCaches(userId) {
    try {
      await Promise.all([
        this.delete('user', userId),
        this.clear(`profile:${userId}`),
        this.clear(`job:user:${userId}`),
        this.clear(`search:user:${userId}`)
      ]);
      return true;
    } catch (error) {
      logger.error('Cache invalidation error:', error);
      return false;
    }
  }

  /**
   * Invalidate job-related caches
   */
  async invalidateJobCaches(jobId) {
    try {
      await Promise.all([
        this.delete('job', jobId),
        this.clear(`search:job`),
        this.clear(`aggregate:job`)
      ]);
      return true;
    } catch (error) {
      logger.error('Cache invalidation error:', error);
      return false;
    }
  }

  /**
   * Batch get items from cache
   */
  async mget(type, identifiers) {
    try {
      const keys = identifiers.map(id => this.createKey(type, id));
      const values = await redis.client.mget(keys);
      return values.map(v => v ? JSON.parse(v) : null);
    } catch (error) {
      logger.error('Cache mget error:', error);
      return new Array(identifiers.length).fill(null);
    }
  }

  /**
   * Batch set items in cache
   */
  async mset(type, items, ttl = this.defaultTTL) {
    try {
      const multi = redis.client.multi();
      items.forEach(({ id, data }) => {
        const key = this.createKey(type, id);
        multi.set(key, JSON.stringify(data), 'EX', ttl);
      });
      await multi.exec();
      return true;
    } catch (error) {
      logger.error('Cache mset error:', error);
      return false;
    }
  }
}

// Create singleton instance
const cacheService = new CacheService();

export { cacheService };
