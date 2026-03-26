import RateLimit from '../models/RateLimit.js';

const RATE_LIMIT_WINDOW = 60 * 60 * 1000; // 1 hour
const MAX_ATTEMPTS = 10; // Max attendance marking attempts per hour
const BLOCK_DURATION = 24 * 60 * 60 * 1000; // 24 hours

/**
 * Rate limiting middleware for attendance marking
 */
export const attendanceRateLimit = async (req, res, next) => {
  try {
    const studentId = req.user._id;
    const ip = req.ip || req.connection.remoteAddress;
    const endpoint = '/attendance/mark';

    // Check if student is currently blocked
    const blockRecord = await RateLimit.findOne({
      student: studentId,
      endpoint,
      isBlocked: true,
      blockUntil: { $gt: new Date() },
    });

    if (blockRecord) {
      return res.status(429).json({
        success: false,
        message: `Too many attempts. Please try again after ${blockRecord.blockUntil}`,
        retryAfter: blockRecord.blockUntil,
      });
    }

    // Get or create rate limit record
    let rateLimitRecord = await RateLimit.findOne({
      student: studentId,
      ip,
      endpoint,
      lastAttempt: { $gt: new Date(Date.now() - RATE_LIMIT_WINDOW) },
    });

    if (!rateLimitRecord) {
      // Create new record
      rateLimitRecord = await RateLimit.create({
        student: studentId,
        ip,
        endpoint,
        attemptCount: 1,
        lastAttempt: new Date(),
      });
    } else {
      // Increment attempt count
      rateLimitRecord.attemptCount += 1;
      rateLimitRecord.lastAttempt = new Date();

      // Check if exceeded limit
      if (rateLimitRecord.attemptCount > MAX_ATTEMPTS) {
        rateLimitRecord.isBlocked = true;
        rateLimitRecord.blockReason = 'Exceeded maximum attendance marking attempts';
        rateLimitRecord.blockUntil = new Date(Date.now() + BLOCK_DURATION);

        await rateLimitRecord.save();

        return res.status(429).json({
          success: false,
          message: 'Too many attendance marking attempts. Account blocked for 24 hours.',
          retryAfter: rateLimitRecord.blockUntil,
        });
      }

      await rateLimitRecord.save();
    }

    // Attach rate limit info to request
    req.rateLimit = {
      attemptCount: rateLimitRecord.attemptCount,
      remaining: MAX_ATTEMPTS - rateLimitRecord.attemptCount,
    };

    next();
  } catch (error) {
    console.error('Rate limit middleware error:', error);
    next(); // Don't block on error
  }
};

/**
 * Get rate limit status for a student
 */
export const getRateLimitStatus = async (req, res) => {
  try {
    const studentId = req.user._id;
    const endpoint = '/attendance/mark';

    const record = await RateLimit.findOne({
      student: studentId,
      endpoint,
      lastAttempt: { $gt: new Date(Date.now() - RATE_LIMIT_WINDOW) },
    });

    if (!record) {
      return res.json({
        success: true,
        data: {
          isBlocked: false,
          attemptCount: 0,
          remaining: MAX_ATTEMPTS,
          resetTime: new Date(Date.now() + RATE_LIMIT_WINDOW),
        },
      });
    }

    res.json({
      success: true,
      data: {
        isBlocked: record.isBlocked,
        attemptCount: record.attemptCount,
        remaining: Math.max(0, MAX_ATTEMPTS - record.attemptCount),
        resetTime: new Date(record.lastAttempt.getTime() + RATE_LIMIT_WINDOW),
        blockUntil: record.blockUntil,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Reset rate limit for a student (Admin only)
 */
export const resetRateLimit = async (req, res) => {
  try {
    const { studentId } = req.params;

    await RateLimit.deleteMany({
      student: studentId,
      endpoint: '/attendance/mark',
    });

    res.json({
      success: true,
      message: 'Rate limit reset for student',
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
