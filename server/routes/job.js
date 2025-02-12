import express from 'express';
import { body, param, query } from 'express-validator';
import { protect as auth, authorize } from '../middleware/auth.js';
import { validate } from '../middleware/validation/validator.js';
import mongoose from 'mongoose';
import Job from '../models/Job.js';
import logger from '../config/logger.js';
import { errorResponse } from '../utils/errorHandler.js';
import {
  createJob,
  getJobs,
  getJob,
  updateJob,
  deleteJob,
  applyToJob as submitProposal,
  getApplicants,
  searchJobs,
  getRecommendedJobs,
  getJobStats,
  getFreelancerJobs,
  getClientJobs
} from '../controllers/jobController.js';

const router = express.Router();

// Client middleware
const clientOnly = authorize('client');

// Search and recommended routes must be before parameterized routes
router.get('/search',
  auth,
  [
    query('q').optional().trim().isString(),
    query('skills').optional().isArray(),
    query('skills.*').optional().trim().isString(),
    query('type').optional().isIn(['fixed', 'hourly']),
    query('budget.min').optional().isFloat({ min: 0 }),
    query('budget.max').optional().isFloat({ min: 0 }),
    query('experience').optional().isIn(['entry', 'intermediate', 'expert']),
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 50 }),
    query('sort').optional().isIn(['latest', 'budget', 'deadline']),
    validate
  ],
  searchJobs
);

router.get('/recommended',
  auth,
  [
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 50 }),
    validate
  ],
  getRecommendedJobs
);

router.get('/stats',
  auth,
  [
    query('timeframe').optional().isIn(['day', 'week', 'month', 'year']),
    validate
  ],
  getJobStats
);

// Freelancer routes
router.get('/freelancer',
  auth,
  authorize('freelancer'),
  [
    query('status').optional().isIn(['applied', 'hired', 'completed']),
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 50 }),
    validate
  ],
  getFreelancerJobs
);

router.get('/client',
  auth,
  clientOnly,
  [
    query('status').optional().isIn(['draft', 'open', 'in-progress', 'completed']),
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 50 }),
    validate
  ],
  getClientJobs
);

// Common route for all authenticated users to view jobs
router.get('/',
  auth,
  [
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 50 }),
    query('status').optional().isIn(['all', 'open', 'in-progress', 'completed']),
    query('type').optional().isIn(['fixed', 'hourly']),
    query('sort').optional().isIn(['latest', 'budget', 'deadline']),
    validate
  ],
  getJobs
);

router.get('/:id',
  auth,
  [
    param('id').isMongoId().withMessage('Invalid job ID'),
    validate
  ],
  getJob
);

// Client-only routes
router.post('/',
  [auth, clientOnly],
  [
    body('title').trim().isLength({ min: 5, max: 100 }).withMessage('Title must be between 5 and 100 characters'),
    body('description').trim().isLength({ min: 20, max: 5000 }).withMessage('Description must be between 20 and 5000 characters'),
    body('type').isIn(['fixed', 'hourly']).withMessage('Invalid job type'),
    body('budget').isFloat({ min: 0 }).withMessage('Budget must be greater than 0'),
    body('skills').isArray().withMessage('Skills must be an array'),
    body('skills.*').trim().isString().withMessage('Each skill must be a string'),
    body('experience').isIn(['entry', 'intermediate', 'expert']).withMessage('Invalid experience level'),
    body('duration').optional().isIn(['less_than_1_month', '1_to_3_months', '3_to_6_months', 'more_than_6_months']),
    body('deadline').optional().isISO8601().withMessage('Invalid deadline date'),
    validate
  ],
  createJob
);

router.put('/:id',
  [auth, clientOnly],
  [
    param('id').isMongoId().withMessage('Invalid job ID'),
    body('title').optional().trim().isLength({ min: 5, max: 100 }).withMessage('Title must be between 5 and 100 characters'),
    body('description').optional().trim().isLength({ min: 20, max: 5000 }).withMessage('Description must be between 20 and 5000 characters'),
    body('type').optional().isIn(['fixed', 'hourly']).withMessage('Invalid job type'),
    body('budget').optional().isFloat({ min: 0 }).withMessage('Budget must be greater than 0'),
    body('skills').optional().isArray().withMessage('Skills must be an array'),
    body('skills.*').optional().trim().isString().withMessage('Each skill must be a string'),
    body('experience').optional().isIn(['entry', 'intermediate', 'expert']).withMessage('Invalid experience level'),
    body('duration').optional().isIn(['less_than_1_month', '1_to_3_months', '3_to_6_months', 'more_than_6_months']),
    body('deadline').optional().isISO8601().withMessage('Invalid deadline date'),
    body('status').optional().isIn(['draft', 'open', 'in-progress', 'completed', 'cancelled']).withMessage('Invalid status'),
    validate
  ],
  updateJob
);

router.delete('/:id',
  [auth, clientOnly],
  [
    param('id').isMongoId().withMessage('Invalid job ID'),
    validate
  ],
  deleteJob
);

router.get('/:id/applicants',
  [auth, clientOnly],
  [
    param('id').isMongoId().withMessage('Invalid job ID'),
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 50 }),
    query('status').optional().isIn(['pending', 'accepted', 'rejected']),
    validate
  ],
  getApplicants
);

// Freelancer-only routes
router.post('/:id/apply',
  [auth, authorize('freelancer')],
  [
    param('id').isMongoId().withMessage('Invalid job ID'),
    body('coverLetter').trim().isLength({ min: 50, max: 1000 }).withMessage('Cover letter must be between 50 and 1000 characters'),
    body('proposedRate').optional().isFloat({ min: 0 }).withMessage('Proposed rate must be greater than 0'),
    body('estimatedTime').optional().isInt({ min: 1 }).withMessage('Estimated time must be greater than 0'),
    validate
  ],
  submitProposal
);

export default router;
