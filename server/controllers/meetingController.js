import Meeting from '../models/Meeting.js';
import User from '../models/User.js';
import { v4 as uuidv4 } from 'uuid';
import { io } from '../index.js';

// Create a new meeting
export const createMeeting = async (req, res) => {
  try {
    const {
      title,
      startTime,
      jobId,
      type = 'instant',
      settings,
      metadata,
      maxParticipants
    } = req.body;

    const meeting = new Meeting({
      title,
      host: req.user.id,
      meetingId: uuidv4(),
      startTime: startTime || new Date(),
      job: jobId,
      type,
      settings: { ...Meeting.schema.obj.settings, ...settings },
      metadata,
      maxParticipants: maxParticipants || 10,
      password: type === 'scheduled' ? Math.random().toString(36).slice(-8).toUpperCase() : undefined
    });

    await meeting.save();

    // If it's a scheduled meeting, notify relevant participants
    if (type === 'scheduled' && jobId) {
      // TODO: Send notifications to job participants
    }

    res.status(201).json({
      message: 'Meeting created successfully',
      meeting: {
        ...meeting.toJSON(),
        password: meeting.password // Include password only in response
      }
    });
  } catch (error) {
    console.error('Create meeting error:', error);
    res.status(500).json({
      message: 'Failed to create meeting',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Join a meeting
export const joinMeeting = async (req, res) => {
  try {
    const { meetingId, password, deviceInfo } = req.body;
    const userId = req.user.id;

    const meeting = await Meeting.findOne({ meetingId }).populate('host', 'name');
    if (!meeting) {
      return res.status(404).json({ message: 'Meeting not found' });
    }

    if (meeting.status === 'completed' || meeting.status === 'cancelled') {
      return res.status(400).json({ message: 'Meeting has ended' });
    }

    // Check password for scheduled meetings
    if (meeting.type === 'scheduled' && meeting.password !== password) {
      return res.status(401).json({ message: 'Invalid meeting password' });
    }

    // Add participant
    await meeting.addParticipant(userId, deviceInfo);

    // If this is the first participant, start the meeting
    if (meeting.status === 'scheduled' && meeting.participants.length === 1) {
      meeting.status = 'active';
      await meeting.save();
    }

    // Create a room for socket.io
    const room = `meeting_${meetingId}`;
    io.to(room).emit('participantJoined', {
      userId,
      name: req.user.name,
      role: meeting.host.toString() === userId ? 'host' : 'participant'
    });

    res.json({
      message: 'Joined meeting successfully',
      meeting: {
        ...meeting.toJSON(),
        password: undefined // Don't send password in response
      }
    });
  } catch (error) {
    console.error('Join meeting error:', error);
    res.status(500).json({
      message: 'Failed to join meeting',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Leave meeting
export const leaveMeeting = async (req, res) => {
  try {
    const { meetingId } = req.params;
    const userId = req.user.id;

    const meeting = await Meeting.findOne({ meetingId });
    if (!meeting) {
      return res.status(404).json({ message: 'Meeting not found' });
    }

    await meeting.removeParticipant(userId);

    // Notify other participants
    const room = `meeting_${meetingId}`;
    io.to(room).emit('participantLeft', {
      userId,
      name: req.user.name
    });

    // If no participants left, end the meeting
    const activeParticipants = meeting.participants.filter(p => !p.leftAt);
    if (activeParticipants.length === 0) {
      await meeting.endMeeting();
    }

    res.json({ message: 'Left meeting successfully' });
  } catch (error) {
    console.error('Leave meeting error:', error);
    res.status(500).json({
      message: 'Failed to leave meeting',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// End meeting (host only)
export const endMeeting = async (req, res) => {
  try {
    const { meetingId } = req.params;
    const userId = req.user.id;

    const meeting = await Meeting.findOne({ meetingId });
    if (!meeting) {
      return res.status(404).json({ message: 'Meeting not found' });
    }

    if (meeting.host.toString() !== userId) {
      return res.status(403).json({ message: 'Only host can end meeting' });
    }

    await meeting.endMeeting();

    // Notify all participants
    const room = `meeting_${meetingId}`;
    io.to(room).emit('meetingEnded', {
      meetingId,
      endedBy: req.user.name
    });

    res.json({ message: 'Meeting ended successfully' });
  } catch (error) {
    console.error('End meeting error:', error);
    res.status(500).json({
      message: 'Failed to end meeting',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Start/Stop recording
export const toggleRecording = async (req, res) => {
  try {
    const { meetingId } = req.params;
    const userId = req.user.id;

    const meeting = await Meeting.findOne({ meetingId });
    if (!meeting) {
      return res.status(404).json({ message: 'Meeting not found' });
    }

    if (meeting.host.toString() !== userId) {
      return res.status(403).json({ message: 'Only host can manage recording' });
    }

    const isRecording = meeting.recordings.some(r => !r.endTime);
    if (isRecording) {
      // Stop recording
      const currentRecording = meeting.recordings.find(r => !r.endTime);
      currentRecording.endTime = new Date();
      currentRecording.duration = (currentRecording.endTime - currentRecording.startTime) / 1000;
      currentRecording.status = 'processing';
    } else {
      // Start recording
      meeting.recordings.push({
        url: `recordings/${meetingId}/${Date.now()}.mp4`, // Placeholder URL
        startTime: new Date(),
        format: 'mp4'
      });
    }

    await meeting.save();

    // Notify participants
    const room = `meeting_${meetingId}`;
    io.to(room).emit('recordingStatusChanged', {
      isRecording: !isRecording
    });

    res.json({
      message: `Recording ${isRecording ? 'stopped' : 'started'} successfully`
    });
  } catch (error) {
    console.error('Toggle recording error:', error);
    res.status(500).json({
      message: 'Failed to toggle recording',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Get meeting details
export const getMeeting = async (req, res) => {
  try {
    const { meetingId } = req.params;
    const userId = req.user.id;

    const meeting = await Meeting.findOne({ meetingId })
      .populate('host', 'name')
      .populate('participants.user', 'name');

    if (!meeting) {
      return res.status(404).json({ message: 'Meeting not found' });
    }

    // Check if user is participant or host
    const isParticipant = meeting.participants.some(p => p.user._id.toString() === userId);
    const isHost = meeting.host._id.toString() === userId;

    if (!isParticipant && !isHost) {
      return res.status(403).json({ message: 'Not authorized to view meeting details' });
    }

    res.json({
      ...meeting.toJSON(),
      password: undefined // Don't send password in response
    });
  } catch (error) {
    console.error('Get meeting error:', error);
    res.status(500).json({
      message: 'Failed to fetch meeting details',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Get user's meetings
export const getUserMeetings = async (req, res) => {
  try {
    const userId = req.user.id;
    const { status, type, limit = 10, page = 1 } = req.query;

    const query = {
      $or: [
        { host: userId },
        { 'participants.user': userId }
      ]
    };

    if (status) query.status = status;
    if (type) query.type = type;

    const [meetings, total] = await Promise.all([
      Meeting.find(query)
        .sort({ startTime: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .populate('host', 'name')
        .lean(),
      Meeting.countDocuments(query)
    ]);

    res.json({
      meetings: meetings.map(m => ({ ...m, password: undefined })),
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalMeetings: total
      }
    });
  } catch (error) {
    console.error('Get user meetings error:', error);
    res.status(500).json({
      message: 'Failed to fetch meetings',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};
