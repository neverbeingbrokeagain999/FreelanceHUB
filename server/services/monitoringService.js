const os = require('os');
const logger = require('../config/logger');
const redis = require('../config/redis');
const AuditLog = require('../models/AuditLog');

class MonitoringService {
  constructor() {
    this.metrics = {
      requests: {
        total: 0,
        success: 0,
        failed: 0,
        latency: []
      },
      memory: {
        history: []
      },
      cpu: {
        history: []
      },
      errors: {
        count: 0,
        recent: []
      },
      database: {
        operations: 0,
        errors: 0,
        latency: []
      }
    };

    this.config = {
      metricsRetention: 24 * 60 * 60, // 24 hours in seconds
      errorRetention: 100, // Keep last 100 errors
      samplingInterval: 60 * 1000, // 1 minute
      alertThresholds: {
        memory: 85, // Percentage
        cpu: 80, // Percentage
        errorRate: 5, // Percentage
        responseTime: 1000 // milliseconds
      }
    };

    // Start monitoring intervals
    this.startMonitoring();
  }

  /**
   * Start all monitoring intervals
   */
  startMonitoring() {
    // System metrics collection
    setInterval(() => {
      this.collectSystemMetrics();
    }, this.config.samplingInterval);

    // Metrics cleanup
    setInterval(() => {
      this.cleanupMetrics();
    }, this.config.samplingInterval * 10);
  }

  /**
   * Collect system metrics
   */
  async collectSystemMetrics() {
    try {
      // Memory usage
      const totalMemory = os.totalmem();
      const freeMemory = os.freemem();
      const usedMemory = totalMemory - freeMemory;
      const memoryUsage = (usedMemory / totalMemory) * 100;

      // CPU usage
      const cpuUsage = os.loadavg()[0] * 100 / os.cpus().length;

      // Store metrics
      const timestamp = Date.now();
      this.metrics.memory.history.push({
        timestamp,
        usage: memoryUsage,
        total: totalMemory,
        free: freeMemory
      });

      this.metrics.cpu.history.push({
        timestamp,
        usage: cpuUsage
      });

      // Check thresholds and alert if necessary
      this.checkThresholds({
        memory: memoryUsage,
        cpu: cpuUsage
      });

      // Log metrics
      logger.debug('System metrics collected', {
        memory: memoryUsage.toFixed(2) + '%',
        cpu: cpuUsage.toFixed(2) + '%'
      });

      // Store in Redis for real-time monitoring
      await redis.set('metrics:latest', {
        memory: memoryUsage,
        cpu: cpuUsage,
        timestamp
      }, 300); // 5 minutes TTL

    } catch (error) {
      logger.error('Error collecting system metrics:', error);
    }
  }

  /**
   * Track request metrics
   */
  trackRequest(req, res, startTime) {
    const duration = Date.now() - startTime;
    const success = res.statusCode < 400;

    this.metrics.requests.total++;
    if (success) {
      this.metrics.requests.success++;
    } else {
      this.metrics.requests.failed++;
    }

    this.metrics.requests.latency.push({
      timestamp: Date.now(),
      duration,
      path: req.path,
      method: req.method,
      statusCode: res.statusCode
    });

    // Check if response time exceeds threshold
    if (duration > this.config.alertThresholds.responseTime) {
      this.alertSlowResponse(req, duration);
    }

    // Log request metrics
    logger.debug('Request tracked', {
      path: req.path,
      method: req.method,
      duration,
      statusCode: res.statusCode
    });
  }

  /**
   * Track database operations
   */
  trackDBOperation(operation, collection, duration) {
    this.metrics.database.operations++;
    this.metrics.database.latency.push({
      timestamp: Date.now(),
      operation,
      collection,
      duration
    });

    logger.debug('Database operation tracked', {
      operation,
      collection,
      duration
    });
  }

  /**
   * Track errors
   */
  trackError(error, req = null) {
    this.metrics.errors.count++;
    this.metrics.errors.recent.unshift({
      timestamp: Date.now(),
      message: error.message,
      stack: error.stack,
      path: req?.path,
      method: req?.method
    });

    // Keep only recent errors
    if (this.metrics.errors.recent.length > this.config.errorRetention) {
      this.metrics.errors.recent.pop();
    }

    // Log error
    logger.error('Error tracked:', error);

    // Check error rate threshold
    this.checkErrorRate();
  }

