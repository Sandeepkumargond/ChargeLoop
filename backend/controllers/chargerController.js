const ChargerStation = require('../models/ChargerStation');
const { sendHostOnboardingEmail } = require('../services/emailService');

const createChargerStation = async (req, res) => {
  try {
    const {
      name,
      location,
      chargerType,
      powerOutput,
      connectorTypes,
      pricePerUnit,
      pricePerKwh,
      socketMaxCapacity,
      convenienceFee,
      amenities,
      operatingHours,
      images
    } = req.body;

    // Determine pricing field
    const finalPrice = pricePerKwh || pricePerUnit;
    const finalSocketCapacity = socketMaxCapacity || powerOutput || 3.3;
    const finalOperatingHours = operatingHours || { start: '00:00', end: '23:59', is24x7: true };

    if (!name || !location || !chargerType || !finalPrice) {
      return res.status(400).json({
        success: false,
        message: 'All required fields must be provided: name, location, chargerType, pricePerUnit/pricePerKwh'
      });
    }

    if (!location.coordinates || !location.coordinates.lat || !location.coordinates.lng) {
      return res.status(400).json({
        success: false,
        message: 'Valid coordinates are required'
      });
    }

    const chargerStation = new ChargerStation({
      hostId: req.user.id,
      name,
      location,
      chargerType,
      chargerPowerKw: finalSocketCapacity,
      socketMaxCapacity: finalSocketCapacity,
      powerOutput: finalSocketCapacity,
      connectorTypes: connectorTypes || [],
      pricePerUnit: finalPrice,
      pricePerKwh: finalPrice,
      convenienceFee: convenienceFee || 0,
      amenities: amenities || [],
      operatingHours: finalOperatingHours,
      images: images || []
    });

    await chargerStation.save();

    try {
      const { enqueueHostOnboardingEmail } = require('../queues/jobQueues');
      enqueueHostOnboardingEmail({
        email: req.user.email,
        hostName: req.user.name || 'Host',
        stationName: name,
        chargerType: chargerType,
        pricePerHour: finalPrice,
        location: location,
        stationId: chargerStation._id
      }).catch(err => console.error('Error queuing host onboarding email:', err.message));
    } catch (emailError) {
      // Email error doesn't block the response
    }

    res.status(201).json({
      success: true,
      message: 'Charger station created successfully',
      data: chargerStation,
      station: chargerStation
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

const getHostChargerStations = async (req, res) => {
  try {
    const chargerStations = await ChargerStation.find({ hostId: req.user.id });

    res.json({
      success: true,
      data: chargerStations,
      stations: chargerStations,
      count: chargerStations.length
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

const getNearbyChargerStations = async (req, res) => {
  try {
    const lat = parseFloat(req.query.lat || req.query.latitude);
    const lng = parseFloat(req.query.lng || req.query.longitude);
    const radius = parseFloat(req.query.radius || 10);

    if (isNaN(lat) || isNaN(lng)) {
      return res.status(400).json({
        success: false,
        message: 'Latitude and longitude are required'
      });
    }

    const chargerStations = await ChargerStation.find({
      status: { $ne: 'Suspended' }
    }).populate('hostId', 'name email phone');

    // Filter by Haversine distance
    const nearby = chargerStations.filter(st => {
      const sLat = st.location?.coordinates?.lat ?? (Array.isArray(st.location?.coordinates) ? st.location.coordinates[1] : null);
      const sLng = st.location?.coordinates?.lng ?? (Array.isArray(st.location?.coordinates) ? st.location.coordinates[0] : null);
      if (sLat == null || sLng == null) return false;

      const dLat = (sLat - lat) * Math.PI / 180;
      const dLng = (sLng - lng) * Math.PI / 180;
      const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                Math.cos(lat * Math.PI / 180) * Math.cos(sLat * Math.PI / 180) *
                Math.sin(dLng / 2) * Math.sin(dLng / 2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      const distKm = 6371 * c;
      return distKm <= radius;
    });

    res.json({
      success: true,
      data: nearby,
      stations: nearby,
      count: nearby.length
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Internal server error'
    });
  }
};

const updateChargerStation = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const chargerStation = await ChargerStation.findOne({
      _id: id,
      hostId: req.user.id
    });

    if (!chargerStation) {
      return res.status(404).json({
        success: false,
        message: 'Charger station not found'
      });
    }

    Object.assign(chargerStation, updates);
    await chargerStation.save();

    res.json({
      success: true,
      message: 'Charger station updated successfully',
      data: chargerStation
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

const updateAvailability = async (req, res) => {
  try {
    const { id } = req.params;
    const { availability } = req.body;

    if (!['Available', 'Occupied', 'Maintenance', 'Offline'].includes(availability)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid availability status'
      });
    }

    const chargerStation = await ChargerStation.findOneAndUpdate(
      { _id: id, hostId: req.user.id },
      { availability },
      { new: true }
    );

    if (!chargerStation) {
      return res.status(404).json({
        success: false,
        message: 'Charger station not found'
      });
    }

    res.json({
      success: true,
      message: 'Availability updated successfully',
      data: chargerStation
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

const deleteChargerStation = async (req, res) => {
  try {
    const { id } = req.params;

    const chargerStation = await ChargerStation.findOneAndDelete({
      _id: id,
      hostId: req.user.id
    });

    if (!chargerStation) {
      return res.status(404).json({
        success: false,
        message: 'Charger station not found'
      });
    }

    res.json({
      success: true,
      message: 'Charger station deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

const getChargerStationDetails = async (req, res) => {
  try {
    const { id } = req.params;

    const chargerStation = await ChargerStation.findById(id)
      .populate('hostId', 'name email phone');

    if (!chargerStation) {
      return res.status(404).json({
        success: false,
        message: 'Charger station not found'
      });
    }

    res.json({
      success: true,
      data: chargerStation
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

module.exports = {
  createChargerStation,
  getHostChargerStations,
  getNearbyChargerStations,
  updateChargerStation,
  updateAvailability,
  deleteChargerStation,
  getChargerStationDetails
};
