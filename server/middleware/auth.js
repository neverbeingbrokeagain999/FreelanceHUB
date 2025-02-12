import jwt from 'jsonwebtoken';
import { errorResponse } from '../utils/errorHandler.js';
import User from '../models/User.js';
import { logger } from '../config/logger.js';
import { getConfig } from '../config/index.js';

const config = getConfig();

/**
 * Protect routes - Authentication middleware
 */
export const protect = async (req, res, next) => {
  try {
    let token;

    // Log incoming request headers
    console.log('Incoming request headers:', req.headers);
    
    // Check for token in Authorization header
    if (req.headers.authorization?.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1].trim().replace(/[\n\r]/g, '');
      console.log('Token found in Authorization header:', token);
    }
    // Check for token in cookie
    else if (req.cookies.jwt) {
      token = req.cookies.jwt.trim().replace(/[\n\r]/g, '');
      console.log('Token found in cookie:', token);
    }

    // Return error if no token
    if (!token) {
      console.log('No token found in request');
      return errorResponse(res, 401, 'Not authorized to access this route');
    }

    // Validate token format
    if (!token.match(/^[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\.[A-Za-z0-9-_]*$/)) {
      console.error('Invalid token format');
      return errorResponse(res, 401, 'Invalid token format');
    }

    // Log token parts for debugging
    const [header, payload, signature] = token.split('.');
    console.log('Token header:', Buffer.from(header, 'base64').toString());
    console.log('Token payload:', Buffer.from(payload, 'base64').toString());
    console.log('Using JWT secret:', config.jwt.secret);

    // Verify token
    let decoded;
    try {
      decoded = jwt.verify(token, config.jwt.secret);
      console.log('Token successfully decoded:', decoded);
    } catch (verifyError) {
      console.error('Token verification failed:', verifyError.message);
      return errorResponse(res, 401, `Token verification failed: ${verifyError.message}`);
    }

    // Get user from database
    const user = await User.findById(decoded.id).select('-password +roles').lean();

    // Check if user exists and is active
    if (!user) {
      return errorResponse(res, 401, 'User no longer exists');
    }
    
    if (!user.isActive) {
      return errorResponse(res, 401, 'User account is deactivated');
    }

    // Verify user has valid roles
    if (!user.roles || !Array.isArray(user.roles)) {
      console.error('Invalid role configuration for user:', user._id);
      return errorResponse(res, 401, 'Invalid user role configuration');
    }

    // Add user to request object
    req.user = {
      ...user,
      roles: [...user.roles]
    };

    console.log('User authenticated successfully:', {
      id: user._id,
      roles: user.roles
    });

    next();
  } catch (error) {
    logger.error('Auth middleware error:', error);
    return errorResponse(res, 500, 'Server error');
  }
};

/**
 * Authorize by roles - Authorization middleware
 * @param {...String} roles - Roles to check for
 */
export const authorize = (...roles) => {
  return (req, res, next) => {
    try {
      if (!req.user) {
        return errorResponse(res, 401, 'User not authenticated');
      }

      console.log('Authorizing roles:', roles);
      console.log('User roles:', req.user.roles);

      // Check if user has required role
      if (!roles.some(role => req.user.roles.includes(role))) {
        return errorResponse(
          res,
          403,
          `User role ${req.user.roles.join(', ')} is not authorized to access this route`
        );
      }

      next();
    } catch (error) {
      logger.error('Authorization middleware error:', error);
      return errorResponse(res, 500, 'Server error');
    }
  };
};

export default {
  protect,
  authorize
};
