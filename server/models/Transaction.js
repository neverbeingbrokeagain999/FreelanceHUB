import mongoose from 'mongoose';
import logger from '../config/logger.js';

const transactionSchema = new mongoose.Schema({
  // Transaction Identifiers
  transactionId: {
    type: String,
    required: true,
    unique: true
  },
  reference: String,
  externalId: String,

  // Transaction Participants
  sender: {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    type: {
      type: String,
      enum: ['client', 'platform', 'system'],
      required: true
    }
  },
  recipient: {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    type: {
      type: String,
      enum: ['freelancer', 'platform', 'system'],
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
    ref: 'DirectContract.milestones'
  },
  dispute: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Dispute'
  },
  escrow: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Escrow'
  },

  // Transaction Details
  type: {
    type: String,
    enum: [
      'payment',
      'refund',
      'withdrawal',
      'deposit',
      'fee',
      'bonus',
      'adjustment',
      'escrow_fund',
      'escrow_release',
      'escrow_refund'
    ],
    required: true
  },
  subType: {
    type: String,
    enum: [
      'milestone_payment',
      'hourly_payment',
      'service_fee',
      'processing_fee',
      'platform_fee',
      'dispute_refund',
      'bonus_credit',
      'referral_bonus',
      'withdrawal_fee',
      'currency_conversion',
      'tax_deduction',
      'escrow_deposit',
      'escrow_disbursement',
      'escrow_fee',
      'escrow_refund_fee'
    ]
  },
  description: {
    type: String,
    required: true
  },

  // Amount Information
  amount: {
    value: {
      type: Number,
      required: true
    },
    currency: {
      type: String,
      required: true
    },
    exchangeRate: Number,
    convertedValue: Number,
    convertedCurrency: String
  },
  fees: {
    platform: {
      value: Number,
      currency: String
    },
    processing: {
      value: Number,
      currency: String
    },
    tax: {
      value: Number,
      currency: String
    }
  },
  total: {
    value: {
      type: Number,
      required: true
    },
    currency: {
      type: String,
      required: true
    }
  },

  // Payment Method
  paymentMethod: {
    type: {
      type: String,
      enum: [
        'credit_card',
        'bank_transfer',
        'paypal',
        'wallet',
        'crypto',
        'system'
      ],
      required: true
    },
    details: {
      card: {
        last4: String,
        brand: String,
        expiryMonth: Number,
        expiryYear: Number
      },
      bank: {
        accountLast4: String,
        bankName: String,
        routingNumber: String
      },
      wallet: {
        type: String,
        id: String
      },
      crypto: {
        currency: String,
        address: String,
        network: String
      }
    },
    savedMethod: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'PaymentMethod'
    }
  },

  // Transaction Status
  status: {
    type: String,
    enum: [
      'pending',
      'processing',
      'completed',
      'failed',
      'cancelled',
      'refunded',
      'disputed'
    ],
    default: 'pending'
  },
  statusHistory: [{
    status: {
      type: String,
      enum: [
        'pending',
        'processing',
        'completed',
        'failed',
        'cancelled',
        'refunded',
        'disputed'
      ]
    },
    timestamp: {
      type: Date,
      default: Date.now
    },
    reason: String,
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  }],

  // Processing Details
  processingDetails: {
    processor: {
      name: String,
      transactionId: String,
      status: String,
      response: mongoose.Schema.Types.Mixed
    },
    attempts: [{
      timestamp: Date,
      status: String,
      error: mongoose.Schema.Types.Mixed
    }],
    completedAt: Date,
    failureReason: String
  },

  // Compliance and Security
  security: {
    ipAddress: String,
    userAgent: String,
    location: {
      country: String,
      city: String,
      coordinates: {
        latitude: Number,
        longitude: Number
      }
    },
    riskScore: Number,
    fraudChecks: [{
      type: String,
      result: String,
      score: Number,
      timestamp: Date
    }],
    verified: {
      type: Boolean,
      default: false
    }
  },

  // Receipt and Documentation
  receipt: {
    number: String,
    url: String,
    generatedAt: Date
  },
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
  tags: [String]
}, {
  timestamps: true
});

// Indexes
transactionSchema.index({ 'sender.user': 1 });
transactionSchema.index({ 'recipient.user': 1 });
transactionSchema.index({ status: 1 });
transactionSchema.index({ createdAt: -1 });
transactionSchema.index({ job: 1 });
transactionSchema.index({ contract: 1 });

// Pre-save middleware
transactionSchema.pre('save', function(next) {
  try {
    // Generate transaction ID if not provided
    if (!this.transactionId) {
      const timestamp = new Date().getTime();
      const random = Math.floor(Math.random() * 10000);
      this.transactionId = `TXN${timestamp}${random}`;
    }

    // Add status history if status changed
    if (this.isModified('status')) {
      this.statusHistory.push({
        status: this.status,
        timestamp: new Date()
      });
    }

    next();
  } catch (error) {
    logger.error('Transaction pre-save error:', error);
    next(error);
  }
});

// Methods
transactionSchema.methods = {
  // Update status
  updateStatus: async function(status, reason, userId) {
    try {
      this.status = status;
      this.statusHistory.push({
        status,
        reason,
        timestamp: new Date(),
        updatedBy: userId
      });

      if (status === 'completed') {
        this.processingDetails.completedAt = new Date();
      }

      await this.save();
    } catch (error) {
      logger.error('Update transaction status error:', error);
      throw error;
    }
  },

  // Add processing attempt
  addProcessingAttempt: async function(status, error = null) {
    try {
      this.processingDetails.attempts.push({
        timestamp: new Date(),
        status,
        error
      });

      if (error) {
        this.processingDetails.failureReason = error.message;
      }

      await this.save();
    } catch (error) {
      logger.error('Add processing attempt error:', error);
      throw error;
    }
  }
};

// Statics
transactionSchema.statics = {
  // Get user transactions
  getUserTransactions: async function(userId, filters = {}) {
    const query = {
      $or: [
        { 'sender.user': userId },
        { 'recipient.user': userId }
      ]
    };

    if (filters.status) {
      query.status = filters.status;
    }

    if (filters.type) {
      query.type = filters.type;
    }

    if (filters.startDate) {
      query.createdAt = { $gte: filters.startDate };
    }

    if (filters.endDate) {
      query.createdAt = { ...query.createdAt, $lte: filters.endDate };
    }

    return this.find(query)
      .sort({ createdAt: -1 })
      .populate('sender.user', 'name email')
      .populate('recipient.user', 'name email');
  },

  // Get transaction statistics
  getTransactionStats: async function(filters = {}) {
    const matchStage = {};

    if (filters.userId) {
      matchStage.$or = [
        { 'sender.user': mongoose.Types.ObjectId(filters.userId) },
        { 'recipient.user': mongoose.Types.ObjectId(filters.userId) }
      ];
    }

    if (filters.startDate) {
      matchStage.createdAt = { $gte: filters.startDate };
    }

    if (filters.endDate) {
      matchStage.createdAt = { ...matchStage.createdAt, $lte: filters.endDate };
    }

    return this.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: {
            type: '$type',
            status: '$status'
          },
          count: { $sum: 1 },
          totalAmount: { $sum: '$amount.value' }
        }
      },
      {
        $group: {
          _id: '$_id.type',
          statuses: {
            $push: {
              status: '$_id.status',
              count: '$count',
              totalAmount: '$totalAmount'
            }
          },
          totalCount: { $sum: '$count' },
          totalAmount: { $sum: '$totalAmount' }
        }
      }
    ]);
  }
};

const Transaction = mongoose.model('Transaction', transactionSchema);

export default Transaction;
