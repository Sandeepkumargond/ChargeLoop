const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const {
  createChargerStation,
  getHostChargerStations,
  getNearbyChargerStations,
  updateChargerStation,
  updateAvailability,
  deleteChargerStation,
  getChargerStationDetails
} = require('../controllers/chargerController');

router.get('/nearby', auth, getNearbyChargerStations);
router.get('/:id', auth, getChargerStationDetails);

router.post('/', auth, createChargerStation);
router.get('/host/stations', auth, getHostChargerStations);
router.put('/:id', auth, updateChargerStation);
router.patch('/:id/availability', auth, updateAvailability);
router.delete('/:id', auth, deleteChargerStation);

module.exports = router;
