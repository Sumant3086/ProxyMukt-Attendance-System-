import Attendance from '../models/Attendance.js';
import Session from '../models/Session.js';
import Class from '../models/Class.js';
import User from '../models/User.js';
import Alert from '../models/Alert.js';
import VerificationQueue from '../models/VerificationQueue.js';
import { verifyQRToken, generateQRToken } from '../utils/qr.js';
import { verifyGeofence, validateCoordinates, detectLocationSpoofing } from '../utils/geofencing.js';
import { generateDeviceFingerprint, parseUserAgent, detectSuspiciousDevice } from '../utils/deviceFingerprint.js';
import { detectResidentialProxy, calculateIPReputation } from '../utils/advancedProxyDetection.js';
import { validatePeerLocation, detectImpossibleTravel } from '../utils/smartValidation.js';
import { safeProxyCheck } from '../utils/circuitBreaker.js';
import { createAuditLog } from '../middleware/auditLogger.js';
import { ALERT_CREATION_THRESHOLD, RISK_FACTOR_SCORES } from '../config/constants.js';
import { getIO, emitAttendanceMarked } from '../utils/ioManager.js';

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
    
    // Check if location verification is required
    const requiresLocation = session.verificationRequirements?.locationVerification || false;
    
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
        
        if (!locationVerification.verified && requiresLocation) {
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
    } else if (requiresLocation) {
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
    
    // Check for proxy/VPN (async, don't block attendance) - WITH CIRCUIT BREAKER
    let proxyCheck = { isProxy: false, isVPN: false, isTor: false, riskScore: 0 };
    try {
      proxyCheck = await safeProxyCheck(ipAddress);
    } catch (error) {
      console.error('Proxy check failed:', error.message);
    }
    
    // Detect residential proxy
    let residentialProxyCheck = { isResidentialProxy: false, riskScore: 0 };
    try {
      residentialProxyCheck = await detectResidentialProxy(ipAddress, req.user._id);
    } catch (error) {
      console.error('Residential proxy detection failed:', error.message);
    }
    
    // Calculate IP reputation
    let ipReputation = { score: 0, isDatacenter: false, threatLevel: 'LOW' };
    try {
      ipReputation = await calculateIPReputation(ipAddress);
    } catch (error) {
      console.error('IP reputation check failed:', error.message);
    }
    
    // Get previous devices for this student
    const previousAttendances = await Attendance.find({
      student: req.user._id,
    }).limit(10).select('deviceInfo');
    
    const suspiciousDevice = detectSuspiciousDevice(
      { ...deviceDetails, deviceFingerprint, ...proxyCheck },
      previousAttendances.map(a => a.deviceInfo)
    );
    
    // Calculate total risk score
    let totalRiskScore = Math.max(proxyCheck.riskScore, suspiciousDevice.riskScore);
    const riskFactors = [];
    
    if (proxyCheck.isProxy) {
      totalRiskScore += RISK_FACTOR_SCORES.PROXY_DETECTED;
      riskFactors.push('PROXY_DETECTED');
    }
    if (proxyCheck.isVPN) {
      totalRiskScore += RISK_FACTOR_SCORES.VPN_DETECTED;
      riskFactors.push('VPN_DETECTED');
    }
    if (proxyCheck.isTor) {
      totalRiskScore += RISK_FACTOR_SCORES.TOR_DETECTED;
      riskFactors.push('TOR_DETECTED');
    }
    if (residentialProxyCheck.isResidentialProxy) {
      totalRiskScore += RISK_FACTOR_SCORES.RESIDENTIAL_PROXY;
      riskFactors.push('RESIDENTIAL_PROXY');
    }
    if (ipReputation.isDatacenter) {
      totalRiskScore += RISK_FACTOR_SCORES.DATACENTER_IP;
      riskFactors.push('DATACENTER_IP');
    }
    if (spoofingDetection.isSuspicious) {
      totalRiskScore += RISK_FACTOR_SCORES.LOCATION_SPOOFING;
      riskFactors.push('LOCATION_SPOOFING');
    }
    if (suspiciousDevice.isSuspicious) {
      totalRiskScore += RISK_FACTOR_SCORES.SUSPICIOUS_DEVICE;
      riskFactors.push('SUSPICIOUS_DEVICE');
    }
    
    // SMART VALIDATION: Peer location validation
    let peerValidation = { isPeerOutlier: false, riskScore: 0 };
    if (location && location.latitude && location.longitude) {
      try {
        peerValidation = await validatePeerLocation(session._id, location);
        if (peerValidation.isPeerOutlier) {
          totalRiskScore += peerValidation.riskScore;
          riskFactors.push('PEER_LOCATION_OUTLIER');
          console.log(`⚠️ Peer validation: ${peerValidation.message}`);
        }
      } catch (error) {
        console.error('Peer validation failed:', error.message);
      }
    }
    
    // SMART VALIDATION: Impossible travel detection
    let travelDetection = { isImpossibleTravel: false, riskScore: 0 };
    if (location && location.latitude && location.longitude) {
      try {
        travelDetection = await detectImpossibleTravel(
          req.user._id,
          location,
          new Date()
        );
        if (travelDetection.isImpossibleTravel) {
          totalRiskScore += travelDetection.riskScore;
          riskFactors.push('IMPOSSIBLE_TRAVEL');
          console.log(`⚠️ Impossible travel: ${travelDetection.message}`);
        }
      } catch (error) {
        console.error('Travel detection failed:', error.message);
      }
    }
    
    // Cap risk score at 100
    totalRiskScore = Math.min(totalRiskScore, 100);
    
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
        riskScore: totalRiskScore,
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
    
    // Create alert if risk score exceeds threshold
    if (totalRiskScore >= ALERT_CREATION_THRESHOLD) {
      const severity = totalRiskScore >= 85 ? 'CRITICAL' : totalRiskScore >= 70 ? 'HIGH' : 'MEDIUM';
      
      const alert = await Alert.create({
        student: req.user._id,
        attendance: attendance._id,
        session: session._id,
        class: session.class._id,
        riskScore: totalRiskScore,
        riskFactors,
        severity,
        status: 'PENDING',
        deviceInfo: {
          ip: ipAddress,
          userAgent: req.headers['user-agent'],
          browser: deviceDetails.browser,
          os: deviceDetails.os,
          deviceFingerprint,
        },
        locationInfo: location ? {
          latitude: location.latitude,
          longitude: location.longitude,
          accuracy: location.accuracy,
        } : undefined,
      });
      
      // Create verification queue entry
      await VerificationQueue.create({
        alert: alert._id,
        student: req.user._id,
        attendance: attendance._id,
        priority: Math.floor(totalRiskScore / 10), // Priority 7-10 for risk scores 70-100
      });
      
      // Emit real-time alert to all admins
      const populatedAlert = await Alert.findById(alert._id)
        .populate('student', 'name email studentId')
        .populate('session', 'name')
        .populate('class', 'name');
      
      const io = getIO();
      if (io) {
        io.emit('new-alert', {
          alert: populatedAlert,
          timestamp: new Date(),
        });
      }
    }
    
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
    
    // EMIT REAL-TIME WEBSOCKET UPDATE
    emitAttendanceMarked(
      session._id.toString(),
      session.class._id.toString(),
      req.user._id.toString(),
      {
        studentName: req.user.name,
        riskScore: totalRiskScore,
        attendanceCount: session.attendanceCount,
        totalStudents: session.totalStudents
      }
    );
    
    res.status(201).json({
      success: true,
      message: '✓ Attendance marked successfully! Present for this session.',
      data: { 
        attendance,
        locationVerification: {
          verified: locationVerification.verified,
          distance: locationVerification.distance,
          message: locationVerification.reason,
        },
        verificationStatus: {
          qrCode: true,
          faceVerification: session.verificationRequirements?.faceVerification ? 'Required' : 'Optional',
          locationVerification: session.verificationRequirements?.locationVerification ? 'Verified' : 'Optional',
        },
        studentName: req.user.name,
        sessionTitle: session.title,
        className: session.class.name,
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
 * Get peer cluster data for a session (Admin/Faculty)
 */
export const getPeerCluster = async (req, res) => {
  try {
    const { sessionId } = req.params;

    const session = await Session.findById(sessionId);
    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Session not found',
      });
    }

    const { calculatePeerCluster } = await import('../utils/smartValidation.js');
    const clusterData = await calculatePeerCluster(sessionId);

    res.json({
      success: true,
      data: clusterData,
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
