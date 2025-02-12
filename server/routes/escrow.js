import express from 'express';
import { escrowController } from '../controllers/escrowController.js';
import { authenticate } from '../middleware/auth.js';
import { validateRequest } from '../middleware/validation/validator.js';
import { escrowValidation } from '../middleware/validation/schemas.js';

const router = express.Router();

// Create new escrow
router.post(
  '/',
  authenticate,
  validateRequest(escrowValidation.createEscrow),
  escrowController.createEscrow
);

// Fund escrow
router.post(
  '/fund',
  authenticate,
  validateRequest(escrowValidation.fundEscrow),
  escrowController.fundEscrow
);

// Release escrow funds
router.post(
  '/:escrowId/release',
  authenticate,
  validateRequest(escrowValidation.releaseEscrow),
  escrowController.releaseEscrow
);

// Dispute escrow
router.post(
  '/:escrowId/dispute',
  authenticate,
  validateRequest(escrowValidation.disputeEscrow),
  escrowController.disputeEscrow
);

// Get user's escrows
router.get(
  '/user',
  authenticate,
  escrowController.getUserEscrows
);

// Get escrow statistics
router.get(
  '/stats',
  authenticate,
  escrowController.getEscrowStats
);

// Get single escrow details
router.get(
  '/:escrowId',
  authenticate,
  validateRequest(escrowValidation.getEscrowDetails),
  escrowController.getEscrowDetails
);

export default router;
