import Joi from 'joi';

// Job action validation
export const validateJobAction = {
  params: Joi.object({
    id: Joi.string().required(),
    action: Joi.string().valid('approve', 'flag', 'remove').required()
  }),
  body: Joi.object({
    reason: Joi.when('params.action', {
      is: Joi.valid('flag', 'remove'),
      then: Joi.string().min(10).required(),
      otherwise: Joi.string().allow('')
    })
  })
};

// Batch job update validation
export const validateBatchJobUpdate = {
  body: Joi.object({
    jobIds: Joi.array().items(Joi.string()).min(1).required(),
    action: Joi.string().valid('approve', 'flag', 'remove').required(),
    reason: Joi.when('action', {
      is: Joi.valid('flag', 'remove'),
      then: Joi.string().min(10).required(),
      otherwise: Joi.string().allow('')
    })
  })
};

// Profile verification validation
export const validateProfileVerification = {
  params: Joi.object({
    profileId: Joi.string().required()
  }),
  body: Joi.object({
    action: Joi.string().valid('approve', 'reject').required(),
    reason: Joi.string().required(),
    verificationDetails: Joi.alternatives().try(
      Joi.object({
        identityVerified: Joi.boolean(),
        documentsVerified: Joi.boolean(),
        skillsVerified: Joi.boolean(),
        notes: Joi.string().allow(''),
        verificationDate: Joi.date().default(Date.now)
      }),
      Joi.allow(null)
    ).optional()
  })
};

// Review validation schemas
export const reviewSchemas = {
  create: Joi.object({
    rating: Joi.number().min(1).max(5).required(),
    comment: Joi.string().min(10).max(1000).required(),
    target: Joi.string().pattern(/^[0-9a-fA-F]{24}$/).required(),
    type: Joi.string().valid('client', 'freelancer', 'job').required()
  }),
  update: Joi.object({
    rating: Joi.number().min(1).max(5),
    comment: Joi.string().min(10).max(1000)
  }).min(1)
};

// Dispute resolution validation
export const validateDisputeResolution = {
  params: Joi.object({
    disputeId: Joi.string().required()
  }),
  body: Joi.object({
    resolution: Joi.string().valid('refund', 'split', 'dismiss').required(),
    reason: Joi.string().min(10).required(),
    splitRatio: Joi.when('resolution', {
      is: 'split',
      then: Joi.object({
        client: Joi.number().min(0).max(100).required(),
        freelancer: Joi.number().min(0).max(100).required()
      }).custom((value, helpers) => {
        if (value.client + value.freelancer !== 100) {
          return helpers.error('Split ratio must total 100%');
        }
        return value;
      }),
      otherwise: Joi.forbidden()
    }),
    refundAmount: Joi.when('resolution', {
      is: 'refund',
      then: Joi.number().min(0).required(),
      otherwise: Joi.forbidden()
    })
  })
};

// Admin settings validation
export const validateAdminSettings = {
  body: Joi.object({
    general: Joi.object({
      siteName: Joi.string().min(1).max(100),
      supportEmail: Joi.string().email(),
      maintenanceMode: Joi.boolean(),
      allowRegistration: Joi.boolean()
    }),
    security: Joi.object({
      maxLoginAttempts: Joi.number().integer().min(1).max(10),
      passwordMinLength: Joi.number().integer().min(8).max(32),
      requireEmailVerification: Joi.boolean(),
      twoFactorEnabled: Joi.boolean()
    }),
    jobs: Joi.object({
      autoApproveJobs: Joi.boolean(),
      minJobBudget: Joi.number().min(0),
      maxJobBudget: Joi.number().min(0),
      allowedCategories: Joi.array().items(Joi.string())
    }),
    payments: Joi.object({
      minimumWithdrawal: Joi.number().min(0),
      platformFee: Joi.number().min(0).max(100),
      paymentMethods: Joi.array().items(Joi.string())
    }),
    notifications: Joi.object({
      emailNotifications: Joi.boolean(),
      pushNotifications: Joi.boolean(),
      notificationTypes: Joi.array().items(Joi.string())
    })
  }).min(1)
};

// Report generation validation
export const validateReportGeneration = {
  body: Joi.object({
    type: Joi.string().valid(
      'jobs',
      'users',
      'payments',
      'disputes',
      'audit-logs'
    ).required(),
    dateRange: Joi.object({
      start: Joi.date().required(),
      end: Joi.date().min(Joi.ref('start')).required()
    }),
    format: Joi.string().valid('csv', 'pdf', 'xlsx').required(),
    filters: Joi.object({
      status: Joi.array().items(Joi.string()),
      category: Joi.array().items(Joi.string()),
      minAmount: Joi.number().min(0),
      maxAmount: Joi.number().min(0)
    })
  })
};

// Job list filters validation
export const validateJobFilters = {
  query: Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(10),
    search: Joi.string().allow(''),
    status: Joi.string().valid('all', 'pending', 'active', 'completed', 'flagged'),
    category: Joi.string(),
    minBudget: Joi.number().min(0),
    maxBudget: Joi.number().min(0),
    sortBy: Joi.string().valid('createdAt', 'budget', 'title'),
    sortOrder: Joi.string().valid('asc', 'desc').default('desc'),
    clientId: Joi.string(),
    freelancerId: Joi.string()
  })
};

// Profile list filters validation
export const validateProfileFilters = {
  query: Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(10),
    search: Joi.string().allow(''),
    status: Joi.string().valid('all', 'pending', 'approved', 'rejected'),
    type: Joi.string().valid('all', 'freelancer', 'client'),
    skills: Joi.array().items(Joi.string()),
    sortBy: Joi.string().valid('createdAt', 'name', 'status'),
    sortOrder: Joi.string().valid('asc', 'desc').default('desc')
  })
};

// Dispute list filters validation
export const validateDisputeFilters = {
  query: Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(10),
    search: Joi.string().allow(''),
    status: Joi.string().valid('all', 'open', 'resolved', 'closed'),
    type: Joi.string().valid('all', 'payment', 'quality', 'communication'),
    minAmount: Joi.number().min(0),
    maxAmount: Joi.number().min(0),
    sortBy: Joi.string().valid('createdAt', 'amount', 'status'),
    sortOrder: Joi.string().valid('asc', 'desc').default('desc')
  })
};

export default {
  validateJobAction,
  validateBatchJobUpdate,
  validateProfileVerification,
  validateDisputeResolution,
  validateAdminSettings,
  validateReportGeneration,
  validateJobFilters,
  validateProfileFilters,
  validateDisputeFilters,
  reviewSchemas
};
