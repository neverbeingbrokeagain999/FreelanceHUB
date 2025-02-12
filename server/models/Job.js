import mongoose from 'mongoose';
import slugify from 'slugify';
import logger from '../config/logger.js';

const jobSchema = new mongoose.Schema({
  // Client Reference
  client: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },

  // Job Details
  title: {
    type: String,
    required: [true, 'Please provide a job title'],
    trim: true,
    maxlength: [100, 'Title cannot be more than 100 characters']
  },
  slug: String,
  description: {
    type: String,
    required: [true, 'Please provide a job description'],
    trim: true,
    maxlength: [5000, 'Description cannot be more than 5000 characters']
  },
  requirements: {
    type: String,
    required: [true, 'Please provide job requirements'],
    trim: true,
    maxlength: [2000, 'Requirements cannot be more than 2000 characters']
  },

  // Job Category and Type
  category: {
    main: {
      type: String,
      required: true
    },
    sub: String
  },
  type: {
    type: String,
    enum: ['fixed', 'hourly'],
    required: true
  },
  duration: {
    type: String,
    enum: [
      'less_than_1_month',
      '1_to_3_months',
      '3_to_6_months',
      'more_than_6_months'
    ],
    required: true
  },

  // Required Skills and Experience
  skills: [{
    type: String,
    required: true
  }],
  experienceLevel: {
    type: String,
    enum: ['entry', 'intermediate', 'expert'],
    required: true
  },

  // Budget and Payment
  budget: {
    type: {
      type: String,
      enum: ['fixed', 'range', 'hourly'],
      required: true
    },
    min: {
      type: Number,
      required: true,
      min: [0, 'Minimum budget cannot be negative']
    },
    max: Number,
    currency: {
      type: String,
      default: 'USD'
    }
  },

  // Location and Availability
  location: {
    type: {
      type: String,
      enum: ['remote', 'onsite', 'hybrid'],
      default: 'remote'
    },
    country: String,
    city: String,
    timezone: String
  },

  // Proposals and Applications
  proposals: [{
    freelancer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    coverLetter: {
      type: String,
      required: true,
      maxlength: 2000
    },
    proposedRate: {
      amount: {
        type: Number,
        required: true
      },
      type: {
        type: String,
        enum: ['fixed', 'hourly'],
        required: true
      }
    },
    estimatedDuration: {
      value: Number,
      unit: {
        type: String,
        enum: ['hours', 'days', 'weeks', 'months']
      }
    },
    attachments: [{
      name: String,
      url: String,
      type: String
    }],
    status: {
      type: String,
      enum: ['pending', 'shortlisted', 'accepted', 'rejected', 'withdrawn'],
      default: 'pending'
    },
    submittedAt: {
      type: Date,
      default: Date.now
    },
    updatedAt: Date
  }],

  // Job Status and Visibility
  status: {
    type: String,
    enum: [
      'draft',
      'published',
      'in_progress',
      'completed',
      'cancelled',
      'expired',
      'on_hold',
      'removed'
    ],
    default: 'draft'
  },
  compliance: {
    type: String,
    enum: ['pending', 'approved', 'flagged'],
    default: 'pending'
  },
  complianceIssues: [{
    type: String,
    trim: true
  }],
  visibility: {
    type: String,
    enum: ['public', 'private', 'invite_only'],
    default: 'public'
  },
  featured: {
    type: Boolean,
    default: false
  },
  promoted: {
    isPromoted: {
      type: Boolean,
      default: false
    },
    startDate: Date,
    endDate: Date,
    plan: String
  },

  // Project Timeline
  timeline: {
    publishedAt: Date,
    startDate: Date,
    endDate: Date,
    estimatedDuration: {
      value: Number,
      unit: {
        type: String,
        enum: ['hours', 'days', 'weeks', 'months']
      }
    },
    deadlines: [{
      title: String,
      date: Date,
      description: String
    }]
  },

  // Screening Questions
  screeningQuestions: [{
    question: {
      type: String,
      required: true
    },
    required: {
      type: Boolean,
      default: true
    },
    type: {
      type: String,
      enum: ['text', 'multiple_choice', 'file'],
      default: 'text'
    },
    options: [String], // For multiple choice questions
    maxLength: Number  // For text answers
  }],

  // Files and Attachments
  attachments: [{
    name: String,
    url: String,
    type: String,
    size: Number,
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  }],

  // Project Milestones
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
      enum: ['pending', 'in_progress', 'completed', 'approved'],
      default: 'pending'
    },
    deliverables: [String],
    startedAt: Date,
    completedAt: Date
  }],

  // Job Activity
  activity: [{
    type: {
      type: String,
      enum: [
        'created',
        'updated',
        'published',
        'proposal_received',
        'status_changed',
        'milestone_completed'
      ]
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    description: String,
    timestamp: {
      type: Date,
      default: Date.now
    }
  }],

  // Job Statistics
  stats: {
    views: {
      type: Number,
      default: 0
    },
    proposals: {
      type: Number,
      default: 0
    },
    averageBid: Number,
    shortlisted: {
      type: Number,
      default: 0
    },
    interviews: {
      type: Number,
      default: 0
    }
  }
}, {
  timestamps: true
});

