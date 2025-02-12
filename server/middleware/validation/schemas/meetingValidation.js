const Joi = require('joi');
const { MEETING_ROLES } = require('../../../config/webrtc');

// Basic meeting types
const meetingTypes = ['instant', 'scheduled', 'recurring', 'permanent'];
const meetingStatuses = ['scheduled', 'live', 'ended', 'cancelled'];
const recurrenceFrequencies = ['daily', 'weekly', 'monthly'];
const messageTypes = ['text', 'file', 'system'];
const messageVisibility = ['everyone', 'hosts', 'private'];
const recordingFormats = ['webm', 'mp4'];
const recordingStatuses = ['recording', 'processing', 'completed', 'failed'];
const videoQualities = ['low', 'medium', 'high'];

// Reusable schemas
const timeRangeSchema = Joi.object({
  startTime: Joi.date().required(),
  endTime: Joi.date().min(Joi.ref('startTime')).required()
});

const recurrenceSchema = Joi.object({
  frequency: Joi.string()
    .valid(...recurrenceFrequencies)
    .required(),
  interval: Joi.number()
    .min(1)
    .max(52)
    .required(),
  daysOfWeek: Joi.array()
    .items(Joi.number().min(0).max(6))
    .unique()
    .when('frequency', {
      is: 'weekly',
      then: Joi.array().min(1).required()
    }),
  endDate: Joi.date()
    .min('now')
    .required()
});

const settingsSchema = Joi.object({
  maxParticipants: Joi.number()
    .min(2)
    .max(50)
    .default(16),
  features: Joi.object({
    recording: Joi.boolean().default(true),
    chat: Joi.boolean().default(true),
    screenSharing: Joi.boolean().default(true),
    whiteboard: Joi.boolean().default(true)
  }),
  security: Joi.object({
    waitingRoom: Joi.boolean().default(true),
    requireAuthentication: Joi.boolean().default(true),
    password: Joi.string()
      .min(6)
      .max(50)
      .allow(null, ''),
    encryption: Joi.boolean().default(true)
  }),
  quality: Joi.object({
    video: Joi.string()
      .valid(...videoQualities)
      .default('medium'),
    audio: Joi.boolean().default(true)
  })
});

// Create meeting schema
const createSchema = Joi.object({
  title: Joi.string()
    .required()
    .trim()
    .min(3)
    .max(200)
    .messages({
      'string.empty': 'Meeting title is required',
      'string.min': 'Meeting title must be at least 3 characters long',
      'string.max': 'Meeting title cannot exceed 200 characters'
    }),

  description: Joi.string()
    .trim()
    .max(1000)
    .allow('', null)
    .messages({
      'string.max': 'Description cannot exceed 1000 characters'
    }),

  type: Joi.string()
    .valid(...meetingTypes)
    .required()
    .messages({
      'any.only': 'Invalid meeting type'
    }),

  schedule: Joi.when('type', {
    is: Joi.string().valid('scheduled', 'recurring'),
    then: timeRangeSchema.required(),
    otherwise: Joi.forbidden()
  }),

  recurrence: Joi.when('type', {
    is: 'recurring',
    then: recurrenceSchema.required(),
    otherwise: Joi.forbidden()
  }),

  settings: settingsSchema.default(() => ({}))
});

// Update meeting schema
const updateSchema = Joi.object({
  title: Joi.string()
    .trim()
    .min(3)
    .max(200),

  description: Joi.string()
    .trim()
    .max(1000)
    .allow('', null),

  status: Joi.string()
    .valid(...meetingStatuses),

  schedule: timeRangeSchema,
  recurrence: recurrenceSchema,
  settings: settingsSchema
}).min(1);

// Add participant schema
const participantSchema = Joi.object({
  role: Joi.string()
    .valid(...Object.values(MEETING_ROLES))
    .default(MEETING_ROLES.PARTICIPANT),

  deviceInfo: Joi.object({
    browser: Joi.string().required(),
    os: Joi.string().required(),
    device: Joi.string().required()
  }).required(),

  connectionInfo: Joi.object({
    ip: Joi.string().ip().required(),
    country: Joi.string(),
    region: Joi.string()
  }).required()
});

// Chat message schema
const chatMessageSchema = Joi.object({
  content: Joi.string()
    .required()
    .trim()
    .max(1000)
    .messages({
      'string.empty': 'Message content is required',
      'string.max': 'Message cannot exceed 1000 characters'
    }),

  type: Joi.string()
    .valid(...messageTypes)
    .default('text'),

  visibility: Joi.string()
    .valid(...messageVisibility)
    .default('everyone'),

  recipients: Joi.when('visibility', {
    is: 'private',
    then: Joi.array()
      .items(Joi.string().regex(/^[0-9a-fA-F]{24}$/))
      .min(1)
      .required(),
    otherwise: Joi.forbidden()
  }),

  fileInfo: Joi.when('type', {
    is: 'file',
    then: Joi.object({
      name: Joi.string().required(),
      size: Joi.number().required(),
      type: Joi.string().required(),
      url: Joi.string().uri().required()
    }).required(),
    otherwise: Joi.forbidden()
  })
});

// Recording schema
const recordingSchema = Joi.object({
  format: Joi.string()
    .valid(...recordingFormats)
    .default('webm'),

  status: Joi.string()
    .valid(...recordingStatuses)
    .default('recording')
});

// Query schema for listing meetings
const querySchema = Joi.object({
  type: Joi.string()
    .valid(...meetingTypes, 'all')
    .default('all'),

  status: Joi.string()
    .valid(...meetingStatuses, 'all')
    .default('all'),

  startDate: Joi.date(),
  endDate: Joi.date()
    .min(Joi.ref('startDate')),

  search: Joi.string()
    .trim()
    .max(200),

  sort: Joi.string()
    .valid('startTime', 'title', 'status', 'participants')
    .default('startTime'),

  order: Joi.string()
    .valid('asc', 'desc')
    .default('desc'),

  page: Joi.number()
    .min(1)
    .default(1),

  limit: Joi.number()
    .min(1)
    .max(100)
    .default(20)
});

module.exports = {
  createSchema,
  updateSchema,
  participantSchema,
  chatMessageSchema,
  recordingSchema,
  querySchema,
  meetingTypes,
  meetingStatuses,
  recurrenceFrequencies,
  messageTypes,
  messageVisibility,
  recordingFormats,
  recordingStatuses,
  videoQualities
};
