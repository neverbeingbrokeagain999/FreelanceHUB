import User from '../models/User.js';
import Job from '../models/Job.js';
import Transaction from '../models/Transaction.js';
import Dispute from '../models/Dispute.js';
import AuditLog from '../models/AuditLog.js';
import Notification from '../models/Notification.js';
import logger from '../config/logger.js';
import { errorResponse } from '../utils/errorHandler.js';

// Dashboard Stats
export const getDashboardStats = async (req, res) => {
  try {
    const [users, jobs, transactions, disputes] = await Promise.all([
      User.countDocuments(),
      Job.countDocuments(),
      Transaction.countDocuments(),
      Dispute.countDocuments({ status: 'opened' })
    ]);

    // Group users by role
    const usersByRole = await User.aggregate([
      { $group: { _id: '$role', count: { $sum: 1 } } }
    ]);

    const roleStats = {};
    usersByRole.forEach(stat => {
      roleStats[stat._id] = stat.count;
    });

    // Get job stats
    const jobsByStatus = await Job.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);

    const jobStatusStats = {};
    jobsByStatus.forEach(stat => {
      jobStatusStats[stat._id] = stat.count;
    });

    // Get financial stats
    const financialStats = await Transaction.aggregate([
      { 
        $group: {
          _id: null,
          totalAmount: { $sum: '$amount.value' },
          avgAmount: { $avg: '$amount.value' }
        }
      }
    ]).then(result => result[0] || { totalAmount: 0, avgAmount: 0 });

    res.json({
      userStats: {
        total: users,
        ...roleStats
      },
      jobStats: {
        total: jobs,
        ...jobStatusStats
      },
      financialStats: {
        totalTransactions: transactions,
        totalAmount: financialStats.totalAmount,
        averageAmount: Math.round(financialStats.avgAmount * 100) / 100
      },
      disputeStats: {
        openDisputes: disputes
      }
    });
  } catch (error) {
    logger.error('Get dashboard stats error:', error);
    return errorResponse(res, 500, 'Error getting dashboard stats');
  }
};

// User Management
export const getUsers = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    
    const query = {};
    if (req.query.role) {
      query.role = req.query.role;
    }

    const [users, total] = await Promise.all([
      User.find(query)
        .select('-password')
        .skip((page - 1) * limit)
        .limit(limit)
        .sort('-createdAt'),
      User.countDocuments(query)
    ]);

    res.json({
      data: users,
      pagination: {
        total,
        pages: Math.ceil(total / limit),
        page
      }
    });
  } catch (error) {
    logger.error('Get users error:', error);
    return errorResponse(res, 500, 'Error getting users');
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
    logger.error('Get user error:', error);
    return errorResponse(res, 500, 'Error getting user');
  }
};

export const updateUser = async (req, res) => {
  try {
    // Validate role if being updated
    if (req.body.role && !['admin', 'client', 'freelancer'].includes(req.body.role)) {
      return errorResponse(res, 400, 'Invalid role specified');
    }

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true, runValidators: true }
    ).select('-password');

    if (!user) {
      return errorResponse(res, 404, 'User not found');
    }

    await AuditLog.logUserAction({
      event: 'user_update',
      action: 'update',
      actor: {
        userId: req.user._id,
        email: req.user.email,
        role: req.user.role
      },
      target: {
        model: 'User',
        documentId: req.params.id,
        previousState: user.toObject(),
        newState: req.body
      },
      description: `User ${req.params.id} updated by admin ${req.user._id}`
    });

    res.json({ user });
  } catch (error) {
    logger.error('Update user error:', error);
    return errorResponse(res, 500, 'Error updating user');
  }
};

export const deleteUser = async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) {
      return errorResponse(res, 404, 'User not found');
    }

    await AuditLog.logUserAction({
      event: 'user_delete',
      action: 'delete',
      actor: {
        userId: req.user._id,
        email: req.user.email,
        role: req.user.role
      },
      target: {
        model: 'User',
        documentId: req.params.id,
        previousState: user.toObject()
      },
      description: `User ${req.params.id} deleted by admin ${req.user._id}`
    });

    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    logger.error('Delete user error:', error);
    return errorResponse(res, 500, 'Error deleting user');
  }
};

