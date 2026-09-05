const { Server } = require('socket.io');
const { createAdapter } = require('@socket.io/redis-adapter');
const Redis = require('ioredis');
const jwt = require('jsonwebtoken');
const { getRedisConnectionOptions } = require('./redisService');

let io;
let pubClient = null;
let subClient = null;

const init = async (server) => {
  const allowedOrigins = [
    'http://localhost:3000',
    'https://chargeloop.vercel.app',
    process.env.FRONTEND_URL
  ].filter(Boolean);

  io = new Server(server, {
    cors: {
      origin: allowedOrigins,
      methods: ['GET', 'POST', 'PUT', 'DELETE'],
      credentials: true
    }
  });

  const redisOptions = getRedisConnectionOptions();
  pubClient = new Redis(redisOptions);
  subClient = pubClient.duplicate();

  pubClient.on('error', (err) => {
    console.error('❌ [Socket.io Redis Pub] Error:', err.message);
  });
  subClient.on('error', (err) => {
    console.error('❌ [Socket.io Redis Sub] Error:', err.message);
  });

  io.adapter(createAdapter(pubClient, subClient));

  // Authentication Middleware
  io.use((socket, next) => {
    const token = socket.handshake.auth.token;
    if (!token) {
      return next(new Error('Authentication error: No token provided'));
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.user = decoded; // { id: userId, ... }
      next();
    } catch (err) {
      next(new Error('Authentication error: Invalid token'));
    }
  });

  io.on('connection', (socket) => {
    console.log(`Socket connected: ${socket.id} (User: ${socket.user.id})`);
    
    // Join a room based on the user's ID
    socket.join(socket.user.id);

    socket.on('disconnect', () => {
      console.log(`Socket disconnected: ${socket.id}`);
    });
  });

  return io;
};

const getIo = () => {
  if (!io) {
    throw new Error('Socket.io is not initialized!');
  }
  return io;
};

const closeSocketAdapter = async () => {
  const promises = [];
  if (pubClient) {
    promises.push(pubClient.quit().catch(() => {}));
    pubClient = null;
  }
  if (subClient) {
    promises.push(subClient.quit().catch(() => {}));
    subClient = null;
  }
  await Promise.all(promises);
};

module.exports = {
  init,
  getIo,
  closeSocketAdapter
};
