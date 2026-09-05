const { Queue } = require('bullmq');
const { getBullMQConnectionOptions } = require('../services/redisService');

/**
 * ChargeLoop Email Queue
 * 
 * All email sending goes through this queue for:
 * - Guaranteed delivery with retries
 * - Non-blocking API responses
 * - Works correctly across cluster workers
 * - Centralized monitoring via Bull Board
 */

let emailQueue = null;
let bookingExpiryQueue = null;

/**
 * Get or create the email queue
 */
function getEmailQueue() {
  if (emailQueue) return emailQueue;

  emailQueue = new Queue('chargeloop-email', {
    connection: getBullMQConnectionOptions(),
    defaultJobOptions: {
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 5000, // 5s → 10s → 20s
      },
      removeOnComplete: { count: 100 },  // Keep last 100 completed jobs
      removeOnFail: { count: 500 },      // Keep last 500 failed jobs for debugging
    },
  });

  return emailQueue;
}

/**
 * Get or create the booking expiry queue
 */
function getBookingExpiryQueue() {
  if (bookingExpiryQueue) return bookingExpiryQueue;

  bookingExpiryQueue = new Queue('chargeloop-booking-expiry', {
    connection: getBullMQConnectionOptions(),
    defaultJobOptions: {
      attempts: 2,
      backoff: { type: 'fixed', delay: 3000 },
      removeOnComplete: { count: 200 },
      removeOnFail: { count: 100 },
    },
  });

  return bookingExpiryQueue;
}

// ============================================================
// Email Job Helpers — enqueue emails by type
// ============================================================

/**
 * Queue an OTP verification email
 */
async function enqueueOtpEmail(email, otp) {
  const queue = getEmailQueue();
  return queue.add('send-otp', { email, otp }, {
    priority: 1, // Highest priority — user is waiting
  });
}

/**
 * Queue a booking confirmation email to user
 */
async function enqueueBookingConfirmation(userEmail, bookingDetails) {
  const queue = getEmailQueue();
  return queue.add('booking-confirmation', { userEmail, bookingDetails }, {
    priority: 1,
  });
}

/**
 * Queue a booking notification to host
 */
async function enqueueBookingNotificationToHost(hostData, bookingData) {
  const queue = getEmailQueue();
  return queue.add('booking-notification-host', { hostData, bookingData }, {
    priority: 2,
  });
}

/**
 * Queue a host onboarding email
 */
async function enqueueHostOnboardingEmail(hostData) {
  const queue = getEmailQueue();
  return queue.add('host-onboarding', { hostData }, {
    priority: 3,
  });
}

/**
 * Queue a host approval email
 */
async function enqueueHostApprovalEmail(email, name) {
  const queue = getEmailQueue();
  return queue.add('host-approval', { email, name }, {
    priority: 2,
  });
}

/**
 * Queue a host denial email
 */
async function enqueueHostDenialEmail(email, name, denialReason) {
  const queue = getEmailQueue();
  return queue.add('host-denial', { email, name, denialReason }, {
    priority: 2,
  });
}

/**
 * Queue a contact form email
 */
async function enqueueContactEmail(contactData) {
  const queue = getEmailQueue();
  return queue.add('contact-form', { contactData }, {
    priority: 4, // Lowest priority
  });
}

// ============================================================
// Booking Expiry Job Helper
// ============================================================

/**
 * Schedule a booking to auto-expire after a delay
 * @param {string} bookingId - MongoDB ObjectId as string
 * @param {number} delayMs - Delay in milliseconds (default: 15 minutes)
 */
async function scheduleBookingExpiry(bookingId, delayMs = 15 * 60 * 1000) {
  const queue = getBookingExpiryQueue();
  return queue.add('expire-booking', { bookingId }, {
    delay: delayMs,
    jobId: `expire:${bookingId}`, // Prevent duplicate expiry jobs
  });
}

/**
 * Cancel a scheduled booking expiry (e.g., when host accepts)
 * @param {string} bookingId
 */
async function cancelBookingExpiry(bookingId) {
  const queue = getBookingExpiryQueue();
  const job = await queue.getJob(`expire:${bookingId}`);
  if (job) {
    await job.remove();
  }
}

// ============================================================
// Cleanup
// ============================================================

async function closeQueues() {
  const promises = [];
  if (emailQueue) {
    promises.push(emailQueue.close());
    emailQueue = null;
  }
  if (bookingExpiryQueue) {
    promises.push(bookingExpiryQueue.close());
    bookingExpiryQueue = null;
  }
  await Promise.all(promises);
  console.log('✅ BullMQ queues closed');
}

module.exports = {
  getEmailQueue,
  getBookingExpiryQueue,
  // Email helpers
  enqueueOtpEmail,
  enqueueBookingConfirmation,
  enqueueBookingNotificationToHost,
  enqueueHostOnboardingEmail,
  enqueueHostApprovalEmail,
  enqueueHostDenialEmail,
  enqueueContactEmail,
  // Booking expiry
  scheduleBookingExpiry,
  cancelBookingExpiry,
  // Lifecycle
  closeQueues,
};
