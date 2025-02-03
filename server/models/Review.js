import mongoose from 'mongoose';
import logger from '../config/logger.js';

const reviewSchema = new mongoose.Schema({
  // Review Author
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  authorRole: {
    type: String,
    enum: ['client', 'freelancer'],
    required: true
  },

  // Review Target
  recipient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  recipientRole: {
    type: String,
    enum: ['client', 'freelancer'],
    required: true
  },

  // Related Job/Contract
  job: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Job'
  },
  contract: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'DirectContract'
  },

  // Review Content
  title: {
    type: String,
    required: [true, 'Please provide a review title'],
    trim: true,
    maxlength: [100, 'Title cannot be more than 100 characters']
  },
  content: {
    type: String,
    required: [true, 'Please provide review content'],
    trim: true,
    maxlength: [2000, 'Content cannot be more than 2000 characters']
  },

  // Ratings
  ratings: {
    overall: {
      type: Number,
      min: 1,
      max: 5,
      default: function() {
        const ratings = this.ratings || {};
        const validRatings = Object.entries(ratings)
          .filter(([key, value]) => key !== 'overall' && typeof value === 'number');
        
        if (validRatings.length === 0) return 0;
        
        const sum = validRatings.reduce((acc, [_, value]) => acc + value, 0);
        return Math.round(sum / validRatings.length);
      }
    },
    // Common rating categories
    communication: {
      type: Number,
      required: true,
      min: 1,
      max: 5
    },
    // Client rating categories
    paymentPromptness: {
      type: Number,
      min: 1,
      max: 5
    },
    requirements: {
      type: Number,
      min: 1,
      max: 5
    },
    // Freelancer rating categories
    quality: {
      type: Number,
      min: 1,
      max: 5
    },
    expertise: {
      type: Number,
      min: 1,
      max: 5
    },
    deadlines: {
      type: Number,
      min: 1,
      max: 5
    },
    cooperation: {
      type: Number,
      min: 1,
      max: 5
    }
  },

  // Review Status
  status: {
    type: String,
    enum: ['pending', 'published', 'reported', 'removed'],
    default: 'pending'
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  visibility: {
    type: String,
    enum: ['public', 'private'],
    default: 'public'
  },

  // Work Details
  workDetails: {
    startDate: Date,
    endDate: Date,
    duration: Number, // in days
    projectValue: {
      amount: Number,
      currency: {
        type: String,
        default: 'USD'
      }
    },
    skillsUsed: [String]
  },

  // Recommendations
  recommendations: {
    wouldHireAgain: Boolean,
    wouldWorkAgain: Boolean,
    recommendToOthers: Boolean
  },

  // Feedback Response
  response: {
    content: {
      type: String,
      trim: true,
      maxlength: [1000, 'Response cannot be more than 1000 characters']
    },
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    createdAt: Date
  },

  // Review Moderation
  moderation: {
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending'
    },
    moderatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    moderatedAt: Date,
    reason: String,
    notes: String
  },

  // Reports
  reports: [{
    reporter: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    reason: {
      type: String,
      enum: [
        'inappropriate',
        'spam',
        'fake',
        'conflict_of_interest',
        'other'
      ]
    },
    description: String,
    status: {
      type: String,
      enum: ['pending', 'reviewed', 'resolved'],
      default: 'pending'
    },
    createdAt: {
      type: Date,
      default: Date.now
    },
    resolvedAt: Date,
    resolvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  }],

  // Helpfulness Votes
  helpfulnessVotes: {
    helpful: [{
      user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      timestamp: {
        type: Date,
        default: Date.now
      }
    }],
    notHelpful: [{
      user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      timestamp: {
        type: Date,
        default: Date.now
      }
    }]
  },

  // Metadata
  metadata: {
    platform: String,
    deviceType: String,
    location: String,
    ipAddress: String
  }
}, {
  timestamps: true
});

