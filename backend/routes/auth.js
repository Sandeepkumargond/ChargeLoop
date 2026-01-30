const express = require('express');
const router = express.Router();
const rateLimit = require('express-rate-limit');
const { signup, login, getProfile, updateProfile, googleLogin, verifyEmail, addVehicle, getVehicles, deleteVehicle, requestHostRegistration, getHostRegistrationStatus, checkUserType, sendOtp, verifyOtp, completeSignup, forgotPassword, verifyOtpForReset, resetPassword } = require('../controllers/authController');
const { checkVehicleExists } = require('../services/vehicleService');
const authMiddleware = require('../middleware/auth');

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: 'Too many login attempts, please try again after 15 minutes.',
  skipSuccessfulRequests: true
});

const signupLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 3,
  message: 'Too many signup attempts from this email, please try again later.'
});

const otpLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: 'Too many OTP requests, please try again later.'
});

router.post('/signup', signupLimiter, signup);
router.post('/login', loginLimiter, login);
router.post('/google-login', loginLimiter, googleLogin);
router.post('/verify-email', verifyEmail);
router.post('/check-user-type', authMiddleware, checkUserType);

router.post('/send-otp', otpLimiter, sendOtp);
router.post('/verify-otp', otpLimiter, verifyOtp);
router.post('/complete-signup', signupLimiter, completeSignup);

router.post('/forgot-password', otpLimiter, forgotPassword);
router.post('/verify-otp-reset', otpLimiter, verifyOtpForReset);
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
router.get('/profile', authMiddleware, getProfile);
router.put('/update-profile', authMiddleware, updateProfile);

router.post('/vehicles', authMiddleware, addVehicle);
router.get('/vehicles', authMiddleware, getVehicles);
router.delete('/vehicles/:vehicleId', authMiddleware, deleteVehicle);

router.post('/request-host-registration', authMiddleware, requestHostRegistration);
router.get('/host-registration-status', authMiddleware, getHostRegistrationStatus);

module.exports = router;
