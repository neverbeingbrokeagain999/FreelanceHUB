import Profile from '../models/Profile.js';
import User from '../models/User.js';
import logger from '../config/logger.js';

export const createOrUpdateProfile = async ({ userId, type, data = {} }) => {
  try {
    let [profile, user] = await Promise.all([
      Profile.findOne({ user: userId, profileType: type }),
      User.findById(userId)
    ]);

    if (!user) {
      throw new Error('User not found');
    }

    if (!profile) {
      profile = await Profile.create({
        user: userId,
        profileType: type,
        skills: [],
        education: [],
        experience: [],
        languages: [],
        ...data
      });
    } else {
      Object.assign(profile, data);
      await profile.save();
    }

    return Profile.findById(profile._id)
      .populate('user', 'name email role availability profilePicture');
  } catch (error) {
    logger.error(`Create/update profile error for userId: ${userId}`, error);
    throw error;
  }
};

export const handleFileUpload = (profile, file) => {
  if (file) {
    profile.profilePicture = `/uploads/${file.filename}`;
  }
  return profile;
};

export const updateProfileArrays = (profile, data) => {
  const arrayFields = ['skills', 'education', 'experience', 'languages'];
  arrayFields.forEach(field => {
    if (data[field] !== undefined) {
      try {
        profile[field] = typeof data[field] === 'string' 
          ? JSON.parse(data[field])
          : data[field];
      } catch (error) {
        logger.error(`Error parsing ${field} for profile:`, error);
        throw new Error(`Invalid ${field} data`);
      }
    }
  });
  return profile;
};

export const validateProfileFields = ({ title, bio, hourlyRate }) => {
  const errors = [];

  if (title && (typeof title !== 'string' || title.length < 3)) {
    errors.push('Title must be at least 3 characters long');
  }

  if (bio && (typeof bio !== 'string' || bio.length < 10)) {
    errors.push('Bio must be at least 10 characters long');
  }

  if (hourlyRate !== undefined) {
    const rate = parseFloat(hourlyRate);
    if (isNaN(rate) || rate < 0) {
      errors.push('Invalid hourly rate');
    }
  }

  return errors;
};

export const getProfileByUserId = async (userId, type) => {
  try {
    let profile = await Profile.findOne({ user: userId, profileType: type })
      .populate('user', 'name email role availability profilePicture');

    if (!profile) {
      const user = await User.findById(userId);
      if (!user) {
        throw new Error('User not found');
      }

      profile = await Profile.create({
        user: userId,
        profileType: type,
        skills: [],
        education: [],
        experience: [],
        languages: []
      });

      profile = await Profile.findById(profile._id)
        .populate('user', 'name email role availability profilePicture');
    }

    return profile;
  } catch (error) {
    logger.error(`Get profile error for userId: ${userId}`, error);
    throw error;
  }
};
