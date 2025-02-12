import Document from '../models/Document.js';
import Meeting from '../models/Meeting.js';
import { asyncHandler } from '../middleware/async.js';
import ErrorResponse from '../utils/errorResponse.js';
import { getSocketInstance } from '../services/socketService.js';

// @desc    Create new document
// @route   POST /api/documents
// @access  Private
export const createDocument = asyncHandler(async (req, res) => {
  const { meeting, project } = req.body;

  // Verify meeting access if provided
  if (meeting) {
    const meetingDoc = await Meeting.findById(meeting);
    if (!meetingDoc) {
      throw new ErrorResponse('Meeting not found', 404);
    }
    if (!meetingDoc.participants.some(p => p.user.toString() === req.user.id)) {
      throw new ErrorResponse('Not authorized to create document in this meeting', 403);
    }
  }

  const document = await Document.create({
    ...req.body,
    creator: req.user.id,
    collaborators: [{
      user: req.user.id,
      role: 'owner',
      addedBy: req.user.id
    }]
  });

  // Notify meeting participants if document is created in a meeting
  if (meeting) {
    const socket = getSocketInstance();
    socket.to(`meeting:${meeting}`).emit('document_created', {
      documentId: document._id,
      title: document.title,
      creator: req.user.id
    });
  }

  res.status(201).json({
    success: true,
    data: document
  });
});

// @desc    Get all documents
// @route   GET /api/documents
// @access  Private
export const getDocuments = asyncHandler(async (req, res) => {
  const { meeting, project, status, type, search, page = 1, limit = 10 } = req.query;

  const query = {
    'collaborators.user': req.user.id
  };

  if (meeting) query.meeting = meeting;
  if (project) query.project = project;
  if (status) query.status = status;
  if (type) query.type = type;
  if (search) {
    query.$text = { $search: search };
  }

  const skip = (page - 1) * limit;

  const documents = await Document.find(query)
    .skip(skip)
    .limit(parseInt(limit))
    .sort({ lastModified: -1 })
    .populate('creator', 'name email')
    .populate('collaborators.user', 'name email')
    .populate('lastModifiedBy', 'name email');

  const total = await Document.countDocuments(query);

  res.status(200).json({
    success: true,
    count: documents.length,
    total,
    data: documents,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      totalPages: Math.ceil(total / limit)
    }
  });
});

// @desc    Get single document
// @route   GET /api/documents/:id
// @access  Private
export const getDocument = asyncHandler(async (req, res) => {
  const document = await Document.findById(req.params.id)
    .populate('creator', 'name email')
    .populate('collaborators.user', 'name email')
    .populate('lastModifiedBy', 'name email')
    .populate('versions.createdBy', 'name email')
    .populate('comments.author', 'name email')
    .populate('comments.resolvedBy', 'name email')
    .populate('comments.replies.author', 'name email');

  if (!document) {
    throw new ErrorResponse('Document not found', 404);
  }

  if (!document.canUserAccess(req.user.id)) {
    throw new ErrorResponse('Not authorized to access this document', 403);
  }

  res.status(200).json({
    success: true,
    data: document
  });
});

// @desc    Update document
// @route   PUT /api/documents/:id
// @access  Private
export const updateDocument = asyncHandler(async (req, res) => {
  let document = await Document.findById(req.params.id);

  if (!document) {
    throw new ErrorResponse('Document not found', 404);
  }

  if (!document.canUserEdit(req.user.id)) {
    throw new ErrorResponse('Not authorized to edit this document', 403);
  }

  document = await Document.findByIdAndUpdate(
    req.params.id,
    {
      ...req.body,
      lastModified: new Date(),
      lastModifiedBy: req.user.id
    },
    {
      new: true,
      runValidators: true
    }
  );

  // Notify collaborators
  const socket = getSocketInstance();
  socket.to(`document:${document._id}`).emit('document_updated', {
    documentId: document._id,
    updates: req.body,
    updatedBy: req.user.id
  });

  res.status(200).json({
    success: true,
    data: document
  });
});

// @desc    Create new version
// @route   POST /api/documents/:id/versions
// @access  Private
export const createVersion = asyncHandler(async (req, res) => {
  const document = await Document.findById(req.params.id);

  if (!document) {
    throw new ErrorResponse('Document not found', 404);
  }

  if (!document.canUserEdit(req.user.id)) {
    throw new ErrorResponse('Not authorized to create versions', 403);
  }

  await document.createVersion(
    req.body.content,
    req.body.delta,
    req.user.id,
    req.body.message
  );

  // Notify collaborators
  const socket = getSocketInstance();
  socket.to(`document:${document._id}`).emit('version_created', {
    documentId: document._id,
    version: document.versions[document.versions.length - 1],
    createdBy: req.user.id
  });

  res.status(200).json({
    success: true,
    data: document
  });
});

