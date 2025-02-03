import express from 'express';
import { auth } from '../middleware/auth.js';
import {
  matchFreelancers,
  getRecommendedJobs,
  getMatchDetails,
  getMarketAnalysis,
  getRecommendedRate,
  updateJobMatches,
  getJobMatchStats
} from '../controllers/jobMatchController.js';

const router = express.Router();

/**
 * @route   GET /api/job-match/jobs/:jobId/matches
 * @desc    Get matched freelancers for a job
 * @access  Private (Client and Admin)
 */
router.get('/jobs/:jobId/matches', auth, matchFreelancers);

/**
 * @route   GET /api/job-match/recommendations
 * @desc    Get recommended jobs for a freelancer
 * @access  Private (Freelancer)
 * @query   {
 *            limit?: number
 *          }
 */
router.get('/recommendations', auth, getRecommendedJobs);

/**
 * @route   GET /api/job-match/jobs/:jobId/freelancers/:freelancerId
 * @desc    Get detailed match information for a specific job-freelancer pair
 * @access  Private (Client, Admin, and the matched Freelancer)
 */
router.get('/jobs/:jobId/freelancers/:freelancerId', auth, getMatchDetails);

/**
 * @route   GET /api/job-match/market-analysis/:category
 * @desc    Get market analysis for a job category
 * @access  Private
 */
router.get('/market-analysis/:category', auth, getMarketAnalysis);

/**
 * @route   POST /api/job-match/recommended-rate
 * @desc    Get recommended hourly rate for a job
 * @access  Private
 * @body    {
 *            description: string,
 *            skills: string[]
 *          }
 */
router.post('/recommended-rate', auth, getRecommendedRate);

/**
 * @route   PUT /api/job-match/jobs/:jobId/matches
 * @desc    Update match scores for a job
 * @access  Private (Client and Admin)
 */
router.put('/jobs/:jobId/matches', auth, updateJobMatches);

/**
 * @route   GET /api/job-match/jobs/:jobId/stats
 * @desc    Get job match statistics
 * @access  Private (Client and Admin)
 */
router.get('/jobs/:jobId/stats', auth, getJobMatchStats);

export default router;
