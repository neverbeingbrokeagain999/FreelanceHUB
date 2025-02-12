import { captureException } from '../config/sentry';

/**
 * Format error message for display
 * @param {Error|Object|string} error - Error to format
 * @returns {string} Formatted error message
 */
export const formatErrorMessage = (error) => {
  if (!error) return 'An unknown error occurred';
  
  if (typeof error === 'string') return error;

  if (error.response?.data?.message) {
    return error.response.data.message;
  }

  return error.message || error.toString();
};

/**
 * Format validation errors into array
 * @param {Object|Array|string} errors - Validation errors
 * @returns {Array} Array of error messages
 */
export const formatValidationErrors = (errors) => {
  if (!errors) return [];
  
  if (Array.isArray(errors)) return errors;
  
  if (typeof errors === 'string') return [errors];
  
  return Object.values(errors).flat();
};

/**
 * Handle API errors
 * @param {Error} error - Error object
 * @param {Object} context - Error context
 * @param {Function} onError - Optional error callback
 * @returns {string} Formatted error message
 */
export const handleApiError = (error, context = {}, onError) => {
  if (process.env.NODE_ENV === 'production') {
    captureException(error, {
      ...context,
      errorType: 'api_error'
    });
  } else {
    console.error('API Error:', error);
  }

  const message = formatErrorMessage(error);
  
  if (onError && typeof onError === 'function') {
    onError(message, error);
  }

  return message;
};

/**
 * Create error with context
 * @param {string} message - Error message
 * @param {Object} context - Error context
 * @returns {Error} Error object with context
 */
export const createError = (message, context = {}) => {
  const error = new Error(message);
  error.context = context;
  return error;
};

/**
 * Handle component errors
 * @param {Error} error - Error object
 * @param {Object} context - Error context
 * @param {Function} retry - Retry function
 * @returns {Object} Error details
 */
export const handleComponentError = (error, context = {}, retry) => {
  if (process.env.NODE_ENV === 'production') {
    captureException(error, {
      ...context,
      errorType: getErrorType(error),
      componentError: true
    });
  } else {
    console.error('Component Error:', error);
  }

  return {
    message: formatErrorMessage(error),
    type: getErrorType(error),
    canRetry: Boolean(retry),
    retry: retry || (() => {})
  };
};

/**
 * Generic error handler that routes to appropriate handler
 * @param {Error} error - Error object
 * @param {Object} context - Error context
 * @param {Object} options - Handler options
 */
export const handleError = (error, context = {}, options = {}) => {
  const { onError, retry, isComponent } = options;

  if (isComponent) {
    return handleComponentError(error, context, retry);
  }

  return handleApiError(error, context, onError);
};

/**
 * Check if error is a network error
 * @param {Error} error - Error to check
 * @returns {boolean} True if network error
 */
export const isNetworkError = (error) => {
  return error?.code === 'NETWORK_ERROR' || !navigator.onLine;
};

/**
 * Check if error is an API error
 * @param {Error} error - Error to check
 * @returns {boolean} True if API error
 */
export const isApiError = (error) => {
  return Boolean(error?.response?.data);
};

/**
 * Check if error is a validation error
 * @param {Error} error - Error to check
 * @returns {boolean} True if validation error
 */
export const isValidationError = (error) => {
  return error?.response?.status === 422;
};

/**
 * Get error HTTP status code
 * @param {Error} error - Error object
 * @returns {number|null} HTTP status code
 */
export const getErrorStatusCode = (error) => {
  return error?.response?.status || null;
};

/**
 * Get error type
 * @param {Error} error - Error object
 * @returns {string} Error type
 */
export const getErrorType = (error) => {
  if (isNetworkError(error)) return 'network_error';
  if (isValidationError(error)) return 'validation_error';
  if (isApiError(error)) return 'api_error';
  return 'unknown_error';
};

export default {
  formatErrorMessage,
  formatValidationErrors,
  handleApiError,
  createError,
  handleComponentError,
  handleError,
  isNetworkError,
  isApiError,
  isValidationError,
  getErrorStatusCode,
  getErrorType
};
