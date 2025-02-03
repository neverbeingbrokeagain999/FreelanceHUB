import DirectMessage from '../models/DirectMessage.js';
import { io } from '../index.js';
import multer from 'multer';
import path from 'path';

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ storage: storage });

export const sendDirectMessage = async (req, res) => {
  try {
    const { message, receiver } = req.body;
    const sender = req.user.userId;
    let files = [];

    if (req.files && req.files.length > 0) {
      files = req.files.map(file => `/uploads/${file.filename}`);
    }

    const directMessage = new DirectMessage({
      sender,
      receiver,
      message,
      files
    });

    await directMessage.save();

    // Emit a notification event
    io.emit('newDirectMessage', {
      message: directMessage,
      receiver
    });

    res.status(201).json({ message: 'Direct message sent successfully', directMessage });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const getDirectMessages = async (req, res) => {
  try {
    const userId = req.user.userId;
    const messages = await DirectMessage.find({
      $or: [{ sender: userId }, { receiver: userId }],
    }).populate('sender', 'name');
    res.json(messages);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const markDirectMessageAsRead = async (req, res) => {
  try {
    const { messageIds } = req.body;
    const userId = req.user.userId;

    await DirectMessage.updateMany(
      { _id: { $in: messageIds }, receiver: userId, isRead: false },
      { isRead: true, readAt: Date.now() }
    );

    res.json({ message: 'Direct messages marked as read' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
