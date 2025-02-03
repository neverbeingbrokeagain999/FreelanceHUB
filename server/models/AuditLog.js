import mongoose from 'mongoose';
import logger from '../config/logger.js';

const auditLogSchema = new mongoose.Schema({
  // Event Information
  event: {
    type: String,
    required: true,
    index: true
  },
  category: {
    type: String,
    required: true,
    enum: [
      'auth',
      'user',
      'job',
      'contract',
      'payment',
      'dispute',
      'review',
      'admin',
      'system',
      'security'
    ],
    index: true
  },
  severity: {
    type: String,
    enum: ['info', 'warning', 'error', 'critical'],
    default: 'info',
    index: true
  },

  // Actor Information
  actor: {
    userId: {
      type: mongoose.Schema.Types.Mixed,
      ref: 'User',
      required: true,
      // Can be ObjectId for user actions, 'system' for system events, or 'anonymous' for unknown users
      validate: {
        validator: function(v) {
          return mongoose.Types.ObjectId.isValid(v) || v === 'system' || v === 'anonymous';
        },
        message: 'userId must be either a valid ObjectId, "system", or "anonymous"'
      }
    },
    email: String,
    role: String,
    ip: String,
    userAgent: String,
    deviceId: String
  },

  // Target Information
  target: {
    model: String,
    documentId: mongoose.Schema.Types.ObjectId,
    collection: String,
    fields: [String],
    previousState: mongoose.Schema.Types.Mixed,
    newState: mongoose.Schema.Types.Mixed
  },

  // Action Details
  action: {
    type: String,
    enum: [
      'create',
      'read',
      'update',
      'delete',
      'login',
      'logout',
      'verify',
      'approve',
      'reject',
      'suspend',
      'restore',
      'upload',
      'download'
    ]
  },
  status: {
    type: String,
    enum: ['success', 'failure', 'pending', 'cancelled'],
    default: 'success'
  },
  description: String,

  // Location Information
  location: {
    ip: String,
    country: String,
    city: String,
    coordinates: {
      latitude: Number,
      longitude: Number
    }
  },

  // Request Details
  request: {
    method: String,
    url: String,
    params: mongoose.Schema.Types.Mixed,
    query: mongoose.Schema.Types.Mixed,
    body: mongoose.Schema.Types.Mixed,
    headers: mongoose.Schema.Types.Mixed
  },

  // Response Details
  response: {
    statusCode: Number,
    body: mongoose.Schema.Types.Mixed,
    headers: mongoose.Schema.Types.Mixed,
    error: mongoose.Schema.Types.Mixed
  },

  // Performance Metrics
  performance: {
    duration: Number,
    memoryUsage: Number,
    cpuUsage: Number
  },

  // Metadata
  metadata: {
    type: Map,
    of: mongoose.Schema.Types.Mixed
  },
  tags: [String],

  // Related Events
  relatedEvents: [{
    eventId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'AuditLog'
    },
    relationship: String
  }],

  // Error Information
  error: {
    code: String,
    message: String,
    stack: String,
    details: mongoose.Schema.Types.Mixed
  }
}, {
  timestamps: true
});

// Indexes
auditLogSchema.index({ createdAt: 1 });
auditLogSchema.index({ 'actor.userId': 1, createdAt: -1 });
auditLogSchema.index({ event: 1, category: 1 });
auditLogSchema.index({ 'target.documentId': 1 });
auditLogSchema.index({ 'location.ip': 1 });

