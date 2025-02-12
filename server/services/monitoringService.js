import { getContextLogger } from '../config/logger.js';
import { captureException } from '../config/sentry.js';

const logger = getContextLogger('MonitoringService');

/**
 * Memory usage metrics
 * @returns {Object} Memory usage stats
 */
const getMemoryUsage = () => {
  const memory = process.memoryUsage();
  return {
    heapTotal: Math.round(memory.heapTotal / 1024 / 1024), // MB
    heapUsed: Math.round(memory.heapUsed / 1024 / 1024), // MB
    rss: Math.round(memory.rss / 1024 / 1024), // MB
    external: Math.round(memory.external / 1024 / 1024), // MB
    percentUsed: Math.round((memory.heapUsed / memory.heapTotal) * 100)
  };
};

/**
 * CPU usage metrics
 * @returns {Object} CPU usage stats
 */
const getCPUUsage = () => {
  const cpus = require('os').cpus();
  const usage = process.cpuUsage();
  return {
    numCPUs: cpus.length,
    model: cpus[0].model,
    speed: cpus[0].speed,
    userTime: Math.round(usage.user / 1000000), // convert to seconds
    systemTime: Math.round(usage.system / 1000000) // convert to seconds
  };
};

/**
 * System metrics
 * @returns {Object} System stats
 */
const getSystemMetrics = () => {
  const os = require('os');
  return {
    platform: os.platform(),
    arch: os.arch(),
    totalMemory: Math.round(os.totalmem() / 1024 / 1024), // MB
    freeMemory: Math.round(os.freemem() / 1024 / 1024), // MB
    uptime: Math.round(os.uptime()), // seconds
    loadAvg: os.loadavg()
  };
};

/**
 * Process metrics
 * @returns {Object} Process stats
 */
const getProcessMetrics = () => {
  return {
    pid: process.pid,
    uptime: Math.round(process.uptime()), // seconds
    nodeVersion: process.version,
    numConnections: process._getActiveHandles().length,
    numRequests: process._getActiveRequests().length
  };
};

/**
 * MongoDB metrics
 * @param {import('mongoose').Connection} db - Mongoose connection
 * @returns {Object} MongoDB stats
 */
const getMongoDBMetrics = async (db) => {
  try {
    const stats = await db.db.command({ serverStatus: 1 });
    return {
      connections: stats.connections,
      opcounters: stats.opcounters,
      mem: stats.mem,
      wiredTiger: stats.wiredTiger?.cache
    };
  } catch (error) {
    logger.error('Failed to get MongoDB metrics:', error);
    return null;
  }
};

/**
 * Redis metrics
 * @param {import('redis').RedisClient} redisClient - Redis client
 * @returns {Object} Redis stats
 */
const getRedisMetrics = async (redisClient) => {
  try {
    const info = await redisClient.info();
    return {
      connectedClients: info.connected_clients,
      usedMemory: info.used_memory,
      totalCommands: info.total_commands_processed,
      keyspace: info.keyspace
    };
  } catch (error) {
    logger.error('Failed to get Redis metrics:', error);
    return null;
  }
};

/**
 * Custom metrics registry
 */
class MetricsRegistry {
  constructor() {
    this.metrics = new Map();
  }

  /**
   * Increment a counter metric
   * @param {string} name - Metric name
   * @param {number} [value=1] - Value to increment by
   * @param {Object} [tags={}] - Metric tags
   */
  incrementCounter(name, value = 1, tags = {}) {
    const key = this.getMetricKey(name, tags);
    const currentValue = this.metrics.get(key)?.value || 0;
    this.metrics.set(key, {
      type: 'counter',
      value: currentValue + value,
      tags
    });
  }

  /**
   * Record a gauge metric
   * @param {string} name - Metric name
   * @param {number} value - Current value
   * @param {Object} [tags={}] - Metric tags
   */
  setGauge(name, value, tags = {}) {
    const key = this.getMetricKey(name, tags);
    this.metrics.set(key, {
      type: 'gauge',
      value,
      tags
    });
  }

  /**
   * Record a histogram value
   * @param {string} name - Metric name
   * @param {number} value - Value to record
   * @param {Object} [tags={}] - Metric tags
   */
  recordHistogram(name, value, tags = {}) {
    const key = this.getMetricKey(name, tags);
    const current = this.metrics.get(key) || {
      type: 'histogram',
      count: 0,
      sum: 0,
      min: value,
      max: value,
      tags
    };

    current.count++;
    current.sum += value;
    current.min = Math.min(current.min, value);
    current.max = Math.max(current.max, value);
    this.metrics.set(key, current);
  }

  /**
   * Get all metrics
   * @returns {Array<Object>} All recorded metrics
   */
  getMetrics() {
    return Array.from(this.metrics.entries()).map(([key, metric]) => ({
      name: this.getMetricName(key),
      ...metric
    }));
  }

  /**
   * Clear all metrics
   */
  clear() {
    this.metrics.clear();
  }

  /**
   * Get metric key combining name and tags
   * @private
   */
  getMetricKey(name, tags) {
    const tagString = Object.entries(tags)
      .sort()
      .map(([k, v]) => `${k}:${v}`)
      .join(',');
    return tagString ? `${name}#${tagString}` : name;
  }

  /**
   * Get metric name from key
   * @private
   */
  getMetricName(key) {
    return key.split('#')[0];
  }
}

// Create a global metrics registry
export const metrics = new MetricsRegistry();

/**
 * Get all monitoring metrics
 * @param {Object} params - Parameters
 * @param {import('mongoose').Connection} params.db - Mongoose connection
 * @param {import('redis').RedisClient} params.redisClient - Redis client
 * @returns {Promise<Object>} All metrics
 */
export const getAllMetrics = async ({ db, redisClient } = {}) => {
  try {
    const [mongoMetrics, redisMetrics] = await Promise.all([
      db ? getMongoDBMetrics(db) : null,
      redisClient ? getRedisMetrics(redisClient) : null
    ]);

    return {
      timestamp: new Date().toISOString(),
      memory: getMemoryUsage(),
      cpu: getCPUUsage(),
      system: getSystemMetrics(),
      process: getProcessMetrics(),
      mongodb: mongoMetrics,
      redis: redisMetrics,
      custom: metrics.getMetrics()
    };
  } catch (error) {
    logger.error('Failed to get monitoring metrics:', error);
    captureException(error, { tags: { service: 'monitoring' } });
    throw error;
  }
};

export default {
  metrics,
  getAllMetrics
};
