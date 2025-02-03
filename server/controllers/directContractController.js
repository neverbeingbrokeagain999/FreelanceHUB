import DirectContract from '../models/DirectContract.js';
import User from '../models/User.js';
import logger from '../config/logger.js';
import { errorResponse } from '../utils/errorHandler.js';

export async function getUserContracts(req, res) {
  try {
    if (!req.user || !req.user._id) {
      logger.error('User ID not found in request');
      return errorResponse(res, 401, 'Authentication required');
    }

    logger.info('Getting contracts for user:', req.user._id);
    
    // First verify the user exists
    const user = await User.findById(req.user._id);
    if (!user) {
      logger.error('User not found:', req.user._id);
      return errorResponse(res, 404, 'User not found');
    }

    logger.info('User found, searching for contracts');
    const contracts = await DirectContract.find({
      $or: [
        { client: req.user._id },
        { freelancer: req.user._id }
      ]
    })
    .populate('client', 'name email profilePicture')
    .populate('freelancer', 'name email profilePicture')
    .sort({ createdAt: -1 });

    res.json(contracts);
  } catch (error) {
    logger.error('Get user contracts error:', error.message, {
      userId: req.user._id,
      stack: error.stack
    });
    return errorResponse(res, 500, 'Error fetching contracts');
  }
}

export async function createContract(req, res) {
  try {
    const { freelancerId, contractDetails, budget, startDate, endDate, terms } = req.body;

    // Validate that the creator is a client
    if (req.user.role !== 'client') {
      return errorResponse(res, 403, 'Only clients can create contracts');
    }

    const contract = await DirectContract.create({
      freelancer: freelancerId,
      client: req.user._id,
      contractDetails,
      budget,
      startDate,
      endDate,
      terms,
      status: 'pending'
    });

    const populatedContract = await DirectContract.findById(contract._id)
      .populate('client', 'name email profilePicture')
      .populate('freelancer', 'name email profilePicture');

    res.status(201).json(populatedContract);
  } catch (error) {
    logger.error('Create contract error:', error);
    return errorResponse(res, 500, 'Error creating contract');
  }
}

export async function getContract(req, res) {
  try {
    const contract = await DirectContract.findById(req.params.id)
      .populate('client', 'name email profilePicture')
      .populate('freelancer', 'name email profilePicture');

    if (!contract) {
      return errorResponse(res, 404, 'Contract not found');
    }

    // Check if user is part of the contract
    if (contract.client.toString() !== req.user._id.toString() &&
        contract.freelancer.toString() !== req.user._id.toString()) {
      return errorResponse(res, 403, 'Access denied');
    }

    res.json(contract);
  } catch (error) {
    logger.error('Get contract error:', error);
    return errorResponse(res, 500, 'Error fetching contract');
  }
}

export async function updateContractStatus(req, res) {
  try {
    const { status } = req.body;
    const contract = await DirectContract.findById(req.params.id);

    if (!contract) {
      return errorResponse(res, 404, 'Contract not found');
    }

    // Verify user is part of the contract
    if (contract.client.toString() !== req.user._id.toString() &&
        contract.freelancer.toString() !== req.user._id.toString()) {
      return errorResponse(res, 403, 'Access denied');
    }

    contract.status = status;
    await contract.save();

    const updatedContract = await DirectContract.findById(req.params.id)
      .populate('client', 'name email profilePicture')
      .populate('freelancer', 'name email profilePicture');

    res.json(updatedContract);
  } catch (error) {
    logger.error('Update contract status error:', error);
    return errorResponse(res, 500, 'Error updating contract status');
  }
}
