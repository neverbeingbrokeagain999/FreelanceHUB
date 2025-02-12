import User from '../models/User.js';
import Job from '../models/Job.js';
import Dispute from '../models/Dispute.js';
import AuditLog from '../models/AuditLog.js';
import Profile from '../models/Profile.js';
import { errorResponse } from '../utils/errorHandler.js';
import logger from '../config/logger.js';
import AuditService from '../services/auditService.js';

// Dashboard Analytics
export const getDashboardAnalytics = async (req, res) => {
  try {
    // Get key metrics
    const [
      totalUsers,
      activeJobs,
      openDisputes,
      pendingVerifications
    ] = await Promise.all([
      User.countDocuments({ isActive: true }),
      Job.countDocuments({ status: 'active' }),
      Dispute.countDocuments({ status: 'open' }),
      Profile.countDocuments({ verificationStatus: 'pending' })
    ]);

    // Get recent audit logs
    const recentActivity = await AuditService.getRecentActivities(5);

    res.json({
      success: true,
      data: {
        metrics: {
          totalUsers,
          activeJobs,
          openDisputes,
          pendingVerifications
        },
        recentActivity
      }
    });
  } catch (error) {
    logger.error('Dashboard analytics error:', error);
    return errorResponse(res, 500, error.message);
  }
};

// User Management
export const listUsers = async (req, res) => {
  try {
    const { page = 1, limit = 10, search, role, status, sortBy, sortOrder } = req.query;

    const query = {};
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }
    if (role) query.roles = role;
    if (status) query.isActive = status === 'active';

    const users = await User.find(query)
      .sort({ [sortBy]: sortOrder === 'desc' ? -1 : 1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .select('-password');

    const total = await User.countDocuments(query);

    res.json({
      success: true,
      data: {
        users,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    logger.error('List users error:', error);
    return errorResponse(res, 500, error.message);
  }
};

export const updateUserStatus = async (req, res) => {
  try {
    const { userId } = req.params;
    const { status, reason } = req.body;

    const user = await User.findById(userId);
    if (!user) {
      return errorResponse(res, 404, 'User not found');
    }

    user.isActive = status === 'active';
    await user.save();

    res.json({
      success: true,
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          roles: user.roles,
          isActive: user.isActive
        }
      }
    });
  } catch (error) {
    logger.error('Update user status error:', error);
    return errorResponse(res, 500, error.message);
  }
};

export const updateUserRoles = async (req, res) => {
  try {
    const { userId } = req.params;
    const { roles, reason } = req.body;

    const user = await User.findById(userId);
    if (!user) {
      return errorResponse(res, 404, 'User not found');
    }

    // Prevent removing all admin roles if user is the last admin
    if (user.roles.includes('admin') && !roles.includes('admin')) {
      const adminCount = await User.countDocuments({ roles: 'admin' });
      if (adminCount <= 1) {
        return errorResponse(res, 400, 'Cannot remove the last admin user');
      }
    }

    user.roles = roles;
    await user.save();

    res.json({
      success: true,
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          roles: user.roles
        }
      }
    });
  } catch (error) {
    logger.error('Update user roles error:', error);
    return errorResponse(res, 500, error.message);
  }
};

// Audit Log Management
export const listAuditLogs = async (req, res) => {
  try {
    const { page, limit, userId, action, startDate, endDate, sortOrder } = req.query;

    const filters = {};
    if (userId) filters.userId = userId;
    if (action) filters.action = action;
    if (startDate || endDate) {
      filters.startDate = startDate;
      filters.endDate = endDate;
    }

    const options = {
      page: parseInt(page),
      limit: parseInt(limit),
      sortOrder
    };

    const result = await AuditService.getAuditLogs(filters, options);

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    logger.error('List audit logs error:', error);
    return errorResponse(res, 500, error.message);
  }
};

export const reviewAuditLog = async (req, res) => {
  try {
    const { logId } = req.params;
    const { notes } = req.body;

    const log = await AuditLog.findById(logId);
    if (!log) {
      return errorResponse(res, 404, 'Audit log not found');
    }

    await log.markAsReviewed(req.user.id, notes);

    res.json({
      success: true,
      message: 'Audit log marked as reviewed'
    });
  } catch (error) {
    logger.error('Review audit log error:', error);
    return errorResponse(res, 500, error.message);
  }
};

