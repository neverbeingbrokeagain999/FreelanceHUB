const Joi = require('joi');

const languages = [
  'javascript',
  'python',
  'java',
  'cpp',
  'ruby',
  'go',
  'rust',
  'php',
  'csharp',
  'typescript',
  'html',
  'css',
  'sql'
];

const visibility = ['private', 'public', 'unlisted'];

const tagRegex = /^[a-zA-Z0-9-_.]+$/;

// Base snippet schema
const snippetBase = {
  title: Joi.string()
    .min(1)
    .max(100)
    .trim()
    .required()
    .messages({
      'string.empty': 'Title is required',
      'string.min': 'Title must be at least 1 character long',
      'string.max': 'Title must be less than 100 characters'
    }),

  content: Joi.string()
    .max(50000) // 50KB
    .required()
    .messages({
      'string.empty': 'Content is required',
      'string.max': 'Content must be less than 50KB'
    }),

  language: Joi.string()
    .valid(...languages)
    .required()
    .messages({
      'any.only': 'Invalid programming language',
      'any.required': 'Programming language is required'
    }),

  visibility: Joi.string()
    .valid(...visibility)
    .default('private')
    .messages({
      'any.only': 'Invalid visibility option'
    }),

  tags: Joi.array()
    .items(
      Joi.string()
        .pattern(tagRegex)
        .min(1)
        .max(30)
        .messages({
          'string.pattern.base': 'Tags can only contain letters, numbers, hyphens, dots, and underscores',
          'string.min': 'Tag cannot be empty',
          'string.max': 'Tag must be less than 30 characters'
        })
    )
    .unique()
    .max(10)
    .messages({
      'array.unique': 'Duplicate tags are not allowed',
      'array.max': 'Maximum 10 tags allowed'
    }),

  description: Joi.string()
    .max(500)
    .allow('')
    .trim()
    .messages({
      'string.max': 'Description must be less than 500 characters'
    }),

  executionConfig: Joi.object({
    timeout: Joi.number()
      .min(1000)
      .max(30000)
      .default(5000)
      .messages({
        'number.min': 'Timeout must be at least 1 second',
        'number.max': 'Timeout cannot exceed 30 seconds'
      }),

    memory: Joi.number()
      .min(64 * 1024 * 1024)
      .max(512 * 1024 * 1024)
      .default(128 * 1024 * 1024)
      .messages({
        'number.min': 'Memory limit must be at least 64MB',
        'number.max': 'Memory limit cannot exceed 512MB'
      })
  }).default(() => ({}))
};

// Create snippet schema
const createSchema = Joi.object({
  ...snippetBase
});

// Update snippet schema
const updateSchema = Joi.object({
  ...snippetBase,
  version: Joi.number()
    .required()
    .messages({
      'any.required': 'Version number is required for updates'
    })
}).min(1);

// Add collaborator schema
const addCollaboratorSchema = Joi.object({
  email: Joi.string()
    .email()
    .required()
    .messages({
      'string.email': 'Invalid email address',
      'any.required': 'Email is required'
    }),

  role: Joi.string()
    .valid('viewer', 'editor')
    .required()
    .messages({
      'any.only': 'Invalid role',
      'any.required': 'Role is required'
    })
});

// Add version schema
const addVersionSchema = Joi.object({
  content: Joi.string()
    .required()
    .max(50000)
    .messages({
      'string.empty': 'Content is required',
      'string.max': 'Content must be less than 50KB'
    }),

  commitMessage: Joi.string()
    .required()
    .min(1)
    .max(200)
    .trim()
    .messages({
      'string.empty': 'Commit message is required',
      'string.min': 'Commit message must not be empty',
      'string.max': 'Commit message must be less than 200 characters'
    })
});

// Restore version schema
const restoreVersionSchema = Joi.object({
  versionId: Joi.string()
    .required()
    .regex(/^[0-9a-fA-F]{24}$/)
    .messages({
      'string.empty': 'Version ID is required',
      'string.pattern.base': 'Invalid version ID format'
    })
});

// Execute code schema
const executeSchema = Joi.object({
  code: Joi.string()
    .required()
    .max(50000)
    .messages({
      'string.empty': 'Code is required',
      'string.max': 'Code must be less than 50KB'
    }),

  config: Joi.object({
    timeout: Joi.number()
      .min(1000)
      .max(30000),
    memory: Joi.number()
      .min(64 * 1024 * 1024)
      .max(512 * 1024 * 1024)
  }).default(() => ({}))
});

// Query params schema
const querySchema = Joi.object({
  search: Joi.string()
    .max(100)
    .allow('')
    .trim(),

  language: Joi.string()
    .valid(...languages, 'all')
    .default('all'),

  visibility: Joi.string()
    .valid(...visibility, 'all')
    .default('all'),

  tags: Joi.array()
    .items(Joi.string().regex(tagRegex))
    .single()
    .max(5),

  sort: Joi.string()
    .valid('updatedAt', 'createdAt', 'title', 'views', 'executions')
    .default('updatedAt'),

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
  addCollaboratorSchema,
  addVersionSchema,
  restoreVersionSchema,
  executeSchema,
  querySchema,
  languages,
  visibility
};
