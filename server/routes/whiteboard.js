import express from 'express';
import { auth } from '../middleware/auth.js';
import { validate } from '../middleware/validation/validator.js';
import {
  createWhiteboardSchema,
  updateSettingsSchema,
  addElementSchema,
  updateElementSchema,
  createSnapshotSchema
} from '../middleware/validation/schemas/whiteboardValidation.js';
import {
  createWhiteboard,
  getWhiteboards,
  getWhiteboard,
  updateSettings,
  addElement,
  updateElement,
  deleteElement,
  createSnapshot,
  archiveWhiteboard
} from '../controllers/whiteboardController.js';

const router = express.Router({ mergeParams: true });

// Base URL: /api/meetings/:meetingId/whiteboards
// and /api/whiteboards for direct whiteboard access

// Meeting whiteboard routes
router.route('/')
  .post(auth, validate(createWhiteboardSchema), createWhiteboard)
  .get(auth, getWhiteboards);

// Individual whiteboard routes
router.route('/:id')
  .get(auth, getWhiteboard);

router.route('/:id/settings')
  .put(auth, validate(updateSettingsSchema), updateSettings);

router.route('/:id/elements')
  .post(auth, validate(addElementSchema), addElement);

router.route('/:id/elements/:elementId')
  .put(auth, validate(updateElementSchema), updateElement)
  .delete(auth, deleteElement);

router.route('/:id/snapshots')
  .post(auth, validate(createSnapshotSchema), createSnapshot);

router.route('/:id/archive')
  .put(auth, archiveWhiteboard);

export default router;
