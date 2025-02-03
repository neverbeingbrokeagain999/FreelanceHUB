import express from 'express';
import { protect as auth } from '../middleware/auth.js';
import { errorResponse } from '../utils/errorHandler.js';
import {
  getDashboardStats,
  getUsers,
  getUserById,
  updateUser,
  deleteUser,
  getTransactions,
  getDisputes,
  resolveDispute,
  getNotifications,
  markNotificationRead,
  getAuditLogs
} from '../controllers/adminController.js';

const router = express.Router();

// Admin middleware
const adminOnly = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return errorResponse(res, 403, 'Admin access required');
  }
  next();
};

// Dashboard Routes
router.get('/dashboard/stats', auth, adminOnly, getDashboardStats);

// User Management Routes
router.get('/users', auth, adminOnly, getUsers);
router.get('/users/:id', auth, adminOnly, getUserById);
router.put('/users/:id', auth, adminOnly, updateUser);
router.delete('/users/:id', auth, adminOnly, deleteUser);

// Transaction Management Routes
router.get('/transactions', auth, adminOnly, getTransactions);

// Dispute Management Routes
router.get('/disputes', auth, adminOnly, getDisputes);
router.post('/disputes/:id/resolve', auth, adminOnly, resolveDispute);

// Notification Management Routes
router.get('/notifications', auth, adminOnly, getNotifications);
router.put('/notifications/:id/read', auth, adminOnly, markNotificationRead);

// Audit Log Routes
router.get('/audit-logs', auth, adminOnly, getAuditLogs);

export default router;
