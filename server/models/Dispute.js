import mongoose from 'mongoose';

const disputeSchema = new mongoose.Schema({
  job: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Job',
    required: true
  },
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
  status: {
    type: String,
    enum: ['open', 'resolved', 'closed'],
    default: 'open'
  },
  type: {
    type: String,
    enum: ['payment', 'delivery', 'communication', 'quality', 'other'],
    required: true
  },
  description: {
    type: String,
    required: true
  },
  evidences: [{
    type: {
      type: String,
      required: true
    },
    url: {
      type: String,
      required: true
    },
    description: String,
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  }],
  messages: [{
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    content: {
      type: String,
      required: true
    },
    attachments: [{
      type: String,
      url: String,
      name: String
    }],
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  resolution: {
    details: String,
    outcome: {
      type: String,
      enum: ['client_favor', 'freelancer_favor', 'compromise', 'other']
    },
    actions: [{
      type: {
        type: String,
        enum: ['refund', 'payment_release', 'warning', 'other'],
        required: true
      },
      amount: Number,
      description: String,
      status: {
        type: String,
        enum: ['pending', 'completed', 'failed'],
        default: 'pending'
      },
      completedAt: Date
    }],
    resolvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    resolvedAt: Date
  },
  amount: {
    type: Number,
    required: true
  },
  escrowHeld: {
    type: Boolean,
    default: true
  },
  escalatedToAdmin: {
    type: Boolean,
    default: false
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },
  deadlineForResponse: {
    type: Date
  },
  lastActivityAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Indexes for better query performance
disputeSchema.index({ status: 1 });
disputeSchema.index({ job: 1 });
disputeSchema.index({ client: 1 });
disputeSchema.index({ freelancer: 1 });
disputeSchema.index({ escalatedToAdmin: 1 });
disputeSchema.index({ priority: 1 });
disputeSchema.index({ createdAt: -1 });
disputeSchema.index({ lastActivityAt: -1 });

// Update lastActivityAt on any changes
disputeSchema.pre('save', function(next) {
  this.lastActivityAt = new Date();
  next();
});

// Method to check if dispute needs attention
disputeSchema.methods.needsAttention = function() {
  if (this.status !== 'open') return false;

  const daysSinceLastActivity = (Date.now() - this.lastActivityAt) / (1000 * 60 * 60 * 24);
  
  switch (this.priority) {
    case 'urgent':
      return daysSinceLastActivity > 1;
    case 'high':
      return daysSinceLastActivity > 2;
    case 'medium':
      return daysSinceLastActivity > 4;
    case 'low':
      return daysSinceLastActivity > 7;
    default:
      return false;
  }
};

// Method to check if deadline is approaching
disputeSchema.methods.isDeadlineApproaching = function() {
  if (!this.deadlineForResponse) return false;
  
  const hoursUntilDeadline = (this.deadlineForResponse - Date.now()) / (1000 * 60 * 60);
  return hoursUntilDeadline > 0 && hoursUntilDeadline < 24;
};

// Automatically escalate to admin based on conditions
disputeSchema.methods.shouldEscalateToAdmin = function() {
  if (this.escalatedToAdmin) return false;

  return (
    this.amount >= 1000 || // High value disputes
    this.messages.length >= 10 || // Many back-and-forth messages
    this.evidences.length >= 5 || // Multiple evidence submissions
    (Date.now() - this.createdAt) / (1000 * 60 * 60 * 24) > 7 // Open for more than 7 days
  );
};

const Dispute = mongoose.model('Dispute', disputeSchema);

export default Dispute;
