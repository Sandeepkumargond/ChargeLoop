const mongoose = require('mongoose');

const hostRegistrationRequestSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
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
  mobile: {
    type: String,
    required: true
  },
  phone: {
    type: String
  },
  companyName: {
    type: String
  },
  address: {
    type: String,
    required: true
  },
  latitude: {
    type: Number,
    required: true
  },
  longitude: {
    type: Number,
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
    identityProof: String,
    addressProofUrl: String,
    aadharCardUrl: String,
    lightConnectionProofUrl: String
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
