const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const paymentService = require('../services/paymentService');
const BookingRequest = require('../models/BookingRequest');
const Transaction = require('../models/Transaction');
const Host = require('../models/Host');
const User = require('../models/User');
const { getIo } = require('../services/socketService');
const { getRedisClient } = require('../services/redisService');

// ============================================================
// 1. Create Payment Order (Razorpay or Simulation)
// ============================================================
router.post('/create-order', auth, async (req, res) => {
  try {
    const { bookingId } = req.body;

    if (!bookingId) {
      return res.status(400).json({ success: false, msg: 'Booking ID is required' });
    }

    const booking = await BookingRequest.findById(bookingId).populate('userId', 'name email phone');

    if (!booking) {
      return res.status(404).json({ success: false, msg: 'Booking not found' });
    }

    // Verify ownership
    if (booking.userId._id.toString() !== req.user.id.toString()) {
      return res.status(403).json({ success: false, msg: 'Unauthorized to pay for this booking' });
    }

    if (booking.paymentStatus === 'paid') {
      return res.status(400).json({
        success: false,
        msg: 'This booking is already paid',
        paymentId: booking.paymentId
      });
    }

    const amount = booking.totalBill || booking.actualCost || booking.energyCost || 10;

    const order = await paymentService.createOrder({
      amount,
      currency: 'INR',
      receipt: `rcpt_${booking.requestId || booking._id.toString().slice(-8)}`,
      notes: {
        bookingId: booking._id.toString(),
        requestId: booking.requestId,
        customerName: booking.userId?.name || 'Customer',
        stationLocation: booking.hostLocation
      }
    });

    booking.orderId = order.id;
    booking.paymentStatus = 'pending';
    await booking.save();

    res.json({
      success: true,
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      keyId: paymentService.getKeyId(),
      isSimulation: order.isSimulation,
      booking: {
        _id: booking._id,
        requestId: booking.requestId,
        totalBill: amount,
        energyCost: booking.energyCost,
        convenienceFee: booking.convenienceFee,
        platformFee: booking.platformFee,
        hostName: booking.hostName,
        hostLocation: booking.hostLocation
      }
    });

  } catch (error) {
    console.error('Error creating payment order:', error.message);
    res.status(500).json({
      success: false,
      msg: error.message || 'Failed to create payment order'
    });
  }
});

