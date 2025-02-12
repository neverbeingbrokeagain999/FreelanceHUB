import express from 'express';
import { protect, authorize } from '../middleware/auth.js';
import { validate, validatePagination, validateSort } from '../middleware/validation/validator.js';
import {
  createTemplateSchema,
  updateTemplateSchema,
  getTemplateSchema,
  deleteTemplateSchema,
  listTemplatesSchema
} from '../middleware/validation/schemas/projectTemplateValidation.js';

import {
  createTemplate,
  updateTemplate,
  deleteTemplate,
  getTemplate,
  listTemplates,
  getTemplateStats
} from '../controllers/projectTemplateController.js';

const router = express.Router();

// Public routes
router.get('/', 
  validatePagination,
  validateSort(['createdAt', 'name', 'category']),
  validate(listTemplatesSchema), 
  listTemplates
);

router.get('/stats', getTemplateStats);

router.get('/:id',
  validate(getTemplateSchema),
  getTemplate
);

// Protected routes
router.use(protect);

// Admin only routes
router.post('/',
  authorize(['admin']),
  validate(createTemplateSchema),
  createTemplate
);

router.put('/:id',
  authorize(['admin']),
  validate(updateTemplateSchema),
  updateTemplate
);

router.delete('/:id',
  authorize(['admin']),
  validate(deleteTemplateSchema),
  deleteTemplate
);

export default router;
