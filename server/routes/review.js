import express from 'express';
import { body, param, query } from 'express-validator';
import * as reviewController from '../controllers/reviewController.js';
import { protect, authorize } from '../middleware/auth.js';
import { checkRateLimit } from '../middleware/rateLimit.js';
import { validate } from '../middleware/validation/validator.js';
import Review from '../models/Review.js';
import { cacheService } from '../services/cacheService.js';
import logger from '../config/logger.js';
import { errorResponse } from '../utils/errorHandler.js';
import AuditLog from '../models/AuditLog.js';

const router = express.Router();

/**
 * @route   POST /api/reviews
 * @desc    Create a new review
 * @access  Private
 */
router.post(
  '/',
  protect,
  checkRateLimit(20, 60 * 60 * 1000), // 20 reviews per hour
  [
    body('rating').isInt({ min: 1, max: 5 }).withMessage('Rating must be between 1 and 5'),
    body('content').isString().trim().isLength({ min: 10, max: 1000 }).withMessage('Review content must be between 10 and 1000 characters'),
    body('targetId').isMongoId().withMessage('Invalid target ID'),
    body('jobId').optional().isMongoId().withMessage('Invalid job ID'),
    validate
  ],
  reviewController.createReview
);

/**
 * @route   PUT /api/reviews/:id
 * @desc    Update a review
 * @access  Private
 */
router.put(
  '/:id',
  protect,
  checkRateLimit(20, 60 * 60 * 1000),
  [
    param('id').isMongoId().withMessage('Invalid review ID'),
    body('rating').optional().isInt({ min: 1, max: 5 }).withMessage('Rating must be between 1 and 5'),
    body('content').optional().isString().trim().isLength({ min: 10, max: 1000 }).withMessage('Review content must be between 10 and 1000 characters'),
    validate
  ],
  reviewController.updateReview
);

/**
 * @route   DELETE /api/reviews/:id
 * @desc    Delete a review
 * @access  Private
 */
router.delete(
  '/:id',
  protect,
  checkRateLimit(10, 60 * 60 * 1000), // 10 deletions per hour
  [
    param('id').isMongoId().withMessage('Invalid review ID'),
    validate
  ],
  reviewController.deleteReview
);

/**
 * @route   GET /api/reviews/user/:userId
 * @desc    Get reviews for a user
 * @access  Public
 */
router.get(
  '/user/:userId',
  [
    param('userId').isMongoId().withMessage('Invalid user ID'),
    query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
    query('limit').optional().isInt({ min: 1, max: 50 }).withMessage('Limit must be between 1 and 50'),
    query('type').optional().isIn(['client', 'freelancer', 'job']).withMessage('Invalid review type'),
    validate
  ],
  reviewController.getUserReviews
);

/**
 * @route   GET /api/reviews/job/:jobId
 * @desc    Get reviews for a job
 * @access  Public
 */
router.get(
  '/job/:jobId',
  [
    param('jobId').isMongoId().withMessage('Invalid job ID'),
    validate
  ],
  reviewController.getJobReviews
);

/**
 * @route   POST /api/reviews/:id/report
 * @desc    Report a review
 * @access  Private
 */
router.post(
  '/:id/report',
  protect,
  checkRateLimit(5, 60 * 60 * 1000), // 5 reports per hour
  [
    param('id').isMongoId().withMessage('Invalid review ID'),
    body('reason').isIn(['inappropriate', 'spam', 'fake', 'harassment', 'other']).withMessage('Invalid report reason'),
    body('description').isString().trim().isLength({ min: 10, max: 500 }).withMessage('Description must be between 10 and 500 characters'),
    validate
  ],
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
  protect,
  authorize('admin'),
  [
    query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
    query('limit').optional().isInt({ min: 1, max: 50 }).withMessage('Limit must be between 1 and 50'),
    query('status').optional().isIn(['pending', 'resolved', 'rejected']).withMessage('Invalid status'),
    validate
  ],
  async (req, res) => {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 20;
      const status = req.query.status;

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
  protect,
  authorize('admin'),
  [
    param('id').isMongoId().withMessage('Invalid review ID'),
    body('action').isIn(['remove', 'keep']).withMessage('Invalid action'),
    body('reason').isString().trim().notEmpty().withMessage('Reason is required'),
    validate
  ],
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
