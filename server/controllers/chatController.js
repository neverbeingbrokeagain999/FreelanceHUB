import Chat from '../models/Chat.js';
import multer from 'multer';
import path from 'path';
import { io } from '../index.js';

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

export const sendMessage = async (req, res) => {
  try {
    const { message, receiver, jobId } = req.body;
    const sender = req.user.userId;
    let files = [];

    if (req.files && req.files.length > 0) {
      files = req.files.map(file => `/uploads/${file.filename}`);
    }

    const chatMessage = new Chat({
      sender,
      receiver,
      message,
      job: jobId,
      files
    });

    await chatMessage.save();

    // Emit a notification event
    io.emit('newMessage', {
      message: chatMessage,
      jobId,
      receiver
    });

    res.status(201).json({ message: 'Message sent successfully', chatMessage });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const getMessages = async (req, res) => {
  try {
    const jobId = req.params.jobId;
    const messages = await Chat.find({ job: jobId }).populate('sender', 'name');
    res.json(messages);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const markMessageAsRead = async (req, res) => {
  try {
    const { messageIds } = req.body;
    const userId = req.user.userId;

    await Chat.updateMany(
      { _id: { $in: messageIds }, receiver: userId, isRead: false },
      { isRead: true, readAt: Date.now() }
    );

    res.json({ message: 'Messages marked as read' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
