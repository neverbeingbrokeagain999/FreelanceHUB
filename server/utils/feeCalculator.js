import logger from '../config/logger.js';

// Fee configuration (can be moved to database/config in production)
const FEE_STRUCTURE = {
  escrow: {
    platform: {
      percentage: 5, // 5% platform fee
      minimum: 1, // Minimum $1
      maximum: 1000 // Maximum $1000
    },
    processing: {
      percentage: 2.9, // 2.9% processing fee
      fixed: 0.30 // $0.30 fixed fee
    }
  },
  milestone: {
    platform: {
      percentage: 4.5,
      minimum: 1,
      maximum: 900
    },
    processing: {
      percentage: 2.9,
      fixed: 0.30
    }
  },
  hourly: {
    platform: {
      percentage: 4,
      minimum: 1,
      maximum: 800
    },
    processing: {
      percentage: 2.9,
      fixed: 0.30
    }
  }
};

// Calculate fees based on amount and transaction type
export const calculateFees = async (amount, type = 'escrow') => {
  try {
    if (!amount || amount <= 0) {
      throw new Error('Invalid amount');
    }

    const feeStructure = FEE_STRUCTURE[type];
    if (!feeStructure) {
      throw new Error('Invalid transaction type');
    }

    // Calculate platform fee
    let platformFee = (amount * feeStructure.platform.percentage) / 100;
    platformFee = Math.max(platformFee, feeStructure.platform.minimum);
    platformFee = Math.min(platformFee, feeStructure.platform.maximum);
    platformFee = Math.round(platformFee * 100) / 100; // Round to 2 decimal places

    // Calculate processing fee
    const processingPercentageFee = (amount * feeStructure.processing.percentage) / 100;
    const processingFee = Math.round((processingPercentageFee + feeStructure.processing.fixed) * 100) / 100;

    // Calculate total fee
    const totalFee = Math.round((platformFee + processingFee) * 100) / 100;

    return {
      platform: platformFee,
      processing: processingFee,
      total: totalFee,
      breakdown: {
        platformPercentage: feeStructure.platform.percentage,
        processingPercentage: feeStructure.processing.percentage,
        processingFixed: feeStructure.processing.fixed
      }
    };
  } catch (error) {
    logger.error('Fee calculation error:', error);
    throw error;
  }
};

// Get fee estimates for different payment amounts
export const getFeeEstimates = async (amounts, type = 'escrow') => {
  try {
    if (!Array.isArray(amounts)) {
      throw new Error('Amounts must be an array');
    }

    const estimates = await Promise.all(
      amounts.map(async (amount) => {
        const fees = await calculateFees(amount, type);
        return {
          amount,
          fees,
          total: Math.round((amount + fees.total) * 100) / 100
        };
      })
    );

    return estimates;
  } catch (error) {
    logger.error('Fee estimates error:', error);
    throw error;
  }
};

// Get fee structure for a transaction type
export const getFeeStructure = (type = 'escrow') => {
  const structure = FEE_STRUCTURE[type];
  if (!structure) {
    throw new Error('Invalid transaction type');
  }
  return structure;
};

// Calculate potential savings for larger transactions
export const calculateFeeSavings = async (amount, type = 'escrow') => {
  try {
    const standardFees = await calculateFees(amount, type);
    
    // Calculate fees with bulk discount (example: 20% off platform fee)
    const bulkFees = await calculateFees(amount, type);
    const bulkDiscount = 0.2; // 20% discount
    bulkFees.platform = Math.round((bulkFees.platform * (1 - bulkDiscount)) * 100) / 100;
    bulkFees.total = Math.round((bulkFees.platform + bulkFees.processing) * 100) / 100;

    return {
      standard: standardFees,
      withDiscount: bulkFees,
      savings: Math.round((standardFees.total - bulkFees.total) * 100) / 100
    };
  } catch (error) {
    logger.error('Fee savings calculation error:', error);
    throw error;
  }
};

export default {
  calculateFees,
  getFeeEstimates,
  getFeeStructure,
  calculateFeeSavings
};
