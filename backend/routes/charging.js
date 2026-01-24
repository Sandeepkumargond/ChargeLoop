const express = require('express');
const mongoose = require('mongoose');
const router = express.Router();
const ChargingSession = require('../models/ChargingSession');
const BookingRequest = require('../models/BookingRequest');
const User = require('../models/User');
const Transaction = require('../models/Transaction');
const authMiddleware = require('../middleware/auth');

// Get charging history for user
router.get('/history', authMiddleware, async (req, res) => {
  try {
    const { page = 1, limit = 20, status, sortBy = 'newest' } = req.query;
    
    const query = { userId: req.user.id };
    if (status && ['ongoing', 'completed', 'cancelled'].includes(status)) {
      query.status = status;
    }

    let sortOption = {};
    switch (sortBy) {
      case 'newest':
        sortOption = { createdAt: -1 };
        break;
      case 'oldest':
        sortOption = { createdAt: 1 };
        break;
      case 'duration':
        sortOption = { duration: -1 };
        break;
      case 'cost':
        sortOption = { cost: -1 };
        break;
      default:
        sortOption = { createdAt: -1 };
    }

    const sessions = await ChargingSession.find(query)
      .sort(sortOption)
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .lean();

    const totalSessions = await ChargingSession.countDocuments(query);

    res.json({
      sessions: sessions,
      pagination: {
        current: page,
        pages: Math.ceil(totalSessions / limit),
        total: totalSessions
      }
    });

  } catch (error) {
    console.error('Charging history fetch error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Create booking request (Uber/Ola style - request sent to host for approval)
router.post('/request-booking', authMiddleware, async (req, res) => {
  try {
    const {
      hostId,
      hostName,
      hostLocation,
      chargerType,
      powerOutput,
      pricePerHour,
      vehicleNumber,
      vehicleType,
      vehicleId,
      scheduledTime,
      estimatedDuration,
      estimatedCost,
      chargingType,
      metadata
    } = req.body;

    // Validate required fields
    if (!hostId || !hostName || !hostLocation || !chargerType || !vehicleNumber || !scheduledTime || !estimatedDuration) {
      return res.status(400).json({
        success: false,
        msg: 'Missing required booking information'
      });
    }

    // Validate user exists
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        msg: 'User not found'
      });
    }

    // Generate unique request ID
    const requestId = `REQ${Date.now()}${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

    // Create booking request
    const bookingRequest = new BookingRequest({
      userId: req.user.id,
      hostId: hostId,
      hostName: hostName,
      hostLocation: hostLocation,
      chargerType: chargerType,
      powerOutput: powerOutput,
      pricePerHour: pricePerHour,
      vehicleNumber: vehicleNumber,
      vehicleType: vehicleType,
      vehicleId: vehicleId || null,
      scheduledTime: new Date(scheduledTime),
      estimatedDuration: estimatedDuration,
      estimatedCost: estimatedCost,
      chargingType: chargingType || 'standard',
      status: 'pending',
      requestId: requestId,
      metadata: metadata || {}
    });

    await bookingRequest.save();

    res.status(201).json({
      success: true,
      msg: 'Booking request sent successfully. Waiting for host approval.',
      requestId: requestId,
      bookingRequest: bookingRequest
    });

  } catch (error) {
    console.error('Booking request error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get user's booking requests
router.get('/requests/my-requests', authMiddleware, async (req, res) => {
  try {
    const { status } = req.query;
    const query = { userId: req.user.id };

    if (status && ['pending', 'accepted', 'declined', 'expired'].includes(status)) {
      query.status = status;
    }

    const requests = await BookingRequest.find(query)
      .sort({ createdAt: -1 })
      .lean();

    res.json({
      success: true,
      requests: requests
    });

  } catch (error) {
    console.error('Booking requests fetch error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get specific booking request
router.get('/requests/:requestId', authMiddleware, async (req, res) => {
  try {
    const { requestId } = req.params;

    const request = await BookingRequest.findOne({
      _id: requestId,
      userId: req.user.id
    });

    if (!request) {
      return res.status(404).json({
        success: false,
        msg: 'Booking request not found'
      });
    }

    res.json({
      success: true,
      request: request
    });

  } catch (error) {
    console.error('Booking request fetch error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Cancel booking request
router.put('/requests/:requestId/cancel', authMiddleware, async (req, res) => {
  try {
    const { requestId } = req.params;

    const request = await BookingRequest.findOne({
      _id: requestId,
      userId: req.user.id,
      status: 'pending'
    });

    if (!request) {
      return res.status(404).json({
        success: false,
        msg: 'Booking request not found or cannot be cancelled'
      });
    }

    request.status = 'declined';
    await request.save();

    res.json({
      success: true,
      msg: 'Booking request cancelled successfully',
      request: request
    });

  } catch (error) {
    console.error('Cancel request error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Create new charging session (booking)
router.post('/book', authMiddleware, async (req, res) => {
  try {
    const { 
      hostId, 
      hostName, 
      hostLocation, 
      chargerType, 
      scheduledTime,
      estimatedDuration,
      estimatedCost,
      vehicleType 
    } = req.body;

    // Validate required fields
    if (!hostId || !hostName || !hostLocation || !chargerType) {
      return res.status(400).json({ msg: 'Missing required booking information' });
    }

    // Check user wallet balance
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ msg: 'User not found' });
    }

    // For demo purposes, give users wallet balance if they don't have enough
    if ((user.walletBalance || 0) < estimatedCost) {
      console.log(`User ${user.email} has insufficient balance. Adding demo balance.`);
      user.walletBalance = (user.walletBalance || 0) + 5000; // Add 5000 rupees for demo
      await user.save();
      console.log(`Demo balance added. New balance: ${user.walletBalance}`);
    }

    // Handle hostId - if it's a mock charger ID, create a new ObjectId
    let processedHostId;
    try {
      if (mongoose.Types.ObjectId.isValid(hostId) && hostId.length === 24) {
        processedHostId = hostId;
      } else {
        // For mock chargers, create a new ObjectId or use a default one
        processedHostId = new mongoose.Types.ObjectId();
      }
    } catch (error) {
      processedHostId = new mongoose.Types.ObjectId();
    }

    // Create charging session
    const chargingSession = new ChargingSession({
      userId: req.user.id,
      hostId: processedHostId,
      hostName,
      hostLocation,
      chargerType,
      startTime: scheduledTime || new Date(),
      status: 'ongoing',
      duration: estimatedDuration || 0,
      cost: estimatedCost || 0,
      metadata: {
        powerOutput: req.body.powerOutput,
        pricePerKwh: req.body.pricePerKwh,
        vehicleType,
        vehicleNumber: req.body.vehicleNumber,
        chargingType: req.body.chargingType,
        originalChargerId: hostId, // Store the original ID for reference
        reservationId: `RES${Date.now()}${Math.random().toString(36).substr(2, 5).toUpperCase()}`
      }
    });

    await chargingSession.save();

    // Deduct estimated cost from user wallet
    if (estimatedCost > 0) {
      user.walletBalance = (user.walletBalance || 0) - estimatedCost;
      await user.save();
    }

    res.status(201).json({
      msg: 'Charging session booked successfully',
      session: {
        _id: chargingSession._id,
        hostName: chargingSession.hostName,
        hostLocation: chargingSession.hostLocation,
        chargerType: chargingSession.chargerType,
        startTime: chargingSession.startTime,
        status: chargingSession.status,
        duration: chargingSession.duration,
        cost: chargingSession.cost,
        metadata: chargingSession.metadata
      },
      reservationId: chargingSession.metadata.reservationId,
      walletBalance: user.walletBalance
    });

  } catch (error) {
    console.error('Booking error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Complete charging session
router.put('/:sessionId/complete', authMiddleware, async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { energyConsumed, actualCost } = req.body;

    const session = await ChargingSession.findOne({
      _id: sessionId,
      userId: req.user.id,
      status: 'ongoing'
    });

    if (!session) {
      return res.status(404).json({ msg: 'Charging session not found or already completed' });
    }

    // Calculate duration
    const endTime = new Date();
    const duration = Math.round((endTime - session.startTime) / (1000 * 60)); // in minutes

    // Update session
    session.endTime = endTime;
    session.duration = duration;
    session.energyConsumed = energyConsumed || 0;
    session.cost = actualCost || 0;
    session.status = 'completed';

    await session.save();

    // Create transaction record
    if (actualCost > 0) {
      const transaction = new Transaction({
        userId: req.user.id,
        type: 'debit',
        amount: actualCost,
        description: `Charging Session at ${session.hostLocation}`,
        paymentMethod: 'wallet',
        status: 'completed',
        referenceId: `TXN${Date.now()}${Math.random().toString(36).substr(2, 5).toUpperCase()}`,
        metadata: {
          sessionId: session._id,
          location: session.hostLocation,
          chargerId: session.metadata?.chargerId
        }
      });

      await transaction.save();
      session.transactionId = transaction._id;
      await session.save();

      // Deduct from user wallet
      const user = await User.findById(req.user.id);
      user.walletBalance = (user.walletBalance || 0) - actualCost;
      user.chargingSessions = (user.chargingSessions || 0) + 1;
      await user.save();
    }

    res.json({
      msg: 'Charging session completed successfully',
      session: session
    });

  } catch (error) {
    console.error('Session completion error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Cancel charging session
router.put('/:sessionId/cancel', authMiddleware, async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { reason } = req.body;

    const session = await ChargingSession.findOne({
      _id: sessionId,
      userId: req.user.id,
      status: 'ongoing'
    });

    if (!session) {
      return res.status(404).json({ msg: 'Charging session not found or cannot be cancelled' });
    }

    session.status = 'cancelled';
    session.endTime = new Date();
    if (reason) {
      session.metadata.cancellationReason = reason;
    }

    await session.save();

    res.json({
      msg: 'Charging session cancelled successfully',
      session: session
    });

  } catch (error) {
    console.error('Session cancellation error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Rate charging session
router.put('/:sessionId/rate', authMiddleware, async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { rating, review } = req.body;

    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ msg: 'Rating must be between 1 and 5' });
    }

    const session = await ChargingSession.findOne({
      _id: sessionId,
      userId: req.user.id,
      status: 'completed'
    });

    if (!session) {
      return res.status(404).json({ msg: 'Charging session not found or not completed' });
    }

    session.rating = rating;
    if (review) {
      session.review = review;
    }

    await session.save();

    res.json({
      msg: 'Rating submitted successfully',
      session: session
    });

  } catch (error) {
    console.error('Rating error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get current bookings for user
router.get('/current-bookings', authMiddleware, async (req, res) => {
  try {
    const currentBookings = await ChargingSession.find({
      userId: req.user.id,
      status: { $in: ['ongoing', 'pending', 'confirmed'] }
    }).populate('chargerStation').sort({ createdAt: -1 });

    res.json(currentBookings);
  } catch (error) {
    console.error('Current bookings fetch error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get session details
router.get('/:sessionId', authMiddleware, async (req, res) => {
  try {
    const { sessionId } = req.params;

    const session = await ChargingSession.findOne({
      _id: sessionId,
      userId: req.user.id
    }).populate('transactionId');

    if (!session) {
      return res.status(404).json({ msg: 'Charging session not found' });
    }

    res.json({ session });

  } catch (error) {
    console.error('Session details fetch error:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;

