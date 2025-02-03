import natural from 'natural';
import stringSimilarity from 'string-similarity';
import JobMatch from '../models/JobMatch.js';
import User from '../models/User.js';
import Job from '../models/Job.js';

const tokenizer = new natural.WordTokenizer();
const TfIdf = natural.TfIdf;

class AIMatchingService {
  // Calculate similarity between two skill sets
  static calculateSkillMatch(jobSkills, freelancerSkills) {
    if (!jobSkills.length || !freelancerSkills.length) return 0;

    const matches = jobSkills.map(jobSkill => {
      const similarities = freelancerSkills.map(freelancerSkill =>
        stringSimilarity.compareTwoStrings(
          jobSkill.toLowerCase(),
          freelancerSkill.toLowerCase()
        )
      );
      return Math.max(...similarities);
    });

    return (matches.reduce((sum, score) => sum + score, 0) / jobSkills.length) * 100;
  }

  // Calculate relevance score based on job description and freelancer profile
  static calculateRelevanceScore(jobDescription, freelancerProfile) {
    const tfidf = new TfIdf();

    // Add job description
    tfidf.addDocument(jobDescription);

    // Add freelancer's relevant text
    const freelancerText = `${freelancerProfile.bio || ''} ${freelancerProfile.description || ''} ${freelancerProfile.skills.join(' ')}`;
    tfidf.addDocument(freelancerText);

    // Calculate similarity
    const terms = tokenizer.tokenize(jobDescription);
    let totalMeasure = 0;

    terms.forEach(term => {
      const measure = tfidf.tfidf(term, 1); // Check term's importance in freelancer's document
      totalMeasure += measure;
    });

    return (totalMeasure / terms.length) * 100;
  }

  // Calculate experience match score
  static calculateExperienceMatch(requiredExperience, actualExperience) {
    if (!requiredExperience) return 100;
    if (!actualExperience) return 0;

    const match = (actualExperience / requiredExperience) * 100;
    return Math.min(100, match); // Cap at 100%
  }

  // Calculate price match score
  static calculatePriceMatch(budget, rate) {
    if (!budget || !rate) return 100;

    const deviation = Math.abs(budget - rate) / budget;
    return Math.max(0, 100 - (deviation * 100));
  }

  // Calculate success rate score
  static calculateSuccessScore(completedJobs, totalJobs) {
    if (!totalJobs) return 0;
    return (completedJobs / totalJobs) * 100;
  }

  // Main matching function
  static async matchJobWithFreelancers(jobId) {
    try {
      const job = await Job.findById(jobId);
      if (!job) throw new Error('Job not found');

      // Find freelancers with relevant skills
      const freelancers = await User.find({
        role: 'freelancer',
        'skills': { $in: job.requiredSkills }
      });

      const matchScores = await Promise.all(freelancers.map(async (freelancer) => {
        // Calculate various match factors
        const skillMatchScore = this.calculateSkillMatch(
          job.requiredSkills,
          freelancer.skills
        );

        const relevanceScore = this.calculateRelevanceScore(
          job.description,
          freelancer
        );

        const experienceScore = this.calculateExperienceMatch(
          job.requiredExperience,
          freelancer.yearsOfExperience
        );

        const priceScore = this.calculatePriceMatch(
          job.budget,
          freelancer.hourlyRate
        );

        // Get freelancer's job history
        const completedJobs = await Job.countDocuments({
          'proposals.freelancer': freelancer._id,
          'proposals.status': 'completed'
        });

        const totalJobs = await Job.countDocuments({
          'proposals.freelancer': freelancer._id
        });

        const successScore = this.calculateSuccessScore(completedJobs, totalJobs);

        // Calculate weighted total score
        const weights = {
          skillMatch: 0.35,
          relevance: 0.25,
          experience: 0.15,
          price: 0.15,
          success: 0.10
        };

        const totalScore = (
          skillMatchScore * weights.skillMatch +
          relevanceScore * weights.relevance +
          experienceScore * weights.experience +
          priceScore * weights.price +
          successScore * weights.success
        );

        return {
          freelancer: freelancer._id,
          score: Math.round(totalScore),
          factors: {
            skillMatch: {
              score: Math.round(skillMatchScore),
              matchedSkills: job.requiredSkills.filter(skill =>
                freelancer.skills.includes(skill)
              )
            },
            experienceMatch: {
              score: Math.round(experienceScore),
              relevantExperience: freelancer.yearsOfExperience * 12 // convert to months
            },
            ratingMatch: {
              score: Math.round(freelancer.averageRating * 20), // convert 5-star to 100-point scale
              averageRating: freelancer.averageRating
            },
            successRate: {
              score: Math.round(successScore),
              rate: totalJobs ? (completedJobs / totalJobs) : 0
            },
            priceMatch: {
              score: Math.round(priceScore),
              deviation: job.budget ? Math.abs(job.budget - freelancer.hourlyRate) / job.budget : 0
            }
          },
          lastUpdated: new Date()
        };
      }));

      // Update or create JobMatch document
      const jobMatch = await JobMatch.findOneAndUpdate(
        { job: jobId },
        {
          job: jobId,
          matchScores,
          metadata: {
            lastCalculated: new Date(),
            version: '1.0',
            modelUsed: 'skill-based-matching'
          }
        },
        { upsert: true, new: true }
      );

      return jobMatch;
    } catch (error) {
      console.error('Job matching error:', error);
      throw error;
    }
  }

