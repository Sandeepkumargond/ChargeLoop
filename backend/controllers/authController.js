const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { OAuth2Client } = require('google-auth-library');
const { verifyEmailAddress } = require('../services/emailService');

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

exports.signup = async (req, res) => {
  try {
    const { name, email, password, phone, userType } = req.body;

    // Verify email address
    const emailVerification = await verifyEmailAddress(email);
    if (!emailVerification.valid) {
      return res.status(400).json({ msg: emailVerification.reason });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) return res.status(400).json({ msg: 'Email already exists' });

    // Determine role based on userType
    const role = userType === 'host' ? 'host' : 'user';

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = await User.create({ name, email, password: hashedPassword, phone, role });

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
    const { email, password, loginType } = req.body;

    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ msg: 'User not found' });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ msg: 'Invalid credentials' });

    // Strict role validation - one email can only have one role
    if (loginType === 'host') {
      if (user.role !== 'host') {
        return res.status(400).json({ 
          msg: `This email is registered as a ${user.role}, not a host. Please login as ${user.role}.`,
          correctRole: user.role 
        });
      }
    } else if (loginType === 'admin') {
      if (user.role !== 'admin') {
        return res.status(400).json({ 
          msg: `This email is registered as a ${user.role}, not an admin. Please login as ${user.role}.`,
          correctRole: user.role 
        });
      }
    } else if (loginType === 'user') {
      if (user.role !== 'user') {
        return res.status(400).json({ 
          msg: `This email is registered as a ${user.role}, not a user. Please login as ${user.role}.`,
          correctRole: user.role 
        });
      }
    }

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });
    res.status(200).json({ 
      token, 
      user: { 
        id: user._id, 
        name: user.name, 
        email: user.email, 
        role: user.role 
      } 
    });
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
    const { credential, loginType } = req.body;

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

      // Validate role matches login type
      if (loginType === 'host' && user.role !== 'host') {
        return res.status(400).json({ msg: 'User not found' });
      }
      
      if (loginType === 'admin' && user.role !== 'admin') {
        return res.status(400).json({ msg: 'User not found' });
      }
      
      if (loginType === 'user' && user.role !== 'user') {
        return res.status(400).json({ msg: 'User not found' });
      }
    } else {
      // Create new user - default role based on loginType
      const defaultRole = loginType === 'host' ? 'host' : (loginType === 'admin' ? 'admin' : 'user');
      
      user = await User.create({
        name,
        email,
        googleId,
        profilePicture: picture,
        role: defaultRole,
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

// Host registration request - Creates Host document with pending status
exports.requestHostRegistration = async (req, res) => {
  try {
    const Host = require('../models/Host');
    const { 
      name,
      mobile,
      address,
      latitude,
      longitude,
      addressProofUrl,
      aadharCardUrl,
      lightConnectionProofUrl,
      companyName, 
      phone, 
      location, 
      numberOfChargers, 
      chargerTypes, 
      businessDescription 
    } = req.body;

    // Validate required fields with specific error messages
    if (!name) {
      return res.status(400).json({ success: false, msg: 'Name is required' });
    }
    if (!mobile) {
      return res.status(400).json({ success: false, msg: 'Mobile is required' });
    }
    if (!address) {
      return res.status(400).json({ success: false, msg: 'Address is required' });
    }
    if (latitude === undefined || latitude === null || latitude === '') {
      return res.status(400).json({ success: false, msg: 'Latitude is required' });
    }
    if (longitude === undefined || longitude === null || longitude === '') {
      return res.status(400).json({ success: false, msg: 'Longitude is required' });
    }
    if (!addressProofUrl) {
      return res.status(400).json({ success: false, msg: 'Address proof URL is required' });
    }
    if (!aadharCardUrl) {
      return res.status(400).json({ success: false, msg: 'Aadhar card URL is required' });
    }
    if (!lightConnectionProofUrl) {
      return res.status(400).json({ success: false, msg: 'Light connection proof URL is required' });
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, msg: 'User not found' });
    }

    // Check if user already has a pending/approved host registration
    const existingHost = await Host.findOne({ 
      userId: req.user.id 
    });

    if (existingHost) {
      if (existingHost.verificationStatus === 'pending') {
        return res.status(400).json({ 
          success: false, 
          msg: 'You already have a pending host registration request' 
        });
      }
      if (existingHost.verificationStatus === 'approved') {
        return res.status(400).json({ 
          success: false, 
          msg: 'You are already registered as an approved host' 
        });
      }
      // If rejected, allow resubmission - delete old record
      if (existingHost.verificationStatus === 'rejected') {
        await Host.deleteOne({ _id: existingHost._id });
      }
    }

    // Create Host document with pending status
    const newHost = new Host({
      userId: req.user.id,
      hostName: name || user.name,
      email: user.email,
      phone: mobile || phone,
      location: {
        address: address,
        city: location?.city || '',
        state: location?.state || '',
        pincode: location?.pincode || '',
        coordinates: {
          lat: parseFloat(latitude),
          lng: parseFloat(longitude)
        }
      },
      chargerType: chargerTypes && chargerTypes[0] ? chargerTypes[0] : 'Regular Charging (22kW)',
      pricePerHour: 0, // Will be set later
      amenities: [],
      description: businessDescription || '',
      verificationStatus: 'pending',
      isVerified: false,
      isActive: false, // Not discoverable until approved
      documents: {
        companyRegistration: companyName,
        addressProofUrl: addressProofUrl,
        aadharCardUrl: aadharCardUrl,
        lightConnectionProofUrl: lightConnectionProofUrl
      }
    });

    await newHost.save();

    res.status(201).json({
      success: true,
      msg: 'Host registration request submitted successfully. Admin will review your request shortly.',
      requestId: newHost._id,
      hostId: newHost._id
    });

  } catch (err) {
    res.status(500).json({ 
      success: false, 
      msg: err.message 
    });
  }
};

// Get host registration status
exports.getHostRegistrationStatus = async (req, res) => {
  try {
    const Host = require('../models/Host');
    
    const host = await Host.findOne({ 
      userId: req.user.id 
    });

    if (!host) {
      return res.json({
        success: true,
        status: 'none',
        msg: 'No host registration found'
      });
    }

    res.json({
      success: true,
      status: host.verificationStatus,
      hostId: host._id,
      host: {
        _id: host._id,
        hostName: host.hostName,
        verificationStatus: host.verificationStatus,
        isVerified: host.isVerified,
        rejectionReason: host.rejectionReason,
        isVisibleOnMap: host.isVisibleOnMap,
        email: host.email,
        phone: host.phone,
        chargerType: host.chargerType,
        pricePerHour: host.pricePerHour,
        location: host.location
      }
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

    // Return the actual role from the database - one email = one role only
    const userType = user.role || 'user';

    res.json({
      success: true,
      userType: userType,
      email: email,
      role: user.role
    });

  } catch (err) {
    res.status(500).json({ 
      success: false, 
      error: err.message 
    });
  }
};

