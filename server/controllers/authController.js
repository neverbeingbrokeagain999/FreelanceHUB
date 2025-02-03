import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { User } from '../models/User.js';
import { Profile } from '../models/Profile.js';
import { errorResponse } from '../utils/errorHandler.js';
import { AuditLog } from '../models/AuditLog.js';
import logger from '../config/logger.js';

export const register = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    // Validate required fields
    if (!name || !email || !password || !role) {
      return errorResponse(res, 400, 'Please provide all required fields');
    }

    // Check if user exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return errorResponse(res, 400, 'User already exists');
    }

    // Create user
    const user = new User({
      name,
      email,
      role,
      password
    });

    await user.save();

    // Create profile
    const profile = new Profile({
      user: user._id,
      name,
      title: 'New Member', // Default professional title
      bio: 'Hello! I am new here.' // Default bio
    });

    await profile.save();

    // Update user with profile reference
    user.profile = profile._id;
    await user.save();

    // Generate token
    const token = generateToken(user);

    // Log registration
    await AuditLog.logUserAction({
      event: 'user-registered',
      category: 'auth',
      severity: 'info',
      actor: {
        userId: user._id,
        email: user.email,
        role: user.role,
        ip: req.ip,
        userAgent: req.headers['user-agent']
      },
      status: 'success',
      description: `User ${user.email} registered successfully`
    });

    // Send response
    // Select user data excluding password
    const userData = await User.findById(user._id)
      .select('-password')
      .lean();

    res.status(201).json({
      success: true,
      token,
      user: {
        id: userData._id,
        name: userData.name,
        email: userData.email,
        role: userData.role
      }
    });
  } catch (error) {
    logger.error('Registration error:', error);
    return errorResponse(res, 500, 'Error registering user');
  }
};

export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    // Validate email
    if (!email) {
      return errorResponse(res, 400, 'Please provide an email address');
    }

    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      return errorResponse(res, 404, 'No user found with this email');
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    user.resetPasswordToken = resetToken;
    user.resetPasswordExpire = Date.now() + 3600000; // 1 hour
    await user.save();

    // Log password reset request
    await AuditLog.logUserAction({
      event: 'password-reset-requested',
      category: 'auth',
      severity: 'info',
      actor: {
        userId: user._id,
        email: user.email,
        ip: req.ip,
        userAgent: req.headers['user-agent']
      },
      status: 'success',
      description: `Password reset requested for ${user.email}`
    });

    res.json({
      success: true,
      message: 'Password reset email sent'
    });
  } catch (error) {
    logger.error('Forgot password error:', error);
    return errorResponse(res, 500, 'Error processing password reset');
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate required fields
    if (!email || !password) {
      return errorResponse(res, 400, 'Please provide email and password');
    }

    // Check if user exists
    const user = await User.findOne({ email });
    if (!user) {
      await logFailedLogin(req, 'user-not-found', null);
      return errorResponse(res, 401, 'Invalid credentials');
    }

    // Check password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      await logFailedLogin(req, 'invalid-password', user._id);
      return errorResponse(res, 401, 'Invalid credentials');
    }

    // Generate token
    const token = generateToken(user);

    // Log successful login
    await AuditLog.logUserAction({
      event: 'user-login',
      category: 'auth',
      severity: 'info',
      actor: {
        userId: user._id,
        email: user.email,
        role: user.role,
        ip: req.ip,
        userAgent: req.headers['user-agent']
      },
      status: 'success',
      description: `User ${user.email} logged in successfully`
    });

    // Send response
    res.json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    logger.error('Login error:', error);
    return errorResponse(res, 500, 'Error logging in');
  }
};

export const getCurrentUser = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    if (!user) {
      return errorResponse(res, 404, 'User not found');
    }

    res.json(user);
  } catch (error) {
    logger.error('Get current user error:', error);
    return errorResponse(res, 500, 'Error fetching user data');
  }
};

export const updatePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    // Validate input
    if (!currentPassword || !newPassword) {
      return errorResponse(res, 400, 'Please provide current and new password');
    }

    // Get user
    const user = await User.findById(req.user.id);
    if (!user) {
      return errorResponse(res, 404, 'User not found');
    }

    // Verify current password
    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return errorResponse(res, 400, 'Current password is incorrect');
    }

    // Update password - will be hashed by pre-save hook
    user.password = newPassword;
    user.tokenVersion += 1; // Invalidate existing tokens
    await user.save();

    // Log password update
    await AuditLog.logUserAction({
      event: 'password-updated',
      category: 'auth',
      severity: 'info',
      actor: {
        userId: user._id,
        email: user.email,
        role: user.role,
        ip: req.ip,
        userAgent: req.headers['user-agent']
      },
      status: 'success',
      description: `Password updated for user ${user.email}`
    });

    res.json({
      success: true,
      message: 'Password updated successfully'
    });
  } catch (error) {
    logger.error('Update password error:', error);
    return errorResponse(res, 500, 'Error updating password');
  }
};

