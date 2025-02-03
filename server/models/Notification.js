import mongoose from 'mongoose';
import logger from '../config/logger.js';

const notificationSchema = new mongoose.Schema({
  // Recipient
  recipient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },

  // Notification Type and Category
  type: {
    type: String,
    required: true,
    enum: [
      'job_alert',
      'proposal_status',
      'contract_update',
      'payment',
      'message',
      'review',
      'milestone',
      'dispute',
      'system',
      'security'
    ]
  },
  category: {
    type: String,
    enum: [
      'success',
      'info',
      'warning',
      'error',
      'reminder',
      'promotion'
    ],
    default: 'info'
  },

  // Notification Content
  title: {
    type: String,
    required: true,
    trim: true
  },
  message: {
    type: String,
    required: true,
    trim: true
  },
  data: {
    // Dynamic data specific to notification type
    entityType: String,   // e.g., 'job', 'contract', 'proposal'
    entityId: mongoose.Schema.Types.ObjectId,
    action: String,       // e.g., 'created', 'updated', 'deleted'
    status: String,
    amount: Number,
    currency: String,
    deadline: Date,
    additionalData: mongoose.Schema.Types.Mixed
  },

  // Related Entities
  relatedEntities: [{
    type: {
      type: String,
      enum: [
        'job',
        'contract',
        'proposal',
        'payment',
        'dispute',
        'message',
        'review',
        'milestone',
        'user'
      ]
    },
    id: {
      type: mongoose.Schema.Types.ObjectId,
      refPath: 'relatedEntities.type'
    }
  }],

  // Notification Status
  status: {
    isRead: {
      type: Boolean,
      default: false
    },
    isArchived: {
      type: Boolean,
      default: false
    },
    readAt: Date,
    archivedAt: Date
  },

  // Delivery Settings
  delivery: {
    channels: [{
      type: {
        type: String,
        enum: ['in_app', 'email', 'push', 'sms'],
        required: true
      },
      status: {
        type: String,
        enum: ['pending', 'sent', 'failed'],
        default: 'pending'
      },
      sentAt: Date,
      error: String
    }],
    priority: {
      type: String,
      enum: ['low', 'normal', 'high', 'urgent'],
      default: 'normal'
    },
    scheduledFor: Date,
    expiresAt: Date,
    retryCount: {
      type: Number,
      default: 0
    },
    maxRetries: {
      type: Number,
      default: 3
    }
  },

  // Actions
  actions: [{
    label: String,
    url: String,
    type: {
      type: String,
      enum: ['link', 'button', 'action']
    },
    style: {
      type: String,
      enum: ['primary', 'secondary', 'danger']
    },
    requiresAuth: {
      type: Boolean,
      default: true
    },
    completedAt: Date
  }],

  // User Interaction
  interaction: {
    clickedAt: Date,
    clickedLink: String,
    actionTaken: String,
    deviceInfo: {
      type: String,
      platform: String,
      browser: String
    }
  },

  // Grouping
  group: {
    id: String,
    count: Number
  },

  // Metadata
  metadata: {
    source: String,
    campaign: String,
    tags: [String],
    importance: {
      type: Number,
      min: 1,
      max: 5,
      default: 3
    }
  }
}, {
  timestamps: true
});

// Indexes
notificationSchema.index({ 'recipient': 1, 'status.isRead': 1 });
notificationSchema.index({ 'recipient': 1, 'createdAt': -1 });
notificationSchema.index({ 'status.isArchived': 1 });
notificationSchema.index({ 'delivery.scheduledFor': 1 });
notificationSchema.index({ 'delivery.expiresAt': 1 });

// Pre-save middleware
notificationSchema.pre('save', function(next) {
  try {
    // Set expiry date if not set (default 30 days)
    if (!this.delivery.expiresAt) {
      this.delivery.expiresAt = new Date(
        Date.now() + 30 * 24 * 60 * 60 * 1000
      );
    }

    next();
  } catch (error) {
    logger.error('Notification pre-save error:', error);
    next(error);
  }
});

// Methods
notificationSchema.methods = {
  // Mark as read
  markAsRead: async function() {
    try {
      this.status.isRead = true;
      this.status.readAt = new Date();
      await this.save();
    } catch (error) {
      logger.error('Mark as read error:', error);
      throw error;
    }
  },

  // Archive notification
  archive: async function() {
    try {
      this.status.isArchived = true;
      this.status.archivedAt = new Date();
      await this.save();
    } catch (error) {
      logger.error('Archive notification error:', error);
      throw error;
    }
  },

  // Log delivery attempt
  logDeliveryAttempt: async function(channel, success, error = null) {
    try {
      const deliveryChannel = this.delivery.channels.find(
        c => c.type === channel
      );

      if (deliveryChannel) {
        deliveryChannel.status = success ? 'sent' : 'failed';
        deliveryChannel.sentAt = new Date();
        if (error) {
          deliveryChannel.error = error.message;
        }

        if (!success) {
          this.delivery.retryCount += 1;
        }

        await this.save();
      }
    } catch (error) {
      logger.error('Log delivery attempt error:', error);
      throw error;
    }
  },

  // Log user interaction
  logInteraction: async function(action, deviceInfo = {}) {
    try {
      this.interaction = {
        clickedAt: new Date(),
        actionTaken: action,
        deviceInfo
      };
      await this.save();
    } catch (error) {
      logger.error('Log interaction error:', error);
      throw error;
    }
  }
};

// Statics
notificationSchema.statics = {
  // Get user notifications
  getUserNotifications: async function(userId, filters = {}) {
    const query = {
      recipient: userId,
      'status.isArchived': false
    };

    if (filters.type) {
      query.type = filters.type;
    }

    if (filters.readStatus === 'unread') {
      query['status.isRead'] = false;
    } else if (filters.readStatus === 'read') {
      query['status.isRead'] = true;
    }

    if (filters.priority) {
      query['delivery.priority'] = filters.priority;
    }

    return this.find(query)
      .sort('-createdAt')
      .limit(filters.limit || 50);
  },

  // Get notification stats
  getNotificationStats: async function(userId) {
    return this.aggregate([
      { $match: { recipient: mongoose.Types.ObjectId(userId) } },
      {
        $group: {
          _id: '$type',
          total: { $sum: 1 },
          unread: {
            $sum: { $cond: [{ $eq: ['$status.isRead', false] }, 1, 0] }
          },
          highPriority: {
            $sum: {
              $cond: [
                { $eq: ['$delivery.priority', 'high'] },
                1,
                0
              ]
            }
          }
        }
      }
    ]);
  },

  // Mark all as read
  markAllAsRead: async function(userId, type = null) {
    const query = {
      recipient: userId,
      'status.isRead': false
    };

    if (type) {
      query.type = type;
    }

    return this.updateMany(query, {
      'status.isRead': true,
      'status.readAt': new Date()
    });
  }
};

const Notification = mongoose.model('Notification', notificationSchema);

export default Notification;
