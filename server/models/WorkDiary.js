import mongoose from 'mongoose';

const screenshotSchema = new mongoose.Schema({
  url: {
    type: String,
    required: true
  },
  timestamp: {
    type: Date,
    required: true,
    default: Date.now
  },
  activityLevel: {
    type: Number, // percentage of activity (0-100)
    min: 0,
    max: 100
  },
  keystrokes: Number,
  mouseEvents: Number,
  windowTitle: String,
  applicationName: String
});

const timeBlockSchema = new mongoose.Schema({
  startTime: {
    type: Date,
    required: true
  },
  endTime: {
    type: Date,
    required: true
  },
  activity: {
    type: String,
    required: true
  },
  memo: String,
  screenshots: [screenshotSchema],
  billable: {
    type: Boolean,
    default: true
  },
  activityLevel: {
    type: Number,
    min: 0,
    max: 100,
    default: 100
  }
});

const workDiarySchema = new mongoose.Schema({
  job: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Job',
    required: true
  },
  freelancer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  date: {
    type: Date,
    required: true
  },
  timeBlocks: [timeBlockSchema],
  totalHours: {
    type: Number,
    default: 0
  },
  billableHours: {
    type: Number,
    default: 0
  },
  status: {
    type: String,
    enum: ['pending', 'submitted', 'approved', 'rejected'],
    default: 'pending'
  },
  clientFeedback: {
    comment: String,
    timestamp: Date
  },
  rejectionReason: String,
  manualTimeEntries: [{
    startTime: Date,
    endTime: Date,
    description: String,
    approved: {
      type: Boolean,
      default: false
    }
  }],
  settings: {
    screenshotInterval: {
      type: Number,
      default: 10, // minutes
      min: 1,
      max: 30
    },
    trackingEnabled: {
      type: Boolean,
      default: true
    },
    activityTrackingEnabled: {
      type: Boolean,
      default: true
    },
    blurScreenshots: {
      type: Boolean,
      default: false
    }
  },
  metadata: {
    avgActivityLevel: Number,
    totalKeystrokes: Number,
    totalMouseEvents: Number,
    activeApps: [{
      name: String,
      timeSpent: Number // in minutes
    }]
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for better query performance
workDiarySchema.index({ job: 1, freelancer: 1, date: 1 }, { unique: true });
workDiarySchema.index({ freelancer: 1, date: 1 });
workDiarySchema.index({ job: 1, date: 1 });

// Virtual for hourly rate calculation
workDiarySchema.virtual('hourlyEarnings').get(function() {
  return this.billableHours * this._hourlyRate;
});

// Middleware to calculate total and billable hours before saving
workDiarySchema.pre('save', function(next) {
  // Calculate total hours from time blocks
  this.totalHours = this.timeBlocks.reduce((total, block) => {
    const duration = (block.endTime - block.startTime) / (1000 * 60 * 60); // convert to hours
    return total + duration;
  }, 0);

  // Calculate billable hours
  this.billableHours = this.timeBlocks.reduce((total, block) => {
    if (block.billable) {
      const duration = (block.endTime - block.startTime) / (1000 * 60 * 60);
      return total + duration;
    }
    return total;
  }, 0);

  // Calculate average activity level
  const activityLevels = this.timeBlocks.map(block => block.activityLevel).filter(level => level != null);
  if (activityLevels.length > 0) {
    this.metadata.avgActivityLevel = activityLevels.reduce((sum, level) => sum + level, 0) / activityLevels.length;
  }

  next();
});

// Method to check if work diary can be submitted
workDiarySchema.methods.canSubmit = function() {
  return this.status === 'pending' && this.timeBlocks.length > 0;
};

// Method to validate manual time entry
workDiarySchema.methods.validateManualEntry = function(startTime, endTime) {
  // Check for overlapping time blocks
  return !this.timeBlocks.some(block => {
    return (startTime >= block.startTime && startTime <= block.endTime) ||
           (endTime >= block.startTime && endTime <= block.endTime);
  });
};

// Static method to get weekly summary
workDiarySchema.statics.getWeeklySummary = async function(freelancerId, startDate) {
  const endDate = new Date(startDate);
  endDate.setDate(endDate.getDate() + 7);

  return this.aggregate([
    {
      $match: {
        freelancer: new mongoose.Types.ObjectId(freelancerId),
        date: { $gte: startDate, $lt: endDate }
      }
    },
    {
      $group: {
        _id: { $dayOfWeek: '$date' },
        totalHours: { $sum: '$totalHours' },
        billableHours: { $sum: '$billableHours' },
        avgActivityLevel: { $avg: '$metadata.avgActivityLevel' }
      }
    },
    { $sort: { '_id': 1 } }
  ]);
};

const WorkDiary = mongoose.model('WorkDiary', workDiarySchema);

export default WorkDiary;
