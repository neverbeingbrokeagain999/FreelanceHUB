import logger from '../config/logger.js';
import Profile from '../models/Profile.js';
import User from '../models/User.js';
import { errorResponse } from '../utils/errorHandler.js';

const validateProfileFields = (data) => {
  const errors = [];

  if (data.title && (typeof data.title !== 'string' || data.title.length < 3)) {
    errors.push('Title must be at least 3 characters long');
  }

  if (data.bio && (typeof data.bio !== 'string' || data.bio.length < 10)) {
    errors.push('Bio must be at least 10 characters long');
  }

  if (data.hourlyRate) {
    const rate = parseFloat(data.hourlyRate);
    if (isNaN(rate) || rate < 0) {
      errors.push('Invalid hourly rate');
    }
  }

  return errors;
};

export const getFreelancerProfile = async (req, res) => {
  try {
    const userId = req.params.id || req.user.id;
    const profile = await Profile.findOne({ user: userId })
      .populate('user', 'name email role');

    if (!profile) {
      // Create new profile if none exists
      const user = await User.findById(userId);
      if (!user) {
        return errorResponse(res, 404, 'User not found');
      }

      const newProfile = await Profile.create({
        user: userId,
        title: 'Software Developer', // Default title
        bio: 'A professional developer', // Default bio
        skills: [],
        education: [],
        experience: [],
        languages: []
      });

      const populatedProfile = await Profile.findById(newProfile._id)
        .populate('user', 'name email role');

      return res.json(populatedProfile);
    }

    res.json(profile);
  } catch (error) {
    logger.error('Get freelancer profile error:', error);
    return errorResponse(res, 500, 'Server error');
  }
};

export const updateFreelancerProfile = async (req, res) => {
  try {
    // Validate fields
    const errors = validateProfileFields(req.body);
    if (errors.length > 0) {
      return errorResponse(res, 400, errors[0]);
    }

    let profile = await Profile.findOne({ user: req.user.id });
    if (!profile) {
      profile = await Profile.create({
        user: req.user.id,
        title: req.body.title || 'Software Developer',
        bio: req.body.bio || 'A professional developer',
        skills: [],
        education: [],
        experience: [],
        languages: []
      });
    }

    // Handle file upload
    if (req.file) {
      profile.profilePicture = `/uploads/${req.file.filename}`;
    }

    // Update basic fields
    const fields = ['title', 'bio', 'hourlyRate', 'location', 'availability'];
    fields.forEach(field => {
      if (req.body[field] !== undefined) {
        profile[field] = req.body[field];
      }
    });

    // Update arrays with proper object structure
    if (req.body.skills !== undefined) {
      try {
        const skills = typeof req.body.skills === 'string' 
          ? JSON.parse(req.body.skills)
          : req.body.skills;
        
        profile.skills = skills.map(skill => 
          typeof skill === 'string' 
            ? { name: skill, level: 'Intermediate', endorsements: [] }
            : skill
        );
      } catch (error) {
        throw new Error('Invalid skills data format');
      }
    }

    // Handle other array fields
    ['education', 'experience'].forEach(field => {
      if (req.body[field] !== undefined) {
        try {
          profile[field] = typeof req.body[field] === 'string' 
            ? JSON.parse(req.body[field])
            : req.body[field];
        } catch (error) {
          throw new Error(`Invalid ${field} data format`);
        }
      }
    });

    // Handle languages array (simple strings)
    if (req.body.languages !== undefined) {
      try {
        profile.languages = typeof req.body.languages === 'string'
          ? JSON.parse(req.body.languages)
          : req.body.languages;
      } catch (error) {
        throw new Error('Invalid languages data format');
      }
    }

    await profile.save();

    const updatedProfile = await Profile.findById(profile._id)
      .populate('user', 'name email role')
      .populate('skills.endorsements.endorsedBy', 'name')
      .populate('testimonials.givenBy', 'name');

    res.json({
      message: 'Profile updated successfully',
      profile: updatedProfile
    });
  } catch (error) {
    logger.error('Update freelancer profile error:', error);
    if (error.message.startsWith('Invalid')) {
      return errorResponse(res, 400, error.message);
    }
    return errorResponse(res, 500, 'Server error');
  }
};

