import mongoose from 'mongoose';
import logger from '../config/logger.js';

const paymentGatewaySchema = new mongoose.Schema({
  // Gateway Information
  name: {
    type: String,
    required: [true, 'Payment gateway name is required'],
    unique: true,
    trim: true
  },
  provider: {
    type: String,
    required: [true, 'Provider name is required'],
    enum: [
      'stripe',
      'paypal',
      'wise',
      'coinbase',
      'custom'
    ]
  },
  mode: {
    type: String,
    enum: ['test', 'live'],
    required: true
  },

  // Gateway Status
  isActive: {
    type: Boolean,
    default: true
  },
  isDefault: {
    type: Boolean,
    default: false
  },

  // Credentials (Encrypted)
  credentials: {
    apiKey: String,
    secretKey: String,
    publicKey: String,
    webhookSecret: String,
    additionalKeys: mongoose.Schema.Types.Mixed
  },

  // Configuration
  config: {
    apiVersion: String,
    apiEndpoint: String,
    webhookEndpoint: String,
    ipnUrl: String,
    returnUrl: String,
    cancelUrl: String,
    successUrl: String,
    supportedCurrencies: [String],
    supportedCountries: [String],
    supportedPaymentMethods: [{
      type: String,
      enum: [
        'credit_card',
        'debit_card',
        'bank_transfer',
        'crypto',
        'wallet',
        'upi'
      ]
    }],
    fees: {
      fixed: Number,
      percentage: Number,
      currency: String
    },
    limits: {
      minAmount: Number,
      maxAmount: Number,
      currency: String,
      dailyLimit: Number,
      monthlyLimit: Number
    },
    settlement: {
      frequency: {
        type: String,
        enum: ['instant', 'daily', 'weekly', 'monthly']
      },
      day: Number,
      holdPeriod: Number
    }
  },

  // Integration Settings
  settings: {
    autoCapture: {
      type: Boolean,
      default: true
    },
    threeDSecure: {
      enabled: {
        type: Boolean,
        default: true
      },
      required: {
        type: Boolean,
        default: false
      },
      threshold: Number
    },
    webhooks: {
      enabled: {
        type: Boolean,
        default: true
      },
      signatureValidation: {
        type: Boolean,
        default: true
      },
      events: [String]
    },
    retry: {
      enabled: {
        type: Boolean,
        default: true
      },
      maxAttempts: {
        type: Number,
        default: 3
      },
      interval: {
        type: Number,
        default: 60
      }
    },
    fraudPrevention: {
      enabled: {
        type: Boolean,
        default: true
      },
      minRiskScore: {
        type: Number,
        default: 50
      },
      blockedIPs: [String],
      blockedCountries: [String],
      velocityChecks: {
        enabled: {
          type: Boolean,
          default: true
        },
        timeWindow: Number,
        maxAttempts: Number
      }
    }
  },

  // Performance Metrics
  metrics: {
    totalTransactions: {
      type: Number,
      default: 0
    },
    successfulTransactions: {
      type: Number,
      default: 0
    },
    failedTransactions: {
      type: Number,
      default: 0
    },
    totalVolume: {
      amount: {
        type: Number,
        default: 0
      },
      currency: String
    },
    averageResponseTime: Number,
    uptimePercentage: Number,
    lastDowntime: Date,
    errorRate: {
      type: Number,
      default: 0
    }
  },

  // Health Status
  health: {
    status: {
      type: String,
      enum: ['operational', 'degraded', 'down'],
      default: 'operational'
    },
    lastChecked: Date,
    incidents: [{
      type: {
        type: String,
        enum: ['error', 'timeout', 'maintenance']
      },
      description: String,
      startTime: Date,
      endTime: Date,
      resolved: {
        type: Boolean,
        default: false
      }
    }]
  },

  // Webhook Logs
  webhookLogs: [{
    event: String,
    payload: mongoose.Schema.Types.Mixed,
    status: {
      type: String,
      enum: ['success', 'failed']
    },
    timestamp: {
      type: Date,
      default: Date.now
    },
    response: mongoose.Schema.Types.Mixed,
    error: String
  }]
}, {
  timestamps: true
});

