import express from 'express';
import { param, query } from 'express-validator';
import { protect as auth } from '../middleware/auth.js';
import { validate } from '../middleware/validation/validator.js';
import { 
  getAllNotifications, 
  markAsRead, 
  deleteNotification,
  getUnreadCount
} from '../controllers/notificationController.js';

const router = express.Router();

// Get all notifications for authenticated user
router.get('/',
  auth,
  [
    query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
    query('limit').optional().isInt({ min: 1, max: 50 }).withMessage('Limit must be between 1 and 50'),
    query('type').optional().isIn(['job', 'message', 'payment', 'system']).withMessage('Invalid notification type'),
    query('read').optional().isBoolean().withMessage('Read status must be a boolean'),
    validate
  ],
  getAllNotifications
);

// Get unread notifications count
router.get('/unread-count',
  auth,
  [
    query('type').optional().isIn(['job', 'message', 'payment', 'system']).withMessage('Invalid notification type'),
    validate
  ],
  getUnreadCount
);

// Mark notification as read
router.put('/:id/read',
  auth,
  [
    param('id').isMongoId().withMessage('Invalid notification ID'),
    validate
  ],
  markAsRead
);

// Delete a notification
router.delete('/:id',
  auth,
  [
    param('id').isMongoId().withMessage('Invalid notification ID'),
    validate
  ],
  deleteNotification
);

export default router;