export const addSkillEndorsement = async (req, res) => {
  try {
    const profile = await Profile.findOne({ user: req.params.id });
    if (!profile) {
      return errorResponse(res, 404, 'Freelancer profile not found');
    }

    const { skill } = req.body;
    if (!skill) {
      return errorResponse(res, 400, 'Skill is required');
    }

    if (!profile.skills) {
      profile.skills = [];
    }

    const skillEntry = profile.skills.find(s => s.name === skill);
    if (skillEntry && skillEntry.endorsements.some(e => e.endorsedBy.toString() === req.user.id)) {
      return errorResponse(res, 400, 'Already endorsed this skill');
    }

    if (skillEntry) {
      skillEntry.endorsements.push({ endorsedBy: req.user.id });
    } else {
      profile.skills.push({
        name: skill,
        endorsements: [{ endorsedBy: req.user.id }]
      });
    }

    await profile.save();

    const updatedProfile = await Profile.findById(profile._id)
      .populate('skills.endorsements.endorsedBy', 'name');

    res.json({ 
      message: 'Skill endorsed successfully', 
      profile: updatedProfile 
    });
  } catch (error) {
    logger.error('Add skill endorsement error:', error);
    return errorResponse(res, 500, 'Server error');
  }
};

export const getSkillEndorsements = async (req, res) => {
  try {
    const profile = await Profile.findOne({ user: req.params.id })
      .populate('skills.endorsements.endorsedBy', 'name');
    
    if (!profile) {
      return errorResponse(res, 404, 'Freelancer profile not found');
    }

    res.json({
      data: profile.skills || [],
      pagination: {
        total: profile.skills ? profile.skills.length : 0,
        page: 1,
        pages: 1
      }
    });
  } catch (error) {
    logger.error('Get skill endorsements error:', error);
    return errorResponse(res, 500, 'Server error');
  }
};

export const addTestimonial = async (req, res) => {
  try {
    const profile = await Profile.findOne({ user: req.params.id });
    if (!profile) {
      return errorResponse(res, 404, 'Freelancer profile not found');
    }

    const { text } = req.body;
    if (!text || typeof text !== 'string' || text.length < 10) {
      return errorResponse(res, 400, 'Testimonial text must be at least 10 characters');
    }

    if (!profile.testimonials) {
      profile.testimonials = [];
    }

    if (profile.testimonials.some(t => t.givenBy.toString() === req.user.id)) {
      return errorResponse(res, 400, 'You have already given a testimonial');
    }

    profile.testimonials.push({
      text,
      givenBy: req.user.id,
      date: new Date()
    });

    await profile.save();

    const updatedProfile = await Profile.findById(profile._id)
      .populate('testimonials.givenBy', 'name');

    res.json({ 
      message: 'Testimonial added successfully', 
      testimonials: updatedProfile.testimonials 
    });
  } catch (error) {
    logger.error('Add testimonial error:', error);
    return errorResponse(res, 500, 'Server error');
  }
};

export const getTestimonials = async (req, res) => {
  try {
    const profile = await Profile.findOne({ user: req.params.id })
      .populate('testimonials.givenBy', 'name');
    
    if (!profile) {
      return errorResponse(res, 404, 'Freelancer profile not found');
    }

    res.json({
      data: profile.testimonials || [],
      pagination: {
        total: profile.testimonials ? profile.testimonials.length : 0,
        page: 1,
        pages: 1
      }
    });
  } catch (error) {
    logger.error('Get testimonials error:', error);
    return errorResponse(res, 500, 'Server error');
  }
};
