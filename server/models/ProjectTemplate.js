import mongoose from 'mongoose';

const projectTemplateSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Template name is required'],
    trim: true,
    minlength: [3, 'Name must be at least 3 characters'],
    maxlength: [100, 'Name cannot be longer than 100 characters']
  },
  description: {
    type: String,
    required: [true, 'Description is required'],
    trim: true,
    minlength: [10, 'Description must be at least 10 characters'],
    maxlength: [2000, 'Description cannot be longer than 2000 characters']
  },
  category: {
    type: String,
    required: [true, 'Category is required'],
    trim: true
  },
  skills: [{
    type: String,
    trim: true
  }],
  budget: {
    min: {
      type: Number,
      required: [true, 'Minimum budget is required'],
      min: [1, 'Minimum budget must be greater than 0']
    },
    max: {
      type: Number,
      required: [true, 'Maximum budget is required'],
      validate: {
        validator: function(max) {
          return max > this.budget.min;
        },
        message: 'Maximum budget must be greater than minimum budget'
      }
    }
  },
  duration: {
    type: String,
    enum: {
      values: ['less_than_1_month', '1_to_3_months', '3_to_6_months', 'more_than_6_months'],
      message: '{VALUE} is not a valid duration'
    }
  },
  experienceLevel: {
    type: String,
    enum: {
      values: ['entry', 'intermediate', 'expert'],
      message: '{VALUE} is not a valid experience level'
    }
  },
  requirements: {
    type: String,
    trim: true,
    maxlength: [2000, 'Requirements cannot be longer than 2000 characters']
  },
  type: {
    type: String,
    enum: {
      values: ['fixed', 'hourly'],
      message: '{VALUE} is not a valid project type'
    }
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  useCount: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes
projectTemplateSchema.index({ category: 1 });
projectTemplateSchema.index({ skills: 1 });
projectTemplateSchema.index({ createdAt: -1 });
projectTemplateSchema.index({ useCount: -1 });
projectTemplateSchema.index({ name: 'text', description: 'text' });

// Virtual for formatted budget range
projectTemplateSchema.virtual('budgetRange').get(function() {
  return `$${this.budget.min} - $${this.budget.max}`;
});

// Virtual for duration display
projectTemplateSchema.virtual('durationDisplay').get(function() {
  const durations = {
    'less_than_1_month': 'Less than 1 month',
    '1_to_3_months': '1 to 3 months',
    '3_to_6_months': '3 to 6 months',
    'more_than_6_months': 'More than 6 months'
  };
  return this.duration ? durations[this.duration] : null;
});

// Middleware to format skills array before save
projectTemplateSchema.pre('save', function(next) {
  if (this.isModified('skills')) {
    // Remove duplicates and empty strings
    this.skills = [...new Set(this.skills.filter(skill => skill.trim()))];
  }
  next();
});

// Static method to get popular templates
projectTemplateSchema.statics.getPopularTemplates = async function(limit = 5) {
  return this.find({ isActive: true })
    .sort({ useCount: -1 })
    .limit(limit);
};

// Static method to get templates by category
projectTemplateSchema.statics.getByCategory = async function(category) {
  return this.find({ 
    category, 
    isActive: true 
  }).sort({ useCount: -1 });
};

// Method to increment use count
projectTemplateSchema.methods.incrementUseCount = async function() {
  this.useCount += 1;
  return this.save();
};

const ProjectTemplate = mongoose.model('ProjectTemplate', projectTemplateSchema);

export default ProjectTemplate;
