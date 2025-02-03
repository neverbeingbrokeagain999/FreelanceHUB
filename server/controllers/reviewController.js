import Review from '../models/Review.js';
import User from '../models/User.js';
import Job from '../models/Job.js';
import logger from '../config/logger.js';
import { errorResponse } from '../utils/errorHandler.js';
import AuditLog from '../models/AuditLog.js';
import { cacheService } from '../services/cacheService.js';

/**
 * Create a new review
 * @route POST /api/reviews
 */
export const createReview = async (req, res) => {
  try {
    const { recipient, recipientRole, ratings, content, title, jobId, recommendations } = req.body;

    // Validate review context - this is now handled by schema validation

    // Check if target user exists
    const targetUser = await User.findById(recipient);
    if (!targetUser) {
      return errorResponse(res, 404, 'Target user not found');
    }

    // Set default author role from user
    let authorRole = req.user.role;

    // Check job context if provided
    if (jobId) {
      const job = await Job.findById(jobId);
      if (!job) {
        return errorResponse(res, 404, 'Job not found');
      }
      if (job.status !== 'completed') {
        return errorResponse(res, 400, 'Can only review completed jobs');
      }

      // Verify reviewer's role matches the job relationship
      authorRole = job.client.toString() === req.user.id ? 'client' : 
                  job.freelancer.toString() === req.user.id ? 'freelancer' : null;
      
      if (!authorRole) {
        return errorResponse(res, 403, 'Not authorized to review this job');
      }

      // Check if already reviewed
      const existingReview = await Review.findOne({
        job: jobId,
        author: req.user.id
      });
      if (existingReview) {
        return errorResponse(res, 400, 'Already reviewed this job');
      }
    }

      // Create review
      const review = await Review.create({
        author: req.user.id,
        authorRole,
        recipient,
        recipientRole,
        job: jobId, // Store as job in the database
        title,
        content,
        ratings,
        recommendations,
        status: 'published'
    });

    // Update user's rating
    await updateUserRating(recipient);

    // Invalidate cache
    await cacheService.invalidateUserCaches(recipient);

    // Log review creation
    await AuditLog.logUserAction({
      event: 'review-created',
      actor: {
        userId: req.user._id,
        email: req.user.email
      },
      target: {
        userId: recipient,
        jobId
      },
      metadata: {
        ratings,
        recipientRole,
        recommendations
      }
    });

    res.status(201).json({
      success: true,
      data: { review }
    });
  } catch (error) {
    logger.error('Review creation error:', error);
    return errorResponse(res, 500, 'Error creating review');
  }
};

/**
 * Update a review
 * @route PUT /api/reviews/:id
 */
export const updateReview = async (req, res) => {
  try {
    const { ratings, content, title } = req.body;
    const review = await Review.findById(req.params.id);

    if (!review) {
      return errorResponse(res, 404, 'Review not found');
    }

    // Check ownership
    if (review.author.toString() !== req.user.id && req.user.role !== 'admin') {
      return errorResponse(res, 403, 'Not authorized to update this review');
    }

    // Check if review is within edit window (48 hours)
    const editWindow = 48 * 60 * 60 * 1000; // 48 hours in milliseconds
    if (Date.now() - review.createdAt > editWindow && req.user.role !== 'admin') {
      return errorResponse(res, 400, 'Review can no longer be edited');
    }

    // Update review fields
    if (ratings) review.ratings = ratings;
    if (content) review.content = content;
    if (title) review.title = title;
    review.edited = true;
    review.editedAt = Date.now();
    await review.save();

    // Update target user's rating if overall rating changed
    if (ratings && ratings.overall) {
      await updateUserRating(review.recipient);
    }

    // Invalidate cache
    await cacheService.invalidateUserCaches(review.recipient);

    // Log review update
    await AuditLog.logUserAction({
      event: 'review-updated',
      actor: {
        userId: req.user._id,
        email: req.user.email
      },
      target: {
        reviewId: review._id,
        userId: review.recipient
      },
      metadata: {
        ratings,
        edited: true
      }
    });

    res.json({
      success: true,
      data: { review }
    });
  } catch (error) {
    logger.error('Review update error:', error);
    return errorResponse(res, 500, 'Error updating review');
  }
};

/**
 * Delete a review
 * @route DELETE /api/reviews/:id
 */
