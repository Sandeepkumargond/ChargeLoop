const express = require('express');
const router = express.Router();
const Host = require('../models/Host');
const BookingRequest = require('../models/BookingRequest');
const auth = require('../middleware/auth');
const { sendHostOnboardingEmail } = require('../services/emailService');
const { getNearbyHosts, getAllHosts, updateHostAvailability, toggleMapVisibility } = require('../controllers/hostController');

// New real-time host endpoints
router.get('/nearby', getNearbyHosts);
router.get('/all', getAllHosts);
router.put('/:hostId/availability', auth, updateHostAvailability);
router.put('/:hostId/visibility', auth, toggleMapVisibility);

// Update host profile with additional details (charger info, pricing, etc.)
// Can only be updated before admin approval or by host after approval for certain fields
router.post('/register', auth, async (req, res) => {
  try {
    const {
      chargerType, pricePerHour, amenities, description,
      availableFrom, availableTo, coordinates, address, city, state, pincode
    } = req.body;

    // Find existing host profile
    const host = await Host.findOne({ userId: req.user.id });
    if (!host) {
      return res.status(404).json({ message: 'Host profile not found. Please submit registration form first.' });
    }

    // Only allow updates if pending or approved
    if (host.verificationStatus === 'rejected') {
      return res.status(400).json({ message: 'Please resubmit your registration request' });
    }

    // Validate inputs
    if (chargerType && !['Regular Charging (22kW)', 'Fast Charging (50kW)', 'Super Fast (100kW)', 'Ultra Fast (150kW)', 'Tesla Supercharger'].includes(chargerType)) {
      return res.status(400).json({ message: 'Invalid charger type' });
    }
    if (pricePerHour && (isNaN(pricePerHour) || pricePerHour <= 0)) {
      return res.status(400).json({ message: 'Price per hour must be positive' });
    }
    if (amenities && !Array.isArray(amenities)) {
      return res.status(400).json({ message: 'Amenities must be an array' });
    }

    // Update fields
    if (chargerType) host.chargerType = chargerType;
    if (pricePerHour) host.pricePerHour = pricePerHour;
    if (amenities) host.amenities = amenities;
    if (description) host.description = description;
    if (availableFrom) host.availableFrom = availableFrom;
    if (availableTo) host.availableTo = availableTo;
    
    // Update location if provided
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

    await host.save();
    
    res.json({ 
      message: 'Host profile updated successfully', 
      hostId: host._id,
      verificationStatus: host.verificationStatus
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get host profile
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

// Get host bookings
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

    // Format bookings for frontend
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

// Update booking status
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
    });

    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    booking.status = status;
    
    // If completing the booking, set end time and update host earnings
    if (status === 'completed' && !booking.endTime) {
      booking.endTime = new Date();
      booking.duration = Math.ceil((booking.endTime - booking.startTime) / (1000 * 60)); // minutes
      booking.cost = Math.ceil((booking.duration / 60) * host.pricePerHour);
      
      // Update host earnings and booking count
      host.totalEarnings += booking.cost;
      host.totalBookings += 1;
      await host.save();
    }

    await booking.save();
    res.json({ message: 'Booking status updated successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Toggle host availability
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

// Update host profile
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
    res.json({ message: 'Profile updated successfully', host });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Get pending booking requests for host
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

// Get all booking requests history for host
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
