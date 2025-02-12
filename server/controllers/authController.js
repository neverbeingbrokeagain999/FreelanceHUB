import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { getConfig } from '../config/index.js';
import { errorResponse } from '../utils/errorHandler.js';

const config = getConfig();

/**
 * Register a new user
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const register = async (req, res) => {
  try {
    const { name, email, password, roles } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return errorResponse(res, 400, 'User already exists with this email');
    }

    // Normalize roles to lowercase
    const normalizedRoles = roles.map(role => role.toLowerCase());

    // Check for admin role
    if (normalizedRoles.includes('admin')) {
      if (!config.auth.allowAdminRegistration) {
        return errorResponse(res, 403, 'Admin registration is not allowed');
      }
    }

    // Create new user
    const user = await User.create({
      name,
      email,
      password,
      roles: normalizedRoles
    });

    // Generate JWT token
    const token = jwt.sign(
      { id: user._id },
      config.jwt.secret,
      { expiresIn: config.jwt.expiresIn }
    );

    // Send response
    res.status(201).json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        roles: user.roles
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    return errorResponse(res, 500, 'Error registering user');
  }
};

/**
 * Login user
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    console.log('Login attempt for email:', email);

    // Find user and include password for verification
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      console.log('User not found:', email);
      return errorResponse(res, 401, 'Invalid credentials');
    }

    // Verify password
    try {
      const isMatch = await user.comparePassword(password);
      if (!isMatch) {
        console.log('Invalid password for user:', email);
        return errorResponse(res, 401, 'Invalid credentials');
      }
    } catch (err) {
      console.error('Password comparison error:', err);
      return errorResponse(res, 500, 'Error verifying credentials');
    }

    // Check if user is active
    if (!user.isActive) {
      console.log('Deactivated account attempt:', email);
      return errorResponse(res, 403, 'Account is deactivated');
    }

    // Log successful authentication
    console.log('Successful login for user:', email);

    // Generate JWT token
    try {
      const token = jwt.sign(
        { id: user._id },
        config.jwt.secret,
        { expiresIn: config.jwt.expiresIn }
      );

      // Send response
      res.json({
        "success": true,
        "token": token,
        "user": {
          "id": user._id,
          "name": user.name,
          "email": user.email,
          "roles": user.roles
        }
      });
    } catch (err) {
      console.error('JWT signing error:', err);
      return errorResponse(res, 500, 'Error generating authentication token');
    }
  } catch (error) {
    console.error('Login error:', error);
    return errorResponse(res, 500, 'Error during login');
  }
};

/**
 * Get current user profile
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    if (!user) {
      return errorResponse(res, 404, 'User not found');
    }

    res.json({
      "success": true,
      "user": {
        "id": user._id,
        "name": user.name,
        "email": user.email,
        "roles": user.roles,
        "createdAt": user.createdAt,
        "updatedAt": user.updatedAt
      }
    });
  } catch (error) {
    console.error('Get profile error:', error);
    return errorResponse(res, 500, 'Error fetching user profile');
  }
};

/**
 * Update user password
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const updatePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    const user = await User.findById(req.user.id).select('+password');
    if (!user) {
      return errorResponse(res, 404, 'User not found');
    }

    // Verify current password
    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return errorResponse(res, 401, 'Current password is incorrect');
    }

    // Update password
    user.password = newPassword;
    await user.save();

    res.json({
      success: true,
      message: 'Password updated successfully'
    });
  } catch (error) {
    console.error('Update password error:', error);
    return errorResponse(res, 500, 'Error updating password');
  }
};

/**
 * Logout user (blacklist token)
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const logout = async (req, res) => {
  try {
    res.json({
      success: true,
      message: 'Logged out successfully'
    });
  } catch (error) {
    console.error('Logout error:', error);
    return errorResponse(res, 500, 'Error during logout');
  }
};

/**
 * Handle forgot password request
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    
    const user = await User.findOne({ email });
    if (!user) {
      // Send success even if user not found for security
      return res.json({
        success: true,
        message: 'If a user exists with this email, a password reset link will be sent'
      });
    }

    // Generate reset token
    const resetToken = user.createPasswordResetToken();
    await user.save();

    // In production, send email with reset token
    // For development, just return the token
    if (config.app.environment === 'production') {
      // TODO: Implement email sending
      return res.json({
        success: true,
        message: 'Password reset email sent'
      });
    } else {
      return res.json({
        success: true,
        message: 'Password reset token generated',
        resetToken // Only include in development
      });
    }
  } catch (error) {
    console.error('Forgot password error:', error);
    return errorResponse(res, 500, 'Error processing forgot password request');
  }
};

/**
 * Reset password using token
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const resetPassword = async (req, res) => {
  try {
    const { token, newPassword } = req.body;

    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpire: { $gt: Date.now() }
    });

    if (!user) {
      return errorResponse(res, 400, 'Invalid or expired reset token');
    }

    // Update password
    user.password = newPassword;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save();

    res.json({
      success: true,
      message: 'Password reset successful'
    });
  } catch (error) {
    console.error('Reset password error:', error);
    return errorResponse(res, 500, 'Error resetting password');
  }
};

/**
 * Update user email
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const updateEmail = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findById(req.user.id).select('+password');
    if (!user) {
      return errorResponse(res, 404, 'User not found');
    }

    // Verify password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return errorResponse(res, 401, 'Password is incorrect');
    }

    // Check if email already taken
    const existingUser = await User.findOne({ email });
    if (existingUser && existingUser._id.toString() !== user._id.toString()) {
      return errorResponse(res, 400, 'Email already in use');
    }

    user.email = email;
    await user.save();

    res.json({
      success: true,
      message: 'Email updated successfully'
    });
  } catch (error) {
    console.error('Update email error:', error);
    return errorResponse(res, 500, 'Error updating email');
  }
};

/**
 * Update user profile
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const updateProfile = async (req, res) => {
  try {
    const { name } = req.body;

    const user = await User.findById(req.user.id);
    if (!user) {
      return errorResponse(res, 404, 'User not found');
    }

    user.name = name;
    await user.save();

    res.json({
      success: true,
      message: 'Profile updated successfully',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        roles: user.roles
      }
    });
  } catch (error) {
    console.error('Update profile error:', error);
    return errorResponse(res, 500, 'Error updating profile');
  }
};

export default {
  register,
  login,
  logout,
  getMe,
  updatePassword,
  forgotPassword,
  resetPassword,
  updateEmail,
  updateProfile
};
