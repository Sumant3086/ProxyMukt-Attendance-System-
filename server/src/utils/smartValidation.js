import Attendance from '../models/Attendance.js';
import { PEER_VALIDATION, TRAVEL_DETECTION } from '../config/constants.js';
import { calculateDistance } from './geofencing.js';

/**
 * Calculate the average location of all students who have marked attendance
 * @param {String} sessionId - Session ID
 * @returns {Object} - { averageLocation, totalStudents, outliers }
 */
export const calculatePeerCluster = async (sessionId) => {
  try {
    const attendances = await Attendance.find({
      session: sessionId,
      'location.latitude': { $exists: true },
      'location.longitude': { $exists: true },
    }).select('location student');

    if (attendances.length < PEER_VALIDATION.MIN_STUDENTS_FOR_VALIDATION) {
      return {
        averageLocation: null,
        totalStudents: attendances.length,
        outliers: [],
        validationPossible: false,
      };
    }

    // Calculate average location (centroid)
    let sumLat = 0;
    let sumLng = 0;

    attendances.forEach((att) => {
      sumLat += att.location.latitude;
      sumLng += att.location.longitude;
    });

    const averageLocation = {
      latitude: sumLat / attendances.length,
      longitude: sumLng / attendances.length,
    };

    // Find outliers (students far from cluster)
    const outliers = [];
    attendances.forEach((att) => {
      const distance = calculateDistance(
        averageLocation.latitude,
        averageLocation.longitude,
        att.location.latitude,
        att.location.longitude
      );

      if (distance > PEER_VALIDATION.OUTLIER_DISTANCE_THRESHOLD) {
        outliers.push({
          studentId: att.student,
          distance,
          location: att.location,
        });
      }
    });

    return {
      averageLocation,
      totalStudents: attendances.length,
      outliers,
      validationPossible: true,
    };
  } catch (error) {
    console.error('Error calculating peer cluster:', error);
    return {
      averageLocation: null,
      totalStudents: 0,
      outliers: [],
      validationPossible: false,
    };
  }
};

/**
 * Validate if student's location is consistent with peers
 * @param {String} sessionId - Session ID
 * @param {Object} studentLocation - { latitude, longitude }
 * @returns {Object} - { isPeerOutlier, distanceFromCluster, riskScore }
 */
export const validatePeerLocation = async (sessionId, studentLocation) => {
  if (!PEER_VALIDATION.ENABLED) {
    return {
      isPeerOutlier: false,
      distanceFromCluster: null,
      riskScore: 0,
      message: 'Peer validation disabled',
    };
  }

  const peerCluster = await calculatePeerCluster(sessionId);

  if (!peerCluster.validationPossible) {
    return {
      isPeerOutlier: false,
      distanceFromCluster: null,
      riskScore: 0,
      message: `Not enough students for peer validation (${peerCluster.totalStudents} < ${PEER_VALIDATION.MIN_STUDENTS_FOR_VALIDATION})`,
    };
  }

  const distanceFromCluster = calculateDistance(
    peerCluster.averageLocation.latitude,
    peerCluster.averageLocation.longitude,
    studentLocation.latitude,
    studentLocation.longitude
  );

  const isPeerOutlier = distanceFromCluster > PEER_VALIDATION.OUTLIER_DISTANCE_THRESHOLD;

  return {
    isPeerOutlier,
    distanceFromCluster: Math.round(distanceFromCluster),
    riskScore: isPeerOutlier ? PEER_VALIDATION.OUTLIER_RISK_SCORE : 0,
    message: isPeerOutlier
      ? `Location ${Math.round(distanceFromCluster)}m from peer cluster (threshold: ${PEER_VALIDATION.OUTLIER_DISTANCE_THRESHOLD}m)`
      : 'Location consistent with peers',
    peerCluster: {
      averageLocation: peerCluster.averageLocation,
      totalStudents: peerCluster.totalStudents,
    },
  };
};

/**
 * Detect impossible travel (student can't physically travel that fast)
 * @param {String} studentId - Student ID
 * @param {Object} currentLocation - { latitude, longitude }
 * @param {Date} currentTime - Current timestamp
 * @returns {Object} - { isImpossibleTravel, travelSpeed, riskScore }
 */
