const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const compression = require('compression');
const fileUpload = require('express-fileupload');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/user');
const hostRoutes = require('./routes/host');
const adminRoutes = require('./routes/admin');
const contactRoutes = require('./routes/contact');
const securityMiddleware = require('./middleware/security');

const app = express();


process.setMaxListeners(100);

// Enable compression for all responses
app.use(compression({
  level: 6,
  threshold: 1024
}));

app.use(securityMiddleware.helmet);
app.use(securityMiddleware.securityHeaders);

app.use(cors({
  origin: '*',
  credentials: false,
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

mongoose.connect(process.env.MONGO_URI, {
  maxPoolSize: 50,        // Increase connection pool size
  minPoolSize: 10,        // Minimum connections
  serverSelectionTimeoutMS: 10000,
  socketTimeoutMS: 45000,
  retryWrites: true,
  w: 'majority'
})
  .then(() => console.log('MongoDB Connected with Connection Pooling'))
  .catch((err) => console.log('MongoDB Connection Error:', err));

app.use('/api/auth', authRoutes);
app.use('/api/user', userRoutes);
app.use('/api/host', hostRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/contact', contactRoutes);

app.get('/', (req, res) => {
  const healthcheck = {
    uptime: process.uptime(),
    message: 'OK',
    timestamp: Date.now(),
    mongoStatus: mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected'
  };
  res.status(200).json(healthcheck);
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
