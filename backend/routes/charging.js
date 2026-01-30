const express = require('express');
const mongoose = require('mongoose');
const router = express.Router();
const BookingRequest = require('../models/BookingRequest');
const User = require('../models/User');
const Host = require('../models/Host');
const Transaction = require('../models/Transaction');
const authMiddleware = require('../middleware/auth');
const { sendBookingConfirmationEmail } = require('../services/emailService');

router.get('/history', authMiddleware, async (req, res) => {
  try {
    const { page = 1, limit = 20, status, sortBy = 'newest' } = req.query;

    const query = { userId: req.user.id };

    if (status && ['ongoing', 'completed', 'cancelled', 'accepted', 'pending', 'declined'].includes(status)) {
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
        sortOption = { estimatedDuration: -1 };
        break;
      case 'cost':
        sortOption = { estimatedCost: -1 };
        break;
      default:
        sortOption = { createdAt: -1 };
    }

    const sessions = await BookingRequest.find(query)
      .sort(sortOption)
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .lean();

    const totalSessions = await BookingRequest.countDocuments(query);

    res.json({
      sessions: sessions,
      pagination: {
        current: page,
        pages: Math.ceil(totalSessions / limit),
        total: totalSessions
      }
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

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

    if (!hostId || !hostName || !hostLocation || !chargerType || !vehicleNumber || !scheduledTime || !estimatedDuration) {
      return res.status(400).json({
        success: false,
        msg: 'Missing required booking information'
      });
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        msg: 'User not found'
      });
    }

    const requestId = `REQ${Date.now()}${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

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
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

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
      requests: requests,
      count: requests.length
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

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
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

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
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

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
      vehicleType,
      pricePerHour,
      powerOutput,
      vehicleNumber,
      chargingType
    } = req.body;

    if (!hostId || !hostName || !hostLocation || !chargerType || !vehicleNumber || !scheduledTime || !estimatedDuration) {
      return res.status(400).json({ msg: 'Missing required booking information' });
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ msg: 'User not found' });
    }

    if ((user.walletBalance || 0) < estimatedCost) {
      return res.status(400).json({
        msg: 'Insufficient wallet balance',
        required: estimatedCost,
        available: user.walletBalance || 0
      });
    }

    let hostDocument = null;
    let hostObjectId = hostId;

    if (mongoose.Types.ObjectId.isValid(hostId) && hostId.length === 24) {
      hostDocument = await Host.findById(hostId);
      hostObjectId = new mongoose.Types.ObjectId(hostId);

    } else {

      return res.status(400).json({ msg: 'Invalid host ID format' });
    }

    const requestId = `REQ${Date.now()}${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

    const bookingRequest = new BookingRequest({
      userId: req.user.id,
      hostId: hostObjectId,
      hostName: hostName,
      hostLocation: hostLocation,
      chargerType: chargerType,
      powerOutput: powerOutput || 0,
      pricePerHour: pricePerHour || 0,
      vehicleNumber: vehicleNumber,
      vehicleType: vehicleType,
      vehicleId: null,
      scheduledTime: new Date(scheduledTime),
      estimatedDuration: estimatedDuration,
      estimatedCost: estimatedCost,
      chargingType: chargingType || 'standard',
      status: 'pending',
      requestId: requestId,
      metadata: {
        powerOutput: powerOutput,
        chargingType: chargingType,
        originalChargerId: hostId
      }
    });

    await bookingRequest.save();

    res.status(201).json({
      success: true,
      msg: 'Booking request sent successfully. Waiting for host approval.',
      requestId: requestId,
      bookingRequest: bookingRequest,
      reservationId: requestId
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.put('/:sessionId/complete', authMiddleware, async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { energyConsumed, actualCost } = req.body;

    const booking = await BookingRequest.findOne({
      _id: sessionId,
      userId: req.user.id,
      status: 'ongoing'
    });

    if (!booking) {
      return res.status(404).json({ msg: 'Booking not found or already completed' });
    }

    const endTime = new Date();
    const duration = Math.round((endTime - booking.startTime) / (1000 * 60));

    booking.endTime = endTime;
    booking.actualDuration = duration;
    booking.energyConsumed = energyConsumed || 0;
    booking.actualCost = actualCost || 0;
    booking.status = 'completed';

    await booking.save();

    if (actualCost > 0) {
      const transaction = new Transaction({
        userId: req.user.id,
        type: 'debit',
        amount: actualCost,
        description: `Charging Session at ${booking.hostLocation}`,
        paymentMethod: 'wallet',
        status: 'completed',
        referenceId: `TXN${Date.now()}${Math.random().toString(36).substr(2, 5).toUpperCase()}`,
        metadata: {
          bookingId: booking._id,
          location: booking.hostLocation,
          chargerId: booking.metadata?.originalChargerId
        }
      });

      await transaction.save();

      const user = await User.findById(req.user.id);
      user.walletBalance = (user.walletBalance || 0) - actualCost;
      user.chargingSessions = (user.chargingSessions || 0) + 1;
      await user.save();
    }

    res.json({
      msg: 'Charging session completed successfully',
      booking: booking
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.put('/:sessionId/cancel', authMiddleware, async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { reason } = req.body;

    const booking = await BookingRequest.findOne({
      _id: sessionId,
      userId: req.user.id,
      status: 'ongoing'
    });

    if (!booking) {
      return res.status(404).json({ msg: 'Booking not found or cannot be cancelled' });
    }

    booking.status = 'cancelled';
    booking.endTime = new Date();
    if (reason) {
      booking.metadata = booking.metadata || {};
      booking.metadata.cancellationReason = reason;
    }

    await booking.save();

    res.json({
      msg: 'Charging session cancelled successfully',
      booking: booking
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.put('/:sessionId/rate', authMiddleware, async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { rating, review } = req.body;

    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ msg: 'Rating must be between 1 and 5' });
    }

    const booking = await BookingRequest.findOne({
      _id: sessionId,
      userId: req.user.id,
      status: 'completed'
    });

    if (!booking) {
      return res.status(404).json({ msg: 'Booking not found or not completed' });
    }

    booking.rating = rating;
    if (review) {
      booking.review = review;
    }

    await booking.save();

    res.json({
      msg: 'Rating submitted successfully',
      session: session
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.put('/requests/:requestId/accept', authMiddleware, async (req, res) => {
  try {
    const { requestId } = req.params;

    const existingRequest = await BookingRequest.findById(requestId);

    const request = await BookingRequest.findOne({
      _id: requestId,
      status: { $in: ['pending', 'accepted'] }
    }).populate('userId', 'name email phone');

    if (!request) {
      return res.status(404).json({
        success: false,
        msg: 'Booking request not found or already processed'
      });
    }

    const userHost = await Host.findOne({ userId: req.user.id });
    if (!userHost) {
      return res.status(403).json({
        success: false,
        msg: 'Host profile not found'
      });
    }

    const userHostIdStr = userHost._id.toString();
    const requestHostIdStr = request.hostId.toString ? request.hostId.toString() : String(request.hostId);

    if (userHostIdStr !== requestHostIdStr) {
      return res.status(403).json({
        success: false,
        msg: 'Unauthorized to accept this request'
      });
    }

    if (request.status === 'accepted') {
      return res.json({
        success: true,
        msg: 'Booking request already accepted',
        request: request,
        alreadyAccepted: true
      });
    }

    request.status = 'accepted';
    request.startTime = request.scheduledTime;
    request.hostResponse = {
      respondedAt: new Date(),
      acceptedAt: new Date()
    };

    try {
      const bookingDetails = {
        userName: request.userId?.name || 'Customer',
        chargerType: request.chargerType,
        hostName: request.hostName,
        hostLocation: request.hostLocation,
        scheduledTime: request.scheduledTime,
        estimatedDuration: request.estimatedDuration,
        estimatedCost: request.estimatedCost,
        requestId: request.requestId,
        powerOutput: request.metadata?.powerOutput || 'N/A',
        pricePerHour: request.pricePerHour
      };

      await sendBookingConfirmationEmail(request.userId?.email, bookingDetails);
      console.log('Booking confirmation email sent to:', request.userId?.email);
    } catch (emailError) {
      console.error('Error sending booking confirmation email:', emailError.message);

    }

    await request.save();

    res.json({
      success: true,
      msg: 'Booking request accepted successfully',
      request: request
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
      msg: 'Failed to accept booking request'
    });
  }
});

router.put('/requests/:requestId/decline', authMiddleware, async (req, res) => {
  try {
    const { requestId } = req.params;
    const { reason } = req.body;

    const request = await BookingRequest.findOne({
      _id: requestId,
      status: 'pending'
    });

    if (!request) {
      return res.status(404).json({
        success: false,
        msg: 'Booking request not found or already processed'
      });
    }

    const userHost = await Host.findOne({ userId: req.user.id });
    if (!userHost || userHost._id.toString() !== request.hostId.toString()) {
      return res.status(403).json({
        success: false,
        msg: 'Unauthorized to decline this request'
      });
    }

    request.status = 'declined';
    request.hostResponse = {
      respondedAt: new Date(),
      declinedAt: new Date(),
      declineReason: reason || 'No reason provided'
    };
    await request.save();

    const user = await User.findById(request.userId);
    if (user && request.estimatedCost > 0) {
      user.walletBalance = (user.walletBalance || 0) + request.estimatedCost;
      await user.save();
    }

    res.json({
      success: true,
      msg: 'Booking request declined successfully',
      request: request
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

router.get('/requests/host/pending', authMiddleware, async (req, res) => {
  try {
    const userHost = await Host.findOne({ userId: req.user.id });

    if (!userHost) {
      return res.status(404).json({
        success: false,
        msg: 'Host profile not found'
      });
    }

    const requests = await BookingRequest.find({
      hostId: userHost._id,
      status: { $in: ['pending', 'accepted'] }
    })
      .populate('userId', 'name email phone')
      .sort({ createdAt: -1 })
      .lean();

    res.json({
      success: true,
      requests: requests,
      count: requests.length
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

router.get('/current-bookings', authMiddleware, async (req, res) => {
  try {
    const currentBookings = await BookingRequest.find({
      userId: req.user.id,
      status: { $in: ['accepted', 'ongoing'] }
    })
      .select('hostName hostLocation chargerType scheduledTime estimatedDuration estimatedCost vehicleNumber status actualCost actualDuration energyConsumed')
      .sort({ createdAt: -1 })
      .lean();

    res.json(currentBookings);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/:sessionId', authMiddleware, async (req, res) => {
  try {
    const { sessionId } = req.params;

    const booking = await BookingRequest.findOne({
      _id: sessionId,
      userId: req.user.id
    });

    if (!booking) {
      return res.status(404).json({ msg: 'Booking not found' });
    }

    res.json({ booking });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
