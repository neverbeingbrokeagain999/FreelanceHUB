import express from 'express';
import { auth } from '../middleware/auth.js';
import { addSkillEndorsement, getSkillEndorsements, deleteSkillEndorsement } from '../controllers/endorsementController.js';

const router = express.Router();

router.post('/:id', auth, addSkillEndorsement);
router.get('/:id', auth, getSkillEndorsements);
router.delete('/:id', auth, deleteSkillEndorsement);

export default router;
