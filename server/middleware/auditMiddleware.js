import AuditService from '../services/auditService.js';
import logger from '../config/logger.js';

/**
 * Middleware to audit admin actions
 * @param {string} action - The action being performed
 * @param {string} targetType - The type of resource being affected
 */
export const auditAdminAction = (action, targetType) => {
  return async (req, res, next) => {
    // Store the original send method
    const originalSend = res.send;
    
    // Get the target ID from various possible sources
    const targetId = req.params.id || 
                    req.params.userId || 
                    req.params.jobId || 
                    req.params.disputeId ||
                    req.body.targetId;

    try {
      // Override the send method to capture the response
      res.send = function(data) {
        // Restore the original send method
        res.send = originalSend;

        // Extract changes from request body
        const changes = req.method !== 'GET' ? req.body : undefined;

        // Get reason from request if provided
        const reason = req.body.reason || 'No reason provided';

        // Create audit log entry
        const auditLog = {
          userId: req.user.id,
          action,
          targetType,
          targetId,
          changes,
          reason,
          ipAddress: req.ip,
          userAgent: req.get('user-agent'),
          metadata: {
            method: req.method,
            path: req.originalUrl,
            statusCode: res.statusCode
          }
        };

        // Log audit asynchronously - don't wait for it
        AuditService.logAdminAction(auditLog).catch(error => {
          logger.error('Failed to create audit log:', {
            error: error.message,
            action,
            userId: req.user.id
          });
        });

        // Call the original send method
        return originalSend.call(this, data);
      };

      // Proceed to the next middleware
      next();
    } catch (error) {
      logger.error('Audit middleware error:', {
        error: error.message,
        action,
        userId: req.user?.id
      });
      next(error);
    }
  };
};

/**
 * Higher-order middleware for auditing critical admin actions
 * Requires confirmation and logs with CRITICAL severity
 */
export const auditCriticalAction = (action, targetType) => {
  return async (req, res, next) => {
    // Verify confirmation is provided
    if (!req.body.confirmation === 'CONFIRM') {
      return res.status(400).json({
        success: false,
        error: 'Critical action requires explicit confirmation. Please add confirmation: "CONFIRM" to the request body.'
      });
    }

    // Add critical severity to the audit context
    req.auditContext = {
      ...req.auditContext,
      severity: 'CRITICAL',
      requiresReview: true
    };

    // Use the standard audit middleware
    return auditAdminAction(action, targetType)(req, res, next);
  };
};

/**
 * Middleware to enrich audit context with additional metadata
 */
export const enrichAuditContext = (enrichmentData) => {
  return (req, res, next) => {
    req.auditContext = {
      ...req.auditContext,
      ...enrichmentData
    };
    next();
  };
};

/**
 * Middleware to audit batch operations
 */
export const auditBatchAction = (action, targetType) => {
  return async (req, res, next) => {
    const originalSend = res.send;

    res.send = function(data) {
      res.send = originalSend;

      // Create audit logs for each item in the batch
      const batchAuditPromises = req.body.items.map(item => 
        AuditService.logAdminAction({
          userId: req.user.id,
          action,
          targetType,
          targetId: item.id,
          changes: item.changes,
          reason: req.body.reason,
          ipAddress: req.ip,
          userAgent: req.get('user-agent'),
          metadata: {
            batchOperation: true,
            batchId: req.body.batchId,
            method: req.method,
            path: req.originalUrl,
            statusCode: res.statusCode
          }
        })
      );

      // Log batch audits asynchronously
      Promise.all(batchAuditPromises).catch(error => {
        logger.error('Failed to create batch audit logs:', {
          error: error.message,
          action,
          userId: req.user.id,
          batchId: req.body.batchId
        });
      });

      return originalSend.call(this, data);
    };

    next();
  };
};

export default {
  auditAdminAction,
  auditCriticalAction,
  enrichAuditContext,
  auditBatchAction
};
