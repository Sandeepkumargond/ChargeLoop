const mongoose = require('mongoose');

const chargerStationSchema = new mongoose.Schema({
  hostId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  location: {
    address: {
      type: String,
      required: true
    },
    coordinates: {
      lat: {
        type: Number,
        required: true,
        min: -90,
        max: 90
      },
      lng: {
        type: Number,
        required: true,
        min: -180,
        max: 180
      }
    },
    city: String,
    state: String,
    pincode: String
  },
  chargerType: {
    type: String,
    enum: ['AC', 'DC', 'Both'],
    required: true
  },
  // Socket capacity - host's charger power/rating
  socketMaxCapacity: {
    type: Number,
    required: true,
    default: 3.3,
    enum: [3.3, 7, 7.4, 22, 50, 100, 150],
    description: 'Host socket max capacity in kW (default 3.3kW for 16A). User must not exceed this with their charger.'
  },
  // Energy-based pricing fields (Approach A)
  chargerPowerKw: {
    type: Number,
    required: true,
    min: 0.5,
    description: 'Charger power in kilowatts (e.g., 3.3, 7.4, 22, 50 kW)'
  },
  pricePerUnit: {
    type: Number,
    required: true,
    min: 0,
    description: 'Host-defined price per kWh in ₹ (e.g., ₹15)'
  },
  // Convenience fee - optional charges for parking/maintenance
  convenienceFee: {
    type: Number,
    default: 0,
    min: 0,
    description: 'Optional fixed convenience fee in ₹ for parking, maintenance, etc (₹20-50)'
  },
  efficiency: {
    type: Number,
    default: null,
    min: 0.5,
    max: 1.0,
    description: 'Charger efficiency (auto-calculated based on type: AC 0.85-0.90, DC 0.90-0.95)'
  },
  // Legacy fields (for backward compatibility)
  powerOutput: {
    type: Number,
    min: 1
  },
  connectorTypes: [{
    type: String,
    enum: ['Type 2', 'CCS', 'CHAdeMO', 'Bharat AC001', 'Bharat DC001']
  }],
  availability: {
    type: String,
    enum: ['Available', 'Occupied', 'Maintenance', 'Offline'],
    default: 'Available'
  },
  amenities: [{
    type: String,
    enum: ['Parking', 'WiFi', 'Restroom', 'Food', 'Shopping', 'Waiting Area']
  }],
  operatingHours: {
    start: {
      type: String,
      required: true
    },
    end: {
      type: String,
      required: true
    },
    is24x7: {
      type: Boolean,
      default: false
    }
  },
  images: [String],
  verified: {
    type: Boolean,
    default: false
  },
  rating: {
    type: Number,
    min: 0,
    max: 5,
    default: 0
  },
  totalRatings: {
    type: Number,
    default: 0
  },
  bookings: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Booking'
  }],
  status: {
    type: String,
    enum: ['Active', 'Inactive', 'Pending'],
    default: 'Pending'
  }
}, {
  timestamps: true
});

chargerStationSchema.index({ "location.coordinates": "2dsphere" });

chargerStationSchema.index({ city: 1, state: 1, availability: 1 });

module.exports = mongoose.model('ChargerStation', chargerStationSchema);
