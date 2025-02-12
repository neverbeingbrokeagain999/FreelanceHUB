import express from 'express';
import { body, param, query } from 'express-validator';
import { protect as auth } from '../middleware/auth.js';
import { validate } from '../middleware/validation/validator.js';
import {
  getConversations,
  getMessages,
  sendMessage,
  markAsRead
} from '../controllers/chatController.js';

const router = express.Router();

// Get all conversations for the authenticated user
router.get('/conversations',
  auth,
  [
    query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
    query('limit').optional().isInt({ min: 1, max: 50 }).withMessage('Limit must be between 1 and 50'),
    query('search').optional().trim().isString(),
    validate
  ],
  getConversations
);

// Get messages for a specific conversation
router.get('/messages/:conversationId',
  auth,
  [
    param('conversationId').isMongoId().withMessage('Invalid conversation ID'),
    query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
    query('limit').optional().isInt({ min: 1, max: 50 }).withMessage('Limit must be between 1 and 50'),
    query('before').optional().isISO8601().withMessage('Invalid before date'),
    validate
  ],
  getMessages
);

// Send a new message
router.post('/messages',
  auth,
  [
    body('conversationId').isMongoId().withMessage('Invalid conversation ID'),
    body('content').trim().notEmpty().isLength({ max: 5000 }).withMessage('Message content is required and cannot exceed 5000 characters'),
    body('attachments').optional().isArray().withMessage('Attachments must be an array'),
    body('attachments.*.url').optional().isURL().withMessage('Invalid attachment URL'),
    body('attachments.*.type').optional().isIn(['image', 'document', 'other']).withMessage('Invalid attachment type'),
    validate
  ],
  sendMessage
);

// Mark messages as read
router.put('/messages/read/:conversationId',
  auth,
  [
    param('conversationId').isMongoId().withMessage('Invalid conversation ID'),
    body('lastReadMessage').isMongoId().withMessage('Invalid message ID'),
    validate
  ],
  markAsRead
);

export default router;