// System Configuration
export const getSystemConfig = async (req, res) => {
  try {
    const config = await SystemConfig.findOne();
    res.json({
      success: true,
      data: { config }
    });
  } catch (error) {
    logger.error('Get system config error:', error);
    return errorResponse(res, 500, error.message);
  }
};

export const updateSystemConfig = async (req, res) => {
  try {
    const { settings } = req.body;

    const config = await SystemConfig.findOneAndUpdate(
      {},
      { $set: settings },
      { new: true, upsert: true }
    );

    res.json({
      success: true,
      data: { config }
    });
  } catch (error) {
    logger.error('Update system config error:', error);
    return errorResponse(res, 500, error.message);
  }
};

// Reports
export const getRevenueReport = async (req, res) => {
  try {
    const { startDate, endDate, interval } = req.query;
    // Implementation for revenue report generation
    res.json({
      success: true,
      data: {
        // Report data
      }
    });
  } catch (error) {
    logger.error('Revenue report error:', error);
    return errorResponse(res, 500, error.message);
  }
};

export const getUserActivityReport = async (req, res) => {
  try {
    const { startDate, endDate, userType } = req.query;
    const summary = await AuditService.getUserActivitySummary(startDate, endDate);
    
    res.json({
      success: true,
      data: { summary }
    });
  } catch (error) {
    logger.error('User activity report error:', error);
    return errorResponse(res, 500, error.message);
  }
};

// Profile Verification
export const listPendingVerifications = async (req, res) => {
  try {
    const { status = 'pending', page = 1, limit = 10 } = req.query;
    
    const profiles = await Profile.find({ verificationStatus: status })
      .populate('user', 'name email')
      .skip((page - 1) * limit)
      .limit(limit)
      .sort({ createdAt: -1 });

    const total = await Profile.countDocuments({ verificationStatus: status });

    res.json({
      success: true,
      data: {
        profiles: profiles.map(profile => ({
          id: profile._id,
          name: profile.user.name,
          email: profile.user.email,
          role: profile.role,
          location: profile.location,
          skills: profile.skills,
          bio: profile.bio,
          documents: profile.documents,
          createdAt: profile.createdAt,
          avatar: profile.avatar
        })),
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    logger.error('List pending verifications error:', error);
    return errorResponse(res, 500, error.message);
  }
};

export const approveVerification = async (req, res) => {
  try {
    const { userId } = req.params;
    
    const profile = await Profile.findOne({ user: userId });
    if (!profile) {
      return errorResponse(res, 404, 'Profile not found');
    }

    profile.verificationStatus = 'approved';
    profile.verifiedAt = new Date();
    profile.verifiedBy = req.user.id;
    await profile.save();

    res.json({
      success: true,
      message: 'Profile verification approved'
    });
  } catch (error) {
    logger.error('Approve verification error:', error);
    return errorResponse(res, 500, error.message);
  }
};

export const rejectVerification = async (req, res) => {
  try {
    const { userId } = req.params;
    const { reason } = req.body;

    const profile = await Profile.findOne({ user: userId });
    if (!profile) {
      return errorResponse(res, 404, 'Profile not found');
    }

    profile.verificationStatus = 'rejected';
    profile.rejectionReason = reason;
    profile.rejectedAt = new Date();
    profile.rejectedBy = req.user.id;
    await profile.save();

    res.json({
      success: true,
      message: 'Profile verification rejected'
    });
  } catch (error) {
    logger.error('Reject verification error:', error);
    return errorResponse(res, 500, error.message);
  }
};

export default {
  getDashboardAnalytics,
  listUsers,
  updateUserStatus,
  updateUserRoles,
  listAuditLogs,
  reviewAuditLog,
  getSystemConfig,
  updateSystemConfig,
  getRevenueReport,
  getUserActivityReport,
  listPendingVerifications,
  approveVerification,
  rejectVerification
};
