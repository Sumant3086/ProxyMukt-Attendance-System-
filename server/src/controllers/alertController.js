import Alert from '../models/Alert.js';
import VerificationQueue from '../models/VerificationQueue.js';
import User from '../models/User.js';
import { RISK_SCORE_THRESHOLDS } from '../config/constants.js';

export const getAlerts = async (req, res) => {
  try {
    const { status = 'PENDING', severity, page = 1, limit = 20 } = req.query;

    let query = {};
    if (status) query.status = status;
    if (severity) query.severity = severity;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [alerts, totalCount] = await Promise.all([
      Alert.find(query)
        .populate('student', 'name email studentId')
        .populate('session', 'name startTime')
        .populate('class', 'name')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      Alert.countDocuments(query),
    ]);

    res.json({
      success: true,
      data: {
        alerts,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(totalCount / parseInt(limit)),
          totalCount,
          hasNext: parseInt(page) < Math.ceil(totalCount / parseInt(limit)),
          hasPrev: parseInt(page) > 1,
        },
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getAlertById = async (req, res) => {
  try {
    const alert = await Alert.findById(req.params.id)
      .populate('student', 'name email studentId')
      .populate('attendance')
      .populate('session')
      .populate('class')
      .populate('reviewedBy', 'name email');

    if (!alert) {
      return res.status(404).json({ success: false, message: 'Alert not found' });
    }

    res.json({ success: true, data: alert });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const reviewAlert = async (req, res) => {
  try {
    const { status, notes } = req.body;

    if (!['APPROVED', 'REJECTED'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status. Must be APPROVED or REJECTED',
      });
    }

    const alert = await Alert.findByIdAndUpdate(
      req.params.id,
      {
        status,
        reviewedBy: req.user._id,
        reviewedAt: new Date(),
        reviewNotes: notes,
      },
      { new: true }
    );

    // Update verification queue
    await VerificationQueue.findOneAndUpdate(
      { alert: alert._id },
      {
        status: 'RESOLVED',
        resolution: status,
        resolutionNotes: notes,
        resolvedAt: new Date(),
        resolvedBy: req.user._id,
      }
    );

    res.json({
      success: true,
      message: `Alert ${status.toLowerCase()} successfully`,
      data: alert,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getVerificationQueue = async (req, res) => {
  try {
    const { status = 'QUEUED', page = 1, limit = 20 } = req.query;

    let query = {};
    if (status) query.status = status;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [queue, totalCount] = await Promise.all([
      VerificationQueue.find(query)
        .populate('student', 'name email studentId')
        .populate('alert')
        .populate('assignedTo', 'name email')
        .sort({ priority: -1, createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      VerificationQueue.countDocuments(query),
    ]);

    res.json({
      success: true,
      data: {
        queue,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(totalCount / parseInt(limit)),
          totalCount,
          hasNext: parseInt(page) < Math.ceil(totalCount / parseInt(limit)),
          hasPrev: parseInt(page) > 1,
        },
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const assignVerificationTask = async (req, res) => {
  try {
    const { adminId } = req.body;

    const admin = await User.findById(adminId);
    if (!admin || admin.role !== 'ADMIN') {
      return res.status(400).json({
        success: false,
        message: 'Invalid admin user',
      });
    }

    const task = await VerificationQueue.findByIdAndUpdate(
      req.params.id,
      {
        assignedTo: adminId,
        status: 'IN_REVIEW',
      },
      { new: true }
    ).populate('student', 'name email studentId');

    res.json({
      success: true,
      message: 'Task assigned successfully',
      data: task,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getAlertStats = async (req, res) => {
  try {
    const stats = await Alert.aggregate([
      {
        $group: {
          _id: '$severity',
          count: { $sum: 1 },
        },
      },
    ]);

    const statusStats = await Alert.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
        },
      },
    ]);

    const riskFactorStats = await Alert.aggregate([
      {
        $unwind: '$riskFactors',
      },
      {
        $group: {
          _id: '$riskFactors',
          count: { $sum: 1 },
        },
      },
      {
        $sort: { count: -1 },
      },
    ]);

    res.json({
      success: true,
      data: {
        bySeverity: stats,
        byStatus: statusStats,
        topRiskFactors: riskFactorStats,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
