import express from 'express';
import { protect as auth, authorize } from '../middleware/auth.js';
import mongoose from 'mongoose';
import Job from '../models/Job.js';
import logger from '../config/logger.js';
import { errorResponse } from '../utils/errorHandler.js';
import {
  createJob,
  getAllJobs,
  getJobById,
  updateJob,
  deleteJob,
  applyToJob,
  getApplicants,
  searchJobs,
  getRecommendedJobs,
  getJobStats
} from '../controllers/jobController.js';

const router = express.Router();

// Client middleware
const clientOnly = authorize('client');

// Search and recommended routes must be before parameterized routes
router.get('/search', auth, searchJobs);
router.get('/recommended', auth, getRecommendedJobs);
router.get('/stats', auth, getJobStats);
// Freelancer routes
router.get('/freelancer', auth, authorize('freelancer'), async (req, res) => {
  try {
    if (!req.user || !req.user._id) {
      logger.error('No user ID found in request');
      return errorResponse(res, 401, 'Authentication required');
    }

    logger.info('Getting jobs for freelancer:', req.user._id);
    
    let freelancerId;
    try {
      freelancerId = new mongoose.Types.ObjectId(req.user._id);
      logger.debug('Converted freelancer ID:', freelancerId);
    } catch (err) {
      logger.error('Invalid user ID format:', err);
      return errorResponse(res, 400, 'Invalid user ID format');
    }

    const jobs = await Job.find({
      $or: [
        { status: 'open' },
        { applicants: freelancerId }
      ]
    })
    .sort({ createdAt: -1 })
    .populate('client', 'name email')
    .lean();
    
    logger.info(`Found ${jobs.length} jobs for freelancer:`, req.user.userId);
    
    res.json({ jobs });
  } catch (error) {
    logger.error('Error fetching freelancer jobs:', error);
    if (error.name === 'CastError') {
      return errorResponse(res, 400, 'Invalid ID format');
    }
    return errorResponse(res, 500, 'Error fetching freelancer jobs');
  }
});

router.get('/client', auth, clientOnly, async (req, res) => {
  try {
    if (!req.user || !req.user._id) {
      logger.error('No user ID found in request');
      return errorResponse(res, 401, 'Authentication required');
    }

    logger.info('Getting jobs for client:', req.user._id);
    
    let clientId;
    try {
      clientId = new mongoose.Types.ObjectId(req.user._id);
      logger.debug('Converted client ID:', clientId);
    } catch (err) {
      logger.error('Invalid user ID format:', err);
      return errorResponse(res, 400, 'Invalid user ID format');
    }

    // First check if any jobs exist at all
    const allJobs = await Job.find({});
    logger.debug('Total jobs in database:', allJobs.length);

    // Then try to find client's jobs
    const clientJobs = await Job.find({ client: clientId })
      .sort({ createdAt: -1 })
      .populate('client', 'name email')  // Populate client details
      .lean();  // Convert to plain JavaScript object
    
    logger.info(`Found ${clientJobs.length} jobs for client:`, req.user.userId);
    
    res.json({ jobs: clientJobs });
  } catch (error) {
    logger.error('Error fetching client jobs:', error);
    if (error.name === 'CastError') {
      return errorResponse(res, 400, 'Invalid ID format');
    }
    return errorResponse(res, 500, 'Error fetching client jobs');
  }
});

// Basic CRUD routes
router.post('/', auth, createJob);
router.get('/', auth, getAllJobs);
router.get('/:id', auth, getJobById);
router.put('/:id', auth, updateJob);
router.delete('/:id', auth, deleteJob);

// Application routes after CRUD routes
router.post('/:id/apply', auth, applyToJob);
router.get('/:id/applicants', auth, getApplicants);

// Export the router
export default router;
