const Meeting = require('../models/Meeting');
const { WEBRTC_EVENTS } = require('../config/webrtc');
const logger = require('../config/logger');

class MeetingHandler {
  constructor(io, socket) {
    this.io = io;
    this.socket = socket;
    this.user = socket.user;

    // Bind methods
    this.handleJoinMeeting = this.handleJoinMeeting.bind(this);
    this.handleLeaveMeeting = this.handleLeaveMeeting.bind(this);
    this.handleSignalingMessage = this.handleSignalingMessage.bind(this);
    this.handleMediaStateChange = this.handleMediaStateChange.bind(this);
    this.handleNetworkStats = this.handleNetworkStats.bind(this);
    this.handleError = this.handleError.bind(this);

    // Register event handlers
    this.registerHandlers();
  }

  registerHandlers() {
    this.socket.on('meeting:join', this.handleJoinMeeting);
    this.socket.on('meeting:leave', this.handleLeaveMeeting);
    this.socket.on('meeting:signal', this.handleSignalingMessage);
    this.socket.on('meeting:media', this.handleMediaStateChange);
    this.socket.on('meeting:networkStats', this.handleNetworkStats);
    this.socket.on('meeting:error', this.handleError);
  }

  async handleJoinMeeting(data) {
    try {
      const { meetingId } = data;
      
      const meeting = await Meeting.findById(meetingId);
      if (!meeting) {
        throw new Error('Meeting not found');
      }

      // Join the meeting's socket room
      this.socket.join(`meeting:${meetingId}`);

      // Get existing participants for WebRTC connections
      const activeParticipants = meeting.participants
        .filter(p => !p.leftAt)
        .map(p => ({
          userId: p.user.toString(),
          role: p.role,
          media: p.media
        }));

      // Notify existing participants about the new peer
      this.socket.to(`meeting:${meetingId}`).emit(WEBRTC_EVENTS.PEER_CONNECT, {
        peerId: this.socket.id,
        userId: this.user._id,
        role: data.role || 'participant',
        media: data.media || { video: true, audio: true }
      });

      // Send existing peers info to the new participant
      this.socket.emit('meeting:peers', {
        peers: activeParticipants,
        config: meeting.settings
      });

      logger.info({
        message: 'User joined meeting',
        userId: this.user._id,
        meetingId,
        socketId: this.socket.id
      });
    } catch (error) {
      logger.error({
        message: 'Error joining meeting',
        error: error.message,
        userId: this.user._id,
        socketId: this.socket.id
      });
      this.socket.emit('meeting:error', { message: error.message });
    }
  }

  async handleLeaveMeeting(data) {
    try {
      const { meetingId } = data;
      
      // Leave the socket room
      this.socket.leave(`meeting:${meetingId}`);

      // Notify other participants
      this.socket.to(`meeting:${meetingId}`).emit(WEBRTC_EVENTS.PEER_DISCONNECT, {
        peerId: this.socket.id,
        userId: this.user._id
      });

      logger.info({
        message: 'User left meeting',
        userId: this.user._id,
        meetingId,
        socketId: this.socket.id
      });
    } catch (error) {
      logger.error({
        message: 'Error leaving meeting',
        error: error.message,
        userId: this.user._id,
        socketId: this.socket.id
      });
    }
  }

  handleSignalingMessage(data) {
    const { targetId, meetingId, type, payload } = data;

    // Forward WebRTC signaling messages to the target peer
    this.io.to(targetId).emit('meeting:signal', {
      peerId: this.socket.id,
      userId: this.user._id,
      type,
      payload
    });
  }

  async handleMediaStateChange(data) {
    try {
      const { meetingId, media } = data;
      
      // Update participant's media state in the database
      await Meeting.updateOne(
        {
          _id: meetingId,
          'participants.user': this.user._id
        },
        {
          $set: {
            'participants.$.media': media
          }
        }
      );

      // Notify other participants
      this.socket.to(`meeting:${meetingId}`).emit('meeting:mediaUpdate', {
        userId: this.user._id,
        media
      });
    } catch (error) {
      logger.error({
        message: 'Error updating media state',
        error: error.message,
        userId: this.user._id
      });
    }
  }

  async handleNetworkStats(data) {
    try {
      const { meetingId, stats } = data;
      
      // Update network statistics in the database
      await Meeting.updateOne(
        {
          _id: meetingId,
          'participants.user': this.user._id
        },
        {
          $set: {
            'participants.$.networkStats': {
              ...stats,
              timestamp: new Date()
            }
          }
        }
      );

      // Emit to hosts for monitoring
      this.socket.to(`meeting:${meetingId}:hosts`).emit('meeting:networkStats', {
        userId: this.user._id,
        stats
      });
    } catch (error) {
      logger.error({
        message: 'Error updating network stats',
        error: error.message,
        userId: this.user._id
      });
    }
  }

  handleError(data) {
    logger.error({
      message: 'Meeting WebRTC error',
      error: data.error,
      userId: this.user._id,
      meetingId: data.meetingId,
      socketId: this.socket.id
    });
  }

  // Clean up on socket disconnect
  async handleDisconnect() {
    try {
      // Find active meetings for this user
      const activeMeetings = await Meeting.find({
        'participants': {
          $elemMatch: {
            user: this.user._id,
            leftAt: null
          }
        }
      });

      // Update participant status and notify others for each meeting
      for (const meeting of activeMeetings) {
        await this.handleLeaveMeeting({ meetingId: meeting._id });
      }
    } catch (error) {
      logger.error({
        message: 'Error handling socket disconnect',
        error: error.message,
        userId: this.user._id,
        socketId: this.socket.id
      });
    }
  }
}

module.exports = MeetingHandler;
