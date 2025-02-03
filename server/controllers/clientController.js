import logger from '../config/logger.js';
import { errorResponse } from '../utils/errorHandler.js';
import { createOrUpdateProfile, getProfileByUserId, validateProfileFields, handleFileUpload } from './profileController.js';

export const getClientProfile = async (req, res) => {
  try {
    const userId = req.params.id || req.user.userId;
    const profile = await getProfileByUserId(userId, 'client');
    res.json(profile);
  } catch (error) {
    logger.error('Get client profile error:', error);
    return errorResponse(
      res, 
      error.message === 'User not found' ? 404 : 500,
      error.message || 'Server error'
    );
  }
};

export const updateClientProfile = async (req, res) => {
  try {
    const userId = req.user.userId;
    logger.info(`Updating client profile for user: ${userId}`);

    // Validate fields
    const errors = validateProfileFields(req.body);
    if (errors.length > 0) {
      return errorResponse(res, 400, errors[0]);
    }

    let profile = await getProfileByUserId(userId, 'client');

    // Handle file upload
    profile = handleFileUpload(profile, req.file);

    // Update basic fields
    const fields = ['title', 'bio', 'companyName', 'industry', 'companySize', 'website'];
    fields.forEach(field => {
      if (req.body[field] !== undefined) {
        profile[field] = req.body[field];
        logger.info(`Updated ${field} for userId: ${userId}`);
      }
    });

    await profile.save();

    const updatedProfile = await getProfileByUserId(userId, 'client');
    res.json({
      message: 'Profile updated successfully',
      profile: updatedProfile
    });
  } catch (error) {
    logger.error('Update client profile error:', error);
    return errorResponse(
      res,
      error.message === 'User not found' ? 404 : 500,
      error.message || 'Server error'
    );
  }
};

// Validate client-specific fields
export const validateClientFields = ({ companyName, industry, companySize, website }) => {
  const errors = [];

  if (companyName && (typeof companyName !== 'string' || companyName.length < 2)) {
    errors.push('Company name must be at least 2 characters long');
  }

  if (industry && typeof industry !== 'string') {
    errors.push('Industry must be a valid string');
  }

  if (companySize && typeof companySize !== 'string') {
    errors.push('Company size must be a valid string');
  }

  if (website) {
    try {
      new URL(website);
    } catch {
      errors.push('Invalid website URL');
    }
  }

  return errors;
};

// Get client's hiring history
export const getClientHiringHistory = async (req, res) => {
  try {
    const profile = await getProfileByUserId(req.params.id || req.user.userId, 'client');
    
    // In a real application, you would fetch job postings, contracts, etc.
    // For now, return a paginated empty array
    res.json({
      data: [],
      pagination: {
        total: 0,
        page: 1,
        pages: 1
      }
    });
  } catch (error) {
    logger.error('Get client hiring history error:', error);
    return errorResponse(
      res,
      error.message === 'User not found' ? 404 : 500,
      error.message || 'Server error'
    );
  }
};

// Get client statistics
export const getClientStats = async (req, res) => {
  try {
    const profile = await getProfileByUserId(req.params.id || req.user.userId, 'client');
    
    // In a real application, you would calculate these statistics
    res.json({
      totalHires: 0,
      activeContracts: 0,
      totalSpent: 0,
      averageRating: 0
    });
  } catch (error) {
    logger.error('Get client stats error:', error);
    return errorResponse(
      res,
      error.message === 'User not found' ? 404 : 500,
      error.message || 'Server error'
    );
  }
};
