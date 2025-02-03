import mongoose from 'mongoose';
import logger from '../config/logger.js';

const skillSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  level: {
    type: String,
    enum: ['Beginner', 'Intermediate', 'Expert'],
    default: 'Intermediate'
  },
  endorsements: [{
    endorsedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    date: {
      type: Date,
      default: Date.now
    }
  }]
});

const educationSchema = new mongoose.Schema({
  institution: {
    type: String,
    required: true
  },
  degree: String,
  field: String,
  startDate: Date,
  endDate: Date,
  current: Boolean,
  description: String
});

const experienceSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  company: {
    type: String,
    required: true
  },
  startDate: Date,
  endDate: Date,
  current: Boolean,
  description: String
});

const testimonialSchema = new mongoose.Schema({
  text: {
    type: String,
    required: true,
    minlength: [10, 'Testimonial text must be at least 10 characters']
  },
  givenBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  date: {
    type: Date,
    default: Date.now
  }
});

const profileSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  title: {
    type: String,
    required: [true, 'Please provide a professional title'],
    trim: true,
    maxlength: [100, 'Title cannot be more than 100 characters']
  },
  bio: {
    type: String,
    required: [true, 'Please provide a bio'],
    trim: true,
    maxlength: [2000, 'Bio cannot be more than 2000 characters']
  },
  skills: [skillSchema],
  education: [educationSchema],
  experience: [experienceSchema],
  languages: [{
    type: String,
    trim: true
  }],
  testimonials: [testimonialSchema],
  hourlyRate: {
    type: Number,
    min: 0
  },
  availability: {
    status: {
      type: String,
      enum: ['Available', 'Busy', 'Not Available'],
      default: 'Available'
    },
    hours: {
      type: Number,
      min: 0,
      max: 168 // Max hours in a week
    }
  },
  completionStatus: {
    percentage: {
      type: Number,
      default: 0
    },
    lastUpdated: {
      type: Date,
      default: Date.now
    }
  }
}, {
  timestamps: true
});

// Indexes
profileSchema.index({ 'skills.name': 1 });
profileSchema.index({ 'availability.status': 1 });
profileSchema.index({ 'completionStatus.percentage': 1 });

// Pre-save hook to update completion status
profileSchema.pre('save', async function(next) {
  try {
    if (this.isModified()) {
      // Initialize completionStatus if not exists
      if (!this.completionStatus) {
        this.completionStatus = {
          percentage: 0,
          lastUpdated: new Date()
        };
      }

      // Update completion status
      const requiredFields = ['title', 'bio'];
      const optionalFields = ['skills', 'education', 'experience', 'languages'];
      
      let completedFields = 0;
      let totalFields = requiredFields.length;

      // Check required fields
      requiredFields.forEach(field => {
        if (this[field]) completedFields++;
      });

      // Check optional fields
      optionalFields.forEach(field => {
        if (this[field] && this[field].length > 0) {
          completedFields++;
          totalFields++;
        }
      });
      
      this.completionStatus.percentage = Math.round((completedFields / totalFields) * 100);
      this.completionStatus.lastUpdated = new Date();
    }
    next();
  } catch (error) {
    logger.error('Profile pre-save error:', error);
    next(error);
  }
});

// Methods
profileSchema.methods = {
  addSkill: function(skillData) {
    if (!this.skills) this.skills = [];
    this.skills.push(skillData);
    return this.save();
  },

  removeSkill: function(skillId) {
    this.skills = this.skills.filter(skill => skill._id.toString() !== skillId.toString());
    return this.save();
  },

  addEndorsement: function(skillId, userId) {
    const skill = this.skills.id(skillId);
    if (!skill) throw new Error('Skill not found');
    
    const existingEndorsement = skill.endorsements.find(e => 
      e.endorsedBy.toString() === userId.toString()
    );
    if (existingEndorsement) throw new Error('Already endorsed this skill');
    
    skill.endorsements.push({ endorsedBy: userId });
    return this.save();
  }
};

// Static methods
profileSchema.statics = {
  getPopulatedProfile: function(userId) {
    return this.findOne({ user: userId })
      .populate('user', 'name email role')
      .populate('skills.endorsements.endorsedBy', 'name')
      .populate('testimonials.givenBy', 'name');
  }
};

export const Profile = mongoose.model('Profile', profileSchema);
export default Profile;
