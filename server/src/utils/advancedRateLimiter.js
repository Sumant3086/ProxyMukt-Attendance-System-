/**
 * Advanced Rate Limiting with Token Bucket Algorithm
 * FANG-Level: Distributed, tiered, and adaptive rate limiting
 */

class TokenBucket {
  constructor(capacity, refillRate, refillInterval = 1000) {
    this.capacity = capacity;
    this.tokens = capacity;
    this.refillRate = refillRate; // tokens per interval
    this.refillInterval = refillInterval; // milliseconds
    this.lastRefill = Date.now();
  }

  refill() {
    const now = Date.now();
    const timePassed = now - this.lastRefill;
    const tokensToAdd = (timePassed / this.refillInterval) * this.refillRate;
    
    this.tokens = Math.min(this.capacity, this.tokens + tokensToAdd);
    this.lastRefill = now;
  }

  consume(tokens = 1) {
    this.refill();
    
    if (this.tokens >= tokens) {
      this.tokens -= tokens;
      return {
        allowed: true,
        remaining: Math.floor(this.tokens),
        resetAt: this.lastRefill + this.refillInterval
      };
    }
    
    return {
      allowed: false,
      remaining: 0,
      resetAt: this.lastRefill + this.refillInterval,
      retryAfter: Math.ceil((tokens - this.tokens) / this.refillRate * this.refillInterval)
    };
  }
}

// In-memory store for rate limiters (use Redis in production for distributed systems)
const buckets = new Map();

/**
 * Tiered rate limits based on user role
 */
const RATE_LIMITS = {
  STUDENT: {
    attendance: { capacity: 10, refillRate: 1, interval: 60000 }, // 10 requests, refill 1/min
    api: { capacity: 100, refillRate: 10, interval: 60000 } // 100 requests, refill 10/min
  },
  FACULTY: {
    attendance: { capacity: 100, refillRate: 10, interval: 60000 },
    api: { capacity: 500, refillRate: 50, interval: 60000 }
  },
  ADMIN: {
    attendance: { capacity: 1000, refillRate: 100, interval: 60000 },
    api: { capacity: 2000, refillRate: 200, interval: 60000 }
  }
};

/**
 * Get or create token bucket for a user
 */
function getBucket(userId, role, type = 'api') {
  const key = `${userId}:${type}`;
  
  if (!buckets.has(key)) {
    const limits = RATE_LIMITS[role] || RATE_LIMITS.STUDENT;
    const config = limits[type] || limits.api;
    
    buckets.set(key, new TokenBucket(
      config.capacity,
      config.refillRate,
      config.interval
    ));
  }
  
  return buckets.get(key);
}

/**
 * Rate limiting middleware with token bucket
 */
export const advancedRateLimit = (type = 'api') => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    const bucket = getBucket(req.user._id.toString(), req.user.role, type);
    const result = bucket.consume(1);

    // Set rate limit headers
    res.setHeader('X-RateLimit-Limit', bucket.capacity);
    res.setHeader('X-RateLimit-Remaining', result.remaining);
    res.setHeader('X-RateLimit-Reset', new Date(result.resetAt).toISOString());

    if (!result.allowed) {
      res.setHeader('Retry-After', Math.ceil(result.retryAfter / 1000));
      return res.status(429).json({
        success: false,
        message: 'Rate limit exceeded',
        retryAfter: result.retryAfter,
        resetAt: result.resetAt
      });
    }

    next();
  };
};

/**
 * Sliding window rate limiter (more accurate than fixed window)
 */
class SlidingWindowRateLimiter {
  constructor(maxRequests, windowMs) {
    this.maxRequests = maxRequests;
    this.windowMs = windowMs;
    this.requests = new Map(); // userId -> [timestamps]
  }

  isAllowed(userId) {
    const now = Date.now();
    const windowStart = now - this.windowMs;

    // Get user's request history
    let userRequests = this.requests.get(userId) || [];

    // Remove old requests outside the window
    userRequests = userRequests.filter(timestamp => timestamp > windowStart);

    // Check if under limit
    if (userRequests.length < this.maxRequests) {
      userRequests.push(now);
      this.requests.set(userId, userRequests);
      return {
        allowed: true,
        remaining: this.maxRequests - userRequests.length,
        resetAt: windowStart + this.windowMs
      };
    }

    // Calculate when the oldest request will expire
    const oldestRequest = userRequests[0];
    const resetAt = oldestRequest + this.windowMs;

    return {
      allowed: false,
      remaining: 0,
      resetAt,
      retryAfter: resetAt - now
    };
  }

