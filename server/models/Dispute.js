import mongoose from 'mongoose';
import logger from '../config/logger.js';

const disputeSchema = new mongoose.Schema({
  // Parties Involved
  initiator: {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    role: {
      type: String,
      enum: ['client', 'freelancer'],
      required: true
    }
  },
  respondent: {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    role: {
      type: String,
      enum: ['client', 'freelancer'],
      required: true
    }
  },

  // Related Entities
  job: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Job'
  },
  contract: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'DirectContract'
  },
  milestone: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Job.milestones'
  },
  transaction: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Transaction'
  },

  // Dispute Details
  type: {
    type: String,
    required: true,
    enum: [
      'payment',
      'delivery',
      'quality',
      'communication',
      'scope',
      'cancellation',
      'refund',
      'other'
    ]
  },
  subType: String,
  status: {
    type: String,
    enum: [
      'opened',
      'under_review',
      'evidence_needed',
      'mediation',
      'resolved',
      'cancelled',
      'escalated'
    ],
    default: 'opened'
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },

  // Financial Details
  amount: {
    disputed: Number,
    currency: {
      type: String,
      default: 'USD'
    },
    holdAmount: Boolean
  },

  // Dispute Content
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200
  },
  description: {
    type: String,
    required: true,
    trim: true,
    maxlength: 5000
  },
  desiredOutcome: {
    type: String,
    required: true,
    trim: true,
    maxlength: 1000
  },

  // Evidence and Documentation
  evidence: [{
    type: {
      type: String,
      enum: [
        'message',
        'file',
        'screenshot',
        'contract',
        'payment_proof',
        'delivery_proof',
        'other'
      ]
    },
    title: String,
    description: String,
    url: String,
    fileType: String,
    fileSize: Number,
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    uploadedAt: {
      type: Date,
      default: Date.now
    },
    verificationStatus: {
      type: String,
      enum: ['pending', 'verified', 'rejected'],
      default: 'pending'
    }
  }],

  // Communication Thread
  thread: [{
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    role: {
      type: String,
      enum: ['client', 'freelancer', 'admin', 'mediator'],
      required: true
    },
    message: {
      type: String,
      required: true
    },
    attachments: [{
      title: String,
      url: String,
      type: String
    }],
    visibility: {
      type: String,
      enum: ['all', 'admin_only'],
      default: 'all'
    },
    timestamp: {
      type: Date,
      default: Date.now
    }
  }],

  // Resolution
  resolution: {
    outcome: {
      type: String,
      enum: [
        'resolved_mutually',
        'in_favor_of_client',
        'in_favor_of_freelancer',
        'partial_refund',
        'full_refund',
        'cancelled',
        'other'
      ]
    },
    description: String,
    amount: Number,
    currency: String,
    resolvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    resolvedAt: Date,
    acceptedByInitiator: {
      accepted: Boolean,
      timestamp: Date
    },
    acceptedByRespondent: {
      accepted: Boolean,
      timestamp: Date
    }
  },

  // Admin Handling
  admin: {
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    assignedAt: Date,
    notes: [{
      content: String,
      author: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      timestamp: {
        type: Date,
        default: Date.now
      }
    }],
    priority: {
      type: String,
      enum: ['low', 'medium', 'high', 'urgent']
    },
    tags: [String]
  },

  // Mediation
  mediation: {
    required: {
      type: Boolean,
      default: false
    },
    mediator: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    startedAt: Date,
    endedAt: Date,
    outcome: String,
    notes: String
  },

  // Timestamps and Deadlines
  responseDeadline: Date,
  escalationDeadline: Date,
  nextActionDate: Date,
  resolvedAt: Date,

  // System Metadata
  systemNotes: [{
    type: String,
    timestamp: {
      type: Date,
      default: Date.now
    }
  }],
  tags: [String],
  flags: [{
    type: String,
    raisedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    timestamp: {
      type: Date,
      default: Date.now
    }
  }]
}, {
  timestamps: true
});

