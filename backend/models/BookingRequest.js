const mongoose = require('mongoose');

const bookingRequestSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  hostId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Host',
    required: true
  },
  hostName: {
    type: String,
    required: true
  },
  hostLocation: {
    type: String,
    required: true
  },
  chargerType: {
    type: String,
    required: true
  },
  powerOutput: {
    type: Number
  },
  pricePerHour: {
    type: Number
  },
  vehicleNumber: {
    type: String,
    required: true
  },
  vehicleType: {
    type: String,
    required: true
  },
  vehicleId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User.vehicles'
  },
  scheduledTime: {
    type: Date,
    required: true
  },
  estimatedDuration: {
    type: Number, // in minutes
    required: true
  },
  estimatedCost: {
    type: Number,
    required: true
  },
  chargingType: {
    type: String,
    enum: ['fast', 'standard', 'slow'],
    default: 'standard'
  },
  status: {
    type: String,
    enum: ['pending', 'accepted', 'declined', 'expired'],
    default: 'pending'
  },
  requestId: {
    type: String,
    unique: true,
    required: true
  },
  hostResponse: {
    respondedAt: Date,
    acceptedAt: Date,
    declinedAt: Date,
    declineReason: String
  },
  metadata: {
    chargerId: String,
    amenities: [String],
    rating: Number,
    distance: Number,
    userLocation: {
      lat: Number,
      lng: Number
    }
  }
}, { timestamps: true });

// Index for faster queries
bookingRequestSchema.index({ userId: 1, createdAt: -1 });
bookingRequestSchema.index({ hostId: 1, status: 1 });
bookingRequestSchema.index({ status: 1 });
bookingRequestSchema.index({ requestId: 1 });

module.exports = mongoose.model('BookingRequest', bookingRequestSchema);
