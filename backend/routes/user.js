const express = require('express');
const mongoose = require('mongoose');
const router = express.Router();
const User = require('../models/User');
const Host = require('../models/Host');
const Transaction = require('../models/Transaction');
const BookingRequest = require('../models/BookingRequest');
const ChargerStation = require('../models/ChargerStation');
const authMiddleware = require('../middleware/auth');
const pricingService = require('../services/pricingService');
const { scheduleBookingExpiry } = require('../queues/jobQueues');
const { transitionBookingStatus } = require('../services/bookingStateMachine');
const { normalizeBookings } = require('../utils/normalizeBooking');

const { 
  getProfile, 
  updateProfile, 
  addVehicle, 
  getVehicles, 
  deleteVehicle 
} = require('../controllers/authController');
const { checkVehicleExists } = require('../services/vehicleService');

// ===== PROFILE MANAGEMENT =====
router.get('/profile', authMiddleware, getProfile);
router.put('/profile', authMiddleware, updateProfile);

// ===== VEHICLE MANAGEMENT =====
router.post('/vehicles', authMiddleware, addVehicle);
router.get('/vehicles', authMiddleware, getVehicles);
router.delete('/vehicles/:vehicleId', authMiddleware, deleteVehicle);

router.post('/verify-vehicle', authMiddleware, async (req, res) => {
  try {
    const { vehicleNumber } = req.body;
    if (!vehicleNumber || typeof vehicleNumber !== 'string') {
      return res.status(400).json({ valid: false, reason: 'Invalid vehicle number' });
    }
    const result = await checkVehicleExists(vehicleNumber);
    res.json(result);
  } catch (error) {
    res.status(500).json({ valid: false, reason: 'Unable to verify vehicle' });
  }
});

