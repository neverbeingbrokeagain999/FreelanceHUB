import MLService from '../services/mlService.js';
import Job from '../models/Job.js';

// Extract topics from job description
export const extractTopics = async (req, res) => {
  try {
    const { text } = req.body;
    const numTopics = req.query.numTopics ? parseInt(req.query.numTopics) : 5;

    if (!text) {
      return res.status(400).json({ 
        message: 'Text content is required' 
      });
    }

    const topics = MLService.extractTopics(text, numTopics);
    res.json({
      message: 'Topics extracted successfully',
      topics
    });
  } catch (error) {
    console.error('Extract topics error:', error);
    res.status(500).json({
      message: 'Failed to extract topics',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Predict project success probability
export const predictSuccess = async (req, res) => {
  try {
    const { jobId, freelancerId } = req.params;

    const prediction = await MLService.predictProjectSuccess(jobId, freelancerId);
    if (!prediction) {
      return res.status(404).json({ 
        message: 'Could not generate prediction' 
      });
    }

    res.json({
      message: 'Success prediction generated',
      prediction
    });
  } catch (error) {
    console.error('Predict success error:', error);
    res.status(500).json({
      message: 'Failed to predict success',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Predict project duration
export const predictDuration = async (req, res) => {
  try {
    const { jobId } = req.params;
    
    const job = await Job.findById(jobId);
    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }

    const prediction = await MLService.predictProjectDuration(
      job.description,
      job.category
    );

    if (!prediction) {
      return res.status(404).json({ 
        message: 'Insufficient data for duration prediction' 
      });
    }

    res.json({
      message: 'Duration prediction generated',
      prediction
    });
  } catch (error) {
    console.error('Predict duration error:', error);
    res.status(500).json({
      message: 'Failed to predict duration',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Analyze job posting
export const analyzePosting = async (req, res) => {
  try {
    const { jobId } = req.params;

    const job = await Job.findById(jobId);
    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }

    const analysis = MLService.analyzeJobPosting(
      job.description,
      job.budget,
      job.requiredSkills
    );

    res.json({
      message: 'Job posting analysis completed',
      analysis
    });
  } catch (error) {
    console.error('Analyze posting error:', error);
    res.status(500).json({
      message: 'Failed to analyze job posting',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Calculate skill similarity
export const getSkillSimilarity = async (req, res) => {
  try {
    const { skill1, skill2 } = req.query;

    if (!skill1 || !skill2) {
      return res.status(400).json({ 
        message: 'Both skills are required' 
      });
    }

    const similarity = MLService.calculateSkillSimilarity(skill1, skill2);

    res.json({
      message: 'Skill similarity calculated',
      similarity
    });
  } catch (error) {
    console.error('Get skill similarity error:', error);
    res.status(500).json({
      message: 'Failed to calculate skill similarity',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Calculate experience score
export const getExperienceScore = async (req, res) => {
  try {
    const { actual, required } = req.query;

    if (!actual) {
      return res.status(400).json({ 
        message: 'Actual experience value is required' 
      });
    }

    const score = MLService.calculateExperienceScore(
      parseFloat(actual),
      required ? parseFloat(required) : undefined
    );

    res.json({
      message: 'Experience score calculated',
      score
    });
  } catch (error) {
    console.error('Get experience score error:', error);
    res.status(500).json({
      message: 'Failed to calculate experience score',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Bulk skill matching for a job
export const matchJobSkills = async (req, res) => {
  try {
    const { jobId } = req.params;
    const { skills } = req.body;

    if (!Array.isArray(skills)) {
      return res.status(400).json({ 
        message: 'Skills must be provided as an array' 
      });
    }

    const job = await Job.findById(jobId);
    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }

    const matchScore = MLService.calculateSkillMatchScore(
      job.requiredSkills,
      skills
    );

    res.json({
      message: 'Skill match score calculated',
      score: matchScore,
      details: {
        jobSkills: job.requiredSkills,
        providedSkills: skills,
        matchPercentage: matchScore * 100
      }
    });
  } catch (error) {
    console.error('Match job skills error:', error);
    res.status(500).json({
      message: 'Failed to calculate skill match',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};
