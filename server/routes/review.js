import express from 'express';
import * as reviewController from '../controllers/reviewController.js';
import { protect, authorize, authChain, checkRateLimit } from '../middleware/auth.js';
import { validateRequest } from '../middleware/validation/validator.js';
import { reviewSchemas } from '../middleware/validation/schemas.js';
import Joi from 'joi';
import Review from '../models/Review.js';
import { AuditLog } from '../models/AuditLog.js';
import { cacheService } from '../services/cacheService.js';
import logger from '../config/logger.js';
import { errorResponse } from '../utils/errorHandler.js';

const router = express.Router();

/**
 * @route   POST /api/reviews
 * @desc    Create a new review
 * @access  Private
 */
router.post(
  '/',
  authChain(
    protect,
    checkRateLimit(20, 60 * 60 * 1000) // 20 reviews per hour
  ),
  validateRequest({
    body: reviewSchemas.create
  }),
  reviewController.createReview
);

/**
 * @route   PUT /api/reviews/:id
 * @desc    Update a review
 * @access  Private
 */
router.put(
  '/:id',
  authChain(
    protect,
    checkRateLimit(20, 60 * 60 * 1000)
  ),
  validateRequest({
    params: Joi.object({
      id: Joi.string().pattern(/^[0-9a-fA-F]{24}$/).required()
    }),
    body: reviewSchemas.update
  }),
  reviewController.updateReview
);

/**
 * @route   DELETE /api/reviews/:id
 * @desc    Delete a review
 * @access  Private
 */
router.delete(
  '/:id',
  authChain(
    protect,
    checkRateLimit(10, 60 * 60 * 1000) // 10 deletions per hour
  ),
  validateRequest({
    params: Joi.object({
      id: Joi.string().pattern(/^[0-9a-fA-F]{24}$/).required()
    })
  }),
  reviewController.deleteReview
);

/**
 * @route   GET /api/reviews/user/:userId
 * @desc    Get reviews for a user
 * @access  Public
 */
router.get(
  '/user/:userId',
  validateRequest({
    params: Joi.object({
      userId: Joi.string().pattern(/^[0-9a-fA-F]{24}$/).required()
    }),
    query: Joi.object({
      page: Joi.number().min(1).default(1),
      limit: Joi.number().min(1).max(50).default(10),
      type: Joi.string().valid('client', 'freelancer', 'job')
    })
  }),
  reviewController.getUserReviews
);

/**
 * @route   GET /api/reviews/job/:jobId
 * @desc    Get reviews for a job
 * @access  Public
 */
router.get(
  '/job/:jobId',
  validateRequest({
    params: Joi.object({
      jobId: Joi.string().pattern(/^[0-9a-fA-F]{24}$/).required()
    })
  }),
  reviewController.getJobReviews
);

/**
 * @route   POST /api/reviews/:id/report
 * @desc    Report a review
 * @access  Private
 */
router.post(
  '/:id/report',
  authChain(
    protect,
    checkRateLimit(5, 60 * 60 * 1000) // 5 reports per hour
  ),
  validateRequest({
    params: Joi.object({
      id: Joi.string().pattern(/^[0-9a-fA-F]{24}$/).required()
    }),
    body: Joi.object({
      reason: Joi.string().valid('inappropriate', 'spam', 'fake', 'harassment', 'other').required(),
      description: Joi.string().min(10).max(500).required()
    })
  }),
  reviewController.reportReview
);

/**
 * Admin Routes
 */

/**
 * @route   GET /api/reviews/admin/reported
 * @desc    Get reported reviews
 * @access  Private/Admin
 */
router.get(
  '/admin/reported',
  authChain(
    protect,
    authorize('admin')
  ),
  validateRequest({
    query: Joi.object({
      page: Joi.number().min(1).default(1),
      limit: Joi.number().min(1).max(50).default(20),
      status: Joi.string().valid('pending', 'resolved', 'rejected')
    })
  }),
  async (req, res) => {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 20;
      const status = req.query.status;

      // Build query for reviews with reports
      const query = { 'reports.0': { $exists: true } };
      if (status) {
        query['reports.status'] = status;
      }

      const reviews = await Review.find(query)
        .sort({ 'reports.createdAt': -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .populate('reviewer', 'name email')
        .populate('target', 'name email')
        .populate('reports.user', 'name email');

      const total = await Review.countDocuments(query);

      res.json({
        success: true,
        reviews,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      });
    } catch (error) {
      logger.error('Get reported reviews error:', error);
      return errorResponse(res, 500, 'Error fetching reported reviews');
    }
  }
);

/**
 * @route   PUT /api/reviews/admin/:id/moderate
 * @desc    Moderate a review
 * @access  Private/Admin
 */
router.put(
  '/admin/:id/moderate',
  authChain(
    protect,
    authorize('admin')
  ),
  validateRequest({
    params: Joi.object({
      id: Joi.string().pattern(/^[0-9a-fA-F]{24}$/).required()
    }),
    body: Joi.object({
      action: Joi.string().valid('remove', 'keep').required(),
      reason: Joi.string().required()
    })
  }),
  async (req, res) => {
    try {
      const { action, reason } = req.body;
      const review = await Review.findById(req.params.id);

      if (!review) {
        return errorResponse(res, 404, 'Review not found');
      }

      if (action === 'remove') {
        await review.deleteOne();
        
        // Update user's rating
        await reviewController.updateUserRating(review.target);
        
        // Invalidate cache
        await cacheService.invalidateUserCaches(review.target);
      } else {
        // Mark reports as resolved
        review.reports.forEach(report => {
          report.status = 'resolved';
          report.moderatedBy = req.user.id;
          report.moderatedAt = new Date();
          report.moderationNotes = reason;
        });
        await review.save();
      }

      // Log moderation action
      await AuditLog.logUserAction({
        event: 'review-moderated',
        actor: {
          userId: req.user._id,
          role: 'admin'
        },
        target: {
          reviewId: review._id,
          userId: review.target
        },
        metadata: {
          action,
          reason
        }
      });

      res.json({
        success: true,
        message: `Review ${action === 'remove' ? 'removed' : 'kept'} successfully`
      });
    } catch (error) {
      logger.error('Review moderation error:', error);
      return errorResponse(res, 500, 'Error moderating review');
    }
  }
);

export default router;
