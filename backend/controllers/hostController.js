const Host = require('../models/Host');
const ChargingSession = require('../models/ChargingSession');

// Get nearby hosts based on coordinates
const getNearbyHosts = async (req, res) => {
  try {
    const { latitude, longitude, radius = 10 } = req.query;
    
    if (!latitude || !longitude) {
      return res.status(400).json({ error: 'Latitude and longitude are required' });
    }
    
    const lat = parseFloat(latitude);
    const lng = parseFloat(longitude);
    const radiusInKm = parseFloat(radius);
    
    // Use MongoDB's geoNear-like functionality with manual calculation
    const hosts = await Host.find({ 
      isActive: true, 
      verificationStatus: 'approved' 
    }).populate('userId', 'name email phone');
    
    // Filter by distance manually (simplified approach)
    const nearbyHosts = hosts.filter(host => {
      if (!host.location?.coordinates?.lat || !host.location?.coordinates?.lng) return false;
      const hostLat = host.location.coordinates.lat;
      const hostLng = host.location.coordinates.lng;
      const deltaLat = Math.abs(lat - hostLat);
      const deltaLng = Math.abs(lng - hostLng);
      const distance = Math.sqrt(deltaLat * deltaLat + deltaLng * deltaLng) * 111;
      return distance <= radiusInKm;
    });
    // Format coordinates as [lng, lat] for frontend compatibility
    const formattedHosts = nearbyHosts.map(host => {
      const h = host.toObject();
      if (h.location && h.location.coordinates && typeof h.location.coordinates === 'object') {
        h.location.coordinates = [h.location.coordinates.lng, h.location.coordinates.lat];
      }
      return h;
    });
    res.json({ hosts: formattedHosts });
  } catch (error) {
    console.error('Error fetching nearby hosts:', error);
    res.status(500).json({ error: 'Failed to fetch nearby hosts' });
  }
};

// Get all hosts
const getAllHosts = async (req, res) => {
  try {
    const { city, state, chargerType } = req.query;
  let filter = { verificationStatus: 'approved' }; // Only show approved hosts
  if (city) filter.city = new RegExp(city, 'i');
  if (state) filter.state = new RegExp(state, 'i');
  if (chargerType) filter.chargerType = chargerType;
  const hosts = await Host.find(filter).populate('userId', 'name email phone');
    // Format coordinates as [lng, lat] for frontend compatibility
    const formattedHosts = hosts.map(host => {
      const h = host.toObject();
      if (h.location && h.location.coordinates && typeof h.location.coordinates === 'object') {
        h.location.coordinates = [h.location.coordinates.lng, h.location.coordinates.lat];
      }
      return h;
    });
    res.json({ hosts: formattedHosts });
  } catch (error) {
    console.error('Error fetching all hosts:', error);
    res.status(500).json({ error: 'Failed to fetch hosts' });
  }
};

// Update host availability
const updateHostAvailability = async (req, res) => {
  try {
    const { hostId } = req.params;
    const { isActive, availableFrom, availableTo } = req.body;
    
    const host = await Host.findById(hostId);
    if (!host) {
      return res.status(404).json({ error: 'Host not found' });
    }
    
    // Check if the requesting user owns this host
    if (host.userId.toString() !== req.user.userId) {
      return res.status(403).json({ error: 'Unauthorized to update this host' });
    }
    
    const updateData = {};
    if (typeof isActive !== 'undefined') updateData.isActive = isActive;
    if (availableFrom) updateData.availableFrom = availableFrom;
    if (availableTo) updateData.availableTo = availableTo;
    
    const updatedHost = await Host.findByIdAndUpdate(hostId, updateData, { new: true });
    res.json(updatedHost);
  } catch (error) {
    console.error('Error updating host availability:', error);
    res.status(500).json({ error: 'Failed to update host availability' });
  }
};

module.exports = {
  getNearbyHosts,
  getAllHosts,
  updateHostAvailability
};