// Indexes
reviewSchema.index({ author: 1, recipient: 1 });
reviewSchema.index({ job: 1 });
reviewSchema.index({ contract: 1 });
reviewSchema.index({ 'ratings.overall': 1 });
reviewSchema.index({ status: 1 });
reviewSchema.index({ createdAt: -1 });

// Pre-save middleware
reviewSchema.pre('save', async function(next) {
  try {
    // Calculate overall rating
    if (this.isModified('ratings')) {
      const ratings = Object.entries(this.ratings)
        .filter(([key, value]) => key !== 'overall' && typeof value === 'number');
      
      if (ratings.length > 0) {
        const sum = ratings.reduce((acc, [_, value]) => acc + value, 0);
        this.ratings.overall = Math.round(sum / ratings.length);
      }
    }

    // Set visibility if not set
    if (!this.visibility) {
      this.visibility = 'public';
    }

    next();
  } catch (error) {
    logger.error('Review pre-save error:', error);
    next(error);
  }
});

// Methods
reviewSchema.methods = {
  // Add response
  addResponse: async function(content, userId) {
    try {
      this.response = {
        content,
        author: userId,
        createdAt: new Date()
      };
      await this.save();
    } catch (error) {
      logger.error('Add response error:', error);
      throw error;
    }
  },

  // Vote on helpfulness
  vote: async function(userId, isHelpful) {
    try {
      // Remove any existing votes by this user
      this.helpfulnessVotes.helpful = this.helpfulnessVotes.helpful.filter(
        v => v.user.toString() !== userId.toString()
      );
      this.helpfulnessVotes.notHelpful = this.helpfulnessVotes.notHelpful.filter(
        v => v.user.toString() !== userId.toString()
      );

      // Add new vote
      const votesList = isHelpful
        ? this.helpfulnessVotes.helpful
        : this.helpfulnessVotes.notHelpful;

      votesList.push({
        user: userId,
        timestamp: new Date()
      });

      await this.save();
    } catch (error) {
      logger.error('Vote error:', error);
      throw error;
    }
  },

  // Report review
  report: async function(reportData) {
    try {
      this.reports.push({
        ...reportData,
        createdAt: new Date()
      });
      
      // Update status if threshold reached
      if (this.reports.length >= 3) {
        this.status = 'reported';
      }

      await this.save();
    } catch (error) {
      logger.error('Report review error:', error);
      throw error;
    }
  }
};

// Statics
reviewSchema.statics = {
  // Get user reviews
  getUserReviews: async function(userId, role) {
    const query = role === 'author'
      ? { author: userId }
      : { recipient: userId };

    return this.find(query)
      .populate('author', 'name avatar')
      .populate('recipient', 'name avatar')
      .populate('job', 'title')
      .sort('-createdAt');
  },

  // Get review statistics
  getReviewStats: async function(userId) {
    return this.aggregate([
      { $match: { recipient: mongoose.Types.ObjectId(userId) } },
      {
        $group: {
          _id: null,
          averageRating: { $avg: '$ratings.overall' },
          totalReviews: { $sum: 1 },
          ratingDistribution: {
            $push: '$ratings.overall'
          }
        }
      },
      {
        $project: {
          _id: 0,
          averageRating: 1,
          totalReviews: 1,
          ratingDistribution: {
            1: { $size: { $filter: { input: '$ratingDistribution', cond: { $eq: ['$$this', 1] } } } },
            2: { $size: { $filter: { input: '$ratingDistribution', cond: { $eq: ['$$this', 2] } } } },
            3: { $size: { $filter: { input: '$ratingDistribution', cond: { $eq: ['$$this', 3] } } } },
            4: { $size: { $filter: { input: '$ratingDistribution', cond: { $eq: ['$$this', 4] } } } },
            5: { $size: { $filter: { input: '$ratingDistribution', cond: { $eq: ['$$this', 5] } } } }
          }
        }
      }
    ]);
  }
};

const Review = mongoose.model('Review', reviewSchema);
export default Review;
