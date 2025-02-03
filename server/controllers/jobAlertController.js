import JobAlert from '../models/JobAlert.js';
import Job from '../models/Job.js';

export const createJobAlert = async (req, res) => {
  try {
    const { keywords, categories, minBudget, maxBudget, location } = req.body;
    const user = req.user.userId;

    const jobAlert = new JobAlert({
      user,
      keywords,
      categories,
      minBudget,
      maxBudget,
      location
    });

    await jobAlert.save();
    res.status(201).json({ message: 'Job alert created successfully', jobAlert });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const updateJobAlert = async (req, res) => {
  try {
    const { keywords, categories, minBudget, maxBudget, location } = req.body;
    const user = req.user.userId;

    const jobAlert = await JobAlert.findOneAndUpdate(
      { user },
      { keywords, categories, minBudget, maxBudget, location },
      { new: true, upsert: true }
    );

    res.json({ message: 'Job alert updated successfully', jobAlert });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const deleteJobAlert = async (req, res) => {
  try {
    const user = req.user.userId;
    await JobAlert.findOneAndDelete({ user });
    res.json({ message: 'Job alert deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const getJobAlert = async (req, res) => {
  try {
    const user = req.user.userId;
    const jobAlert = await JobAlert.findOne({ user });
    res.json(jobAlert);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const findMatchingJobs = async (job) => {
  try {
    const alerts = await JobAlert.find();
    const matchingAlerts = alerts.filter(alert => {
      const keywordsMatch = alert.keywords.length === 0 || alert.keywords.some(keyword => job.description.toLowerCase().includes(keyword.toLowerCase()) || job.title.toLowerCase().includes(keyword.toLowerCase()));
      const categoriesMatch = alert.categories.length === 0 || alert.categories.includes(job.category);
      const budgetMatch = (!alert.minBudget || job.budget >= alert.minBudget) && (!alert.maxBudget || job.budget <= alert.maxBudget);
      return keywordsMatch && categoriesMatch && budgetMatch;
    });
    return matchingAlerts;
  } catch (error) {
    console.error('Error finding matching jobs:', error);
    return [];
  }
};

export const notifyMatchingUsers = (io, job, matchingAlerts) => {
  matchingAlerts.forEach(alert => {
    io.to(alert.user.toString()).emit('newMatchingJob', job);
  });
};
