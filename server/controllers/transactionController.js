import Transaction from '../models/Transaction.js';

export const getFreelancerTransactions = async (req, res) => {
  try {
    const freelancerId = req.user.userId;
    const transactions = await Transaction.find({ payee: freelancerId }).populate('payer', 'name').populate('job', 'title');
    res.json(transactions);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const requestWithdrawal = async (req, res) => {
  try {
    const { amount, paymentMethod, accountDetails } = req.body;
    const freelancerId = req.user.userId;

    const transaction = new Transaction({
      payee: freelancerId,
      amount,
      status: 'withdrawalRequested',
      paymentMethod,
      withdrawalDetails: {
        amount,
        date: Date.now(),
        paymentMethod,
        accountDetails,
      }
    });

    await transaction.save();
    res.json({ message: 'Withdrawal request submitted successfully', transaction });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const getWithdrawalHistory = async (req, res) => {
  try {
    const freelancerId = req.user.userId;
    const withdrawalHistory = await Transaction.find({
      payee: freelancerId,
      status: { $in: ['withdrawalRequested', 'withdrawalCompleted'] },
    }).select('withdrawalDetails status');
    res.json(withdrawalHistory);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
