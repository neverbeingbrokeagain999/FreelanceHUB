import WorkDiary from '../models/WorkDiary.js';
import Job from '../models/Job.js';
import { io } from '../index.js';

// Start tracking time for a job
export const startTimeTracking = async (req, res) => {
  try {
    const { jobId, activity } = req.body;
    const freelancerId = req.user.id;

    // Verify job exists and freelancer is assigned
    const job = await Job.findById(jobId);
    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }

    const isAssigned = job.proposals.some(
      p => p.freelancer.toString() === freelancerId && p.status === 'accepted'
    );

    if (!isAssigned) {
      return res.status(403).json({ message: 'Not authorized to track time for this job' });
    }

    // Get or create today's work diary
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let workDiary = await WorkDiary.findOne({
      job: jobId,
      freelancer: freelancerId,
      date: today
    });

    if (!workDiary) {
      workDiary = new WorkDiary({
        job: jobId,
        freelancer: freelancerId,
        date: today
      });
    }

    // Create new time block
    const timeBlock = {
      startTime: new Date(),
      endTime: new Date(), // Will be updated when tracking stops
      activity,
      screenshots: []
    };

    workDiary.timeBlocks.push(timeBlock);
    await workDiary.save();

    res.json({
      message: 'Time tracking started',
      timeBlockId: workDiary.timeBlocks[workDiary.timeBlocks.length - 1]._id
    });
  } catch (error) {
    console.error('Start time tracking error:', error);
    res.status(500).json({
      message: 'Failed to start time tracking',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Stop tracking time
export const stopTimeTracking = async (req, res) => {
  try {
    const { jobId, timeBlockId } = req.params;
    const freelancerId = req.user.id;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const workDiary = await WorkDiary.findOne({
      job: jobId,
      freelancer: freelancerId,
      date: today
    });

    if (!workDiary) {
      return res.status(404).json({ message: 'Work diary not found' });
    }

    const timeBlock = workDiary.timeBlocks.id(timeBlockId);
    if (!timeBlock) {
      return res.status(404).json({ message: 'Time block not found' });
    }

    timeBlock.endTime = new Date();
    await workDiary.save();

    res.json({
      message: 'Time tracking stopped',
      duration: (timeBlock.endTime - timeBlock.startTime) / (1000 * 60) // duration in minutes
    });
  } catch (error) {
    console.error('Stop time tracking error:', error);
    res.status(500).json({
      message: 'Failed to stop time tracking',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Add screenshot to current time block
export const addScreenshot = async (req, res) => {
  try {
    const { jobId, timeBlockId } = req.params;
    const { url, activityLevel, keystrokes, mouseEvents, windowTitle, applicationName } = req.body;
    const freelancerId = req.user.id;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const workDiary = await WorkDiary.findOne({
      job: jobId,
      freelancer: freelancerId,
      date: today
    });

    if (!workDiary) {
      return res.status(404).json({ message: 'Work diary not found' });
    }

    const timeBlock = workDiary.timeBlocks.id(timeBlockId);
    if (!timeBlock) {
      return res.status(404).json({ message: 'Time block not found' });
    }

    timeBlock.screenshots.push({
      url,
      timestamp: new Date(),
      activityLevel,
      keystrokes,
      mouseEvents,
      windowTitle,
      applicationName
    });

    // Update time block activity level
    const recentScreenshots = timeBlock.screenshots.slice(-6); // Last 6 screenshots (1 hour)
    if (recentScreenshots.length > 0) {
      const avgActivityLevel = recentScreenshots.reduce((sum, ss) => sum + (ss.activityLevel || 0), 0) / recentScreenshots.length;
      timeBlock.activityLevel = avgActivityLevel;
    }

    await workDiary.save();

    res.json({
      message: 'Screenshot added successfully',
      screenshot: timeBlock.screenshots[timeBlock.screenshots.length - 1]
    });
  } catch (error) {
    console.error('Add screenshot error:', error);
    res.status(500).json({
      message: 'Failed to add screenshot',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Submit work diary for client review
export const submitWorkDiary = async (req, res) => {
  try {
    const { jobId, date } = req.params;
    const freelancerId = req.user.id;

    const workDiary = await WorkDiary.findOne({
      job: jobId,
      freelancer: freelancerId,
      date: new Date(date)
    });

    if (!workDiary) {
      return res.status(404).json({ message: 'Work diary not found' });
    }

    if (!workDiary.canSubmit()) {
      return res.status(400).json({ message: 'Work diary cannot be submitted' });
    }

    workDiary.status = 'submitted';
    await workDiary.save();

    // Notify client
    const job = await Job.findById(jobId);
    if (job) {
      io.to(job.client.toString()).emit('workDiarySubmitted', {
        jobId,
        freelancerId,
        date,
        hours: workDiary.billableHours
      });
    }

    res.json({
      message: 'Work diary submitted successfully',
      billableHours: workDiary.billableHours,
      totalHours: workDiary.totalHours
    });
  } catch (error) {
    console.error('Submit work diary error:', error);
    res.status(500).json({
      message: 'Failed to submit work diary',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Get work diary for a specific date
export const getWorkDiary = async (req, res) => {
  try {
    const { jobId, date } = req.params;
    const userId = req.user.id;

    const job = await Job.findById(jobId);
    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }

    // Check if user is authorized (either client or assigned freelancer)
    const isAuthorized = job.client.toString() === userId ||
      job.proposals.some(p => p.freelancer.toString() === userId && p.status === 'accepted');

    if (!isAuthorized) {
      return res.status(403).json({ message: 'Not authorized to view this work diary' });
    }

    const workDiary = await WorkDiary.findOne({
      job: jobId,
      date: new Date(date)
    }).populate('freelancer', 'name');

    if (!workDiary) {
      return res.json({
        message: 'No work diary found for this date',
        workDiary: null
      });
    }

    res.json(workDiary);
  } catch (error) {
    console.error('Get work diary error:', error);
    res.status(500).json({
      message: 'Failed to fetch work diary',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Get weekly summary
export const getWeeklySummary = async (req, res) => {
  try {
    const { freelancerId, startDate } = req.params;

    const summary = await WorkDiary.getWeeklySummary(freelancerId, new Date(startDate));
    const totalBillableHours = summary.reduce((total, day) => total + (day.billableHours || 0), 0);
    const averageActivityLevel = summary.reduce((total, day) => total + (day.avgActivityLevel || 0), 0) / summary.length;

    res.json({
      summary,
      totalBillableHours,
      averageActivityLevel: Math.round(averageActivityLevel)
    });
  } catch (error) {
    console.error('Get weekly summary error:', error);
    res.status(500).json({
      message: 'Failed to fetch weekly summary',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Review work diary (client only)
export const reviewWorkDiary = async (req, res) => {
  try {
    const { jobId, date } = req.params;
    const { status, comment } = req.body;
    const clientId = req.user.id;

    const job = await Job.findById(jobId);
    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }

    // Verify client
    if (job.client.toString() !== clientId) {
      return res.status(403).json({ message: 'Not authorized to review work diary' });
    }

    const workDiary = await WorkDiary.findOne({
      job: jobId,
      date: new Date(date)
    });

    if (!workDiary) {
      return res.status(404).json({ message: 'Work diary not found' });
    }

    workDiary.status = status;
    workDiary.clientFeedback = {
      comment,
      timestamp: new Date()
    };

    await workDiary.save();

    // Notify freelancer
    io.to(workDiary.freelancer.toString()).emit('workDiaryReviewed', {
      jobId,
      date,
      status,
      comment
    });

    res.json({
      message: 'Work diary reviewed successfully',
      status: workDiary.status
    });
  } catch (error) {
    console.error('Review work diary error:', error);
    res.status(500).json({
      message: 'Failed to review work diary',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};
