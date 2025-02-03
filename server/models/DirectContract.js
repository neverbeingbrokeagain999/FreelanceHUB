import mongoose from 'mongoose';
import logger from '../config/logger.js';

const directContractSchema = new mongoose.Schema({
  // Contract Parties
  client: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  freelancer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },

  // Contract Details
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: [200, 'Title cannot be more than 200 characters']
  },
  description: {
    type: String,
    required: true,
    trim: true,
    maxlength: [5000, 'Description cannot be more than 5000 characters']
  },
  contractType: {
    type: String,
    required: true,
    enum: ['fixed', 'hourly'],
    default: 'fixed'
  },

  // Terms and Conditions
  terms: {
    startDate: Date,
    endDate: Date,
    paymentTerms: {
      type: String,
      enum: ['weekly', 'biweekly', 'monthly', 'milestone', 'completion'],
      required: true
    },
    rate: {
      amount: {
        type: Number,
        required: true,
        min: [0, 'Rate cannot be negative']
      },
      currency: {
        type: String,
        required: true,
        default: 'USD'
      },
      frequency: {
        type: String,
        enum: ['hourly', 'daily', 'weekly', 'monthly', 'fixed']
      }
    },
    maxHours: Number, // For hourly contracts
    totalBudget: {
      amount: Number,
      currency: {
        type: String,
        default: 'USD'
      }
    }
  },

  // Milestones
  milestones: [{
    title: {
      type: String,
      required: true
    },
    description: String,
    amount: {
      type: Number,
      required: true
    },
    dueDate: Date,
    status: {
      type: String,
      enum: ['pending', 'in_progress', 'completed', 'approved', 'rejected'],
      default: 'pending'
    },
    submissions: [{
      description: String,
      files: [{
        name: String,
        url: String,
        type: String,
        size: Number
      }],
      submittedAt: Date,
      feedback: String,
      status: {
        type: String,
        enum: ['pending', 'approved', 'rejected'],
        default: 'pending'
      }
    }],
    startedAt: Date,
    completedAt: Date,
    approvedAt: Date
  }],

  // Contract Status
  status: {
    type: String,
    enum: [
      'draft',
      'pending_approval',
      'active',
      'paused',
      'completed',
      'terminated',
      'cancelled'
    ],
    default: 'draft'
  },
  
  // Contract Signatures
  signatures: {
    client: {
      signed: {
        type: Boolean,
        default: false
      },
      signedAt: Date,
      ipAddress: String
    },
    freelancer: {
      signed: {
        type: Boolean,
        default: false
      },
      signedAt: Date,
      ipAddress: String
    }
  },

  // Time Tracking (for hourly contracts)
  timeTracking: {
    enabled: {
      type: Boolean,
      default: false
    },
    entries: [{
      date: Date,
      hours: Number,
      description: String,
      status: {
        type: String,
        enum: ['pending', 'approved', 'rejected'],
        default: 'pending'
      },
      submittedAt: Date,
      approvedAt: Date,
      rejectedAt: Date,
      feedback: String
    }],
    totalHours: {
      type: Number,
      default: 0
    },
    lastTrackedAt: Date
  },

  // Payment Information
  payments: {
    totalPaid: {
      type: Number,
      default: 0
    },
    totalPending: {
      type: Number,
      default: 0
    },
    nextPaymentDate: Date,
    lastPaymentDate: Date,
    transactions: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Transaction'
    }]
  },

  // Contract Files
  files: [{
    name: String,
    url: String,
    type: String,
    size: Number,
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  }],

  // Communication Log
  communications: [{
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    message: String,
    timestamp: {
      type: Date,
      default: Date.now
    },
    attachments: [{
      name: String,
      url: String,
      type: String
    }]
  }],

  // Contract Changes
  changes: [{
    type: {
      type: String,
      enum: [
        'terms_updated',
        'milestone_added',
        'milestone_updated',
        'rate_changed',
        'deadline_extended',
        'status_changed'
      ]
    },
    description: String,
    changedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    timestamp: {
      type: Date,
      default: Date.now
    },
    previousValue: mongoose.Schema.Types.Mixed,
    newValue: mongoose.Schema.Types.Mixed
  }],

  // Performance Metrics
  metrics: {
    milestoneCompletion: {
      onTime: {
        type: Number,
        default: 0
      },
      delayed: {
        type: Number,
        default: 0
      }
    },
    paymentStats: {
      onTime: {
        type: Number,
        default: 0
      },
      delayed: {
        type: Number,
        default: 0
      }
    },
    disputes: {
      total: {
        type: Number,
        default: 0
      },
      resolved: {
        type: Number,
        default: 0
      }
    },
    ratings: {
      client: {
        rating: Number,
        feedback: String,
        givenAt: Date
      },
      freelancer: {
        rating: Number,
        feedback: String,
        givenAt: Date
      }
    }
  },

  // Contract Settings
  settings: {
    requireTimeTracking: {
      type: Boolean,
      default: false
    },
    allowMilestoneModification: {
      type: Boolean,
      default: true
    },
    autoApproveTimeEntries: {
      type: Boolean,
      default: false
    },
    paymentAutoRelease: {
      type: Boolean,
      default: false
    },
    notificationPreferences: {
      milestoneUpdates: {
        type: Boolean,
        default: true
      },
      paymentReminders: {
        type: Boolean,
        default: true
      },
      deadlineReminders: {
        type: Boolean,
        default: true
      }
    }
  },

  // Termination Details
  termination: {
    terminatedAt: Date,
    terminatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    reason: String,
    notice: {
      givenAt: Date,
      periodDays: Number
    }
  }
}, {
  timestamps: true
});

