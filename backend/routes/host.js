const express = require('express');
const router = express.Router();
const Host = require('../models/Host');
const BookingRequest = require('../models/BookingRequest');
const ChargerStation = require('../models/ChargerStation');
const auth = require('../middleware/auth');
const { sendBookingConfirmationEmail } = require('../services/emailService');
const { uploadFile } = require('../services/imagekitService');
const { getNearbyHosts, getAllHosts, updateHostAvailability, toggleMapVisibility } = require('../controllers/hostController');
const {
  createChargerStation,
  getHostChargerStations,
  getNearbyChargerStations,
  updateChargerStation,
  updateAvailability,
  deleteChargerStation,
  getChargerStationDetails
} = require('../controllers/chargerController');

router.get('/nearby', getNearbyHosts);
router.get('/all', getAllHosts);

// ===== CHARGER STATION MANAGEMENT (moved from charger.js) =====
router.get('/chargers/nearby', getNearbyChargerStations);
router.post('/chargers', auth, createChargerStation);
router.get('/chargers/host/stations', auth, getHostChargerStations);
router.get('/chargers/:id', getChargerStationDetails);
router.put('/chargers/:id', auth, updateChargerStation);
router.patch('/chargers/:id/availability', auth, updateAvailability);
router.delete('/chargers/:id', auth, deleteChargerStation);

// ===== DOCUMENT UPLOAD =====
router.post('/upload-document', auth, async (req, res) => {
  try {
    if (!req.files || !req.files.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const file = req.files.file;

    const allowedMimeTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];
    
    if (!allowedMimeTypes.includes(file.mimetype)) {
      return res.status(400).json({ message: 'Only PDF and image files are allowed' });
    }

    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      return res.status(400).json({ message: 'File size must be less than 5MB' });
    }

    try {
      if (!file.data) {
        throw new Error('File data is empty or undefined');
      }

      const startUploadTime = Date.now();
      const fileUrl = await uploadFile(file.data, file.name, `chargeloop/host-documents/${req.user.id}`);
      
      return res.json({
        success: true,
        fileUrl,
        message: 'Document uploaded successfully'
      });
    } catch (uploadError) {
      const errorMsg = uploadError.message || uploadError;
      
      // Check if it's a timeout error
      const isTimeout = errorMsg.includes('timeout') || errorMsg.includes('timed out') || uploadError.name === 'AbortError';
      
      return res.status(isTimeout ? 408 : 500).json({
        message: isTimeout ? 'File upload timeout - please try again' : 'Failed to upload file to storage service',
        details: errorMsg
      });
    }
  } catch (error) {
    return res.status(500).json({
      message: 'Document upload failed',
      details: error.message
    });
  }
});

// ===== HOST PROFILE & AVAILABILITY =====
router.put('/:hostId/availability', auth, updateHostAvailability);
router.put('/:hostId/visibility', auth, toggleMapVisibility);

