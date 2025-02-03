import express from 'express';
import { auth } from '../middleware/auth.js';
import { sendDirectMessage, getDirectMessages, markDirectMessageAsRead } from '../controllers/directMessageController.js';
import multer from 'multer';

const router = express.Router();
const upload = multer({ dest: 'uploads/' });

router.post('/', auth, upload.array('files'), sendDirectMessage);
router.get('/', auth, getDirectMessages);
router.put('/read', auth, markDirectMessageAsRead);

export default router;
