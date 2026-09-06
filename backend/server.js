const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const compression = require('compression');
const fileUpload = require('express-fileupload');
require('dotenv').config({ path: path.join(__dirname, '.env') });

// Redis & Queue imports
const { getRedisClient, closeRedis } = require('./services/redisService');
// Initiate Redis connection immediately so it connects in parallel with module loading
getRedisClient();

const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/user');
const hostRoutes = require('./routes/host');
const adminRoutes = require('./routes/admin');
const contactRoutes = require('./routes/contact');
const paymentRoutes = require('./routes/payment');
const securityMiddleware = require('./middleware/security');

const { startEmailWorker, stopEmailWorker } = require('./workers/emailWorker');
const { startBookingExpiryWorker, stopBookingExpiryWorker } = require('./workers/bookingExpiryWorker');
const socketService = require('./services/socketService');

// Bull Board (queue monitoring dashboard)
const { createBullBoard } = require('@bull-board/api');
const { BullMQAdapter } = require('@bull-board/api/bullMQAdapter');
const { ExpressAdapter } = require('@bull-board/express');
const { getEmailQueue, getBookingExpiryQueue } = require('./queues/jobQueues');

const app = express();

// Trust reverse proxy (Render, AWS, Heroku, Nginx) so client IP is accurately extracted from X-Forwarded-For
app.set('trust proxy', 1);

// Enable compression for all responses
app.use(compression({
  level: 6,
  threshold: 1024
}));

app.use(securityMiddleware.helmet);
app.use(securityMiddleware.securityHeaders);

const allowedOrigins = [
  'http://localhost:3000',
  'https://chargeloop.vercel.app',
  process.env.FRONTEND_URL
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps, curl, server-to-server)
    if (!origin || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    return callback(null, false);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  maxAge: 3600
}));

// Increased JSON parsing limit for bulk operations
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// File upload middleware
app.use(fileUpload({
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB max
  useTempFiles: false,
  safeFileNames: true,
  preserveExtension: true
}));

app.use(securityMiddleware.mongoSanitize);
app.use(securityMiddleware.inputLengthValidator);
app.use(securityMiddleware.preventHttp);
app.use(securityMiddleware.requestValidator);

// ============================================================
// Bull Board — Queue Monitoring Dashboard
// ============================================================
const serverAdapter = new ExpressAdapter();
serverAdapter.setBasePath('/admin/queues');

createBullBoard({
  queues: [
    new BullMQAdapter(getEmailQueue()),
    new BullMQAdapter(getBookingExpiryQueue()),
  ],
  serverAdapter,
});

app.use('/admin/queues', serverAdapter.getRouter());

// ============================================================
// Database Connection
// ============================================================
mongoose.connect(process.env.MONGO_URI, {
  maxPoolSize: 50,        // Increase connection pool size
  minPoolSize: 10,        // Minimum connections
  serverSelectionTimeoutMS: 10000,
  socketTimeoutMS: 45000,
  retryWrites: true,
  w: 'majority'
})
  .then(() => console.log('✅ MongoDB Connected with Connection Pooling'))
  .catch((err) => console.log('❌ MongoDB Connection Error:', err));

// ============================================================
// Initialize Redis & BullMQ Workers
// ============================================================
try {
  getRedisClient(); // Establish Redis connection
  startEmailWorker(); // Start email processing worker
  startBookingExpiryWorker(); // Start booking expiry worker
} catch (err) {
  console.error('⚠️  Redis/Worker initialization error:', err.message);
  console.warn('⚠️  Server will run without Redis features. OTP and rate limiting will use fallback mode.');
}

// ============================================================
// API Routes
// ============================================================
app.use('/api/auth', authRoutes);
app.use('/api/user', userRoutes);
app.use('/api/host', hostRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/contact', contactRoutes);
app.use('/api/payment', paymentRoutes);

app.get('/', (req, res) => {
  const healthcheck = {
    uptime: process.uptime(),
    message: 'OK',
    timestamp: Date.now(),
    mongoStatus: mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected',
    redisStatus: getRedisClient()?.status || 'Unknown'
  };
  res.status(200).json(healthcheck);
});

const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));

// Initialize WebSockets
socketService.init(server).then(() => {
  console.log('✅ WebSockets (Socket.io) Initialized with Redis Adapter');
}).catch(err => {
  console.error('❌ WebSockets Initialization Error:', err);
});

// ============================================================
// Graceful Shutdown
// ============================================================
async function gracefulShutdown(signal) {
  console.log(`\n🛑 ${signal} received. Shutting down gracefully...`);

  server.close(async () => {
    console.log('✅ HTTP server closed');

    // Stop workers first (let them finish current jobs)
    await stopEmailWorker();
    await stopBookingExpiryWorker();

    // Close queue connections
    const { closeQueues } = require('./queues/jobQueues');
    await closeQueues();

    // Close Socket.io Redis adapter connections
    if (socketService.closeSocketAdapter) {
      await socketService.closeSocketAdapter();
    }

    // Close Redis
    await closeRedis();

    // Close MongoDB
    await mongoose.connection.close(false);
    console.log('✅ MongoDB connection closed');

    console.log('✅ Graceful shutdown complete');
    process.exit(0);
  });

  // Force kill after 10 seconds if graceful shutdown hangs
  setTimeout(() => {
    console.error('❌ Forced shutdown after timeout');
    process.exit(1);
  }, 10000);
}

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

