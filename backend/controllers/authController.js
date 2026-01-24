const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { OAuth2Client } = require('google-auth-library');
const { verifyEmailAddress } = require('../services/emailService');

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

exports.signup = async (req, res) => {
  try {
    const { name, email, password, phone } = req.body;

    // Verify email address
    const emailVerification = await verifyEmailAddress(email);
    if (!emailVerification.valid) {
      return res.status(400).json({ msg: emailVerification.reason });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) return res.status(400).json({ msg: 'Email already exists' });

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = await User.create({ name, email, password: hashedPassword, phone });

    // Generate token for immediate login
    const token = jwt.sign({ id: newUser._id }, process.env.JWT_SECRET, { expiresIn: '7d' });
    
    res.status(201).json({ 
      msg: 'User created successfully',
      token,
      user: { id: newUser._id, name: newUser.name, email: newUser.email, role: newUser.role }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ msg: 'User not found' });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ msg: 'Invalid credentials' });

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });
    res.status(200).json({ token, user: { id: user._id, name: user.name, email: user.email, role: user.role } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    if (!user) {
      return res.status(404).json({ msg: 'User not found' });
    }
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.updateProfile = async (req, res) => {
  try {
    const { name, phone, location } = req.body;
    
    // Validate required fields
    if (!name || name.trim().length === 0) {
      return res.status(400).json({ msg: 'Name is required' });
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ msg: 'User not found' });
    }

    // Update user fields
    user.name = name.trim();
    if (phone) user.phone = phone.trim();
    if (location) user.location = location.trim();

    await user.save();

    // Return updated user without password
    const updatedUser = await User.findById(req.user.id).select('-password');
    res.json(updatedUser);

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Google OAuth login
exports.googleLogin = async (req, res) => {
  try {
    const { credential } = req.body;

    // Verify Google token
    const ticket = await client.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    const { sub: googleId, email, name, picture } = payload;

    // Check if user exists
    let user = await User.findOne({ 
      $or: [
        { googleId },
        { email }
      ]
    });

    if (user) {
      // Update Google ID if user exists but doesn't have it
      if (!user.googleId) {
        user.googleId = googleId;
        user.profilePicture = picture;
        await user.save();
      }
    } else {
      // Create new user
      user = await User.create({
        name,
        email,
        googleId,
        profilePicture: picture,
        // No password needed for Google users
        password: undefined
      });
    }

    // Generate JWT token
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });

    res.json({ 
      token, 
      user: { 
        id: user._id, 
        name: user.name, 
        email: user.email,
        role: user.role,
        profilePicture: user.profilePicture
      } 
    });

  } catch (err) {
    console.error('Google login error:', err);
    res.status(500).json({ error: 'Google authentication failed' });
  }
};

