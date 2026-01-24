const Host = require('../models/Host');
const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Get all pending hosts for verification
const getPendingHosts = async (req, res) => {
  try {
    const pendingHosts = await Host.find({ verificationStatus: 'pending' })
      .populate('userId', 'name email phone profilePicture')
      .sort({ createdAt: -1 });

    res.json({ hosts: pendingHosts });
  } catch (error) {
    console.error('Error fetching pending hosts:', error);
    res.status(500).json({ message: 'Failed to fetch pending hosts' });
  }
};

// Get all hosts with their verification status
const getAllHostsForAdmin = async (req, res) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;
    const skip = (page - 1) * limit;
    
    let filter = {};
    if (status && ['pending', 'approved', 'rejected'].includes(status)) {
      filter.verificationStatus = status;
    }

    const hosts = await Host.find(filter)
      .populate('userId', 'name email phone profilePicture')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const totalHosts = await Host.countDocuments(filter);

    res.json({ 
      hosts, 
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(totalHosts / limit),
        totalHosts,
        hasNext: page * limit < totalHosts,
        hasPrev: page > 1
      }
    });
  } catch (error) {
    console.error('Error fetching hosts for admin:', error);
    res.status(500).json({ message: 'Failed to fetch hosts' });
  }
};

// Approve a host
const approveHost = async (req, res) => {
  try {
    const { hostId } = req.params;
    
    const host = await Host.findById(hostId).populate('userId', 'name email');
    if (!host) {
      return res.status(404).json({ message: 'Host not found' });
    }

    if (host.verificationStatus !== 'pending') {
      return res.status(400).json({ 
        message: `Host is already ${host.verificationStatus}` 
      });
    }

    // Update host status
    host.verificationStatus = 'approved';
    host.isVerified = true;
    host.isActive = true; // Make host discoverable
    host.rejectionReason = undefined; // Clear any previous rejection reason
    await host.save();

    // You could send an approval email here
    console.log(`Host ${host.hostName} (${host.email}) has been approved by admin`);

    res.json({ 
      message: 'Host approved successfully', 
      host: {
        id: host._id,
        hostName: host.hostName,
        email: host.email,
        verificationStatus: host.verificationStatus
      }
    });
  } catch (error) {
    console.error('Error approving host:', error);
    res.status(500).json({ message: 'Failed to approve host' });
  }
};

// Reject a host
const rejectHost = async (req, res) => {
  try {
    const { hostId } = req.params;
    const { reason } = req.body;
    
    if (!reason || reason.trim().length === 0) {
      return res.status(400).json({ message: 'Rejection reason is required' });
    }

    const host = await Host.findById(hostId).populate('userId', 'name email');
    if (!host) {
      return res.status(404).json({ message: 'Host not found' });
    }

    if (host.verificationStatus !== 'pending') {
      return res.status(400).json({ 
        message: `Host is already ${host.verificationStatus}` 
      });
    }

    // Update host status
    host.verificationStatus = 'rejected';
    host.isVerified = false;
    host.rejectionReason = reason.trim();
    await host.save();

    // You could send a rejection email here
    console.log(`Host ${host.hostName} (${host.email}) has been rejected by admin. Reason: ${reason}`);

    res.json({ 
      message: 'Host rejected successfully', 
      host: {
        id: host._id,
        hostName: host.hostName,
        email: host.email,
        verificationStatus: host.verificationStatus,
        rejectionReason: host.rejectionReason
      }
    });
  } catch (error) {
    console.error('Error rejecting host:', error);
    res.status(500).json({ message: 'Failed to reject host' });
  }
};

// Get all users for admin
const getAllUsers = async (req, res) => {
  try {
    const { page = 1, limit = 10, role } = req.query;
    const skip = (page - 1) * limit;
    
    let filter = {};
    if (role && ['user', 'admin'].includes(role)) {
      filter.role = role;
    }

    const users = await User.find(filter)
      .select('-password') // Exclude password field
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const totalUsers = await User.countDocuments(filter);

    res.json({ 
      users, 
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(totalUsers / limit),
        totalUsers,
        hasNext: page * limit < totalUsers,
        hasPrev: page > 1
      }
    });
  } catch (error) {
    console.error('Error fetching users for admin:', error);
    res.status(500).json({ message: 'Failed to fetch users' });
  }
};

// Get admin dashboard statistics
const getAdminStats = async (req, res) => {
  try {
    const [
      totalHosts,
      pendingHosts,
      approvedHosts,
      rejectedHosts,
      totalUsers,
      totalAdmins
    ] = await Promise.all([
      Host.countDocuments(),
      Host.countDocuments({ verificationStatus: 'pending' }),
      Host.countDocuments({ verificationStatus: 'approved' }),
      Host.countDocuments({ verificationStatus: 'rejected' }),
      User.countDocuments({ role: 'user' }),
      User.countDocuments({ role: 'admin' })
    ]);

    res.json({
      totalHosts,
      pendingHosts,
      approvedHosts,
      rejectedHosts,
      totalUsers,
      totalAdmins
    });
  } catch (error) {
    console.error('Error fetching admin stats:', error);
    res.status(500).json({ message: 'Failed to fetch admin statistics' });
  }
};

