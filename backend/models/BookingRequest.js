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
  userPhone: {
    type: String,
    description: 'User phone number for contact'
  },
  hostPhone: {
    type: String,
    description: 'Host phone number for contact'
  },
  chargerType: {
    type: String,
    required: true
  },
  // Pricing fields - Energy-based approach
  pricePerUnit: {
    type: Number,
    min: 0,
    description: 'Host price per kWh at time of booking (₹)'
  },
  pricePerKwh: {
    type: Number,
    min: 0,
    description: 'Host price per kWh at time of booking (₹)'
  },
  
  // Host-related fields
  socketMaxCapacity: {
    type: Number,
    description: 'Host socket max capacity in kW (safety limit)'
  },
  convenienceFee: {
    type: Number,
    default: 0,
    min: 0,
    description: 'Host convenience fee in ₹'
  },
  platformFee: {
    type: Number,
    default: () => parseFloat(process.env.PLATFORM_FEE) || 10,
    min: 0,
    description: 'ChargeLoop platform fee in ₹'
  },
  
  // User inputs
  userChargerPowerKw: {
    type: Number,
    required: true,
    description: 'User portable charger power in kW (e.g., 2.5, 3.3, 7.2)'
  },
  requestedDuration: {
    type: Number,
    required: true,
    min: 0,
    description: 'Duration user wants to charge in minutes'
  },
  // Charger specs

  
  // Safety & Validation
  safetyAlert: {
    type: String,
    enum: [null, 'charger_too_powerful', 'other'],
    default: null,
    description: 'Safety alert if user charger exceeds socket capacity'
  },
  safetyAlertMessage: {
    type: String,
    description: 'Detailed safety alert message'
  },
  
  // System-calculated pricing values
  totalUnitsKwh: {
    type: Number,
    description: 'Total units in kWh: User_Charger_kW × Booking_Duration_Hours'
  },
  desiredKwh: {
    type: Number,
    description: 'Total units in kWh alias'
  },
  
  // Detailed pricing breakdown
  energyCost: {
    type: Number,
    description: 'Energy cost: totalUnitsKwh × pricePerUnit'
  },
  estimatedRange: {
    type: Number,
    description: 'Estimated range in km: totalUnitsKwh × 7 (average 1 unit = 7km)'
  },
  totalBill: {
    type: Number,
    description: 'Final bill: energyCost + convenienceFee + platformFee'
  },
  estimatedCost: {
    type: Number,
    description: 'Final bill alias'
  },
  estimatedDuration: {
    type: Number,
    description: 'Estimated duration in minutes'
  },
  
  vehicleNumber: {
    type: String,
    required: true
  },
  vehicleType: {
    type: String,
    required: true
  },
  vehicleModel: {
    type: String,
    description: 'Vehicle model (e.g., Tesla Model 3)'
  },
  vehicleBatteryCapacity: {
    type: Number,
    description: 'Vehicle battery capacity in kWh'
  },
  scheduledTime: {
    type: Date,
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'accepted', 'declined', 'expired', 'ongoing', 'completed', 'cancelled'],
    default: 'pending'
  },
  // Payment tracking fields
  paymentStatus: {
    type: String,
    enum: ['unpaid', 'pending', 'paid', 'refunded'],
    default: 'unpaid'
  },
  paymentMethod: {
    type: String,
    enum: ['upi', 'card', 'netbanking', 'wallet', 'razorpay', 'cash', 'direct', 'online', null],
    default: null
  },
  paymentId: {
    type: String,
    description: 'Razorpay or gateway payment ID'
  },
  orderId: {
    type: String,
    description: 'Razorpay or gateway order ID'
  },
  paidAt: {
    type: Date
  },
  payoutStatus: {
    type: String,
    enum: ['pending', 'processed', 'failed'],
    default: 'pending'
  },
  requestId: {
    type: String,
    unique: true,
    required: true
  },
  startTime: {
    type: Date
  },
  endTime: {
    type: Date
  },
  actualDuration: {
    type: Number
  },
  rating: {
    type: Number,
    min: 1,
    max: 5
  },
  review: {
    type: String
  },
  hostResponse: {
    respondedAt: Date,
    acceptedAt: Date,
    declinedAt: Date,
    declineReason: String,
    autoExpired: Boolean,
    expiryReason: String
  },
  metadata: {
    chargerId: String,
    amenities: [String],
    hostRating: Number,
    distance: Number,
    userLocation: {
      lat: Number,
      lng: Number
    }
  }
}, { timestamps: true });

bookingRequestSchema.index({ userId: 1, createdAt: -1 });
bookingRequestSchema.index({ hostId: 1, status: 1 });
bookingRequestSchema.index({ status: 1 });

module.exports = mongoose.model('BookingRequest', bookingRequestSchema);