// Methods
auditLogSchema.statics = {
  // Log user action
  logUserAction: async function(data) {
    try {
      const auditLog = new this({
        event: data.event,
        category: this.determineCategory(data.event),
        severity: data.severity || 'info',
        actor: data.actor,
        target: data.target,
        action: data.action,
        description: data.description,
        metadata: data.metadata,
        tags: data.tags
      });

      await auditLog.save();
      return auditLog;
    } catch (error) {
      logger.error('Error logging user action:', error);
      throw error;
    }
  },

  // Log system event
  logSystemEvent: async function(data) {
    try {
      const auditLog = new this({
        event: data.event,
        category: 'system',
        severity: data.severity || 'info',
        actor: {
          userId: 'system',
          role: 'system'
        },
        description: data.description,
        metadata: data.metadata,
        performance: data.performance
      });

      await auditLog.save();
      return auditLog;
    } catch (error) {
      logger.error('Error logging system event:', error);
      throw error;
    }
  },

  // Log security event
  logSecurityEvent: async function(data) {
    try {
      const auditLog = new this({
        event: data.event,
        category: 'security',
        severity: data.severity || 'warning',
        actor: data.actor,
        location: data.location,
        request: data.request,
        description: data.description,
        metadata: data.metadata
      });

      await auditLog.save();
      return auditLog;
    } catch (error) {
      logger.error('Error logging security event:', error);
      throw error;
    }
  },

  // Get audit trail for entity
  getAuditTrail: async function(entityId, options = {}) {
    const query = {
      'target.documentId': entityId
    };

    if (options.startDate) {
      query.createdAt = { $gte: options.startDate };
    }
    if (options.endDate) {
      query.createdAt = { ...query.createdAt, $lte: options.endDate };
    }
    if (options.category) {
      query.category = options.category;
    }

    return this.find(query)
      .sort({ createdAt: -1 })
      .limit(options.limit || 100)
      .populate('actor.userId', 'name email');
  },

  // Get user activity
  getUserActivity: async function(userId, options = {}) {
    const query = {
      'actor.userId': userId
    };

    if (options.startDate) {
      query.createdAt = { $gte: options.startDate };
    }
    if (options.endDate) {
      query.createdAt = { ...query.createdAt, $lte: options.endDate };
    }
    if (options.category) {
      query.category = options.category;
    }

    return this.find(query)
      .sort({ createdAt: -1 })
      .limit(options.limit || 100);
  },

  // Get security events
  getSecurityEvents: async function(options = {}) {
    const query = {
      category: 'security'
    };

    if (options.severity) {
      query.severity = options.severity;
    }
    if (options.ip) {
      query['location.ip'] = options.ip;
    }
    if (options.startDate) {
      query.createdAt = { $gte: options.startDate };
    }
    if (options.endDate) {
      query.createdAt = { ...query.createdAt, $lte: options.endDate };
    }

    return this.find(query)
      .sort({ createdAt: -1 })
      .limit(options.limit || 100);
  },

  // Get activity statistics
  getActivityStats: async function(options = {}) {
    const matchStage = {};

    if (options.startDate) {
      matchStage.createdAt = { $gte: options.startDate };
    }
    if (options.endDate) {
      matchStage.createdAt = { ...matchStage.createdAt, $lte: options.endDate };
    }

    return this.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: {
            category: '$category',
            action: '$action'
          },
          count: { $sum: 1 },
          successCount: {
            $sum: { $cond: [{ $eq: ['$status', 'success'] }, 1, 0] }
          },
          failureCount: {
            $sum: { $cond: [{ $eq: ['$status', 'failure'] }, 1, 0] }
          }
        }
      },
      {
        $group: {
          _id: '$_id.category',
          actions: {
            $push: {
              action: '$_id.action',
              count: '$count',
              successCount: '$successCount',
              failureCount: '$failureCount'
            }
          },
          totalCount: { $sum: '$count' }
        }
      }
    ]);
  },

  // Helper method to determine category from event
  determineCategory: function(event) {
    const categoryMap = {
      'user_': 'user',
      'auth_': 'auth',
      'job_': 'job',
      'contract_': 'contract',
      'payment_': 'payment',
      'dispute_': 'dispute',
      'review_': 'review',
      'admin_': 'admin',
      'system_': 'system',
      'security_': 'security'
    };

    for (const [prefix, category] of Object.entries(categoryMap)) {
      if (event.startsWith(prefix)) {
        return category;
      }
    }

    return 'system';
  }
};

export const AuditLog = mongoose.model('AuditLog', auditLogSchema);
export default AuditLog;
