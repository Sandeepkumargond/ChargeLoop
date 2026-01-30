const express = require('express');
const mongoose = require('mongoose');
const router = express.Router();
const User = require('../models/User');
const Transaction = require('../models/Transaction');
const authMiddleware = require('../middleware/auth');

router.post('/recharge', authMiddleware, async (req, res) => {
  try {
    const { amount, paymentMethod = 'upi' } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({ msg: 'Invalid amount' });
    }

    if (amount < 10) {
      return res.status(400).json({ msg: 'Minimum recharge amount is ₹10' });
    }

    if (amount > 50000) {
      return res.status(400).json({ msg: 'Maximum recharge amount is ₹50,000' });
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ msg: 'User not found' });
    }

    const transaction = new Transaction({
      userId: req.user.id,
      type: 'credit',
      amount: parseFloat(amount),
      description: `Wallet Recharge via ${paymentMethod.toUpperCase()}`,
      paymentMethod,
      status: 'completed',
      referenceId: `TXN${Date.now()}${Math.random().toString(36).substr(2, 5).toUpperCase()}`
    });

    await transaction.save();

    user.walletBalance = (user.walletBalance || 0) + parseFloat(amount);
    await user.save();

    res.json({
      msg: 'Wallet recharged successfully',
      newBalance: user.walletBalance,
      rechargedAmount: amount,
      transactionId: transaction._id,
      referenceId: transaction.referenceId
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/transactions', authMiddleware, async (req, res) => {
  try {
    const { page = 1, limit = 20, type } = req.query;

    const query = { userId: req.user.id };
    if (type && ['credit', 'debit'].includes(type)) {
      query.type = type;
    }

    const transactions = await Transaction.find(query)
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .lean();

    const formattedTransactions = transactions.map(transaction => ({
      id: transaction._id,
      type: transaction.type,
      amount: transaction.amount,
      description: transaction.description,
      date: transaction.createdAt.toISOString().split('T')[0],
      timestamp: transaction.createdAt.toISOString(),
      paymentMethod: transaction.paymentMethod,
      status: transaction.status,
      referenceId: transaction.referenceId
    }));

    const totalTransactions = await Transaction.countDocuments(query);

    res.json({
      transactions: formattedTransactions,
      pagination: {
        current: page,
        pages: Math.ceil(totalTransactions / limit),
        total: totalTransactions
      }
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/balance', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('walletBalance');
    if (!user) {
      return res.status(404).json({ msg: 'User not found' });
    }

    res.json({ walletBalance: user.walletBalance || 0 });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/deduct', authMiddleware, async (req, res) => {
  try {
    const { amount, description, sessionId, location, chargerId } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({ msg: 'Invalid amount' });
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ msg: 'User not found' });
    }

    if ((user.walletBalance || 0) < amount) {
      return res.status(400).json({ msg: 'Insufficient wallet balance' });
    }

    const transaction = new Transaction({
      userId: req.user.id,
      type: 'debit',
      amount: parseFloat(amount),
      description: description || 'Charging Session',
      paymentMethod: 'wallet',
      status: 'completed',
      referenceId: `TXN${Date.now()}${Math.random().toString(36).substr(2, 5).toUpperCase()}`,
      metadata: {
        sessionId,
        location,
        chargerId
      }
    });

    await transaction.save();

    user.walletBalance = (user.walletBalance || 0) - parseFloat(amount);
    await user.save();

    res.json({
      msg: 'Amount deducted successfully',
      newBalance: user.walletBalance,
      deductedAmount: amount,
      transactionId: transaction._id,
      referenceId: transaction.referenceId
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/stats', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;

    const stats = await Transaction.aggregate([
      { $match: { userId: mongoose.Types.ObjectId(userId) } },
      {
        $group: {
          _id: '$type',
          total: { $sum: '$amount' },
          count: { $sum: 1 }
        }
      }
    ]);

    const result = {
      totalRecharged: 0,
      totalSpent: 0,
      transactionCount: 0
    };

    stats.forEach(stat => {
      if (stat._id === 'credit') {
        result.totalRecharged = stat.total;
      } else if (stat._id === 'debit') {
        result.totalSpent = stat.total;
      }
      result.transactionCount += stat.count;
    });

    res.json(result);

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
