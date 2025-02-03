import express from 'express';
import { auth } from '../middleware/auth.js';
import { createProjectTemplate, getProjectTemplates, getProjectTemplate, updateProjectTemplate, deleteProjectTemplate } from '../controllers/projectTemplateController.js';

const router = express.Router();

router.post('/', auth, createProjectTemplate);
router.get('/', auth, getProjectTemplates);
router.get('/:id', auth, getProjectTemplate);
router.put('/:id', auth, updateProjectTemplate);
router.delete('/:id', auth, deleteProjectTemplate);

export default router;
