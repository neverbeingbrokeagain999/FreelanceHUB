import express from 'express';
import * as paymentController from '../controllers/paymentController.js';
import { protect, authorize, authChain, checkRateLimit } from '../middleware/auth.js';
import { validateRequest } from '../middleware/validation/validator.js';
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
  authChain(
    protect,
    checkRateLimit(100, 60 * 60 * 1000) // 100 requests per hour
  ),
  validateRequest({
    body: {
      amount: {
        type: 'number',
        required: true,
        min: 100 // Minimum 1 USD
      },
      currency: {
        type: 'string',
        required: false,
        default: 'usd',
        enum: ['usd', 'eur', 'gbp', 'aud', 'cad']
      },
      description: {
        type: 'string',
        required: false
      },
      metadata: {
        type: 'object',
        required: false
      }
    }
  }),
  paymentController.createPaymentIntent
);

/**
 * @route   POST /api/payment/confirm/:transactionId
 * @desc    Confirm payment
 * @access  Private
 */
router.post(
  '/confirm/:transactionId',
  authChain(
    protect,
    checkRateLimit(100, 60 * 60 * 1000)
  ),
  validateRequest({
    params: {
      transactionId: {
        type: 'string',
        required: true,
        pattern: /^[0-9a-fA-F]{24}$/ // MongoDB ObjectId pattern
      }
    },
    body: {
      paymentIntentId: {
        type: 'string',
        required: true
      }
    }
  }),
  paymentController.confirmPayment
);

/**
 * @route   POST /api/payment/refund/:transactionId
 * @desc    Process refund
 * @access  Private (Admin/Support)
 */
router.post(
  '/refund/:transactionId',
  authChain(
    protect,
    authorize('admin', 'support'),
    checkRateLimit(50, 60 * 60 * 1000) // 50 requests per hour
  ),
  validateRequest({
    params: {
      transactionId: {
        type: 'string',
        required: true,
        pattern: /^[0-9a-fA-F]{24}$/
      }
    },
    body: {
      amount: {
        type: 'number',
        required: false,
        min: 1
      },
      reason: {
        type: 'string',
        required: true,
        enum: ['requested_by_customer', 'duplicate', 'fraudulent']
      }
    }
  }),
  paymentController.processRefund
);

/**
 * @route   GET /api/payment/transactions
 * @desc    Get user transactions
 * @access  Private
 */
router.get(
  '/transactions',
  authChain(
    protect,
    checkRateLimit(200, 60 * 60 * 1000) // 200 requests per hour
  ),
  validateRequest({
    query: {
      page: {
        type: 'number',
        required: false,
        min: 1,
        default: 1
      },
      limit: {
        type: 'number',
        required: false,
        min: 1,
        max: 100,
        default: 10
      },
      startDate: {
        type: 'date',
        required: false
      },
      endDate: {
        type: 'date',
        required: false
      }
    }
  }),
  paymentController.getTransactions
);

/**
 * @route   GET /api/payment/transactions/:id
 * @desc    Get transaction details
 * @access  Private
 */
router.get(
  '/transactions/:id',
  authChain(
    protect,
    checkRateLimit(200, 60 * 60 * 1000)
  ),
  validateRequest({
    params: {
      id: {
        type: 'string',
        required: true,
        pattern: /^[0-9a-fA-F]{24}$/
      }
    }
  }),
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
 * Admin Routes
 */

/**
 * @route   GET /api/payment/admin/transactions
 * @desc    Get all transactions (admin)
 * @access  Private (Admin)
 */
router.get(
  '/admin/transactions',
  authChain(
    protect,
    authorize('admin'),
    checkRateLimit(500, 60 * 60 * 1000) // 500 requests per hour
  ),
  validateRequest({
    query: {
      page: {
        type: 'number',
        required: false,
        min: 1,
        default: 1
      },
      limit: {
        type: 'number',
        required: false,
        min: 1,
        max: 100,
        default: 50
      },
      startDate: {
        type: 'date',
        required: false
      },
      endDate: {
        type: 'date',
        required: false
      },
      status: {
        type: 'string',
        required: false,
        enum: ['pending', 'completed', 'failed', 'refunded']
      },
      type: {
        type: 'string',
        required: false,
        enum: ['payment', 'refund']
      },
      userId: {
        type: 'string',
        required: false,
        pattern: /^[0-9a-fA-F]{24}$/
      }
    }
  }),
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
