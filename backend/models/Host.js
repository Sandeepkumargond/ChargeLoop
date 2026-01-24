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
    required: true,
    min: 1
  },
  amenities: [{
    type: String,
    enum: [
      'Parking', 'WiFi', 'Cafe', 'Restaurant', 'Security', 
      '24/7 Available', 'CCTV', 'Washroom', 'Waiting Area', 'Food Court'
    ]
  }],
  description: String,
  availableFrom: String, // Time format: "09:00"
  availableTo: String,   // Time format: "21:00"
  available: {
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

// Index for geospatial queries
HostSchema.index({ "location.coordinates": "2dsphere" });

// Update the updatedAt field on save
HostSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Calculate average rating
HostSchema.methods.updateRating = function(newRating) {
  const totalRating = (this.rating.average * this.rating.count) + newRating;
  this.rating.count += 1;
  this.rating.average = totalRating / this.rating.count;
  return this.save();
};

module.exports = mongoose.model('Host', HostSchema);
