const mongoose = require('mongoose');

const HostSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  hostName: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true
  },
  phone: {
    type: String,
    required: true
  },
  location: {
    address: {
      type: String,
      required: true
    },
    city: String,
    state: String,
    pincode: String,
    type: {
      type: String,
      enum: ['Point'],
      required: true,
      default: 'Point'
    },
    coordinates: {
      type: mongoose.Schema.Types.Mixed, // Supports GeoJSON [longitude, latitude] and legacy { lat, lng }
      required: true,
      default: [0, 0]
    }
  },
  chargerType: {
    type: String,
    required: true,
    default: 'Regular Charging (22kW)'
  },
  // Charger power capacity (kW)
  chargerPowerKw: {
    type: Number,
    min: 0.5,
    default: 22,
    description: 'Charger power in kilowatts (e.g., 3.3, 7.4, 22, 50 kW)'
  },
  // Socket max capacity - host's charger rating
  socketMaxCapacity: {
    type: Number,
    default: 3.3,
    min: 0.5,
    description: 'Host socket max capacity in kW. User must not exceed this.'
  },
  // Price per kWh in ₹
  pricePerKwh: {
    type: Number,
    min: 0,
    default: 0,
    description: 'Price per kWh in ₹'
  },
  // Legacy price per hour support
  pricePerHour: {
    type: Number,
    min: 0,
    default: 0,
    description: 'Price per hour in ₹'
  },
  // Convenience fee for parking/maintenance
  convenienceFee: {
    type: Number,
    default: 0,
    min: 0,
    max: 100,
    description: 'Optional convenience fee in ₹ (parking, maintenance, etc)'
  },
  amenities: [{
    type: String,
    enum: [
      'Parking', 'WiFi', 'Cafe', 'Restaurant', 'Security',
      '24/7 Available', 'CCTV', 'Washroom', 'Waiting Area', 'Food Court'
    ]
  }],
  availableFrom: String,
  availableTo: String,
  available: {
    type: Boolean,
    default: true
  },
  isVisibleOnMap: {
    type: Boolean,
    default: true
  },
  verificationStatus: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  },
  rejectionReason: {
    type: String
  },
  rating: {
    average: { type: Number, default: 0 },
    count: { type: Number, default: 0 }
  },
  totalBookings: { type: Number, default: 0 },
  totalEarnings: { type: Number, default: 0 },
  totalPaidOut: { type: Number, default: 0 },
  documents: {
    addressProofUrl: String,
    aadharCardUrl: String,
    lightConnectionProofUrl: String
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

HostSchema.index({ "location.coordinates": "2dsphere" });

HostSchema.pre('validate', function(next) {
  if (this.location) {
    if (!this.location.type) {
      this.location.type = 'Point';
    }
    if (this.location.coordinates) {
      if (!Array.isArray(this.location.coordinates) && typeof this.location.coordinates === 'object') {
        const lat = Number(this.location.coordinates.lat ?? this.location.coordinates.latitude);
        const lng = Number(this.location.coordinates.lng ?? this.location.coordinates.longitude);
        if (!isNaN(lat) && !isNaN(lng)) {
          this.location.coordinates = [lng, lat];
        } else {
          this.location.coordinates = [0, 0];
        }
      }
    } else {
      this.location.coordinates = [0, 0];
    }
  }
  next();
});

HostSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

HostSchema.methods.updateRating = function(newRating) {
  const totalRating = (this.rating.average * this.rating.count) + newRating;
  this.rating.count += 1;
  this.rating.average = totalRating / this.rating.count;
  return this.save();
};

module.exports = mongoose.model('Host', HostSchema);