  cleanup() {
    // Periodically clean up old entries
    const now = Date.now();
    for (const [userId, timestamps] of this.requests.entries()) {
      const filtered = timestamps.filter(t => t > now - this.windowMs);
      if (filtered.length === 0) {
        this.requests.delete(userId);
      } else {
        this.requests.set(userId, filtered);
      }
    }
  }
}

// Create sliding window limiters
const slidingWindowLimiters = {
  attendance: new SlidingWindowRateLimiter(10, 60000), // 10 per minute
  login: new SlidingWindowRateLimiter(5, 300000), // 5 per 5 minutes
  api: new SlidingWindowRateLimiter(100, 60000) // 100 per minute
};

// Cleanup old entries every 5 minutes
setInterval(() => {
  Object.values(slidingWindowLimiters).forEach(limiter => limiter.cleanup());
}, 300000);

/**
 * Sliding window rate limit middleware
 */
export const slidingWindowRateLimit = (type = 'api') => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    const limiter = slidingWindowLimiters[type] || slidingWindowLimiters.api;
    const result = limiter.isAllowed(req.user._id.toString());

    res.setHeader('X-RateLimit-Limit', limiter.maxRequests);
    res.setHeader('X-RateLimit-Remaining', result.remaining);
    res.setHeader('X-RateLimit-Reset', new Date(result.resetAt).toISOString());

    if (!result.allowed) {
      res.setHeader('Retry-After', Math.ceil(result.retryAfter / 1000));
      return res.status(429).json({
        success: false,
        message: 'Rate limit exceeded',
        retryAfter: result.retryAfter,
        resetAt: result.resetAt
      });
    }

    next();
  };
};

/**
 * Adaptive rate limiting based on system load
 */
class AdaptiveRateLimiter {
  constructor(baseLimit, minLimit, maxLimit) {
    this.baseLimit = baseLimit;
    this.minLimit = minLimit;
    this.maxLimit = maxLimit;
    this.currentLimit = baseLimit;
    this.errorRate = 0;
    this.requestCount = 0;
    this.errorCount = 0;
  }

  updateMetrics(isError) {
    this.requestCount++;
    if (isError) this.errorCount++;

    // Calculate error rate every 100 requests
    if (this.requestCount >= 100) {
      this.errorRate = this.errorCount / this.requestCount;
      this.adjustLimit();
      this.requestCount = 0;
      this.errorCount = 0;
    }
  }

  adjustLimit() {
    // If error rate > 5%, reduce limit
    if (this.errorRate > 0.05) {
      this.currentLimit = Math.max(
        this.minLimit,
        Math.floor(this.currentLimit * 0.8)
      );
      console.log(`⚠️ High error rate (${(this.errorRate * 100).toFixed(1)}%), reducing limit to ${this.currentLimit}`);
    }
    // If error rate < 1%, increase limit
    else if (this.errorRate < 0.01) {
      this.currentLimit = Math.min(
        this.maxLimit,
        Math.floor(this.currentLimit * 1.2)
      );
      console.log(`✓ Low error rate (${(this.errorRate * 100).toFixed(1)}%), increasing limit to ${this.currentLimit}`);
    }
  }

  getCurrentLimit() {
    return this.currentLimit;
  }
}

export const adaptiveRateLimiter = new AdaptiveRateLimiter(100, 50, 500);

/**
 * IP-based rate limiting (for unauthenticated requests)
 */
const ipBuckets = new Map();

export const ipRateLimit = (maxRequests = 100, windowMs = 60000) => {
  return (req, res, next) => {
    const ip = req.ip || req.connection.remoteAddress;
    const key = `ip:${ip}`;

    if (!ipBuckets.has(key)) {
      ipBuckets.set(key, new SlidingWindowRateLimiter(maxRequests, windowMs));
    }

    const limiter = ipBuckets.get(key);
    const result = limiter.isAllowed(ip);

    res.setHeader('X-RateLimit-Limit', maxRequests);
    res.setHeader('X-RateLimit-Remaining', result.remaining);

    if (!result.allowed) {
      return res.status(429).json({
        success: false,
        message: 'Too many requests from this IP',
        retryAfter: result.retryAfter
      });
    }

    next();
  };
};

export default {
  advancedRateLimit,
  slidingWindowRateLimit,
  ipRateLimit,
  adaptiveRateLimiter,
  TokenBucket,
  SlidingWindowRateLimiter
};
