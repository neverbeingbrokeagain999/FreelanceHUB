import express from 'express';
import { body, param, query } from 'express-validator';
import * as paymentController from '../controllers/paymentController.js';
import { protect, authorize } from '../middleware/auth.js';
import { checkRateLimit } from '../middleware/rateLimit.js';
import { validate } from '../middleware/validation/validator.js';
import Transaction from '../models/Transaction.js';
import logger from '../config/logger.js';
import { errorResponse } from '../utils/errorHandler.js';

const router = express.Router();

/**
 * @route   POST /api/payment/create-intent
 * @desc    Create payment intent
 * @access  Private
 */
router.post(
  '/create-intent',
  protect,
  checkRateLimit(100, 60 * 60 * 1000), // 100 requests per hour
  [
    body('amount').isFloat({ min: 100 }).withMessage('Amount must be at least $1.00'),
    body('currency').optional().isIn(['usd', 'eur', 'gbp', 'aud', 'cad']).withMessage('Invalid currency'),
    body('description').optional().isString().trim(),
    body('metadata').optional().isObject(),
    validate
  ],
  paymentController.createPaymentIntent
);

/**
 * @route   POST /api/payment/confirm/:transactionId
 * @desc    Confirm payment
 * @access  Private
 */
router.post(
  '/confirm/:transactionId',
  protect,
  checkRateLimit(100, 60 * 60 * 1000),
  [
    param('transactionId').isMongoId().withMessage('Invalid transaction ID'),
    body('paymentIntentId').notEmpty().withMessage('Payment intent ID is required'),
    validate
  ],
  paymentController.confirmPayment
);

/**
 * @route   POST /api/payment/refund/:transactionId
 * @desc    Process refund
 * @access  Private (Admin/Support)
 */
router.post(
  '/refund/:transactionId',
  protect,
  authorize('admin', 'support'),
  checkRateLimit(50, 60 * 60 * 1000), // 50 requests per hour
  [
    param('transactionId').isMongoId().withMessage('Invalid transaction ID'),
    body('amount').optional().isFloat({ min: 1 }).withMessage('Amount must be at least 1'),
    body('reason').isIn(['requested_by_customer', 'duplicate', 'fraudulent']).withMessage('Invalid reason'),
    validate
  ],
  paymentController.processRefund
);

/**
 * @route   GET /api/payment/transactions
 * @desc    Get user transactions
 * @access  Private
 */
router.get(
  '/transactions',
  protect,
  checkRateLimit(200, 60 * 60 * 1000), // 200 requests per hour
  [
    query('page').optional().isInt({ min: 1 }).toInt().withMessage('Page must be a positive integer'),
    query('limit').optional().isInt({ min: 1, max: 100 }).toInt().withMessage('Limit must be between 1 and 100'),
    query('startDate').optional().isISO8601().withMessage('Invalid start date'),
    query('endDate').optional().isISO8601().withMessage('Invalid end date'),
    validate
  ],
  paymentController.getTransactions
);

/**
 * @route   GET /api/payment/transactions/:id
 * @desc    Get transaction details
 * @access  Private
 */
router.get(
  '/transactions/:id',
  protect,
  checkRateLimit(200, 60 * 60 * 1000),
  [
    param('id').isMongoId().withMessage('Invalid transaction ID'),
    validate
  ],
  paymentController.getTransactionDetails
);

/**
 * @route   POST /api/payment/webhook
 * @desc    Webhook handler for Stripe events
 * @access  Public
 */
router.post(
  '/webhook',
  express.raw({ type: 'application/json' }), // Raw body for Stripe signature verification
  paymentController.handleWebhook
);

/**
 * @route   GET /api/payment/admin/transactions
 * @desc    Get all transactions (admin)
 * @access  Private (Admin)
 */
router.get(
  '/admin/transactions',
  protect,
  authorize('admin'),
  checkRateLimit(500, 60 * 60 * 1000), // 500 requests per hour
  [
    query('page').optional().isInt({ min: 1 }).toInt().withMessage('Page must be a positive integer'),
    query('limit').optional().isInt({ min: 1, max: 100 }).toInt().withMessage('Limit must be between 1 and 100'),
    query('startDate').optional().isISO8601().withMessage('Invalid start date'),
    query('endDate').optional().isISO8601().withMessage('Invalid end date'),
    query('status').optional().isIn(['pending', 'completed', 'failed', 'refunded']).withMessage('Invalid status'),
    query('type').optional().isIn(['payment', 'refund']).withMessage('Invalid type'),
    query('userId').optional().isMongoId().withMessage('Invalid user ID'),
    validate
  ],
  async (req, res) => {
    try {
      const {
        page = 1,
        limit = 50,
        startDate,
        endDate,
        status,
        type,
        userId
      } = req.query;

      const query = {};
      if (startDate && endDate) {
        query.createdAt = { $gte: new Date(startDate), $lte: new Date(endDate) };
      }
      if (status) query.status = status;
      if (type) query.type = type;
      if (userId) query.user = userId;

      const transactions = await Transaction.find(query)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .populate('user', 'name email')
        .populate('relatedTransaction', 'status amount currency');

      const total = await Transaction.countDocuments(query);

      res.json({
        success: true,
        transactions,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      });
    } catch (error) {
      logger.error('Admin transactions error:', error);
      return errorResponse(res, 500, 'Error fetching transactions');
    }
  }
);

export default router;
