import express from 'express';
import { auth } from '../middleware/auth.js';
import {
  startTimeTracking,
  stopTimeTracking,
  addScreenshot,
  submitWorkDiary,
  getWorkDiary,
  getWeeklySummary,
  reviewWorkDiary
} from '../controllers/workDiaryController.js';

const router = express.Router();

/**
 * @route   POST /api/work-diary/jobs/:jobId/track/start
 * @desc    Start time tracking for a job
 * @access  Private (Freelancer only)
 * @body    {
 *            activity: string
 *          }
 */
router.post('/jobs/:jobId/track/start', auth, startTimeTracking);

/**
 * @route   POST /api/work-diary/jobs/:jobId/track/:timeBlockId/stop
 * @desc    Stop time tracking for a job
 * @access  Private (Freelancer only)
 */
router.post('/jobs/:jobId/track/:timeBlockId/stop', auth, stopTimeTracking);

/**
 * @route   POST /api/work-diary/jobs/:jobId/track/:timeBlockId/screenshot
 * @desc    Add screenshot to current time block
 * @access  Private (Freelancer only)
 * @body    {
 *            url: string,
 *            activityLevel: number,
 *            keystrokes: number,
 *            mouseEvents: number,
 *            windowTitle: string,
 *            applicationName: string
 *          }
 */
router.post('/jobs/:jobId/track/:timeBlockId/screenshot', auth, addScreenshot);

/**
 * @route   POST /api/work-diary/jobs/:jobId/:date/submit
 * @desc    Submit work diary for client review
 * @access  Private (Freelancer only)
 */
router.post('/jobs/:jobId/:date/submit', auth, submitWorkDiary);

/**
 * @route   GET /api/work-diary/jobs/:jobId/:date
 * @desc    Get work diary for a specific date
 * @access  Private (Client and assigned Freelancer)
 */
router.get('/jobs/:jobId/:date', auth, getWorkDiary);

/**
 * @route   GET /api/work-diary/freelancer/:freelancerId/summary/:startDate
 * @desc    Get weekly work summary
 * @access  Private (Freelancer and Client)
 */
router.get('/freelancer/:freelancerId/summary/:startDate', auth, getWeeklySummary);

/**
 * @route   POST /api/work-diary/jobs/:jobId/:date/review
 * @desc    Review work diary
 * @access  Private (Client only)
 * @body    {
 *            status: string (enum: ['approved', 'rejected']),
 *            comment: string
 *          }
 */
router.post('/jobs/:jobId/:date/review', auth, reviewWorkDiary);

export default router;
