import express from 'express';
import { auth } from '../middleware/auth.js';
import { sendMessage, getMessages, markMessageAsRead } from '../controllers/chatController.js';
import multer from 'multer';

const router = express.Router();
const upload = multer({ dest: 'uploads/' });

router.post('/', auth, upload.array('files'), sendMessage);
router.get('/:jobId', auth, getMessages);
router.put('/read', auth, markMessageAsRead);

export default router;
