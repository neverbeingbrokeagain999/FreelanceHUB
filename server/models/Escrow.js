import mongoose from 'mongoose';
import logger from '../config/logger.js';

const escrowSchema = new mongoose.Schema({
  // Core Details
  jobId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Job',
    required: true
  },
  clientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  freelancerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  // Financial Details
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  currency: {
    type: String,
    required: true,
    default: 'USD'
  },
  feeAmount: {
    type: Number,
    required: true,
    default: 0
  },
  
  // Status & Timing
  status: {
    type: String,
    enum: ['pending', 'funded', 'released', 'refunded', 'disputed'],
    default: 'pending'
  },
  fundedAt: Date,
  releasedAt: Date,
  expiryDate: {
    type: Date,
    required: true
  },

  // Release Conditions
  releaseConditions: [{
    type: {
      type: String,
      enum: ['milestone', 'time', 'manual'],
      required: true
    },
    description: String,
    amount: Number,
    completed: {
      type: Boolean,
      default: false
    },
    completedAt: Date,
    milestoneId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Milestone'
    }
  }],

  // Payment Details
  paymentGatewayId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'PaymentGateway',
    required: true
  },
  transactionIds: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Transaction'
  }],
  paymentMethod: {
    type: String,
    required: true
  },

  // Dispute Information
  dispute: {
    isDisputed: {
      type: Boolean,
      default: false
    },
    disputeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Dispute'
    },
    disputedAt: Date,
    resolvedAt: Date,
    resolution: {
      type: String,
      enum: ['released', 'refunded', 'split'],
      default: null
    }
  },

  // Auto-release Settings
  autoRelease: {
    enabled: {
      type: Boolean,
      default: true
    },
    conditions: {
      timeThreshold: {
        type: Number,
        default: 14 // days
      },
      requireMilestoneCompletion: {
        type: Boolean,
        default: true
      }
    }
  },

  // Security & Compliance
  verificationStatus: {
    clientVerified: {
      type: Boolean,
      default: false
    },
    freelancerVerified: {
      type: Boolean,
      default: false
    }
  },
  
  // Audit Trail
  history: [{
    action: {
      type: String,
      enum: ['created', 'funded', 'released', 'disputed', 'resolved', 'refunded']
    },
    performedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    amount: Number,
    timestamp: {
      type: Date,
      default: Date.now
    },
    notes: String
  }]
}, {
  timestamps: true
});

// Indexes
escrowSchema.index({ jobId: 1 });
escrowSchema.index({ clientId: 1 });
escrowSchema.index({ freelancerId: 1 });
escrowSchema.index({ status: 1 });
escrowSchema.index({ 'dispute.isDisputed': 1 });
escrowSchema.index({ expiryDate: 1 });

// Methods
escrowSchema.methods = {
  // Fund the escrow
  fund: async function(transactionId) {
    try {
      if (this.status !== 'pending') {
        throw new Error('Escrow cannot be funded in current status');
      }

      this.status = 'funded';
      this.fundedAt = new Date();
      this.transactionIds.push(transactionId);
      this.history.push({
        action: 'funded',
        performedBy: this.clientId,
        amount: this.amount,
        timestamp: this.fundedAt
      });

      await this.save();
      return true;
    } catch (error) {
      logger.error('Escrow fund error:', error);
      throw error;
    }
  },

  // Release funds
  release: async function(userId, amount = null, notes = '') {
    try {
      if (this.status !== 'funded') {
        throw new Error('Escrow must be funded to release');
      }

      const releaseAmount = amount || this.amount;
      if (releaseAmount > this.amount) {
        throw new Error('Release amount cannot exceed escrow amount');
      }

      this.status = 'released';
      this.releasedAt = new Date();
      this.history.push({
        action: 'released',
        performedBy: userId,
        amount: releaseAmount,
        timestamp: this.releasedAt,
        notes
      });

      await this.save();
      return true;
    } catch (error) {
      logger.error('Escrow release error:', error);
      throw error;
    }
  },

  // Initiate dispute
  dispute: async function(userId, reason) {
    try {
      if (this.status !== 'funded') {
        throw new Error('Only funded escrow can be disputed');
      }

      this.status = 'disputed';
      this.dispute.isDisputed = true;
      this.dispute.disputedAt = new Date();
      this.history.push({
        action: 'disputed',
        performedBy: userId,
        timestamp: this.dispute.disputedAt,
        notes: reason
      });

      await this.save();
      return true;
    } catch (error) {
      logger.error('Escrow dispute error:', error);
      throw error;
    }
  },

  // Check auto-release conditions
  checkAutoRelease: async function() {
    try {
      if (!this.autoRelease.enabled || this.status !== 'funded') {
        return false;
      }

      const now = new Date();
      const daysHeld = (now - this.fundedAt) / (1000 * 60 * 60 * 24);

      if (daysHeld >= this.autoRelease.conditions.timeThreshold) {
        if (this.autoRelease.conditions.requireMilestoneCompletion) {
          const allMilestonesComplete = this.releaseConditions.every(
            condition => condition.completed
          );
          if (!allMilestonesComplete) return false;
        }

        await this.release(this.freelancerId, null, 'Auto-released');
        return true;
      }

      return false;
    } catch (error) {
      logger.error('Escrow auto-release check error:', error);
      throw error;
    }
  }
};

// Statics
escrowSchema.statics = {
  // Get all active escrows for a user
  getActiveEscrows: function(userId) {
    return this.find({
      $or: [{ clientId: userId }, { freelancerId: userId }],
      status: { $in: ['funded', 'disputed'] }
    }).populate('jobId transactionIds');
  },

  // Get escrow statistics
  getEscrowStats: async function(userId) {
    return this.aggregate([
      {
        $match: {
          $or: [{ clientId: userId }, { freelancerId: userId }]
        }
      },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          totalAmount: { $sum: '$amount' }
        }
      }
    ]);
  }
};

const Escrow = mongoose.model('Escrow', escrowSchema);

export default Escrow;
