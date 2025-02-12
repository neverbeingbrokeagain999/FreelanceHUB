import { ForbiddenError } from '../utils/errorHandler.js';
import logger from '../config/logger.js';

/**
 * Validate user roles against required roles
 * @param {string[]} requiredRoles - Array of required roles
 * @param {string[]} userRoles - Array of user roles
 * @returns {boolean}
 */
const validateRoles = (requiredRoles, userRoles) => {
  if (!Array.isArray(userRoles) || !Array.isArray(requiredRoles)) {
    return false;
  }
  const normalizedUserRoles = userRoles.map(role => role.toLowerCase());
  const normalizedRequiredRoles = requiredRoles.map(role => role.toLowerCase());
  return normalizedRequiredRoles.some(role => normalizedUserRoles.includes(role));
};

/**
 * Middleware to check if user has admin role
 */
export const requireAdmin = (req, res, next) => {
  try {
    if (!req.user) {
      logger.warn('Admin access attempt without authentication');
      throw new ForbiddenError('Authentication required for admin access');
    }

    if (!validateRoles(['admin'], req.user.roles)) {
      logger.warn('Unauthorized admin access attempt', {
        userId: req.user.id,
        roles: req.user.roles,
        path: req.originalUrl
      });
      throw new ForbiddenError('Admin privileges required');
    }
    
    logger.info('Admin access granted', {
      userId: req.user.id,
      path: req.originalUrl
    });
    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Middleware to check if user has moderator role
 */
export const requireModerator = (req, res, next) => {
  try {
    if (!req.user) {
      throw new ForbiddenError('Authentication required for moderator access');
    }

    if (!validateRoles(['admin', 'moderator'], req.user.roles)) {
      logger.warn('Unauthorized moderator access attempt', {
        userId: req.user.id,
        roles: req.user.roles,
        path: req.originalUrl
      });
      throw new ForbiddenError('Moderator privileges required');
    }

    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Check if user has specific role(s)
 * @param {string|string[]} roles - Role or array of roles to check
 */
export const requireRole = (roles) => {
  const roleArray = Array.isArray(roles) ? roles : [roles];
  
  return (req, res, next) => {
    try {
      if (!req.user) {
        throw new ForbiddenError('Authentication required');
      }

      if (!validateRoles(roleArray, req.user.roles)) {
        logger.warn('Unauthorized role access attempt', {
          userId: req.user.id,
          requiredRoles: roleArray,
          userRoles: req.user.roles,
          path: req.originalUrl
        });
        throw new ForbiddenError(`Required role(s): ${roleArray.join(', ')}`);
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};

/**
 * Check if user is owner of resource
 * @param {string} userIdPath - Path to user ID in request object (e.g., 'params.userId')
 */
export const requireOwnership = (userIdPath) => {
  return (req, res, next) => {
    try {
      const targetUserId = userIdPath.split('.').reduce((obj, path) => obj?.[path], req);
      
      if (!targetUserId || targetUserId !== req.user.id) {
        logger.warn('Unauthorized resource access attempt', {
          userId: req.user.id,
          targetUserId,
          path: req.originalUrl
        });
        throw new ForbiddenError('Resource ownership required');
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};

/**
 * Check if user has sufficient permissions for a specific action
 * @param {(req) => boolean} checkFn - Function to check permissions
 * @param {string} message - Error message if check fails
 */
export const requirePermission = (checkFn, message = 'Insufficient permissions') => {
  return (req, res, next) => {
    try {
      if (!checkFn(req)) {
        logger.warn('Permission check failed', {
          userId: req.user?.id,
          path: req.originalUrl,
          message
        });
        throw new ForbiddenError(message);
      }
      next();
    } catch (error) {
      next(error);
    }
  };
};

/**
 * Check if user can access client features
 */
export const requireClient = (req, res, next) => {
  try {
    if (!validateRoles(['client'], req.user?.roles)) {
      throw new ForbiddenError('Client access required');
    }
    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Check if user can access freelancer features
 */
export const requireFreelancer = (req, res, next) => {
  try {
    if (!validateRoles(['freelancer'], req.user?.roles)) {
      throw new ForbiddenError('Freelancer access required');
    }
    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Check if user can access either client or freelancer features
 */
export const requireClientOrFreelancer = (req, res, next) => {
  try {
    if (!validateRoles(['client', 'freelancer'], req.user?.roles)) {
      throw new ForbiddenError('Client or freelancer access required');
    }
    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Combine multiple role requirements
 * @param {Array<Function>} middlewares - Array of role middleware functions
 */
export const requireAll = (middlewares) => {
  return (req, res, next) => {
    const executeMiddleware = (index) => {
      if (index === middlewares.length) {
        return next();
      }

      middlewares[index](req, res, (err) => {
        if (err) return next(err);
        executeMiddleware(index + 1);
      });
    };

    executeMiddleware(0);
  };
};

export default {
  requireAdmin,
  requireModerator,
  requireRole,
  requireOwnership,
  requirePermission,
  requireClient,
  requireFreelancer,
  requireClientOrFreelancer,
  requireAll
};
