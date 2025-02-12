import mongoose from 'mongoose';

const auditLogSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  
  action: {
    type: String,
    required: true,
    index: true,
    enum: [
      // User management actions
      'USER_CREATE',
      'USER_UPDATE',
      'USER_DELETE',
      'USER_STATUS_CHANGE',
      'USER_ROLE_CHANGE',
      'USER_VERIFICATION',
      
      // Job management actions
      'JOB_STATUS_CHANGE',
      'JOB_DELETE',
      'JOB_REVIEW',
      
      // Profile management actions
      'PROFILE_VERIFY',
      'PROFILE_REJECT',
      'PROFILE_SUSPEND',
      
      // Payment and financial actions
      'PAYMENT_APPROVE',
      'PAYMENT_REJECT',
      'REFUND_ISSUE',
      'WITHDRAWAL_APPROVE',
      
      // Dispute management actions
      'DISPUTE_RESOLVE',
      'DISPUTE_ESCALATE',
      'DISPUTE_CLOSE',
      
      // System actions
      'SYSTEM_CONFIG_UPDATE',
      'FEATURE_TOGGLE',
      'MAINTENANCE_MODE',
      
      // Security actions
      'LOGIN_ATTEMPT',
      'PASSWORD_RESET',
      'ACCOUNT_LOCK',
      'API_KEY_GENERATE',
      
      // Content management actions
      'CONTENT_CREATE',
      'CONTENT_UPDATE',
      'CONTENT_DELETE',
      'CONTENT_PUBLISH'
    ]
  },

  targetType: {
    type: String,
    required: true,
    index: true,
    enum: [
      'USER',
      'JOB',
      'PROFILE',
      'PAYMENT',
      'DISPUTE',
      'SYSTEM',
      'CONTENT',
      'SECURITY'
    ]
  },

  targetId: {
    type: mongoose.Schema.Types.ObjectId,
    required: false,
    index: true
  },

  changes: {
    type: mongoose.Schema.Types.Mixed,
    required: false
  },

  reason: {
    type: String,
    required: false,
    trim: true,
    maxLength: 1000
  },

  status: {
    type: String,
    enum: ['SUCCESS', 'FAILURE', 'PENDING'],
    default: 'SUCCESS',
    index: true
  },

  metadata: {
    ipAddress: {
      type: String,
      required: true
    },
    userAgent: {
      type: String,
      required: true
    },
    timestamp: {
      type: Date,
      required: true,
      default: Date.now
    },
    location: {
      type: String,
      required: false
    },
    details: mongoose.Schema.Types.Mixed
  },

  severity: {
    type: String,
    enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'],
    default: 'LOW',
    index: true
  },
  
  isReviewed: {
    type: Boolean,
    default: false,
    index: true
  },

  reviewedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false
  },

  reviewNotes: {
    type: String,
    required: false
  }
}, {
  timestamps: true
});

// Indexes
auditLogSchema.index({ createdAt: 1 });
auditLogSchema.index({ action: 1, targetType: 1 });
auditLogSchema.index({ userId: 1, createdAt: -1 });
auditLogSchema.index({ targetType: 1, targetId: 1 });

// Methods
auditLogSchema.methods.markAsReviewed = async function(reviewerId, notes) {
  this.isReviewed = true;
  this.reviewedBy = reviewerId;
  this.reviewNotes = notes;
  await this.save();
};

// Virtual for formatted timestamp
auditLogSchema.virtual('formattedTimestamp').get(function() {
  return this.metadata.timestamp.toISOString();
});

// Ensure virtuals are included in JSON output
auditLogSchema.set('toJSON', { virtuals: true });
auditLogSchema.set('toObject', { virtuals: true });

// Pre-save middleware for automatic severity assignment
auditLogSchema.pre('save', function(next) {
  // Set severity based on action type if not explicitly set
  if (!this.severity) {
    const criticalActions = [
      'USER_DELETE',
      'SYSTEM_CONFIG_UPDATE',
      'MAINTENANCE_MODE',
      'ACCOUNT_LOCK'
    ];
    
    const highSeverityActions = [
      'USER_ROLE_CHANGE',
      'PROFILE_SUSPEND',
      'PAYMENT_APPROVE',
      'DISPUTE_RESOLVE'
    ];

    const mediumSeverityActions = [
      'USER_STATUS_CHANGE',
      'JOB_STATUS_CHANGE',
      'PROFILE_VERIFY',
      'CONTENT_PUBLISH'
    ];

    if (criticalActions.includes(this.action)) {
      this.severity = 'CRITICAL';
    } else if (highSeverityActions.includes(this.action)) {
      this.severity = 'HIGH';
    } else if (mediumSeverityActions.includes(this.action)) {
      this.severity = 'MEDIUM';
    } else {
      this.severity = 'LOW';
    }
  }
  next();
});

// Static method for getting activity summary
auditLogSchema.statics.getActivitySummary = async function(startDate, endDate) {
  return this.aggregate([
    {
      $match: {
        'metadata.timestamp': {
          $gte: startDate,
          $lte: endDate
        }
      }
    },
    {
      $group: {
        _id: {
          action: '$action',
          targetType: '$targetType',
          severity: '$severity'
        },
        count: { $sum: 1 }
      }
    },
    {
      $sort: {
        'count': -1
      }
    }
  ]);
};

const AuditLog = mongoose.model('AuditLog', auditLogSchema);

export default AuditLog;
