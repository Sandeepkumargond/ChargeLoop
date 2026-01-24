const mongoose = require('mongoose');

const chargingSessionSchema = new mongoose.Schema({
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
  startTime: { 
    type: Date, 
    required: true 
  },
  endTime: { 
    type: Date 
  },
  duration: { 
    type: Number, // in minutes
    default: 0 
  },
  energyConsumed: { 
    type: Number, // in kWh
    default: 0 
  },
  cost: { 
    type: Number, 
    default: 0 
  },
  status: {
    type: String,
    enum: ['ongoing', 'completed', 'cancelled'],
    default: 'ongoing'
  },
  paymentMethod: {
    type: String,
    enum: ['wallet', 'card', 'upi'],
    default: 'wallet'
  },
  transactionId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Transaction' 
  },
  vehicleId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User.vehicles'
  },
  vehicleDetails: {
    vehicleNumber: String,
    vehicleType: String,
    model: String,
    batteryCapacity: Number
  },
  rating: {
    type: Number,
    min: 1,
    max: 5
  },
  review: {
    type: String
  },
  metadata: {
    chargerId: String,
    powerOutput: Number, // in kW
    pricePerKwh: Number,
    vehicleType: String,
    reservationId: String
  }
}, { timestamps: true });

// Index for faster queries
chargingSessionSchema.index({ userId: 1, createdAt: -1 });
chargingSessionSchema.index({ hostId: 1 });
chargingSessionSchema.index({ status: 1 });

module.exports = mongoose.model('ChargingSession', chargingSessionSchema);