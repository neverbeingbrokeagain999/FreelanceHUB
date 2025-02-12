import { errorResponse } from '../utils/errorHandler.js';

/**
 * Rate limiting middleware
 * @param {number} limit - Number of requests allowed
 * @param {number} windowMs - Time window in milliseconds
 */
export const checkRateLimit = (limit, windowMs) => {
  const requests = new Map();

  return (req, res, next) => {
    const userId = req.user?.id || req.ip;
    const now = Date.now();
    const userRequests = requests.get(userId) || [];

    // Remove requests outside the time window
    const validRequests = userRequests.filter(
      timestamp => now - timestamp < windowMs
    );

    if (validRequests.length >= limit) {
      return errorResponse(res, 429, 'Too many requests. Please try again later.');
    }

    validRequests.push(now);
    requests.set(userId, validRequests);

    next();
  };
};

export default { checkRateLimit };
