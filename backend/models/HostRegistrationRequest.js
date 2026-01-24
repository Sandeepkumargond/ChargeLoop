const mongoose = require('mongoose');

const hostRegistrationRequestSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  email: {
    type: String,
    required: true,
    lowercase: true
  },
  name: {
    type: String,
    required: true
  },
  phone: {
    type: String,
    required: true
  },
  companyName: {
    type: String,
    required: true
  },
  location: {
    address: String,
    city: String,
    state: String,
    pincode: String
  },
  numberOfChargers: {
    type: Number,
    required: true,
    min: 1
  },
  chargerTypes: [{
    type: String,
    enum: [
      'Regular Charging (22kW)',
      'Fast Charging (50kW)',
      'Super Fast (100kW)',
      'Ultra Fast (150kW)',
      'Tesla Supercharger'
    ]
  }],
  businessDescription: {
    type: String,
    maxlength: 1000
  },
  documents: {
    companyRegistration: String,
    taxId: String,
    identityProof: String
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'denied'],
    default: 'pending'
  },
  adminNotes: {
    type: String
  },
  denialReason: {
    type: String
  },
  approvedAt: {
    type: Date
  },
  deniedAt: {
    type: Date
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

module.exports = mongoose.model('HostRegistrationRequest', hostRegistrationRequestSchema);
