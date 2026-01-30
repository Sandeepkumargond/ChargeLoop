const User = require('../models/User');
const jwt = require('jsonwebtoken');

const adminAuth = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({ 
        message: 'Authentication required',
        code: 'AUTH_REQUIRED'
      });
    }

    if (!req.user.id) {
      return res.status(401).json({ 
        message: 'Invalid user context',
        code: 'INVALID_USER_CONTEXT'
      });
    }

    const user = await User.findById(req.user.id).select('role email');
    
    if (!user) {
      return res.status(401).json({ 
        message: 'User not found',
        code: 'USER_NOT_FOUND'
      });
    }
    
    if (user.role !== 'admin') {
      return res.status(403).json({ 
        message: 'Admin access required',
        code: 'INSUFFICIENT_PERMISSIONS',
        requiredRole: 'admin',
        userRole: user.role
      });
    }

    req.user.role = user.role;
    req.user.email = user.email;
    next();
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      return res.status(401).json({ 
        message: 'Invalid token',
        code: 'INVALID_TOKEN'
      });
    }
    res.status(500).json({ 
      message: 'Server error',
      code: 'SERVER_ERROR'
    });
  }
};

module.exports = adminAuth;