// ===== BOOKING MANAGEMENT =====
router.get('/bookings/history', authMiddleware, async (req, res) => {
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
      case 'kwh':
        sortOption = { desiredKwh: -1 };
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

    const normalizedSessions = normalizeBookings(sessions);

    res.json({
      sessions: normalizedSessions,
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

router.get('/bookings/current', authMiddleware, async (req, res) => {
  try {
    const now = new Date();
    const next24Hours = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    // Allow up to 1 hour past scheduled time for sessions in progress or starting
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);

    const currentBookings = await BookingRequest.find({
      userId: req.user.id,
      $or: [
        { status: 'ongoing' },
        {
          status: 'accepted',
          scheduledTime: {
            $gte: oneHourAgo,
            $lte: next24Hours
          }
        }
      ]
    })
      .select('hostName hostLocation hostPhone chargerType scheduledTime requestedDuration estimatedDuration estimatedCost totalBill energyCost pricePerKwh pricePerUnit vehicleNumber vehicleType vehicleModel status paymentStatus paymentMethod paymentId actualCost actualDuration energyConsumed totalUnitsKwh desiredKwh')
      .sort({ scheduledTime: 1 })
      .lean();

    const normalizedBookings = normalizeBookings(currentBookings);

    res.json(normalizedBookings);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/bookings/:sessionId', authMiddleware, async (req, res) => {
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

router.post('/bookings/book', authMiddleware, async (req, res) => {
  try {
    const {
      chargerId,
      hostId,
      hostName,
      hostLocation,
      chargerType,
      scheduledTime,
      userChargerPowerKw,
      bookingDurationMinutes,
      vehicleType,
      vehicleNumber,
      vehicleModel,
      vehicleBatteryCapacity,
      // Legacy fields for backward compatibility
      requiredEnergy,
      bookingDuration,
      desiredKwh,
      requestedDuration
    } = req.body;

    // Validate required fields
    if (!hostId || !hostName || !hostLocation || !chargerType || !vehicleNumber || !scheduledTime) {
      return res.status(400).json({
        success: false,
        msg: 'Missing required booking information: hostId, hostName, hostLocation, chargerType, vehicleNumber, scheduledTime'
      });
    }

    if (!userChargerPowerKw || userChargerPowerKw <= 0) {
      return res.status(400).json({
        success: false,
        msg: 'User charger power (userChargerPowerKw) is required and must be positive'
      });
    }

    const finalBookingDuration = bookingDurationMinutes || requestedDuration || bookingDuration;
    if (!finalBookingDuration || finalBookingDuration <= 0) {
      return res.status(400).json({
        success: false,
        msg: 'Booking duration is required and must be positive'
      });
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        msg: 'User not found'
      });
    }

    // Fetch charger details from Host model (real data only)
    let host = null;
    let pricePerKwh = null;
    let convenienceFee = null;
    let socketMaxCapacity = null;
    let chargerPowerKw = null;
    let hostPhone = null;

    if (hostId) {
      if (mongoose.isValidObjectId(hostId)) {
        host = await Host.findById(hostId);
        if (!host) {
          host = await Host.findOne({ userId: hostId });
        }
      }
      if (!host && chargerId && mongoose.isValidObjectId(chargerId)) {
        const station = await ChargerStation.findById(chargerId);
        if (station) {
          host = await Host.findOne({ userId: station.hostId });
          if (!host) {
            pricePerKwh = station.pricePerKwh ?? station.pricePerUnit ?? 10;
            convenienceFee = station.convenienceFee ?? 0;
            socketMaxCapacity = station.socketMaxCapacity ?? station.powerOutput ?? 3.3;
            chargerPowerKw = station.chargerPowerKw ?? station.powerOutput ?? 22;
          }
        }
      }
    }

    // Only use REAL data from host with sensible fallbacks
    if (host) {
      pricePerKwh = host.pricePerKwh ?? host.pricePerHour ?? 10;
      convenienceFee = host.convenienceFee ?? 0;
      socketMaxCapacity = host.socketMaxCapacity ?? host.chargerPowerKw ?? 3.3;
      chargerPowerKw = host.chargerPowerKw ?? host.socketMaxCapacity ?? 22;
      hostPhone = host.phone;
    }

    // Get user phone from profile
    const userPhone = user.phone;

    // Validate that we have real host data
    if (pricePerKwh === undefined || pricePerKwh === null || socketMaxCapacity === null || socketMaxCapacity === undefined) {
      return res.status(400).json({
        success: false,
        msg: 'Host charger pricing information not found. Please contact the host.'
      });
    }

    // 1. Check Host Availability (Time and Status) - only block if explicitly unavailable (false)
    if (host && host.available === false) {
      return res.status(400).json({ success: false, msg: 'Host charger is currently unavailable' });
    }

    const reqDate = new Date(scheduledTime);
    if (host && host.availableFrom && host.availableTo && host.availableFrom !== host.availableTo) {
      const [fromHour, fromMin] = host.availableFrom.split(':').map(Number);
      const [toHour, toMin] = host.availableTo.split(':').map(Number);
      if (!isNaN(fromHour) && !isNaN(toHour)) {
        const reqTime = reqDate.getHours() * 60 + reqDate.getMinutes();
        const fromTime = fromHour * 60 + (fromMin || 0);
        const toTime = toHour * 60 + (toMin || 0);
        
        let isAvailable = true;
        if (fromTime < toTime) {
          isAvailable = reqTime >= fromTime && reqTime <= toTime;
        } else if (fromTime > toTime) {
          // Overnight availability
          isAvailable = reqTime >= fromTime || reqTime <= toTime;
        }

        if (!isAvailable) {
          return res.status(400).json({ 
            success: false, 
            msg: `Host is only available from ${host.availableFrom} to ${host.availableTo}` 
          });
        }
      }
    }

    // 2. Double Booking Prevention (Overlap Detection)
    const scheduledStartTime = new Date(scheduledTime);
    const scheduledEndTime = new Date(scheduledStartTime.getTime() + finalBookingDuration * 60 * 1000);

    const activeBookings = await BookingRequest.find({
      hostId: host._id,
      status: { $in: ['pending', 'accepted', 'ongoing'] }
    }).select('scheduledTime requestedDuration estimatedDuration');

    const isOverlapping = activeBookings.some(b => {
      if (!b.scheduledTime) return false;
      const bStart = new Date(b.scheduledTime).getTime();
      const bDuration = b.requestedDuration || b.estimatedDuration || 60; // fallback to 60 mins
      const bEnd = bStart + bDuration * 60 * 1000;
      
      const reqStart = scheduledStartTime.getTime();
      const reqEnd = scheduledEndTime.getTime();
      
      // Strict overlap check
      return bStart < reqEnd && reqStart < bEnd;
    });

    if (isOverlapping) {
      return res.status(409).json({ 
        success: false, 
        msg: 'This time slot is already booked for this charger.' 
      });
    }

      // Calculate pricing with REAL data
      const pricingResult = pricingService.calculateNewPricing({
        userChargerPowerKw,
        socketMaxCapacityKw: socketMaxCapacity,
        bookingDurationMinutes: finalBookingDuration,
        pricePerKwh,
        convenienceFee: convenienceFee || 0,
        platformFee: parseFloat(process.env.PLATFORM_FEE) || 10,
        chargerType
      });

      // Check safety alert
      if (!pricingResult.isSafeToBook) {
        return res.status(400).json({
          success: false,
          msg: pricingResult.safetyAlertMessage,
          safetyAlert: pricingResult.safetyAlert,
          booking: null
        });
      }

      const requestId = `REQ${Date.now()}${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

      // Clean chargerType: remove hardcoded power value from string
      const cleanChargerType = chargerType.replace(/\s*\([^)]*\)/g, '') || 'Charging';

      // Create booking with ONLY real user-filled and fetched data
      const finalHostId = host ? host._id : (mongoose.isValidObjectId(hostId) ? new mongoose.Types.ObjectId(hostId) : hostId);
      const bookingRequest = new BookingRequest({
        userId: req.user.id,
        hostId: finalHostId,
        hostName,
        hostLocation,
        hostPhone,
        userPhone,
        chargerType: cleanChargerType,
        vehicleNumber,
        vehicleType,
        vehicleModel,
        vehicleBatteryCapacity,
        scheduledTime: new Date(scheduledTime),
        
        // Real charger data from host (NOT defaults)
        userChargerPowerKw,
        socketMaxCapacity,
        pricePerKwh,
        pricePerUnit: pricePerKwh,
        convenienceFee: convenienceFee || 0,
        platformFee: parseFloat(process.env.PLATFORM_FEE) || 10,
        
        // Calculated pricing values
        totalUnitsKwh: pricingResult.totalUnitsKwh,
        desiredKwh: pricingResult.totalUnitsKwh,
        energyCost: pricingResult.energyCost,
        estimatedRange: pricingResult.estimatedRange,
        totalBill: pricingResult.totalBill,
        estimatedCost: pricingResult.totalBill,
        
        // Safety validation
        safetyAlert: pricingResult.safetyAlert,
        safetyAlertMessage: pricingResult.safetyAlertMessage,
        
        // Duration info
        requestedDuration: finalBookingDuration,
        estimatedDuration: finalBookingDuration,
        
        status: 'pending',
        requestId
      });

      await bookingRequest.save();

      // Emit WebSocket event to host
      try {
        const { getIo } = require('../services/socketService');
        const hostUserId = host?.userId ? host.userId.toString() : hostId.toString();
        getIo().to(hostUserId).to(hostId.toString()).emit('new_booking_request', {
          bookingId: bookingRequest._id,
          requestId: bookingRequest.requestId,
          vehicleNumber: bookingRequest.vehicleNumber,
          scheduledTime: bookingRequest.scheduledTime
        });
      } catch (socketErr) {
        console.error('Failed to emit socket event:', socketErr.message);
      }

      // Schedule auto-expiry if host doesn't respond before the scheduled time (or at least 15 mins)
      try {
        const scheduledTimeMs = new Date(bookingRequest.scheduledTime).getTime();
        const timeUntilSchedule = scheduledTimeMs - Date.now();
        const expiryDelay = Math.max(15 * 60 * 1000, timeUntilSchedule);
        await scheduleBookingExpiry(bookingRequest._id.toString(), expiryDelay);
      } catch (queueErr) {
        console.error('Failed to schedule booking expiry:', queueErr.message);
        // Non-critical — booking still created successfully
      }

      return res.status(201).json({
        success: true,
        msg: 'Booking request created successfully',
        requestId,
        booking: {
          _id: bookingRequest._id,
          requestId,
          status: 'pending',
          scheduledTime: bookingRequest.scheduledTime,
          userChargerPowerKw: pricingResult.userChargerPowerKw,
          socketMaxCapacity: pricingResult.socketMaxCapacityKw,
          totalUnitsKwh: pricingResult.totalUnitsKwh,
          pricePerKwh: pricePerKwh,
          energyCost: pricingResult.energyCost,
          convenienceFee: pricingResult.convenienceFee,
          platformFee: pricingResult.platformFee,
          totalBill: pricingResult.totalBill,
          estimatedRange: pricingResult.estimatedRange,
          bookingDurationMinutes: finalBookingDuration,
          bookingDurationHours: pricingResult.bookingDurationHours
        }
      });

  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

router.get('/bookings/requests/my-requests', authMiddleware, async (req, res) => {
  try {
    const { status } = req.query;
    const query = { userId: req.user.id };

    if (status && ['pending', 'accepted', 'declined', 'expired', 'cancelled'].includes(status)) {
      query.status = status;
    }

    // Auto-expire past pending requests
    await BookingRequest.updateMany({
      userId: req.user.id,
      status: 'pending',
      scheduledTime: { $lt: new Date() }
    }, {
      $set: { status: 'expired' }
    });

    const requests = await BookingRequest.find(query)
      .sort({ createdAt: -1 })
      .lean();

    const normalizedRequests = normalizeBookings(requests);

    res.json({
      success: true,
      requests: normalizedRequests,
      count: normalizedRequests.length
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

router.get('/bookings/requests/:requestId', authMiddleware, async (req, res) => {
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

router.put('/bookings/requests/:requestId/cancel', authMiddleware, async (req, res) => {
  try {
    const { requestId } = req.params;

    const request = await BookingRequest.findOne({
      _id: requestId,
      userId: req.user.id,
      status: { $in: ['pending', 'accepted'] }
    });

    if (!request) {
      return res.status(404).json({
        success: false,
        msg: 'Booking request not found or cannot be cancelled'
      });
    }

    transitionBookingStatus(request, 'cancelled', 'user');
    await request.save();

    // Emit WebSocket event to host
    try {
      const { getIo } = require('../services/socketService');
      getIo().to(request.hostId.toString()).emit('booking_update', {
        bookingId: request._id,
        status: 'cancelled'
      });
    } catch (socketErr) {
      console.error('Failed to emit socket event:', socketErr.message);
    }

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

router.put('/bookings/:sessionId/complete', authMiddleware, async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { energyConsumed, actualCost } = req.body;

    const booking = await BookingRequest.findOne({
      _id: sessionId,
      userId: req.user.id,
      status: 'ongoing'
    });

    if (!booking) {
      return res.status(404).json({
        success: false,
        msg: 'Booking not found or already completed'
      });
    }

    let finalEnergy = energyConsumed || booking.energyDelivered || 0;
    let finalCost = actualCost;

    if (!finalCost && finalEnergy > 0) {
      finalCost = pricingService.calculateTotalCost(finalEnergy, booking.pricePerKwh);
    }

    transitionBookingStatus(booking, 'completed', 'user');
    booking.energyConsumed = finalEnergy;
    booking.actualCost = finalCost || 0;

    await booking.save();

    if (finalCost > 0) {
      const transaction = new Transaction({
        userId: req.user.id,
        hostId: booking.hostId,
        bookingId: booking._id,
        type: 'debit',
        amount: finalCost,
        description: `Charging Session at ${booking.hostLocation}`,
        paymentMethod: booking.paymentMethod || 'direct',
        status: 'completed',
        referenceId: `TXN${Date.now()}${Math.random().toString(36).substr(2, 5).toUpperCase()}`,
        metadata: {
          bookingId: booking._id,
          location: booking.hostLocation,
          chargerId: booking.metadata?.chargerId,
          energyConsumed: finalEnergy,
          pricePerKwh: booking.pricePerKwh
        }
      });

      await transaction.save();

      const user = await User.findById(req.user.id);
      user.chargingSessions = (user.chargingSessions || 0) + 1;
      await user.save();
    }

    res.json({
      success: true,
      msg: 'Charging session completed successfully',
      booking: {
        _id: booking._id,
        status: 'completed',
        actualDuration: booking.actualDuration,
        energyConsumed: finalEnergy,
        actualCost: finalCost,
        pricePerKwh: booking.pricePerKwh
      }
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

router.put('/bookings/:sessionId/cancel', authMiddleware, async (req, res) => {
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

    transitionBookingStatus(booking, 'cancelled', 'user', { reason });

    await booking.save();

    res.json({
      msg: 'Charging session cancelled successfully',
      booking: booking
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ===== REVIEWS & RATINGS =====
router.put('/bookings/:sessionId/rate', authMiddleware, async (req, res) => {
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
      session: booking
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/reviews/my-reviews', authMiddleware, async (req, res) => {
  try {
    const reviews = await BookingRequest.find({
      userId: req.user.id,
      rating: { $exists: true, $ne: null }
    }).select('rating review createdAt hostId').lean();

    return res.status(200).json({
      success: true,
      reviews: reviews || [],
      totalReviews: reviews.length
    });

  } catch (error) {
    return res.status(500).json({
      error: 'Failed to fetch reviews',
      details: error.message
    });
  }
});

module.exports = router;
