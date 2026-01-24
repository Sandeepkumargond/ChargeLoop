const User = require('../models/User');

const adminAuth = async (req, res, next) => {
  try {
    // First check if user is authenticated (using existing auth middleware)
    if (!req.user) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    // Check if user has admin role
    const user = await User.findById(req.user.id);
    if (!user || user.role !== 'admin') {
      return res.status(403).json({ message: 'Admin access required' });
    }

    next();
  } catch (error) {
    console.error('Admin auth middleware error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = adminAuth;