import express from 'express';
import { auth } from '../middleware/auth.js';
import { startTimer, stopTimer, getTimerEntries } from '../controllers/timeTrackingController.js';

const router = express.Router();

router.post('/start', auth, startTimer);
router.put('/stop', auth, stopTimer);
router.get('/:jobId', auth, getTimerEntries);

export default router;
