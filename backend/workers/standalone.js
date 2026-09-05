/**
 * Standalone Worker Process
 * 
 * Run this as a separate process/container to process BullMQ jobs
 * independently from the API server.
 * 
 * Usage:
 *   node workers/standalone.js
 * 
 * In Kubernetes, this runs in the worker deployment pods
 * (see k8s/worker-deployment.yaml).
 */

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const mongoose = require('mongoose');
const { getRedisClient, closeRedis } = require('../services/redisService');
const { startEmailWorker, stopEmailWorker } = require('./emailWorker');
const { startBookingExpiryWorker, stopBookingExpiryWorker } = require('./bookingExpiryWorker');

async function main() {
  console.log('🔧 Starting ChargeLoop Workers (standalone mode)...\n');

  // Connect to MongoDB (needed for booking expiry worker)
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      maxPoolSize: 5,
      minPoolSize: 2,
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000,
    });
    console.log('✅ MongoDB connected (worker mode)');
  } catch (err) {
    console.error('❌ MongoDB connection failed:', err.message);
    process.exit(1);
  }

  // Connect to Redis
  try {
    getRedisClient();
  } catch (err) {
    console.error('❌ Redis connection failed:', err.message);
    process.exit(1);
  }

  // Start workers
  startEmailWorker();
  startBookingExpiryWorker();

  console.log('\n✅ All workers running. Waiting for jobs...\n');
}

// Graceful shutdown
async function shutdown(signal) {
  console.log(`\n🛑 ${signal} received. Shutting down workers...`);

  await stopEmailWorker();
  await stopBookingExpiryWorker();
  await closeRedis();
  await mongoose.connection.close(false);

  console.log('✅ Worker shutdown complete');
  process.exit(0);
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

main().catch(err => {
  console.error('❌ Worker startup failed:', err);
  process.exit(1);
});
