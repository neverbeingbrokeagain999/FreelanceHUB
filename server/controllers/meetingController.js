const Meeting = require('../models/Meeting');
const { MEETING_ROLES, WEBRTC_CONFIG } = require('../config/webrtc');
const { createError } = require('../utils/errorHandler');
const socketService = require('../services/socketService');

const meetingController = {
  // Create a new meeting
  async createMeeting(req, res, next) {
    try {
      const meetingData = {
        ...req.body,
        host: req.user._id,
        participants: [{
          user: req.user._id,
          role: MEETING_ROLES.HOST,
          deviceInfo: req.body.deviceInfo,
          connectionInfo: {
            ip: req.ip,
            ...req.body.connectionInfo
          }
        }]
      };

      const meeting = await Meeting.create(meetingData);
      
      // Notify relevant users if it's a scheduled meeting
      if (meeting.type !== 'instant') {
        // TODO: Implement notification logic
      }

      res.status(201).json({
        success: true,
        data: meeting
      });
    } catch (error) {
      next(error);
    }
  },

  // Get meeting details
  async getMeeting(req, res, next) {
    try {
      const meeting = await Meeting.findById(req.params.id)
        .populate('host', 'name email')
        .populate('participants.user', 'name email');

      if (!meeting) {
        throw createError(404, 'Meeting not found');
      }

      // Check if user has access to meeting
      if (!meeting.participants.some(p => 
        p.user._id.toString() === req.user._id.toString()
      ) && meeting.host._id.toString() !== req.user._id.toString()) {
        throw createError(403, 'Access denied');
      }

      res.json({
        success: true,
        data: meeting
      });
    } catch (error) {
      next(error);
    }
  },

  // Update meeting
  async updateMeeting(req, res, next) {
    try {
      const meeting = await Meeting.findById(req.params.id);
      
      if (!meeting) {
        throw createError(404, 'Meeting not found');
      }

      // Only host can update meeting
      if (meeting.host.toString() !== req.user._id.toString()) {
        throw createError(403, 'Only host can update meeting');
      }

      const updatedMeeting = await Meeting.findByIdAndUpdate(
        req.params.id,
        { $set: req.body },
        { new: true }
      );

      // Notify participants of changes
      socketService.emitToRoom(
        `meeting:${meeting._id}`,
        'meeting:updated',
        updatedMeeting
      );

      res.json({
        success: true,
        data: updatedMeeting
      });
    } catch (error) {
      next(error);
    }
  },

  // Join meeting
  async joinMeeting(req, res, next) {
    try {
      const meeting = await Meeting.findById(req.params.id);
      
      if (!meeting) {
        throw createError(404, 'Meeting not found');
      }

      if (meeting.status !== 'live' && meeting.status !== 'scheduled') {
        throw createError(400, 'Meeting is not available for joining');
      }

      if (meeting.participants.length >= meeting.settings.maxParticipants) {
        throw createError(400, 'Meeting is at maximum capacity');
      }

      const participantData = {
        user: req.user._id,
        role: MEETING_ROLES.PARTICIPANT,
        deviceInfo: req.body.deviceInfo,
        connectionInfo: {
          ip: req.ip,
          ...req.body.connectionInfo
        }
      };

      await meeting.addParticipant(participantData);

      // Notify other participants
      socketService.emitToRoom(
        `meeting:${meeting._id}`,
        'participant:joined',
        {
          meetingId: meeting._id,
          participant: participantData
        }
      );

      res.json({
        success: true,
        data: {
          meeting,
          config: WEBRTC_CONFIG
        }
      });
    } catch (error) {
      next(error);
    }
  },

  // Leave meeting
  async leaveMeeting(req, res, next) {
    try {
      const meeting = await Meeting.findById(req.params.id);
      
      if (!meeting) {
        throw createError(404, 'Meeting not found');
      }

      await meeting.removeParticipant(req.user._id);

      // Notify other participants
      socketService.emitToRoom(
        `meeting:${meeting._id}`,
        'participant:left',
        {
          meetingId: meeting._id,
          userId: req.user._id
        }
      );

      res.json({
        success: true,
        message: 'Left meeting successfully'
      });
    } catch (error) {
      next(error);
    }
  },

  // End meeting (host only)
  async endMeeting(req, res, next) {
    try {
      const meeting = await Meeting.findById(req.params.id);
      
      if (!meeting) {
        throw createError(404, 'Meeting not found');
      }

      if (meeting.host.toString() !== req.user._id.toString()) {
        throw createError(403, 'Only host can end meeting');
      }

      meeting.status = 'ended';
      await meeting.save();

      // Notify all participants
      socketService.emitToRoom(
        `meeting:${meeting._id}`,
        'meeting:ended',
        { meetingId: meeting._id }
      );

      res.json({
        success: true,
        message: 'Meeting ended successfully'
      });
    } catch (error) {
      next(error);
    }
  },

  // List user's meetings
  async listMeetings(req, res, next) {
    try {
      const { 
        type = 'all',
        status = 'all',
        page = 1,
        limit = 20,
        sort = 'startTime',
        order = 'desc'
      } = req.query;

      const query = {
        $or: [
          { host: req.user._id },
          { 'participants.user': req.user._id }
        ]
      };

      if (type !== 'all') {
        query.type = type;
      }

      if (status !== 'all') {
        query.status = status;
      }

      const sortOption = {
        [sort]: order === 'desc' ? -1 : 1
      };

      const meetings = await Meeting.find(query)
        .sort(sortOption)
        .skip((page - 1) * limit)
        .limit(limit)
        .populate('host', 'name email')
        .populate('participants.user', 'name email');

      const total = await Meeting.countDocuments(query);

      res.json({
        success: true,
        data: {
          meetings,
          pagination: {
            page: Number(page),
            limit: Number(limit),
            total,
            pages: Math.ceil(total / limit)
          }
        }
      });
    } catch (error) {
      next(error);
    }
  }
};

module.exports = meetingController;
