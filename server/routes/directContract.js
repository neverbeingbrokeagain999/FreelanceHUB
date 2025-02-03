import express from 'express';
import { protect as auth, authorize } from '../middleware/auth.js'; // Import the authorize function
import * as directContractController from '../controllers/directContractController.js';

const router = express.Router();

// Middleware to authorize both freelancers and clients
const authorizeFreelancerOrClient = authorize(['freelancer', 'client']);

// Get user's direct contracts
router.get('/', auth, authorizeFreelancerOrClient, directContractController.getUserContracts);

// Create a new direct contract
router.post('/', auth, authorize('client'), directContractController.createContract);

// Get a specific contract
router.get('/:id', auth, authorizeFreelancerOrClient, directContractController.getContract);

// Update contract status
router.patch('/:id/status', auth, authorizeFreelancerOrClient, directContractController.updateContractStatus);

export default router;
