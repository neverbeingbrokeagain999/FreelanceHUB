import jwt from 'jsonwebtoken';
import rateLimit from 'express-rate-limit';
import { errorResponse } from '../utils/errorHandler.js';
import { User } from '../models/User.js';
import testConfig from '../config/test.js';

export const protect = async (req, res, next) => {
  try {
    let token;

    if (req.headers.authorization?.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return errorResponse(res, 401, 'No token, authorization denied');
    }

    try {
      const secret = process.env.JWT_SECRET || 'test-jwt-secret-key-123'; // Fallback for tests
      const decoded = jwt.verify(token, secret);
      const user = await User.findById(decoded.id).select('-password');

      if (!user) {
        return errorResponse(res, 401, 'User not found');
      }

      // Check token version
      if (decoded.tokenVersion !== user.tokenVersion) {
        return errorResponse(res, 401, 'Token is invalid');
      }

      req.user = {
        ...user.toObject(),
        id: user._id // Ensure both id and _id are available
      };
      next();
    } catch (error) {
      return errorResponse(res, 401, 'Token is invalid');
    }
  } catch (error) {
    return errorResponse(res, 500, 'Server Error');
  }
};

export const authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return errorResponse(
        res, 
        403, 
        `User role ${req.user.role} is not authorized to access this route`
      );
    }
    next();
  };
};

export const requireEmailVerification = (req, res, next) => {
  if (!req.user.emailVerified) {
    return errorResponse(res, 403, 'Email verification required');
  }
  next();
};

// Higher-order function for chaining multiple middleware
export const authChain = (...middleware) => {
  return async (req, res, next) => {
    try {
      for (let mw of middleware) {
        await new Promise((resolve, reject) => {
          mw(req, res, (err) => {
            if (err) reject(err);
            resolve();
          });
        });
      }
      next();
    } catch (error) {
      next(error);
    }
  };
};

export const checkRateLimit = (maxRequests, windowMs) => {
  // Skip rate limiting in test environment
  if (process.env.NODE_ENV === 'test') {
    return (req, res, next) => next();
  }

  return rateLimit({
    windowMs,
    max: 1500,
    message: {
      status: 'error',
      message: 'Too many requests, please try again later'
    }
  });
};