export const deleteReview = async (req, res) => {
  try {
    const review = await Review.findById(req.params.id);

    if (!review) {
      return errorResponse(res, 404, 'Review not found');
    }

    // Check authorization
    if (review.author.toString() !== req.user.id && req.user.role !== 'admin') {
      return errorResponse(res, 403, 'Not authorized to delete this review');
    }

    await review.deleteOne();

    // Update user's rating
    await updateUserRating(review.recipient);

    // Invalidate cache
    await cacheService.invalidateUserCaches(review.recipient);

    // Log review deletion
    await AuditLog.logUserAction({
      event: 'review-deleted',
      actor: {
        userId: req.user._id,
        email: req.user.email
      },
      target: {
        reviewId: review._id,
        userId: review.recipient
      }
    });

    res.json({
      success: true,
      message: 'Review deleted successfully'
    });
  } catch (error) {
    logger.error('Review deletion error:', error);
    return errorResponse(res, 500, 'Error deleting review');
  }
};

/**
 * Get reviews for a user
 * @route GET /api/reviews/user/:userId
 */
export const getUserReviews = async (req, res) => {
  try {
    const { userId } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const type = req.query.type;

      // Check if user exists
      const user = await User.findById(userId);
      if (!user) {
        return errorResponse(res, 404, 'User not found');
      }

      // Build query
      const query = { recipient: userId };
      if (type) {
        query.recipientRole = type;
      }

      const reviews = await Review.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .populate('author', 'name avatar')
      .populate('job', 'title');

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
    logger.error('Get user reviews error:', error);
    return errorResponse(res, 500, 'Error fetching reviews');
  }
};

/**
 * Get reviews for a job
 * @route GET /api/reviews/job/:jobId
 */
export const getJobReviews = async (req, res) => {
  try {
    const { jobId } = req.params;
    
    const reviews = await Review.find({ job: jobId })
      .sort({ createdAt: -1 })
      .populate('author', 'name avatar')
      .populate('recipient', 'name avatar');

    res.json({
      success: true,
      reviews
    });
  } catch (error) {
    logger.error('Get job reviews error:', error);
    return errorResponse(res, 500, 'Error fetching reviews');
  }
};

/**
 * Report a review
 * @route POST /api/reviews/:id/report
 */
export const reportReview = async (req, res) => {
  try {
    const { reason, description } = req.body;
    const review = await Review.findById(req.params.id);

    if (!review) {
      return errorResponse(res, 404, 'Review not found');
    }

    // Add report
    review.reports.push({
      reporter: req.user.id,
      reason,
      description,
      status: 'pending'
    });
    await review.save();

    // Log review report
    await AuditLog.logUserAction({
      event: 'review-reported',
      actor: {
        userId: req.user._id,
        email: req.user.email
      },
      target: {
        reviewId: review._id,
        userId: review.recipient
      },
      metadata: {
        reason,
        description
      }
    });

    res.json({
      success: true,
      message: 'Review reported successfully'
    });
  } catch (error) {
    logger.error('Review report error:', error);
    return errorResponse(res, 500, 'Error reporting review');
  }
};

/**
 * Helper function to update user's rating
 */
async function updateUserRating(userId) {
  try {
    const reviews = await Review.find({ recipient: userId });
    
    if (reviews.length === 0) return;

    // Calculate average ratings
    const totals = {
      overall: 0,
      communication: 0,
      quality: 0,
      expertise: 0,
      deadlines: 0,
      cooperation: 0,
      requirements: 0,
      paymentPromptness: 0
    };
    
    const counts = {
      overall: 0,
      communication: 0,
      quality: 0,
      expertise: 0,
      deadlines: 0,
      cooperation: 0,
      requirements: 0,
      paymentPromptness: 0
    };

    reviews.forEach(review => {
      Object.keys(totals).forEach(key => {
        if (review.ratings[key]) {
          totals[key] += review.ratings[key];
          counts[key]++;
        }
      });
    });

    const averageRatings = {};
    Object.keys(totals).forEach(key => {
      if (counts[key] > 0) {
        averageRatings[key] = totals[key] / counts[key];
      }
    });

    // Update user
    await User.findByIdAndUpdate(userId, {
      $set: {
        rating: averageRatings.overall || 0,
        ratingBreakdown: averageRatings,
        totalReviews: reviews.length
      }
    });
  } catch (error) {
    logger.error('Update user rating error:', error);
    throw error;
  }
}
