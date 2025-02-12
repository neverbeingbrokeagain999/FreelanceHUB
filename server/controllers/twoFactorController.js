import { authenticator } from 'otplib';
import qrcode from 'qrcode';
import TwoFactorAuth from '../models/TwoFactorAuth.js';
import User from '../models/User.js';
import logger from '../config/logger.js';
import { createError } from '../utils/errorHandler.js';

export const setup2FA = async (req, res) => {
  try {
    const userId = req.user.id;

    // Check if 2FA is already set up
    let twoFactorAuth = await TwoFactorAuth.findOne({ user: userId });
    if (twoFactorAuth?.enabled) {
      throw createError(400, '2FA is already enabled');
    }

    // Create or update 2FA record
    if (!twoFactorAuth) {
      twoFactorAuth = new TwoFactorAuth({ user: userId });
    }

    // Generate new credentials
    const credentials = await twoFactorAuth.generateCredentials();
    
    // Generate TOTP secret for QR code
    const otpauth = authenticator.keyuri(
      req.user.email,
      'Freelance Platform',
      credentials.secret
    );

    // Generate QR code
    const qrCode = await qrcode.toDataURL(otpauth);

    res.json({
      message: '2FA setup initiated',
      qrCode,
      backupCodes: credentials.backupCodes,
      tempSecret: credentials.secret
    });
  } catch (error) {
    logger.error('2FA setup error:', error);
    res.status(error.status || 500).json({
      error: error.message || 'Error setting up 2FA'
    });
  }
};

export const verify2FA = async (req, res) => {
  try {
    const { token } = req.body;
    const userId = req.user.id;

    const twoFactorAuth = await TwoFactorAuth.findOne({ user: userId });
    if (!twoFactorAuth) {
      throw createError(404, '2FA not set up');
    }

    // Verify the token
    const isValid = authenticator.verify({
      token,
      secret: twoFactorAuth.secret
    });

    if (!isValid) {
      throw createError(401, 'Invalid verification code');
    }

    // Enable 2FA if not already enabled
    if (!twoFactorAuth.enabled) {
      twoFactorAuth.enabled = true;
      await twoFactorAuth.save();
    }

    res.json({
      message: '2FA verified successfully',
      enabled: true
    });
  } catch (error) {
    logger.error('2FA verification error:', error);
    res.status(error.status || 500).json({
      error: error.message || 'Error verifying 2FA'
    });
  }
};

export const disable2FA = async (req, res) => {
  try {
    const { token } = req.body;
    const userId = req.user.id;

    const twoFactorAuth = await TwoFactorAuth.findOne({ user: userId });
    if (!twoFactorAuth?.enabled) {
      throw createError(400, '2FA is not enabled');
    }

    // Verify the token one last time
    const isValid = authenticator.verify({
      token,
      secret: twoFactorAuth.secret
    });

    if (!isValid) {
      throw createError(401, 'Invalid verification code');
    }

    // Disable 2FA
    await TwoFactorAuth.deleteOne({ user: userId });

    res.json({
      message: '2FA disabled successfully'
    });
  } catch (error) {
    logger.error('2FA disable error:', error);
    res.status(error.status || 500).json({
      error: error.message || 'Error disabling 2FA'
    });
  }
};

export const validateBackupCode = async (req, res) => {
  try {
    const { code } = req.body;
    const userId = req.user.id;

    const twoFactorAuth = await TwoFactorAuth.findOne({ user: userId });
    if (!twoFactorAuth?.enabled) {
      throw createError(400, '2FA is not enabled');
    }

    // Verify backup code
    await twoFactorAuth.verifyBackupCode(code);

    res.json({
      message: 'Backup code verified successfully'
    });
  } catch (error) {
    logger.error('Backup code validation error:', error);
    res.status(error.status || 500).json({
      error: error.message || 'Error validating backup code'
    });
  }
};

export const regenerateBackupCodes = async (req, res) => {
  try {
    const { token } = req.body;
    const userId = req.user.id;

    const twoFactorAuth = await TwoFactorAuth.findOne({ user: userId });
    if (!twoFactorAuth?.enabled) {
      throw createError(400, '2FA is not enabled');
    }

    // Verify the token first
    const isValid = authenticator.verify({
      token,
      secret: twoFactorAuth.secret
    });

    if (!isValid) {
      throw createError(401, 'Invalid verification code');
    }

    // Generate new backup codes
    const credentials = await twoFactorAuth.generateCredentials();

    res.json({
      message: 'Backup codes regenerated',
      backupCodes: credentials.backupCodes
    });
  } catch (error) {
    logger.error('Backup code regeneration error:', error);
    res.status(error.status || 500).json({
      error: error.message || 'Error regenerating backup codes'
    });
  }
};

// Get 2FA status
export const get2FAStatus = async (req, res) => {
  try {
    const userId = req.user.id;
    const twoFactorAuth = await TwoFactorAuth.findOne({ user: userId });

    res.json({
      enabled: Boolean(twoFactorAuth?.enabled)
    });
  } catch (error) {
    logger.error('2FA status check error:', error);
    res.status(500).json({
      error: 'Error checking 2FA status'
    });
  }
};
