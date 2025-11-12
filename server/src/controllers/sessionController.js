import Session from '../models/Session.js';
import Class from '../models/Class.js';
import Attendance from '../models/Attendance.js';
import { generateQRToken } from '../utils/qr.js';

/**
 * Create new session
 */
export const createSession = async (req, res) => {
  try {
    const { classId, title, date, startTime, location } = req.body;
    
    // Verify class exists and user is faculty
    const classData = await Class.findById(classId);
    
    if (!classData) {
      return res.status(404).json({
        success: false,
        message: 'Class not found',
      });
    }
    
    if (req.user.role === 'FACULTY' && classData.faculty.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized',
      });
    }
    
    const session = await Session.create({
      class: classId,
      faculty: req.user._id,
      title,
      date,
      startTime,
      location,
      totalStudents: classData.students.length,
    });
    
    await session.populate('class faculty', 'name code email');
    
    res.status(201).json({
      success: true,
      message: 'Session created successfully',
      data: { session },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * Start session (make it LIVE)
 */
export const startSession = async (req, res) => {
  try {
    const session = await Session.findById(req.params.id);
    
    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Session not found',
      });
    }
    
    if (session.status === 'LIVE') {
      return res.status(400).json({
        success: false,
        message: 'Session is already live',
      });
    }
    
    session.status = 'LIVE';
    session.startTime = new Date();
    await session.save();
    
    res.json({
      success: true,
      message: 'Session started successfully',
      data: { session },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * End session
 */
export const endSession = async (req, res) => {
  try {
    const session = await Session.findById(req.params.id);
    
    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Session not found',
      });
    }
    
    session.status = 'COMPLETED';
    session.endTime = new Date();
    await session.save();
    
    res.json({
      success: true,
      message: 'Session ended successfully',
      data: { session },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * Get current QR token for live session
 */
export const getQRToken = async (req, res) => {
  try {
    const session = await Session.findById(req.params.id);
    
    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Session not found',
      });
    }
    
    if (session.status !== 'LIVE') {
      return res.status(400).json({
        success: false,
        message: 'Session is not live',
      });
    }
    
    const qrToken = generateQRToken(session._id.toString());
    
    res.json({
      success: true,
      data: { qrToken },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * Get all sessions
 */
export const getSessions = async (req, res) => {
  try {
    const { classId, status } = req.query;
    let query = {};
    
    if (classId) query.class = classId;
    if (status) query.status = status;
    
    if (req.user.role === 'FACULTY') {
      query.faculty = req.user._id;
    }
    
    const sessions = await Session.find(query)
      .populate('class', 'name code')
      .populate('faculty', 'name email')
      .sort('-date');
    
    res.json({
      success: true,
      data: { sessions },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * Get session by ID
 */
export const getSessionById = async (req, res) => {
  try {
    // Validate MongoDB ObjectID format
    if (!req.params.id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid session ID format',
      });
    }
    
    const session = await Session.findById(req.params.id)
      .populate('class', 'name code students')
      .populate('faculty', 'name email');
    
    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Session not found',
      });
    }
    
    res.json({
      success: true,
      data: { session },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * Get session attendance summary
 */
export const getSessionAttendance = async (req, res) => {
  try {
    const session = await Session.findById(req.params.id);
    
    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Session not found',
      });
    }
    
    const attendance = await Attendance.find({ session: req.params.id })
      .populate('student', 'name email studentId')
      .sort('markedAt');
    
    res.json({
      success: true,
      data: {
        session,
        attendance,
        summary: {
          total: session.totalStudents,
          present: attendance.length,
          absent: session.totalStudents - attendance.length,
          percentage: ((attendance.length / session.totalStudents) * 100).toFixed(2),
        },
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
