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
    coordinates: {
      lat: {
        type: Number,
        required: true
      },
      lng: {
        type: Number,
        required: true
      }
    }
  },
  chargerType: {
    type: String,
    required: true,
    enum: [
      'Regular Charging (22kW)',
      'Fast Charging (50kW)',
      'Super Fast (100kW)',
      'Ultra Fast (150kW)',
      'Tesla Supercharger'
    ]
  },
  // NEW: Charger power capacity (kW)
  chargerPowerKw: {
    type: Number,
    min: 0.5,
    description: 'Charger power in kilowatts (e.g., 3.3, 7.4, 22, 50 kW)'
  },
  // Socket max capacity - host's charger rating
  socketMaxCapacity: {
    type: Number,
    default: 3.3,
    enum: [3.3, 7, 7.4, 22, 50, 100, 150],
    description: 'Host socket max capacity in kW. User must not exceed this.'
  },
  // Price per kWh in ₹
  pricePerKwh: {
    type: Number,
    min: 0,
    description: 'Price per kWh in ₹'
  },
  // NEW: Convenience fee for parking/maintenance
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
    average: Number,
    count: Number
  },
  totalBookings: Number,
  totalEarnings: Number,
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
