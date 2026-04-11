const express = require('express');
const router = express.Router();
const { signup, login, googleLogin, verifyEmail, requestHostRegistration, getHostRegistrationStatus, checkUserType, sendOtp, verifyOtp, completeSignup, forgotPassword, verifyOtpForReset, resetPassword } = require('../controllers/authController');
const { checkVehicleExists } = require('../services/vehicleService');
const authMiddleware = require('../middleware/auth');

// Import scaled rate limiters
const {
  signup: signupLimiter,
  login: loginLimiter,
  otpSend: otpSendLimiter,
  otpVerify: otpVerifyLimiter,
  google: googleLimiter
} = require('../middleware/scaledRateLimits');

router.post('/signup', signupLimiter, signup);
router.post('/login', loginLimiter, login);
router.post('/google-login', googleLimiter, googleLogin);
router.post('/verify-email', verifyEmail);
router.post('/check-user-type', authMiddleware, checkUserType);

router.post('/send-otp', otpSendLimiter, sendOtp);
router.post('/verify-otp', otpVerifyLimiter, verifyOtp);
router.post('/complete-signup', signupLimiter, completeSignup);

router.post('/forgot-password', otpSendLimiter, forgotPassword);
router.post('/verify-otp-reset', otpVerifyLimiter, verifyOtpForReset);
router.post('/reset-password', loginLimiter, resetPassword);

router.post('/verify-vehicle', authMiddleware, async (req, res) => {
  try {
    const { vehicleNumber } = req.body;
    if (!vehicleNumber || typeof vehicleNumber !== 'string') {
      return res.status(400).json({ valid: false, reason: 'Invalid vehicle number' });
    }
    const result = await checkVehicleExists(vehicleNumber);
    res.json(result);
  } catch (error) {
    res.status(500).json({ valid: false, reason: 'Unable to verify vehicle' });
  }
});
// Profile and vehicle endpoints moved to /api/user routes
// router.get('/profile', authMiddleware, getProfile);
// router.put('/update-profile', authMiddleware, updateProfile);
// router.post('/vehicles', authMiddleware, addVehicle);
// router.get('/vehicles', authMiddleware, getVehicles);
// router.delete('/vehicles/:vehicleId', authMiddleware, deleteVehicle);

router.post('/request-host-registration', authMiddleware, requestHostRegistration);
router.get('/host-registration-status', authMiddleware, getHostRegistrationStatus);

// ===== DIAGNOSTIC ENDPOINT =====
router.get('/health/imagekit', authMiddleware, async (req, res) => {
  try {
    const { hasImageKitCredentials } = require('../services/imagekitService');
    
    const diagnostics = {
      timestamp: new Date().toISOString(),
      service: 'ImageKit',
      hasCredentials: hasImageKitCredentials,
      environment: {
        IMAGEKIT_PUBLIC_KEY: process.env.IMAGEKIT_PUBLIC_KEY ? '✓ Set' : '✗ Missing',
        IMAGEKIT_PRIVATE_KEY: process.env.IMAGEKIT_PRIVATE_KEY ? '✓ Set' : '✗ Missing',
        IMAGEKIT_ID: process.env.IMAGEKIT_ID ? '✓ Set' : '✗ Missing'
      },
      urlEndpoint: process.env.IMAGEKIT_ID ? `https://ik.imagekit.io/${process.env.IMAGEKIT_ID}` : 'Not configured'
    };

    res.json({
      status: hasImageKitCredentials ? 'configured' : 'not-configured',
      diagnostics
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      error: error.message
    });
  }
});

module.exports = router;