  /**
   * Check monitoring thresholds
   */
  async checkThresholds(metrics) {
    try {
      const alerts = [];

      // Memory threshold
      if (metrics.memory > this.config.alertThresholds.memory) {
        alerts.push({
          type: 'high-memory-usage',
          value: metrics.memory,
          threshold: this.config.alertThresholds.memory
        });
      }

      // CPU threshold
      if (metrics.cpu > this.config.alertThresholds.cpu) {
        alerts.push({
          type: 'high-cpu-usage',
          value: metrics.cpu,
          threshold: this.config.alertThresholds.cpu
        });
      }

      // Log alerts
      if (alerts.length > 0) {
        await this.logAlerts(alerts);
      }

    } catch (error) {
      logger.error('Error checking thresholds:', error);
    }
  }

  /**
   * Check error rate
   */
  async checkErrorRate() {
    const total = this.metrics.requests.total;
    if (total === 0) return;

    const errorRate = (this.metrics.requests.failed / total) * 100;
    if (errorRate > this.config.alertThresholds.errorRate) {
      await this.logAlerts([{
        type: 'high-error-rate',
        value: errorRate,
        threshold: this.config.alertThresholds.errorRate
      }]);
    }
  }

  /**
   * Alert for slow responses
   */
  async alertSlowResponse(req, duration) {
    await this.logAlerts([{
      type: 'slow-response',
      value: duration,
      threshold: this.config.alertThresholds.responseTime,
      path: req.path,
      method: req.method
    }]);
  }

  /**
   * Log monitoring alerts
   */
  async logAlerts(alerts) {
    try {
      // Log to AuditLog
      await AuditLog.logUserAction({
        event: 'monitoring-alert',
        severity: 'high',
        metadata: { alerts }
      });

      // Log to application logger
      logger.warn('Monitoring alerts triggered', { alerts });

      // Store in Redis for real-time monitoring
      await redis.set('alerts:latest', {
        alerts,
        timestamp: Date.now()
      }, 3600); // 1 hour TTL

    } catch (error) {
      logger.error('Error logging alerts:', error);
    }
  }

  /**
   * Clean up old metrics
   */
  cleanupMetrics() {
    const now = Date.now();
    const retentionMs = this.config.metricsRetention * 1000;

    // Clean up memory metrics
    this.metrics.memory.history = this.metrics.memory.history.filter(
      metric => now - metric.timestamp < retentionMs
    );

    // Clean up CPU metrics
    this.metrics.cpu.history = this.metrics.cpu.history.filter(
      metric => now - metric.timestamp < retentionMs
    );

    // Clean up request latency metrics
    this.metrics.requests.latency = this.metrics.requests.latency.filter(
      metric => now - metric.timestamp < retentionMs
    );

    // Clean up database latency metrics
    this.metrics.database.latency = this.metrics.database.latency.filter(
      metric => now - metric.timestamp < retentionMs
    );

    logger.debug('Metrics cleanup completed');
  }

  /**
   * Get current metrics
   */
  getMetrics() {
    return {
      ...this.metrics,
      timestamp: Date.now()
    };
  }

  /**
   * Get system health status
   */
  async getHealthStatus() {
    try {
      // Check Redis connection
      const redisHealthy = await redis.ping();

      // Check memory usage
      const memoryUsage = (os.totalmem() - os.freemem()) / os.totalmem() * 100;

      // Check error rate
      const errorRate = this.metrics.requests.total === 0 ? 0 :
        (this.metrics.requests.failed / this.metrics.requests.total) * 100;

      const status = {
        healthy: true,
        services: {
          redis: {
            status: redisHealthy ? 'healthy' : 'unhealthy'
          },
          memory: {
            status: memoryUsage < this.config.alertThresholds.memory ? 'healthy' : 'warning',
            usage: memoryUsage
          },
          errors: {
            status: errorRate < this.config.alertThresholds.errorRate ? 'healthy' : 'warning',
            rate: errorRate
          }
        },
        timestamp: Date.now()
      };

      // Overall health is false if any service is unhealthy
      status.healthy = Object.values(status.services)
        .every(service => service.status !== 'unhealthy');

      return status;

    } catch (error) {
      logger.error('Error getting health status:', error);
      return {
        healthy: false,
        error: error.message,
        timestamp: Date.now()
      };
    }
  }
}

// Create singleton instance
const monitoringService = new MonitoringService();

module.exports = monitoringService;
