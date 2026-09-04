const Host = require('../models/Host');
const { getCache, setCache, invalidateCachePattern } = require('../services/redisService');

const getNearbyHosts = async (req, res) => {
  try {
    const { latitude, longitude, radius = 10 } = req.query;

    if (!latitude || !longitude) {
      return res.status(400).json({ error: 'Latitude and longitude are required' });
    }

    const lat = parseFloat(latitude);
    const lng = parseFloat(longitude);
    const radiusInKm = parseFloat(radius);

    const hosts = await Host.find({
      verificationStatus: 'approved',
      isVisibleOnMap: true
    }).populate('userId', 'name email phone');

    const nearbyHosts = hosts.filter(host => {
      if (!host.location?.coordinates?.lat || !host.location?.coordinates?.lng) return false;
      const hostLat = host.location.coordinates.lat;
      const hostLng = host.location.coordinates.lng;
      const deltaLat = Math.abs(lat - hostLat);
      const deltaLng = Math.abs(lng - hostLng);
      const distance = Math.sqrt(deltaLat * deltaLat + deltaLng * deltaLng) * 111;
      return distance <= radiusInKm;
    });

    const formattedHosts = nearbyHosts.map(host => {
      const h = host.toObject();
      if (h.location && h.location.coordinates && typeof h.location.coordinates === 'object') {
        h.location.coordinates = [h.location.coordinates.lng, h.location.coordinates.lat];
      }
      return h;
    });
    res.json({ hosts: formattedHosts });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch nearby hosts' });
  }
};

const getAllHosts = async (req, res) => {
  try {
    const { city, state, chargerType } = req.query;

    // Build cache key from query params
    const cacheKey = `hosts:all:${city || ''}:${state || ''}:${chargerType || ''}`;

    // Try Redis cache first (30s TTL)
    const cached = await getCache(cacheKey);
    if (cached) {
      return res.json({ hosts: cached });
    }

    let filter = {
      verificationStatus: 'approved',
      isVisibleOnMap: true
    };
    if (city) filter['location.city'] = new RegExp(city, 'i');
    if (state) filter['location.state'] = new RegExp(state, 'i');
    if (chargerType) filter.chargerType = chargerType;
    const hosts = await Host.find(filter).populate('userId', 'name email phone');

    const formattedHosts = hosts.map(host => {
      const h = host.toObject();
      if (h.location && h.location.coordinates && typeof h.location.coordinates === 'object') {
        h.location.coordinates = [h.location.coordinates.lng, h.location.coordinates.lat];
      }
      return h;
    });

    // Cache for 30 seconds
    await setCache(cacheKey, formattedHosts, 30);

    res.json({ hosts: formattedHosts });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch hosts' });
  }
};

const updateHostAvailability = async (req, res) => {
  try {
    const { hostId } = req.params;
    const { isActive, availableFrom, availableTo } = req.body;

    const host = await Host.findById(hostId);
    if (!host) {
      return res.status(404).json({ error: 'Host not found' });
    }

    if (host.userId.toString() !== req.user.id.toString()) {
      return res.status(403).json({ error: 'Unauthorized to update this host' });
    }

    const updateData = {};
    if (typeof isActive !== 'undefined') updateData.isActive = isActive;
    if (availableFrom) updateData.availableFrom = availableFrom;
    if (availableTo) updateData.availableTo = availableTo;

    const updatedHost = await Host.findByIdAndUpdate(hostId, updateData, { new: true });

    // Invalidate hosts cache when availability changes
    await invalidateCachePattern('hosts:*');

    res.json(updatedHost);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update host availability' });
  }
};

const toggleMapVisibility = async (req, res) => {
  try {
    const { hostId } = req.params;
    const { isVisibleOnMap } = req.body;

    if (typeof isVisibleOnMap !== 'boolean') {
      return res.status(400).json({ error: 'isVisibleOnMap must be a boolean' });
    }

    const host = await Host.findById(hostId);
    if (!host) {
      return res.status(404).json({ error: 'Host not found' });
    }

    if (host.userId.toString() !== req.user.id.toString()) {
      return res.status(403).json({ error: 'Unauthorized to update this host' });
    }

    host.isVisibleOnMap = isVisibleOnMap;
    const updatedHost = await host.save();

    // Invalidate hosts cache when visibility changes
    await invalidateCachePattern('hosts:*');

    res.json({
      message: 'Map visibility updated successfully',
      isVisibleOnMap: updatedHost.isVisibleOnMap,
      host: updatedHost
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to toggle map visibility' });
  }
};

module.exports = {
  getNearbyHosts,
  getAllHosts,
  updateHostAvailability,
  toggleMapVisibility
};
