import Document from '../models/Document.js';
import logger from '../config/logger.js';

/**
 * Handle document-related socket events
 * @param {Object} io - Socket.io instance
 * @param {Object} socket - Socket instance
 * @param {Object} user - Current user
 */
const handleDocumentEvents = (io, socket, user) => {
  // Join document room
  socket.on('join_document', async ({ documentId }) => {
    try {
      const document = await Document.findById(documentId)
        .populate('collaborators.user', 'name email');

      if (!document) {
        socket.emit('document_error', { message: 'Document not found' });
        return;
      }

      if (!document.canUserAccess(user._id)) {
        socket.emit('document_error', { message: 'Not authorized to access this document' });
        return;
      }

      // Join document room
      socket.join(`document:${documentId}`);

      // Get current active users in the document
      const room = io.sockets.adapter.rooms.get(`document:${documentId}`);
      const activeUsers = Array.from(room || []).map(socketId => {
        const userSocket = io.sockets.sockets.get(socketId);
        return userSocket?.user;
      }).filter(Boolean);

      // Notify other collaborators
      socket.to(`document:${documentId}`).emit('user_joined', {
        documentId,
        user: {
          _id: user._id,
          name: user.name,
          email: user.email
        }
      });

      // Send active users list to the joining user
      socket.emit('document_users', {
        documentId,
        users: activeUsers
      });

      logger.info(`User ${user._id} joined document ${documentId}`);
    } catch (error) {
      logger.error('Error in join_document:', error);
      socket.emit('document_error', { message: 'Failed to join document' });
    }
  });

  // Leave document room
  socket.on('leave_document', ({ documentId }) => {
    socket.leave(`document:${documentId}`);
    socket.to(`document:${documentId}`).emit('user_left', {
      documentId,
      userId: user._id
    });
    logger.info(`User ${user._id} left document ${documentId}`);
  });

  // Handle cursor position updates
  socket.on('cursor_position', ({ documentId, position }) => {
    socket.to(`document:${documentId}`).emit('user_cursor', {
      userId: user._id,
      userName: user.name,
      position
    });
  });

  // Handle selection updates
  socket.on('selection_change', ({ documentId, selection }) => {
    socket.to(`document:${documentId}`).emit('user_selection', {
      userId: user._id,
      userName: user.name,
      selection
    });
  });

  // Handle text operations (insert, delete, format)
  socket.on('text_operation', async ({ documentId, operation, version }) => {
    try {
      const document = await Document.findById(documentId);
      if (!document || !document.canUserEdit(user._id)) return;

      // Broadcast operation to other users
      socket.to(`document:${documentId}`).emit('text_operation', {
        userId: user._id,
        userName: user.name,
        operation,
        version
      });

      // If this is a significant change, create a new version
      if (operation.shouldCreateVersion) {
        await document.createVersion(
          operation.content,
          operation.delta,
          user._id,
          operation.message || 'Auto-saved version'
        );
      }
    } catch (error) {
      logger.error('Error in text_operation:', error);
      socket.emit('document_error', { message: 'Failed to process operation' });
    }
  });

  // Handle collaborative editing presence
  socket.on('editing_started', ({ documentId, position }) => {
    socket.to(`document:${documentId}`).emit('user_editing', {
      userId: user._id,
      userName: user.name,
      position
    });
  });

  socket.on('editing_ended', ({ documentId }) => {
    socket.to(`document:${documentId}`).emit('user_stopped_editing', {
      userId: user._id
    });
  });

  // Handle comment threading
  socket.on('typing_comment', ({ documentId, commentId, isTyping }) => {
    socket.to(`document:${documentId}`).emit('user_typing_comment', {
      userId: user._id,
      userName: user.name,
      commentId,
      isTyping
    });
  });

  // Handle collaborative mode changes
  socket.on('mode_changed', ({ documentId, mode }) => {
    socket.to(`document:${documentId}`).emit('user_mode_changed', {
      userId: user._id,
      userName: user.name,
      mode
    });
  });

  // Handle version change notifications
  socket.on('viewing_version', ({ documentId, versionId }) => {
    socket.to(`document:${documentId}`).emit('user_viewing_version', {
      userId: user._id,
      userName: user.name,
      versionId
    });
  });

  // Handle conflict resolution
  socket.on('conflict_detected', ({ documentId, conflictData }) => {
    socket.to(`document:${documentId}`).emit('document_conflict', {
      userId: user._id,
      userName: user.name,
      conflictData
    });
  });

  socket.on('conflict_resolved', ({ documentId, resolution }) => {
    socket.to(`document:${documentId}`).emit('conflict_resolution', {
      userId: user._id,
      userName: user.name,
      resolution
    });
  });

  // Handle user idle status
  socket.on('user_idle', ({ documentId }) => {
    socket.to(`document:${documentId}`).emit('user_status_changed', {
      userId: user._id,
      status: 'idle'
    });
  });

  socket.on('user_active', ({ documentId }) => {
    socket.to(`document:${documentId}`).emit('user_status_changed', {
      userId: user._id,
      status: 'active'
    });
  });

  // Handle disconnection
  socket.on('disconnect', async () => {
    // Find and leave any active documents
    const rooms = Array.from(socket.rooms);
    for (const room of rooms) {
      if (room.startsWith('document:')) {
        const documentId = room.split(':')[1];
        socket.to(room).emit('user_left', {
          documentId,
          userId: user._id,
          reason: 'disconnected'
        });
      }
    }
  });
};

export default handleDocumentEvents;