export const detectImpossibleTravel = async (studentId, currentLocation, currentTime) => {
  if (!TRAVEL_DETECTION.ENABLED) {
    return {
      isImpossibleTravel: false,
      travelSpeed: null,
      riskScore: 0,
      message: 'Travel detection disabled',
    };
  }

  try {
    // Get last attendance within time window
    const timeWindowMs = TRAVEL_DETECTION.TIME_WINDOW_MINUTES * 60 * 1000;
    const windowStart = new Date(currentTime.getTime() - timeWindowMs);

    const lastAttendance = await Attendance.findOne({
      student: studentId,
      'location.latitude': { $exists: true },
      'location.longitude': { $exists: true },
      markedAt: { $gte: windowStart, $lt: currentTime },
    })
      .sort({ markedAt: -1 })
      .select('location markedAt');

    if (!lastAttendance) {
      return {
        isImpossibleTravel: false,
        travelSpeed: null,
        riskScore: 0,
        message: 'No recent attendance to compare',
      };
    }

    // Calculate distance and time difference
    const distance = calculateDistance(
      lastAttendance.location.latitude,
      lastAttendance.location.longitude,
      currentLocation.latitude,
      currentLocation.longitude
    );

    const timeDiffSeconds = (currentTime - lastAttendance.markedAt) / 1000;

    // Avoid division by zero
    if (timeDiffSeconds < 1) {
      return {
        isImpossibleTravel: true,
        travelSpeed: Infinity,
        riskScore: TRAVEL_DETECTION.IMPOSSIBLE_TRAVEL_RISK_SCORE,
        message: 'Attendance marked at same time as previous',
        lastAttendance: {
          location: lastAttendance.location,
          time: lastAttendance.markedAt,
        },
      };
    }

    const travelSpeed = distance / timeDiffSeconds; // meters per second

    // Check if speed exceeds maximum possible speed
    const isImpossibleTravel = travelSpeed > TRAVEL_DETECTION.MAX_VEHICLE_SPEED;

    return {
      isImpossibleTravel,
      travelSpeed: travelSpeed.toFixed(2),
      travelSpeedKmh: (travelSpeed * 3.6).toFixed(2), // Convert to km/h
      distance: Math.round(distance),
      timeDiffMinutes: (timeDiffSeconds / 60).toFixed(1),
      riskScore: isImpossibleTravel ? TRAVEL_DETECTION.IMPOSSIBLE_TRAVEL_RISK_SCORE : 0,
      message: isImpossibleTravel
        ? `Impossible travel: ${Math.round(distance)}m in ${(timeDiffSeconds / 60).toFixed(1)} minutes (${(travelSpeed * 3.6).toFixed(1)} km/h)`
        : 'Travel speed within normal range',
      lastAttendance: {
        location: lastAttendance.location,
        time: lastAttendance.markedAt,
      },
    };
  } catch (error) {
    console.error('Error detecting impossible travel:', error);
    return {
      isImpossibleTravel: false,
      travelSpeed: null,
      riskScore: 0,
      message: 'Error checking travel history',
    };
  }
};

/**
 * Get smart geofence radius based on session type
 * @param {String} sessionType - CLASSROOM, EXAM, OUTDOOR, LAB
 * @param {Number} customRadius - Custom radius if provided
 * @returns {Number} - Radius in meters
 */
export const getSmartGeofenceRadius = (sessionType = 'CLASSROOM', customRadius = null) => {
  if (customRadius) return customRadius;

  const { GEOFENCE_RULES } = require('../config/constants.js');
  const rule = GEOFENCE_RULES[sessionType] || GEOFENCE_RULES.CLASSROOM;
  return rule.radius;
};

/**
 * Check if liveness detection is required for session type
 * @param {String} sessionType - CLASSROOM, EXAM, OUTDOOR, LAB
 * @returns {Boolean}
 */
export const isLivenessRequired = (sessionType = 'CLASSROOM') => {
  const { GEOFENCE_RULES } = require('../config/constants.js');
  const rule = GEOFENCE_RULES[sessionType] || GEOFENCE_RULES.CLASSROOM;
  return rule.requireLiveness;
};