// ============================================================
// 2. Verify Payment & Record Transaction
// ============================================================
router.post('/verify', auth, async (req, res) => {
  try {
    const bookingId = req.body.bookingId;
    const orderId = req.body.orderId || req.body.razorpay_order_id;
    const paymentId = req.body.paymentId || req.body.razorpay_payment_id;
    const signature = req.body.signature || req.body.razorpay_signature;
    const paymentMethod = req.body.paymentMethod || 'razorpay';

    if (!bookingId || !orderId || !paymentId) {
      return res.status(400).json({
        success: false,
        msg: 'Booking ID, Order ID, and Payment ID are required'
      });
    }

    const booking = await BookingRequest.findById(bookingId).populate('userId', 'name email phone');

    if (!booking) {
      return res.status(404).json({ success: false, msg: 'Booking not found' });
    }

    if (booking.userId._id.toString() !== req.user.id.toString()) {
      return res.status(403).json({ success: false, msg: 'Unauthorized' });
    }

    // Verify signature
    const isValid = paymentService.verifyPaymentSignature({
      orderId,
      paymentId,
      signature
    });

    if (!isValid) {
      return res.status(400).json({
        success: false,
        msg: 'Payment signature verification failed. Transaction was not authentic.'
      });
    }

    const billAmount = booking.totalBill || booking.actualCost || booking.energyCost || 10;
    const finalPaymentMethod = paymentMethod || 'razorpay';

    // Update booking payment fields
    booking.paymentStatus = 'paid';
    booking.paymentId = paymentId;
    booking.orderId = orderId;
    booking.paymentMethod = finalPaymentMethod;
    booking.paidAt = new Date();
    await booking.save();

    // Record User Debit Transaction
    const transaction = new Transaction({
      userId: req.user.id,
      hostId: booking.hostId,
      bookingId: booking._id,
      type: 'debit',
      amount: billAmount,
      description: `EV Charging Booking - ${booking.hostName} (${booking.vehicleNumber || 'EV'})`,
      paymentMethod: finalPaymentMethod,
      status: 'completed',
      referenceId: paymentId,
      orderId,
      paymentId,
      metadata: {
        bookingId: booking._id,
        requestId: booking.requestId,
        location: booking.hostLocation,
        chargerId: booking.metadata?.chargerId,
        energyConsumed: booking.totalUnitsKwh || booking.desiredKwh,
        pricePerKwh: booking.pricePerKwh,
        breakdown: {
          energyCost: booking.energyCost,
          convenienceFee: booking.convenienceFee,
          platformFee: booking.platformFee,
          totalBill: billAmount
        }
      }
    });

    await transaction.save();

    // Increment user charging sessions count if not already done
    try {
      await User.findByIdAndUpdate(req.user.id, {
        $inc: { chargingSessions: 1 }
      });
    } catch (e) {
      // Ignore background counter errors
    }

    // Emit real-time WebSocket notification
    try {
      const io = getIo();
      io.to(booking.hostId.toString()).emit('booking_payment_received', {
        bookingId: booking._id,
        requestId: booking.requestId,
        amount: billAmount,
        paymentStatus: 'paid'
      });
      io.to(req.user.id.toString()).emit('payment_confirmed', {
        bookingId: booking._id,
        paymentId,
        amount: billAmount
      });
    } catch (socketErr) {
      // Ignore socket emit errors
    }

    res.json({
      success: true,
      msg: 'Payment verified and completed successfully',
      paymentId,
      orderId,
      booking: {
        _id: booking._id,
        requestId: booking.requestId,
        paymentStatus: booking.paymentStatus,
        paymentId: booking.paymentId,
        totalBill: billAmount,
        paidAt: booking.paidAt
      }
    });

  } catch (error) {
    console.error('Error verifying payment:', error.message);
    res.status(500).json({
      success: false,
      msg: error.message || 'Payment verification failed'
    });
  }
});

// ============================================================
// 3. Get Payment Receipt for a Booking
// ============================================================
router.get('/receipt/:bookingId', auth, async (req, res) => {
  try {
    const { bookingId } = req.params;

    const booking = await BookingRequest.findById(bookingId)
      .populate('userId', 'name email phone')
      .populate('hostId', 'name address location phone rating');

    if (!booking) {
      return res.status(404).json({ success: false, msg: 'Booking not found' });
    }

    // Allow user or host to view receipt
    const hostUser = await Host.findOne({ userId: req.user.id });
    const isOwner = booking.userId._id.toString() === req.user.id.toString();
    const isHost = hostUser && hostUser._id.toString() === booking.hostId?._id?.toString();

    if (!isOwner && !isHost && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, msg: 'Unauthorized' });
    }

    const transaction = await Transaction.findOne({
      bookingId: booking._id,
      status: 'completed'
    }).sort({ createdAt: -1 });

    res.json({
      success: true,
      receipt: {
        receiptNumber: `RCPT-${booking.requestId || booking._id.toString().slice(-8)}`,
        bookingId: booking._id,
        requestId: booking.requestId,
        date: booking.paidAt || booking.createdAt,
        customerName: booking.userId?.name || 'EV Customer',
        customerPhone: booking.userPhone || booking.userId?.phone,
        vehicleNumber: booking.vehicleNumber,
        vehicleModel: booking.vehicleModel,
        hostName: booking.hostName,
        hostLocation: booking.hostLocation,
        chargerType: booking.chargerType,
        energyUnits: booking.totalUnitsKwh || booking.desiredKwh || 0,
        ratePerKwh: booking.pricePerKwh || booking.pricePerUnit || 0,
        breakdown: {
          energyCost: booking.energyCost || 0,
          convenienceFee: booking.convenienceFee || 0,
          platformFee: booking.platformFee || 10,
          totalBill: booking.totalBill || booking.actualCost || 0
        },
        payment: {
          status: booking.paymentStatus,
          method: booking.paymentMethod || 'Razorpay / Online',
          paymentId: booking.paymentId || transaction?.referenceId || 'N/A',
          orderId: booking.orderId || 'N/A',
          paidAt: booking.paidAt || booking.updatedAt
        }
      }
    });

  } catch (error) {
    res.status(500).json({ success: false, msg: error.message });
  }
});

