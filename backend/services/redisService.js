const Redis = require('ioredis');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

/**
 * Redis Service for ChargeLoop
 * 
 * Provides a shared Redis connection for:
 * - OTP storage (replaces global.otpStore)
 * - Rate limiting (shared across cluster workers)
 * - JWT token blacklisting
 * - Charger/host data caching
 * - BullMQ job queues
 */

// Singleton Redis instances
let redisClient = null;
let subscriberClient = null;

// Track initialized client tags to avoid log flooding
const loggedTags = new Set();
// In-memory fallback stores for high resilience (reconnection, offline or cold start)
const memoryOtpStore = new Map();
const memoryCacheStore = new Map();

/**
 * Parse REDIS_URL and produce production-ready ioredis connection options.
 * Compatible with local Redis, Docker, and Cloud providers (Upstash, Render, AWS, Heroku).
 * 
 * @param {string} clientTag - Component identifier (e.g. 'MainRedis', 'EmailWorker', 'SocketPub')
 */
function getRedisConnectionOptions(clientTag = 'MainRedis') {
  const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';

  try {
    const parsed = new URL(redisUrl);
    const isUpstash = parsed.hostname.includes('upstash.io');
    // Upstash ALWAYS requires TLS. Also enable TLS if rediss: is specified or explicit env flag
    const isTls = parsed.protocol === 'rediss:' || isUpstash || process.env.REDIS_TLS === 'true';

    const options = {
      host: parsed.hostname || 'localhost',
      port: Number(parsed.port) || 6379,
      username: parsed.username ? decodeURIComponent(parsed.username) : undefined,
      password: parsed.password ? decodeURIComponent(parsed.password) : undefined,
      maxRetriesPerRequest: null, // Required by BullMQ
      enableReadyCheck: false,    // Prevents INFO command failures on cloud/proxy Redis
      keepAlive: 10000,           // 10s TCP keepalive prevents idle connection drops (ECONNRESET)
      connectTimeout: 8000,
      protocol: 2,                // Force RESP2: eliminates HELLO 3 which causes ECONNRESET on Render/Upstash
      disableClientInfo: true,    // Disable CLIENT SETINFO: prevents proxy connection resets
      retryStrategy(times) {
        const delay = Math.min(times * 250, 5000);
        if (times <= 3 || times % 20 === 0) {
          console.log(`⚠️  [${clientTag}] Redis reconnecting in ${delay}ms (attempt ${times})`);
        }
        return delay;
      },
      reconnectOnError(err) {
        const targetError = 'READONLY';
        return Boolean(err && err.message && err.message.includes(targetError));
      }
    };

    if (isTls) {
      // Cloud Redis providers (Upstash, Render, Heroku) require SNI servername
      options.tls = {
        servername: parsed.hostname,
        rejectUnauthorized: process.env.REDIS_TLS_REJECT_UNAUTHORIZED === 'true',
      };
    }

    if (!loggedTags.has(clientTag)) {
      loggedTags.add(clientTag);
      console.log(`📡 [${clientTag}] Redis config initialized: host=${options.host}, port=${options.port}, tls=${Boolean(options.tls)}, protocol=${options.protocol}`);
    }

    return options;
  } catch (err) {
    console.error(`❌ [${clientTag}] Error parsing REDIS_URL:`, err.message);
    return {
      host: 'localhost',
      port: 6379,
      maxRetriesPerRequest: null,
      enableReadyCheck: false,
      keepAlive: 10000,
      protocol: 2,
      disableClientInfo: true,
      retryStrategy(times) {
        return Math.min(times * 250, 5000);
      }
    };
  }
}

/**
 * Get dedicated Redis connection options for BullMQ queues and workers.
 * BullMQ uses this to instantiate and manage its own isolated connections.
 * 
 * @param {string} clientTag - BullMQ component identifier (e.g. 'EmailQueue', 'EmailWorker')
 */
function getBullMQConnectionOptions(clientTag = 'BullMQ') {
  return getRedisConnectionOptions(clientTag);
}

/**
 * Create and return the main Redis client (singleton)
 */
