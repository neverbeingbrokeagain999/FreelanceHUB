import Notification from '../models/Notification.js';
import { errorResponse, ApiError } from '../utils/errorHandler.js';
import { logger } from '../config/logger.js';

export const getAllNotifications = async (req, res) => {
  try {
    // Log request for manual verification
    logger.info('Manual verification - Fetching notifications:', {
      userId: req.user._id,
      timestamp: new Date().toISOString(),
      operation: 'getAllNotifications'
    });

    const notifications = await Notification.find({
      recipient: req.user._id,
      // Exclude any auto-generated notifications
      type: { $ne: 'system_generated' }
    })
    .populate('sender', 'name avatar')
    .sort('-createdAt');

    // Log response for verification
    logger.info('Manual verification - Notifications fetched:', {
      userId: req.user._id,
      count: notifications.length,
      types: notifications.map(n => n.type),
      timestamp: new Date().toISOString()
    });

    res.json(notifications);
  } catch (error) {
    logger.error('Manual verification - Get notifications error:', {
      userId: req.user._id,
      error: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString()
    });
    return errorResponse(res, 500, 'Error fetching notifications');
  }
};

export const getUnreadCount = async (req, res) => {
  try {
    // Log request for manual verification
    logger.info('Manual verification - Getting unread count:', {
      userId: req.user._id,
      timestamp: new Date().toISOString(),
      operation: 'getUnreadCount'
    });

    const count = await Notification.countDocuments({
      recipient: req.user._id,
      read: false,
      type: { $ne: 'system_generated' }
    });

    // Log response for verification
    logger.info('Manual verification - Unread count retrieved:', {
      userId: req.user._id,
      count,
      timestamp: new Date().toISOString()
    });

    res.json({ count });
  } catch (error) {
    logger.error('Manual verification - Get unread count error:', {
      userId: req.user._id,
      error: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString()
    });
    return errorResponse(res, 500, 'Error getting unread count');
  }
};

export const markAsRead = async (req, res) => {
  try {
    // Log request for manual verification
    logger.info('Manual verification - Marking notification as read:', {
      userId: req.user._id,
      notificationId: req.params.id,
      timestamp: new Date().toISOString(),
      operation: 'markAsRead'
    });

    const notification = await Notification.findOne({
      _id: req.params.id,
      recipient: req.user._id,
      type: { $ne: 'system_generated' }
    });

    if (!notification) {
      logger.warn('Manual verification - Notification not found:', {
        userId: req.user._id,
        notificationId: req.params.id,
        timestamp: new Date().toISOString()
      });
      return errorResponse(res, 404, 'Notification not found');
    }

    notification.read = true;
    notification.readAt = new Date();
    await notification.save();

    // Log success for verification
    logger.info('Manual verification - Notification marked as read:', {
      userId: req.user._id,
      notificationId: req.params.id,
      type: notification.type,
      timestamp: new Date().toISOString()
    });

    res.json({ message: 'Notification marked as read' });
  } catch (error) {
    logger.error('Manual verification - Mark as read error:', {
      userId: req.user._id,
      notificationId: req.params.id,
      error: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString()
    });
    return errorResponse(res, 500, 'Error marking notification as read');
  }
};

export const deleteNotification = async (req, res) => {
  try {
    // Log request for manual verification
    logger.info('Manual verification - Deleting notification:', {
      userId: req.user._id,
      notificationId: req.params.id,
      timestamp: new Date().toISOString(),
      operation: 'deleteNotification'
    });

    const notification = await Notification.findOne({
      _id: req.params.id,
      recipient: req.user._id,
      type: { $ne: 'system_generated' }
    });

    if (!notification) {
      logger.warn('Manual verification - Notification not found for deletion:', {
        userId: req.user._id,
        notificationId: req.params.id,
        timestamp: new Date().toISOString()
      });
      return errorResponse(res, 404, 'Notification not found');
    }

    await notification.deleteOne();

    // Log success for verification
    logger.info('Manual verification - Notification deleted:', {
      userId: req.user._id,
      notificationId: req.params.id,
      type: notification.type,
      timestamp: new Date().toISOString()
    });

    res.json({ message: 'Notification deleted successfully' });
  } catch (error) {
    logger.error('Manual verification - Delete notification error:', {
      userId: req.user._id,
      notificationId: req.params.id,
      error: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString()
    });
    return errorResponse(res, 500, 'Error deleting notification');
  }
};
