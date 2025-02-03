import Job from '../models/Job.js';
import { io } from '../index.js';

// Create a new milestone for a job
export const createMilestone = async (req, res) => {
  try {
    const { title, description, amount, dueDate, deliverables } = req.body;
    const jobId = req.params.jobId;

    const job = await Job.findById(jobId);
    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }

    // Only client can create milestones
    if (job.client.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to create milestones' });
    }

    const milestone = {
      title,
      description,
      amount,
      dueDate: new Date(dueDate),
      deliverables: deliverables || []
    };

    job.milestones.push(milestone);
    await job.save();

    // Notify freelancer about new milestone
    const freelancerId = job.proposals.find(p => p.status === 'accepted')?.freelancer;
    if (freelancerId) {
      io.to(freelancerId.toString()).emit('newMilestone', {
        jobId: job._id,
        milestone: milestone
      });
    }

    res.status(201).json({
      message: 'Milestone created successfully',
      milestone: job.milestones[job.milestones.length - 1]
    });
  } catch (error) {
    console.error('Create milestone error:', error);
    res.status(500).json({
      message: 'Failed to create milestone',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Update milestone status and progress
export const updateMilestoneStatus = async (req, res) => {
  try {
    const { status, completedDeliverables } = req.body;
    const { jobId, milestoneId } = req.params;

    const job = await Job.findById(jobId);
    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }

    const milestone = job.milestones.id(milestoneId);
    if (!milestone) {
      return res.status(404).json({ message: 'Milestone not found' });
    }

    // Validate status transition
    const validTransitions = {
      pending: ['in-progress'],
      'in-progress': ['completed', 'cancelled'],
      completed: [],
      cancelled: []
    };

    if (!validTransitions[milestone.status].includes(status)) {
      return res.status(400).json({ 
        message: `Cannot transition from ${milestone.status} to ${status}` 
      });
    }

    milestone.status = status;

    // Update deliverables completion status
    if (completedDeliverables) {
      completedDeliverables.forEach(id => {
        const deliverable = milestone.deliverables.id(id);
        if (deliverable) {
          deliverable.isCompleted = true;
        }
      });
    }

    // Set completion date if milestone is completed
    if (status === 'completed') {
      milestone.completedAt = new Date();
    }

    await job.save();

    // Notify relevant parties
    const notificationRecipient = req.user.id === job.client.toString() 
      ? job.proposals.find(p => p.status === 'accepted')?.freelancer
      : job.client;

    if (notificationRecipient) {
      io.to(notificationRecipient.toString()).emit('milestoneUpdated', {
        jobId: job._id,
        milestoneId: milestone._id,
        status: status
      });
    }

    res.json({
      message: 'Milestone updated successfully',
      milestone: milestone
    });
  } catch (error) {
    console.error('Update milestone error:', error);
    res.status(500).json({
      message: 'Failed to update milestone',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Submit milestone deliverables
export const submitMilestoneDeliverables = async (req, res) => {
  try {
    const { description, files } = req.body;
    const { jobId, milestoneId } = req.params;

    const job = await Job.findById(jobId);
    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }

    const milestone = job.milestones.id(milestoneId);
    if (!milestone) {
      return res.status(404).json({ message: 'Milestone not found' });
    }

    // Only freelancer can submit deliverables
    const freelancerId = job.proposals.find(p => p.status === 'accepted')?.freelancer;
    if (freelancerId?.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to submit deliverables' });
    }

    milestone.submissions.push({
      description,
      files,
      submittedAt: new Date()
    });

    await job.save();

    // Notify client about submission
    io.to(job.client.toString()).emit('milestoneSubmission', {
      jobId: job._id,
      milestoneId: milestone._id
    });

    res.json({
      message: 'Deliverables submitted successfully',
      submission: milestone.submissions[milestone.submissions.length - 1]
    });
  } catch (error) {
    console.error('Submit deliverables error:', error);
    res.status(500).json({
      message: 'Failed to submit deliverables',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Review milestone submission
export const reviewMilestoneSubmission = async (req, res) => {
  try {
    const { status, feedback } = req.body;
    const { jobId, milestoneId, submissionId } = req.params;

    const job = await Job.findById(jobId);
    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }

    const milestone = job.milestones.id(milestoneId);
    if (!milestone) {
      return res.status(404).json({ message: 'Milestone not found' });
    }

    const submission = milestone.submissions.id(submissionId);
    if (!submission) {
      return res.status(404).json({ message: 'Submission not found' });
    }

    // Only client can review submissions
    if (job.client.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to review submissions' });
    }

    submission.status = status;
    submission.feedback = feedback;

    // If submission is approved, mark milestone as completed
    if (status === 'approved') {
      milestone.status = 'completed';
      milestone.completedAt = new Date();
    }

    await job.save();

    // Notify freelancer about review
    const freelancerId = job.proposals.find(p => p.status === 'accepted')?.freelancer;
    if (freelancerId) {
      io.to(freelancerId.toString()).emit('submissionReviewed', {
        jobId: job._id,
        milestoneId: milestone._id,
        submissionId: submission._id,
        status: status
      });
    }

    res.json({
      message: 'Submission reviewed successfully',
      submission: submission
    });
  } catch (error) {
    console.error('Review submission error:', error);
    res.status(500).json({
      message: 'Failed to review submission',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Get milestone details
export const getMilestone = async (req, res) => {
  try {
    const { jobId, milestoneId } = req.params;

    const job = await Job.findById(jobId);
    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }

    const milestone = job.milestones.id(milestoneId);
    if (!milestone) {
      return res.status(404).json({ message: 'Milestone not found' });
    }

    res.json(milestone);
  } catch (error) {
    console.error('Get milestone error:', error);
    res.status(500).json({
      message: 'Failed to fetch milestone',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};
