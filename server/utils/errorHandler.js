import logger from '../config/logger.js';

// Custom Error class for API errors
export class APIError extends Error {
  constructor(statusCode, message, errors = []) {
    super(message);
    this.statusCode = statusCode;
    this.errors = errors;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

// Simple error response helper
export const errorResponse = (res, statusCode, message, errors = []) => {
  return res.status(statusCode).json({
    status: `${statusCode}`.startsWith('4') ? 'fail' : 'error',
    message,
    errors
  });
};

// Error handler middleware
const errorHandler = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  // Log error
  logger.error('Error:', {
    message: err.message,
    stack: err.stack,
    statusCode: err.statusCode,
    path: req.path,
    method: req.method,
    body: req.body,
    params: req.params,
    query: req.query,
    user: req.user ? req.user.id : null
  });

  // Development error response
  if (process.env.NODE_ENV === 'development') {
    return res.status(err.statusCode).json({
      status: err.status,
      error: err,
      message: err.message,
      stack: err.stack,
      errors: err.errors
    });
  }

  // Production error response
  if (err.isOperational) {
    // Operational, trusted error: send message to client
    return res.status(err.statusCode).json({
      status: err.status,
      message: err.message,
      errors: err.errors
    });
  }

  // Programming or other unknown error: don't leak error details
  logger.error('💥 Unexpected error:', err);
  return res.status(500).json({
    status: 'error',
    message: 'Something went wrong'
  });
};

// Handle specific errors
export const handleValidationError = (err) => {
  const errors = Object.values(err.errors).map(el => el.message);
  const message = `Invalid input data. ${errors.join('. ')}`;
  return new APIError(400, message, errors);
};

export const handleDuplicateFieldsError = (err) => {
  const value = err.errmsg.match(/(["'])(\\?.)*?\1/)[0];
  const message = `Duplicate field value: ${value}. Please use another value!`;
  return new APIError(400, message);
};

export const handleCastError = (err) => {
  const message = `Invalid ${err.path}: ${err.value}`;
  return new APIError(400, message);
};

export const handleJsonWebTokenError = () => 
  new APIError(401, 'Invalid token. Please log in again.');

export const handleTokenExpiredError = () =>
  new APIError(401, 'Your token has expired. Please log in again.');

// Function to convert Mongoose validation errors to APIError
export const handleMongooseError = (err) => {
  if (err.name === 'ValidationError') return handleValidationError(err);
  if (err.code === 11000) return handleDuplicateFieldsError(err);
  if (err.name === 'CastError') return handleCastError(err);
  if (err.name === 'JsonWebTokenError') return handleJsonWebTokenError();
  if (err.name === 'TokenExpiredError') return handleTokenExpiredError();
  return err;
};

export default errorHandler;
