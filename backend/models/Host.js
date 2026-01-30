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
  pricePerHour: {
    type: Number,
    default: 0,
    min: 0
  },
  amenities: [{
    type: String,
    enum: [
      'Parking', 'WiFi', 'Cafe', 'Restaurant', 'Security',
      '24/7 Available', 'CCTV', 'Washroom', 'Waiting Area', 'Food Court'
    ]
  }],
  description: String,
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
  isVerified: {
    type: Boolean,
    default: false
  },
  rejectionReason: {
    type: String
  },
  rating: {
    average: {
      type: Number,
      default: 0
    },
    count: {
      type: Number,
      default: 0
    }
  },
  totalBookings: {
    type: Number,
    default: 0
  },
  totalEarnings: {
    type: Number,
    default: 0
  },
  documents: {
    electricityBill: String,
    ownershipProof: String,
    identityProof: String
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
