import * as Sentry from '@sentry/node';
import { getContextLogger } from './logger.js';

const logger = getContextLogger('Sentry');

/**
 * Initialize Sentry for error tracking and monitoring
 * @param {import('express').Application} app - Express application instance
 */
export const setupSentry = (app) => {
  try {
    // Only initialize Sentry if DSN is provided
    if (!process.env.SENTRY_DSN) {
      logger.warn('Sentry DSN not found. Skipping Sentry initialization.');
      return;
    }

    // Initialize Sentry
    Sentry.init({
      dsn: process.env.SENTRY_DSN,
      environment: process.env.NODE_ENV,
      integrations: [
        // Enable HTTP calls tracing
        new Sentry.Integrations.Http({ tracing: true }),
        // Enable Express middleware tracing
        new Sentry.Integrations.Express({ app }),
        // Profiling disabled due to Windows compatibility issues
      ],
      // Only trace and profile in production
      tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 0,
      // Enable debug mode in development
      debug: process.env.NODE_ENV === 'development',
      // Configure beforeSend to sanitize error data
      beforeSend: (event, hint) => {
        // Don't send errors in development
        if (process.env.NODE_ENV === 'development') {
          return null;
        }

        // Sanitize error data
        if (event.exception) {
          // Remove sensitive data from request if present
          if (event.request) {
            delete event.request.cookies;
            delete event.request.headers['authorization'];
          }

          // Add error context
          event.tags = {
            ...event.tags,
            environment: process.env.NODE_ENV
          };
        }

        return event;
      }
    });

    // Configure request handler
    app.use(Sentry.Handlers.requestHandler());

    // Configure tracing
    app.use(Sentry.Handlers.tracingHandler());

    logger.info('Sentry initialized successfully');
  } catch (error) {
    logger.error('Error initializing Sentry:', error);
    // Continue without Sentry if initialization fails
  }
};

/**
 * Add Sentry error handler middleware
 * @param {import('express').Application} app - Express application instance
 */
export const addSentryErrorHandler = (app) => {
  // The error handler must be before any other error middleware and after all controllers
  app.use(Sentry.Handlers.errorHandler());
};

/**
 * Capture exception with Sentry
 * @param {Error} error - Error to capture
 * @param {Object} context - Additional context
 */
export const captureException = (error, context = {}) => {
  if (process.env.NODE_ENV === 'test') {
    return;
  }

  Sentry.withScope((scope) => {
    // Add additional context
    Object.entries(context).forEach(([key, value]) => {
      scope.setExtra(key, value);
    });

    // Capture exception
    Sentry.captureException(error);
  });
};

export default {
  setupSentry,
  addSentryErrorHandler,
  captureException
};
