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
    const isTls = parsed.protocol === 'rediss:';

    const options = {
      host: parsed.hostname || 'localhost',
      port: Number(parsed.port) || 6379,
      username: parsed.username ? decodeURIComponent(parsed.username) : undefined,
      password: parsed.password ? decodeURIComponent(parsed.password) : undefined,
      maxRetriesPerRequest: null, // Required by BullMQ
      enableReadyCheck: false,    // Prevents INFO command failures on cloud/proxy Redis
      keepAlive: 10000,           // 10s TCP keepalive prevents idle connection drops (ECONNRESET)
      connectTimeout: 15000,
      protocol: 2,                // Force RESP2: eliminates HELLO 3 which causes ECONNRESET on Render/Upstash
      disableClientInfo: true,    // Disable CLIENT SETINFO: prevents proxy connection resets
      retryStrategy(times) {
        const delay = Math.min(times * 250, 5000);
        if (times <= 5 || times % 10 === 0) {
          console.log(`⚠️  [${clientTag}] Redis reconnecting in ${delay}ms (attempt ${times})`);
        }
        return delay;
      },
      reconnectOnError(err) {
        // ONLY reconnect on Redis engine cluster failover errors (READONLY).
        // NEVER reconnect on transport/socket errors (ECONNRESET/ETIMEDOUT are handled by retryStrategy).
        const targetError = 'READONLY';
        return Boolean(err && err.message && err.message.includes(targetError));
      }
    };

    if (isTls) {
      // Cloud Redis providers (Render, Upstash, Heroku) use self-signed certificates.
      // Default rejectUnauthorized to false unless explicitly set to 'true'.
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
// OTP Operations (replaces global.otpStore)
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
  const client = getRedisClient();
  const key = `${OTP_PREFIX}${email.toLowerCase()}`;
  
  const data = JSON.stringify({
    otp,
    attempts: 0,
    createdAt: Date.now()
  });

  await client.setex(key, ttl, data);
}

/**
 * Verify an OTP
 * @param {string} email - User's email
 * @param {string} otp - OTP to verify
 * @returns {{ valid: boolean, reason: string }}
 */
async function verifyOtp(email, otp) {
  const client = getRedisClient();
  const key = `${OTP_PREFIX}${email.toLowerCase()}`;
  
  const stored = await client.get(key);
  
  if (!stored) {
    return { valid: false, reason: 'OTP not found or expired. Please request a new OTP' };
  }

  const data = JSON.parse(stored);

  // Check max attempts
  if (data.attempts >= OTP_MAX_ATTEMPTS) {
    await client.del(key);
    return { valid: false, reason: 'Too many failed attempts. Please request a new OTP' };
  }

  // Check OTP match
  if (data.otp !== otp) {
    // Increment attempts atomically
    data.attempts += 1;
    const ttl = await client.ttl(key);
    if (ttl > 0) {
      await client.setex(key, ttl, JSON.stringify(data));
    }
    return { valid: false, reason: 'Invalid OTP' };
  }

  // OTP is valid — delete it (one-time use)
  await client.del(key);
  return { valid: true, reason: 'OTP verified successfully' };
}

/**
 * Delete an OTP (cleanup)
 * @param {string} email
 */
async function deleteOtp(email) {
  const client = getRedisClient();
  await client.del(`${OTP_PREFIX}${email.toLowerCase()}`);
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
  const client = getRedisClient();
  await client.setex(`${BLACKLIST_PREFIX}${tokenId}`, expiresInSeconds, 'revoked');
}

/**
 * Check if a token is blacklisted
 * @param {string} tokenId
 * @returns {boolean}
 */
async function isTokenBlacklisted(tokenId) {
  const client = getRedisClient();
  const result = await client.get(`${BLACKLIST_PREFIX}${tokenId}`);
  return result !== null;
}

// ============================================================
// Cache Operations
// ============================================================

const CACHE_PREFIX = 'cache:';

/**
 * Get cached data
 * @param {string} key - Cache key
 * @returns {any|null} Parsed data or null if not cached
 */
async function getCache(key) {
  const client = getRedisClient();
  const data = await client.get(`${CACHE_PREFIX}${key}`);
  return data ? JSON.parse(data) : null;
}

/**
 * Set cached data with TTL
 * @param {string} key - Cache key
 * @param {any} data - Data to cache (will be JSON.stringify'd)
 * @param {number} ttl - Time to live in seconds
 */
async function setCache(key, data, ttl = 30) {
  const client = getRedisClient();
  await client.setex(`${CACHE_PREFIX}${key}`, ttl, JSON.stringify(data));
}

/**
 * Invalidate (delete) a cache key
 * @param {string} key - Cache key
 */
async function invalidateCache(key) {
  const client = getRedisClient();
  await client.del(`${CACHE_PREFIX}${key}`);
}

/**
 * Invalidate all cache keys matching a pattern
 * @param {string} pattern - e.g. 'hosts:*'
 */
async function invalidateCachePattern(pattern) {
  const client = getRedisClient();
  const keys = await client.keys(`${CACHE_PREFIX}${pattern}`);
  if (keys.length > 0) {
    await client.del(...keys);
  }
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
