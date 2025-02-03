import Stripe from 'stripe';
import PaymentGateway from '../models/PaymentGateway.js';
import Transaction from '../models/Transaction.js';
import User from '../models/User.js';
import logger from '../config/logger.js';
import { errorResponse } from '../utils/errorHandler.js';
import AuditLog from '../models/AuditLog.js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

/**
 * Create payment intent
 * @route POST /api/payment/create-intent
 */
export const createPaymentIntent = async (req, res) => {
  try {
    const { amount, currency = 'usd', description, metadata } = req.body;

    // Validate amount
    if (!amount || amount < 100) { // minimum 1 USD
      return errorResponse(res, 400, 'Invalid amount');
    }

    // Create payment intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency,
      description,
      metadata: {
        ...metadata,
        userId: req.user.id
      }
    });

    // Create transaction record
    const transaction = await Transaction.create({
      user: req.user.id,
      amount,
      currency,
      type: 'payment',
      status: 'pending',
      paymentIntentId: paymentIntent.id,
      description,
      metadata
    });

    // Log transaction creation
    await AuditLog.logUserAction({
      event: 'payment-initiated',
      actor: {
        userId: req.user._id,
        email: req.user.email
      },
      target: {
        transactionId: transaction._id
      },
      metadata: {
        amount,
        currency
      }
    });

    res.json({
      success: true,
      clientSecret: paymentIntent.client_secret,
      transactionId: transaction._id
    });
  } catch (error) {
    logger.error('Payment intent creation error:', error);
    return errorResponse(res, 500, 'Error creating payment intent');
  }
};

/**
 * Confirm payment
 * @route POST /api/payment/confirm/:transactionId
 */
export const confirmPayment = async (req, res) => {
  try {
    const { transactionId } = req.params;
    const { paymentIntentId } = req.body;

    const transaction = await Transaction.findById(transactionId);
    if (!transaction) {
      return errorResponse(res, 404, 'Transaction not found');
    }

    // Verify payment intent
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
    if (paymentIntent.status !== 'succeeded') {
      return errorResponse(res, 400, 'Payment not succeeded');
    }

    // Update transaction
    transaction.status = 'completed';
    transaction.completedAt = new Date();
    transaction.paymentDetails = {
      method: paymentIntent.payment_method_types[0],
      last4: paymentIntent.charges.data[0]?.payment_method_details?.card?.last4,
      brand: paymentIntent.charges.data[0]?.payment_method_details?.card?.brand
    };
    await transaction.save();

    // Log successful payment
    await AuditLog.logUserAction({
      event: 'payment-completed',
      actor: {
        userId: req.user._id,
        email: req.user.email
      },
      target: {
        transactionId: transaction._id
      },
      metadata: {
        amount: transaction.amount,
        currency: transaction.currency
      }
    });

    res.json({
      success: true,
      transaction
    });
  } catch (error) {
    logger.error('Payment confirmation error:', error);
    return errorResponse(res, 500, 'Error confirming payment');
  }
};

/**
 * Process refund
 * @route POST /api/payment/refund/:transactionId
 */
export const processRefund = async (req, res) => {
  try {
    const { transactionId } = req.params;
    const { amount, reason } = req.body;

    const transaction = await Transaction.findById(transactionId);
    if (!transaction) {
      return errorResponse(res, 404, 'Transaction not found');
    }

    if (transaction.status !== 'completed') {
      return errorResponse(res, 400, 'Transaction cannot be refunded');
    }

    // Process refund through Stripe
    const refund = await stripe.refunds.create({
      payment_intent: transaction.paymentIntentId,
      amount: amount || undefined, // If not specified, full refund
      reason
    });

    // Create refund transaction
    const refundTransaction = await Transaction.create({
      user: transaction.user,
      amount: refund.amount,
      currency: transaction.currency,
      type: 'refund',
      status: 'completed',
      relatedTransaction: transaction._id,
      paymentIntentId: refund.id,
      description: `Refund for transaction ${transaction._id}`,
      metadata: { reason }
    });

    // Update original transaction
    transaction.status = 'refunded';
    transaction.refundedAmount = (transaction.refundedAmount || 0) + refund.amount;
    transaction.refunds.push(refundTransaction._id);
    await transaction.save();

    // Log refund
    await AuditLog.logUserAction({
      event: 'payment-refunded',
      actor: {
        userId: req.user._id,
        email: req.user.email
      },
      target: {
        transactionId: transaction._id,
        refundTransactionId: refundTransaction._id
      },
      metadata: {
        amount: refund.amount,
        reason
      }
    });

    res.json({
      success: true,
      refundTransaction
    });
  } catch (error) {
    logger.error('Refund processing error:', error);
    return errorResponse(res, 500, 'Error processing refund');
  }
};

