import natural from 'natural';
const { TfIdf } = natural;
import stringSimilarity from 'string-similarity';
import Job from '../models/Job.js';
import User from '../models/User.js';

class MLService {
  // Topic modeling for job categorization
  static extractTopics(text, numTopics = 5) {
    const tfidf = new TfIdf();
    const tokenizer = new natural.WordTokenizer();
    const stopwords = natural.stopwords;

    // Preprocess text
    const tokens = tokenizer.tokenize(text.toLowerCase())
      .filter(token => !stopwords.includes(token));

    // Add document
    tfidf.addDocument(tokens);

    // Get top terms as topics
    const topics = [];
    tfidf.listTerms(0).slice(0, numTopics).forEach(item => {
      topics.push({
        term: item.term,
        weight: item.tfidf
      });
    });

    return topics;
  }

  // Calculate skill similarity using word embeddings simulation
  static calculateSkillSimilarity(skill1, skill2) {
    const similarity = stringSimilarity.compareTwoStrings(
      skill1.toLowerCase(),
      skill2.toLowerCase()
    );

    // Apply non-linear transformation for better discrimination
    return Math.pow(similarity, 1.5);
  }

  // Predict project success probability
  static async predictProjectSuccess(jobId, freelancerId) {
    try {
      const [job, freelancer] = await Promise.all([
        Job.findById(jobId),
        User.findById(freelancerId)
      ]);

      if (!job || !freelancer) {
        throw new Error('Job or freelancer not found');
      }

      // Calculate various factors
      const skillMatch = this.calculateSkillMatchScore(
        job.requiredSkills,
        freelancer.skills
      );

      const experienceScore = this.calculateExperienceScore(
        freelancer.yearsOfExperience,
        job.requiredExperience
      );

      const completedJobs = await Job.countDocuments({
        'proposals.freelancer': freelancerId,
        'proposals.status': 'completed'
      });

      const totalJobs = await Job.countDocuments({
        'proposals.freelancer': freelancerId
      });

      const successRate = totalJobs > 0 ? (completedJobs / totalJobs) : 0;

      // Weighted probability calculation
      const weights = {
        skillMatch: 0.4,
        experience: 0.25,
        successRate: 0.35
      };

      const probability = (
        skillMatch * weights.skillMatch +
        experienceScore * weights.experience +
        successRate * weights.successRate
      );

      return {
        probability: Math.min(1, Math.max(0, probability)),
        factors: {
          skillMatch,
          experienceScore,
          successRate
        },
        confidence: this.calculateConfidenceScore(totalJobs)
      };
    } catch (error) {
      console.error('Predict project success error:', error);
      throw error;
    }
  }

  // Calculate skill match score
  static calculateSkillMatchScore(requiredSkills, freelancerSkills) {
    if (!requiredSkills.length || !freelancerSkills.length) return 0;

    let totalSimilarity = 0;
    let matches = 0;

    requiredSkills.forEach(required => {
      let maxSimilarity = 0;
      freelancerSkills.forEach(skill => {
        const similarity = this.calculateSkillSimilarity(required, skill);
        maxSimilarity = Math.max(maxSimilarity, similarity);
      });
      if (maxSimilarity > 0.8) matches++;
      totalSimilarity += maxSimilarity;
    });

    return (totalSimilarity / requiredSkills.length) * 
           (matches / requiredSkills.length);
  }

  // Calculate experience score
  static calculateExperienceScore(actual, required) {
    if (!required) return 0.8; // Default score if no requirement
    if (!actual) return 0.2; // Base score for no experience
    
    const ratio = actual / required;
    return Math.min(1, 0.2 + (ratio * 0.8)); // Scale from 0.2 to 1.0
  }

  // Calculate confidence score based on sample size
  static calculateConfidenceScore(sampleSize) {
    // Using a logistic function to map sample size to confidence
    const k = 0.1; // Steepness
    const x0 = 20; // Midpoint
    return 1 / (1 + Math.exp(-k * (sampleSize - x0)));
  }

  // Predict project duration
  static async predictProjectDuration(jobDescription, category) {
    try {
      // Get similar completed jobs
      const similarJobs = await Job.find({
        category,
        status: 'completed',
        completedAt: { $exists: true },
        startDate: { $exists: true }
      }).limit(50);

      if (similarJobs.length === 0) {
        return null;
      }

      // Calculate duration and similarity for each job
      const jobMetrics = similarJobs.map(job => {
        const duration = (job.completedAt - job.startDate) / (1000 * 60 * 60 * 24); // days
        const similarity = stringSimilarity.compareTwoStrings(
          job.description.toLowerCase(),
          jobDescription.toLowerCase()
        );
        return { duration, similarity };
      });

      // Calculate weighted average duration
      const totalWeight = jobMetrics.reduce((sum, job) => sum + job.similarity, 0);
      const weightedDuration = jobMetrics.reduce((sum, job) => 
        sum + (job.duration * job.similarity), 0) / totalWeight;

      // Calculate standard deviation for confidence interval
      const variance = jobMetrics.reduce((sum, job) => {
        const diff = job.duration - weightedDuration;
        return sum + (diff * diff * job.similarity);
      }, 0) / totalWeight;
      
      const stdDev = Math.sqrt(variance);

      return {
        estimated: Math.round(weightedDuration),
        range: {
          min: Math.max(1, Math.round(weightedDuration - stdDev)),
          max: Math.round(weightedDuration + stdDev)
        },
        confidence: this.calculateConfidenceScore(similarJobs.length)
      };
    } catch (error) {
      console.error('Predict project duration error:', error);
      throw error;
    }
  }

  // Detect potential issues in job postings
  static analyzeJobPosting(description, budget, requiredSkills) {
    const issues = [];
    const warnings = [];

    // Check description length
    if (description.length < 100) {
      issues.push('Description is too short. Detailed descriptions attract better proposals.');
    }

    // Check for unclear requirements
    const unclearPatterns = [
      'etc',
      'and so on',
      'similar to',
      'something like'
    ];
    
    if (unclearPatterns.some(pattern => description.toLowerCase().includes(pattern))) {
      warnings.push('Requirements may be unclear. Consider being more specific.');
    }

    // Check budget reasonability
    if (budget) {
      if (requiredSkills.length > 5 && budget < 500) {
        warnings.push('Budget may be low for the required skills.');
      }
    } else {
      warnings.push('Adding a budget range helps attract relevant proposals.');
    }

    // Check skill requirements
    if (requiredSkills.length === 0) {
      issues.push('No required skills specified.');
    } else if (requiredSkills.length > 10) {
      warnings.push('Large number of required skills may limit qualified candidates.');
    }

    return {
      score: 100 - (issues.length * 15) - (warnings.length * 5),
      issues,
      warnings
    };
  }
}

export default MLService;
