import mongoose from 'mongoose';

const profileSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  type: {
    type: String,
    enum: ['freelancer', 'client'],
    required: true
  },
  // Common fields
  name: {
    type: String,
    required: true
  },
  title: String,
  bio: String,
  avatar: String,
  location: {
    country: String,
    city: String
  },
  // Verification fields
  verificationStatus: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  },
  verificationReason: String,
  verifiedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  verifiedAt: Date,
  documents: [{
    type: {
      type: String,
      required: true
    },
    url: {
      type: String,
      required: true
    },
    verified: {
      type: Boolean,
      default: false
    }
  }],
  // Freelancer specific fields
  skills: [String],
  hourlyRate: Number,
  portfolio: [{
    title: String,
    description: String,
    url: String,
    images: [String]
  }],
  education: [{
    school: String,
    degree: String,
    fieldOfStudy: String,
    from: Date,
    to: Date,
    current: Boolean,
    description: String
  }],
  experience: [{
    company: String,
    position: String,
    from: Date,
    to: Date,
    current: Boolean,
    description: String
  }],
  // Client specific fields
  company: {
    name: String,
    website: String,
    description: String,
    size: String,
    industry: String
  },
  // Payment verification
  paymentVerified: {
    type: Boolean,
    default: false
  },
  // Social profiles
  social: {
    linkedin: String,
    github: String,
    twitter: String,
    website: String
  },
  // Metrics
  completedJobs: {
    type: Number,
    default: 0
  },
  totalEarnings: {
    type: Number,
    default: 0
  },
  rating: {
    type: Number,
    min: 0,
    max: 5,
    default: 0
  },
  reviewCount: {
    type: Number,
    default: 0
  },
  // Account status
  isActive: {
    type: Boolean,
    default: true
  },
  lastActive: Date,
  // Communication preferences
  emailNotifications: {
    jobAlerts: {
      type: Boolean,
      default: true
    },
    messages: {
      type: Boolean,
      default: true
    },
    proposals: {
      type: Boolean,
      default: true
    }
  }
}, {
  timestamps: true
});

// Indexes for better query performance
profileSchema.index({ user: 1 });
profileSchema.index({ type: 1 });
profileSchema.index({ verificationStatus: 1 });
profileSchema.index({ 'location.country': 1 });
profileSchema.index({ skills: 1 });
profileSchema.index({ isActive: 1 });
profileSchema.index({ rating: -1 });
profileSchema.index({ completedJobs: -1 });

// Virtual field for full location
profileSchema.virtual('fullLocation').get(function() {
  if (this.location.city && this.location.country) {
    return `${this.location.city}, ${this.location.country}`;
  }
  return this.location.country || this.location.city || 'Location not specified';
});

// Method to check if profile is complete
profileSchema.methods.isComplete = function() {
  const requiredFields = ['name', 'bio', 'location'];
  const freelancerFields = ['skills', 'hourlyRate'];
  const clientFields = ['company.name', 'company.industry'];

  const hasRequiredFields = requiredFields.every(field => this[field]);
  
  if (this.type === 'freelancer') {
    return hasRequiredFields && freelancerFields.every(field => this[field]);
  }
  
  if (this.type === 'client') {
    return hasRequiredFields && clientFields.every(field => {
      const [parent, child] = field.split('.');
      return this[parent] && this[parent][child];
    });
  }

  return false;
};

const Profile = mongoose.model('Profile', profileSchema);

export default Profile;