// Indexes
jobSchema.index({ client: 1 });
jobSchema.index({ status: 1 });
jobSchema.index({ 'category.main': 1 });
jobSchema.index({ skills: 1 });
jobSchema.index({ createdAt: -1 });
jobSchema.index({ featured: 1 });
jobSchema.index({ slug: 1 });

// Pre-save middleware
jobSchema.pre('save', async function(next) {
  try {
    if (this.isModified('title')) {
      this.slug = slugify(this.title, { lower: true });
    }

    if (this.isModified('proposals')) {
      this.stats.proposals = this.proposals.length;
      this.stats.shortlisted = this.proposals.filter(
        p => p.status === 'shortlisted'
      ).length;

      // Calculate average bid
      const validBids = this.proposals
        .filter(p => p.status !== 'withdrawn' && p.status !== 'rejected')
        .map(p => p.proposedRate.amount);
      
      this.stats.averageBid = validBids.length
        ? validBids.reduce((a, b) => a + b) / validBids.length
        : 0;
    }

    next();
  } catch (error) {
    logger.error('Job pre-save error:', error);
    next(error);
  }
});

// Methods
jobSchema.methods = {
  // Add proposal
  addProposal: async function(proposalData) {
    try {
      const existingProposal = this.proposals.find(
        p => p.freelancer.toString() === proposalData.freelancer.toString()
      );

      if (existingProposal) {
        throw new Error('You have already submitted a proposal for this job');
      }

      this.proposals.push(proposalData);
      this.activity.push({
        type: 'proposal_received',
        user: proposalData.freelancer,
        description: 'New proposal submitted'
      });

      await this.save();
      return this.proposals[this.proposals.length - 1];
    } catch (error) {
      logger.error('Add proposal error:', error);
      throw error;
    }
  },

  // Update proposal status
  updateProposalStatus: async function(proposalId, status, userId) {
    try {
      const proposal = this.proposals.id(proposalId);
      if (!proposal) {
        throw new Error('Proposal not found');
      }

      proposal.status = status;
      proposal.updatedAt = new Date();

      this.activity.push({
        type: 'status_changed',
        user: userId,
        description: `Proposal status updated to ${status}`
      });

      await this.save();
      return proposal;
    } catch (error) {
      logger.error('Update proposal status error:', error);
      throw error;
    }
  },

  // Increment view count
  incrementViews: async function() {
    try {
      this.stats.views += 1;
      await this.save();
    } catch (error) {
      logger.error('Increment views error:', error);
      throw error;
    }
  }
};

// Statics
jobSchema.statics = {
  // Find matching jobs
  findMatchingJobs: async function(criteria) {
    const query = { status: 'published' };

    if (criteria.skills?.length) {
      query.skills = { $in: criteria.skills };
    }

    if (criteria.category) {
      query['category.main'] = criteria.category;
    }

    if (criteria.budget) {
      query['budget.min'] = { $lte: criteria.budget };
      if (criteria.budget.max) {
        query['budget.max'] = { $gte: criteria.budget };
      }
    }

    if (criteria.experienceLevel) {
      query.experienceLevel = criteria.experienceLevel;
    }

    return this.find(query)
      .populate('client', 'name avatar')
      .sort(criteria.sort || '-createdAt');
  },

  // Get job statistics
  getJobStats: async function(clientId) {
    return this.aggregate([
      {
        $match: clientId ? { client: mongoose.Types.ObjectId(clientId) } : {}
      },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          totalBudget: {
            $sum: { $ifNull: ['$budget.max', '$budget.min'] }
          },
          avgProposals: { $avg: '$stats.proposals' }
        }
      }
    ]);
  }
};

const Job = mongoose.model('Job', jobSchema);
export default Job;