function getRedisClient() {
  if (redisClient) return redisClient;

  const options = getRedisConnectionOptions('MainRedis');
  redisClient = new Redis(options);

  redisClient.on('connect', () => {
    console.log('✅ [MainRedis] Connected');
  });

  redisClient.on('ready', () => {
    console.log('🚀 [MainRedis] Ready');
  });

  redisClient.on('error', (err) => {
    console.error('❌ [MainRedis] Error:', err.message);
  });

  redisClient.on('close', () => {
    console.warn('⚠️  [MainRedis] Connection closed');
  });

  return redisClient;
}

/**
 * Get a duplicate connection for pub/sub
 */
function getSubscriberClient() {
  if (subscriberClient) return subscriberClient;
  subscriberClient = getRedisClient().duplicate();
  return subscriberClient;
}

/**
 * Legacy helper for BullMQ connection
 */
function getBullMQConnection() {
  return {
    connection: getBullMQConnectionOptions(),
  };
}

// ============================================================
// OTP Operations (with in-memory resilience fallback)
// ============================================================

const OTP_PREFIX = 'otp:';
const OTP_TTL = 600; // 10 minutes in seconds
const OTP_MAX_ATTEMPTS = 5;

/**
 * Store an OTP for email verification
 * @param {string} email - User's email
 * @param {string} otp - 6-digit OTP
 * @param {number} ttl - Time to live in seconds (default: 600 = 10 min)
 */
async function storeOtp(email, otp, ttl = OTP_TTL) {
  const normEmail = email.toLowerCase().trim();
  const key = `${OTP_PREFIX}${normEmail}`;
  const data = JSON.stringify({
    otp,
    attempts: 0,
    createdAt: Date.now()
  });

  // Always store in memory fallback so OTP is instantly available
  memoryOtpStore.set(normEmail, {
    otp,
    attempts: 0,
    createdAt: Date.now(),
    expiresAt: Date.now() + ttl * 1000
  });

  try {
    const client = getRedisClient();
    if (client && client.status === 'ready') {
      await Promise.race([
        client.setex(key, ttl, data),
        new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 2000))
      ]);
    }
  } catch (err) {
    console.warn(`⚠️ [Redis] storeOtp using memory store fallback: ${err.message}`);
  }
}

/**
 * Verify an OTP
 * @param {string} email - User's email
 * @param {string} otp - OTP to verify
 * @returns {{ valid: boolean, reason: string }}
 */
async function verifyOtp(email, otp) {
  const normEmail = email.toLowerCase().trim();
  const key = `${OTP_PREFIX}${normEmail}`;
  let data = null;

  try {
    const client = getRedisClient();
    if (client && client.status === 'ready') {
      const stored = await Promise.race([
        client.get(key),
        new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 2000))
      ]);
      if (stored) {
        data = JSON.parse(stored);
      }
    }
  } catch (err) {
    console.warn(`⚠️ [Redis] verifyOtp fallback to memory store: ${err.message}`);
  }

  // Fallback to memory store if Redis didn't yield the key
  if (!data && memoryOtpStore.has(normEmail)) {
    const memData = memoryOtpStore.get(normEmail);
    if (Date.now() <= memData.expiresAt) {
      data = memData;
    } else {
      memoryOtpStore.delete(normEmail);
    }
  }
  
  if (!data) {
    return { valid: false, reason: 'OTP not found or expired. Please request a new OTP' };
  }

  // Check max attempts
  if (data.attempts >= OTP_MAX_ATTEMPTS) {
    deleteOtp(email).catch(() => {});
    return { valid: false, reason: 'Too many failed attempts. Please request a new OTP' };
  }

  // Check OTP match
  if (data.otp !== otp) {
    data.attempts += 1;
    if (memoryOtpStore.has(normEmail)) {
      memoryOtpStore.get(normEmail).attempts = data.attempts;
    }
    try {
      const client = getRedisClient();
      if (client && client.status === 'ready') {
        const ttl = await client.ttl(key);
        if (ttl > 0) {
          await client.setex(key, ttl, JSON.stringify(data));
        }
      }
    } catch (e) {}
    return { valid: false, reason: 'Invalid OTP' };
  }

  // OTP is valid — delete it (one-time use)
  await deleteOtp(email);
  return { valid: true, reason: 'OTP verified successfully' };
}

/**
 * Delete an OTP (cleanup)
 * @param {string} email
 */
