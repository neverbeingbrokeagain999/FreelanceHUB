import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { getConfig } from '../config/index.js';

const config = getConfig();

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
    minlength: [2, 'Name must be at least 2 characters long'],
    maxlength: [50, 'Name cannot exceed 50 characters']
  },

  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    trim: true,
    lowercase: true,
    match: [
      /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
      'Please provide a valid email address'
    ]
  },

  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [8, 'Password must be at least 8 characters long'],
    maxlength: [128, 'Password cannot exceed 128 characters'],
    select: false // Don't include password by default in queries
  },

  roles: {
    type: [String],
    enum: {
      values: ['admin', 'freelancer', 'client'],
      message: 'Invalid role specified'
    },
    default: ['freelancer'],
    validate: {
      validator: function(roles) {
        // Check for duplicate roles
        return new Set(roles).size === roles.length;
      },
      message: 'Duplicate roles are not allowed'
    }
  },

  isActive: {
    type: Boolean,
    default: true
  },

  resetPasswordToken: String,
  resetPasswordExpires: Date,
  
  lastLogin: Date,
  failedLoginAttempts: {
    type: Number,
    default: 0
  },
  lockoutUntil: Date,

  profile: {
    avatar: String,
    bio: String,
    location: String,
    timezone: String,
    language: String,
    social: {
      linkedin: String,
      github: String,
      twitter: String,
      website: String
    }
  }
}, {
  timestamps: true
});

// Pre-save middleware to hash password
userSchema.pre('save', async function(next) {
  // Only hash if password is modified
  if (!this.isModified('password')) return next();

  try {
    // Generate salt and hash password
    const salt = await bcrypt.genSalt(config.security.bcryptRounds);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Method to compare password
userSchema.methods.comparePassword = async function(candidatePassword) {
  try {
    if (!this.password) {
      throw new Error('Password field not loaded');
    }
    const isMatch = await bcrypt.compare(candidatePassword, this.password);
    return isMatch;
  } catch (error) {
    console.error('Password comparison error:', error);
    throw new Error('Error comparing passwords');
  }
};

// Method to check if user has a specific role
userSchema.methods.hasRole = function(role) {
  return this.roles.includes(role.toLowerCase());
};

// Method to handle failed login attempt
userSchema.methods.handleFailedLogin = async function() {
  this.failedLoginAttempts += 1;
  
  if (this.failedLoginAttempts >= config.auth.loginAttempts.maxAttempts) {
    this.lockoutUntil = new Date(Date.now() + config.auth.loginAttempts.windowMs);
  }
  
  await this.save();
};

// Method to reset failed login attempts
userSchema.methods.resetLoginAttempts = async function() {
  this.failedLoginAttempts = 0;
  this.lockoutUntil = undefined;
  this.lastLogin = new Date();
  await this.save();
};

// Method to check if account is locked
userSchema.methods.isAccountLocked = function() {
  return this.lockoutUntil && this.lockoutUntil > new Date();
};

// Method to create password reset token
userSchema.methods.createPasswordResetToken = function() {
  // Generate a random token
  const resetToken = crypto.randomBytes(32).toString('hex');

  // Hash token and set to resetPasswordToken field
  this.resetPasswordToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');

  // Set expire time to 1 hour from now
  this.resetPasswordExpires = Date.now() + 3600000; // 1 hour

  return resetToken;
};

// Virtual for full name
userSchema.virtual('fullName').get(function() {
  return this.name;
});

// Ensure virtuals are included in JSON output
userSchema.set('toJSON', {
  virtuals: true,
  transform: function(doc, ret) {
    delete ret.password;
    delete ret.resetPasswordToken;
    delete ret.resetPasswordExpires;
    delete ret.__v;
    return ret;
  }
});

const User = mongoose.model('User', userSchema);

export default User;
