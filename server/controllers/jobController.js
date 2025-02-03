import Job from '../models/Job.js';
import JobAlert from '../models/JobAlert.js';
import User from '../models/User.js';
import logger from '../config/logger.js';
import { errorResponse } from '../utils/errorHandler.js';

export const createJob = async (req, res) => {
  try {
    if (req.user.role !== 'client') {
      return errorResponse(res, 403, 'Only clients can create jobs');
    }

    const { title, description, category, skills, budget, type, duration, experienceLevel, location } = req.body;

    if (!title || !description || !category || !skills || !type || !duration || !experienceLevel) {
      return errorResponse(res, 400, 'Please provide all required fields');
    }

    if (!budget || !budget.type || !budget.min) {
      return errorResponse(res, 400, 'Please provide a valid budget');
    }

    const job = await Job.create({
      title,
      description,
      category,
      skills,
      budget,
      type,
      duration,
      experienceLevel,
      location,
      client: req.user.id,
      status: 'published'
    });

    // Trigger job alerts
    await JobAlert.find({ 
      keywords: { $in: [req.body.title, ...req.body.skills] }
    }).then(alerts => {
      // In a real app, send notifications to users
      logger.info(`Triggered ${alerts.length} job alerts`);
    });

    res.status(201).json(job);
  } catch (error) {
    logger.error('Create job error:', error);
    return errorResponse(res, 500, 'Server error');
  }
};

export const getAllJobs = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const status = req.query.status || 'published';
    
    const [jobs, total] = await Promise.all([
      Job.find({ status })
        .populate('client', 'name')
        .skip((page - 1) * limit)
        .limit(limit)
        .sort('-createdAt'),
      Job.countDocuments({ status })
    ]);

    res.json({
      data: jobs,
      pagination: {
        total,
        page,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    logger.error('Get all jobs error:', error);
    return errorResponse(res, 500, 'Server error');
  }
};

export const getJobById = async (req, res) => {
  try {
    const job = await Job.findById(req.params.id)
      .populate('client', 'name email');
      
    if (!job) {
      return errorResponse(res, 404, 'Job not found');
    }
    
    res.json(job);
  } catch (error) {
    logger.error('Get job error:', error);
    return errorResponse(res, 500, 'Server error');
  }
};

export const updateJob = async (req, res) => {
  try {
    const job = await Job.findById(req.params.id);
    if (!job) {
      return errorResponse(res, 404, 'Job not found');
    }

    if (job.client.toString() !== req.user.id) {
      return errorResponse(res, 403, 'Not authorized to update this job');
    }

    const updatedJob = await Job.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true, runValidators: true }
    );

    res.json(updatedJob);
  } catch (error) {
    logger.error('Update job error:', error);
    return errorResponse(res, 500, 'Server error');
  }
};

export const deleteJob = async (req, res) => {
  try {
    const job = await Job.findById(req.params.id);
    if (!job) {
      return errorResponse(res, 404, 'Job not found');
    }

    if (job.client.toString() !== req.user.id) {
      return errorResponse(res, 403, 'Not authorized to delete this job');
    }

    await job.deleteOne();
    res.json({ message: 'Job deleted successfully' });
  } catch (error) {
    logger.error('Delete job error:', error);
    return errorResponse(res, 500, 'Server error');
  }
};

export const applyToJob = async (req, res) => {
  try {
    if (req.user.role !== 'freelancer') {
      return errorResponse(res, 403, 'Only freelancers can apply to jobs');
    }

    const job = await Job.findById(req.params.id);
    if (!job) {
      return errorResponse(res, 404, 'Job not found');
    }

    if (job.status !== 'published') {
      return errorResponse(res, 400, 'This job is not accepting applications');
    }

    // Check if already applied
    const alreadyApplied = job.applicants.some(
      app => app.freelancer.toString() === req.user.id
    );
    if (alreadyApplied) {
      return errorResponse(res, 400, 'Already applied to this job');
    }

    job.applicants.push({
      freelancer: req.user.id,
      coverLetter: req.body.coverLetter,
      proposedRate: req.body.proposedRate
    });

    await job.save();
    res.json({ message: 'Application submitted successfully' });
  } catch (error) {
    logger.error('Apply to job error:', error);
    return errorResponse(res, 500, 'Server error');
  }
};

export const getApplicants = async (req, res) => {
  try {
    const job = await Job.findById(req.params.id)
      .populate('applicants.freelancer', 'name email profilePicture')
      .select('applicants');
      
    if (!job) {
      return errorResponse(res, 404, 'Job not found');
    }

    if (job.client.toString() !== req.user.id) {
      return errorResponse(res, 403, 'Not authorized to view applicants');
    }

    res.json(job.applicants);
  } catch (error) {
    logger.error('Get applicants error:', error);
    return errorResponse(res, 500, 'Server error');
  }
};

export const searchJobs = async (req, res) => {
  try {
    const {
      keyword,
      skills,
      minBudget,
      maxBudget,
      category,
      page = 1,
      limit = 10
    } = req.query;

    const query = { status: 'published' };
    
    if (keyword) {
      query.$or = [
        { title: { $regex: keyword, $options: 'i' } },
        { description: { $regex: keyword, $options: 'i' } }
      ];
    }

    if (skills) {
      query.skills = { $in: skills.split(',').map(s => s.trim()) };
    }

    if (minBudget || maxBudget) {
      query.budget = {};
      if (minBudget) query.budget.$gte = parseInt(minBudget);
      if (maxBudget) query.budget.$lte = parseInt(maxBudget);
    }

    if (category) {
      query.category = category;
    }

    const [jobs, total] = await Promise.all([
      Job.find(query)
        .populate('client', 'name')
        .skip((page - 1) * limit)
        .limit(limit)
        .sort('-createdAt'),
      Job.countDocuments(query)
    ]);

    res.json({
      data: jobs,
      pagination: {
        total,
        page,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    logger.error('Search jobs error:', error);
    return errorResponse(res, 500, 'Server error');
  }
};

export const getRecommendedJobs = async (req, res) => {
  try {
    if (req.user.role !== 'freelancer') {
      return errorResponse(res, 403, 'Only freelancers can get recommendations');
    }

    const user = await User.findById(req.user.id);
    if (!user.skills || user.skills.length === 0) {
      return errorResponse(res, 400, 'Please add skills to get recommendations');
    }

    const jobs = await Job.find({
      status: 'published',
      skills: { $in: user.skills }
    })
      .populate('client', 'name')
      .limit(10)
      .sort('-createdAt');

    res.json(jobs);
  } catch (error) {
    logger.error('Get recommended jobs error:', error);
    return errorResponse(res, 500, 'Server error');
  }
};

export const getJobStats = async (req, res) => {
  try {
    const stats = await Job.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          totalBudget: { $sum: '$budget' }
        }
      }
    ]);

    const byCategory = await Job.aggregate([
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 },
          avgBudget: { $avg: '$budget' }
        }
      }
    ]);

    res.json({
      byStatus: stats,
      byCategory
    });
  } catch (error) {
    logger.error('Get job stats error:', error);
    return errorResponse(res, 500, 'Server error');
  }
};
