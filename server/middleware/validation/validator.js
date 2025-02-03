import logger from '../../config/logger.js';

/**
 * Creates a validation middleware using a Joi schema
 * @param {Object} schema - Joi schema to validate against
 * @param {string} property - Request property to validate (body, query, params)
 * @returns {Function} Express middleware function
 */
export const validate = (schema, property = 'body') => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req[property], {
      abortEarly: false,
      stripUnknown: true,
      errors: {
        wrap: {
          label: '',
        },
      },
    });

    if (error) {
      const errorMessage = error.details
        .map((detail) => detail.message)
        .join(', ');

      logger.warn('Validation error:', {
        path: req.path,
        method: req.method,
        errors: errorMessage,
        body: property === 'body' ? req.body : undefined,
        query: property === 'query' ? req.query : undefined,
        params: property === 'params' ? req.params : undefined,
      });

      return res.status(400).json({
        message: 'Validation Error',
        errors: error.details.map((detail) => ({
          field: detail.context.key,
          message: detail.message,
        })),
      });
    }

    // Replace request data with validated data
    req[property] = value;
    next();
  };
};

/**
 * Validates request against multiple schemas
 * @param {Object} schemas - Object containing schema definitions for different parts of request
 * @returns {Function} Express middleware function
 */
export const validateRequest = (schemas) => {
  return (req, res, next) => {
    const validationPromises = Object.entries(schemas).map(([property, schema]) => {
      if (!req[property]) {
        return Promise.resolve();
      }

      const { error, value } = schema.validate(req[property], {
        abortEarly: false,
        stripUnknown: true,
        errors: {
          wrap: {
            label: '',
          },
        },
      });

      if (error) {
        return Promise.reject({
          property,
          errors: error.details.map((detail) => ({
            field: detail.context.key,
            message: detail.message,
          })),
        });
      }

      req[property] = value;
      return Promise.resolve();
    });

    Promise.all(validationPromises)
      .then(() => next())
      .catch((error) => {
        logger.warn('Validation error:', {
          path: req.path,
          method: req.method,
          errors: error,
        });

        res.status(400).json({
          message: 'Validation Error',
          errors: {
            [error.property]: error.errors,
          },
        });
      });
  };
};

/**
 * Example usage:
 * 
 * Single schema validation:
 * router.post('/users', validate(userSchemas.create), userController.create);
 * 
 * Multiple schema validation:
 * router.post('/jobs', validateRequest({
 *   body: jobSchemas.create,
 *   query: jobSchemas.filters
 * }), jobController.create);
 */

// Custom validation middleware for file uploads
export const validateFileUpload = (options = {}) => {
  const {
    maxSize = 5 * 1024 * 1024, // 5MB default
    allowedTypes = ['image/jpeg', 'image/png', 'image/gif'],
    maxFiles = 1,
  } = options;

  return (req, res, next) => {
    if (!req.files && !req.file) {
      return res.status(400).json({
        message: 'Validation Error',
        errors: [{ field: 'file', message: 'No file uploaded' }],
      });
    }

    const files = req.files || [req.file];

    if (files.length > maxFiles) {
      return res.status(400).json({
        message: 'Validation Error',
        errors: [{ field: 'file', message: `Maximum ${maxFiles} files allowed` }],
      });
    }

    const validationErrors = [];

    files.forEach((file) => {
      if (file.size > maxSize) {
        validationErrors.push({
          field: file.fieldname,
          message: `File size exceeds ${maxSize / (1024 * 1024)}MB limit`,
        });
      }

      if (!allowedTypes.includes(file.mimetype)) {
        validationErrors.push({
          field: file.fieldname,
          message: `Invalid file type. Allowed types: ${allowedTypes.join(', ')}`,
        });
      }
    });

    if (validationErrors.length > 0) {
      logger.warn('File validation error:', {
        path: req.path,
        method: req.method,
        errors: validationErrors,
      });

      return res.status(400).json({
        message: 'File Validation Error',
        errors: validationErrors,
      });
    }

    next();
  };
};

// Sanitize middleware to clean input data
export const sanitize = (schema) => {
  return (req, res, next) => {
    if (!req.body || typeof req.body !== 'object') {
      return next();
    }

    try {
      // Remove any potential XSS or injection attempts
      const sanitized = Object.keys(req.body).reduce((acc, key) => {
        if (typeof req.body[key] === 'string') {
          acc[key] = req.body[key]
            .replace(/[<>]/g, '') // Remove potential HTML tags
            .trim(); // Remove leading/trailing whitespace
        } else {
          acc[key] = req.body[key];
        }
        return acc;
      }, {});

      req.body = sanitized;
      next();
    } catch (error) {
      logger.error('Sanitization error:', error);
      next(error);
    }
  };
};
