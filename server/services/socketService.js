import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';
import logger from '../config/logger.js';
import handleChatEvents from '../socketHandlers/chatHandler.js';
import handleMeetingEvents from '../socketHandlers/meetingHandler.js';
import handleWhiteboardEvents from '../socketHandlers/whiteboardHandler.js';
import User from '../models/User.js';

let io;

const initializeSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
      methods: ['GET', 'POST'],
      credentials: true
    }
  });

  // Authentication middleware
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token ||
        socket.handshake.query.token;

      if (!token) {
        throw new Error('Authentication error: Token required');
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id).select('-password');

      if (!user) {
        throw new Error('Authentication error: User not found');
      }

      socket.user = user;
      next();
    } catch (error) {
      logger.error('Socket authentication error:', error);
      next(new Error('Authentication error'));
    }
  });

  // Connection handler
  io.on('connection', (socket) => {
    logger.info(`User connected: ${socket.user._id}`);

    // Join user's personal room
    socket.join(`user:${socket.user._id}`);

    // Initialize event handlers
    handleChatEvents(io, socket, socket.user);
    handleMeetingEvents(io, socket, socket.user);
    handleWhiteboardEvents(io, socket, socket.user);

    // Presence system
    socket.on('set_status', ({ status }) => {
      socket.user.status = status;
      io.emit('user_status_changed', {
        userId: socket.user._id,
        status
      });
    });

    // Generic error handler
    socket.on('error', (error) => {
      logger.error('Socket error:', error);
    });

    // Disconnect handler
    socket.on('disconnect', () => {
      logger.info(`User disconnected: ${socket.user._id}`);
      io.emit('user_status_changed', {
        userId: socket.user._id,
        status: 'offline'
      });
    });
  });

  return io;
};

// Helper function to send to specific user
const sendToUser = (userId, event, data) => {
  if (!io) {
    logger.error('Socket.io not initialized');
    return;
  }
  io.to(`user:${userId}`).emit(event, data);
};

// Helper function to broadcast to room
const broadcastToRoom = (room, event, data, except = null) => {
  if (!io) {
    logger.error('Socket.io not initialized');
    return;
  }
  if (except) {
    io.to(room).except(except).emit(event, data);
  } else {
    io.to(room).emit(event, data);
  }
};

// Helper function to get socket instance
const getSocketInstance = () => {
  if (!io) {
    logger.error('Socket.io not initialized');
    return null;
  }
  return io;
};

// Helper function to get connected users in a room
const getConnectedUsersInRoom = (room) => {
  if (!io) {
    logger.error('Socket.io not initialized');
    return [];
  }
  return Array.from(io.sockets.adapter.rooms.get(room) || []);
};

// Helper function to check if user is online
const isUserOnline = (userId) => {
  if (!io) {
    logger.error('Socket.io not initialized');
    return false;
  }
  return io.sockets.adapter.rooms.has(`user:${userId}`);
};

// Helper function to get user's active rooms
const getUserRooms = (userId) => {
  if (!io) {
    logger.error('Socket.io not initialized');
    return [];
  }
  
  const userRooms = [];
  io.sockets.adapter.rooms.forEach((_, room) => {
    if (room.startsWith('meeting:') || room.startsWith('chat:') || room.startsWith('whiteboard:')) {
      const sockets = io.sockets.adapter.rooms.get(room);
      if (sockets?.has(`user:${userId}`)) {
        userRooms.push(room);
      }
    }
  });
  
  return userRooms;
};

// Helper function to disconnect user
const disconnectUser = (userId) => {
  if (!io) {
    logger.error('Socket.io not initialized');
    return;
  }

  const userSocket = Array.from(io.sockets.sockets.values())
    .find(socket => socket.user?._id.toString() === userId.toString());

  if (userSocket) {
    userSocket.disconnect(true);
    logger.info(`Forcefully disconnected user: ${userId}`);
  }
};

// Helper function to get socket statistics
const getSocketStats = () => {
  if (!io) {
    logger.error('Socket.io not initialized');
    return {
      connectedClients: 0,
      activeRooms: 0
    };
  }

  return {
    connectedClients: io.sockets.sockets.size,
    activeRooms: io.sockets.adapter.rooms.size
  };
};

export {
  initializeSocket,
  sendToUser,
  broadcastToRoom,
  getSocketInstance,
  getConnectedUsersInRoom,
  isUserOnline,
  getUserRooms,
  disconnectUser,
  getSocketStats
};
