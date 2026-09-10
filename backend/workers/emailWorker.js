const { Worker } = require('bullmq');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const { getBullMQConnectionOptions } = require('../services/redisService');
const {
  sendOtpEmail,
  sendBookingConfirmationEmail,
  sendBookingNotificationToHost,
  sendHostOnboardingEmail,
  sendHostApprovalEmail,
  sendHostDenialEmail,
  sendContactEmail,
} = require('../services/emailService');

/**
 * Email Worker
 * 
 * Processes all email jobs from the 'chargeloop-email' queue.
 * Runs either in-process (dev) or as a separate process (production).
 * 
 * Job types:
 *   - send-otp
 *   - booking-confirmation
 *   - booking-notification-host
 *   - host-onboarding
 *   - host-approval
 *   - host-denial
 *   - contact-form
 */

let emailWorker = null;

function startEmailWorker() {
  if (emailWorker) return emailWorker;

  emailWorker = new Worker('chargeloop-email', async (job) => {
    const startTime = Date.now();
    console.log(`📧 [EmailWorker] Processing job ${job.id} | type: ${job.name}`);

    try {
      switch (job.name) {
        case 'send-otp':
          await sendOtpEmail(job.data.email, job.data.otp);
          break;

        case 'booking-confirmation':
          await sendBookingConfirmationEmail(job.data.userEmail, job.data.bookingDetails);
          break;

        case 'booking-notification-host':
          await sendBookingNotificationToHost(job.data.hostData, job.data.bookingData);
          break;

        case 'host-onboarding':
          await sendHostOnboardingEmail(job.data.hostData);
          break;

        case 'host-approval':
          await sendHostApprovalEmail(job.data.email, job.data.name);
          break;

        case 'host-denial':
          await sendHostDenialEmail(job.data.email, job.data.name, job.data.denialReason);
          break;

        case 'contact-form':
          await sendContactEmail(job.data.contactData);
          break;

        default:
          console.warn(`⚠️  [EmailWorker] Unknown job type: ${job.name}`);
      }

      const duration = Date.now() - startTime;
      console.log(`✅ [EmailWorker] Job ${job.id} completed in ${duration}ms`);
    } catch (error) {
      console.error(`❌ [EmailWorker] Job ${job.id} failed:`, error.message);
      throw error; // Re-throw so BullMQ retries
    }
  }, {
    connection: getBullMQConnectionOptions('EmailWorker'),
    concurrency: 5,       // Process up to 5 emails concurrently
    limiter: {
      max: 60,            // Max 60 emails per minute (SendGrid standard rate limit)
      duration: 60000,
    },
  });

  emailWorker.on('completed', (job) => {
    console.log(`✅ [EmailWorker] Job ${job.id} (${job.name}) completed`);
  });

  emailWorker.on('failed', (job, err) => {
    console.error(`❌ [EmailWorker] Job ${job?.id} (${job?.name}) failed after ${job?.attemptsMade} attempts:`, err.message);
  });

  emailWorker.on('error', (err) => {
    console.error('❌ [EmailWorker] Worker error:', err.message);
  });

  console.log('✅ Email worker started (concurrency: 5, rate limit: 20/min)');
  return emailWorker;
}

async function stopEmailWorker() {
  if (emailWorker) {
    await emailWorker.close();
    emailWorker = null;
    console.log('✅ Email worker stopped');
  }
}

module.exports = { startEmailWorker, stopEmailWorker };
