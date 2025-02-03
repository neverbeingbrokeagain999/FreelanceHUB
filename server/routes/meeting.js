import express from 'express';
import { auth } from '../middleware/auth.js';
import {
  createMeeting,
  joinMeeting,
  leaveMeeting,
  endMeeting,
  toggleRecording,
  getMeeting,
  getUserMeetings
} from '../controllers/meetingController.js';

const router = express.Router();

/**
 * @route   POST /api/meetings
 * @desc    Create a new meeting
 * @access  Private
 * @body    {
 *            title: string,
 *            startTime?: Date,
 *            jobId?: string,
 *            type?: 'instant' | 'scheduled' | 'recurring',
 *            settings?: {
 *              audio: boolean,
 *              video: boolean,
 *              screenShare: boolean,
 *              chat: boolean,
 *              recording: boolean,
 *              waitingRoom: boolean,
 *              muteOnEntry: boolean
 *            },
 *            metadata?: {
 *              agenda: string,
 *              notes: string,
 *              tags: string[]
 *            },
 *            maxParticipants?: number
 *          }
 */
router.post('/', auth, createMeeting);

/**
 * @route   POST /api/meetings/join
 * @desc    Join a meeting
 * @access  Private
 * @body    {
 *            meetingId: string,
 *            password?: string,
 *            deviceInfo: {
 *              browser: string,
 *              os: string,
 *              device: string
 *            }
 *          }
 */
router.post('/join', auth, joinMeeting);

/**
 * @route   POST /api/meetings/:meetingId/leave
 * @desc    Leave a meeting
 * @access  Private
 */
router.post('/:meetingId/leave', auth, leaveMeeting);

/**
 * @route   POST /api/meetings/:meetingId/end
 * @desc    End a meeting (host only)
 * @access  Private
 */
router.post('/:meetingId/end', auth, endMeeting);

/**
 * @route   POST /api/meetings/:meetingId/recording
 * @desc    Toggle meeting recording (host only)
 * @access  Private
 */
router.post('/:meetingId/recording', auth, toggleRecording);

/**
 * @route   GET /api/meetings/:meetingId
 * @desc    Get meeting details
 * @access  Private (participants and host only)
 */
router.get('/:meetingId', auth, getMeeting);

/**
 * @route   GET /api/meetings
 * @desc    Get user's meetings
 * @access  Private
 * @query   {
 *            status?: 'scheduled' | 'active' | 'completed' | 'cancelled',
 *            type?: 'instant' | 'scheduled' | 'recurring',
 *            limit?: number,
 *            page?: number
 *          }
 */
router.get('/', auth, getUserMeetings);

export default router;
