import Chat from '../models/Chat.js';
import DirectMessage from '../models/DirectMessage.js';
import { errorResponse } from '../utils/errorHandler.js';
import logger from '../config/logger.js';

export const getConversations = async (req, res) => {
  try {
    const conversations = await Chat.find({
      participants: req.user._id
    })
    .populate('participants', 'name avatar')
    .populate('lastMessage')
    .sort('-updatedAt');

    res.json(conversations);
  } catch (error) {
    logger.error('Get conversations error:', error);
    return errorResponse(res, 500, 'Error fetching conversations');
  }
};

export const getMessages = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const messages = await DirectMessage.find({
      chat: conversationId
    })
    .populate('sender', 'name avatar')
    .sort('-createdAt');

    res.json(messages);
  } catch (error) {
    logger.error('Get messages error:', error);
    return errorResponse(res, 500, 'Error fetching messages');
  }
};

export const sendMessage = async (req, res) => {
  try {
    const { recipientId, content } = req.body;

    // Find existing chat or create new one
    let chat = await Chat.findOne({
      participants: { $all: [req.user._id, recipientId] }
    });

    if (!chat) {
      chat = await Chat.create({
        participants: [req.user._id, recipientId]
      });
    }

    // Create message
    const message = await DirectMessage.create({
      chat: chat._id,
      sender: req.user._id,
      content
    });

    // Update chat's last message
    chat.lastMessage = message._id;
    await chat.save();

    // Populate sender details
    await message.populate('sender', 'name avatar');

    res.status(201).json(message);
  } catch (error) {
    logger.error('Send message error:', error);
    return errorResponse(res, 500, 'Error sending message');
  }
};

export const markAsRead = async (req, res) => {
  try {
    const { conversationId } = req.params;
    
    await DirectMessage.updateMany(
      {
        chat: conversationId,
        sender: { $ne: req.user._id },
        read: false
      },
      {
        $set: { read: true }
      }
    );

    res.json({ message: 'Messages marked as read' });
  } catch (error) {
    logger.error('Mark as read error:', error);
    return errorResponse(res, 500, 'Error marking messages as read');
  }
};
