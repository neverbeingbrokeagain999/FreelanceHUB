import mongoose from 'mongoose';

const skillWeightSchema = new mongoose.Schema({
  skill: {
    type: String,
    required: true
  },
  weight: {
    type: Number,
    required: true,
    min: 0,
    max: 1
  },
  matchCount: {
    type: Number,
    default: 0
  }
});

const jobMatchSchema = new mongoose.Schema({
  job: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Job',
    required: true
  },
  matchScores: [{
    freelancer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    score: {
      type: Number,
      required: true,
      min: 0,
      max: 100
    },
    factors: {
      skillMatch: {
        score: Number,
        matchedSkills: [String]
      },
      experienceMatch: {
        score: Number,
        relevantExperience: Number // in months
      },
      ratingMatch: {
        score: Number,
        averageRating: Number
      },
      successRate: {
        score: Number,
        rate: Number
      },
      priceMatch: {
        score: Number,
        deviation: Number // percentage from budget
      }
    },
    lastUpdated: {
      type: Date,
      default: Date.now
    }
  }],
  relevantSkills: [skillWeightSchema],
  recommendedRate: {
    min: Number,
    max: Number,
    confidence: Number
  },
  marketAnalysis: {
    demandLevel: {
      type: String,
      enum: ['low', 'medium', 'high']
    },
    competitionLevel: {
      type: String,
      enum: ['low', 'medium', 'high']
    },
    averageTimeToHire: Number, // in days
    successRate: Number
  },
  metadata: {
    lastCalculated: Date,
    version: String,
    modelUsed: String
  }
}, {
  timestamps: true
});

// Index for efficient querying
jobMatchSchema.index({ job: 1 });
jobMatchSchema.index({ 'matchScores.freelancer': 1 });
jobMatchSchema.index({ 'matchScores.score': -1 });

// Method to get top matches
jobMatchSchema.methods.getTopMatches = function(limit = 10) {
  return this.matchScores
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
};

// Method to get match score for a specific freelancer
jobMatchSchema.methods.getFreelancerScore = function(freelancerId) {
  const match = this.matchScores.find(
    s => s.freelancer.toString() === freelancerId.toString()
  );
  return match ? match.score : 0;
};

// Method to update skill weights based on successful hires
jobMatchSchema.methods.updateSkillWeights = async function(hiredFreelancerId) {
  const hiredMatch = this.matchScores.find(
    s => s.freelancer.toString() === hiredFreelancerId.toString()
  );

  if (!hiredMatch) return;

  // Increase weights for skills that contributed to successful match
  this.relevantSkills.forEach(skill => {
    if (hiredMatch.factors.skillMatch.matchedSkills.includes(skill.skill)) {
      skill.weight = Math.min(1, skill.weight * 1.1); // Increase by 10%
      skill.matchCount += 1;
    }
  });

  await this.save();
};

// Static method to analyze market trends
jobMatchSchema.statics.analyzeMarketTrends = async function(category) {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const matches = await this.find({
    'job.category': category,
    createdAt: { $gte: thirtyDaysAgo }
  }).populate('job');

  if (matches.length === 0) {
    return null;
  }

  const totalJobs = matches.length;
  const filledJobs = matches.filter(m => m.job.status === 'completed').length;
  const avgTimeToHire = matches.reduce((sum, m) => {
    if (m.job.startDate && m.job.createdAt) {
      return sum + (m.job.startDate - m.job.createdAt) / (1000 * 60 * 60 * 24);
    }
    return sum;
  }, 0) / filledJobs;

  return {
    totalJobs,
    filledJobs,
    successRate: (filledJobs / totalJobs) * 100,
    averageTimeToHire: avgTimeToHire,
    demandLevel: totalJobs > 20 ? 'high' : totalJobs > 10 ? 'medium' : 'low',
    competitionLevel: this._calculateCompetitionLevel(matches)
  };
};

// Helper method to calculate competition level
jobMatchSchema.statics._calculateCompetitionLevel = function(matches) {
  const avgProposals = matches.reduce((sum, m) => sum + m.matchScores.length, 0) / matches.length;
  if (avgProposals > 15) return 'high';
  if (avgProposals > 7) return 'medium';
  return 'low';
};

const JobMatch = mongoose.model('JobMatch', jobMatchSchema);

export default JobMatch;
