const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const authRoutes = require('./routes/auth');
const hostRoutes = require('./routes/host');
const walletRoutes = require('./routes/wallet');
const chargingRoutes = require('./routes/charging');
const chargerRoutes = require('./routes/charger');
const adminRoutes = require('./routes/admin');
const contactRoutes = require('./routes/contact');
const reviewsRoutes = require('./routes/reviews');
const securityMiddleware = require('./middleware/security');

const app = express();

app.use(securityMiddleware.helmet);
app.use(securityMiddleware.securityHeaders);

app.use(cors({
  origin: '*',
  credentials: false,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  maxAge: 3600
}));

app.use(express.json({ limit: '10kb' }));
app.use(securityMiddleware.mongoSanitize);
app.use(securityMiddleware.inputLengthValidator);
app.use(securityMiddleware.preventHttp);
app.use(securityMiddleware.requestValidator);

mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('MongoDB Connected'))
  .catch((err) => console.log(err));

app.use('/api/host', hostRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/wallet', walletRoutes);
app.use('/api/charging', chargingRoutes);
app.use('/api/chargers', chargerRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/contact', contactRoutes);
app.use('/api/reviews', reviewsRoutes);

app.get('/api/health', (req, res) => {
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
