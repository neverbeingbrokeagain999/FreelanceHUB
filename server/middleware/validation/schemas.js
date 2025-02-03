import Joi from 'joi';

// Common validation patterns
const patterns = {
  password: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
  phone: /^\+?[1-9]\d{1,14}$/,
};

// Common validation messages
const messages = {
  password: 'Password must contain at least 8 characters, one uppercase letter, one lowercase letter, one number and one special character',
  required: 'This field is required',
  email: 'Please enter a valid email address',
  phone: 'Please enter a valid phone number',
};

// Auth Schemas
export const authSchemas = {
  register: Joi.object({
    email: Joi.string().email().required().messages({
      'string.email': messages.email,
      'any.required': messages.required,
    }),
    password: Joi.string().pattern(patterns.password).required().messages({
      'string.pattern.base': messages.password,
      'any.required': messages.required,
    }),
    name: Joi.string().min(2).max(50).required(),
    role: Joi.string().valid('client', 'freelancer').required(),
  }),

  login: Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().required(),
  }),
};

// User Schemas
export const userSchemas = {
  updateProfile: Joi.object({
    name: Joi.string().min(2).max(50),
    bio: Joi.string().max(500),
    skills: Joi.array().items(Joi.string()),
    hourlyRate: Joi.number().min(0),
    phone: Joi.string().pattern(patterns.phone).messages({
      'string.pattern.base': messages.phone,
    }),
    location: Joi.object({
      country: Joi.string(),
      city: Joi.string(),
    }),
  }),

  changePassword: Joi.object({
    currentPassword: Joi.string().required(),
    newPassword: Joi.string().pattern(patterns.password).required().messages({
      'string.pattern.base': messages.password,
      'any.required': messages.required,
    }),
  }),
};

// Job Schemas
export const jobSchemas = {
  create: Joi.object({
    title: Joi.string().min(10).max(100).required(),
    description: Joi.string().min(50).max(5000).required(),
    budget: Joi.object({
      minimum: Joi.number().min(0).required(),
      maximum: Joi.number().min(Joi.ref('minimum')).required(),
    }),
    skills: Joi.array().items(Joi.string()).min(1).required(),
    category: Joi.string().required(),
    type: Joi.string().valid('fixed', 'hourly').required(),
    duration: Joi.string().valid('short', 'medium', 'long').required(),
    experience: Joi.string().valid('entry', 'intermediate', 'expert').required(),
  }),

  update: Joi.object({
    title: Joi.string().min(10).max(100),
    description: Joi.string().min(50).max(5000),
    budget: Joi.object({
      minimum: Joi.number().min(0),
      maximum: Joi.number().min(Joi.ref('minimum')),
    }),
    skills: Joi.array().items(Joi.string()).min(1),
    status: Joi.string().valid('draft', 'published', 'closed'),
  }),
};

// Review Schemas
export const reviewSchemas = {
  create: Joi.object({
    recipient: Joi.string().required(),
    recipientRole: Joi.string().valid('client', 'freelancer').required(),
    jobId: Joi.string().when('recipientRole', {
      is: 'client',
      then: Joi.required(),
      otherwise: Joi.allow(null)
    }),
    title: Joi.string().min(5).max(100).required(),
    content: Joi.string().min(10).max(2000).required(),
    visibility: Joi.string().valid('public', 'private').default('public'),
    ratings: Joi.object({
      communication: Joi.number().min(1).max(5).required(),
      quality: Joi.number().min(1).max(5).required(),
      expertise: Joi.number().min(1).max(5).required(),
      deadlines: Joi.number().min(1).max(5).required(),
      cooperation: Joi.number().min(1).max(5).required(),
      requirements: Joi.number().min(1).max(5),
      paymentPromptness: Joi.number().min(1).max(5)
    }).required(),
    recommendations: Joi.object({
      wouldHireAgain: Joi.boolean(),
      wouldWorkAgain: Joi.boolean(),
      recommendToOthers: Joi.boolean()
    }).required()
  }),
  update: Joi.object({
    title: Joi.string().min(5).max(100),
    content: Joi.string().min(10).max(2000),
    ratings: Joi.object({
      communication: Joi.number().min(1).max(5),
      quality: Joi.number().min(1).max(5),
      expertise: Joi.number().min(1).max(5),
      deadlines: Joi.number().min(1).max(5),
      cooperation: Joi.number().min(1).max(5),
      requirements: Joi.number().min(1).max(5),
      paymentPromptness: Joi.number().min(1).max(5)
    }),
    visibility: Joi.string().valid('public', 'private'),
    recommendations: Joi.object({
      wouldHireAgain: Joi.boolean(),
      wouldWorkAgain: Joi.boolean(),
      recommendToOthers: Joi.boolean()
    })
  })
};

// Payment Schemas
export const paymentSchemas = {
  createPayment: Joi.object({
    amount: Joi.number().positive().required(),
    currency: Joi.string().valid('USD', 'EUR', 'GBP', 'INR').required(),
    paymentMethod: Joi.string().valid('stripe', 'paypal', 'razorpay').required(),
    description: Joi.string().max(255),
  }),
};

// Direct Contract Schemas
export const contractSchemas = {
  create: Joi.object({
    title: Joi.string().min(10).max(100).required(),
    description: Joi.string().min(50).max(2000).required(),
    terms: Joi.string().min(50).max(5000).required(),
    rate: Joi.number().positive().required(),
    rateType: Joi.string().valid('hourly', 'fixed').required(),
    startDate: Joi.date().min('now').required(),
    expectedEndDate: Joi.date().min(Joi.ref('startDate')),
  }),
};

// Meeting Schemas
export const meetingSchemas = {
  create: Joi.object({
    title: Joi.string().min(5).max(100).required(),
    description: Joi.string().max(500),
    scheduledFor: Joi.date().min('now').required(),
    duration: Joi.number().min(15).max(180).required(), // duration in minutes
    participants: Joi.array().items(Joi.string()).min(1).required(),
  }),
};

// Job Match Schemas
export const jobMatchSchemas = {
  preferences: Joi.object({
    skills: Joi.array().items(Joi.string()).min(1).required(),
    hourlyRate: Joi.object({
      minimum: Joi.number().min(0).required(),
      maximum: Joi.number().min(Joi.ref('minimum')).required(),
    }),
    availability: Joi.string().valid('full-time', 'part-time', 'contract').required(),
    categories: Joi.array().items(Joi.string()),
  }),
};

// Work Diary Schemas
export const workDiarySchemas = {
  create: Joi.object({
    contract: Joi.string().required(),
    timeSpent: Joi.number().min(1).max(24).required(), // hours
    description: Joi.string().min(10).max(500).required(),
    date: Joi.date().max('now').required(),
    activities: Joi.array().items(
      Joi.object({
        type: Joi.string().valid('coding', 'meeting', 'research', 'other').required(),
        duration: Joi.number().min(0).required(),
        description: Joi.string().max(200),
      })
    ),
  }),
};
