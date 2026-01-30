const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { OAuth2Client } = require('google-auth-library');
const { verifyEmailAddress, sendOtpEmail } = require('../services/emailService');

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

exports.signup = async (req, res) => {
  try {
    const { name, email, password, phone, userType } = req.body;

    const emailVerification = await verifyEmailAddress(email);
    if (!emailVerification.valid) {
      return res.status(400).json({ msg: emailVerification.reason });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) return res.status(400).json({ msg: 'Email already exists' });

    const role = userType === 'host' ? 'host' : 'user';

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = await User.create({ name, email, password: hashedPassword, phone, role });

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

    if (loginType === 'host') {
      if (user.role !== 'host') {
        return res.status(400).json({
          msg: 'User not found'
        });
      }
    } else if (loginType === 'admin') {
      if (user.role !== 'admin') {
        return res.status(400).json({
          msg: 'User not found'
        });
      }
    } else if (loginType === 'user') {
      if (user.role !== 'user') {
        return res.status(400).json({
          msg: 'User not found'
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

    if (!name || name.trim().length === 0) {
      return res.status(400).json({ msg: 'Name is required' });
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ msg: 'User not found' });
    }

    user.name = name.trim();
    if (phone) user.phone = phone.trim();
    if (location) user.location = location.trim();

    await user.save();

    const updatedUser = await User.findById(req.user.id).select('-password');
    res.json(updatedUser);

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.googleLogin = async (req, res) => {
  try {
    const { credential, loginType } = req.body;

    const ticket = await client.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    const { sub: googleId, email, name, picture } = payload;

    let user = await User.findOne({
      $or: [
        { googleId },
        { email }
      ]
    });

    if (user) {

      if (!user.googleId) {
        user.googleId = googleId;
        user.profilePicture = picture;
        await user.save();
      }

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

      const defaultRole = loginType === 'host' ? 'host' : (loginType === 'admin' ? 'admin' : 'user');

      user = await User.create({
        name,
        email,
        googleId,
        profilePicture: picture,
        role: defaultRole,

        password: undefined
      });
    }

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

exports.verifyEmail = async (req, res) => {
  try {
    const { email } = req.body;

    const verification = await verifyEmailAddress(email);
    res.json(verification);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.addVehicle = async (req, res) => {
  try {
    const { vehicleNumber, vehicleType, model, batteryCapacity } = req.body;

    if (!vehicleNumber || !vehicleType || !model || !batteryCapacity) {
      return res.status(400).json({ msg: 'All fields are required' });
    }

    if (!/^[A-Z]{2}\d{2}[A-Z]{1,2}\d{4}$/i.test(vehicleNumber.replace(/\s/g, ''))) {
      return res.status(400).json({ msg: 'Invalid vehicle number format (e.g., MH02AB1234)' });
    }

    const validTypes = ['sedan', 'suv', 'hatchback', 'truck', 'bike'];
    if (!validTypes.includes(vehicleType.toLowerCase())) {
      return res.status(400).json({ msg: 'Invalid vehicle type' });
    }

    if (isNaN(batteryCapacity) || batteryCapacity <= 0) {
      return res.status(400).json({ msg: 'Battery capacity must be a positive number' });
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ msg: 'User not found' });
    }

    const vehicleExists = user.vehicles.some(v => v.vehicleNumber.toUpperCase() === vehicleNumber.toUpperCase());
    if (vehicleExists) {
      return res.status(400).json({ msg: 'Vehicle with this number already exists' });
    }

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

exports.deleteVehicle = async (req, res) => {
  try {
    const { vehicleId } = req.params;

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ msg: 'User not found' });
    }

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

      if (existingHost.verificationStatus === 'rejected') {
        await Host.deleteOne({ _id: existingHost._id });
      }
    }

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
      pricePerHour: 0,
      amenities: [],
      description: businessDescription || '',
      verificationStatus: 'pending',
      isVerified: false,
      isActive: false,
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

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ msg: 'User not found', userType: 'user' });
    }

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

exports.sendOtp = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ msg: 'Email is required' });
    }

    const emailVerification = await verifyEmailAddress(email);
    if (!emailVerification.valid) {
      return res.status(400).json({ msg: emailVerification.reason });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ msg: 'Email already exists' });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000);

    const emailResult = await sendOtpEmail(email, otp);

    if (!emailResult.success) {
      return res.status(500).json({ msg: 'Failed to send OTP email' });
    }

    if (!global.otpStore) {
      global.otpStore = {};
    }

    global.otpStore[email] = {
      otp,
      expiry: otpExpiry,
      attempts: 0
    };

    res.status(200).json({
      msg: 'OTP sent successfully to your email',
      success: true
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.verifyOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({ msg: 'Email and OTP are required' });
    }

    if (!global.otpStore || !global.otpStore[email]) {
      return res.status(400).json({ msg: 'OTP not found or expired. Please request a new OTP' });
    }

    const storedOtp = global.otpStore[email];

    if (new Date() > storedOtp.expiry) {
      delete global.otpStore[email];
      return res.status(400).json({ msg: 'OTP has expired. Please request a new one' });
    }

    if (storedOtp.attempts >= 5) {
      delete global.otpStore[email];
      return res.status(400).json({ msg: 'Too many failed attempts. Please request a new OTP' });
    }

    if (storedOtp.otp !== otp) {
      storedOtp.attempts += 1;
      return res.status(400).json({ msg: 'Invalid OTP' });
    }

    delete global.otpStore[email];

    const verificationToken = jwt.sign({ email, otpVerified: true }, process.env.JWT_SECRET, { expiresIn: '30m' });

    res.status(200).json({
      msg: 'OTP verified successfully',
      success: true,
      verificationToken
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.completeSignup = async (req, res) => {
  try {
    const { name, email, password, phone, userType, verificationToken } = req.body;

    if (!verificationToken) {
      return res.status(401).json({ msg: 'Verification token is required' });
    }

    if (!phone || phone.trim().length === 0) {
      return res.status(400).json({ msg: 'Phone number is required' });
    }

    if (phone.includes('@') || phone === email) {
      return res.status(400).json({ msg: 'Invalid phone number - cannot be an email address' });
    }

    let decoded;
    try {
      decoded = jwt.verify(verificationToken, process.env.JWT_SECRET);
    } catch (err) {
      console.error('Token verification error:', err.message);
      return res.status(401).json({ msg: 'Invalid or expired verification token' });
    }

    if (!decoded.otpVerified) {
      return res.status(401).json({ msg: 'Email not verified with OTP' });
    }

    if (decoded.email !== email) {
      return res.status(401).json({ msg: 'Email mismatch - token was created for different email' });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ msg: 'Email already exists' });
    }

    const role = userType === 'host' ? 'host' : 'user';

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await User.create({
      name,
      email,
      password: hashedPassword,
      phone: phone.trim(),
      role,
      emailVerified: true,
      otpVerified: true
    });

    const token = jwt.sign({ id: newUser._id }, process.env.JWT_SECRET, { expiresIn: '7d' });

    res.status(201).json({
      msg: 'User created successfully',
      token,
      user: {
        id: newUser._id,
        name: newUser.name,
        email: newUser.email,
        phone: newUser.phone,
        role: newUser.role
      }
    });
  } catch (err) {
    console.error('CompleteSignup error:', err.message);
    res.status(500).json({ error: err.message });
  }
};

exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ msg: 'Email is required' });
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(400).json({ msg: 'User not found' });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpiry = new Date(Date.now() + 15 * 60 * 1000);

    const emailResult = await sendOtpEmail(email, otp);
    if (!emailResult.success) {
      return res.status(500).json({ msg: 'Failed to send OTP email' });
    }

    user.otp = otp;
    user.otpExpiry = otpExpiry;
    user.otpVerified = false;
    await user.save();

    res.status(200).json({
      msg: 'OTP sent successfully to your email',
      success: true
    });
  } catch (err) {
    console.error('Forgot password error:', err.message);
    res.status(500).json({ error: err.message });
  }
};

