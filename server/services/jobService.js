import { ApiError } from '../utils/errorHandler.js';
import Job from '../models/Job.js';
import { logger } from '../config/logger.js';

export const createNewJob = async (jobData, userId) => {
  const { title, description, budget, skills, category } = jobData;

  if (!title || !description || !budget || !skills || !category) {
    throw new ApiError(400, 'Please provide all required fields');
  }

  const job = new Job({
    title,
    description,
    budget,
    skills,
    category,
    client: userId,
    status: 'open'
  });

  await job.save();
  return job;
};

export const getJobList = async ({ page = 1, limit = 10, status, type, sort }) => {
  const query = {};
  if (status && status !== 'all') query.status = status;
  if (type) query.type = type;

  const sortOptions = {
    latest: { createdAt: -1 },
    budget: { 'budget.min': -1 },
    deadline: { 'timeline.deadline': 1 }
  };

  const jobs = await Job.find(query)
    .sort(sortOptions[sort] || { createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(parseInt(limit))
    .populate('client', 'name email')
    .lean();

  const total = await Job.countDocuments(query);

  return {
    jobs,
    pagination: {
      total,
      page: parseInt(page),
      pages: Math.ceil(total / limit)
    }
  };
};

export const getJobById = async (jobId) => {
  const job = await Job.findById(jobId)
    .populate('client', 'name email')
    .populate('proposals.freelancer', 'name email');

  if (!job) {
    throw new ApiError(404, 'Job not found');
  }

  return job;
};

export const updateJobById = async (jobId, updates, userId, userRoles) => {
  const job = await Job.findById(jobId);
  if (!job) {
    throw new ApiError(404, 'Job not found');
  }

  const isAdmin = Array.isArray(userRoles) ? userRoles.includes('admin') : userRoles === 'admin';
  if (job.client.toString() !== userId && !isAdmin) {
    throw new ApiError(403, 'Not authorized to update this job');
  }

  Object.keys(updates).forEach(key => {
    if (key !== 'client' && key !== '_id') {
      job[key] = updates[key];
    }
  });

  await job.save();
  return job;
};

export const deleteJobById = async (jobId, userId, userRoles) => {
  const job = await Job.findById(jobId);
  if (!job) {
    throw new ApiError(404, 'Job not found');
  }

  const isAdmin = Array.isArray(userRoles) ? userRoles.includes('admin') : userRoles === 'admin';
  if (job.client.toString() !== userId && !isAdmin) {
    throw new ApiError(403, 'Not authorized to delete this job');
  }

  await job.remove();
  return true;
};

export const submitJobApplication = async (jobId, userId, applicationData) => {
  const job = await Job.findById(jobId);
  if (!job) {
    throw new ApiError(404, 'Job not found');
  }

  if (job.client.toString() === userId) {
    throw new ApiError(400, 'Cannot apply to your own job');
  }

  const existingApplication = job.proposals.find(
    p => p.freelancer.toString() === userId
  );
  if (existingApplication) {
    throw new ApiError(400, 'Already applied to this job');
  }

  job.proposals.push({
    freelancer: userId,
    ...applicationData,
    status: 'pending',
    submittedAt: new Date()
  });

  await job.save();
  return job.proposals[job.proposals.length - 1];
};

export const getApplicants = async (jobId, userId, { page = 1, limit = 10, status }) => {
  const job = await Job.findById(jobId)
    .populate('proposals.freelancer', 'name email profile')
    .select('proposals');

  if (!job) {
    throw new ApiError(404, 'Job not found');
  }

  let proposals = job.proposals;
  if (status) {
    proposals = proposals.filter(p => p.status === status);
  }

  const start = (page - 1) * limit;
  const paginatedProposals = proposals.slice(start, start + limit);

  return {
    applicants: paginatedProposals,
    pagination: {
      total: proposals.length,
      page: parseInt(page),
      pages: Math.ceil(proposals.length / limit)
    }
  };
};

export const searchJobs = async (searchParams) => {
  const {
    q,
    skills,
    type,
    budget,
    experience,
    page = 1,
    limit = 10,
    sort = 'latest'
  } = searchParams;

  const query = { status: 'open' };

  if (q) {
    query.$or = [
      { title: { $regex: q, $options: 'i' } },
      { description: { $regex: q, $options: 'i' } }
    ];
  }

  if (skills?.length) {
    query.skills = { $in: skills };
  }

  if (type) {
    query.type = type;
  }

  if (budget) {
    query['budget.min'] = { $gte: budget.min };
    if (budget.max) {
      query['budget.max'] = { $lte: budget.max };
    }
  }

  if (experience) {
    query.experienceLevel = experience;
  }

  const sortOptions = {
    latest: { createdAt: -1 },
    budget: { 'budget.min': -1 },
    deadline: { 'timeline.deadline': 1 }
  };

  const jobs = await Job.find(query)
    .sort(sortOptions[sort])
    .skip((page - 1) * limit)
    .limit(parseInt(limit))
    .populate('client', 'name email')
    .lean();

  const total = await Job.countDocuments(query);

  return {
    jobs,
    pagination: {
      total,
      page: parseInt(page),
      pages: Math.ceil(total / limit)
    }
  };
};

export const getRecommendedJobs = async (userId, { page = 1, limit = 10 }) => {
  // Implement recommendation logic here
  const jobs = await Job.find({ status: 'open' })
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(parseInt(limit))
    .populate('client', 'name email')
    .lean();

  const total = await Job.countDocuments({ status: 'open' });

  return {
    jobs,
    pagination: {
      total,
      page: parseInt(page),
      pages: Math.ceil(total / limit)
    }
  };
};

export const getJobStats = async (timeframe = 'month') => {
  const query = {};
  // Add timeframe filtering logic here

  const stats = await Job.aggregate([
    { $match: query },
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 },
        totalBudget: { $sum: '$budget.min' }
      }
    }
  ]);

  return stats;
};

