import mongoose from 'mongoose';
import crypto from 'crypto';
import logger from '../config/logger.js';

const twoFactorAuthSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  secret: {
    type: String,
    required: true
  },
  backupCodes: [{
    code: String,
    used: {
      type: Boolean,
      default: false
    }
  }],
  enabled: {
    type: Boolean,
    default: false
  },
  lastUsed: Date,
  verificationAttempts: {
    count: {
      type: Number,
      default: 0
    },
    lastAttempt: Date,
    lockedUntil: Date
  }
}, {
  timestamps: true
});

// Indexes
twoFactorAuthSchema.index({ user: 1 });
twoFactorAuthSchema.index({ 'verificationAttempts.lockedUntil': 1 });

// Methods
twoFactorAuthSchema.methods = {
  // Generate new secret and backup codes
  generateCredentials: async function() {
    try {
      // Generate secret
      this.secret = crypto.randomBytes(32).toString('hex');
      
      // Generate backup codes
      this.backupCodes = Array.from({ length: 10 }, () => ({
        code: crypto.randomBytes(4).toString('hex'),
        used: false
      }));

      await this.save();
      return {
        secret: this.secret,
        backupCodes: this.backupCodes.map(bc => bc.code)
      };
    } catch (error) {
      logger.error('Error generating 2FA credentials:', error);
      throw error;
    }
  },

  // Verify TOTP token
  verifyToken: async function(token) {
    // Check if account is locked
    if (this.verificationAttempts.lockedUntil && 
        this.verificationAttempts.lockedUntil > new Date()) {
      throw new Error('Account temporarily locked. Try again later.');
    }

    // Verify token logic here (will be implemented with actual TOTP algorithm)
    const isValid = false; // Placeholder

    // Update verification attempts
    if (!isValid) {
      this.verificationAttempts.count += 1;
      this.verificationAttempts.lastAttempt = new Date();

      // Lock account after 5 failed attempts
      if (this.verificationAttempts.count >= 5) {
        this.verificationAttempts.lockedUntil = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes
      }

      await this.save();
      throw new Error('Invalid verification code');
    }

    // Reset attempts on successful verification
    this.verificationAttempts.count = 0;
    this.verificationAttempts.lastAttempt = new Date();
    this.verificationAttempts.lockedUntil = null;
    this.lastUsed = new Date();
    await this.save();

    return true;
  },

  // Verify backup code
  verifyBackupCode: async function(code) {
    const backupCode = this.backupCodes.find(bc => bc.code === code && !bc.used);
    
    if (!backupCode) {
      throw new Error('Invalid or used backup code');
    }

    backupCode.used = true;
    await this.save();
    return true;
  }
};

const TwoFactorAuth = mongoose.model('TwoFactorAuth', twoFactorAuthSchema);
export default TwoFactorAuth;