// Indexes
directContractSchema.index({ client: 1 });
directContractSchema.index({ freelancer: 1 });
directContractSchema.index({ status: 1 });
directContractSchema.index({ 'terms.startDate': 1 });
directContractSchema.index({ 'terms.endDate': 1 });
directContractSchema.index({ 'payments.nextPaymentDate': 1 });

// Pre-save middleware
directContractSchema.pre('save', function(next) {
  try {
    // Update payment calculations
    if (this.isModified('milestones') || this.isModified('timeTracking.entries')) {
      this.calculatePayments();
    }

    // Update metrics
    if (this.isModified('milestones') || this.isModified('payments')) {
      this.updateMetrics();
    }

    next();
  } catch (error) {
    logger.error('DirectContract pre-save error:', error);
    next(error);
  }
});

// Methods
directContractSchema.methods = {
  // Calculate payments
  calculatePayments: function() {
    let totalPending = 0;

    if (this.contractType === 'fixed') {
      // Calculate from milestones
      this.milestones.forEach(milestone => {
        if (milestone.status !== 'approved') {
          totalPending += milestone.amount;
        }
      });
    } else {
      // Calculate from time entries
      const pendingEntries = this.timeTracking.entries.filter(
        entry => entry.status === 'pending'
      );
      totalPending = pendingEntries.reduce(
        (sum, entry) => sum + (entry.hours * this.terms.rate.amount),
        0
      );
    }

    this.payments.totalPending = totalPending;
  },

  // Update metrics
  updateMetrics: function() {
    // Update milestone completion metrics
    const milestones = this.milestones || [];
    this.metrics.milestoneCompletion = milestones.reduce((metrics, milestone) => {
      if (milestone.status === 'approved') {
        if (milestone.completedAt <= milestone.dueDate) {
          metrics.onTime++;
        } else {
          metrics.delayed++;
        }
      }
      return metrics;
    }, { onTime: 0, delayed: 0 });
  },

  // Add milestone
  addMilestone: async function(milestoneData) {
    try {
      this.milestones.push(milestoneData);
      await this.save();
      return this.milestones[this.milestones.length - 1];
    } catch (error) {
      logger.error('Add milestone error:', error);
      throw error;
    }
  },

  // Add time entry
  addTimeEntry: async function(entryData) {
    try {
      if (!this.timeTracking.enabled) {
        throw new Error('Time tracking is not enabled for this contract');
      }

      this.timeTracking.entries.push(entryData);
      this.timeTracking.totalHours += entryData.hours;
      this.timeTracking.lastTrackedAt = new Date();
      
      await this.save();
      return this.timeTracking.entries[this.timeTracking.entries.length - 1];
    } catch (error) {
      logger.error('Add time entry error:', error);
      throw error;
    }
  },

  // Sign contract
  sign: async function(userId, userType, ipAddress) {
    try {
      if (!['client', 'freelancer'].includes(userType)) {
        throw new Error('Invalid user type');
      }

      this.signatures[userType] = {
        signed: true,
        signedAt: new Date(),
        ipAddress
      };

      // If both parties have signed, activate the contract
      if (this.signatures.client.signed && this.signatures.freelancer.signed) {
        this.status = 'active';
        this.terms.startDate = new Date();
      }

      await this.save();
    } catch (error) {
      logger.error('Sign contract error:', error);
      throw error;
    }
  }
};

// Statics
directContractSchema.statics = {
  // Get user contracts
  getUserContracts: async function(userId, filters = {}, page = 1, limit = 10) {
    return this.find({
      $or: [
        { client: userId },
        { freelancer: userId }
      ],
      ...filters
    })
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(limit)
    .populate('client', 'name email avatar')
    .populate('freelancer', 'name email avatar');
  },

  // Get active contracts requiring attention
  getContractsRequiringAttention: async function() {
    const now = new Date();
    return this.find({
      status: 'active',
      $or: [
        { 'payments.nextPaymentDate': { $lte: now } },
        { 'milestones.dueDate': { $lte: now } }
      ]
    })
    .populate('client', 'name email')
    .populate('freelancer', 'name email');
  }
};

const DirectContract = mongoose.model('DirectContract', directContractSchema);

export default DirectContract;