async function deleteOtp(email) {
  const normEmail = email.toLowerCase().trim();
  memoryOtpStore.delete(normEmail);
  try {
    const client = getRedisClient();
    if (client && client.status === 'ready') {
      await client.del(`${OTP_PREFIX}${normEmail}`);
    }
  } catch (err) {}
}

// ============================================================
// JWT Blacklist Operations
// ============================================================

const BLACKLIST_PREFIX = 'blacklist:';

/**
 * Blacklist a JWT token (on logout)
 * @param {string} tokenId - JWT token ID or the token itself
 * @param {number} expiresInSeconds - How long to keep in blacklist
 */
async function blacklistToken(tokenId, expiresInSeconds = 7 * 24 * 3600) {
  try {
    const client = getRedisClient();
    if (client && client.status === 'ready') {
      await client.setex(`${BLACKLIST_PREFIX}${tokenId}`, expiresInSeconds, 'revoked');
    }
  } catch (err) {}
}

/**
 * Check if a token is blacklisted
 * @param {string} tokenId
 * @returns {boolean}
 */
async function isTokenBlacklisted(tokenId) {
  try {
    const client = getRedisClient();
    if (client && client.status === 'ready') {
      const result = await client.get(`${BLACKLIST_PREFIX}${tokenId}`);
      return result !== null;
    }
  } catch (err) {}
  return false;
}

// ============================================================
// Cache Operations (with fallback)
// ============================================================

const CACHE_PREFIX = 'cache:';

/**
 * Get cached data
 * @param {string} key - Cache key
 * @returns {any|null} Parsed data or null if not cached
 */
async function getCache(key) {
  try {
    const client = getRedisClient();
    if (client && client.status === 'ready') {
      const data = await Promise.race([
        client.get(`${CACHE_PREFIX}${key}`),
        new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 1000))
      ]);
      return data ? JSON.parse(data) : null;
    }
  } catch (err) {}

  // Check memory cache fallback
  if (memoryCacheStore.has(key)) {
    const item = memoryCacheStore.get(key);
    if (Date.now() <= item.expiresAt) {
      return item.data;
    }
    memoryCacheStore.delete(key);
  }

  return null;
}

/**
 * Set cached data with TTL
 * @param {string} key - Cache key
 * @param {any} data - Data to cache (will be JSON.stringify'd)
 * @param {number} ttl - Time to live in seconds
 */
async function setCache(key, data, ttl = 30) {
  memoryCacheStore.set(key, {
    data,
    expiresAt: Date.now() + ttl * 1000
  });

  try {
    const client = getRedisClient();
    if (client && client.status === 'ready') {
      await client.setex(`${CACHE_PREFIX}${key}`, ttl, JSON.stringify(data));
    }
  } catch (err) {}
}

/**
 * Invalidate (delete) a cache key
 * @param {string} key - Cache key
 */
async function invalidateCache(key) {
  memoryCacheStore.delete(key);
  try {
    const client = getRedisClient();
    if (client && client.status === 'ready') {
      await client.del(`${CACHE_PREFIX}${key}`);
    }
  } catch (err) {}
}

/**
 * Invalidate all cache keys matching a pattern
 * @param {string} pattern - e.g. 'hosts:*'
 */
async function invalidateCachePattern(pattern) {
  memoryCacheStore.clear();
  try {
    const client = getRedisClient();
    if (client && client.status === 'ready') {
      const keys = await client.keys(`${CACHE_PREFIX}${pattern}`);
      if (keys.length > 0) {
        await client.del(...keys);
      }
    }
  } catch (err) {}
}

// ============================================================
// Graceful Shutdown
// ============================================================

async function closeRedis() {
  const promises = [];
  if (redisClient) {
    promises.push(redisClient.quit());
    redisClient = null;
  }
  if (subscriberClient) {
    promises.push(subscriberClient.quit());
    subscriberClient = null;
  }
  await Promise.all(promises);
  console.log('✅ Redis connections closed');
}

module.exports = {
  getRedisClient,
  getSubscriberClient,
  getRedisConnectionOptions,
  getBullMQConnectionOptions,
  getBullMQConnection,
  // OTP
  storeOtp,
  verifyOtp,
  deleteOtp,
  // JWT Blacklist
  blacklistToken,
  isTokenBlacklisted,
  // Cache
  getCache,
  setCache,
  invalidateCache,
  invalidateCachePattern,
  // Lifecycle
  closeRedis,
};
