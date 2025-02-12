import mongoose from 'mongoose';
import logger from '../config/logger.js';
import Escrow from '../models/Escrow.js';
import Transaction from '../models/Transaction.js';
import PaymentGateway from '../models/PaymentGateway.js';
import { calculateFees } from '../utils/feeCalculator.js';

class EscrowService {
  // Create new escrow
  static async createEscrow(jobId, clientId, freelancerId, amount, paymentGatewayId, paymentMethod) {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      // Calculate fees
      const fees = await calculateFees(amount, 'escrow');
      const totalAmount = amount + fees.total;

      // Create escrow record
      const escrow = await Escrow.create([{
        jobId,
        clientId,
        freelancerId,
        amount,
        feeAmount: fees.total,
        paymentGatewayId,
        paymentMethod,
        expiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
        releaseConditions: [{
          type: 'time',
          description: 'Auto-release after 14 days if no dispute',
          amount: totalAmount
        }]
      }], { session });

      // Create initial funding transaction
      const transaction = await Transaction.create([{
        transactionId: `ESC${Date.now()}`,
        sender: {
          user: clientId,
          type: 'client'
        },
        recipient: {
          user: freelancerId,
          type: 'freelancer'
        },
        job: jobId,
        escrow: escrow[0]._id,
        type: 'escrow_fund',
        subType: 'escrow_deposit',
        description: 'Escrow funding for job',
        amount: {
          value: amount,
          currency: 'USD'
        },
        fees: {
          platform: {
            value: fees.platform,
            currency: 'USD'
          },
          processing: {
            value: fees.processing,
            currency: 'USD'
          }
        },
        total: {
          value: totalAmount,
          currency: 'USD'
        },
        paymentMethod: {
          type: paymentMethod
        },
        status: 'pending'
      }], { session });

      await session.commitTransaction();
      return { escrow: escrow[0], transaction: transaction[0] };
    } catch (error) {
      await session.abortTransaction();
      logger.error('Create escrow error:', error);
      throw error;
    } finally {
      session.endSession();
    }
  }

  // Fund escrow
  static async fundEscrow(escrowId, transactionId) {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const escrow = await Escrow.findById(escrowId).session(session);
      if (!escrow) {
        throw new Error('Escrow not found');
      }

      const transaction = await Transaction.findOne({ transactionId }).session(session);
      if (!transaction) {
        throw new Error('Transaction not found');
      }

      // Fund escrow
      await escrow.fund(transaction._id);
      
      // Update transaction status
      await transaction.updateStatus('completed', 'Escrow funded successfully', transaction.sender.user);

      await session.commitTransaction();
      return { escrow, transaction };
    } catch (error) {
      await session.abortTransaction();
      logger.error('Fund escrow error:', error);
      throw error;
    } finally {
      session.endSession();
    }
  }

  // Release escrow funds
  static async releaseEscrow(escrowId, userId, amount = null, notes = '') {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const escrow = await Escrow.findById(escrowId).session(session);
      if (!escrow) {
        throw new Error('Escrow not found');
      }

      const releaseAmount = amount || escrow.amount;

      // Create release transaction
      const transaction = await Transaction.create([{
        transactionId: `REL${Date.now()}`,
        sender: {
          user: escrow.clientId,
          type: 'client'
        },
        recipient: {
          user: escrow.freelancerId,
          type: 'freelancer'
        },
        job: escrow.jobId,
        escrow: escrow._id,
        type: 'escrow_release',
        subType: 'escrow_disbursement',
        description: 'Release of escrow funds',
        amount: {
          value: releaseAmount,
          currency: 'USD'
        },
        total: {
          value: releaseAmount,
          currency: 'USD'
        },
        paymentMethod: {
          type: 'system'
        },
        status: 'pending'
      }], { session });

      // Release escrow
      await escrow.release(userId, releaseAmount, notes);

      // Complete transaction
      await transaction[0].updateStatus('completed', 'Funds released successfully', userId);

      await session.commitTransaction();
      return { escrow, transaction: transaction[0] };
    } catch (error) {
      await session.abortTransaction();
      logger.error('Release escrow error:', error);
      throw error;
    } finally {
      session.endSession();
    }
  }

  // Dispute escrow
  static async disputeEscrow(escrowId, userId, reason) {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const escrow = await Escrow.findById(escrowId).session(session);
      if (!escrow) {
        throw new Error('Escrow not found');
      }

      // Mark escrow as disputed
      await escrow.dispute(userId, reason);

      // Update associated transactions
      await Transaction.updateMany(
        { escrow: escrow._id, status: 'pending' },
        { status: 'disputed' },
        { session }
      );

      await session.commitTransaction();
      return escrow;
    } catch (error) {
      await session.abortTransaction();
      logger.error('Dispute escrow error:', error);
      throw error;
    } finally {
      session.endSession();
    }
  }

  // Check auto-release for escrows
  static async checkAutoReleaseEscrows() {
    try {
      const escrows = await Escrow.find({
        status: 'funded',
        'autoRelease.enabled': true
      });

      for (const escrow of escrows) {
        try {
          const shouldRelease = await escrow.checkAutoRelease();
          if (shouldRelease) {
            await this.releaseEscrow(
              escrow._id,
              escrow.freelancerId,
              null,
              'Auto-released based on time threshold'
            );
            logger.info(`Auto-released escrow ${escrow._id}`);
          }
        } catch (error) {
          logger.error(`Auto-release check failed for escrow ${escrow._id}:`, error);
        }
      }
    } catch (error) {
      logger.error('Check auto-release escrows error:', error);
      throw error;
    }
  }

  // Get escrow statistics
  static async getEscrowStats(userId) {
    try {
      const stats = await Escrow.getEscrowStats(userId);
      return stats;
    } catch (error) {
      logger.error('Get escrow stats error:', error);
      throw error;
    }
  }
}

export default EscrowService;
