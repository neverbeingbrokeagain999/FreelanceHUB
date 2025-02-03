import TimeEntry from '../models/TimeEntry.js';

export const startTimer = async (req, res) => {
  try {
    const { jobId } = req.body;
    const userId = req.user.userId;

    const timeEntry = new TimeEntry({
      user: userId,
      job: jobId,
      startTime: Date.now()
    });

    await timeEntry.save();
    res.status(201).json({ message: 'Timer started successfully', timeEntry });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const stopTimer = async (req, res) => {
  try {
    const { timeEntryId } = req.body;
    const timeEntry = await TimeEntry.findById(timeEntryId);
    if (!timeEntry) {
      return res.status(404).json({ message: 'Time entry not found' });
    }

    timeEntry.endTime = Date.now();
    timeEntry.duration = (timeEntry.endTime - timeEntry.startTime) / (1000 * 60 * 60); // Duration in hours
    await timeEntry.save();
    res.json({ message: 'Timer stopped successfully', timeEntry });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const getTimerEntries = async (req, res) => {
  try {
    const userId = req.user.userId;
    const jobId = req.params.jobId;
    const timeEntries = await TimeEntry.find({ user: userId, job: jobId });
    res.json(timeEntries);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
