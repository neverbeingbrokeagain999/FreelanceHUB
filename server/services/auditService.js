import AuditLog from '../models/AuditLog.js';
import logger from '../config/logger.js';

/**
 * Service to handle audit logging across the application
 */
class AuditService {
  /**
   * Log an admin action
   * @param {Object} params - Logging parameters
   * @param {string} params.userId - ID of the user performing the action
   * @param {string} params.action - Action being performed
   * @param {string} params.targetType - Type of resource being affected
   * @param {string} params.targetId - ID of resource being affected
   * @param {Object} params.changes - Changes made to the resource
   * @param {string} params.reason - Reason for the action
   * @param {string} params.ipAddress - IP address of the user
   * @param {string} params.userAgent - User agent string
   */
  static async logAdminAction(params) {
    const {
      userId,
      action,
      targetType,
      targetId,
      changes,
      reason,
      ipAddress,
      userAgent
    } = params;

    try {
      const auditLog = await AuditLog.create({
        userId,
        action,
        targetType,
        targetId,
        changes,
        reason,
        metadata: {
          ipAddress,
          userAgent,
          timestamp: new Date()
        }
      });

      logger.info('Admin action logged:', {
        auditLogId: auditLog._id,
        userId,
        action,
        targetType,
        targetId
      });

      return auditLog;
    } catch (error) {
      logger.error('Failed to log admin action:', {
        error: error.message,
        userId,
        action,
        targetType,
        targetId
      });
      throw error;
    }
  }

  /**
   * Get audit logs with filtering and pagination
   * @param {Object} filters - Search filters
   * @param {Object} options - Pagination and sorting options
   */
  static async getAuditLogs(filters = {}, options = {}) {
    const {
      userId,
      action,
      targetType,
      targetId,
      startDate,
      endDate
    } = filters;

    const {
      page = 1,
      limit = 10,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = options;

    try {
      const query = {};

      if (userId) query.userId = userId;
      if (action) query.action = action;
      if (targetType) query.targetType = targetType;
      if (targetId) query.targetId = targetId;

      if (startDate || endDate) {
        query.createdAt = {};
        if (startDate) query.createdAt.$gte = new Date(startDate);
        if (endDate) query.createdAt.$lte = new Date(endDate);
      }

      const [logs, total] = await Promise.all([
        AuditLog.find(query)
          .sort({ [sortBy]: sortOrder === 'desc' ? -1 : 1 })
          .skip((page - 1) * limit)
          .limit(limit)
          .populate('userId', 'name email roles')
          .lean(),
        AuditLog.countDocuments(query)
      ]);

      return {
        logs,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      };
    } catch (error) {
      logger.error('Failed to retrieve audit logs:', error);
      throw error;
    }
  }

  /**
   * Get audit trail for a specific resource
   * @param {string} targetType - Type of resource
   * @param {string} targetId - ID of resource
   */
  static async getAuditTrail(targetType, targetId) {
    try {
      const trail = await AuditLog.find({ targetType, targetId })
        .sort({ createdAt: -1 })
        .populate('userId', 'name email roles')
        .lean();

      return trail;
    } catch (error) {
      logger.error('Failed to retrieve audit trail:', {
        error: error.message,
        targetType,
        targetId
      });
      throw error;
    }
  }

  /**
   * Get recent admin activities
   * @param {number} limit - Number of activities to return
   */
  static async getRecentActivities(limit = 10) {
    try {
      const activities = await AuditLog.find()
        .sort({ createdAt: -1 })
        .limit(limit)
        .populate('userId', 'name email roles')
        .lean();

      return activities;
    } catch (error) {
      logger.error('Failed to retrieve recent activities:', error);
      throw error;
    }
  }

  /**
   * Get activity summary for a user
   * @param {string} userId - User ID
   * @param {Object} options - Options for summary
   */
  static async getUserActivitySummary(userId, options = {}) {
    const { startDate, endDate } = options;

    try {
      const query = { userId };
      if (startDate || endDate) {
        query.createdAt = {};
        if (startDate) query.createdAt.$gte = new Date(startDate);
        if (endDate) query.createdAt.$lte = new Date(endDate);
      }

      const activities = await AuditLog.aggregate([
        { $match: query },
        {
          $group: {
            _id: '$action',
            count: { $sum: 1 },
            lastActivity: { $max: '$createdAt' }
          }
        },
        { $sort: { count: -1 } }
      ]);

      return activities;
    } catch (error) {
      logger.error('Failed to retrieve user activity summary:', {
        error: error.message,
        userId
      });
      throw error;
    }
  }
}

export default AuditService;
