const express = require('express');
const router = express.Router();
const { signup, login, getProfile, updateProfile, googleLogin, verifyEmail, addVehicle, getVehicles, deleteVehicle, requestHostRegistration, getHostRegistrationStatus, checkUserType, sendOtp, verifyOtp, completeSignup, forgotPassword, verifyOtpForReset, resetPassword } = require('../controllers/authController');
const { checkVehicleExists } = require('../services/vehicleService');
const authMiddleware = require('../middleware/auth');

router.post('/signup', signup);
router.post('/login', login);
router.post('/google-login', googleLogin);
router.post('/verify-email', verifyEmail);
router.post('/check-user-type', authMiddleware, checkUserType);

router.post('/send-otp', sendOtp);
router.post('/verify-otp', verifyOtp);
router.post('/complete-signup', completeSignup);

router.post('/forgot-password', forgotPassword);
router.post('/verify-otp-reset', verifyOtpForReset);
router.post('/reset-password', resetPassword);

router.post('/verify-vehicle', async (req, res) => {
  try {
    const { vehicleNumber } = req.body;
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