// Indexes
paymentGatewaySchema.index({ provider: 1 });
paymentGatewaySchema.index({ isActive: 1 });
paymentGatewaySchema.index({ isDefault: 1 });
paymentGatewaySchema.index({ 'health.status': 1 });

// Pre-save middleware
paymentGatewaySchema.pre('save', function(next) {
  try {
    // Ensure only one default gateway per provider
    if (this.isDefault) {
      this.constructor.updateMany(
        {
          _id: { $ne: this._id },
          provider: this.provider
        },
        { isDefault: false }
      ).exec();
    }

    next();
  } catch (error) {
    logger.error('PaymentGateway pre-save error:', error);
    next(error);
  }
});

// Methods
paymentGatewaySchema.methods = {
  // Log webhook
  logWebhook: async function(event, payload, status, response, error = null) {
    try {
      this.webhookLogs.push({
        event,
        payload,
        status,
        response,
        error,
        timestamp: new Date()
      });
      await this.save();
    } catch (err) {
      logger.error('Log webhook error:', err);
      throw err;
    }
  },

  // Update metrics
  updateMetrics: async function(transactionResult) {
    try {
      this.metrics.totalTransactions += 1;
      
      if (transactionResult.success) {
        this.metrics.successfulTransactions += 1;
        this.metrics.totalVolume.amount += transactionResult.amount;
      } else {
        this.metrics.failedTransactions += 1;
      }

      // Update error rate
      this.metrics.errorRate = (
        this.metrics.failedTransactions / this.metrics.totalTransactions
      ) * 100;

      await this.save();
    } catch (error) {
      logger.error('Update metrics error:', error);
      throw error;
    }
  },

  // Report incident
  reportIncident: async function(type, description) {
    try {
      this.health.status = 'degraded';
      this.health.incidents.push({
        type,
        description,
        startTime: new Date()
      });
      await this.save();
    } catch (error) {
      logger.error('Report incident error:', error);
      throw error;
    }
  },

  // Resolve incident
  resolveIncident: async function(incidentId) {
    try {
      const incident = this.health.incidents.id(incidentId);
      if (incident) {
        incident.resolved = true;
        incident.endTime = new Date();
      }

      // Update health status if all incidents are resolved
      const hasUnresolvedIncidents = this.health.incidents.some(
        inc => !inc.resolved
      );
      if (!hasUnresolvedIncidents) {
        this.health.status = 'operational';
      }

      await this.save();
    } catch (error) {
      logger.error('Resolve incident error:', error);
      throw error;
    }
  }
};

// Statics
paymentGatewaySchema.statics = {
  // Get active gateways
  getActiveGateways: function() {
    return this.find({ isActive: true })
      .sort({ isDefault: -1, createdAt: -1 });
  },

  // Get default gateway for provider
  getDefaultGateway: function(provider) {
    return this.findOne({
      provider,
      isActive: true,
      isDefault: true
    });
  },

  // Get gateway performance stats
  getPerformanceStats: async function() {
    return this.aggregate([
      { $match: { isActive: true } },
      {
        $group: {
          _id: '$provider',
          totalTransactions: { $sum: '$metrics.totalTransactions' },
          successRate: {
            $avg: {
              $multiply: [
                {
                  $divide: [
                    '$metrics.successfulTransactions',
                    { $max: ['$metrics.totalTransactions', 1] }
                  ]
                },
                100
              ]
            }
          },
          averageResponseTime: { $avg: '$metrics.averageResponseTime' },
          totalVolume: { $sum: '$metrics.totalVolume.amount' }
        }
      }
    ]);
  }
};

const PaymentGateway = mongoose.model('PaymentGateway', paymentGatewaySchema);

export default PaymentGateway;
