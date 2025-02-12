import { errorResponse } from '../utils/errorHandler.js';
import { logger } from '../config/logger.js';
import {
  createNewJob,
  getJobList,
  getJobById,
  updateJobById,
  deleteJobById,
  submitJobApplication,
  getApplicants as getJobApplicants,
  searchJobs as searchJobList,
  getRecommendedJobs as getRecommendedJobList,
  getJobStats as getJobStatistics,
  getFreelancerJobs as getFreelancerJobList,
  getClientJobs as getClientJobList
} from '../services/jobService.js';

export const createJob = async (req, res) => {
  try {
    const job = await createNewJob(req.body, req.user.id);
    res.status(201).json({ success: true, job });
  } catch (error) {
    logger.error('Job creation error:', error);
    return errorResponse(res, error.statusCode || 500, error.message);
  }
};

export const getJobs = async (req, res) => {
  try {
    const result = await getJobList(req.query);
    res.json({ success: true, ...result });
  } catch (error) {
    logger.error('Get jobs error:', error);
    return errorResponse(res, 500, 'Error fetching jobs');
  }
};

export const getJob = async (req, res) => {
  try {
    const job = await getJobById(req.params.id);
    res.json({ success: true, job });
  } catch (error) {
    logger.error('Get job error:', error);
    return errorResponse(res, error.statusCode || 500, error.message);
  }
};

export const updateJob = async (req, res) => {
  try {
    const job = await updateJobById(req.params.id, req.body, req.user.id, req.user.roles);
    res.json({ success: true, job });
  } catch (error) {
    logger.error('Job update error:', error);
    return errorResponse(res, error.statusCode || 500, error.message);
  }
};

export const deleteJob = async (req, res) => {
  try {
    await deleteJobById(req.params.id, req.user.id, req.user.roles);
    res.json({ success: true, message: 'Job deleted successfully' });
  } catch (error) {
    logger.error('Job deletion error:', error);
    return errorResponse(res, error.statusCode || 500, error.message);
  }
};

export const applyToJob = async (req, res) => {
  try {
    const proposal = await submitJobApplication(req.params.id, req.user.id, req.body);
    res.status(201).json({ success: true, proposal });
  } catch (error) {
    logger.error('Job application error:', error);
    return errorResponse(res, error.statusCode || 500, error.message);
  }
};

export const getApplicants = async (req, res) => {
  try {
    const result = await getJobApplicants(req.params.id, req.user.id, req.query);
    res.json({ success: true, ...result });
  } catch (error) {
    logger.error('Get applicants error:', error);
    return errorResponse(res, error.statusCode || 500, error.message);
  }
};

export const searchJobs = async (req, res) => {
  try {
    const result = await searchJobList(req.query);
    res.json({ success: true, ...result });
  } catch (error) {
    logger.error('Search jobs error:', error);
    return errorResponse(res, error.statusCode || 500, error.message);
  }
};

export const getRecommendedJobs = async (req, res) => {
  try {
    const result = await getRecommendedJobList(req.user.id, req.query);
    res.json({ success: true, ...result });
  } catch (error) {
    logger.error('Get recommended jobs error:', error);
    return errorResponse(res, error.statusCode || 500, error.message);
  }
};

export const getJobStats = async (req, res) => {
  try {
    const stats = await getJobStatistics(req.query.timeframe);
    res.json({ success: true, stats });
  } catch (error) {
    logger.error('Get job stats error:', error);
    return errorResponse(res, error.statusCode || 500, error.message);
  }
};

export const getFreelancerJobs = async (req, res) => {
  try {
    const result = await getFreelancerJobList(req.user.id, req.query);
    res.json({ success: true, ...result });
  } catch (error) {
    logger.error('Get freelancer jobs error:', error);
    return errorResponse(res, error.statusCode || 500, error.message);
  }
};

export const getClientJobs = async (req, res) => {
  try {
    const result = await getClientJobList(req.user.id, req.query);
    res.json({ success: true, ...result });
  } catch (error) {
    logger.error('Get client jobs error:', {
      error: error.message,
      userId: req.user.id
    });
    return errorResponse(res, error.statusCode || 500, 'Error fetching client jobs');
  }
};
