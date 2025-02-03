import mongoose from 'mongoose';

const participantSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  role: {
    type: String,
    enum: ['host', 'participant'],
    default: 'participant'
  },
  joinedAt: {
    type: Date,
    default: Date.now
  },
  leftAt: Date,
  deviceInfo: {
    browser: String,
    os: String,
    device: String
  },
  connectionInfo: {
    ip: String,
    quality: String,
    networkType: String
  }
});

const recordingSchema = new mongoose.Schema({
  url: {
    type: String,
    required: true
  },
  startTime: Date,
  endTime: Date,
  size: Number,
  format: String,
  duration: Number,
  status: {
    type: String,
    enum: ['processing', 'available', 'failed'],
    default: 'processing'
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
    required: true
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
  file: {
    url: String,
    name: String,
    size: Number,
    type: String
  }
});

const screenShareSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  startTime: {
    type: Date,
    default: Date.now
  },
  endTime: Date,
  duration: Number
});

const meetingSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  job: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Job'
  },
  host: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  meetingId: {
    type: String,
    unique: true,
    required: true
  },
  password: String,
  startTime: {
    type: Date,
    required: true
  },
  endTime: Date,
  duration: Number,
  status: {
    type: String,
    enum: ['scheduled', 'active', 'completed', 'cancelled'],
    default: 'scheduled'
  },
  type: {
    type: String,
    enum: ['instant', 'scheduled', 'recurring'],
    default: 'instant'
  },
  participants: [participantSchema],
  maxParticipants: {
    type: Number,
    default: 10
  },
  settings: {
    audio: {
      type: Boolean,
      default: true
    },
    video: {
      type: Boolean,
      default: true
    },
    screenShare: {
      type: Boolean,
      default: true
    },
    chat: {
      type: Boolean,
      default: true
    },
    recording: {
      type: Boolean,
      default: false
    },
    waitingRoom: {
      type: Boolean,
      default: false
    },
    muteOnEntry: {
      type: Boolean,
      default: true
    }
  },
  recordings: [recordingSchema],
  chat: [chatMessageSchema],
  screenShares: [screenShareSchema],
  metadata: {
    agenda: String,
    notes: String,
    tags: [String]
  }
}, {
  timestamps: true
});

// Indexes for better query performance
meetingSchema.index({ host: 1, startTime: -1 });
meetingSchema.index({ meetingId: 1 }, { unique: true });
meetingSchema.index({ status: 1 });
meetingSchema.index({ 'participants.user': 1 });

// Virtual for checking if meeting is active
meetingSchema.virtual('isActive').get(function() {
  return this.status === 'active';
});

// Virtual for calculating real-time duration
meetingSchema.virtual('currentDuration').get(function() {
  if (!this.startTime) return 0;
  const end = this.endTime || new Date();
  return (end - this.startTime) / 1000; // in seconds
});

// Method to add participant
meetingSchema.methods.addParticipant = async function(userId, deviceInfo) {
  if (this.participants.length >= this.maxParticipants) {
    throw new Error('Meeting has reached maximum participants limit');
  }

  const existingParticipant = this.participants.find(
    p => p.user.toString() === userId.toString() && !p.leftAt
  );

  if (existingParticipant) {
    throw new Error('User is already in the meeting');
  }

  this.participants.push({
    user: userId,
    role: this.host.toString() === userId.toString() ? 'host' : 'participant',
    deviceInfo
  });

  await this.save();
  return this;
};

// Method to remove participant
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

// Method to end meeting
meetingSchema.methods.endMeeting = async function() {
  this.status = 'completed';
  this.endTime = new Date();
  this.duration = this.currentDuration;
  
  // Set leftAt for any remaining participants
  this.participants.forEach(p => {
    if (!p.leftAt) {
      p.leftAt = new Date();
    }
  });

  await this.save();
  return this;
};

const Meeting = mongoose.model('Meeting', meetingSchema);

export default Meeting;
