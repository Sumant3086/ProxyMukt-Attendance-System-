import redis from 'redis';

let client = null;

/**
 * Initialize Redis client
 */
export const initializeRedis = async () => {
  try {
    client = redis.createClient({
      host: process.env.REDIS_HOST || 'localhost',
      port: process.env.REDIS_PORT || 6379,
      password: process.env.REDIS_PASSWORD || undefined,
      socket: {
        reconnectStrategy: (retries) => Math.min(retries * 50, 500),
      },
    });

    client.on('error', (err) => console.error('Redis error:', err));
    client.on('connect', () => console.log('Redis connected'));

    await client.connect();
    return client;
  } catch (error) {
    console.error('Redis initialization failed:', error);
    console.warn('Continuing without Redis caching');
    return null;
  }
};

/**
 * Get value from cache
 */
export const getCache = async (key) => {
  if (!client) return null;
  try {
    const value = await client.get(key);
    return value ? JSON.parse(value) : null;
  } catch (error) {
    console.error('Cache get error:', error);
    return null;
  }
};

/**
 * Set value in cache with TTL
 */
export const setCache = async (key, value, ttl = 3600) => {
  if (!client) return false;
  try {
    await client.setEx(key, ttl, JSON.stringify(value));
    return true;
  } catch (error) {
    console.error('Cache set error:', error);
    return false;
  }
};

/**
 * Delete cache key
 */
export const deleteCache = async (key) => {
  if (!client) return false;
  try {
    await client.del(key);
    return true;
  } catch (error) {
    console.error('Cache delete error:', error);
    return false;
  }
};

/**
 * Cache proxy check result (24 hour TTL)
 */
export const cacheProxyCheck = async (ip, result) => {
  return setCache(`proxy:${ip}`, result, 86400);
};

/**
 * Get cached proxy check
 */
export const getCachedProxyCheck = async (ip) => {
  return getCache(`proxy:${ip}`);
};

/**
 * Cache user session
 */
export const cacheUserSession = async (userId, sessionData, ttl = 3600) => {
  return setCache(`session:${userId}`, sessionData, ttl);
};

/**
 * Get cached user session
 */
export const getCachedUserSession = async (userId) => {
  return getCache(`session:${userId}`);
};

/**
 * Cache analytics data (1 hour TTL)
 */
export const cacheAnalytics = async (key, data) => {
  return setCache(`analytics:${key}`, data, 3600);
};

/**
 * Get cached analytics
 */
export const getCachedAnalytics = async (key) => {
  return getCache(`analytics:${key}`);
};

/**
 * Invalidate analytics cache for a class
 */
export const invalidateClassAnalytics = async (classId) => {
  if (!client) return false;
  try {
    const keys = await client.keys(`analytics:class:${classId}:*`);
    if (keys.length > 0) {
      await client.del(keys);
    }
    return true;
  } catch (error) {
    console.error('Cache invalidation error:', error);
    return false;
  }
};

/**
 * Get Redis client
 */
export const getRedisClient = () => client;

/**
 * Close Redis connection
 */
export const closeRedis = async () => {
  if (client) {
    await client.quit();
    client = null;
  }
};
