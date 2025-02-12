import { body, param, query } from 'express-validator';

export const createDocumentSchema = [
  body('title')
    .trim()
    .notEmpty()
    .withMessage('Document title is required')
    .isLength({ max: 200 })
    .withMessage('Title cannot exceed 200 characters'),

  body('content')
    .notEmpty()
    .withMessage('Document content is required'),

  body('type')
    .optional()
    .isIn(['text', 'markdown', 'rich-text'])
    .withMessage('Invalid document type'),

  body('meeting')
    .optional()
    .isMongoId()
    .withMessage('Invalid meeting ID'),

  body('project')
    .optional()
    .isMongoId()
    .withMessage('Invalid project ID'),

  body('collaborators')
    .optional()
    .isArray()
    .withMessage('Collaborators must be an array'),

  body('collaborators.*.user')
    .optional()
    .isMongoId()
    .withMessage('Invalid collaborator user ID'),

  body('collaborators.*.role')
    .optional()
    .isIn(['owner', 'editor', 'commenter', 'viewer'])
    .withMessage('Invalid collaborator role'),

  body('settings')
    .optional()
    .isObject()
    .withMessage('Settings must be an object'),

  body('settings.defaultMode')
    .optional()
    .isIn(['editing', 'viewing', 'suggesting'])
    .withMessage('Invalid default mode'),

  body('settings.allowComments')
    .optional()
    .isBoolean()
    .withMessage('allowComments must be a boolean'),

  body('settings.trackChanges')
    .optional()
    .isBoolean()
    .withMessage('trackChanges must be a boolean'),

  body('settings.requireApproval')
    .optional()
    .isBoolean()
    .withMessage('requireApproval must be a boolean'),

  body('tags')
    .optional()
    .isArray()
    .withMessage('Tags must be an array'),

  body('tags.*')
    .optional()
    .isString()
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('Each tag must be between 1 and 50 characters')
];

export const updateDocumentSchema = [
  param('id')
    .isMongoId()
    .withMessage('Invalid document ID'),

  body('title')
    .optional()
    .trim()
    .isLength({ max: 200 })
    .withMessage('Title cannot exceed 200 characters'),

  body('content')
    .optional()
    .notEmpty()
    .withMessage('Content cannot be empty when provided'),

  body('status')
    .optional()
    .isIn(['draft', 'in-review', 'published', 'archived'])
    .withMessage('Invalid document status')
];

export const createVersionSchema = [
  param('id')
    .isMongoId()
    .withMessage('Invalid document ID'),

  body('content')
    .notEmpty()
    .withMessage('Version content is required'),

  body('delta')
    .notEmpty()
    .withMessage('Version delta is required')
    .isObject()
    .withMessage('Delta must be an object'),

  body('message')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Version message cannot exceed 500 characters')
];

export const addCommentSchema = [
  param('id')
    .isMongoId()
    .withMessage('Invalid document ID'),

  body('content')
    .trim()
    .notEmpty()
    .withMessage('Comment content is required')
    .isLength({ max: 2000 })
    .withMessage('Comment cannot exceed 2000 characters'),

  body('position')
    .optional()
    .isObject()
    .withMessage('Position must be an object'),

  body('position.startOffset')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Invalid start offset'),

  body('position.endOffset')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Invalid end offset'),

  body('position.version')
    .optional()
    .isMongoId()
    .withMessage('Invalid version ID')
];

export const updateCommentSchema = [
  param('id')
    .isMongoId()
    .withMessage('Invalid document ID'),

  param('commentId')
    .isMongoId()
    .withMessage('Invalid comment ID'),

  body('content')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Comment content cannot be empty')
    .isLength({ max: 2000 })
    .withMessage('Comment cannot exceed 2000 characters'),

  body('resolved')
    .optional()
    .isBoolean()
    .withMessage('Resolved must be a boolean')
];

export const addReplySchema = [
  param('id')
    .isMongoId()
    .withMessage('Invalid document ID'),

  param('commentId')
    .isMongoId()
    .withMessage('Invalid comment ID'),

  body('content')
    .trim()
    .notEmpty()
    .withMessage('Reply content is required')
    .isLength({ max: 1000 })
    .withMessage('Reply cannot exceed 1000 characters')
];

export const updateCollaboratorsSchema = [
  param('id')
    .isMongoId()
    .withMessage('Invalid document ID'),

  body()
    .isArray()
    .withMessage('Request body must be an array of collaborators'),

  body('*.user')
    .isMongoId()
    .withMessage('Invalid collaborator user ID'),

  body('*.role')
    .isIn(['owner', 'editor', 'commenter', 'viewer'])
    .withMessage('Invalid collaborator role')
];

export const getDocumentsSchema = [
  query('meeting')
    .optional()
    .isMongoId()
    .withMessage('Invalid meeting ID'),

  query('project')
    .optional()
    .isMongoId()
    .withMessage('Invalid project ID'),

  query('status')
    .optional()
    .isIn(['draft', 'in-review', 'published', 'archived'])
    .withMessage('Invalid status'),

  query('type')
    .optional()
    .isIn(['text', 'markdown', 'rich-text'])
    .withMessage('Invalid document type'),

  query('search')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Search query too long'),

  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Invalid page number'),

  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Invalid limit number')
];

export default {
  createDocumentSchema,
  updateDocumentSchema,
  createVersionSchema,
  addCommentSchema,
  updateCommentSchema,
  addReplySchema,
  updateCollaboratorsSchema,
  getDocumentsSchema
};
