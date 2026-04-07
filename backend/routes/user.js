const express = require('express');
const mongoose = require('mongoose');
const router = express.Router();
const User = require('../models/User');
const Transaction = require('../models/Transaction');
const BookingRequest = require('../models/BookingRequest');
const ChargerStation = require('../models/ChargerStation');
const authMiddleware = require('../middleware/auth');
const { sendBookingConfirmationEmail } = require('../services/emailService');
const pricingService = require('../services/pricingService');
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

router.get('/bookings/current', authMiddleware, async (req, res) => {
  try {
    const currentBookings = await BookingRequest.find({
      userId: req.user.id,
      status: { $in: ['accepted', 'ongoing'] }
    })
      .select('hostName hostLocation chargerType scheduledTime requestedDuration estimatedCost vehicleNumber status actualCost actualDuration energyConsumed')
      .sort({ createdAt: -1 })
      .lean();

    res.json(currentBookings);
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
    let pricePerUnit = null;
    let convenienceFee = null;
    let socketMaxCapacity = null;
    let hostPhone = null;

    if (hostId) {
      host = await require('../models/Host').findById(hostId).select(
        'chargerPowerKw pricePerKwh pricePerUnit socketMaxCapacity convenienceFee phone'
      );
    }

    // Only use REAL data from host - no defaults
    if (host) {
      pricePerUnit = host.pricePerKwh || host.pricePerUnit;
      convenienceFee = host.convenienceFee;
      socketMaxCapacity = host.socketMaxCapacity;
      chargerPowerKw = host.chargerPowerKw;
      hostPhone = host.phone;
    }

    // Get user phone from profile
    const userPhone = user.phone;

      // Validate that we have real host data
      if (!pricePerUnit || socketMaxCapacity === null) {
        return res.status(400).json({
          success: false,
          msg: 'Host charger pricing information not found. Please contact the host.'
        });
      }

      // Calculate pricing with REAL data
      const pricingResult = pricingService.calculateNewPricing({
        userChargerPowerKw,
        socketMaxCapacityKw: socketMaxCapacity,
        bookingDurationMinutes: finalBookingDuration,
        pricePerUnit,
        convenienceFee: convenienceFee || 0,
        platformFee: 10, // ₹10 ChargeLoop fee
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
      const bookingRequest = new BookingRequest({
        userId: req.user.id,
        hostId: new mongoose.Types.ObjectId(hostId),
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
        pricePerUnit,
        convenienceFee: convenienceFee || 0,
        platformFee: 10,
        
        // Calculated pricing values
        totalUnitsKwh: pricingResult.totalUnitsKwh,
        energyCost: pricingResult.energyCost,
        estimatedRange: pricingResult.estimatedRange,
        totalBill: pricingResult.totalBill,
        
        // Safety validation
        safetyAlert: pricingResult.safetyAlert,
        safetyAlertMessage: pricingResult.safetyAlertMessage,
        
        // Duration info
        requestedDuration: finalBookingDuration,
        
        status: 'pending',
        requestId
      });

      await bookingRequest.save();

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
          pricePerUnit: pricePerUnit,
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

    const endTime = new Date();
    const duration = Math.round((endTime - booking.startTime) / (1000 * 60));

    let finalEnergy = energyConsumed || booking.energyDelivered || 0;
    let finalCost = actualCost;

    if (!finalCost && finalEnergy > 0) {
      finalCost = pricingService.calculateTotalCost(finalEnergy, booking.pricePerKwh || booking.pricePerUnit);
    }

    booking.endTime = endTime;
    booking.actualDuration = duration;
    booking.energyConsumed = finalEnergy;
    booking.actualCost = finalCost || 0;
    booking.status = 'completed';

    await booking.save();

    if (finalCost > 0) {
      const transaction = new Transaction({
        userId: req.user.id,
        type: 'debit',
        amount: finalCost,
        description: `Charging Session at ${booking.hostLocation}`,
        paymentMethod: 'direct',
        status: 'completed',
        referenceId: `TXN${Date.now()}${Math.random().toString(36).substr(2, 5).toUpperCase()}`,
        metadata: {
          bookingId: booking._id,
          location: booking.hostLocation,
          chargerId: booking.metadata?.chargerId,
          energyConsumed: finalEnergy,
          pricePerKwh: booking.pricePerKwh || booking.pricePerUnit
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
        pricePerKwh: booking.pricePerKwh || booking.pricePerUnit
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
