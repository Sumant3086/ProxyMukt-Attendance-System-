import express from 'express';
import { authenticate } from '../middleware/auth.js';
import { authorize } from '../middleware/role.js';
import { getAuditLogs } from '../middleware/auditLogger.js';
import AuditLog from '../models/AuditLog.js';

const router = express.Router();

/**
 * @route   GET /api/audit
 * @desc    Get audit logs (Admin only)
 * @access  Private/Admin
 */
router.get('/', authenticate, authorize('ADMIN'), async (req, res) => {
  try {
    const { userId, action, resource, startDate, endDate, status, page, limit } = req.query;

    const result = await getAuditLogs(
      { userId, action, resource, startDate, endDate, status },
      { page: parseInt(page) || 1, limit: parseInt(limit) || 50 }
    );

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

/**
 * @route   GET /api/audit/user/:userId
 * @desc    Get audit logs for specific user
 * @access  Private/Admin
 */
router.get('/user/:userId', authenticate, authorize('ADMIN'), async (req, res) => {
  try {
    const { userId } = req.params;
    const { page = 1, limit = 50 } = req.query;

    const result = await getAuditLogs(
      { userId },
      { page: parseInt(page), limit: parseInt(limit) }
    );

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

/**
 * @route   GET /api/audit/stats
 * @desc    Get audit statistics
 * @access  Private/Admin
 */
router.get('/stats', authenticate, authorize('ADMIN'), async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    const query = {};
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }

    // Get action counts
    const actionStats = await AuditLog.aggregate([
      { $match: query },
      { $group: { _id: '$action', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]);

    // Get user activity
    const userActivity = await AuditLog.aggregate([
      { $match: query },
      { $group: { _id: '$user', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'user',
        },
      },
      { $unwind: '$user' },
      {
        $project: {
          user: { name: 1, email: 1, role: 1 },
          count: 1,
        },
      },
    ]);

    // Get failed actions
    const failedActions = await AuditLog.countDocuments({
      ...query,
      status: 'FAILED',
    });

    // Get suspicious activities
    const suspiciousActivities = await AuditLog.find({
      ...query,
      $or: [
        { 'details.deviceRiskScore': { $gte: 50 } },
        { 'details.suspiciousFlags': { $exists: true, $ne: [] } },
      ],
    })
      .populate('user', 'name email role')
      .sort({ createdAt: -1 })
      .limit(20);

    res.json({
      success: true,
      data: {
        actionStats,
        userActivity,
        failedActions,
        suspiciousActivities,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

export default router;
