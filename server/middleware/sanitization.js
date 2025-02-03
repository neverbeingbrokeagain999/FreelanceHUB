import createDOMPurify from 'dompurify';
import { JSDOM } from 'jsdom';
import { APIError } from '../utils/errorHandler.js';

const window = new JSDOM('').window;
const DOMPurify = createDOMPurify(window);

/**
 * Sanitize strings in an object recursively
 * @param {Object} obj - Object to sanitize
 * @returns {Object} Sanitized object
 */
const sanitizeObject = (obj) => {
  if (typeof obj !== 'object' || obj === null) {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map(item => sanitizeObject(item));
  }

  const sanitized = {};
  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === 'string') {
      sanitized[key] = DOMPurify.sanitize(value, {
        ALLOWED_TAGS: [], // Strip all HTML tags
        ALLOWED_ATTR: [], // Strip all attributes
      }).trim();
    } else if (typeof value === 'object' && value !== null) {
      sanitized[key] = sanitizeObject(value);
    } else {
      sanitized[key] = value;
    }
  }
  return sanitized;
};

/**
 * Middleware to sanitize request body, query params, and URL params
 */
export const sanitizeRequest = (req, res, next) => {
  try {
    // Sanitize body
    if (req.body) {
      req.body = sanitizeObject(req.body);
    }

    // Sanitize query parameters
    if (req.query) {
      req.query = sanitizeObject(req.query);
    }

    // Sanitize URL parameters
    if (req.params) {
      req.params = sanitizeObject(req.params);
    }

    next();
  } catch (error) {
    next(new APIError('Error sanitizing request', 400));
  }
};

/**
 * Middleware to validate and sanitize file uploads
 */
export const sanitizeFileUploads = () => {
  return (req, res, next) => {
    if (!req.files && !req.file) {
      return next();
    }

    const allowedMimeTypes = [
      'image/jpeg',
      'image/png',
      'image/gif',
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ];

    const maxSize = 5 * 1024 * 1024; // 5MB

    try {
      const files = req.files || [req.file];

      for (const file of files) {
        // Check file type
        if (!allowedMimeTypes.includes(file.mimetype)) {
          throw new APIError('Invalid file type', 400);
        }

        // Check file size
        if (file.size > maxSize) {
          throw new APIError('File too large', 400);
        }

        // Sanitize filename
        file.originalname = DOMPurify.sanitize(file.originalname)
          .replace(/[^a-zA-Z0-9.-]/g, '_'); // Replace special chars with underscore
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};

/**
 * Middleware to validate and sanitize MongoDB IDs
 */
export const sanitizeMongoId = (req, res, next) => {
  try {
    const mongoIdPattern = /^[0-9a-fA-F]{24}$/;
    
    // Check IDs in params
    for (const [key, value] of Object.entries(req.params)) {
      if (key.toLowerCase().includes('id') && !mongoIdPattern.test(value)) {
        throw new APIError(`Invalid ${key}`, 400);
      }
    }

    // Check IDs in query
    for (const [key, value] of Object.entries(req.query)) {
      if (key.toLowerCase().includes('id') && !mongoIdPattern.test(value)) {
        throw new APIError(`Invalid ${key}`, 400);
      }
    }

    // Check IDs in body
    for (const [key, value] of Object.entries(req.body)) {
      if (key.toLowerCase().includes('id') && !mongoIdPattern.test(value)) {
        throw new APIError(`Invalid ${key}`, 400);
      }
    }

    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Middleware to prevent SQL injection attempts
 */
export const preventSQLInjection = (req, res, next) => {
  const sqlPatterns = [
    /(\%27)|(\')|(\-\-)|(\%23)|(#)/i,
    /((\%3D)|(=))[^\n]*((\%27)|(\')|(\-\-)|(\%3B)|(;))/i,
    /\w*((\%27)|(\'))((\%6F)|o|(\%4F))((\%72)|r|(\%52))/i,
    /((\%27)|(\'))union/i
  ];

  const checkValue = (value) => {
    if (typeof value === 'string') {
      for (const pattern of sqlPatterns) {
        if (pattern.test(value)) {
          throw new APIError('Invalid input detected', 400);
        }
      }
    } else if (typeof value === 'object' && value !== null) {
      Object.values(value).forEach(checkValue);
    }
  };

  try {
    checkValue(req.body);
    checkValue(req.query);
    checkValue(req.params);
    next();
  } catch (error) {
    next(error);
  }
};
