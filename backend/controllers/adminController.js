const Host = require('../models/Host');
const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const getPendingHosts = async (req, res) => {
  try {
    const pendingHosts = await Host.find({ verificationStatus: 'pending' })
      .populate('userId', 'name email phone profilePicture')
      .sort({ createdAt: -1 });

    res.json({
      hosts: pendingHosts,
      count: pendingHosts.length
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch pending hosts' });
  }
};

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
    res.status(500).json({ message: 'Failed to fetch hosts' });
  }
};

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

    host.verificationStatus = 'approved';
    host.isVerified = true;
    host.isActive = true;
    host.rejectionReason = undefined;
    await host.save();

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
    res.status(500).json({ message: 'Failed to approve host' });
  }
};

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

    host.verificationStatus = 'rejected';
    host.isVerified = false;
    host.rejectionReason = reason.trim();
    await host.save();

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
    res.status(500).json({ message: 'Failed to reject host' });
  }
};

const getAllUsers = async (req, res) => {
  try {
    const { page = 1, limit = 10, role } = req.query;
    const skip = (page - 1) * limit;

    let filter = {};
    if (role && ['user', 'admin'].includes(role)) {
      filter.role = role;
    }

    const users = await User.find(filter)
      .select('-password')
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
    res.status(500).json({ message: 'Failed to fetch users' });
  }
};

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
    res.status(500).json({ message: 'Failed to fetch admin statistics' });
  }
};

const adminLogin = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        message: 'Email and password are required'
      });
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(401).json({
        message: 'Invalid credentials'
      });
    }

    if (user.role !== 'admin') {
      return res.status(401).json({
        message: 'User not found'
      });
    }

    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({
        message: 'Invalid credentials'
      });
    }

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

    user.lastLogin = new Date();
    await user.save();

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
    try {
      console.error('Admin login error:', error.message);
    } catch (e) {

    }
    res.status(500).json({
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? 'Check server logs' : undefined
    });
  }
};

const getAllAdmins = async (req, res) => {
  try {
    const admins = await User.find({ role: 'admin' }).select('-password');
    res.json({ admins });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch admins' });
  }
};

const addAdmin = async (req, res) => {
  try {
    const { email, password, name } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User with this email already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const admin = new User({
      name: name || email.split('@')[0],
      email,
      password: hashedPassword,
      role: 'admin'
    });

    await admin.save();
    res.json({ message: 'Admin added successfully', admin });
  } catch (error) {
    res.status(500).json({ message: 'Failed to add admin' });
  }
};

const deleteAdmin = async (req, res) => {
  try {
    const { adminId } = req.params;
    await User.findByIdAndDelete(adminId);
    res.json({ message: 'Admin deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to delete admin' });
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
  deleteAdmin
};
