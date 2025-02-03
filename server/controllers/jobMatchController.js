import AIMatchingService from '../services/aiMatchingService.js';
import JobMatch from '../models/JobMatch.js';
import Job from '../models/Job.js';

// Match freelancers for a job
export const matchFreelancers = async (req, res) => {
  try {
    const { jobId } = req.params;

    // Check if job exists
    const job = await Job.findById(jobId);
    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }

    // Check if user is authorized (job owner or admin)
    if (job.client.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to view matches' });
    }

    const jobMatch = await AIMatchingService.matchJobWithFreelancers(jobId);

    res.json({
      message: 'Matching completed successfully',
      matches: jobMatch.getTopMatches(10), // Get top 10 matches by default
      metadata: jobMatch.metadata
    });
  } catch (error) {
    console.error('Match freelancers error:', error);
    res.status(500).json({
      message: 'Failed to match freelancers',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Get recommended jobs for a freelancer
export const getRecommendedJobs = async (req, res) => {
  try {
    const userId = req.user.id;
    const { limit = 10 } = req.query;

    const recommendations = await AIMatchingService.getRecommendedJobs(
      userId,
      parseInt(limit)
    );

    res.json({
      message: 'Job recommendations retrieved successfully',
      recommendations
    });
  } catch (error) {
    console.error('Get recommended jobs error:', error);
    res.status(500).json({
      message: 'Failed to get job recommendations',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Get match details for a specific job-freelancer pair
export const getMatchDetails = async (req, res) => {
  try {
    const { jobId, freelancerId } = req.params;

    const jobMatch = await JobMatch.findOne({ job: jobId });
    if (!jobMatch) {
      return res.status(404).json({ message: 'No match data found' });
    }

    const matchScore = jobMatch.matchScores.find(
      score => score.freelancer.toString() === freelancerId
    );

    if (!matchScore) {
      return res.status(404).json({ message: 'No match found for this freelancer' });
    }

    res.json({
      message: 'Match details retrieved successfully',
      matchDetails: matchScore
    });
  } catch (error) {
    console.error('Get match details error:', error);
    res.status(500).json({
      message: 'Failed to get match details',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Get market analysis for a job category
export const getMarketAnalysis = async (req, res) => {
  try {
    const { category } = req.params;
    
    const analysis = await AIMatchingService.analyzeMarketTrends(category);
    if (!analysis) {
      return res.status(404).json({ 
        message: 'Insufficient data for market analysis' 
      });
    }

    res.json({
      message: 'Market analysis retrieved successfully',
      analysis
    });
  } catch (error) {
    console.error('Get market analysis error:', error);
    res.status(500).json({
      message: 'Failed to get market analysis',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Get recommended hourly rate for a job
export const getRecommendedRate = async (req, res) => {
  try {
    const { description, skills } = req.body;

    if (!description || !skills || !skills.length) {
      return res.status(400).json({ 
        message: 'Job description and skills are required' 
      });
    }

    const rateRecommendation = await AIMatchingService.getRecommendedRate(
      description,
      skills
    );

    if (!rateRecommendation) {
      return res.status(404).json({ 
        message: 'Insufficient data for rate recommendation' 
      });
    }

    res.json({
      message: 'Rate recommendation retrieved successfully',
      recommendation: rateRecommendation
    });
  } catch (error) {
    console.error('Get recommended rate error:', error);
    res.status(500).json({
      message: 'Failed to get rate recommendation',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Update match scores for a job
export const updateJobMatches = async (req, res) => {
  try {
    const { jobId } = req.params;

    // Verify authorization
    const job = await Job.findById(jobId);
    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }

    if (job.client.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to update matches' });
    }

    const updatedMatch = await AIMatchingService.matchJobWithFreelancers(jobId);

    res.json({
      message: 'Match scores updated successfully',
      matches: updatedMatch.getTopMatches(10),
      metadata: updatedMatch.metadata
    });
  } catch (error) {
    console.error('Update job matches error:', error);
    res.status(500).json({
      message: 'Failed to update match scores',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Get job match statistics
export const getJobMatchStats = async (req, res) => {
  try {
    const { jobId } = req.params;

    const jobMatch = await JobMatch.findOne({ job: jobId })
      .populate('matchScores.freelancer', 'name');

    if (!jobMatch) {
      return res.status(404).json({ message: 'No match data found' });
    }

    // Calculate statistics
    const scores = jobMatch.matchScores.map(m => m.score);
    const stats = {
      totalCandidates: scores.length,
      averageScore: scores.reduce((a, b) => a + b, 0) / scores.length,
      highestScore: Math.max(...scores),
      lowestScore: Math.min(...scores),
      topMatches: jobMatch.getTopMatches(5),
      distribution: {
        excellent: scores.filter(s => s >= 90).length,
        good: scores.filter(s => s >= 70 && s < 90).length,
        fair: scores.filter(s => s >= 50 && s < 70).length,
        poor: scores.filter(s => s < 50).length
      }
    };

    res.json({
      message: 'Match statistics retrieved successfully',
      stats
    });
  } catch (error) {
    console.error('Get job match stats error:', error);
    res.status(500).json({
      message: 'Failed to get match statistics',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};
