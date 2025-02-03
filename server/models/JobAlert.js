import mongoose from 'mongoose';
import logger from '../config/logger.js';

const jobAlertSchema = new mongoose.Schema({
  // User Reference
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },

  // Alert Name and Description
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: [100, 'Name cannot be more than 100 characters']
  },
  description: {
    type: String,
    trim: true,
    maxlength: [500, 'Description cannot be more than 500 characters']
  },

  // Job Preferences
  preferences: {
    // Job Type
    jobTypes: [{
      type: String,
      enum: ['full-time', 'part-time', 'contract', 'one-time', 'internship']
    }],

    // Skills and Experience
    skills: [{
      type: String,
      required: true
    }],
    experienceLevel: [{
      type: String,
      enum: ['entry', 'intermediate', 'expert']
    }],

    // Budget Range
    budget: {
      min: {
        type: Number,
        min: [0, 'Minimum budget cannot be negative']
      },
      max: Number,
      type: {
        type: String,
        enum: ['hourly', 'fixed']
      },
      currency: {
        type: String,
        default: 'USD'
      }
    },

    // Project Length
    projectLength: [{
      type: String,
      enum: [
        'less_than_1_month',
        '1_to_3_months',
        '3_to_6_months',
        'more_than_6_months'
      ]
    }],

    // Categories
    categories: [{
      type: String
    }],
    subcategories: [{
      type: String
    }],

    // Location Preferences
    location: {
      type: {
        type: String,
        enum: ['remote', 'onsite', 'hybrid']
      },
      countries: [String],
      cities: [String],
      timezones: [String]
    }
  },

  // Matching Criteria
  matchingCriteria: {
    // Required vs Nice-to-have Skills
    requiredSkills: [{
      type: String
    }],
    preferredSkills: [{
      type: String
    }],

    // Keyword Matching
    keywords: [{
      type: String,
      trim: true
    }],
    excludedKeywords: [{
      type: String,
      trim: true
    }],

    // Client Requirements
    clientRequirements: {
      minRating: {
        type: Number,
        min: 0,
        max: 5
      },
      minHireRate: {
        type: Number,
        min: 0,
        max: 100
      },
      verifiedPaymentMethod: {
        type: Boolean,
        default: true
      },
      minPreviousJobs: Number
    },

    // Advanced Filters
    advancedFilters: {
      excludeClientsWithoutActivity: {
        type: Boolean,
        default: true
      },
      excludeClientsWithDisputes: {
        type: Boolean,
        default: false
      },
      onlyVerifiedClients: {
        type: Boolean,
        default: false
      }
    }
  },

  // Notification Settings
  notifications: {
    // Delivery Preferences
    enabled: {
      type: Boolean,
      default: true
    },
    channels: [{
      type: String,
      enum: ['email', 'push', 'sms', 'in_app'],
      default: ['email', 'in_app']
    }],
    frequency: {
      type: String,
      enum: ['instant', 'hourly', 'daily', 'weekly'],
      default: 'instant'
    },
    quietHours: {
      enabled: {
        type: Boolean,
        default: false
      },
      start: String, // HH:mm format
      end: String,   // HH:mm format
      timezone: String
    },

    // Custom Rules
    rules: [{
      condition: {
        field: String,
        operator: {
          type: String,
          enum: ['equals', 'contains', 'greater_than', 'less_than']
        },
        value: mongoose.Schema.Types.Mixed
      },
      action: {
        type: String,
        enum: ['notify', 'ignore']
      }
    }],

    // Delivery Schedule (for non-instant notifications)
    deliverySchedule: {
      daysOfWeek: [{
        type: Number,
        min: 0,
        max: 6
      }],
      timeOfDay: String // HH:mm format
    }
  },

  // Alert Status
  status: {
    type: String,
    enum: ['active', 'paused', 'deleted'],
    default: 'active'
  },

  // Alert Performance
  performance: {
    totalMatches: {
      type: Number,
      default: 0
    },
    relevantMatches: {
      type: Number,
      default: 0
    },
    proposals: {
      type: Number,
      default: 0
    },
    interviews: {
      type: Number,
      default: 0
    },
    hires: {
      type: Number,
      default: 0
    },
    lastRelevantMatch: Date
  },

  // Recent Matches
  recentMatches: [{
    job: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Job'
    },
    matchedAt: {
      type: Date,
      default: Date.now
    },
    relevanceScore: {
      type: Number,
      min: 0,
      max: 100
    },
    status: {
      type: String,
      enum: ['new', 'viewed', 'applied', 'saved', 'dismissed'],
      default: 'new'
    },
    userAction: {
      action: String,
      timestamp: Date
    }
  }],

  // Alert History
  history: [{
    type: {
      type: String,
      enum: ['created', 'updated', 'paused', 'resumed', 'deleted']
    },
    timestamp: {
      type: Date,
      default: Date.now
    },
    changes: mongoose.Schema.Types.Mixed
  }]
}, {
  timestamps: true
});

