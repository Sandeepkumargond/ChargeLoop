const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const adminAuth = require('../middleware/adminAuth');
const {
  getPendingHosts,
  getAllHostsForAdmin,
  getAllUsers,
  approveHost,
  rejectHost,
  getAdminStats,
  adminLogin,
  getAllAdmins,
  addAdmin,
  deleteAdmin,
  getPendingHostRegistrations,
  approveHostRegistration,
  denyHostRegistration
} = require('../controllers/adminController');

// Admin login route (no auth required)
router.post('/login', adminLogin);

// All admin routes require both user authentication and admin role
router.use(auth, adminAuth);

// Get admin dashboard statistics
router.get('/stats', getAdminStats);

// Admin management routes
router.get('/list', getAllAdmins);
router.post('/add', addAdmin);
router.delete('/:adminId', deleteAdmin);

// Get all pending hosts for verification
router.get('/hosts/pending', getPendingHosts);

// Get all hosts with filtering options
router.get('/hosts', getAllHostsForAdmin);

// Get all users
router.get('/users', getAllUsers);

// Approve a host
router.put('/hosts/:hostId/approve', approveHost);

// Reject a host
router.put('/hosts/:hostId/reject', rejectHost);

// Host registration request routes
router.get('/host-registration-requests/pending', getPendingHostRegistrations);
router.put('/host-registration-requests/:requestId/approve', approveHostRegistration);
router.put('/host-registration-requests/:requestId/deny', denyHostRegistration);

module.exports = router;