/**
 * Get user transactions
 * @route GET /api/payment/transactions
 */
export const getTransactions = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const startDate = req.query.startDate && new Date(req.query.startDate);
    const endDate = req.query.endDate && new Date(req.query.endDate);

    const query = { user: req.user.id };
    if (startDate && endDate) {
      query.createdAt = { $gte: startDate, $lte: endDate };
    }

    const transactions = await Transaction.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
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
    logger.error('Get transactions error:', error);
    return errorResponse(res, 500, 'Error fetching transactions');
  }
};

/**
 * Get transaction details
 * @route GET /api/payment/transactions/:id
 */
export const getTransactionDetails = async (req, res) => {
  try {
    const transaction = await Transaction.findById(req.params.id)
      .populate('user', 'name email')
      .populate('relatedTransaction', 'status amount currency');

    if (!transaction) {
      return errorResponse(res, 404, 'Transaction not found');
    }

    // Check ownership
    if (transaction.user._id.toString() !== req.user.id && req.user.role !== 'admin') {
      return errorResponse(res, 403, 'Not authorized to view this transaction');
    }

    res.json({
      success: true,
      transaction
    });
  } catch (error) {
    logger.error('Get transaction details error:', error);
    return errorResponse(res, 500, 'Error fetching transaction details');
  }
};

/**
 * Webhook handler for Stripe events
 * @route POST /api/payment/webhook
 */
export const handleWebhook = async (req, res) => {
  try {
    const sig = req.headers['stripe-signature'];
    const event = stripe.webhooks.constructEvent(
      req.rawBody,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );

    // Handle different event types
    switch (event.type) {
      case 'payment_intent.succeeded':
        await handlePaymentSuccess(event.data.object);
        break;
      case 'payment_intent.payment_failed':
        await handlePaymentFailure(event.data.object);
        break;
      case 'charge.refunded':
        await handleRefund(event.data.object);
        break;
      // Add more event handlers as needed
    }

    res.json({ received: true });
  } catch (error) {
    logger.error('Webhook handling error:', error);
    return errorResponse(res, 400, `Webhook Error: ${error.message}`);
  }
};

// Helper functions for webhook handlers
async function handlePaymentSuccess(paymentIntent) {
  try {
    const transaction = await Transaction.findOne({
      paymentIntentId: paymentIntent.id
    });

    if (transaction) {
      transaction.status = 'completed';
      transaction.completedAt = new Date();
      await transaction.save();

      // Log successful payment
      await AuditLog.logUserAction({
        event: 'payment-succeeded',
        actor: {
          userId: transaction.user
        },
        target: {
          transactionId: transaction._id
        },
        metadata: {
          paymentIntentId: paymentIntent.id
        }
      });
    }
  } catch (error) {
    logger.error('Payment success handling error:', error);
  }
}

async function handlePaymentFailure(paymentIntent) {
  try {
    const transaction = await Transaction.findOne({
      paymentIntentId: paymentIntent.id
    });

    if (transaction) {
      transaction.status = 'failed';
      transaction.errorMessage = paymentIntent.last_payment_error?.message;
      await transaction.save();

      // Log payment failure
      await AuditLog.logUserAction({
        event: 'payment-failed',
        actor: {
          userId: transaction.user
        },
        target: {
          transactionId: transaction._id
        },
        metadata: {
          error: paymentIntent.last_payment_error
        }
      });
    }
  } catch (error) {
    logger.error('Payment failure handling error:', error);
  }
}

async function handleRefund(charge) {
  try {
    const transaction = await Transaction.findOne({
      'paymentDetails.chargeId': charge.id
    });

    if (transaction) {
      transaction.status = charge.refunded ? 'refunded' : 'partially_refunded';
      transaction.refundedAmount = charge.amount_refunded;
      await transaction.save();

      // Log refund
      await AuditLog.logUserAction({
        event: 'payment-refunded',
        actor: {
          userId: transaction.user
        },
        target: {
          transactionId: transaction._id
        },
        metadata: {
          refundAmount: charge.amount_refunded
        }
      });
    }
  } catch (error) {
    logger.error('Refund handling error:', error);
  }
}
