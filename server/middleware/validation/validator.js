/**
 * Validation middleware factory using Joi schemas
 * @param {Object} schema - Joi validation schema object
 */
export const validate = (schema) => {
  return (req, res, next) => {
    const validationResults = {};
    const validationOptions = {
      abortEarly: false, // Include all errors
      allowUnknown: true, // Allow unknown props
      stripUnknown: true // Remove unknown props
    };

    // Validate request parts based on schema
    ['params', 'query', 'body'].forEach((key) => {
      if (schema[key]) {
        const validation = schema[key].validate(req[key], validationOptions);
        if (validation.error) {
          validationResults[key] = validation.error.details.map(detail => ({
            message: detail.message.replace(/['"]/g, ''),
            path: detail.path
          }));
        } else {
          // Replace request data with validated data
          req[key] = validation.value;
        }
      }
    });

    if (Object.keys(validationResults).length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: validationResults
      });
    }

    return next();
  };
};

/**
 * Validates query parameters for pagination
 */
export const validatePagination = (req, res, next) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;

  // Validate pagination parameters
  if (page < 1) {
    return res.status(400).json({
      success: false,
      message: 'Page number must be greater than 0'
    });
  }

  if (limit < 1 || limit > 100) {
    return res.status(400).json({
      success: false,
      message: 'Limit must be between 1 and 100'
    });
  }

  // Add validated pagination to request
  req.pagination = {
    page,
    limit,
    skip: (page - 1) * limit
  };

  next();
};

/**
 * Validates and sanitizes sort parameters
 * @param {string[]} allowedFields - Array of field names that can be sorted
 */
export const validateSort = (allowedFields) => {
  return (req, res, next) => {
    const sort = req.query.sort;
    if (!sort) {
      req.sortOptions = { createdAt: -1 }; // Default sort
      return next();
    }

    try {
      const sortFields = sort.split(',').reduce((acc, field) => {
        const order = field.startsWith('-') ? -1 : 1;
        const cleanField = field.replace(/^-/, '');

        if (!allowedFields.includes(cleanField)) {
          throw new Error(`Invalid sort field: ${cleanField}`);
        }

        acc[cleanField] = order;
        return acc;
      }, {});

      req.sortOptions = sortFields;
      next();
    } catch (error) {
      return res.status(400).json({
        success: false,
        message: error.message || 'Invalid sort parameters'
      });
    }
  };
};

export default {
  validate,
  validatePagination,
  validateSort
};