// @desc    Add comment
// @route   POST /api/documents/:id/comments
// @access  Private
export const addComment = asyncHandler(async (req, res) => {
  const document = await Document.findById(req.params.id);

  if (!document) {
    throw new ErrorResponse('Document not found', 404);
  }

  if (!document.canUserComment(req.user.id)) {
    throw new ErrorResponse('Not authorized to comment on this document', 403);
  }

  await document.addComment(req.body, req.user.id);

  // Notify collaborators
  const socket = getSocketInstance();
  socket.to(`document:${document._id}`).emit('comment_added', {
    documentId: document._id,
    comment: document.comments[document.comments.length - 1],
    addedBy: req.user.id
  });

  res.status(200).json({
    success: true,
    data: document.comments[document.comments.length - 1]
  });
});

// @desc    Update comment
// @route   PUT /api/documents/:id/comments/:commentId
// @access  Private
export const updateComment = asyncHandler(async (req, res) => {
  const document = await Document.findById(req.params.id);

  if (!document) {
    throw new ErrorResponse('Document not found', 404);
  }

  const comment = document.comments.id(req.params.commentId);
  if (!comment) {
    throw new ErrorResponse('Comment not found', 404);
  }

  if (comment.author.toString() !== req.user.id) {
    throw new ErrorResponse('Not authorized to update this comment', 403);
  }

  if (req.body.content) {
    comment.content = req.body.content;
  }

  if (typeof req.body.resolved === 'boolean') {
    comment.resolved = req.body.resolved;
    comment.resolvedBy = req.user.id;
    comment.resolvedAt = new Date();
  }

  await document.save();

  // Notify collaborators
  const socket = getSocketInstance();
  socket.to(`document:${document._id}`).emit('comment_updated', {
    documentId: document._id,
    commentId: comment._id,
    updates: req.body,
    updatedBy: req.user.id
  });

  res.status(200).json({
    success: true,
    data: comment
  });
});

// @desc    Add reply to comment
// @route   POST /api/documents/:id/comments/:commentId/replies
// @access  Private
export const addReply = asyncHandler(async (req, res) => {
  const document = await Document.findById(req.params.id);

  if (!document) {
    throw new ErrorResponse('Document not found', 404);
  }

  const comment = document.comments.id(req.params.commentId);
  if (!comment) {
    throw new ErrorResponse('Comment not found', 404);
  }

  if (!document.canUserComment(req.user.id)) {
    throw new ErrorResponse('Not authorized to reply to comments', 403);
  }

  comment.replies.push({
    content: req.body.content,
    author: req.user.id
  });

  await document.save();

  const reply = comment.replies[comment.replies.length - 1];

  // Notify collaborators
  const socket = getSocketInstance();
  socket.to(`document:${document._id}`).emit('reply_added', {
    documentId: document._id,
    commentId: comment._id,
    reply,
    addedBy: req.user.id
  });

  res.status(200).json({
    success: true,
    data: reply
  });
});

// @desc    Update collaborators
// @route   PUT /api/documents/:id/collaborators
// @access  Private
export const updateCollaborators = asyncHandler(async (req, res) => {
  const document = await Document.findById(req.params.id);

  if (!document) {
    throw new ErrorResponse('Document not found', 404);
  }

  // Only creator or owner can update collaborators
  const userRole = document.collaborators.find(
    c => c.user.toString() === req.user.id
  )?.role;

  if (document.creator.toString() !== req.user.id && userRole !== 'owner') {
    throw new ErrorResponse('Not authorized to update collaborators', 403);
  }

  document.collaborators = req.body.map(collaborator => ({
    ...collaborator,
    addedBy: req.user.id,
    addedAt: new Date()
  }));

  await document.save();

  // Notify collaborators
  const socket = getSocketInstance();
  socket.to(`document:${document._id}`).emit('collaborators_updated', {
    documentId: document._id,
    collaborators: document.collaborators,
    updatedBy: req.user.id
  });

  res.status(200).json({
    success: true,
    data: document.collaborators
  });
});

export default {
  createDocument,
  getDocuments,
  getDocument,
  updateDocument,
  createVersion,
  addComment,
  updateComment,
  addReply,
  updateCollaborators
};
