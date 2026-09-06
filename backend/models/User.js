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
    description: 'Vehicle model (e.g., Tesla Model 3)'
  },
  batteryCapacity: {
    type: Number,
    min: 0,
    description: 'Battery capacity in kWh'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const userSchema = new mongoose.Schema({
  name: { type: String, trim: true },
  email: { type: String, unique: true, required: true, lowercase: true, trim: true, index: true },
  password: String,
  googleId: { type: String, index: true },
  profilePicture: String,
  phone: { type: String, default: '', trim: true },
  location: String,
  chargingSessions: { type: Number, default: 0 },
  hostSessions: { type: Number, default: 0 },
  emailVerified: { type: Boolean, default: false },
  otp: String,
  otpExpiry: Date,
  otpVerified: { type: Boolean, default: false },
  role: { type: String, enum: ['user', 'host', 'admin'], default: 'user', index: true },
  vehicles: [vehicleSchema],
  lastLogin: { type: Date, default: Date.now }
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);
