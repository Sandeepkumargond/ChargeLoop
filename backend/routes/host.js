const express = require('express');
const router = express.Router();
const Host = require('../models/Host');
const ChargingSession = require('../models/ChargingSession');
const auth = require('../middleware/auth');
const { sendHostOnboardingEmail } = require('../services/emailService');
const { getNearbyHosts, getAllHosts, updateHostAvailability } = require('../controllers/hostController');

// New real-time host endpoints
router.get('/nearby', getNearbyHosts);
router.get('/all', getAllHosts);
router.put('/:hostId/availability', auth, updateHostAvailability);

// Register as a host
router.post('/register', auth, async (req, res) => {
  try {
    const {
      hostName, email, phone, address, city, state, pincode,
      chargerType, pricePerHour, amenities, description,
      availableFrom, availableTo, coordinates
    } = req.body;

    // Check if user is already a host
    const existingHost = await Host.findOne({ userId: req.user.id });
    if (existingHost) {
      return res.status(400).json({ message: 'You are already registered as a host' });
    }

    // Validate coordinates
    if (!coordinates || typeof coordinates.lat !== 'number' || typeof coordinates.lng !== 'number' || isNaN(coordinates.lat) || isNaN(coordinates.lng)) {
      console.error('Invalid coordinates in registration:', coordinates);
      return res.status(400).json({ message: 'Please provide valid latitude and longitude.' });
    }
    // Validate phone
    if (!phone || typeof phone !== 'string' || phone.trim().length < 10) {
      console.error('Invalid phone in registration:', phone);
      return res.status(400).json({ message: 'Please provide a valid phone number.' });
    }
    // Validate amenities
    if (!Array.isArray(amenities)) {
      console.error('Invalid amenities in registration:', amenities);
      return res.status(400).json({ message: 'Amenities must be an array.' });
    }

    // Log payload for debugging
    console.log('Registering new host with payload:', {
      userId: req.user.id,
      hostName,
      email,
      phone,
      location: {
        address,
        city,
        state,
        pincode,
        coordinates
      },
      chargerType,
      pricePerHour,
      amenities,
      description,
      availableFrom,
      availableTo,
      isActive: true
    });

    const newHost = new Host({
      userId: req.user.id,
      hostName,
      email,
      phone,
      location: {
        address,
        city,
        state,
        pincode,
        coordinates: {
          lat: coordinates.lat,
          lng: coordinates.lng
        }
      },
      chargerType,
      pricePerHour,
      amenities: amenities || [],
      description,
      availableFrom,
      availableTo,
      verificationStatus: 'pending', // Set as pending for admin approval
      isActive: false // Host won't be discoverable until approved
    });

    try {
      await newHost.save();
    } catch (dbError) {
      console.error('Error saving new host to DB:', dbError);
      return res.status(500).json({ message: 'Server error', error: dbError.message });
    }
    
    // Send onboarding email
    try {
      await sendHostOnboardingEmail({
        hostName,
        email,
        phone,
        chargerType,
        pricePerHour,
        location: { address }
      });
      console.log('Onboarding email sent successfully to:', email);
    } catch (emailError) {
      console.error('Failed to send onboarding email:', emailError);
      // Don't fail the registration if email fails
    }
    
    res.status(201).json({ 
      message: 'Host registration successful! Your application is now pending admin approval. You will be notified once verified.', 
      hostId: newHost._id,
      verificationStatus: 'pending'
    });
  } catch (error) {
    console.error('Error registering host:', error);
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
    console.error('Error fetching host profile:', error);
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

    const bookings = await ChargingSession.find({ hostId: host._id })
      .populate('userId', 'name phone')
      .sort({ startTime: -1 });

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
    console.error('Error fetching host bookings:', error);
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

    const booking = await ChargingSession.findOne({ 
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
    console.error('Error updating booking status:', error);
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
    console.error('Error toggling availability:', error);
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
    console.error('Error updating host profile:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
