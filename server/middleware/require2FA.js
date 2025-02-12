import TwoFactorAuth from '../models/TwoFactorAuth.js';
import { createError } from '../utils/errorHandler.js';

// Middleware to check if user has 2FA enabled and require verification
export const require2FA = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const twoFactorAuth = await TwoFactorAuth.findOne({ user: userId });

    if (!twoFactorAuth?.enabled) {
      return next();
    }

    // Check if user has already completed 2FA for this session
    if (req.session?.twoFactorVerified) {
      return next();
    }

    // If 2FA is enabled but not verified for this session, require verification
    throw createError(403, 'Two-factor authentication required', {
      code: 'REQUIRE_2FA'
    });
  } catch (error) {
    next(error);
  }
};

// Middleware to verify 2FA token
export const verify2FAToken = async (req, res, next) => {
  try {
    const { token } = req.body;
    const userId = req.user.id;

    const twoFactorAuth = await TwoFactorAuth.findOne({ user: userId });
    if (!twoFactorAuth?.enabled) {
      return next();
    }

    // Verify token
    await twoFactorAuth.verifyToken(token);

    // Mark session as 2FA verified
    req.session.twoFactorVerified = true;
    await req.session.save();

    next();
  } catch (error) {
    next(error);
  }
};

// Middleware to verify backup code
export const verify2FABackupCode = async (req, res, next) => {
  try {
    const { backupCode } = req.body;
    const userId = req.user.id;

    const twoFactorAuth = await TwoFactorAuth.findOne({ user: userId });
    if (!twoFactorAuth?.enabled) {
      return next();
    }

    // Verify backup code
    await twoFactorAuth.verifyBackupCode(backupCode);

    // Mark session as 2FA verified
    req.session.twoFactorVerified = true;
    await req.session.save();

    next();
  } catch (error) {
    next(error);
  }
};
