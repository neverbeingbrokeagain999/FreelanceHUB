import express from 'express';
import { auth } from '../middleware/auth.js';
import { createJobAlert, updateJobAlert, deleteJobAlert, getJobAlert } from '../controllers/jobAlertController.js';

const router = express.Router();

router.post('/', auth, createJobAlert);
router.put('/', auth, updateJobAlert);
router.delete('/', auth, deleteJobAlert);
router.get('/', auth, getJobAlert);

export default router;