  // Get recommended jobs for a freelancer
  static async getRecommendedJobs(freelancerId, limit = 10) {
    try {
      const freelancer = await User.findById(freelancerId);
      if (!freelancer) throw new Error('Freelancer not found');

      // Find jobs with matching skills
      const jobs = await Job.find({
        status: 'open',
        requiredSkills: { $in: freelancer.skills }
      }).limit(limit * 2); // Get extra to filter down

      const jobScores = await Promise.all(jobs.map(async (job) => {
        const skillMatchScore = this.calculateSkillMatch(
          job.requiredSkills,
          freelancer.skills
        );

        const relevanceScore = this.calculateRelevanceScore(
          job.description,
          freelancer
        );

        const priceScore = this.calculatePriceMatch(
          job.budget,
          freelancer.hourlyRate
        );

        const totalScore = (
          skillMatchScore * 0.4 +
          relevanceScore * 0.4 +
          priceScore * 0.2
        );

        return {
          job,
          score: totalScore
        };
      }));

      // Return top matches
      return jobScores
        .sort((a, b) => b.score - a.score)
        .slice(0, limit)
        .map(({ job, score }) => ({
          job,
          matchScore: Math.round(score)
        }));
    } catch (error) {
      console.error('Get recommended jobs error:', error);
      throw error;
    }
  }

  // Analyze market trends for a job category
  static async analyzeMarketTrends(category) {
    try {
      return await JobMatch.analyzeMarketTrends(category);
    } catch (error) {
      console.error('Market trend analysis error:', error);
      throw error;
    }
  }

  // Get recommended hourly rate range
  static async getRecommendedRate(jobDescription, skills) {
    try {
      // Find similar jobs
      const similarJobs = await Job.find({
        requiredSkills: { $in: skills },
        status: 'completed'
      }).sort({ completedAt: -1 }).limit(20);

      if (similarJobs.length === 0) {
        return null;
      }

      // Calculate similarity scores
      const jobScores = similarJobs.map(job => ({
        job,
        similarity: stringSimilarity.compareTwoStrings(
          job.description.toLowerCase(),
          jobDescription.toLowerCase()
        )
      }));

      // Get weighted average of rates from similar jobs
      const totalWeight = jobScores.reduce((sum, { similarity }) => sum + similarity, 0);
      const weightedSum = jobScores.reduce((sum, { job, similarity }) => {
        return sum + (job.budget * similarity);
      }, 0);

      const averageRate = weightedSum / totalWeight;

      // Calculate range
      const rates = similarJobs.map(job => job.budget);
      const stdDev = Math.sqrt(
        rates.reduce((sum, rate) => sum + Math.pow(rate - averageRate, 2), 0) / rates.length
      );

      return {
        min: Math.max(0, Math.round(averageRate - stdDev)),
        max: Math.round(averageRate + stdDev),
        confidence: Math.min(1, similarJobs.length / 20) // 0-1 based on sample size
      };
    } catch (error) {
      console.error('Rate recommendation error:', error);
      throw error;
    }
  }
}

export default AIMatchingService;