// Verify email endpoint
exports.verifyEmail = async (req, res) => {
  try {
    const { email } = req.body;
    
    const verification = await verifyEmailAddress(email);
    res.json(verification);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Add vehicle
exports.addVehicle = async (req, res) => {
  try {
    const { vehicleNumber, vehicleType, model, batteryCapacity } = req.body;

    // Validate required fields
    if (!vehicleNumber || !vehicleType || !model || !batteryCapacity) {
      return res.status(400).json({ msg: 'All fields are required' });
    }

    // Validate vehicle number format
    if (!/^[A-Z]{2}\d{2}[A-Z]{1,2}\d{4}$/i.test(vehicleNumber.replace(/\s/g, ''))) {
      return res.status(400).json({ msg: 'Invalid vehicle number format (e.g., MH02AB1234)' });
    }

    // Validate vehicle type
    const validTypes = ['sedan', 'suv', 'hatchback', 'truck', 'bike'];
    if (!validTypes.includes(vehicleType.toLowerCase())) {
      return res.status(400).json({ msg: 'Invalid vehicle type' });
    }

    // Validate battery capacity
    if (isNaN(batteryCapacity) || batteryCapacity <= 0) {
      return res.status(400).json({ msg: 'Battery capacity must be a positive number' });
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ msg: 'User not found' });
    }

    // Check if vehicle with same number already exists
    const vehicleExists = user.vehicles.some(v => v.vehicleNumber.toUpperCase() === vehicleNumber.toUpperCase());
    if (vehicleExists) {
      return res.status(400).json({ msg: 'Vehicle with this number already exists' });
    }

    // Add new vehicle
    const newVehicle = {
      vehicleNumber: vehicleNumber.toUpperCase(),
      vehicleType: vehicleType.toLowerCase(),
      model: model.trim(),
      batteryCapacity: parseFloat(batteryCapacity),
      createdAt: new Date()
    };

    user.vehicles.push(newVehicle);
    await user.save();

    res.status(201).json({
      success: true,
      vehicle: user.vehicles[user.vehicles.length - 1]
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get all vehicles for user
exports.getVehicles = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('vehicles');
    if (!user) {
      return res.status(404).json({ msg: 'User not found' });
    }

    res.json({ vehicles: user.vehicles || [] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Delete vehicle
exports.deleteVehicle = async (req, res) => {
  try {
    const { vehicleId } = req.params;

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ msg: 'User not found' });
    }

    // Find and remove vehicle
    const vehicleIndex = user.vehicles.findIndex(v => v._id.toString() === vehicleId);
    if (vehicleIndex === -1) {
      return res.status(404).json({ msg: 'Vehicle not found' });
    }

    user.vehicles.splice(vehicleIndex, 1);
    await user.save();

    res.json({
      success: true,
      msg: 'Vehicle deleted successfully'
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Host registration request
exports.requestHostRegistration = async (req, res) => {
  try {
    const { 
      companyName, 
      phone, 
      location, 
      numberOfChargers, 
      chargerTypes, 
      businessDescription 
    } = req.body;

    // Validate required fields
    if (!companyName || !phone || !numberOfChargers || !chargerTypes || chargerTypes.length === 0) {
      return res.status(400).json({ 
        success: false, 
        msg: 'Please provide all required information' 
      });
    }

    // Check if user already has a pending request
    const HostRegistrationRequest = require('../models/HostRegistrationRequest');
    const existingRequest = await HostRegistrationRequest.findOne({ 
      userId: req.user.id 
    });

    if (existingRequest && existingRequest.status === 'pending') {
      return res.status(400).json({ 
        success: false, 
        msg: 'You already have a pending host registration request' 
      });
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, msg: 'User not found' });
    }

    // Create host registration request
    const hostRequest = new HostRegistrationRequest({
      userId: req.user.id,
      email: user.email,
      name: user.name,
      phone: phone,
      companyName: companyName,
      location: location || {},
      numberOfChargers: numberOfChargers,
      chargerTypes: chargerTypes,
      businessDescription: businessDescription || '',
      status: 'pending'
    });

    await hostRequest.save();

    res.status(201).json({
      success: true,
      msg: 'Host registration request submitted successfully. Admin will review your request shortly.',
      requestId: hostRequest._id
    });

  } catch (err) {
    res.status(500).json({ 
      success: false, 
      error: err.message 
    });
  }
};

// Get host registration status
exports.getHostRegistrationStatus = async (req, res) => {
  try {
    const HostRegistrationRequest = require('../models/HostRegistrationRequest');
    
    const request = await HostRegistrationRequest.findOne({ 
      userId: req.user.id 
    }).select('-documents');

    if (!request) {
      return res.json({
        success: true,
        status: 'none',
        msg: 'No registration request found'
      });
    }

    res.json({
      success: true,
      status: request.status,
      request: request
    });

  } catch (err) {
    res.status(500).json({ 
      success: false, 
      error: err.message 
    });
  }
};

exports.checkUserType = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ msg: 'Email is required' });
    }

    // Check if user exists
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ msg: 'User not found', userType: 'user' });
    }

    // Determine user type based on role
    let userType = user.role || 'user';

    // If role is not set, check if they have a host registration request that's approved
    if (!user.role || user.role === 'user') {
      const HostRegistrationRequest = require('../models/HostRegistrationRequest');
      const hostRequest = await HostRegistrationRequest.findOne({ 
        userId: user._id, 
        status: 'approved' 
      });
      
      if (hostRequest) {
        userType = 'host';
      }
    }

    res.json({
      success: true,
      userType: userType,
      email: email
    });

  } catch (err) {
    res.status(500).json({ 
      success: false, 
      error: err.message 
    });
  }
};