exports.verifyOtpForReset = async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({ msg: 'Email and OTP are required' });
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(400).json({ msg: 'User not found' });
    }

    if (!user.otp || !user.otpExpiry) {
      return res.status(400).json({ msg: 'OTP not found. Please request a new OTP' });
    }

    if (new Date() > user.otpExpiry) {
      user.otp = undefined;
      user.otpExpiry = undefined;
      await user.save();
      return res.status(400).json({ msg: 'OTP has expired. Please request a new OTP' });
    }

    if (user.otp !== otp) {
      return res.status(400).json({ msg: 'Invalid OTP' });
    }

    user.otpVerified = true;
    await user.save();

    res.status(200).json({
      msg: 'OTP verified successfully',
      success: true
    });
  } catch (err) {
    console.error('Verify OTP error:', err.message);
    res.status(500).json({ error: err.message });
  }
};

exports.resetPassword = async (req, res) => {
  try {
    const { email, newPassword, confirmPassword } = req.body;

    if (!email || !newPassword || !confirmPassword) {
      return res.status(400).json({ msg: 'All fields are required' });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({ msg: 'Passwords do not match' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ msg: 'Password must be at least 6 characters long' });
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(400).json({ msg: 'User not found' });
    }

    if (!user.otpVerified) {
      return res.status(400).json({ msg: 'Please verify OTP first' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    user.password = hashedPassword;
    user.otp = undefined;
    user.otpExpiry = undefined;
    user.otpVerified = false;
    await user.save();

    res.status(200).json({
      msg: 'Password reset successfully',
      success: true
    });
  } catch (err) {
    console.error('Reset password error:', err.message);
    res.status(500).json({ error: err.message });
  }
};
