const mongoose = require('mongoose');
const { MEETING_ROLES } = require('../config/webrtc');

const participantSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  role: {
    type: String,
    enum: Object.values(MEETING_ROLES),
    default: MEETING_ROLES.PARTICIPANT
  },
  joinedAt: {
    type: Date,
    default: Date.now
  },
  leftAt: {
    type: Date
  },
  deviceInfo: {
    browser: String,
    os: String,
    device: String
  },
  connectionInfo: {
    ip: String,
    country: String,
    region: String
  },
  media: {
    video: {
      type: Boolean,
      default: true
    },
    audio: {
      type: Boolean,
      default: true
    },
    screen: {
      type: Boolean,
      default: false
    }
  },
  networkStats: {
    bitrate: Number,
    packetsLost: Number,
    roundTripTime: Number,
    timestamp: Date
  }
});

const recordingSchema = new mongoose.Schema({
  startTime: {
    type: Date,
    required: true
  },
  endTime: Date,
  size: Number,
  format: {
    type: String,
    enum: ['webm', 'mp4'],
    default: 'webm'
  },
  status: {
    type: String,
    enum: ['recording', 'processing', 'completed', 'failed'],
    default: 'recording'
  },
  url: String,
  recordedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
});

const chatMessageSchema = new mongoose.Schema({
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  content: {
    type: String,
    required: true,
    maxlength: 1000
  },
  timestamp: {
    type: Date,
    default: Date.now
  },
  type: {
    type: String,
    enum: ['text', 'file', 'system'],
    default: 'text'
  },
  visibility: {
    type: String,
    enum: ['everyone', 'hosts', 'private'],
    default: 'everyone'
  },
  recipients: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  fileInfo: {
    name: String,
    size: Number,
    type: String,
    url: String
  }
});

const meetingSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200
  },
  description: {
    type: String,
    trim: true,
    maxlength: 1000
  },
  host: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  type: {
    type: String,
    enum: ['instant', 'scheduled', 'recurring', 'permanent'],
    default: 'instant'
  },
  status: {
    type: String,
    enum: ['scheduled', 'live', 'ended', 'cancelled'],
    default: 'scheduled'
  },
  schedule: {
    startTime: Date,
    endTime: Date,
    recurrence: {
      frequency: {
        type: String,
        enum: ['daily', 'weekly', 'monthly']
      },
      interval: Number, // e.g., every 2 weeks
      daysOfWeek: [Number], // 0-6 for Sunday-Saturday
      endDate: Date
    }
  },
  settings: {
    maxParticipants: {
      type: Number,
      default: 16,
      max: 50
    },
    features: {
      recording: {
        type: Boolean,
        default: true
      },
      chat: {
        type: Boolean,
        default: true
      },
      screenSharing: {
        type: Boolean,
        default: true
      },
      whiteboard: {
        type: Boolean,
        default: true
      }
    },
    security: {
      waitingRoom: {
        type: Boolean,
        default: true
      },
      requireAuthentication: {
        type: Boolean,
        default: true
      },
      password: String,
      encryption: {
        type: Boolean,
        default: true
      }
    },
    quality: {
      video: {
        type: String,
        enum: ['low', 'medium', 'high'],
        default: 'medium'
      },
      audio: {
        type: Boolean,
        default: true
      }
    }
  },
  participants: [participantSchema],
  recordings: [recordingSchema],
  chat: [chatMessageSchema],
  statistics: {
    peakParticipants: {
      type: Number,
      default: 0
    },
    totalDuration: {
      type: Number,
      default: 0
    },
    averageParticipants: {
      type: Number,
      default: 0
    },
    networkQuality: {
      type: Number,
      min: 1,
      max: 5,
      default: 5
    }
  }
}, {
  timestamps: true
});

// Indexes
meetingSchema.index({ host: 1, status: 1 });
meetingSchema.index({ 'schedule.startTime': 1 });
meetingSchema.index({ 'participants.user': 1, status: 1 });
meetingSchema.index({ title: 'text', description: 'text' });

// Methods
meetingSchema.methods.addParticipant = async function(userData) {
  if (this.participants.length >= this.settings.maxParticipants) {
    throw new Error('Meeting is at maximum capacity');
  }
  
  const existingParticipant = this.participants.find(
    p => p.user.toString() === userData.user.toString()
  );

  if (existingParticipant && !existingParticipant.leftAt) {
    throw new Error('User is already in the meeting');
  }

  this.participants.push(userData);
  await this.save();
  return this;
};

meetingSchema.methods.removeParticipant = async function(userId) {
  const participant = this.participants.find(
    p => p.user.toString() === userId.toString() && !p.leftAt
  );

  if (participant) {
    participant.leftAt = new Date();
    await this.save();
  }

  return this;
};

module.exports = mongoose.model('Meeting', meetingSchema);
