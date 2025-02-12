import * as Sentry from '@sentry/react';

export const initSentry = () => {
  if (import.meta.env.PROD) {
    Sentry.init({
      dsn: import.meta.env.VITE_SENTRY_DSN,
      integrations: [
        new Sentry.BrowserTracing(),
      ],
      // Performance Monitoring
      tracesSampleRate: 0.2,  // Capture 20% of transactions for performance monitoring
      // Session Replay
      replaysSessionSampleRate: 0.1, // Sample rate for session replays
      replaysOnErrorSampleRate: 1.0,  // Sample rate for replays when errors occur
      environment: import.meta.env.MODE,
      enabled: import.meta.env.PROD,
      beforeSend(event) {
        // Sanitize error events before sending to Sentry
        if (event.exception) {
          // Remove sensitive information
          if (event.request?.headers) {
            delete event.request.headers.Authorization;
            delete event.request.headers.Cookie;
          }
          // Remove user information except ID
          if (event.user) {
            const userId = event.user.id;
            event.user = { id: userId };
          }
        }
        return event;
      },
      beforeBreadcrumb(breadcrumb) {
        // Filter out sensitive breadcrumbs
        if (breadcrumb.category === 'xhr' || breadcrumb.category === 'fetch') {
          // Remove sensitive URL parameters
          if (breadcrumb.data?.url) {
            try {
              const url = new URL(breadcrumb.data.url);
              url.searchParams.delete('token');
              url.searchParams.delete('key');
              breadcrumb.data.url = url.toString();
            } catch (e) {
              // If URL parsing fails, remove the URL completely
              delete breadcrumb.data.url;
            }
          }
          // Remove request/response data that might contain sensitive information
          delete breadcrumb.data.request_body;
          delete breadcrumb.data.response;
        }
        return breadcrumb;
      }
    });
  }
};

export const captureException = (error, context = {}) => {
  if (import.meta.env.PROD) {
    Sentry.withScope(scope => {
      // Add additional context
      Object.entries(context).forEach(([key, value]) => {
        scope.setExtra(key, value);
      });
      Sentry.captureException(error);
    });
  } else {
    console.error('Error:', error);
    console.debug('Error Context:', context);
  }
};

export const setUserContext = (user) => {
  if (import.meta.env.PROD && user) {
    Sentry.setUser({
      id: user.id,
      role: user.roles?.[0] || 'user'
    });
  }
};

export const clearUserContext = () => {
  if (import.meta.env.PROD) {
    Sentry.setUser(null);
  }
};

export const addBreadcrumb = (breadcrumb) => {
  if (import.meta.env.PROD) {
    Sentry.addBreadcrumb({
      ...breadcrumb,
      timestamp: Date.now()
    });
  }
};

export default {
  initSentry,
  captureException,
  setUserContext,
  clearUserContext,
  addBreadcrumb
};