// ============================================================
// 4. Get User Transaction History
// ============================================================
router.get('/user/transactions', auth, async (req, res) => {
  try {
    const transactions = await Transaction.find({ userId: req.user.id })
      .populate('bookingId', 'requestId hostName hostLocation scheduledTime')
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();

    res.json({
      success: true,
      transactions,
      count: transactions.length
    });
  } catch (error) {
    res.status(500).json({ success: false, msg: error.message });
  }
});

// ============================================================
// 5. Get Host Live Earnings Summary & History
// ============================================================
router.get('/host/earnings', auth, async (req, res) => {
  try {
    let host = await Host.findOne({ $or: [{ userId: req.user.id }, { _id: req.user.id }] });
    const hostIdQuery = host ? { $in: [host._id, req.user.id] } : req.user.id;

    // Find all completed bookings for this host
    const completedBookings = await BookingRequest.find({
      hostId: hostIdQuery,
      status: 'completed'
    })
      .populate('userId', 'name email phone')
      .sort({ createdAt: -1 })
      .lean();

    // Calculate total host earnings (energy cost + convenience fee)
    let totalEarnings = 0;
    let thisMonthEarnings = 0;

    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    completedBookings.forEach(booking => {
      // Host earnings = totalBill - platformFee (or energyCost + convenienceFee)
      const platformFee = booking.platformFee ?? 10;
      const hostEarned = Math.max(0, (booking.totalBill || booking.actualCost || 0) - platformFee);
      totalEarnings += hostEarned;

      const bookingDate = new Date(booking.endTime || booking.createdAt);
      if (bookingDate.getMonth() === currentMonth && bookingDate.getFullYear() === currentYear) {
        thisMonthEarnings += hostEarned;
      }
    });

    // Fetch withdrawals / payout transactions for this host
    const payouts = await Transaction.find({
      hostId: hostIdQuery,
      type: 'debit',
      'metadata.payoutDetails': { $exists: true }
    }).lean();

    const totalPaidOut = payouts.reduce((sum, p) => sum + (p.amount || 0), 0);
    const availableBalance = Math.max(0, totalEarnings - totalPaidOut);

    // Format transaction items
    const formattedTransactions = completedBookings.map(b => {
      const platformFee = b.platformFee ?? 10;
      const hostEarned = Math.max(0, (b.totalBill || b.actualCost || 0) - platformFee);

      return {
        _id: b._id,
        requestId: b.requestId,
        customerName: b.userId?.name || 'Customer',
        customerPhone: b.userPhone || b.userId?.phone || 'N/A',
        vehicleNumber: b.vehicleNumber || 'N/A',
        vehicleModel: b.vehicleModel || '',
        energyKwh: b.totalUnitsKwh || b.energyConsumed || b.desiredKwh || 0,
        totalBill: b.totalBill || b.actualCost || 0,
        hostEarning: parseFloat(hostEarned.toFixed(2)),
        platformFee,
        status: b.status,
        paymentStatus: b.paymentStatus || 'paid',
        paymentMethod: b.paymentMethod || 'online',
        date: b.endTime || b.scheduledTime || b.createdAt
      };
    });

    res.json({
      success: true,
      stats: {
        totalEarnings: parseFloat(totalEarnings.toFixed(2)),
        thisMonth: parseFloat(thisMonthEarnings.toFixed(2)),
        availableBalance: parseFloat(availableBalance.toFixed(2)),
        totalPaidOut: parseFloat(totalPaidOut.toFixed(2)),
        totalSessions: completedBookings.length
      },
      transactions: formattedTransactions
    });

  } catch (error) {
    console.error('Error fetching host earnings:', error.message);
    res.status(500).json({ success: false, msg: error.message });
  }
});

