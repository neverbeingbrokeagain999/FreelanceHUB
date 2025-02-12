import express from 'express';
import { protect } from '../middleware/auth.js';
import { requireAdmin, requireAll } from '../middleware/roles.js';
import { auditAdminAction, auditCriticalAction, auditBatchAction } from '../middleware/auditMiddleware.js';
import rateLimit from '../middleware/rateLimit.js';
import * as adminController from '../controllers/adminController.js';
import { validate } from '../middleware/validation/validator.js';
import { adminValidationSchemas } from '../middleware/validation/schemas/adminValidation.js';
import logger from '../config/logger.js';

const router = express.Router();

// Protect all admin routes with authentication and admin role check
router.use(protect);
router.use(requireAdmin);

// Add rate limiting for admin endpoints
const adminRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many admin requests from this IP, please try again later'
});

router.use(adminRateLimit);

// Log all admin route access
router.use((req, res, next) => {
  logger.info('Admin route accessed:', {
    userId: req.user.id,
    method: req.method,
    path: req.originalUrl,
    timestamp: new Date().toISOString()
  });
  next();
});

// Dashboard analytics
router.get('/dashboard/analytics',
  auditAdminAction('DASHBOARD_ACCESS', 'SYSTEM'),
  adminController.getDashboardAnalytics
);

// User management
router.get('/users',
  validate(adminValidationSchemas.listUsers),
  auditAdminAction('USER_LIST_VIEW', 'USER'),
  adminController.listUsers
);

router.get('/users/:userId',
  validate(adminValidationSchemas.getUser),
  auditAdminAction('USER_DETAILS_VIEW', 'USER'),
  adminController.getUser
);

router.patch('/users/:userId/status',
  validate(adminValidationSchemas.updateUserStatus),
  auditAdminAction('USER_STATUS_CHANGE', 'USER'),
  adminController.updateUserStatus
);

router.patch('/users/:userId/roles',
  validate(adminValidationSchemas.updateUserRoles),
  auditCriticalAction('USER_ROLE_CHANGE', 'USER'),
  adminController.updateUserRoles
);

// Job management
router.get('/jobs',
  validate(adminValidationSchemas.listJobs),
  auditAdminAction('JOB_LIST_VIEW', 'JOB'),
  adminController.listJobs
);

router.get('/jobs/:jobId',
  validate(adminValidationSchemas.getJob),
  auditAdminAction('JOB_DETAILS_VIEW', 'JOB'),
  adminController.getJob
);

router.patch('/jobs/:jobId/status',
  validate(adminValidationSchemas.updateJobStatus),
  auditAdminAction('JOB_STATUS_CHANGE', 'JOB'),
  adminController.updateJobStatus
);

// Batch job operations
router.post('/jobs/batch/status',
  validate(adminValidationSchemas.batchUpdateJobStatus),
  auditBatchAction('JOB_STATUS_BATCH_UPDATE', 'JOB'),
  adminController.batchUpdateJobStatus
);

// Dispute management
router.get('/disputes',
  validate(adminValidationSchemas.listDisputes),
  auditAdminAction('DISPUTE_LIST_VIEW', 'DISPUTE'),
  adminController.listDisputes
);

router.get('/disputes/:disputeId',
  validate(adminValidationSchemas.getDispute),
  auditAdminAction('DISPUTE_DETAILS_VIEW', 'DISPUTE'),
  adminController.getDispute
);

router.post('/disputes/:disputeId/resolve',
  validate(adminValidationSchemas.resolveDispute),
  auditAdminAction('DISPUTE_RESOLVE', 'DISPUTE'),
  adminController.resolveDispute
);

// Profile verification
router.get('/verify-profiles',
  validate(adminValidationSchemas.listPendingVerifications),
  auditAdminAction('VERIFICATION_LIST_VIEW', 'PROFILE'),
  adminController.listPendingVerifications
);

router.post('/verify-profiles/:userId/approve',
  validate(adminValidationSchemas.approveVerification),
  auditAdminAction('PROFILE_VERIFY', 'PROFILE'),
  adminController.approveVerification
);

router.post('/verify-profiles/:userId/reject',
  validate(adminValidationSchemas.rejectVerification),
  auditAdminAction('PROFILE_REJECT', 'PROFILE'),
  adminController.rejectVerification
);

// System configuration - Critical actions
router.get('/config',
  auditAdminAction('SYSTEM_CONFIG_VIEW', 'SYSTEM'),
  adminController.getSystemConfig
);

router.patch('/config',
  validate(adminValidationSchemas.updateSystemConfig),
  auditCriticalAction('SYSTEM_CONFIG_UPDATE', 'SYSTEM'),
  adminController.updateSystemConfig
);

// Audit logs
router.get('/audit-logs',
  validate(adminValidationSchemas.listAuditLogs),
  auditAdminAction('AUDIT_LOG_VIEW', 'SYSTEM'),
  adminController.listAuditLogs
);

router.post('/audit-logs/:logId/review',
  validate(adminValidationSchemas.reviewAuditLog),
  auditAdminAction('AUDIT_LOG_REVIEW', 'SYSTEM'),
  adminController.reviewAuditLog
);

// Reports
router.get('/reports/revenue',
  validate(adminValidationSchemas.getRevenueReport),
  auditAdminAction('REVENUE_REPORT_VIEW', 'SYSTEM'),
  adminController.getRevenueReport
);

router.get('/reports/user-activity',
  validate(adminValidationSchemas.getUserActivityReport),
  auditAdminAction('USER_ACTIVITY_REPORT_VIEW', 'SYSTEM'),
  adminController.getUserActivityReport
);

// Error handling middleware for admin routes
router.use((err, req, res, next) => {
  logger.error('Admin route error:', {
    error: err.message,
    userId: req.user?.id,
    path: req.originalUrl,
    stack: err.stack
  });

  if (!err.statusCode) err.statusCode = 500;
  
  res.status(err.statusCode).json({
    success: false,
    error: err.message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

export default router;
