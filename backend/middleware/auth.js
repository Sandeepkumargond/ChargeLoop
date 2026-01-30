const jwt = require('jsonwebtoken');

const authMiddleware = (req, res, next) => {
  const token = req.header('Authorization')?.replace('Bearer ', '')?.trim();

  if (!token) {
    return res.status(401).json({ 
      msg: 'No token, authorization denied',
      code: 'NO_TOKEN'
    });
  }

  if (typeof token !== 'string' || token.length === 0) {
    return res.status(401).json({ 
      msg: 'Invalid token format',
      code: 'INVALID_TOKEN_FORMAT'
    });
  }

  try {
    if (!process.env.JWT_SECRET) {
      return res.status(500).json({ 
        msg: 'Server configuration error',
        code: 'CONFIG_ERROR'
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    if (!decoded.id) {
      return res.status(401).json({ 
        msg: 'Invalid token structure',
        code: 'INVALID_TOKEN_STRUCTURE'
      });
    }

    req.user = decoded;
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ 
        msg: 'Token has expired',
        code: 'TOKEN_EXPIRED',
        expiresAt: err.expiredAt
      });
    }
    if (err.name === 'JsonWebTokenError') {
      return res.status(401).json({ 
        msg: 'Token is not valid',
        code: 'INVALID_TOKEN'
      });
    }
    res.status(401).json({ 
      msg: 'Authentication failed',
      code: 'AUTH_FAILED'
    });
  }
};

module.exports = authMiddleware;
