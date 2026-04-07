const rateLimit = require('express-rate-limit');

/**
 * Express Rate Limit v7 - Scaled Configuration
 * Compatible with IPv6 and no deprecated options
 */
const createRateLimitConfig = (windowMs, maxRequests, message, keyGenerator) => {
  const config = {
    windowMs,
    max: maxRequests,
    message: { error: message },
    standardHeaders: true, // Return rate limit info in RateLimit-* headers
    legacyHeaders: false, // Disable X-RateLimit-* headers
    statusCode: 429,
    skip: (req) => {
      // Skip rate limiting for health checks
      return req.path === '/api/health';
    },
    handler: (req, res) => {
      // Custom error handler for rate limiting
      console.warn(`⚠️  Rate limited: ${req.method} ${req.path}`);
      res.status(429).json({
        error: message,
        retryAfter: req.rateLimit?.resetTime
      });
    }
  };

  // Only add keyGenerator if explicitly provided
  if (keyGenerator) {
    config.keyGenerator = keyGenerator;
  }
  // Otherwise, express-rate-limit v7 uses its default IPv6-safe implementation

  return rateLimit(config);
};

// Different limiters for different use cases
const scaledAuthLimiters = {
  // Signup: 50 per hour (per IP, email checked in app logic)
  signup: createRateLimitConfig(
    60 * 60 * 1000,
    50,
    'Too many signup attempts. Please try again later.'
  ),

  // Login: 30 per 15 minutes (per IP)
  login: createRateLimitConfig(
    15 * 60 * 1000,
    30,
    'Too many login attempts. Please try again later.'
  ),

  // OTP Send: 50 per 10 minutes (per IP)
  otpSend: createRateLimitConfig(
    10 * 60 * 1000,
    50,
    'Too many OTP requests. Please wait before requesting another.'
  ),

  // OTP Verify: 100 per 15 minutes (per IP, allows multiple retries)
  otpVerify: createRateLimitConfig(
    15 * 60 * 1000,
    100,
    'Too many OTP verification attempts. Please wait.'
  ),

  // Password reset: 20 per hour (per IP)
  passwordReset: createRateLimitConfig(
    60 * 60 * 1000,
    20,
    'Too many password reset attempts. Please try again later.'
  ),

  // Google login: 50 per hour (per IP)
  google: createRateLimitConfig(
    60 * 60 * 1000,
    50,
    'Too many Google login attempts. Please try again later.'
  )
};

// Host-specific limiters
const scaledHostLimiters = {
  // Charger registration: 100 per day (per IP)
  registerCharger: createRateLimitConfig(
    24 * 60 * 60 * 1000,
    100,
    'Too many charger registrations. Please try again tomorrow.'
  ),

  // Host registration: 20 per hour (per IP)
  registerHost: createRateLimitConfig(
    60 * 60 * 1000,
    20,
    'Too many host registration requests. Please try again later.'
  )
};

// User/Charging limiters
const scaledChargingLimiters = {
  // Booking: 100 per hour (per IP)
  booking: createRateLimitConfig(
    60 * 60 * 1000,
    100,
    'Too many booking requests. Please slow down.'
  ),

  // Payment: 50 per hour (per IP)
  payment: createRateLimitConfig(
    60 * 60 * 1000,
    50,
    'Too many payment attempts. Please try again later.'
  ),

  // Review submission: 20 per day (per IP)
  review: createRateLimitConfig(
    24 * 60 * 60 * 1000,
    20,
    'Too many reviews. Please try again tomorrow.'
  )
};

// Admin limiters (very relaxed for admin operations)
const scaledAdminLimiters = {
  // Admin actions: 1000 per hour (per IP)
  admin: createRateLimitConfig(
    60 * 60 * 1000,
    1000,
    'Admin rate limit exceeded.'
  )
};

module.exports = {
  ...scaledAuthLimiters,
  ...scaledHostLimiters,
  ...scaledChargingLimiters,
  ...scaledAdminLimiters,
  createRateLimitConfig
};