// Transaction Management
export const getTransactions = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    
    const [transactions, total] = await Promise.all([
      Transaction.find()
        .populate('sender.user recipient.user', 'name email')
        .skip((page - 1) * limit)
        .limit(limit)
        .sort('-createdAt'),
      Transaction.countDocuments()
    ]);

    res.json({
      data: transactions,
      pagination: {
        total,
        pages: Math.ceil(total / limit),
        page
      }
    });
  } catch (error) {
    logger.error('Get transactions error:', error);
    return errorResponse(res, 500, 'Error getting transactions');
  }
};

// Dispute Management
export const getDisputes = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    
    const [disputes, total] = await Promise.all([
      Dispute.find()
        .populate('initiator.user respondent.user', 'name email')
        .skip((page - 1) * limit)
        .limit(limit)
        .sort('-createdAt'),
      Dispute.countDocuments()
    ]);

    res.json({
      data: disputes,
      pagination: {
        total,
        pages: Math.ceil(total / limit),
        page
      }
    });
  } catch (error) {
    logger.error('Get disputes error:', error);
    return errorResponse(res, 500, 'Error getting disputes');
  }
};

export const resolveDispute = async (req, res) => {
  try {
    const dispute = await Dispute.findByIdAndUpdate(
      req.params.id,
      { 
        $set: { 
          status: 'resolved',
          'resolution.outcome': 'resolved_mutually',
          'resolution.description': req.body.resolution,
          'resolution.resolvedBy': req.user._id,
          'resolution.resolvedAt': new Date()
        }
      },
      { new: true }
    ).populate('initiator.user respondent.user', 'name email');

    if (!dispute) {
      return errorResponse(res, 404, 'Dispute not found');
    }

    // Create notification for involved parties
    await Notification.insertMany([
      {
        recipient: dispute.initiator.user,
        title: 'Dispute Resolved',
        message: `Your dispute has been resolved: ${req.body.resolution}`,
        type: 'dispute',
        category: 'info',
        delivery: {
          channels: [{
            type: 'in_app'
          }]
        }
      },
      {
        recipient: dispute.respondent.user,
        title: 'Dispute Resolved',
        message: `Your dispute has been resolved: ${req.body.resolution}`,
        type: 'dispute',
        category: 'info',
        delivery: {
          channels: [{
            type: 'in_app'
          }]
        }
      }
    ]);

    await AuditLog.logUserAction({
      event: 'dispute_resolve',
      action: 'update',
      category: 'dispute',
      actor: {
        userId: req.user._id,
        email: req.user.email,
        role: req.user.role
      },
      target: {
        model: 'Dispute',
        documentId: req.params.id,
        previousState: dispute.toObject()
      },
      description: `Dispute ${req.params.id} resolved by admin ${req.user._id}`
    });

    res.json(dispute);
  } catch (error) {
    logger.error('Resolve dispute error:', error);
    return errorResponse(res, 500, 'Error resolving dispute');
  }
};

// Notification Management
export const getNotifications = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    
    const [notifications, total] = await Promise.all([
      Notification.find()
        .populate('recipient', 'name email')
        .skip((page - 1) * limit)
        .limit(limit)
        .sort('-createdAt'),
      Notification.countDocuments()
    ]);

    res.json({
      data: notifications,
      pagination: {
        total,
        pages: Math.ceil(total / limit),
        page
      }
    });
  } catch (error) {
    logger.error('Get notifications error:', error);
    return errorResponse(res, 500, 'Error getting notifications');
  }
};

export const markNotificationRead = async (req, res) => {
  try {
    const notification = await Notification.findByIdAndUpdate(
      req.params.id,
      { $set: { 'status.isRead': true, 'status.readAt': new Date() } },
      { new: true }
    );

    if (!notification) {
      return errorResponse(res, 404, 'Notification not found');
    }

    res.json(notification);
  } catch (error) {
    logger.error('Mark notification read error:', error);
    return errorResponse(res, 500, 'Error updating notification');
  }
};

// Audit Logs
export const getAuditLogs = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    
    const [logs, total] = await Promise.all([
      AuditLog.find()
        .populate('actor.userId', 'name email')
        .skip((page - 1) * limit)
        .limit(limit)
        .sort('-createdAt'),
      AuditLog.countDocuments()
    ]);

    res.json({
      data: logs,
      pagination: {
        total,
        pages: Math.ceil(total / limit),
        page
      }
    });
  } catch (error) {
    logger.error('Get audit logs error:', error);
    return errorResponse(res, 500, 'Error getting audit logs');
  }
};