export const refreshToken = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    const token = generateToken(user);
    res.json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    logger.error('Error refreshing token:', error);
    return errorResponse(res, 500, 'Error refreshing token');
  }
};

// Helper Functions
const generateToken = (user) => {
  const secret = process.env.JWT_SECRET || 'test-jwt-secret-key-123'; // Fallback for tests
  return jwt.sign(
    {
      id: user._id,
      email: user.email,
      role: user.role,
      tokenVersion: user.tokenVersion || 0 // Default to 0 if not set
    },
    secret,
    { expiresIn: '24h' }
  );
};

export const resetPassword = async (req, res) => {
  try {
    const { password } = req.body;
    const { token } = req.params;

    // Validate password
    if (!password) {
      return errorResponse(res, 400, 'Please provide a new password');
    }

    // Find user with valid reset token
    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpire: { $gt: Date.now() }
    });

    if (!user) {
      return errorResponse(res, 400, 'Invalid or expired reset token');
    }

    // Update password - will be hashed by pre-save hook
    user.password = password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    user.tokenVersion += 1; // Invalidate existing tokens
    await user.save();

    // Log password reset
    await AuditLog.logUserAction({
      event: 'password-reset-complete',
      category: 'auth',
      severity: 'info',
      actor: {
        userId: user._id,
        email: user.email,
        ip: req.ip,
        userAgent: req.headers['user-agent']
      },
      status: 'success',
      description: `Password reset completed for user ${user.email}`
    });

    res.json({
      success: true,
      message: 'Password reset successful'
    });
  } catch (error) {
    logger.error('Reset password error:', error);
    return errorResponse(res, 500, 'Error resetting password');
  }
};

export const verifyEmail = async (req, res) => {
  try {
    const { token } = req.params;

    // Find user with valid verification token
    const user = await User.findOne({ emailVerificationToken: token });
    if (!user) {
      return errorResponse(res, 400, 'Invalid verification token');
    }

    // Update user status
    user.emailVerified = true;
    user.emailVerificationToken = undefined;
    await user.save();

    // Log email verification
    await AuditLog.logUserAction({
      event: 'email-verified',
      category: 'auth',
      severity: 'info',
      actor: {
        userId: user._id,
        email: user.email,
        ip: req.ip,
        userAgent: req.headers['user-agent']
      },
      status: 'success',
      description: `Email verified for user ${user.email}`
    });

    res.json({
      success: true,
      message: 'Email verified successfully'
    });
  } catch (error) {
    logger.error('Email verification error:', error);
    return errorResponse(res, 500, 'Error verifying email');
  }
};

export const resendVerification = async (req, res) => {
  try {
    // Get user from protected route middleware
    const user = await User.findById(req.user.id);
    if (!user) {
      return errorResponse(res, 404, 'User not found');
    }

    // Check if already verified
    if (user.emailVerified) {
      return errorResponse(res, 400, 'Email already verified');
    }

    // Generate new verification token
    const verificationToken = crypto.randomBytes(32).toString('hex');
    user.emailVerificationToken = verificationToken;
    await user.save();

    // Log verification resend
    await AuditLog.logUserAction({
      event: 'verification-resent',
      category: 'auth',
      severity: 'info',
      actor: {
        userId: user._id,
        email: user.email,
        ip: req.ip,
        userAgent: req.headers['user-agent']
      },
      status: 'success',
      description: `Verification email resent for user ${user.email}`
    });

    res.json({
      success: true,
      message: 'Verification email resent'
    });
  } catch (error) {
    logger.error('Resend verification error:', error);
    return errorResponse(res, 500, 'Error resending verification');
  }
};

const logFailedLogin = async (req, reason, userId = null) => {
  try {
    const logData = {
      event: 'login-failed',
      category: 'auth',
      severity: 'warning',
      actor: {
        userId: userId || 'anonymous',
        ip: req.ip,
        userAgent: req.headers['user-agent']
      },
      metadata: {
        reason
      },
      status: 'failure',
      description: `Login failed: ${reason}`
    };

    await AuditLog.logUserAction(logData);
  } catch (error) {
    logger.error('Error logging failed login:', error);
  }
};
