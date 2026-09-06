const { Worker } = require('bullmq');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const mongoose = require('mongoose');
const { getBullMQConnectionOptions } = require('../services/redisService');

/**
 * Booking Expiry Worker
 * 
 * Auto-expires pending bookings that hosts haven't responded to.
 * Each booking gets a delayed job when created (default: 15 minutes).
 * If the host accepts/declines before the delay, the job is cancelled.
 */

let bookingExpiryWorker = null;

function startBookingExpiryWorker() {
  if (bookingExpiryWorker) return bookingExpiryWorker;

  bookingExpiryWorker = new Worker('chargeloop-booking-expiry', async (job) => {
    const { bookingId } = job.data;
    console.log(`⏰ [BookingExpiry] Processing expiry for booking ${bookingId}`);

    try {
      // Lazy-load to avoid circular dependencies
      const BookingRequest = require('../models/BookingRequest');

      const booking = await BookingRequest.findById(bookingId);

      if (!booking) {
        console.log(`⏰ [BookingExpiry] Booking ${bookingId} not found (already deleted)`);
        return;
      }

      // Only expire if still pending — host may have responded between queue time and now
      if (booking.status !== 'pending') {
        console.log(`⏰ [BookingExpiry] Booking ${bookingId} is '${booking.status}', skipping expiry`);
        return;
      }

      booking.status = 'expired';
      booking.hostResponse = {
        ...booking.hostResponse,
        respondedAt: new Date(),
        autoExpired: true,
        expiryReason: 'Host did not respond within the allowed time'
      };
      await booking.save();

      console.log(`✅ [BookingExpiry] Booking ${bookingId} expired successfully`);

      // Emit WebSocket event to notify user and host in real-time
      try {
        const { getIo } = require('../services/socketService');
        const io = getIo();
        if (booking.userId) {
          io.to(booking.userId.toString()).emit('booking_update', {
            bookingId: booking._id,
            status: 'expired',
            reason: 'Booking expired due to no host response'
          });
        }
        if (booking.hostId) {
          io.to(booking.hostId.toString()).emit('booking_update', {
            bookingId: booking._id,
            status: 'expired',
            reason: 'Booking expired due to no response'
          });
        }
      } catch (socketErr) {
        // Socket emission non-fatal
      }
    } catch (error) {
      console.error(`❌ [BookingExpiry] Error expiring booking ${bookingId}:`, error.message);
      throw error; // Re-throw for BullMQ retry
    }
  }, {
    connection: getBullMQConnectionOptions('BookingExpiryWorker'),
    concurrency: 10, // Can process multiple expiry checks in parallel
  });

  bookingExpiryWorker.on('completed', (job) => {
    console.log(`✅ [BookingExpiry] Job ${job.id} completed`);
  });

  bookingExpiryWorker.on('failed', (job, err) => {
    console.error(`❌ [BookingExpiry] Job ${job?.id} failed:`, err.message);
  });

  bookingExpiryWorker.on('error', (err) => {
    console.error('❌ [BookingExpiryWorker] Worker error:', err.message);
  });

  console.log('✅ Booking expiry worker started');
  return bookingExpiryWorker;
}

async function stopBookingExpiryWorker() {
  if (bookingExpiryWorker) {
    await bookingExpiryWorker.close();
    bookingExpiryWorker = null;
    console.log('✅ Booking expiry worker stopped');
  }
}

module.exports = { startBookingExpiryWorker, stopBookingExpiryWorker };
