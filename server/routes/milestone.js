import express from 'express';
import { auth } from '../middleware/auth.js';
import {
  createMilestone,
  updateMilestoneStatus,
  submitMilestoneDeliverables,
  reviewMilestoneSubmission,
  getMilestone
} from '../controllers/milestoneController.js';

const router = express.Router();

/**
 * @route   POST /api/jobs/:jobId/milestones
 * @desc    Create a new milestone for a job
 * @access  Private (Client only)
 * @body    {
 *            title: string,
 *            description: string,
 *            amount: number,
 *            dueDate: date,
 *            deliverables: [{
 *              title: string,
 *              description: string
 *            }]
 *          }
 */
router.post('/:jobId/milestones', auth, createMilestone);

/**
 * @route   PUT /api/jobs/:jobId/milestones/:milestoneId/status
 * @desc    Update milestone status
 * @access  Private (Client and assigned Freelancer)
 * @body    {
 *            status: string (enum: ['pending', 'in-progress', 'completed', 'cancelled']),
 *            completedDeliverables?: string[] (array of deliverable IDs)
 *          }
 */
router.put('/:jobId/milestones/:milestoneId/status', auth, updateMilestoneStatus);

/**
 * @route   POST /api/jobs/:jobId/milestones/:milestoneId/deliverables
 * @desc    Submit deliverables for a milestone
 * @access  Private (Assigned Freelancer only)
 * @body    {
 *            description: string,
 *            files: [{
 *              filename: string,
 *              path: string
 *            }]
 *          }
 */
router.post('/:jobId/milestones/:milestoneId/deliverables', auth, submitMilestoneDeliverables);

/**
 * @route   PUT /api/jobs/:jobId/milestones/:milestoneId/submissions/:submissionId/review
 * @desc    Review a milestone submission
 * @access  Private (Client only)
 * @body    {
 *            status: string (enum: ['approved', 'rejected']),
 *            feedback: string
 *          }
 */
router.put(
  '/:jobId/milestones/:milestoneId/submissions/:submissionId/review',
  auth,
  reviewMilestoneSubmission
);

/**
 * @route   GET /api/jobs/:jobId/milestones/:milestoneId
 * @desc    Get milestone details
 * @access  Private (Client and assigned Freelancer)
 */
router.get('/:jobId/milestones/:milestoneId', auth, getMilestone);

export default router;
