import express from 'express';
import { 
  register,
  login,
  getCurrentUser,
  updatePassword,
  forgotPassword,
  resetPassword,
  verifyEmail,
  resendVerification
} from '../controllers/authController.js';
import { 
  protect, 
  authorize, 
  requireEmailVerification, 
  authChain, 
  checkRateLimit 
} from '../middleware/auth.js';
import { User } from '../models/User.js';
import { AuditLog } from '../models/AuditLog.js';
import { errorResponse } from '../utils/errorHandler.js';

const router = express.Router();

/**
 * @route   POST /api/auth/register
 * @desc    Register a new user
 * @access  Public
 */
router.post('/register', 
  checkRateLimit(5, 60 * 60 * 1000), // 5 requests per hour
  register
);

/**
 * @route   POST /api/auth/login
 * @desc    Login user and return JWT token
 * @access  Public
 */
router.post('/login',
  checkRateLimit(10, 60 * 60 * 1000), // 10 requests per hour
  login
);

/**
 * @route   GET /api/auth/me
 * @desc    Get current user profile
 * @access  Private
 */
router.get('/me',
  protect,
  getCurrentUser
);

/**
 * @route   PUT /api/auth/password
 * @desc    Update password
 * @access  Private
 */
router.put('/password',
  authChain(
    protect,
    requireEmailVerification,
    checkRateLimit(5, 24 * 60 * 60 * 1000) // 5 requests per day
  ),
  updatePassword
);

/**
 * @route   POST /api/auth/forgot-password
 * @desc    Request password reset
 * @access  Public
 */
router.post('/forgot-password',
  checkRateLimit(3, 60 * 60 * 1000), // 3 requests per hour
  forgotPassword
);

/**
 * @route   PUT /api/auth/reset-password/:token
 * @desc    Reset password using token
 * @access  Public
 */
router.put('/reset-password/:token',
  checkRateLimit(3, 24 * 60 * 60 * 1000), // 3 requests per day
  resetPassword
);

/**
 * @route   GET /api/auth/verify-email/:token
 * @desc    Verify email address
 * @access  Public
 */
router.get('/verify-email/:token',
  verifyEmail
);

/**
 * @route   POST /api/auth/resend-verification
 * @desc    Resend verification email
 * @access  Private
 */
router.post('/resend-verification',
  authChain(
    protect,
    checkRateLimit(3, 24 * 60 * 60 * 1000) // 3 requests per day
  ),
  resendVerification
);

/**
 * @route   POST /api/auth/refresh-token
 * @desc    Refresh JWT token
 * @access  Private
 */
router.post('/refresh-token',
  protect,
  async (req, res) => {
    try {
      const user = await User.findById(req.user.id);
      const token = generateToken(user);
      res.json({ success: true, token });
    } catch (error) {
      return errorResponse(res, 500, 'Error refreshing token');
    }
  }
);

/**
 * Admin Routes
 */

/**
 * @route   GET /api/auth/users
 * @desc    Get all users (admin only)
 * @access  Private/Admin
 */
router.get('/users',
  authChain(
    protect,
    authorize('admin')
  ),
  async (req, res) => {
    try {
      const users = await User.find().select('-password');
      res.json({ success: true, users });
    } catch (error) {
      return errorResponse(res, 500, 'Error fetching users');
    }
  }
);

/**
 * @route   PUT /api/auth/users/:id/status
 * @desc    Update user status (admin only)
 * @access  Private/Admin
 */
router.put('/users/:id/status',
  authChain(
    protect,
    authorize('admin')
  ),
  async (req, res) => {
    try {
      const { status } = req.body;
      const user = await User.findById(req.params.id);
      
      if (!user) {
        return errorResponse(res, 404, 'User not found');
      }

      user.status = status;
      await user.save();

      await AuditLog.logUserAction({
        event: 'user-status-updated',
        actor: {
          userId: req.user._id,
          role: 'admin'
        },
        target: {
          userId: user._id,
          email: user.email
        },
        changes: {
          status
        }
      });

      res.json({
        success: true,
        message: 'User status updated successfully'
      });
    } catch (error) {
      return errorResponse(res, 500, 'Error updating user status');
    }
  }
);

/**
 * @route   PUT /api/auth/users/:id/role
 * @desc    Update user role (admin only)
 * @access  Private/Admin
 */
router.put('/users/:id/role',
  authChain(
    protect,
    authorize('admin')
  ),
  async (req, res) => {
    try {
      const { role } = req.body;
      const user = await User.findById(req.params.id);
      
      if (!user) {
        return errorResponse(res, 404, 'User not found');
      }

      user.role = role;
      await user.save();

      await AuditLog.logUserAction({
        event: 'user-role-updated',
        actor: {
          userId: req.user._id,
          role: 'admin'
        },
        target: {
          userId: user._id,
          email: user.email
        },
        changes: {
          role
        }
      });

      res.json({
        success: true,
        message: 'User role updated successfully'
      });
    } catch (error) {
      return errorResponse(res, 500, 'Error updating user role');
    }
  }
);

/**
 * Security Routes
 */

/**
 * @route   POST /api/auth/logout
 * @desc    Logout user (invalidate token)
 * @access  Private
 */
router.post('/logout',
  protect,
  async (req, res) => {
    try {
      const user = await User.findById(req.user.id);
      user.tokenVersion += 1;
      await user.save();

      await AuditLog.logUserAction({
        event: 'user-logout',
        actor: {
          userId: user._id,
          email: user.email,
          role: user.role,
          ip: req.ip,
          userAgent: req.headers['user-agent']
        },
        status: 'success'
      });

      res.json({
        success: true,
        message: 'Logged out successfully'
      });
    } catch (error) {
      return errorResponse(res, 500, 'Error logging out');
    }
  }
);

export default router;
