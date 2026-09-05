const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  type: {
    type: String,
    enum: ['credit', 'debit'],
    required: true
  },
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  description: {
    type: String,
    required: true
  },
  paymentMethod: {
    type: String,
    enum: ['upi', 'card', 'netbanking', 'wallet', 'razorpay', 'direct', 'cash'],
    default: 'razorpay'
  },
  status: {
    type: String,
    enum: ['pending', 'completed', 'failed', 'refunded'],
    default: 'completed'
  },
  hostId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Host'
  },
  bookingId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'BookingRequest'
  },
  referenceId: String,
  orderId: String,
  paymentId: String,
  metadata: {
    sessionId: String,
    location: String,
    chargerId: String,
    energyConsumed: Number,
    pricePerKwh: Number,
    payoutDetails: mongoose.Schema.Types.Mixed
  }
}, { timestamps: true });

transactionSchema.index({ userId: 1, createdAt: -1 });
transactionSchema.index({ hostId: 1, createdAt: -1 });
transactionSchema.index({ bookingId: 1 });
transactionSchema.index({ type: 1 });

module.exports = mongoose.model('Transaction', transactionSchema);
