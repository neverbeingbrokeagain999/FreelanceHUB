import Joi from 'joi';
import { objectIdPattern } from '../../../utils/validation.js';

export const escrowValidation = {
  // Create new escrow
  createEscrow: {
    body: Joi.object({
      jobId: Joi.string().pattern(objectIdPattern).required()
        .messages({
          'string.pattern.base': 'Invalid job ID format'
        }),
      freelancerId: Joi.string().pattern(objectIdPattern).required()
        .messages({
          'string.pattern.base': 'Invalid freelancer ID format'
        }),
      amount: Joi.number().positive().required()
        .messages({
          'number.positive': 'Amount must be greater than 0'
        }),
      paymentGatewayId: Joi.string().pattern(objectIdPattern).required()
        .messages({
          'string.pattern.base': 'Invalid payment gateway ID format'
        }),
      paymentMethod: Joi.string().required()
        .valid('credit_card', 'bank_transfer', 'paypal', 'wallet', 'crypto')
        .messages({
          'any.only': 'Invalid payment method'
        })
    })
  },

  // Fund escrow
  fundEscrow: {
    body: Joi.object({
      escrowId: Joi.string().pattern(objectIdPattern).required()
        .messages({
          'string.pattern.base': 'Invalid escrow ID format'
        }),
      transactionId: Joi.string().required()
        .messages({
          'string.empty': 'Transaction ID is required'
        })
    })
  },

  // Release escrow
  releaseEscrow: {
    params: Joi.object({
      escrowId: Joi.string().pattern(objectIdPattern).required()
        .messages({
          'string.pattern.base': 'Invalid escrow ID format'
        })
    }),
    body: Joi.object({
      amount: Joi.number().positive().optional()
        .messages({
          'number.positive': 'Amount must be greater than 0'
        }),
      notes: Joi.string().max(500).optional()
        .messages({
          'string.max': 'Notes cannot exceed 500 characters'
        })
    })
  },

  // Dispute escrow
  disputeEscrow: {
    params: Joi.object({
      escrowId: Joi.string().pattern(objectIdPattern).required()
        .messages({
          'string.pattern.base': 'Invalid escrow ID format'
        })
    }),
    body: Joi.object({
      reason: Joi.string().min(10).max(1000).required()
        .messages({
          'string.min': 'Dispute reason must be at least 10 characters long',
          'string.max': 'Dispute reason cannot exceed 1000 characters'
        })
    })
  },

  // Get escrow details
  getEscrowDetails: {
    params: Joi.object({
      escrowId: Joi.string().pattern(objectIdPattern).required()
        .messages({
          'string.pattern.base': 'Invalid escrow ID format'
        })
    })
  }
};

export default escrowValidation;
