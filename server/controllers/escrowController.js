import EscrowService from '../services/escrowService.js';
import { validateObjectId } from '../utils/validation.js';
import logger from '../config/logger.js';

export const escrowController = {
  // Create new escrow
  createEscrow: async (req, res) => {
    try {
      const { jobId, amount, paymentGatewayId, paymentMethod } = req.body;
      const clientId = req.user.id;
      const freelancerId = req.body.freelancerId;

      if (!validateObjectId(jobId) || !validateObjectId(freelancerId) || !validateObjectId(paymentGatewayId)) {
        return res.status(400).json({ error: 'Invalid ID format' });
      }

      if (!amount || amount <= 0) {
        return res.status(400).json({ error: 'Invalid amount' });
      }

      const result = await EscrowService.createEscrow(
        jobId,
        clientId,
        freelancerId,
        amount,
        paymentGatewayId,
        paymentMethod
      );

      res.status(201).json(result);
    } catch (error) {
      logger.error('Create escrow error:', error);
      res.status(500).json({ error: 'Failed to create escrow' });
    }
  },

  // Fund escrow
  fundEscrow: async (req, res) => {
    try {
      const { escrowId, transactionId } = req.body;

      if (!validateObjectId(escrowId)) {
        return res.status(400).json({ error: 'Invalid escrow ID' });
      }

      const result = await EscrowService.fundEscrow(escrowId, transactionId);
      res.json(result);
    } catch (error) {
      logger.error('Fund escrow error:', error);
      res.status(500).json({ error: 'Failed to fund escrow' });
    }
  },

  // Release escrow funds
  releaseEscrow: async (req, res) => {
    try {
      const { escrowId } = req.params;
      const { amount, notes } = req.body;
      const userId = req.user.id;

      if (!validateObjectId(escrowId)) {
        return res.status(400).json({ error: 'Invalid escrow ID' });
      }

      const result = await EscrowService.releaseEscrow(
        escrowId,
        userId,
        amount,
        notes
      );
      res.json(result);
    } catch (error) {
      logger.error('Release escrow error:', error);
      res.status(500).json({ error: 'Failed to release escrow funds' });
    }
  },

  // Dispute escrow
  disputeEscrow: async (req, res) => {
    try {
      const { escrowId } = req.params;
      const { reason } = req.body;
      const userId = req.user.id;

      if (!validateObjectId(escrowId)) {
        return res.status(400).json({ error: 'Invalid escrow ID' });
      }

      if (!reason) {
        return res.status(400).json({ error: 'Dispute reason is required' });
      }

      const result = await EscrowService.disputeEscrow(escrowId, userId, reason);
      res.json(result);
    } catch (error) {
      logger.error('Dispute escrow error:', error);
      res.status(500).json({ error: 'Failed to dispute escrow' });
    }
  },

  // Get user's escrows
  getUserEscrows: async (req, res) => {
    try {
      const userId = req.user.id;
      const escrows = await EscrowService.getActiveEscrows(userId);
      res.json(escrows);
    } catch (error) {
      logger.error('Get user escrows error:', error);
      res.status(500).json({ error: 'Failed to fetch escrows' });
    }
  },

  // Get escrow statistics
  getEscrowStats: async (req, res) => {
    try {
      const userId = req.user.id;
      const stats = await EscrowService.getEscrowStats(userId);
      res.json(stats);
    } catch (error) {
      logger.error('Get escrow stats error:', error);
      res.status(500).json({ error: 'Failed to fetch escrow statistics' });
    }
  },

  // Get single escrow details
  getEscrowDetails: async (req, res) => {
    try {
      const { escrowId } = req.params;

      if (!validateObjectId(escrowId)) {
        return res.status(400).json({ error: 'Invalid escrow ID' });
      }

      const escrow = await Escrow.findById(escrowId)
        .populate('jobId')
        .populate('clientId', 'name email')
        .populate('freelancerId', 'name email')
        .populate('transactionIds');

      if (!escrow) {
        return res.status(404).json({ error: 'Escrow not found' });
      }

      // Check if user has permission to view this escrow
      if (![escrow.clientId._id.toString(), escrow.freelancerId._id.toString()].includes(req.user.id)) {
        return res.status(403).json({ error: 'Not authorized to view this escrow' });
      }

      res.json(escrow);
    } catch (error) {
      logger.error('Get escrow details error:', error);
      res.status(500).json({ error: 'Failed to fetch escrow details' });
    }
  }
};

export default escrowController;