// ===== BOOKING MANAGEMENT FOR HOSTS =====
router.get('/booking-requests/pending', auth, async (req, res) => {
  try {
    const host = await Host.findOne({ userId: req.user.id });
    if (!host) {
      return res.status(404).json({ message: 'Host profile not found' });
    }

    const pendingRequests = await BookingRequest.find({
      hostId: host._id,
      status: 'pending'
    })
      .populate('userId', 'name email phone')
      .sort({ createdAt: -1 })
      .lean();

    res.json({
      success: true,
      requests: pendingRequests,
      count: pendingRequests.length,
      hostId: host._id.toString()
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

router.put('/requests/:requestId/accept', auth, async (req, res) => {
  try {
    const { requestId } = req.params;

    const request = await BookingRequest.findById(requestId).populate('userId', 'name email phone');

    if (!request) {
      return res.status(404).json({
        success: false,
        msg: 'Booking request not found or already processed'
      });
    }

    if (request.status === 'declined') {
      return res.status(400).json({
        success: false,
        msg: 'Cannot accept a declined request'
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
        request: {
          _id: request._id,
          requestId: request.requestId,
          status: 'accepted',
          alreadyAccepted: true
        }
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
        requiredEnergy: request.requiredEnergy || request.desiredKwh,
        bookingDuration: request.bookingDuration || request.requestedDuration,
        energyDelivered: request.energyDelivered,
        estimatedDuration: request.bookingDuration || request.requestedDuration,
        estimatedCost: request.actualCost || (request.energyDelivered * (request.pricePerKwh || request.pricePerUnit)),
        requestId: request.requestId,
        chargerPowerKw: request.chargerPowerKw,
        pricePerKwh: request.pricePerKwh || request.pricePerUnit
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
      request: {
        _id: request._id,
        requestId: request.requestId,
        status: 'accepted',
        scheduledTime: request.scheduledTime,
        requiredEnergy: request.requiredEnergy || request.desiredKwh,
        bookingDuration: request.bookingDuration || request.requestedDuration,
        energyDelivered: request.energyDelivered,
        estimatedCost: request.actualCost || (request.energyDelivered * (request.pricePerKwh || request.pricePerUnit))
      }
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
      msg: 'Failed to accept booking request'
    });
  }
});

router.put('/requests/:requestId/decline', auth, async (req, res) => {
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

    res.json({
      success: true,
      msg: 'Booking request declined successfully',
      request: {
        _id: request._id,
        requestId: request.requestId,
        status: 'declined',
        reason: reason || 'No reason provided'
      }
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

router.post('/register', auth, async (req, res) => {
  try {
    const {
      chargerType, pricePerHour, amenities, description,
      availableFrom, availableTo, coordinates, address, city, state, pincode
    } = req.body;

    const host = await Host.findOne({ userId: req.user.id });
    if (!host) {
      return res.status(404).json({ message: 'Host profile not found. Please submit registration form first.' });
    }

    if (host.verificationStatus === 'rejected') {
      return res.status(400).json({ message: 'Please resubmit your registration request' });
    }

    if (chargerType && !['Regular Charging (22kW)', 'Fast Charging (50kW)', 'Super Fast (100kW)', 'Ultra Fast (150kW)', 'Tesla Supercharger'].includes(chargerType)) {
      return res.status(400).json({ message: 'Invalid charger type' });
    }
    if (pricePerHour && (isNaN(pricePerHour) || pricePerHour <= 0)) {
      return res.status(400).json({ message: 'Price per hour must be positive' });
    }
    if (amenities && !Array.isArray(amenities)) {
      return res.status(400).json({ message: 'Amenities must be an array' });
    }

    if (chargerType) host.chargerType = chargerType;
    if (pricePerHour) host.pricePerHour = pricePerHour;
    if (amenities) host.amenities = amenities;
    if (description) host.description = description;
    if (availableFrom) host.availableFrom = availableFrom;
    if (availableTo) host.availableTo = availableTo;

    if (coordinates || address || city || state || pincode) {
      if (coordinates) {
        host.location.coordinates.lat = coordinates.lat;
        host.location.coordinates.lng = coordinates.lng;
      }
      if (address) host.location.address = address;
      if (city) host.location.city = city;
      if (state) host.location.state = state;
      if (pincode) host.location.pincode = pincode;
    }

    // Handle document uploads
    if (req.files) {
      const documentFields = {
        companyRegistration: 'companyRegistration',
        addressProofUrl: 'addressProofUrl',
        aadharCardUrl: 'aadharCardUrl',
        lightConnectionProofUrl: 'lightConnectionProofUrl'
      };
      
      for (const [fieldName, schemaField] of Object.entries(documentFields)) {
        if (req.files[fieldName]) {
          const file = req.files[fieldName];
          
          // Validate file type (PDF only)
          if (file.mimetype !== 'application/pdf' || !file.name.toLowerCase().endsWith('.pdf')) {
            return res.status(400).json({ message: `${fieldName} must be a PDF file` });
          }

          // Validate file size (max 5MB)
          const maxSize = 5 * 1024 * 1024;
          if (file.size > maxSize) {
            return res.status(400).json({ message: `${fieldName} file size must not exceed 5MB` });
          }

          try {
            const fileUrl = await uploadFile(file.data, file.name, '/host-documents');
            host.documents[schemaField] = fileUrl;
          } catch (uploadError) {
            return res.status(500).json({ message: `Failed to upload ${fieldName}: ${uploadError.message}` });
          }
        }
      }
    }

    await host.save();

    res.json({
      message: 'Host profile updated successfully',
      hostId: host._id,
      verificationStatus: host.verificationStatus,
      documents: host.documents
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

router.get('/profile', auth, async (req, res) => {
  try {
    const host = await Host.findOne({ userId: req.user.id });
    if (!host) {
      return res.status(404).json({ message: 'Host profile not found' });
    }
    res.json(host);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

router.get('/bookings', auth, async (req, res) => {
  try {
    const host = await Host.findOne({ userId: req.user.id });
    if (!host) {
      return res.status(404).json({ message: 'Host profile not found' });
    }

    const bookings = await BookingRequest.find({ hostId: host._id })
      .populate('userId', 'name phone')
      .sort({ createdAt: -1 });

    const stats = {
      totalBookings: host.totalBookings || 0,
      totalEarnings: host.totalEarnings || 0,
      activeBookings: bookings.filter(b => b.status === 'ongoing').length,
      averageRating: host.rating.average || 0
    };

    const formattedBookings = bookings.map(booking => ({
      _id: booking._id,
      customerName: booking.userId?.name || 'Unknown',
      customerPhone: booking.userId?.phone || 'N/A',
      startTime: booking.startTime,
      endTime: booking.endTime,
      duration: booking.duration,
      amount: booking.cost,
      status: booking.status,
      vehicleNumber: booking.vehicleNumber || 'N/A',
      energyConsumed: booking.energyConsumed || 0,
      rating: booking.rating
    }));

    res.json({ bookings: formattedBookings, stats });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

router.put('/bookings/:bookingId/status', auth, async (req, res) => {
  try {
    const { bookingId } = req.params;
    const { status } = req.body;

    const host = await Host.findOne({ userId: req.user.id });
    if (!host) {
      return res.status(404).json({ message: 'Host profile not found' });
    }

    const booking = await BookingRequest.findOne({
      _id: bookingId,
      hostId: host._id
    }).populate('userId', 'name email phone');

    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    if (status === 'accepted' && booking.status === 'pending') {
      const bookingDetails = {
        userName: booking.userId?.name || 'Customer',
        chargerType: booking.chargerType,
        hostName: booking.hostName,
        hostLocation: booking.hostLocation,
        scheduledTime: booking.scheduledTime,
        requiredEnergy: booking.requiredEnergy || booking.desiredKwh,
        bookingDuration: booking.bookingDuration || booking.requestedDuration,
        energyDelivered: booking.energyDelivered,
        estimatedDuration: booking.bookingDuration || booking.requestedDuration,
        estimatedCost: booking.actualCost || (booking.energyDelivered * (booking.pricePerKwh || booking.pricePerUnit)),
        requestId: booking.requestId,
        chargerPowerKw: booking.chargerPowerKw,
        pricePerKwh: booking.pricePerKwh || booking.pricePerUnit
      };

      try {
        await sendBookingConfirmationEmail(booking.userId?.email, bookingDetails);
        console.log('Booking confirmation email sent to:', booking.userId?.email);
      } catch (emailError) {
        console.error('Error sending booking confirmation email:', emailError.message);
      }

      booking.hostResponse = {
        respondedAt: new Date(),
        acceptedAt: new Date()
      };
    }

    booking.status = status;

    if (status === 'completed' && !booking.endTime) {
      booking.endTime = new Date();
      booking.actualDuration = Math.ceil((booking.endTime - booking.startTime) / (1000 * 60));
      booking.actualCost = Math.ceil((booking.actualDuration / 60) * host.pricePerHour);

      host.totalEarnings += booking.actualCost;
      host.totalBookings += 1;
      await host.save();
    }

    await booking.save();
    res.json({
      message: 'Booking status updated successfully',
      booking: {
        _id: booking._id,
        status: booking.status,
        requestId: booking.requestId
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

router.put('/toggle-availability', auth, async (req, res) => {
  try {
    const host = await Host.findOne({ userId: req.user.id });
    if (!host) {
      return res.status(404).json({ message: 'Host profile not found' });
    }

    host.available = !host.available;
    await host.save();

    res.json({ available: host.available, message: `Charger is now ${host.available ? 'available' : 'unavailable'}` });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

router.put('/profile', auth, async (req, res) => {
  try {
    const host = await Host.findOne({ userId: req.user.id });
    if (!host) {
      return res.status(404).json({ message: 'Host profile not found' });
    }

    const allowedUpdates = [
      'hostName', 'email', 'phone', 'pricePerHour', 'amenities',
      'description', 'availableFrom', 'availableTo'
    ];

    allowedUpdates.forEach(update => {
      if (req.body[update] !== undefined) {
        host[update] = req.body[update];
      }
    });

    await host.save();
    
    // Return the updated host object directly (consistent with user profile endpoint)
    const updatedHost = await Host.findById(host._id);
    res.json(updatedHost);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

router.get('/booking-requests/history', auth, async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const host = await Host.findOne({ userId: req.user.id });

    if (!host) {
      return res.status(404).json({ message: 'Host profile not found' });
    }

    const query = { hostId: host._id };
    if (status) {
      query.status = status;
    }

    const total = await BookingRequest.countDocuments(query);
    const requests = await BookingRequest.find(query)
      .populate('userId', 'name email phone')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .lean();

    res.json({
      success: true,
      requests: requests,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / limit),
        total: total
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;
