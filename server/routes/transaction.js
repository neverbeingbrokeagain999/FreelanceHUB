import express from 'express';
import { auth } from '../middleware/auth.js';
import { getFreelancerTransactions, requestWithdrawal, getWithdrawalHistory } from '../controllers/transactionController.js';

const router = express.Router();

router.get('/freelancer', auth, getFreelancerTransactions);
router.post('/withdrawal', auth, requestWithdrawal);
router.get('/withdrawal-history', auth, getWithdrawalHistory);

export default router;
