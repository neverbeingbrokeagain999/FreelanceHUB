import { body, param, query } from 'express-validator';

export const createWhiteboardSchema = [
  param('meetingId')
    .isMongoId()
    .withMessage('Invalid meeting ID'),
  
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Whiteboard name is required')
    .isLength({ max: 100 })
    .withMessage('Name cannot exceed 100 characters'),
  
  body('settings')
    .optional()
    .isObject()
    .withMessage('Settings must be an object'),
  
  body('settings.defaultStrokeColor')
    .optional()
    .matches(/^#[0-9A-Fa-f]{6}$/)
    .withMessage('Invalid stroke color format'),
  
  body('settings.defaultStrokeWidth')
    .optional()
    .isInt({ min: 1, max: 50 })
    .withMessage('Stroke width must be between 1 and 50'),
  
  body('settings.defaultFillColor')
    .optional()
    .matches(/^#[0-9A-Fa-f]{6}$|^transparent$/)
    .withMessage('Invalid fill color format'),
  
  body('settings.backgroundColor')
    .optional()
    .matches(/^#[0-9A-Fa-f]{6}$/)
    .withMessage('Invalid background color format'),
  
  body('settings.width')
    .optional()
    .isInt({ min: 800, max: 4096 })
    .withMessage('Width must be between 800 and 4096'),
  
  body('settings.height')
    .optional()
    .isInt({ min: 600, max: 4096 })
    .withMessage('Height must be between 600 and 4096'),
  
  body('settings.allowedTools')
    .optional()
    .isArray()
    .withMessage('Allowed tools must be an array')
    .custom((tools) => {
      const validTools = ['pen', 'line', 'rectangle', 'circle', 'text', 'eraser', 'image'];
      return tools.every(tool => validTools.includes(tool));
    })
    .withMessage('Invalid tool specified')
];

export const updateSettingsSchema = [
  param('id')
    .isMongoId()
    .withMessage('Invalid whiteboard ID'),
  
  body()
    .isObject()
    .notEmpty()
    .withMessage('Settings are required'),
  
  body('defaultStrokeColor')
    .optional()
    .matches(/^#[0-9A-Fa-f]{6}$/)
    .withMessage('Invalid stroke color format'),
  
  body('defaultStrokeWidth')
    .optional()
    .isInt({ min: 1, max: 50 })
    .withMessage('Stroke width must be between 1 and 50'),
  
  body('defaultFillColor')
    .optional()
    .matches(/^#[0-9A-Fa-f]{6}$|^transparent$/)
    .withMessage('Invalid fill color format'),
  
  body('backgroundColor')
    .optional()
    .matches(/^#[0-9A-Fa-f]{6}$/)
    .withMessage('Invalid background color format')
];

export const addElementSchema = [
  param('id')
    .isMongoId()
    .withMessage('Invalid whiteboard ID'),
  
  body('type')
    .notEmpty()
    .withMessage('Element type is required')
    .isIn(['path', 'line', 'rectangle', 'circle', 'text', 'image'])
    .withMessage('Invalid element type'),
  
  body('points')
    .isArray()
    .withMessage('Points must be an array'),
  
  body('points.*.x')
    .isNumeric()
    .withMessage('Point x coordinate must be numeric'),
  
  body('points.*.y')
    .isNumeric()
    .withMessage('Point y coordinate must be numeric'),
  
  body('properties')
    .isObject()
    .withMessage('Properties must be an object'),
  
  body('properties.strokeColor')
    .optional()
    .matches(/^#[0-9A-Fa-f]{6}$/)
    .withMessage('Invalid stroke color format'),
  
  body('properties.strokeWidth')
    .optional()
    .isInt({ min: 1, max: 50 })
    .withMessage('Invalid stroke width'),
  
  body('properties.fillColor')
    .optional()
    .matches(/^#[0-9A-Fa-f]{6}$|^transparent$/)
    .withMessage('Invalid fill color format'),
  
  body('properties.text')
    .optional()
    .isString()
    .isLength({ max: 1000 })
    .withMessage('Text cannot exceed 1000 characters'),
  
  body('properties.fontSize')
    .optional()
    .isInt({ min: 8, max: 72 })
    .withMessage('Font size must be between 8 and 72'),
  
  body('properties.fontFamily')
    .optional()
    .isString()
    .isLength({ max: 50 })
    .withMessage('Font family cannot exceed 50 characters'),
  
  body('properties.imageUrl')
    .optional()
    .isURL()
    .withMessage('Invalid image URL')
];

export const updateElementSchema = [
  param('id')
    .isMongoId()
    .withMessage('Invalid whiteboard ID'),
  
  param('elementId')
    .isMongoId()
    .withMessage('Invalid element ID'),
  
  body()
    .isObject()
    .notEmpty()
    .withMessage('Update data is required')
];

export const createSnapshotSchema = [
  param('id')
    .isMongoId()
    .withMessage('Invalid whiteboard ID'),
  
  body('imageUrl')
    .notEmpty()
    .withMessage('Image URL is required')
    .isURL()
    .withMessage('Invalid image URL')
];

export default {
  createWhiteboardSchema,
  updateSettingsSchema,
  addElementSchema,
  updateElementSchema,
  createSnapshotSchema
};
