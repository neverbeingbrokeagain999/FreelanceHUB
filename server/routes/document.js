import express from 'express';
import { auth } from '../middleware/auth.js';
import { validate } from '../middleware/validation/validator.js';
import {
  createDocumentSchema,
  updateDocumentSchema,
  createVersionSchema,
  addCommentSchema,
  updateCommentSchema,
  addReplySchema,
  updateCollaboratorsSchema,
  getDocumentsSchema
} from '../middleware/validation/schemas/documentValidation.js';
import {
  createDocument,
  getDocuments,
  getDocument,
  updateDocument,
  createVersion,
  addComment,
  updateComment,
  addReply,
  updateCollaborators
} from '../controllers/documentController.js';

const router = express.Router({ mergeParams: true });

// Base routes
router.route('/')
  .post(auth, validate(createDocumentSchema), createDocument)
  .get(auth, validate(getDocumentsSchema), getDocuments);

router.route('/:id')
  .get(auth, getDocument)
  .put(auth, validate(updateDocumentSchema), updateDocument);

// Version management
router.route('/:id/versions')
  .post(auth, validate(createVersionSchema), createVersion);

// Comment management
router.route('/:id/comments')
  .post(auth, validate(addCommentSchema), addComment);

router.route('/:id/comments/:commentId')
  .put(auth, validate(updateCommentSchema), updateComment);

router.route('/:id/comments/:commentId/replies')
  .post(auth, validate(addReplySchema), addReply);

// Collaborator management
router.route('/:id/collaborators')
  .put(auth, validate(updateCollaboratorsSchema), updateCollaborators);

// Nested routes for meeting and project specific documents
router.use('/meeting/:meetingId', router);
router.use('/project/:projectId', router);

export default router;