// Simple admin login with just email and password
const adminLogin = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate required fields
    if (!email || !password) {
      return res.status(400).json({ 
        message: 'Email and password are required' 
      });
    }

    // Find user by email
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(401).json({ 
        message: 'Invalid credentials' 
      });
    }

    // Check if user is admin
    if (user.role !== 'admin') {
      return res.status(403).json({ 
        message: 'Admin access required' 
      });
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({ 
        message: 'Invalid credentials' 
      });
    }

    // Generate JWT token
    const token = jwt.sign(
      { 
        id: user._id,
        userId: user._id, 
        email: user.email, 
        role: user.role 
      },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    console.log(`Admin login successful for: ${email}`);

    res.json({
      message: 'Admin login successful',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });

  } catch (error) {
    console.error('Admin login error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Get all admins
const getAllAdmins = async (req, res) => {
  try {
    const admins = await User.find({ role: 'admin' })
      .select('-password')
      .sort({ createdAt: -1 });

    res.json({ 
      admins,
      count: admins.length
    });
  } catch (error) {
    console.error('Error fetching admins:', error);
    res.status(500).json({ message: 'Failed to fetch admins' });
  }
};

// Add new admin
const addAdmin = async (req, res) => {
  try {
    const { email, password, name } = req.body;

    // Validate required fields
    if (!email || !password) {
      return res.status(400).json({ 
        message: 'Email and password are required' 
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ 
        message: 'Invalid email format' 
      });
    }

    // Check if email already exists
    const existingAdmin = await User.findOne({ email: email.toLowerCase() });
    if (existingAdmin) {
      return res.status(400).json({ 
        message: 'Email already registered' 
      });
    }

    // Validate password length
    if (password.length < 6) {
      return res.status(400).json({ 
        message: 'Password must be at least 6 characters long' 
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create new admin
    const newAdmin = await User.create({
      name: name || email.split('@')[0],
      email: email.toLowerCase(),
      password: hashedPassword,
      role: 'admin',
      emailVerified: true,
      walletBalance: 0
    });

    res.status(201).json({ 
      message: 'Admin added successfully',
      admin: {
        id: newAdmin._id,
        name: newAdmin.name,
        email: newAdmin.email,
        role: newAdmin.role
      }
    });
  } catch (error) {
    console.error('Error adding admin:', error);
    res.status(500).json({ message: 'Failed to add admin' });
  }
};

// Delete admin (prevent deleting if only one admin exists)
const deleteAdmin = async (req, res) => {
  try {
    const { adminId } = req.params;

    // Get count of total admins
    const adminCount = await User.countDocuments({ role: 'admin' });
    
    // Prevent deleting if only one admin exists
    if (adminCount <= 1) {
      return res.status(400).json({ 
        message: 'Cannot delete the last admin. There must always be at least one admin.' 
      });
    }

    // Delete the admin
    const deletedAdmin = await User.findByIdAndDelete(adminId);
    
    if (!deletedAdmin) {
      return res.status(404).json({ 
        message: 'Admin not found' 
      });
    }

    res.json({ 
      message: 'Admin deleted successfully',
      deletedAdmin: {
        id: deletedAdmin._id,
        email: deletedAdmin.email
      }
    });
  } catch (error) {
    console.error('Error deleting admin:', error);
    res.status(500).json({ message: 'Failed to delete admin' });
  }
};

// Get pending host registration requests
const getPendingHostRegistrations = async (req, res) => {
  try {
    const HostRegistrationRequest = require('../models/HostRegistrationRequest');
    
    const requests = await HostRegistrationRequest.find({ status: 'pending' })
      .populate('userId', 'name email phone')
      .sort({ createdAt: -1 });

    res.json({ 
      success: true,
      requests: requests 
    });
  } catch (error) {
    console.error('Error fetching pending host registrations:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to fetch pending registrations' 
    });
  }
};

// Approve host registration request
const approveHostRegistration = async (req, res) => {
  try {
    const { requestId } = req.params;
    const { adminNotes } = req.body;
    const HostRegistrationRequest = require('../models/HostRegistrationRequest');
    const { sendHostApprovalEmail } = require('../services/emailService');

    const request = await HostRegistrationRequest.findById(requestId);
    if (!request) {
      return res.status(404).json({ 
        success: false,
        message: 'Host registration request not found' 
      });
    }

    // Update request status
    request.status = 'approved';
    request.approvedAt = new Date();
    if (adminNotes) {
      request.adminNotes = adminNotes;
    }
    await request.save();

    // Send approval email
    try {
      await sendHostApprovalEmail(request.email, request.name);
    } catch (emailError) {
      console.error('Error sending approval email:', emailError);
    }

    res.json({
      success: true,
      message: 'Host registration approved successfully',
      request: request
    });

  } catch (error) {
    console.error('Error approving host registration:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to approve host registration' 
    });
  }
};

// Deny host registration request
const denyHostRegistration = async (req, res) => {
  try {
    const { requestId } = req.params;
    const { denialReason } = req.body;
    const HostRegistrationRequest = require('../models/HostRegistrationRequest');
    const { sendHostDenialEmail } = require('../services/emailService');

    if (!denialReason) {
      return res.status(400).json({ 
        success: false,
        message: 'Denial reason is required' 
      });
    }

    const request = await HostRegistrationRequest.findById(requestId);
    if (!request) {
      return res.status(404).json({ 
        success: false,
        message: 'Host registration request not found' 
      });
    }

    // Update request status
    request.status = 'denied';
    request.deniedAt = new Date();
    request.denialReason = denialReason;
    await request.save();

    // Send denial email
    try {
      await sendHostDenialEmail(request.email, request.name, denialReason);
    } catch (emailError) {
      console.error('Error sending denial email:', emailError);
    }

    res.json({
      success: true,
      message: 'Host registration denied successfully',
      request: request
    });

  } catch (error) {
    console.error('Error denying host registration:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to deny host registration' 
    });
  }
};

module.exports = {
  getPendingHosts,
  getAllHostsForAdmin,
  getAllUsers,
  approveHost,
  rejectHost,
  getAdminStats,
  adminLogin,
  getAllAdmins,
  addAdmin,
  deleteAdmin,
  getPendingHostRegistrations,
  approveHostRegistration,
  denyHostRegistration
};