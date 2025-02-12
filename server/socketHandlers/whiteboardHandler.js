import Whiteboard from '../models/Whiteboard.js';
import logger from '../config/logger.js';

/**
 * Handle whiteboard-related socket events
 * @param {Object} io - Socket.io instance
 * @param {Object} socket - Socket instance
 * @param {Object} user - Current user
 */
const handleWhiteboardEvents = (io, socket, user) => {
  // Join whiteboard room
  socket.on('join_whiteboard', async ({ whiteboardId }) => {
    try {
      const whiteboard = await Whiteboard.findById(whiteboardId)
        .populate('collaborators.user', 'name email');

      if (!whiteboard) {
        socket.emit('whiteboard_error', { message: 'Whiteboard not found' });
        return;
      }

      if (!whiteboard.canUserAccess(user._id)) {
        socket.emit('whiteboard_error', { message: 'Not authorized to access this whiteboard' });
        return;
      }

      // Join whiteboard room
      socket.join(`whiteboard:${whiteboardId}`);

      // Notify other collaborators
      socket.to(`whiteboard:${whiteboardId}`).emit('collaborator_joined', {
        whiteboardId,
        collaborator: {
          user: user._id,
          name: user.name,
          joinedAt: new Date()
        }
      });

      logger.info(`User ${user._id} joined whiteboard ${whiteboardId}`);
    } catch (error) {
      logger.error('Error in join_whiteboard:', error);
      socket.emit('whiteboard_error', { message: 'Failed to join whiteboard' });
    }
  });

  // Leave whiteboard room
  socket.on('leave_whiteboard', ({ whiteboardId }) => {
    socket.leave(`whiteboard:${whiteboardId}`);
    socket.to(`whiteboard:${whiteboardId}`).emit('collaborator_left', {
      whiteboardId,
      userId: user._id,
      leftAt: new Date()
    });
    logger.info(`User ${user._id} left whiteboard ${whiteboardId}`);
  });

  // Drawing events
  socket.on('element_start', async ({ whiteboardId, element }) => {
    try {
      const whiteboard = await Whiteboard.findById(whiteboardId);
      if (!whiteboard || !whiteboard.canUserEdit(user._id)) return;

      socket.to(`whiteboard:${whiteboardId}`).emit('element_started', {
        userId: user._id,
        element
      });
    } catch (error) {
      logger.error('Error in element_start:', error);
    }
  });

  socket.on('element_update', async ({ whiteboardId, elementId, updates }) => {
    try {
      const whiteboard = await Whiteboard.findById(whiteboardId);
      if (!whiteboard || !whiteboard.canUserEdit(user._id)) return;

      socket.to(`whiteboard:${whiteboardId}`).emit('element_updated', {
        userId: user._id,
        elementId,
        updates
      });
    } catch (error) {
      logger.error('Error in element_update:', error);
    }
  });

  socket.on('element_end', async ({ whiteboardId, elementId }) => {
    try {
      const whiteboard = await Whiteboard.findById(whiteboardId);
      if (!whiteboard || !whiteboard.canUserEdit(user._id)) return;

      socket.to(`whiteboard:${whiteboardId}`).emit('element_ended', {
        userId: user._id,
        elementId
      });
    } catch (error) {
      logger.error('Error in element_end:', error);
    }
  });

  // Tool selection
  socket.on('tool_changed', ({ whiteboardId, tool }) => {
    socket.to(`whiteboard:${whiteboardId}`).emit('user_tool_changed', {
      userId: user._id,
      userName: user.name,
      tool
    });
  });

  // Cursor position
  socket.on('cursor_move', ({ whiteboardId, position }) => {
    socket.to(`whiteboard:${whiteboardId}`).emit('user_cursor_moved', {
      userId: user._id,
      userName: user.name,
      position
    });
  });

  // Selection events
  socket.on('element_selected', ({ whiteboardId, elementId }) => {
    socket.to(`whiteboard:${whiteboardId}`).emit('user_selected_element', {
      userId: user._id,
      userName: user.name,
      elementId
    });
  });

  socket.on('element_deselected', ({ whiteboardId, elementId }) => {
    socket.to(`whiteboard:${whiteboardId}`).emit('user_deselected_element', {
      userId: user._id,
      elementId
    });
  });

  // Snapshot events
  socket.on('snapshot_created', ({ whiteboardId, snapshot }) => {
    socket.to(`whiteboard:${whiteboardId}`).emit('whiteboard_snapshot_created', {
      userId: user._id,
      userName: user.name,
      snapshot
    });
  });

  // Settings events
  socket.on('settings_update', ({ whiteboardId, settings }) => {
    socket.to(`whiteboard:${whiteboardId}`).emit('whiteboard_settings_updated', {
      userId: user._id,
      userName: user.name,
      settings
    });
  });

  // Clear whiteboard
  socket.on('clear_whiteboard', async ({ whiteboardId }) => {
    try {
      const whiteboard = await Whiteboard.findById(whiteboardId);
      if (!whiteboard || !whiteboard.canUserEdit(user._id)) return;

      whiteboard.elements = [];
      await whiteboard.save();

      io.to(`whiteboard:${whiteboardId}`).emit('whiteboard_cleared', {
        userId: user._id,
        userName: user.name
      });
    } catch (error) {
      logger.error('Error in clear_whiteboard:', error);
    }
  });

  // Handle disconnection
  socket.on('disconnect', async () => {
    // Find and leave any active whiteboards
    const rooms = Array.from(socket.rooms);
    for (const room of rooms) {
      if (room.startsWith('whiteboard:')) {
        const whiteboardId = room.split(':')[1];
        socket.to(room).emit('collaborator_left', {
          whiteboardId,
          userId: user._id,
          leftAt: new Date()
        });
      }
    }
  });
};

export default handleWhiteboardEvents;
