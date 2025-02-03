import speakeasy from 'speakeasy';
import qrcode from 'qrcode';
import User from '../models/User.js';

// Enable 2FA for a user
export const enable2FA = async (req, res) => {
  try {
    const userId = req.user.id;

    // Generate secret
    const secret = speakeasy.generateSecret({
      name: `FreelanceHub:${req.user.email}`
    });

    // Generate QR code
    const qrCodeUrl = await qrcode.toDataURL(secret.otpauth_url);

    // Update user with secret
    await User.findByIdAndUpdate(userId, {
      'security.twoFactorSecret': secret.base32,
      'security.twoFactorEnabled': false // Will be enabled after verification
    });

    // Generate backup codes
    const user = await User.findById(userId);
    const backupCodes = user.generateBackupCodes();
    await user.save();

    res.json({
      message: 'Two-factor authentication setup initiated',
      secret: secret.base32,
      qrCode: qrCodeUrl,
      backupCodes
    });
  } catch (error) {
    console.error('Enable 2FA error:', error);
    res.status(500).json({
      message: 'Failed to enable two-factor authentication',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Verify and activate 2FA
export const verify2FA = async (req, res) => {
  try {
    const { token } = req.body;
    const userId = req.user.id;

    const user = await User.findById(userId);
    if (!user.security.twoFactorSecret) {
      return res.status(400).json({ message: '2FA not initiated' });
    }

    const verified = speakeasy.totp.verify({
      secret: user.security.twoFactorSecret,
      encoding: 'base32',
      token
    });

    if (!verified) {
      return res.status(400).json({ message: 'Invalid verification code' });
    }

    user.security.twoFactorEnabled = true;
    await user.save();

    res.json({
      message: 'Two-factor authentication enabled successfully'
    });
  } catch (error) {
    console.error('Verify 2FA error:', error);
    res.status(500).json({
      message: 'Failed to verify two-factor authentication',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Disable 2FA
export const disable2FA = async (req, res) => {
  try {
    const { token } = req.body;
    const userId = req.user.id;

    const user = await User.findById(userId);
    if (!user.security.twoFactorEnabled) {
      return res.status(400).json({ message: '2FA is not enabled' });
    }

    // Verify token before disabling
    const verified = speakeasy.totp.verify({
      secret: user.security.twoFactorSecret,
      encoding: 'base32',
      token
    });

    if (!verified) {
      return res.status(400).json({ message: 'Invalid verification code' });
    }

    // Reset 2FA settings
    user.security.twoFactorEnabled = false;
    user.security.twoFactorSecret = undefined;
    user.security.twoFactorBackupCodes = [];
    await user.save();

    res.json({
      message: 'Two-factor authentication disabled successfully'
    });
  } catch (error) {
    console.error('Disable 2FA error:', error);
    res.status(500).json({
      message: 'Failed to disable two-factor authentication',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Validate 2FA token
export const validate2FA = async (req, res) => {
  try {
    const { token, userId } = req.body;

    const user = await User.findById(userId);
    if (!user.security.twoFactorEnabled) {
      return res.status(400).json({ message: '2FA is not enabled' });
    }

    // Check if using backup code
    const backupCode = user.security.twoFactorBackupCodes.find(bc => bc.code === token);
    if (backupCode) {
      if (backupCode.used) {
        return res.status(400).json({ message: 'Backup code already used' });
      }

      // Mark backup code as used
      backupCode.used = true;
      await user.save();

      return res.json({
        message: 'Two-factor authentication validated successfully',
        method: 'backup'
      });
    }

    // Verify TOTP token
    const verified = speakeasy.totp.verify({
      secret: user.security.twoFactorSecret,
      encoding: 'base32',
      token,
      window: 1 // Allow 30 seconds clock skew
    });

    if (!verified) {
      return res.status(400).json({ message: 'Invalid verification code' });
    }

    res.json({
      message: 'Two-factor authentication validated successfully',
      method: 'totp'
    });
  } catch (error) {
    console.error('Validate 2FA error:', error);
    res.status(500).json({
      message: 'Failed to validate two-factor authentication',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Generate new backup codes
export const generateNewBackupCodes = async (req, res) => {
  try {
    const { token } = req.body;
    const userId = req.user.id;

    const user = await User.findById(userId);
    if (!user.security.twoFactorEnabled) {
      return res.status(400).json({ message: '2FA is not enabled' });
    }

    // Verify token before generating new codes
    const verified = speakeasy.totp.verify({
      secret: user.security.twoFactorSecret,
      encoding: 'base32',
      token
    });

    if (!verified) {
      return res.status(400).json({ message: 'Invalid verification code' });
    }

    const backupCodes = user.generateBackupCodes();
    await user.save();

    res.json({
      message: 'New backup codes generated successfully',
      backupCodes
    });
  } catch (error) {
    console.error('Generate backup codes error:', error);
    res.status(500).json({
      message: 'Failed to generate new backup codes',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Get 2FA status
export const get2FAStatus = async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await User.findById(userId).select('security.twoFactorEnabled');

    res.json({
      enabled: user.security.twoFactorEnabled
    });
  } catch (error) {
    console.error('Get 2FA status error:', error);
    res.status(500).json({
      message: 'Failed to get 2FA status',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};
