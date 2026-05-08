import Session from '../models/Session.js';
import Class from '../models/Class.js';
import Attendance from '../models/Attendance.js';
import { generateQRToken } from '../utils/qr.js';
import { notifySessionStarted, notifySessionEnded } from '../utils/notificationService.js';

/**
 * Create new session
 */
export const createSession = async (req, res) => {
  try {
    const { classId, title, date, startTime, location, sessionType, qrEnabled, verificationRequirements } = req.body;
    
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
      sessionType: sessionType || 'OFFLINE',
      qrEnabled: qrEnabled !== undefined ? qrEnabled : true,
      verificationRequirements: verificationRequirements || {
        qrCode: true,
        faceVerification: false,
        locationVerification: false,
      },
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
    const session = await Session.findById(req.params.id).populate('class', 'students');
    
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
    
    // Ensure totalStudents is set from class
    if (session.totalStudents === 0 && session.class?.students) {
      session.totalStudents = session.class.students.length;
    }
    
    session.status = 'LIVE';
    session.startTime = new Date();
    await session.save();
    
    // Notify all students in the class
    await notifySessionStarted(session);
    
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
 * Pause session
 */
export const pauseSession = async (req, res) => {
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
        message: 'Only live sessions can be paused',
      });
    }
    
    session.status = 'PAUSED';
    await session.save();
    
    // Emit WebSocket event to notify all connected clients
    const { emitSessionStatusChange } = await import('../utils/ioManager.js');
    emitSessionStatusChange(session._id.toString(), session.class.toString(), 'PAUSED');
    
    res.json({
      success: true,
      message: 'Session paused successfully',
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
 * Resume session
 */
export const resumeSession = async (req, res) => {
  try {
    const session = await Session.findById(req.params.id);
    
    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Session not found',
      });
    }
    
    if (session.status !== 'PAUSED') {
      return res.status(400).json({
        success: false,
        message: 'Only paused sessions can be resumed',
      });
    }
    
    session.status = 'LIVE';
    await session.save();
    
    // Emit WebSocket event to notify all connected clients
    const { emitSessionStatusChange } = await import('../utils/ioManager.js');
    emitSessionStatusChange(session._id.toString(), session.class.toString(), 'LIVE');
    
    res.json({
      success: true,
      message: 'Session resumed successfully',
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
    
    // Notify all students that session ended
    await notifySessionEnded(session);
    
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
      .select('-qrSecret') // Exclude sensitive data
      .sort('-date')
      .lean(); // Convert to plain JS objects for faster serialization
    
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
    
    // CRITICAL FIX: Always ensure totalStudents is set from class
    let needsSave = false;
    if (!session.totalStudents || session.totalStudents === 0) {
      if (session.class?.students) {
        session.totalStudents = session.class.students.length;
        needsSave = true;
      }
    }
    
    // Also ensure attendanceCount is accurate
    const actualAttendanceCount = await Attendance.countDocuments({ session: session._id });
    if (session.attendanceCount !== actualAttendanceCount) {
      session.attendanceCount = actualAttendanceCount;
      needsSave = true;
    }
    
    if (needsSave) {
      await session.save();
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
 * Toggle QR code generation for session
 */
export const toggleQR = async (req, res) => {
  try {
    const { qrEnabled } = req.body;
    
    const session = await Session.findById(req.params.id);
    
    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Session not found',
      });
    }
    
    session.qrEnabled = qrEnabled;
    await session.save();
    
    res.json({
      success: true,
      message: `QR code ${qrEnabled ? 'enabled' : 'disabled'} successfully`,
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
 * Update verification settings for a session
 */
export const updateVerificationSettings = async (req, res) => {
  try {
    const { verificationRequirements } = req.body;
    
    const session = await Session.findById(req.params.id);
    
    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Session not found',
      });
    }
    
    // Update verification requirements
    session.verificationRequirements = {
      qrCode: true, // Always required
      faceVerification: verificationRequirements.faceVerification || false,
      locationVerification: verificationRequirements.locationVerification || false,
    };
    
    await session.save();
    
    // Emit WebSocket event to notify all connected clients
    const { emitVerificationSettingsUpdate } = await import('../utils/ioManager.js');
    emitVerificationSettingsUpdate(session._id.toString(), session.verificationRequirements);
    
    res.json({
      success: true,
      message: 'Verification settings updated successfully',
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
 * Get session attendance summary (accessible to session participants)
 */
export const getSessionAttendancePublic = async (req, res) => {
  try {
    const session = await Session.findById(req.params.id).populate('class', 'name code students faculty');
    
    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Session not found',
      });
    }
    
    // Check if user has access to this session (student enrolled or faculty/admin)
    const userRole = req.user.role;
    const userId = req.user._id.toString();
    
    let hasAccess = false;
    
    if (userRole === 'ADMIN') {
      hasAccess = true;
    } else if (userRole === 'FACULTY') {
      hasAccess = session.class.faculty.toString() === userId || session.faculty.toString() === userId;
    } else if (userRole === 'STUDENT') {
      hasAccess = session.class.students.some(studentId => studentId.toString() === userId);
    }
    
    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view this session attendance',
      });
    }
    
    const attendance = await Attendance.find({ session: req.params.id })
      .populate('student', 'name email studentId')
      .sort('markedAt');
    
    // Calculate totals - use class students length if totalStudents is not set
    const totalStudents = session.totalStudents || session.class?.students?.length || 0;
    const presentCount = attendance.length;
    const absentCount = Math.max(0, totalStudents - presentCount);
    const percentage = totalStudents > 0 ? ((presentCount / totalStudents) * 100).toFixed(2) : '0.00';
    
    res.json({
      success: true,
      data: {
        session,
        attendance,
        summary: {
          total: totalStudents,
          present: presentCount,
          absent: absentCount,
          percentage,
        },
      },
    });
  } catch (error) {
    console.error('Error in getSessionAttendancePublic:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * Get session attendance summary (Faculty/Admin only)
 */
export const getSessionAttendance = async (req, res) => {
  try {
    const session = await Session.findById(req.params.id).populate('class', 'name code students');
    
    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Session not found',
      });
    }
    
    const attendance = await Attendance.find({ session: req.params.id })
      .populate('student', 'name email studentId')
      .sort('markedAt');
    
    // Calculate totals - use class students length if totalStudents is not set
    const totalStudents = session.totalStudents || session.class?.students?.length || 0;
    const presentCount = attendance.length;
    const absentCount = Math.max(0, totalStudents - presentCount);
    const percentage = totalStudents > 0 ? ((presentCount / totalStudents) * 100).toFixed(2) : '0.00';
    
    res.json({
      success: true,
      data: {
        session,
        attendance,
        summary: {
          total: totalStudents,
          present: presentCount,
          absent: absentCount,
          percentage,
        },
      },
    });
  } catch (error) {
    console.error('Error in getSessionAttendance:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