// Indexes
disputeSchema.index({ 'initiator.user': 1 });
disputeSchema.index({ 'respondent.user': 1 });
disputeSchema.index({ job: 1 });
disputeSchema.index({ contract: 1 });
disputeSchema.index({ status: 1 });
disputeSchema.index({ createdAt: 1 });
disputeSchema.index({ 'admin.assignedTo': 1 });

// Pre-save middleware
disputeSchema.pre('save', function(next) {
  try {
    if (this.isNew) {
      // Set response deadline (5 days from creation)
      this.responseDeadline = new Date(Date.now() + 5 * 24 * 60 * 60 * 1000);
      
      // Set escalation deadline (14 days from creation)
      this.escalationDeadline = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);
    }

    // Update next action date based on status
    this.updateNextActionDate();

    next();
  } catch (error) {
    logger.error('Dispute pre-save error:', error);
    next(error);
  }
});

// Methods
disputeSchema.methods = {
  // Add message to thread
  addMessage: async function(senderId, role, message, attachments = []) {
    try {
      this.thread.push({
        sender: senderId,
        role,
        message,
        attachments,
        timestamp: new Date()
      });
      await this.save();
      return this.thread[this.thread.length - 1];
    } catch (error) {
      logger.error('Add message error:', error);
      throw error;
    }
  },

  // Add evidence
  addEvidence: async function(evidenceData) {
    try {
      this.evidence.push({
        ...evidenceData,
        uploadedAt: new Date()
      });
      await this.save();
      return this.evidence[this.evidence.length - 1];
    } catch (error) {
      logger.error('Add evidence error:', error);
      throw error;
    }
  },

  // Resolve dispute
  resolve: async function(resolutionData, adminId) {
    try {
      this.resolution = {
        ...resolutionData,
        resolvedBy: adminId,
        resolvedAt: new Date()
      };
      this.status = 'resolved';
      await this.save();
    } catch (error) {
      logger.error('Resolve dispute error:', error);
      throw error;
    }
  },

  // Update next action date
  updateNextActionDate: function() {
    const now = new Date();
    switch (this.status) {
      case 'opened':
        this.nextActionDate = this.responseDeadline;
        break;
      case 'under_review':
        this.nextActionDate = new Date(now.getTime() + 48 * 60 * 60 * 1000); // 48 hours
        break;
      case 'evidence_needed':
        this.nextActionDate = new Date(now.getTime() + 72 * 60 * 60 * 1000); // 72 hours
        break;
      case 'mediation':
        this.nextActionDate = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000); // 7 days
        break;
      default:
        this.nextActionDate = null;
    }
  },

  // Escalate dispute
  escalate: async function(reason) {
    try {
      this.status = 'escalated';
      this.mediation.required = true;
      this.systemNotes.push({
        type: 'Dispute escalated',
        timestamp: new Date()
      });
      await this.save();
    } catch (error) {
      logger.error('Escalate dispute error:', error);
      throw error;
    }
  }
};

// Statics
disputeSchema.statics = {
  // Get user disputes
  getUserDisputes: async function(userId, filters = {}, page = 1, limit = 10) {
    const query = {
      $or: [
        { 'initiator.user': userId },
        { 'respondent.user': userId }
      ],
      ...filters
    };

    return this.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .populate('initiator.user', 'name email')
      .populate('respondent.user', 'name email')
      .populate('job', 'title');
  },

  // Get disputes requiring attention
  getDisputesRequiringAttention: async function() {
    const now = new Date();
    return this.find({
      status: { $nin: ['resolved', 'cancelled'] },
      nextActionDate: { $lte: now }
    })
    .sort({ priority: -1, nextActionDate: 1 })
    .populate('initiator.user', 'name email')
    .populate('respondent.user', 'name email');
  },

  // Get dispute statistics
  getDisputeStats: async function(filters = {}) {
    return this.aggregate([
      { $match: filters },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          totalAmount: {
            $sum: { $ifNull: ['$amount.disputed', 0] }
          }
        }
      }
    ]);
  }
};

const Dispute = mongoose.model('Dispute', disputeSchema);

export default Dispute;
