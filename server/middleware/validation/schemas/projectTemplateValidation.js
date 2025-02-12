import Joi from 'joi';

// Base schemas
const id = Joi.string()
  .regex(/^[0-9a-fA-F]{24}$/)
  .messages({
    'string.pattern.base': 'Invalid ID format'
  });

const name = Joi.string()
  .min(3)
  .max(100)
  .trim()
  .required()
  .messages({
    'string.empty': 'Name is required',
    'string.min': 'Name must be at least 3 characters',
    'string.max': 'Name cannot be longer than 100 characters'
  });

const description = Joi.string()
  .min(10)
  .max(2000)
  .trim()
  .required()
  .messages({
    'string.empty': 'Description is required',
    'string.min': 'Description must be at least 10 characters',
    'string.max': 'Description cannot be longer than 2000 characters'
  });

const category = Joi.string()
  .trim()
  .required()
  .messages({
    'string.empty': 'Category is required'
  });

const skills = Joi.array()
  .items(Joi.string().trim())
  .min(1)
  .unique()
  .required()
  .messages({
    'array.min': 'At least one skill is required',
    'array.unique': 'Skills must be unique'
  });

const budget = Joi.object({
  min: Joi.number()
    .min(1)
    .required()
    .messages({
      'number.min': 'Minimum budget must be greater than 0'
    }),
  max: Joi.number()
    .greater(Joi.ref('min'))
    .required()
    .messages({
      'number.greater': 'Maximum budget must be greater than minimum budget'
    })
}).required();

const duration = Joi.string()
  .valid('less_than_1_month', '1_to_3_months', '3_to_6_months', 'more_than_6_months')
  .messages({
    'any.only': 'Invalid duration value'
  });

const experienceLevel = Joi.string()
  .valid('entry', 'intermediate', 'expert')
  .messages({
    'any.only': 'Invalid experience level'
  });

// Schema objects
export const createTemplateSchema = {
  body: Joi.object({
    name,
    description,
    category,
    skills,
    budget,
    duration: duration.optional(),
    experienceLevel: experienceLevel.optional(),
    requirements: Joi.string().max(2000).optional().allow(''),
    type: Joi.string().valid('fixed', 'hourly').optional()
  })
};

export const updateTemplateSchema = {
  params: Joi.object({
    id
  }),
  body: Joi.object({
    name: name.optional(),
    description: description.optional(),
    category: category.optional(),
    skills: skills.optional(),
    budget: budget.optional(),
    duration: duration.optional(),
    experienceLevel: experienceLevel.optional(),
    requirements: Joi.string().max(2000).optional().allow(''),
    type: Joi.string().valid('fixed', 'hourly').optional()
  }).min(1)
};

export const getTemplateSchema = {
  params: Joi.object({
    id
  })
};

export const deleteTemplateSchema = {
  params: Joi.object({
    id
  })
};

export const listTemplatesSchema = {
  query: Joi.object({
    page: Joi.number().min(1).optional(),
    limit: Joi.number().min(1).max(100).optional(),
    category: Joi.string().trim().optional(),
    sort: Joi.string().optional(),
    search: Joi.string().trim().min(2).optional(),
    skills: Joi.string().trim().optional()
  })
};

export default {
  createTemplateSchema,
  updateTemplateSchema,
  getTemplateSchema,
  deleteTemplateSchema,
  listTemplatesSchema
};
