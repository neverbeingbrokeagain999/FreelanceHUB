import Whiteboard from '../models/Whiteboard.js';
import Meeting from '../models/Meeting.js';
import { asyncHandler } from '../middleware/async.js';
import ErrorResponse from '../utils/errorResponse.js';
import logger from '../config/logger.js';
import { getSocketInstance } from '../services/socketService.js';

// @desc    Create a new whiteboard
// @route   POST /api/meetings/:meetingId/whiteboards
// @access  Private
export const createWhiteboard = asyncHandler(async (req, res) => {
  const { meetingId } = req.params;
  const { name, settings } = req.body;

  // Check if meeting exists and user has access
  const meeting = await Meeting.findById(meetingId);
  if (!meeting) {
    throw new ErrorResponse('Meeting not found', 404);
  }

  if (!meeting.participants.some(p => p.user.toString() === req.user.id)) {
    throw new ErrorResponse('Not authorized to access this meeting', 403);
  }

  const whiteboard = await Whiteboard.create({
    meetingId,
    name,
    creator: req.user.id,
    settings,
    collaborators: meeting.participants.map(p => ({
      user: p.user,
      permissions: p.user.toString() === req.user.id ? 'admin' : 'edit'
    }))
  });

  // Notify meeting participants
  const socket = getSocketInstance();
  socket.to(`meeting:${meetingId}`).emit('whiteboard_created', {
    whiteboardId: whiteboard._id,
    name: whiteboard.name,
    creator: req.user.id
  });

  res.status(201).json({
    success: true,
    data: whiteboard
  });
});

// @desc    Get all whiteboards for a meeting
// @route   GET /api/meetings/:meetingId/whiteboards
// @access  Private
export const getWhiteboards = asyncHandler(async (req, res) => {
  const { meetingId } = req.params;

  const whiteboards = await Whiteboard.find({
    meetingId,
    'collaborators.user': req.user.id,
    status: 'active'
  }).populate('creator', 'name email');

  res.status(200).json({
    success: true,
    count: whiteboards.length,
    data: whiteboards
  });
});

// @desc    Get single whiteboard
// @route   GET /api/whiteboards/:id
// @access  Private
export const getWhiteboard = asyncHandler(async (req, res) => {
  const whiteboard = await Whiteboard.findById(req.params.id)
    .populate('creator', 'name email')
    .populate('collaborators.user', 'name email')
    .populate('lastModifiedBy', 'name email');

  if (!whiteboard) {
    throw new ErrorResponse('Whiteboard not found', 404);
  }

  if (!whiteboard.canUserAccess(req.user.id)) {
    throw new ErrorResponse('Not authorized to access this whiteboard', 403);
  }

  res.status(200).json({
    success: true,
    data: whiteboard
  });
});

// @desc    Update whiteboard settings
// @route   PUT /api/whiteboards/:id/settings
// @access  Private
export const updateSettings = asyncHandler(async (req, res) => {
  let whiteboard = await Whiteboard.findById(req.params.id);

  if (!whiteboard) {
    throw new ErrorResponse('Whiteboard not found', 404);
  }

  if (!whiteboard.canUserEdit(req.user.id)) {
    throw new ErrorResponse('Not authorized to update this whiteboard', 403);
  }

  whiteboard.settings = {
    ...whiteboard.settings,
    ...req.body
  };
  whiteboard.lastModified = new Date();
  whiteboard.lastModifiedBy = req.user.id;

  await whiteboard.save();

  // Notify collaborators
  const socket = getSocketInstance();
  socket.to(`whiteboard:${whiteboard._id}`).emit('settings_updated', {
    whiteboardId: whiteboard._id,
    settings: whiteboard.settings
  });

  res.status(200).json({
    success: true,
    data: whiteboard
  });
});

// @desc    Add element to whiteboard
// @route   POST /api/whiteboards/:id/elements
// @access  Private
export const addElement = asyncHandler(async (req, res) => {
  const whiteboard = await Whiteboard.findById(req.params.id);

  if (!whiteboard) {
    throw new ErrorResponse('Whiteboard not found', 404);
  }

  const element = await whiteboard.addElement(req.body, req.user.id);

  // Notify collaborators
  const socket = getSocketInstance();
  socket.to(`whiteboard:${whiteboard._id}`).emit('element_added', {
    whiteboardId: whiteboard._id,
    element
  });

  res.status(200).json({
    success: true,
    data: element
  });
});

// @desc    Update whiteboard element
// @route   PUT /api/whiteboards/:id/elements/:elementId
// @access  Private
export const updateElement = asyncHandler(async (req, res) => {
  const whiteboard = await Whiteboard.findById(req.params.id);

  if (!whiteboard) {
    throw new ErrorResponse('Whiteboard not found', 404);
  }

  const element = await whiteboard.updateElement(req.params.elementId, req.body, req.user.id);

  // Notify collaborators
  const socket = getSocketInstance();
  socket.to(`whiteboard:${whiteboard._id}`).emit('element_updated', {
    whiteboardId: whiteboard._id,
    elementId: req.params.elementId,
    updates: req.body
  });

  res.status(200).json({
    success: true,
    data: element
  });
});

// @desc    Delete whiteboard element
// @route   DELETE /api/whiteboards/:id/elements/:elementId
// @access  Private
export const deleteElement = asyncHandler(async (req, res) => {
  const whiteboard = await Whiteboard.findById(req.params.id);

  if (!whiteboard) {
    throw new ErrorResponse('Whiteboard not found', 404);
  }

  await whiteboard.removeElement(req.params.elementId, req.user.id);

  // Notify collaborators
  const socket = getSocketInstance();
  socket.to(`whiteboard:${whiteboard._id}`).emit('element_deleted', {
    whiteboardId: whiteboard._id,
    elementId: req.params.elementId
  });

  res.status(200).json({
    success: true,
    data: {}
  });
});

// @desc    Create whiteboard snapshot
// @route   POST /api/whiteboards/:id/snapshots
// @access  Private
export const createSnapshot = asyncHandler(async (req, res) => {
  const whiteboard = await Whiteboard.findById(req.params.id);

  if (!whiteboard) {
    throw new ErrorResponse('Whiteboard not found', 404);
  }

  const snapshot = await whiteboard.createSnapshot(req.body.imageUrl, req.user.id);

  // Notify collaborators
  const socket = getSocketInstance();
  socket.to(`whiteboard:${whiteboard._id}`).emit('snapshot_created', {
    whiteboardId: whiteboard._id,
    snapshot
  });

  res.status(200).json({
    success: true,
    data: snapshot
  });
});

// @desc    Archive whiteboard
// @route   PUT /api/whiteboards/:id/archive
// @access  Private
export const archiveWhiteboard = asyncHandler(async (req, res) => {
  const whiteboard = await Whiteboard.findById(req.params.id);

  if (!whiteboard) {
    throw new ErrorResponse('Whiteboard not found', 404);
  }

  if (whiteboard.creator.toString() !== req.user.id) {
    throw new ErrorResponse('Only the creator can archive the whiteboard', 403);
  }

  whiteboard.status = 'archived';
  await whiteboard.save();

  // Notify collaborators
  const socket = getSocketInstance();
  socket.to(`whiteboard:${whiteboard._id}`).emit('whiteboard_archived', {
    whiteboardId: whiteboard._id
  });

  res.status(200).json({
    success: true,
    data: whiteboard
  });
});

export default {
  createWhiteboard,
  getWhiteboards,
  getWhiteboard,
  updateSettings,
  addElement,
  updateElement,
  deleteElement,
  createSnapshot,
  archiveWhiteboard
};
