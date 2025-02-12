import User from '../models/User.js';
import Profile from '../models/Profile.js';
import logger from '../config/logger.js';
import { errorResponse } from '../utils/errorHandler.js';

export const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    if (!user) {
      return errorResponse(res, 404, 'User not found');
    }
    res.json({ user });
  } catch (error) {
    logger.error('Get user profile error:', error);
    return errorResponse(res, 500, 'Server error');
  }
};

export const updateProfile = async (req, res) => {
  try {
    const { name, email } = req.body;
    
    if (!name && !email) {
      return errorResponse(res, 400, 'No fields to update provided');
    }

    if (name && (typeof name !== 'string' || name.length < 2)) {
      return errorResponse(res, 400, 'Name must be at least 2 characters long');
    }

    if (email && (typeof email !== 'string' || !email.includes('@'))) {
      return errorResponse(res, 400, 'Invalid email format');
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      return errorResponse(res, 404, 'User not found');
    }

    if (name) user.name = name;
    if (email) {
      const existingUser = await User.findOne({ email, _id: { $ne: user._id } });
      if (existingUser) {
        return errorResponse(res, 400, 'Email already in use');
      }
      user.email = email;
    }

    await user.save();
    const updatedUser = await User.findById(user._id).select('-password');
    res.json({ user: updatedUser });
  } catch (error) {
    logger.error('Update user profile error:', error);
    return errorResponse(res, 500, 'Server error');
  }
};

export const getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    if (!user) {
      return errorResponse(res, 404, 'User not found');
    }
    res.json({ user });
  } catch (error) {
    logger.error('Get user by ID error:', error);
    return errorResponse(res, 500, 'Server error');
  }
};

export const getAllUsers = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const role = req.query.role;

    const query = role ? { role } : {};
    
    const [users, total] = await Promise.all([
      User.find(query)
        .select('-password')
        .skip((page - 1) * limit)
        .limit(limit),
      User.countDocuments(query)
    ]);

    res.json({
      data: users,
      pagination: {
        total,
        page,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    logger.error('Get all users error:', error);
    return errorResponse(res, 500, 'Server error');
  }
};

export const deleteUser = async (req, res) => {
  try {
    // Check if user is admin or trying to delete their own account
    if (req.user.role !== 'admin' && req.user.id !== req.params.id) {
      return errorResponse(res, 403, 'Not authorized to delete this user');
    }

    const user = await User.findById(req.params.id);
    if (!user) {
      return errorResponse(res, 404, 'User not found');
    }

    // Delete associated profiles
    await Profile.deleteMany({ user: user._id });
    await user.deleteOne();

    res.json({ message: 'User account deleted successfully' });
  } catch (error) {
    logger.error('Delete user error:', error);
    return errorResponse(res, 500, 'Server error');
  }
};
