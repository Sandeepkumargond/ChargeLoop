const express = require('express');
const router = express.Router();
const { signup, login, getProfile, updateProfile, googleLogin, verifyEmail, addVehicle, getVehicles, deleteVehicle, requestHostRegistration, getHostRegistrationStatus, checkUserType } = require('../controllers/authController');
const { checkVehicleExists } = require('../services/vehicleService');
const authMiddleware = require('../middleware/auth');

router.post('/signup', signup);
router.post('/login', login);
router.post('/google-login', googleLogin);
router.post('/verify-email', verifyEmail);
router.post('/check-user-type', authMiddleware, checkUserType);
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

// Vehicle management routes
router.post('/vehicles', authMiddleware, addVehicle);
router.get('/vehicles', authMiddleware, getVehicles);
router.delete('/vehicles/:vehicleId', authMiddleware, deleteVehicle);

// Host registration request routes - Now uses Host model directly
router.post('/request-host-registration', authMiddleware, requestHostRegistration);
router.get('/host-registration-status', authMiddleware, getHostRegistrationStatus);

module.exports = router;
