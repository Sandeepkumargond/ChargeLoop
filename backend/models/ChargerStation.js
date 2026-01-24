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
  powerOutput: {
    type: Number,
    required: true,
    min: 1
  },
  connectorTypes: [{
    type: String,
    enum: ['Type 2', 'CCS', 'CHAdeMO', 'Bharat AC001', 'Bharat DC001']
  }],
  pricePerUnit: {
    type: Number,
    required: true,
    min: 0
  },
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

// Index for geospatial queries
chargerStationSchema.index({ "location.coordinates": "2dsphere" });

// Index for search optimization
chargerStationSchema.index({ city: 1, state: 1, availability: 1 });

module.exports = mongoose.model('ChargerStation', chargerStationSchema);
