import StudentAppeal from '../models/StudentAppeal.js';
import Alert from '../models/Alert.js';
import User from '../models/User.js';
import { sendAppealNotificationEmail } from '../utils/emailService.js';

/**
 * Create a new student appeal
 */
export const createAppeal = async (req, res) => {
  try {
    const { alertId, reason, evidence } = req.body;

    // Verify alert exists
    const alert = await Alert.findById(alertId);
    if (!alert) {
      return res.status(404).json({
        success: false,
        message: 'Alert not found',
      });
    }

    // Check if student already appealed this alert
    const existingAppeal = await StudentAppeal.findOne({
      alert: alertId,
      student: req.user._id,
    });

    if (existingAppeal) {
      return res.status(400).json({
        success: false,
        message: 'You have already appealed this alert',
      });
    }

    const appeal = await StudentAppeal.create({
      student: req.user._id,
      alert: alertId,
      attendance: alert.attendance,
      reason,
      evidence,
    });

    // Send notification email
    await sendAppealNotificationEmail(req.user.email, {
      appealId: appeal._id,
      reason,
      status: 'PENDING',
    });

    res.status(201).json({
      success: true,
      message: 'Appeal submitted successfully',
      data: appeal,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Get student's appeals
 */
export const getStudentAppeals = async (req, res) => {
  try {
    const appeals = await StudentAppeal.find({ student: req.user._id })
      .populate('alert', 'riskScore severity riskFactors')
      .populate('attendance', 'session class')
      .sort('-createdAt');

    res.json({
      success: true,
      data: appeals,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Get all appeals (Admin)
 */
export const getAllAppeals = async (req, res) => {
  try {
    const { status = 'PENDING', page = 1, limit = 20 } = req.query;

    let query = {};
    if (status) query.status = status;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [appeals, totalCount] = await Promise.all([
      StudentAppeal.find(query)
        .populate('student', 'name email studentId')
        .populate('alert', 'riskScore severity')
        .sort('-createdAt')
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      StudentAppeal.countDocuments(query),
    ]);

    res.json({
      success: true,
      data: {
        appeals,
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

/**
 * Review appeal (Admin)
 */
export const reviewAppeal = async (req, res) => {
  try {
    const { status, notes } = req.body;

    if (!['APPROVED', 'REJECTED', 'UNDER_REVIEW'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status',
      });
    }

    const appeal = await StudentAppeal.findByIdAndUpdate(
      req.params.id,
      {
        status,
        reviewNotes: notes,
        reviewedBy: req.user._id,
        reviewedAt: new Date(),
      },
      { new: true }
    ).populate('student', 'name email');

    // If approved, update the alert status
    if (status === 'APPROVED') {
      await Alert.findByIdAndUpdate(appeal.alert, {
        status: 'APPROVED',
        reviewedBy: req.user._id,
        reviewedAt: new Date(),
      });
    }

    // Send notification email
    await sendAppealNotificationEmail(appeal.student.email, {
      appealId: appeal._id,
      reason: appeal.reason,
      status,
    });

    res.json({
      success: true,
      message: `Appeal ${status.toLowerCase()} successfully`,
      data: appeal,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Get appeal statistics
 */
export const getAppealStats = async (req, res) => {
  try {
    const stats = await StudentAppeal.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
        },
      },
    ]);

    const totalAppeals = await StudentAppeal.countDocuments();
    const approvalRate = await StudentAppeal.countDocuments({ status: 'APPROVED' });

    res.json({
      success: true,
      data: {
        byStatus: stats,
        totalAppeals,
        approvalRate: totalAppeals > 0 ? ((approvalRate / totalAppeals) * 100).toFixed(2) : 0,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
