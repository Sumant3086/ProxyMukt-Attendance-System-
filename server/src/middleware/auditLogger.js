import AuditLog from '../models/AuditLog.js';
import { generateDeviceFingerprint } from '../utils/deviceFingerprint.js';

/**
 * Middleware to log actions to audit trail
 */
export const createAuditLog = async (req, action, resource, resourceId, details = {}, status = 'SUCCESS', errorMessage = null) => {
  try {
    // Safely handle cases where req.headers might not exist
    const deviceFingerprint = req.headers ? generateDeviceFingerprint(req) : 'N/A';
    const ipAddress = req.ip || req.connection?.remoteAddress || 'N/A';
    const userAgent = req.headers ? req.headers['user-agent'] : 'N/A';

    await AuditLog.create({
      user: req.user?._id || req.user?.id,
      action,
      resource,
      resourceId,
      details,
      ipAddress,
      userAgent,
      deviceFingerprint,
      status,
      errorMessage,
    });
  } catch (error) {
    console.error('Audit log error:', error);
    // Don't throw error - audit logging should not break the main flow
  }
};

/**
 * Express middleware wrapper for automatic audit logging
 */
export const auditLog = (action, resource) => {
  return async (req, res, next) => {
    // Store original json method
    const originalJson = res.json.bind(res);

    // Override json method to capture response
    res.json = function (data) {
      // Determine status based on response
      const status = res.statusCode >= 400 ? 'FAILED' : 'SUCCESS';
      const errorMessage = status === 'FAILED' ? data.message || 'Unknown error' : null;

      // Log the action
      createAuditLog(
        req,
        action,
        resource,
        req.params.id || data._id || data.id,
        {
          method: req.method,
          path: req.path,
          body: sanitizeBody(req.body),
          query: req.query,
        },
        status,
        errorMessage
      );

      // Call original json method
      return originalJson(data);
    };

    next();
  };
};

/**
 * Sanitize request body to remove sensitive data
 */
const sanitizeBody = (body) => {
  if (!body) return {};

  const sanitized = { ...body };
  const sensitiveFields = ['password', 'token', 'refreshToken', 'secret'];

  sensitiveFields.forEach((field) => {
    if (sanitized[field]) {
      sanitized[field] = '[REDACTED]';
    }
  });

  return sanitized;
};

/**
 * Get audit logs with filters
 */
export const getAuditLogs = async (filters = {}, options = {}) => {
  const {
    userId,
    action,
    resource,
    startDate,
    endDate,
    status,
    page = 1,
    limit = 50,
  } = { ...filters, ...options };

  const query = {};

  if (userId) query.user = userId;
  if (action) query.action = action;
  if (resource) query.resource = resource;
  if (status) query.status = status;

  if (startDate || endDate) {
    query.createdAt = {};
    if (startDate) query.createdAt.$gte = new Date(startDate);
    if (endDate) query.createdAt.$lte = new Date(endDate);
  }

  const skip = (page - 1) * limit;

  const [logs, total] = await Promise.all([
    AuditLog.find(query)
      .populate('user', 'name email role')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    AuditLog.countDocuments(query),
  ]);

  return {
    logs,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
    },
  };
};