// Indexes
jobAlertSchema.index({ user: 1, status: 1 });
jobAlertSchema.index({ 'preferences.skills': 1 });
jobAlertSchema.index({ 'preferences.categories': 1 });
jobAlertSchema.index({ 'performance.lastRelevantMatch': 1 });

// Pre-save middleware
jobAlertSchema.pre('save', function(next) {
  try {
    // Track history of changes
    if (!this.isNew && this.isModified()) {
      const changes = this.getChanges();
      if (Object.keys(changes).length > 0) {
        this.history.push({
          type: 'updated',
          timestamp: new Date(),
          changes
        });
      }
    }

    next();
  } catch (error) {
    logger.error('JobAlert pre-save error:', error);
    next(error);
  }
});

// Methods
jobAlertSchema.methods = {
  // Get changes between current and previous state
  getChanges: function() {
    const changes = {};
    const modifiedPaths = this.modifiedPaths();

    modifiedPaths.forEach(path => {
      if (path !== 'updatedAt' && path !== 'history') {
        changes[path] = {
          from: this.previous(path),
          to: this.get(path)
        };
      }
    });

    return changes;
  },

  // Update performance metrics
  updatePerformance: async function(metrics) {
    try {
      Object.assign(this.performance, metrics);
      if (metrics.relevantMatches > 0) {
        this.performance.lastRelevantMatch = new Date();
      }
      await this.save();
    } catch (error) {
      logger.error('Update performance error:', error);
      throw error;
    }
  },

  // Add match
  addMatch: async function(jobId, relevanceScore) {
    try {
      this.recentMatches.push({
        job: jobId,
        matchedAt: new Date(),
        relevanceScore
      });

      this.performance.totalMatches++;
      if (relevanceScore >= 70) {
        this.performance.relevantMatches++;
      }

      await this.save();
    } catch (error) {
      logger.error('Add match error:', error);
      throw error;
    }
  },

  // Update match status
  updateMatchStatus: async function(jobId, status, action = null) {
    try {
      const match = this.recentMatches.find(
        m => m.job.toString() === jobId.toString()
      );

      if (match) {
        match.status = status;
        if (action) {
          match.userAction = {
            action,
            timestamp: new Date()
          };
        }

        // Update performance metrics
        if (status === 'applied') {
          this.performance.proposals++;
        }

        await this.save();
      }
    } catch (error) {
      logger.error('Update match status error:', error);
      throw error;
    }
  }
};

// Statics
jobAlertSchema.statics = {
  // Find matching alerts for a job
  findMatchingAlerts: async function(job) {
    const query = {
      status: 'active',
      'notifications.enabled': true
    };

    // Add skill matching
    if (job.skills && job.skills.length > 0) {
      query['preferences.skills'] = {
        $in: job.skills
      };
    }

    // Add budget matching
    if (job.budget) {
      query['preferences.budget.min'] = {
        $lte: job.budget.max
      };
      if (job.budget.type) {
        query['preferences.budget.type'] = job.budget.type;
      }
    }

    return this.find(query)
      .populate('user', 'name email notifications')
      .sort('performance.relevantMatches');
  },

  // Get alert statistics
  getAlertStats: async function(userId) {
    return this.aggregate([
      { $match: { user: mongoose.Types.ObjectId(userId) } },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          totalMatches: { $sum: '$performance.totalMatches' },
          relevantMatches: { $sum: '$performance.relevantMatches' },
          proposals: { $sum: '$performance.proposals' }
        }
      }
    ]);
  }
};

const JobAlert = mongoose.model('JobAlert', jobAlertSchema);
export default JobAlert;
