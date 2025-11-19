import Attendance from '../models/Attendance.js';
import Session from '../models/Session.js';
import Class from '../models/Class.js';
import User from '../models/User.js';
import { verifyQRToken, generateQRToken } from '../utils/qr.js';
import { verifyGeofence, validateCoordinates, detectLocationSpoofing } from '../utils/geofencing.js';
import { generateDeviceFingerprint, parseUserAgent, detectSuspiciousDevice } from '../utils/deviceFingerprint.js';
import { checkProxyVPN } from '../utils/proxyDetection.js';
import { createAuditLog } from '../middleware/auditLogger.js';

/**
 * Check for nearby active sessions
 */
export const checkNearbySession = async (req, res) => {
  try {
    const { latitude, longitude } = req.body;
    
    if (!validateCoordinates(latitude, longitude)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid coordinates provided',
      });
    }
    
    // Find all live sessions with geofencing enabled
    const liveSessions = await Session.find({
      status: 'LIVE',
      'location.geofencingEnabled': true,
      'location.latitude': { $exists: true },
      'location.longitude': { $exists: true }
    }).populate('class', 'name code students');
    
    if (liveSessions.length === 0) {
      return res.json({
        success: true,
        data: {
          session: null,
          message: 'No active sessions nearby'
        }
      });
    }
    
    // Find nearest session within range
    let nearestSession = null;
    let minDistance = Infinity;
    
    for (const session of liveSessions) {
      // Check if student is enrolled
      const isEnrolled = session.class.students.some(
        id => id.toString() === req.user._id.toString()
      );
      
      if (!isEnrolled) continue;
      
      const verification = verifyGeofence(session.location, { latitude, longitude });
      
      if (verification.distance < minDistance) {
        minDistance = verification.distance;
        nearestSession = {
          ...session.toObject(),
          distance: verification.distance,
          withinRange: verification.verified
        };
      }
    }
    
    if (!nearestSession) {
      return res.json({
        success: true,
        data: {
          session: null,
          message: 'No sessions found for your enrolled classes'
        }
      });
    }
    
    // Check if already marked
    const existingAttendance = await Attendance.findOne({
      session: nearestSession._id,
      student: req.user._id
    });
    
    // Generate QR token for auto-marking
    const qrToken = generateQRToken(nearestSession._id.toString());
    
    res.json({
      success: true,
      data: {
        session: {
          ...nearestSession,
          qrToken
        },
        distance: minDistance,
        withinRange: nearestSession.withinRange,
        alreadyMarked: !!existingAttendance
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * Mark attendance by scanning QR
 */
export const markAttendance = async (req, res) => {
  try {
    const { qrToken, location } = req.body;
    
    // Verify QR token
    const payload = verifyQRToken(qrToken);
    
    if (!payload) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired QR code',
      });
    }
    
    // Get session
    const session = await Session.findById(payload.sid).populate('class');
    
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
    
    // Check if student is enrolled
    const classData = await Class.findById(session.class._id);
    const isEnrolled = classData.students.some(
      (id) => id.toString() === req.user._id.toString()
    );
    
    if (!isEnrolled) {
      return res.status(403).json({
        success: false,
        message: 'You are not enrolled in this class',
      });
    }

    // Check for duplicate attendance
    const existingAttendance = await Attendance.findOne({
      session: session._id,
      student: req.user._id,
    });
    
    if (existingAttendance) {
      return res.status(400).json({
        success: false,
        message: 'Attendance already marked for this session',
      });
    }
    
    // GEOFENCING VERIFICATION
    let locationVerification = { verified: true, reason: 'Location not required' };
    let spoofingDetection = { isSuspicious: false };
    
    if (location && location.latitude && location.longitude) {
      // Validate coordinates
      if (!validateCoordinates(location.latitude, location.longitude)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid location coordinates provided',
        });
      }
      
      // Check for location spoofing
      spoofingDetection = detectLocationSpoofing(location);
      
      if (spoofingDetection.recommendation === 'BLOCK') {
        return res.status(403).json({
          success: false,
          message: 'Location verification failed: Suspicious location data detected',
          details: spoofingDetection.warnings,
        });
      }
      
      // Verify geofence if session has location configured
      if (session.location && session.location.latitude && session.location.longitude) {
        locationVerification = verifyGeofence(session.location, location);
        
        if (!locationVerification.verified) {
          return res.status(403).json({
            success: false,
            message: 'Location verification failed',
            details: {
              reason: locationVerification.reason,
              distance: locationVerification.distance,
              allowedRadius: locationVerification.radius,
            },
          });
        }
      }
    } else if (session.location && session.location.latitude && session.location.longitude) {
      // Location is required but not provided
      return res.status(400).json({
        success: false,
        message: 'Location verification is required for this session',
        requiresLocation: true,
      });
    }
    
    // DEVICE FINGERPRINTING & PROXY DETECTION
    const deviceFingerprint = generateDeviceFingerprint(req);
    const deviceDetails = parseUserAgent(req.headers['user-agent']);
    const ipAddress = req.ip || req.connection.remoteAddress;
    
    // Check for proxy/VPN (async, don't block attendance)
    let proxyCheck = { isProxy: false, isVPN: false, isTor: false, riskScore: 0 };
    try {
      proxyCheck = await checkProxyVPN(ipAddress);
    } catch (error) {
      console.error('Proxy check failed:', error.message);
    }
    
    // Get previous devices for this student
    const previousAttendances = await Attendance.find({
      student: req.user._id,
    }).limit(10).select('deviceInfo');
    
    const suspiciousDevice = detectSuspiciousDevice(
      { ...deviceDetails, deviceFingerprint, ...proxyCheck },
      previousAttendances.map(a => a.deviceInfo)
    );
    
    // Create attendance record with enhanced device data
    const attendance = await Attendance.create({
      session: session._id,
      student: req.user._id,
      class: session.class._id,
      qrToken,
      attendanceSource: 'QR',
      deviceInfo: {
        userAgent: req.headers['user-agent'],
        ip: ipAddress,
        deviceFingerprint,
        browser: deviceDetails.browser,
        os: deviceDetails.os,
        platform: deviceDetails.platform,
        isProxy: proxyCheck.isProxy,
        isVPN: proxyCheck.isVPN,
        isTor: proxyCheck.isTor,
        riskScore: Math.max(proxyCheck.riskScore, suspiciousDevice.riskScore),
      },
      location: location ? {
        latitude: location.latitude,
        longitude: location.longitude,
        accuracy: location.accuracy,
        verified: locationVerification.verified,
        distance: locationVerification.distance,
        suspicious: spoofingDetection.isSuspicious || suspiciousDevice.isSuspicious,
      } : undefined,
    });
    
    // Log to audit trail
    await createAuditLog(
      req,
      'ATTENDANCE_MARK',
      'Attendance',
      attendance._id,
      {
        sessionId: session._id,
        classId: session.class._id,
        locationVerified: locationVerification.verified,
        deviceRiskScore: attendance.deviceInfo.riskScore,
        suspiciousFlags: suspiciousDevice.flags,
      }
    );
    
    // Update session attendance count
    session.attendanceCount += 1;
    await session.save();
    
    res.status(201).json({
      success: true,
      message: 'Attendance marked successfully',
      data: { 
        attendance,
        locationVerification: {
          verified: locationVerification.verified,
          distance: locationVerification.distance,
          message: locationVerification.reason,
        }
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * Get student attendance history
 */
export const getStudentAttendance = async (req, res) => {
  try {
    const { classId } = req.query;
    let query = { student: req.user._id };
    
    if (classId) query.class = classId;
    
    const attendance = await Attendance.find(query)
      .populate('session', 'title date startTime')
      .populate('class', 'name code')
      .sort('-createdAt');
    
    res.json({
      success: true,
      data: { attendance },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * Get attendance statistics for student
 */
export const getAttendanceStats = async (req, res) => {
  try {
    const { classId } = req.query;
    
    // Get all sessions for the class
    const sessions = await Session.find({
      class: classId,
      status: { $in: ['COMPLETED', 'LIVE'] },
    });
    
    // Get student's attendance
    const attendance = await Attendance.find({
      student: req.user._id,
      class: classId,
    });
    
    const totalSessions = sessions.length;
    const attendedSessions = attendance.length;
    const percentage = totalSessions > 0 
      ? ((attendedSessions / totalSessions) * 100).toFixed(2)
      : 0;
    
    res.json({
      success: true,
      data: {
        totalSessions,
        attendedSessions,
        missedSessions: totalSessions - attendedSessions,
        percentage,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * Get class attendance report (Faculty/Admin)
 */
export const getClassAttendanceReport = async (req, res) => {
  try {
    const { classId } = req.params;
    
    const classData = await Class.findById(classId).populate('students', 'name email studentId');
    
    if (!classData) {
      return res.status(404).json({
        success: false,
        message: 'Class not found',
      });
    }
    
    const sessions = await Session.find({
      class: classId,
      status: { $in: ['COMPLETED', 'LIVE'] },
    });
    
    const report = [];
    
    for (const student of classData.students) {
      const attendance = await Attendance.find({
        class: classId,
        student: student._id,
      });
      
      const percentage = sessions.length > 0
        ? ((attendance.length / sessions.length) * 100).toFixed(2)
        : 0;
      
      report.push({
        student: {
          _id: student._id,
          name: student.name,
          email: student.email,
          studentId: student.studentId,
        },
        totalSessions: sessions.length,
        attended: attendance.length,
        missed: sessions.length - attendance.length,
        percentage,
        status: percentage < 75 ? 'AT_RISK' : 'GOOD',
      });
    }
    
    res.json({
      success: true,
      data: {
        class: classData,
        report: report.sort((a, b) => a.percentage - b.percentage),
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * Get analytics data (Admin)
 */
export const getAnalytics = async (req, res) => {
  try {
    const totalStudents = await User.countDocuments({ role: 'STUDENT' });
    const totalClasses = await Class.countDocuments();
    const totalSessions = await Session.countDocuments();
    const totalAttendance = await Attendance.countDocuments();
    
    // Get at-risk students (< 75% attendance)
    const classes = await Class.find().populate('students');
    const atRiskStudents = [];
    
    for (const classData of classes) {
      const sessions = await Session.find({
        class: classData._id,
        status: { $in: ['COMPLETED', 'LIVE'] },
      });
      
      for (const student of classData.students) {
        const attendance = await Attendance.find({
          class: classData._id,
          student: student._id,
        });
        
        const percentage = sessions.length > 0
          ? (attendance.length / sessions.length) * 100
          : 0;
        
        if (percentage < 75 && sessions.length > 0) {
          atRiskStudents.push({
            student,
            class: classData,
            percentage: percentage.toFixed(2),
          });
        }
      }
    }
    
    res.json({
      success: true,
      data: {
        overview: {
          totalStudents,
          totalClasses,
          totalSessions,
          totalAttendance,
        },
        atRiskStudents,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
