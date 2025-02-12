// Simple in-memory cache implementation
const cache = new Map();

export const cacheService = {
  async get(key) {
    const item = cache.get(key);
    if (!item) return null;
    
    if (item.expiry && item.expiry < Date.now()) {
      cache.delete(key);
      return null;
    }
    
    return item.value;
  },

  async set(key, value, expiryInSeconds = 300) { // Default 5 minutes
    cache.set(key, {
      value,
      expiry: Date.now() + (expiryInSeconds * 1000)
    });
  },

  async del(pattern) {
    if (pattern.endsWith('*')) {
      const prefix = pattern.slice(0, -1);
      for (const key of cache.keys()) {
        if (key.startsWith(prefix)) {
          cache.delete(key);
        }
      }
    } else {
      cache.delete(pattern);
    }
  },

  async clear() {
    cache.clear();
  }
};
