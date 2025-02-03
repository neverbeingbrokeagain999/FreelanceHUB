const Sentry = require('@sentry/node');
const { ProfilingIntegration } = require('@sentry/profiling-node');
const logger = require('./logger');

class SentryService {
  constructor() {
    this.initialized = false;
  }

  /**
   * Initialize Sentry
   */
  init() {
    try {
      if (!process.env.SENTRY_DSN) {
        logger.warn('Sentry DSN not provided, skipping initialization');
        return;
      }

      Sentry.init({
        dsn: process.env.SENTRY_DSN,
        environment: process.env.NODE_ENV,
        integrations: [
          new Sentry.Integrations.Http({ tracing: true }),
          new Sentry.Integrations.Express({ app: true }),
          new ProfilingIntegration(),
        ],
        tracesSampleRate: this.getTracesSampleRate(),
        profilesSampleRate: this.getProfilesSampleRate(),
        
        // Configure error filtering
        beforeSend: (event, hint) => {
          return this.filterError(event, hint);
        },

        // Configure breadcrumbs
        maxBreadcrumbs: 50,
        beforeBreadcrumb: (breadcrumb, hint) => {
          return this.filterBreadcrumb(breadcrumb, hint);
        },

        // Performance monitoring
        enableTracing: true,
        autoSessionTracking: true,

        // Release tracking
        release: process.env.APP_VERSION || '1.0.0',

        // Additional configuration
        serverName: process.env.SERVER_NAME || 'unknown',
        attachStacktrace: true,
        normalizeDepth: 10,
        autoSessionTracking: true,
        
        // Custom tags
        initialScope: {
          tags: {
            nodeVersion: process.version,
            platform: process.platform
          }
        }
      });

      this.initialized = true;
      logger.info('Sentry initialized successfully');

    } catch (error) {
      logger.error('Error initializing Sentry:', error);
    }
  }

  /**
   * Get traces sample rate based on environment
   */
  getTracesSampleRate() {
    switch (process.env.NODE_ENV) {
      case 'production':
        return 0.1; // Sample 10% of transactions in production
      case 'staging':
        return 0.3; // Sample 30% in staging
      default:
        return 1.0; // Sample all transactions in development
    }
  }

  /**
   * Get profiles sample rate based on environment
   */
  getProfilesSampleRate() {
    switch (process.env.NODE_ENV) {
      case 'production':
        return 0.05; // Sample 5% of transactions in production
      case 'staging':
        return 0.2; // Sample 20% in staging
      default:
        return 1.0; // Sample all transactions in development
    }
  }

  /**
   * Filter errors before sending to Sentry
   */
  filterError(event, hint) {
    // Don't send errors in development unless explicitly enabled
    if (process.env.NODE_ENV === 'development' && !process.env.SENTRY_ENABLE_DEV) {
      return null;
    }

    const error = hint?.originalException;

    // Ignore specific error types
    if (error?.name === 'ValidationError') {
      return null;
    }

    // Sanitize sensitive data
    if (event.request?.data) {
      event.request.data = this.sanitizeData(event.request.data);
    }

    // Add additional context
    event.extra = {
      ...event.extra,
      nodeVersion: process.version,
      platform: process.platform
    };

    return event;
  }

  /**
   * Filter breadcrumbs before adding them
   */
  filterBreadcrumb(breadcrumb, hint) {
    // Skip certain breadcrumb types
    if (breadcrumb.category === 'http' && breadcrumb.data?.url) {
      // Skip health check endpoints
      if (breadcrumb.data.url.includes('/health')) {
        return null;
      }

      // Sanitize URLs
      breadcrumb.data.url = this.sanitizeUrl(breadcrumb.data.url);
    }

    return breadcrumb;
  }

  /**
   * Sanitize sensitive data
   */
  sanitizeData(data) {
    if (!data) return data;

    const sensitiveFields = [
      'password',
      'token',
      'auth',
      'authorization',
      'secret',
      'key',
      'apiKey',
      'credit_card'
    ];

    if (typeof data === 'object') {
      const sanitized = { ...data };
      for (const key of Object.keys(sanitized)) {
        if (sensitiveFields.some(field => key.toLowerCase().includes(field))) {
          sanitized[key] = '[REDACTED]';
        } else if (typeof sanitized[key] === 'object') {
          sanitized[key] = this.sanitizeData(sanitized[key]);
        }
      }
      return sanitized;
    }

    return data;
  }

  /**
   * Sanitize URLs to remove sensitive information
   */
  sanitizeUrl(url) {
    try {
      const urlObject = new URL(url);
      // Remove sensitive query parameters
      const sensitiveParams = ['token', 'key', 'secret', 'password'];
      sensitiveParams.forEach(param => {
        if (urlObject.searchParams.has(param)) {
          urlObject.searchParams.set(param, '[REDACTED]');
        }
      });
      return urlObject.toString();
    } catch (error) {
      return url;
    }
  }

  /**
   * Capture error with additional context
   */
  captureError(error, context = {}) {
    if (!this.initialized) {
      logger.error('Sentry not initialized:', error);
      return;
    }

    Sentry.withScope(scope => {
      // Add additional context
      if (context.user) {
        scope.setUser(context.user);
      }
      if (context.tags) {
        scope.setTags(context.tags);
      }
      if (context.level) {
        scope.setLevel(context.level);
      }
      if (context.extra) {
        scope.setExtras(context.extra);
      }

      // Capture error
      Sentry.captureException(error);
    });
  }

  /**
   * Start transaction
   */
  startTransaction(context) {
    if (!this.initialized) return null;

    return Sentry.startTransaction({
      name: context.name,
      op: context.op,
      tags: context.tags
    });
  }

  /**
   * Set user context
   */
  setUser(user) {
    if (!this.initialized) return;

    Sentry.setUser({
      id: user.id,
      email: user.email,
      role: user.role,
      ip_address: user.ip
    });
  }

  /**
   * Clear user context
   */
  clearUser() {
    if (!this.initialized) return;

    Sentry.setUser(null);
  }

  /**
   * Create Express middleware
   */
  createMiddleware() {
    return [
      Sentry.Handlers.requestHandler({
        ip: true,
        user: ['id', 'email', 'role']
      }),
      Sentry.Handlers.tracingHandler(),
      this.errorHandler.bind(this)
    ];
  }

  /**
   * Error handler middleware
   */
  errorHandler(error, req, res, next) {
    // Skip if Sentry is not initialized
    if (!this.initialized) {
      return next(error);
    }

    const transaction = Sentry.getCurrentHub()?.getScope()?.getTransaction();
    if (transaction) {
      transaction.setHttpStatus(error.status || 500);
      transaction.setTag('error', 'true');
      transaction.setData('error', {
        name: error.name,
        message: error.message,
        stack: error.stack
      });
    }

    return Sentry.Handlers.errorHandler()(error, req, res, next);
  }
}

// Create singleton instance
const sentryService = new SentryService();

module.exports = sentryService;
