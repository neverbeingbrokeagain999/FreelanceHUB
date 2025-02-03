import express from 'express';
import { auth } from '../middleware/auth.js';
import {
  extractTopics,
  predictSuccess,
  predictDuration,
  analyzePosting,
  getSkillSimilarity,
  getExperienceScore,
  matchJobSkills
} from '../controllers/mlController.js';

const router = express.Router();

/**
 * @route   POST /api/ml/topics
 * @desc    Extract topics from text content
 * @access  Private
 * @body    {
 *            text: string
 *          }
 * @query   {
 *            numTopics?: number
 *          }
 */
router.post('/topics', auth, extractTopics);

/**
 * @route   GET /api/ml/jobs/:jobId/freelancers/:freelancerId/success
 * @desc    Get success prediction for job-freelancer pair
 * @access  Private
 */
router.get('/jobs/:jobId/freelancers/:freelancerId/success', auth, predictSuccess);

/**
 * @route   GET /api/ml/jobs/:jobId/duration
 * @desc    Get project duration prediction
 * @access  Private
 */
router.get('/jobs/:jobId/duration', auth, predictDuration);

/**
 * @route   GET /api/ml/jobs/:jobId/analysis
 * @desc    Get job posting analysis
 * @access  Private
 */
router.get('/jobs/:jobId/analysis', auth, analyzePosting);

/**
 * @route   GET /api/ml/skills/similarity
 * @desc    Calculate similarity between two skills
 * @access  Private
 * @query   {
 *            skill1: string,
 *            skill2: string
 *          }
 */
router.get('/skills/similarity', auth, getSkillSimilarity);

/**
 * @route   GET /api/ml/experience/score
 * @desc    Calculate experience score
 * @access  Private
 * @query   {
 *            actual: number,
 *            required?: number
 *          }
 */
router.get('/experience/score', auth, getExperienceScore);

/**
 * @route   POST /api/ml/jobs/:jobId/skills/match
 * @desc    Calculate skill match score for a job
 * @access  Private
 * @body    {
 *            skills: string[]
 *          }
 */
router.post('/jobs/:jobId/skills/match', auth, matchJobSkills);

export default router;
