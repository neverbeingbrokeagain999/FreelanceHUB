const CodeSnippet = require('../models/CodeSnippet');
const logger = require('../config/logger');
const errorHandler = require('../utils/errorHandler');

/**
 * Active collaborators by snippet ID
 * @type {Map<string, Map<string, {userId: string, username: string, cursorPosition: object, selection: object}>>}
 */
const activeCollaborators = new Map();

/**
 * Handle code snippet socket events
 * @param {import('socket.io').Socket} socket - Socket instance
 * @param {Object} user - Authenticated user
 */
class CodeSnippetHandler {
  constructor(socket, user) {
    this.socket = socket;
    this.user = user;
    this.currentSnippet = null;

    this.handleEvents();
  }

  /**
   * Set up event listeners
   */
  handleEvents() {
    this.socket.on('snippet:join', this.handleJoin.bind(this));
    this.socket.on('snippet:leave', this.handleLeave.bind(this));
    this.socket.on('snippet:update', this.handleUpdate.bind(this));
    this.socket.on('snippet:cursor', this.handleCursor.bind(this));
    this.socket.on('snippet:selection', this.handleSelection.bind(this));
    this.socket.on('snippet:execution', this.handleExecution.bind(this));
    this.socket.on('disconnect', this.handleDisconnect.bind(this));
  }

  /**
   * Handle joining a snippet room
   */
  async handleJoin({ snippetId }) {
    try {
      // Verify access
      const snippet = await CodeSnippet.findById(snippetId)
        .populate('collaborators.user', 'name');
      
      if (!snippet) {
        throw new Error('Snippet not found');
      }

      const hasAccess = 
        snippet.creator.toString() === this.user._id.toString() ||
        snippet.visibility === 'public' ||
        snippet.collaborators.some(c => 
          c.user._id.toString() === this.user._id.toString()
        );

      if (!hasAccess) {
        throw new Error('Access denied');
      }

      // Leave current room if any
      if (this.currentSnippet) {
        await this.handleLeave({ snippetId: this.currentSnippet });
      }

      // Join room
      this.socket.join(`snippet:${snippetId}`);
      this.currentSnippet = snippetId;

      // Initialize collaborators map for this snippet
      if (!activeCollaborators.has(snippetId)) {
        activeCollaborators.set(snippetId, new Map());
      }

      // Add user to collaborators
      activeCollaborators.get(snippetId).set(this.socket.id, {
        userId: this.user._id,
        username: this.user.name,
        cursorPosition: null,
        selection: null
      });

      // Send current state to joining user
      this.socket.emit('snippet:state', {
        content: snippet.content,
        version: snippet.version,
        users: Array.from(activeCollaborators.get(snippetId).values())
      });

      // Notify others
      this.socket.to(`snippet:${snippetId}`).emit('snippet:users', {
        users: Array.from(activeCollaborators.get(snippetId).values())
      });

      logger.info(`User ${this.user._id} joined snippet ${snippetId}`);
    } catch (error) {
      errorHandler.handle(error);
      this.socket.emit('error', { message: error.message });
    }
  }

  /**
   * Handle leaving a snippet room
   */
  async handleLeave({ snippetId }) {
    if (!snippetId || snippetId !== this.currentSnippet) return;

    // Remove user from collaborators
    const collaborators = activeCollaborators.get(snippetId);
    if (collaborators) {
      collaborators.delete(this.socket.id);
      if (collaborators.size === 0) {
        activeCollaborators.delete(snippetId);
      }
    }

    // Leave room
    this.socket.leave(`snippet:${snippetId}`);
    this.currentSnippet = null;

    // Notify others
    this.socket.to(`snippet:${snippetId}`).emit('snippet:users', {
      users: Array.from(collaborators?.values() || [])
    });

    logger.info(`User ${this.user._id} left snippet ${snippetId}`);
  }

  /**
   * Handle content updates
   */
  async handleUpdate({ content, origin }) {
    if (!this.currentSnippet) return;

    try {
      // Save to database
      await CodeSnippet.findByIdAndUpdate(this.currentSnippet, {
        content,
        version: Date.now()
      });

      // Broadcast to others
      this.socket.to(`snippet:${this.currentSnippet}`).emit('snippet:update', {
        userId: this.user._id,
        content,
        origin
      });

      logger.debug(`User ${this.user._id} updated snippet ${this.currentSnippet}`);
    } catch (error) {
      errorHandler.handle(error);
      this.socket.emit('error', { message: 'Failed to save changes' });
    }
  }

  /**
   * Handle cursor position updates
   */
  handleCursor({ position }) {
    if (!this.currentSnippet) return;

    // Update collaborator's cursor position
    const collaborators = activeCollaborators.get(this.currentSnippet);
    if (collaborators && collaborators.has(this.socket.id)) {
      collaborators.get(this.socket.id).cursorPosition = position;
    }

    // Broadcast to others
    this.socket.to(`snippet:${this.currentSnippet}`).emit('snippet:cursor', {
      userId: this.user._id,
      position
    });
  }

  /**
   * Handle selection updates
   */
  handleSelection({ selection }) {
    if (!this.currentSnippet) return;

    // Update collaborator's selection
    const collaborators = activeCollaborators.get(this.currentSnippet);
    if (collaborators && collaborators.has(this.socket.id)) {
      collaborators.get(this.socket.id).selection = selection;
    }

    // Broadcast to others
    this.socket.to(`snippet:${this.currentSnippet}`).emit('snippet:selection', {
      userId: this.user._id,
      selection
    });
  }

  /**
   * Handle code execution results
   */
  handleExecution({ result }) {
    if (!this.currentSnippet) return;

    // Broadcast to others
    this.socket.to(`snippet:${this.currentSnippet}`).emit('snippet:execution', {
      userId: this.user._id,
      result
    });

    logger.debug(`User ${this.user._id} executed code in snippet ${this.currentSnippet}`);
  }

  /**
   * Handle socket disconnection
   */
  handleDisconnect() {
    if (this.currentSnippet) {
      this.handleLeave({ snippetId: this.currentSnippet });
    }
  }
}

/**
 * Initialize code snippet socket handling
 * @param {import('socket.io').Server} io - Socket.io server instance
 */
module.exports = (io) => {
  const snippetNamespace = io.of('/code-snippets');

  snippetNamespace.use(async (socket, next) => {
    const token = socket.handshake.auth.token;
    if (!token) {
      return next(new Error('Authentication required'));
    }

    try {
      // Verify token and get user
      const user = await require('../middleware/auth').verifyToken(token);
      socket.user = user;
      next();
    } catch (error) {
      next(new Error('Invalid token'));
    }
  });

  snippetNamespace.on('connection', (socket) => {
    logger.info(`Socket connected: ${socket.id}`);
    new CodeSnippetHandler(socket, socket.user);
  });
};
