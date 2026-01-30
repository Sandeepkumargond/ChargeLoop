const helmet = require('helmet');
const mongoSanitize = require('mongo-sanitize');
const hpp = require('hpp');

const securityMiddleware = {
  helmet: helmet(),

  mongoSanitize: (req, res, next) => {
    if (req.body) {
      req.body = mongoSanitize(req.body);
    }
    if (req.params) {
      req.params = mongoSanitize(req.params);
    }
    if (req.query) {
      req.query = mongoSanitize(req.query);
    }
    next();
  },

  preventHttp: hpp({
    whitelist: ['sort', 'fields', 'filter', 'page', 'limit']
  }),

  requestValidator: (req, res, next) => {
    if (req.headers['content-type'] && !req.headers['content-type'].includes('application/json')) {
      if (req.method !== 'GET' && req.method !== 'HEAD' && req.method !== 'DELETE') {
        return res.status(415).json({
          msg: 'Unsupported Media Type. Use application/json',
          code: 'UNSUPPORTED_MEDIA_TYPE'
        });
      }
    }
    next();
  },

  securityHeaders: (req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
    res.setHeader('Content-Security-Policy', "default-src 'self'");
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
    next();
  },

  inputLengthValidator: (req, res, next) => {
    const MAX_STRING_LENGTH = 10000;
    const validateValue = (value) => {
      if (typeof value === 'string' && value.length > MAX_STRING_LENGTH) {
        throw new Error('Input string too long');
      }
      if (typeof value === 'object' && value !== null) {
        Object.values(value).forEach(v => validateValue(v));
      }
    };
    try {
      if (req.body) validateValue(req.body);
      if (req.query) validateValue(req.query);
      next();
    } catch (error) {
      res.status(400).json({
        msg: 'Input validation failed',
        code: 'INVALID_INPUT',
        details: error.message
      });
    }
  }
};

module.exports = securityMiddleware;
