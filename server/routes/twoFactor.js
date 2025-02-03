import express from 'express';
import { auth } from '../middleware/auth.js';
import {
  enable2FA,
  verify2FA,
  disable2FA,
  validate2FA,
  generateNewBackupCodes,
  get2FAStatus
} from '../controllers/twoFactorController.js';

const router = express.Router();

/**
 * @route   POST /api/2fa/enable
 * @desc    Enable two-factor authentication
 * @access  Private
 * @returns {
 *   message: string,
 *   secret: string,
 *   qrCode: string,
 *   backupCodes: string[]
 * }
 */
router.post('/enable', auth, enable2FA);

/**
 * @route   POST /api/2fa/verify
 * @desc    Verify and activate two-factor authentication
 * @access  Private
 * @body    {
 *   token: string
 * }
 */
router.post('/verify', auth, verify2FA);

/**
 * @route   POST /api/2fa/disable
 * @desc    Disable two-factor authentication
 * @access  Private
 * @body    {
 *   token: string
 * }
 */
router.post('/disable', auth, disable2FA);

/**
 * @route   POST /api/2fa/validate
 * @desc    Validate 2FA token or backup code
 * @access  Public
 * @body    {
 *   token: string,
 *   userId: string
 * }
 */
router.post('/validate', validate2FA);

/**
 * @route   POST /api/2fa/backup-codes
 * @desc    Generate new backup codes
 * @access  Private
 * @body    {
 *   token: string
 * }
 */
router.post('/backup-codes', auth, generateNewBackupCodes);

/**
 * @route   GET /api/2fa/status
 * @desc    Get 2FA status for current user
 * @access  Private
 */
router.get('/status', auth, get2FAStatus);

export default router;