// ============================================================
// 6. Host Payout / Withdrawal Request
// ============================================================
router.post('/host/payout-request', auth, async (req, res) => {
  try {
    const { amount, payoutMethod, upiId, bankDetails } = req.body;
    const withdrawAmount = parseFloat(amount);

    if (!withdrawAmount || withdrawAmount <= 0) {
      return res.status(400).json({ success: false, msg: 'Please enter a valid payout amount' });
    }

    const host = await Host.findOne({ $or: [{ userId: req.user.id }, { _id: req.user.id }] });
    const hostId = host ? host._id : req.user.id;
    const hostIdQuery = host ? { $in: [host._id, req.user.id] } : req.user.id;

    const redisClient = getRedisClient();
    const lockKey = `lock:payout:${hostId}`;
    let lockAcquired = false;

    if (redisClient && redisClient.status === 'ready') {
      const lockResult = await redisClient.set(lockKey, 'LOCKED', 'NX', 'EX', 10);
      if (!lockResult) {
        return res.status(429).json({ success: false, msg: 'A payout request is already in progress. Please wait.' });
      }
      lockAcquired = true;
    }

    try {

    // Verify available balance
    const completedBookings = await BookingRequest.find({
      hostId: hostIdQuery,
      status: 'completed'
    }).lean();

    const totalEarnings = completedBookings.reduce((sum, b) => {
      const platformFee = b.platformFee ?? 10;
      return sum + Math.max(0, (b.totalBill || b.actualCost || 0) - platformFee);
    }, 0);

    const payouts = await Transaction.find({
      hostId: hostIdQuery,
      type: 'debit',
      'metadata.payoutDetails': { $exists: true }
    }).lean();

    const totalPaidOut = payouts.reduce((sum, p) => sum + (p.amount || 0), 0);
    const availableBalance = Math.max(0, totalEarnings - totalPaidOut);

    if (withdrawAmount > availableBalance) {
      return res.status(400).json({
        success: false,
        msg: `Withdrawal amount ₹${withdrawAmount} exceeds available balance ₹${availableBalance.toFixed(2)}`
      });
    }

    const payoutTransaction = new Transaction({
      userId: req.user.id,
      hostId: hostId,
      type: 'debit',
      amount: withdrawAmount,
      description: `Host Payout Withdrawal (${payoutMethod === 'upi' ? `UPI: ${upiId}` : `Bank: ${bankDetails?.accountNumber?.slice(-4)}`})`,
      paymentMethod: payoutMethod === 'upi' ? 'upi' : 'netbanking',
      status: 'completed',
      referenceId: `PAYOUT_${Date.now()}_${Math.random().toString(36).substr(2, 5).toUpperCase()}`,
      metadata: {
        payoutDetails: {
          method: payoutMethod,
          upiId: upiId || null,
          bankDetails: bankDetails || null,
          requestedAt: new Date()
        }
      }
    });

    await payoutTransaction.save();

      res.json({
        success: true,
        msg: `Payout of ₹${withdrawAmount} processed successfully!`,
        referenceId: payoutTransaction.referenceId,
        newAvailableBalance: parseFloat((availableBalance - withdrawAmount).toFixed(2))
      });
    } finally {
      if (lockAcquired) {
        await redisClient.del(lockKey).catch(() => {});
      }
    }

  } catch (error) {
    console.error('Error processing payout request:', error.message);
    res.status(500).json({ success: false, msg: error.message });
  }
});

module.exports = router;
