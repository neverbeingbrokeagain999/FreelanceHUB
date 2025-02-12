import cron from 'node-cron';
import logger from '../config/logger.js';
import EscrowService from '../services/escrowService.js';
import Escrow from '../models/Escrow.js';
import { sendNotification } from '../services/notificationService.js';

// Check and process auto-release for escrows every 6 hours
cron.schedule('0 */6 * * *', async () => {
  try {
    logger.info('Running escrow auto-release check');
    await EscrowService.checkAutoReleaseEscrows();
  } catch (error) {
    logger.error('Escrow auto-release cron error:', error);
  }
});

// Send reminders for pending escrow actions daily at 9 AM
cron.schedule('0 9 * * *', async () => {
  try {
    logger.info('Sending escrow reminder notifications');

    // Find escrows that need attention
    const escrows = await Escrow.find({
      $or: [
        {
          status: 'funded',
          'autoRelease.enabled': true,
          fundedAt: {
            $lt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000) // 10 days old
          }
        },
        {
          status: 'pending',
          createdAt: {
            $lt: new Date(Date.now() - 24 * 60 * 60 * 1000) // 24 hours old
          }
        }
      ]
    }).populate('clientId freelancerId jobId');

    for (const escrow of escrows) {
      // Remind clients about pending funding
      if (escrow.status === 'pending') {
        await sendNotification({
          userId: escrow.clientId._id,
          type: 'escrow_pending',
          title: 'Pending Escrow Funding',
          message: `You have a pending escrow payment for job "${escrow.jobId.title}". Please complete the funding to start the project.`,
          data: {
            escrowId: escrow._id,
            jobId: escrow.jobId._id
          }
        });
      }

      // Remind about upcoming auto-release
      if (escrow.status === 'funded' && escrow.autoRelease.enabled) {
        const daysHeld = (Date.now() - escrow.fundedAt) / (1000 * 60 * 60 * 24);
        const daysUntilRelease = escrow.autoRelease.conditions.timeThreshold - daysHeld;

        if (daysUntilRelease <= 3) { // 3 days before auto-release
          // Notify client
          await sendNotification({
            userId: escrow.clientId._id,
            type: 'escrow_auto_release_reminder',
            title: 'Upcoming Escrow Auto-Release',
            message: `Funds for job "${escrow.jobId.title}" will be auto-released in ${Math.ceil(daysUntilRelease)} days. Please review the work and take action if needed.`,
            data: {
              escrowId: escrow._id,
              jobId: escrow.jobId._id,
              daysUntilRelease: Math.ceil(daysUntilRelease)
            }
          });

          // Notify freelancer
          await sendNotification({
            userId: escrow.freelancerId._id,
            type: 'escrow_auto_release_reminder',
            title: 'Upcoming Escrow Auto-Release',
            message: `Funds for job "${escrow.jobId.title}" will be auto-released in ${Math.ceil(daysUntilRelease)} days.`,
            data: {
              escrowId: escrow._id,
              jobId: escrow.jobId._id,
              daysUntilRelease: Math.ceil(daysUntilRelease)
            }
          });
        }
      }
    }
  } catch (error) {
    logger.error('Escrow reminder cron error:', error);
  }
});

// Clean up expired escrows weekly
cron.schedule('0 0 * * 0', async () => {
  try {
    logger.info('Cleaning up expired escrows');

    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    
    // Find expired escrows
    const expiredEscrows = await Escrow.find({
      status: 'pending',
      expiryDate: { $lt: new Date() },
      createdAt: { $lt: thirtyDaysAgo }
    }).populate('clientId freelancerId jobId');

    for (const escrow of expiredEscrows) {
      // Notify participants
      await sendNotification({
        userId: escrow.clientId._id,
        type: 'escrow_expired',
        title: 'Escrow Expired',
        message: `The escrow for job "${escrow.jobId.title}" has expired due to inactivity.`,
        data: {
          escrowId: escrow._id,
          jobId: escrow.jobId._id
        }
      });

      await sendNotification({
        userId: escrow.freelancerId._id,
        type: 'escrow_expired',
        title: 'Escrow Expired',
        message: `The escrow for job "${escrow.jobId.title}" has expired due to inactivity.`,
        data: {
          escrowId: escrow._id,
          jobId: escrow.jobId._id
        }
      });

      // Archive the escrow
      escrow.status = 'expired';
      await escrow.save();
    }
  } catch (error) {
    logger.error('Escrow cleanup cron error:', error);
  }
});

// Generate daily escrow reports at midnight
cron.schedule('0 0 * * *', async () => {
  try {
    logger.info('Generating daily escrow report');

    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
    yesterday.setHours(0, 0, 0, 0);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Get escrow statistics
    const stats = await Escrow.aggregate([
      {
        $match: {
          createdAt: {
            $gte: yesterday,
            $lt: today
          }
        }
      },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          totalAmount: { $sum: '$amount' },
          totalFees: { $sum: '$feeAmount' }
        }
      }
    ]);

    // Log report
    logger.info('Daily Escrow Report:', {
      date: yesterday.toISOString().split('T')[0],
      statistics: stats
    });

  } catch (error) {
    logger.error('Escrow report generation error:', error);
  }
});

export default () => {
  logger.info('Escrow cron tasks initialized');
};
