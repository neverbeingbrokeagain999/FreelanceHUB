import Joi from 'joi';

export const adminValidationSchemas = {
  // User Management Schemas
  listUsers: {
    query: Joi.object({
      page: Joi.number().integer().min(1).default(1),
      limit: Joi.number().integer().min(1).max(100).default(10),
      search: Joi.string().trim().allow(''),
      role: Joi.string().valid('admin', 'client', 'freelancer'),
      status: Joi.string().valid('active', 'inactive', 'suspended'),
      sortBy: Joi.string().valid('createdAt', 'email', 'name', 'status'),
      sortOrder: Joi.string().valid('asc', 'desc').default('desc')
    })
  },

  getUser: {
    params: Joi.object({
      userId: Joi.string().required().regex(/^[0-9a-fA-F]{24}$/)
    })
  },

  updateUserStatus: {
    params: Joi.object({
      userId: Joi.string().required().regex(/^[0-9a-fA-F]{24}$/)
    }),
    body: Joi.object({
      status: Joi.string().required().valid('active', 'inactive', 'suspended'),
      reason: Joi.string().when('status', {
        is: 'suspended',
        then: Joi.string().required().min(10),
        otherwise: Joi.string().optional()
      })
    })
  },

  updateUserRoles: {
    params: Joi.object({
      userId: Joi.string().required().regex(/^[0-9a-fA-F]{24}$/)
    }),
    body: Joi.object({
      roles: Joi.array()
        .items(Joi.string().valid('admin', 'client', 'freelancer'))
        .min(1)
        .unique()
        .required(),
      reason: Joi.string().required().min(10)
    })
  },

  // Job Management Schemas
  listJobs: {
    query: Joi.object({
      page: Joi.number().integer().min(1).default(1),
      limit: Joi.number().integer().min(1).max(100).default(10),
      status: Joi.string().valid('active', 'completed', 'cancelled', 'disputed'),
      search: Joi.string().trim().allow(''),
      sortBy: Joi.string().valid('createdAt', 'title', 'budget', 'status'),
      sortOrder: Joi.string().valid('asc', 'desc').default('desc'),
      clientId: Joi.string().regex(/^[0-9a-fA-F]{24}$/),
      freelancerId: Joi.string().regex(/^[0-9a-fA-F]{24}$/)
    })
  },

  getJob: {
    params: Joi.object({
      jobId: Joi.string().required().regex(/^[0-9a-fA-F]{24}$/)
    })
  },

  updateJobStatus: {
    params: Joi.object({
      jobId: Joi.string().required().regex(/^[0-9a-fA-F]{24}$/)
    }),
    body: Joi.object({
      status: Joi.string().required().valid('active', 'completed', 'cancelled'),
      reason: Joi.string().required().min(10)
    })
  },

  // Dispute Management Schemas
  listDisputes: {
    query: Joi.object({
      page: Joi.number().integer().min(1).default(1),
      limit: Joi.number().integer().min(1).max(100).default(10),
      status: Joi.string().valid('open', 'resolved', 'escalated'),
      priority: Joi.string().valid('low', 'medium', 'high'),
      sortBy: Joi.string().valid('createdAt', 'status', 'priority'),
      sortOrder: Joi.string().valid('asc', 'desc').default('desc')
    })
  },

  getDispute: {
    params: Joi.object({
      disputeId: Joi.string().required().regex(/^[0-9a-fA-F]{24}$/)
    })
  },

  resolveDispute: {
    params: Joi.object({
      disputeId: Joi.string().required().regex(/^[0-9a-fA-F]{24}$/)
    }),
    body: Joi.object({
      resolution: Joi.string().required().min(20),
      winningParty: Joi.string().required().valid('client', 'freelancer'),
      refundAmount: Joi.number().min(0),
      penaltyAmount: Joi.number().min(0),
      notes: Joi.string().min(10)
    })
  },

  // Profile Verification Schemas
  listPendingVerifications: {
    query: Joi.object({
      page: Joi.number().integer().min(1).default(1),
      limit: Joi.number().integer().min(1).max(100).default(10),
      userType: Joi.string().valid('client', 'freelancer'),
      sortBy: Joi.string().valid('createdAt', 'updatedAt'),
      sortOrder: Joi.string().valid('asc', 'desc').default('desc')
    })
  },

  approveVerification: {
    params: Joi.object({
      userId: Joi.string().required().regex(/^[0-9a-fA-F]{24}$/)
    }),
    body: Joi.object({
      notes: Joi.string()
    })
  },

  rejectVerification: {
    params: Joi.object({
      userId: Joi.string().required().regex(/^[0-9a-fA-F]{24}$/)
    }),
    body: Joi.object({
      reason: Joi.string().required().min(10),
      notes: Joi.string()
    })
  },

  // System Configuration Schemas
  updateSystemConfig: {
    body: Joi.object({
      settings: Joi.object({
        maintenanceMode: Joi.boolean(),
        userRegistration: Joi.boolean(),
        jobPosting: Joi.boolean(),
        maxFileSize: Joi.number().integer().min(1),
        allowedFileTypes: Joi.array().items(Joi.string()),
        autoApproveProfiles: Joi.boolean(),
        minimumWithdrawalAmount: Joi.number().min(0),
        platformFee: Joi.number().min(0).max(100),
        disputeTimeout: Joi.number().integer().min(1)
      }).required()
    })
  },

  // Audit Log Schemas
  listAuditLogs: {
    query: Joi.object({
      page: Joi.number().integer().min(1).default(1),
      limit: Joi.number().integer().min(1).max(100).default(10),
      userId: Joi.string().regex(/^[0-9a-fA-F]{24}$/),
      action: Joi.string(),
      startDate: Joi.date().iso(),
      endDate: Joi.date().iso().min(Joi.ref('startDate')),
      sortOrder: Joi.string().valid('asc', 'desc').default('desc')
    })
  },

  // Report Schemas
  getRevenueReport: {
    query: Joi.object({
      startDate: Joi.date().iso().required(),
      endDate: Joi.date().iso().min(Joi.ref('startDate')).required(),
      interval: Joi.string().valid('daily', 'weekly', 'monthly').default('monthly')
    })
  },

  getUserActivityReport: {
    query: Joi.object({
      startDate: Joi.date().iso().required(),
      endDate: Joi.date().iso().min(Joi.ref('startDate')).required(),
      userType: Joi.string().valid('client', 'freelancer'),
      activityType: Joi.string().valid('login', 'job_post', 'proposal', 'message')
    })
  }
};

export default adminValidationSchemas;
