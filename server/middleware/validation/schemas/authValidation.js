import Joi from 'joi';

export const registerSchema = Joi.object({
  name: Joi.string().required().min(2).max(50)
    .messages({
      'string.empty': 'Name is required',
      'string.min': 'Name must be at least 2 characters long',
      'string.max': 'Name cannot exceed 50 characters'
    }),

  email: Joi.string().required().email()
    .messages({
      'string.empty': 'Email is required',
      'string.email': 'Please provide a valid email address'
    }),

  password: Joi.string().required().min(8).max(128)
    .pattern(/^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d@$!%*#?&]{8,}$/)
    .messages({
      'string.empty': 'Password is required',
      'string.min': 'Password must be at least 8 characters long',
      'string.max': 'Password cannot exceed 128 characters',
      'string.pattern.base': 'Password must contain at least one letter and one number'
    }),

  roles: Joi.array()
    .items(
      Joi.string()
        .valid('admin', 'freelancer', 'client')
        .lowercase()
    )
    .unique()
    .required()
    .messages({
      'array.unique': 'Duplicate roles are not allowed',
      'any.only': 'Invalid role specified'
    })
});

export const loginSchema = Joi.object({
  email: Joi.string().required().email()
    .messages({
      'string.empty': 'Email is required',
      'string.email': 'Please provide a valid email address'
    }),

  password: Joi.string().required()
    .messages({
      'string.empty': 'Password is required'
    })
});

export const updatePasswordSchema = Joi.object({
  currentPassword: Joi.string().required()
    .messages({
      'string.empty': 'Current password is required'
    }),

  newPassword: Joi.string().required().min(8).max(128)
    .pattern(/^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d@$!%*#?&]{8,}$/)
    .messages({
      'string.empty': 'New password is required',
      'string.min': 'New password must be at least 8 characters long',
      'string.max': 'New password cannot exceed 128 characters',
      'string.pattern.base': 'New password must contain at least one letter and one number'
    }),

  confirmPassword: Joi.string()
    .valid(Joi.ref('newPassword'))
    .required()
    .messages({
      'any.only': 'Passwords must match',
      'string.empty': 'Please confirm your new password'
    })
});

export const forgotPasswordSchema = Joi.object({
  email: Joi.string().required().email()
    .messages({
      'string.empty': 'Email is required',
      'string.email': 'Please provide a valid email address'
    })
});

export const resetPasswordSchema = Joi.object({
  token: Joi.string().required()
    .messages({
      'string.empty': 'Reset token is required'
    }),
  newPassword: Joi.string().required().min(8).max(128)
    .pattern(/^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d@$!%*#?&]{8,}$/)
    .messages({
      'string.empty': 'New password is required',
      'string.min': 'New password must be at least 8 characters long',
      'string.max': 'New password cannot exceed 128 characters',
      'string.pattern.base': 'New password must contain at least one letter and one number'
    })
});

export const updateEmailSchema = Joi.object({
  email: Joi.string().required().email()
    .messages({
      'string.empty': 'Email is required',
      'string.email': 'Please provide a valid email address'
    }),
  password: Joi.string().required()
    .messages({
      'string.empty': 'Password is required to confirm email change'
    })
});

export const updateProfileSchema = Joi.object({
  name: Joi.string().required().min(2).max(50)
    .messages({
      'string.empty': 'Name is required',
      'string.min': 'Name must be at least 2 characters long',
      'string.max': 'Name cannot exceed 50 characters'
    })
});

export default {
  registerSchema,
  loginSchema,
  updatePasswordSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  updateEmailSchema,
  updateProfileSchema
};
