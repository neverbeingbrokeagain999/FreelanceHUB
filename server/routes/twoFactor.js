import express from 'express';
import { body } from 'express-validator';
import { validate } from '../middleware/validation/validator.js';
import { protect } from '../middleware/auth.js';
import {
  setup2FA,
  verify2FA,
  disable2FA,
  validateBackupCode,
  regenerateBackupCodes,
  get2FAStatus
} from '../controllers/twoFactorController.js';

const router = express.Router();

// Validation schemas
const tokenValidation = [
  body('token')
    .isString()
    .trim()
    .isLength({ min: 6, max: 6 })
    .matches(/^\d+$/)
    .withMessage('Token must be 6 digits')
];

const backupCodeValidation = [
  body('code')
    .isString()
    .trim()
    .isLength({ min: 8, max: 8 })
    .matches(/^[a-f0-9]+$/)
    .withMessage('Invalid backup code format')
];

// Routes
router.post('/setup', protect, setup2FA);
router.post('/verify', protect, tokenValidation, validate, verify2FA);
router.post('/disable', protect, tokenValidation, validate, disable2FA);
router.post('/backup/verify', protect, backupCodeValidation, validate, validateBackupCode);
router.post('/backup/regenerate', protect, tokenValidation, validate, regenerateBackupCodes);
router.get('/status', protect, get2FAStatus);

export default router;
