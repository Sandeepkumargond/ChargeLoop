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
  deleteAdmin
} = require('../controllers/adminController');

router.post('/login', adminLogin);

router.use(auth, adminAuth);

router.get('/stats', getAdminStats);

router.get('/list', getAllAdmins);
router.post('/add', addAdmin);
router.delete('/:adminId', deleteAdmin);

router.get('/hosts/pending', getPendingHosts);

router.get('/hosts', getAllHostsForAdmin);

router.get('/users', getAllUsers);

router.put('/hosts/:hostId/approve', approveHost);

router.put('/hosts/:hostId/reject', rejectHost);

module.exports = router;
