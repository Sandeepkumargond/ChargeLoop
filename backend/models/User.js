const mongoose = require('mongoose');

const vehicleSchema = new mongoose.Schema({
  vehicleNumber: {
    type: String,
    required: true,
    match: /^[A-Z]{2}\d{2}[A-Z]{1,2}\d{4}$/,
    uppercase: true
  },
  vehicleType: {
    type: String,
    enum: ['sedan', 'suv', 'hatchback', 'truck', 'bike'],
    required: true
  },
  model: {
    type: String,
    required: true
  },
  batteryCapacity: {
    type: Number,
    required: true,
    min: 0
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const userSchema = new mongoose.Schema({
  name: String,
  email: { type: String, unique: true },
  password: String,
  googleId: String,
  profilePicture: String,
  walletBalance: { type: Number, default: 0 },
  phone: String,
  location: String,
  chargingSessions: { type: Number, default: 0 },
  hostSessions: { type: Number, default: 0 },
  emailVerified: { type: Boolean, default: false },
  role: { type: String, enum: ['user', 'admin'], default: 'user' },
  vehicles: [vehicleSchema],
  lastLogin: { type: Date, default: Date.now }
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);
