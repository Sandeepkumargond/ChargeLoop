const cluster = require('cluster');
const os = require('os');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const numCPUs = process.env.WORKER_THREADS || os.cpus().length;

if (cluster.isMaster) {
  console.log(`\n🚀 SCALING MODE ENABLED\n`);
  console.log(`Master process ${process.pid} is running`);
  console.log(`Spawning ${numCPUs} worker processes...\n`);

  // Spawn worker processes
  for (let i = 0; i < numCPUs; i++) {
    cluster.fork();
  }

  // Handle worker disconnection
  cluster.on('disconnect', (worker) => {
    console.log(`⚠️  Worker ${worker.process.pid} disconnected`);
  });

  // Handle worker death and restart
  cluster.on('exit', (worker, code, signal) => {
    console.log(`❌ Worker ${worker.process.pid} died (${signal || code}). Restarting...`);
    cluster.fork();
  });

  // Graceful shutdown
  process.on('SIGTERM', () => {
    console.log('\n🛑 SIGTERM received. Shutting down gracefully...\n');
    for (const id in cluster.workers) {
      cluster.workers[id].kill();
    }
    process.exit(0);
  });

} else {
  // Worker process - run the actual server
  const express = require('express');
  const mongoose = require('mongoose');
  const cors = require('cors');
  const compression = require('compression');

  const authRoutes = require('./routes/auth');
  const hostRoutes = require('./routes/host');
  const adminRoutes = require('./routes/admin');
  const contactRoutes = require('./routes/contact');
  const securityMiddleware = require('./middleware/security');

  const app = express();

  // Trust proxy for accurate client IP when behind load balancer
  app.set('trust proxy', 1);

  // Security middleware
  app.use(securityMiddleware.helmet);
  app.use(securityMiddleware.securityHeaders);

  // CORS configuration
  app.use(cors({
    origin: [
      'http://localhost:3000',
      'http://localhost:3001',
      process.env.FRONTEND_URL || '*'
    ],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    maxAge: 86400 // 24 hours
  }));

  // Compression middleware - reduces response size
  app.use(compression({
    threshold: 1024, // Only compress responses larger than 1KB
    level: 6 // Compression level 1-9, 6 is good balance
  }));

  // Body parsing with size limits
  app.use(express.json({ limit: '50kb' }));
  app.use(express.urlencoded({ limit: '50kb', extended: true }));

  // Security and validation middleware
  app.use(securityMiddleware.mongoSanitize);
  app.use(securityMiddleware.inputLengthValidator);
  app.use(securityMiddleware.preventHttp);
  app.use(securityMiddleware.requestValidator);

  // MongoDB connection with connection pooling
  const connectDB = async () => {
    try {
      await mongoose.connect(process.env.MONGO_URI, {
        maxPoolSize: 10, // Connection pool size
        minPoolSize: 5,
        maxIdleTimeMS: 45000,
        serverSelectionTimeoutMS: 5000,
        socketTimeoutMS: 45000,
      });
      console.log(`✅ Worker ${process.pid}: MongoDB Connected`);
    } catch (err) {
      console.error(`❌ Worker ${process.pid}: MongoDB connection failed`, err.message);
      setTimeout(connectDB, 5000);
    }
  };

  connectDB();

  // API Routes
  app.use('/api/host', hostRoutes);
  app.use('/api/auth', authRoutes);
  app.use('/api/admin', adminRoutes);
  app.use('/api/contact', contactRoutes);

  // Health check endpoint
  app.get('/api/health', (req, res) => {
    res.json({
      status: 'OK',
      worker: process.pid,
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      memory: {
        heapUsed: Math.round(process.memoryUsage().heapUsed / 1024 / 1024) + 'MB',
        heapTotal: Math.round(process.memoryUsage().heapTotal / 1024 / 1024) + 'MB'
      }
    });
  });

  // Metrics endpoint
  app.get('/api/metrics', (req, res) => {
    const uptime = process.uptime();
    const memUsage = process.memoryUsage();
    
    res.json({
      pid: process.pid,
      uptime: uptime,
      memory: {
        rss: Math.round(memUsage.rss / 1024 / 1024) + 'MB',
        heapTotal: Math.round(memUsage.heapTotal / 1024 / 1024) + 'MB',
        heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024) + 'MB',
        external: Math.round(memUsage.external / 1024 / 1024) + 'MB'
      },
      cpu: process.cpuUsage()
    });
  });

  // Error handling middleware
  app.use((err, req, res, next) => {
    console.error(`Worker ${process.pid} - Error:`, err.message);
    res.status(err.status || 500).json({
      error: process.env.NODE_ENV === 'production' ? 'Internal Server Error' : err.message
    });
  });

  // 404 handler
  app.use((req, res) => {
    res.status(404).json({ error: 'Route not found' });
  });

  const PORT = process.env.PORT || 5000;
  const server = app.listen(PORT, () => {
    console.log(`✅ Worker ${process.pid}: Server running on port ${PORT}`);
  });

  // Graceful shutdown for worker
  process.on('SIGTERM', () => {
    console.log(`\nWorker ${process.pid}: Shutting down gracefully...`);
    server.close(() => {
      mongoose.connection.close(false, () => {
        console.log(`Worker ${process.pid}: Shutdown complete`);
        process.exit(0);
      });
    });
  });

  // Handle uncaught exceptions
  process.on('uncaughtException', (err) => {
    console.error(`Worker ${process.pid} - Uncaught Exception:`, err);
    process.exit(1);
  });

  process.on('unhandledRejection', (reason, promise) => {
    console.error(`Worker ${process.pid} - Unhandled Rejection at:`, promise, 'reason:', reason);
  });
}
