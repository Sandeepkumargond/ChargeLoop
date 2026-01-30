const ChargerStation = require('../models/ChargerStation');
const { sendHostOnboardingEmail } = require('../services/emailService');

// Create new charger station
const createChargerStation = async (req, res) => {
  try {
    const {
      name,
      location,
      chargerType,
      powerOutput,
      connectorTypes,
      pricePerUnit,
      amenities,
      operatingHours,
      images
    } = req.body;

    // Validate required fields
    if (!name || !location || !chargerType || !powerOutput || !pricePerUnit || !operatingHours) {
      return res.status(400).json({
        success: false,
        message: 'All required fields must be provided'
      });
    }

    // Validate coordinates
    if (!location.coordinates || !location.coordinates.lat || !location.coordinates.lng) {
      return res.status(400).json({
        success: false,
        message: 'Valid coordinates are required'
      });
    }

    // Create new charger station
    const chargerStation = new ChargerStation({
      hostId: req.user.id,
      name,
      location,
      chargerType,
      powerOutput,
      connectorTypes: connectorTypes || [],
      pricePerUnit,
      amenities: amenities || [],
      operatingHours,
      images: images || []
    });

    await chargerStation.save();

    // Send onboarding email
    try {
      await sendHostOnboardingEmail(req.user.email, {
        hostName: req.user.name,
        stationName: name,
        stationId: chargerStation._id
      });
    } catch (emailError) {
    }

    res.status(201).json({
      success: true,
      message: 'Charger station created successfully',
      data: chargerStation
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Get all charger stations for a host
const getHostChargerStations = async (req, res) => {
  try {
    const chargerStations = await ChargerStation.find({ hostId: req.user.id });
    
    res.json({
      success: true,
      data: chargerStations
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Get all nearby charger stations
const getNearbyChargerStations = async (req, res) => {
  try {
    const { lat, lng, radius = 10 } = req.query;

    if (!lat || !lng) {
      return res.status(400).json({
        success: false,
        message: 'Latitude and longitude are required'
      });
    }

    // Convert radius from km to meters
    const radiusInMeters = radius * 1000;

    const chargerStations = await ChargerStation.find({
      'location.coordinates': {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: [parseFloat(lng), parseFloat(lat)]
          },
          $maxDistance: radiusInMeters
        }
      },
      status: 'Active',
      verified: true
    }).populate('hostId', 'name email phone');

    res.json({
      success: true,
      data: chargerStations
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Update charger station
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

// Update availability status
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

// Delete charger station
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

// Get charger station details
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