export const getFreelancerJobs = async (userId, { status, page = 1, limit = 10 }) => {
  const query = {
    'proposals.freelancer': userId
  };

  if (status) {
    query['proposals.status'] = status;
  }

  const jobs = await Job.find(query)
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(parseInt(limit))
    .populate('client', 'name email')
    .lean();

  const total = await Job.countDocuments(query);

  return {
    jobs,
    pagination: {
      total,
      page: parseInt(page),
      pages: Math.ceil(total / limit)
    }
  };
};

export const getClientJobs = async (userId, { status, page = 1, limit = 10 }) => {
  try {
    if (!userId) {
      throw new ApiError(400, 'User ID is required');
    }

    const query = { client: userId };
    const validStatuses = ['draft', 'published', 'in_progress', 'completed', 'cancelled'];
    
    if (status && !validStatuses.includes(status)) {
      throw new ApiError(400, 'Invalid status value');
    }
    
    if (status) {
      query.status = status;
    }

    const options = {
      sort: { createdAt: -1 },
      skip: (page - 1) * limit,
      limit: parseInt(limit),
      populate: {
        path: 'proposals.freelancer',
        select: 'name email profile'
      }
    };

    const [jobs, total] = await Promise.all([
      Job.find(query).setOptions(options).lean().exec(),
      Job.countDocuments(query)
    ]);

    if (!Array.isArray(jobs)) {
      throw new ApiError(500, 'Invalid response from database');
    }

    // Validate each job has required fields
    const validatedJobs = jobs.map(job => {
      if (!job.title || !job.description || !job.budget || !job.requirements) {
        logger.warn('Found job with missing required fields:', { jobId: job._id });
      }
      return job;
    });

    return {
      jobs: validatedJobs,
      pagination: {
        total,
        page: parseInt(page),
        pages: Math.ceil(total / limit)
      }
    };
  } catch (error) {
    logger.error('Error in getClientJobs:', {
      error: error.message,
      stack: error.stack,
      userId
    });
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError(500, 'Failed to fetch client jobs');
  }
};
