const express = require('express');
const router = express.Router();
const meetingController = require('../controllers/meetingController');
const auth = require('../middleware/auth');
const { validate } = require('../middleware/validation/validator');
const {
  createSchema,
  updateSchema,
  participantSchema,
  querySchema
} = require('../middleware/validation/schemas/meetingValidation');

/**
 * @route POST /api/meetings
 * @desc Create a new meeting
 * @access Private
 */
router.post('/',
  auth,
  validate(createSchema),
  meetingController.createMeeting
);

/**
 * @route GET /api/meetings/:id
 * @desc Get meeting details
 * @access Private
 */
router.get('/:id',
  auth,
  meetingController.getMeeting
);

/**
 * @route PATCH /api/meetings/:id
 * @desc Update meeting details
 * @access Private
 */
router.patch('/:id',
  auth,
  validate(updateSchema),
  meetingController.updateMeeting
);

/**
 * @route GET /api/meetings
 * @desc List user's meetings
 * @access Private
 */
router.get('/',
  auth,
  validate(querySchema, 'query'),
  meetingController.listMeetings
);

/**
 * @route POST /api/meetings/:id/join
 * @desc Join a meeting
 * @access Private
 */
router.post('/:id/join',
  auth,
  validate(participantSchema),
  meetingController.joinMeeting
);

/**
 * @route POST /api/meetings/:id/leave
 * @desc Leave a meeting
 * @access Private
 */
router.post('/:id/leave',
  auth,
  meetingController.leaveMeeting
);

/**
 * @route POST /api/meetings/:id/end
 * @desc End a meeting (host only)
 * @access Private
 */
router.post('/:id/end',
  auth,
  meetingController.endMeeting
);

/**
 * @route GET /api/meetings/:id/stats
 * @desc Get meeting statistics
 * @access Private
 */
router.get('/:id/stats',
  auth,
  async (req, res, next) => {
    try {
      const meeting = await Meeting.findById(req.params.id)
        .populate('participants.user', 'name');

      if (!meeting) {
        throw createError(404, 'Meeting not found');
      }

      // Check if user has access to stats
      const isHost = meeting.host.toString() === req.user._id.toString();
      const isParticipant = meeting.participants.some(
        p => p.user._id.toString() === req.user._id.toString()
      );

      if (!isHost && !isParticipant) {
        throw createError(403, 'Access denied');
      }

      // Compile statistics
      const stats = {
        duration: meeting.statistics.totalDuration,
        participants: {
          total: meeting.participants.length,
          peak: meeting.statistics.peakParticipants,
          average: meeting.statistics.averageParticipants
        },
        networkQuality: meeting.statistics.networkQuality,
        participantDetails: meeting.participants.map(p => ({
          name: p.user.name,
          joinedAt: p.joinedAt,
          leftAt: p.leftAt,
          duration: p.leftAt ? p.leftAt - p.joinedAt : null,
          networkStats: p.networkStats || null
        }))
      };

      res.json({
        success: true,
        data: stats
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @route POST /api/meetings/:id/record/start
 * @desc Start meeting recording
 * @access Private
 */
router.post('/:id/record/start',
  auth,
  async (req, res, next) => {
    try {
      const meeting = await Meeting.findById(req.params.id);
      
      if (!meeting) {
        throw createError(404, 'Meeting not found');
      }

      if (meeting.host.toString() !== req.user._id.toString()) {
        throw createError(403, 'Only host can start recording');
      }

      if (!meeting.settings.features.recording) {
        throw createError(400, 'Recording is not enabled for this meeting');
      }

      // Add new recording entry
      meeting.recordings.push({
        startTime: new Date(),
        recordedBy: req.user._id
      });

      await meeting.save();

      // Notify participants
      socketService.emitToRoom(
        `meeting:${meeting._id}`,
        'meeting:recordingStarted'
      );

      res.json({
        success: true,
        message: 'Recording started'
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @route POST /api/meetings/:id/record/stop
 * @desc Stop meeting recording
 * @access Private
 */
router.post('/:id/record/stop',
  auth,
  async (req, res, next) => {
    try {
      const meeting = await Meeting.findById(req.params.id);
      
      if (!meeting) {
        throw createError(404, 'Meeting not found');
      }

      if (meeting.host.toString() !== req.user._id.toString()) {
        throw createError(403, 'Only host can stop recording');
      }

      // Find and update the active recording
      const activeRecording = meeting.recordings.find(
        r => !r.endTime && r.status === 'recording'
      );

      if (activeRecording) {
        activeRecording.endTime = new Date();
        activeRecording.status = 'processing';
        await meeting.save();
      }

      // Notify participants
      socketService.emitToRoom(
        `meeting:${meeting._id}`,
        'meeting:recordingStopped'
      );

      res.json({
        success: true,
        message: 'Recording stopped'
      });
    } catch (error) {
      next(error);
    }
  }
);

module.exports = router;
