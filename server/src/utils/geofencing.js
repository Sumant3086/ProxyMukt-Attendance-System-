/**
 * Geofencing and Location Verification Utilities
 * Implements Haversine formula for accurate distance calculation
 */

/**
 * Calculate distance between two coordinates using Haversine formula
 * @param {number} lat1 - Latitude of point 1
 * @param {number} lon1 - Longitude of point 1
 * @param {number} lat2 - Latitude of point 2
 * @param {number} lon2 - Longitude of point 2
 * @returns {number} Distance in meters
 */
export const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371e3; // Earth's radius in meters
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // Distance in meters
};

/**
 * Verify if student location is within geofence
 * @param {Object} sessionLocation - Session location with lat, lon, radius
 * @param {Object} studentLocation - Student location with lat, lon
 * @returns {Object} Verification result with status and distance
 */
export const verifyGeofence = (sessionLocation, studentLocation) => {
  // Check if location data is available
  if (!sessionLocation || !sessionLocation.latitude || !sessionLocation.longitude) {
    return {
      verified: true, // Allow if geofencing not configured
      reason: 'Geofencing not configured for this session',
      distance: null,
    };
  }

  if (!studentLocation || !studentLocation.latitude || !studentLocation.longitude) {
    return {
      verified: false,
      reason: 'Student location not provided',
      distance: null,
    };
  }

  // Calculate distance
  const distance = calculateDistance(
    sessionLocation.latitude,
    sessionLocation.longitude,
    studentLocation.latitude,
    studentLocation.longitude
  );

  const radius = sessionLocation.radius || 100; // Default 100 meters

  // Verify if within radius
  const verified = distance <= radius;

  return {
    verified,
    distance: Math.round(distance),
    radius,
    reason: verified
      ? 'Location verified successfully'
      : `Outside geofence boundary (${Math.round(distance)}m away, allowed: ${radius}m)`,
  };
};

/**
 * Get location accuracy status
 * @param {number} accuracy - GPS accuracy in meters
 * @returns {string} Accuracy status
 */
export const getLocationAccuracy = (accuracy) => {
  if (!accuracy) return 'UNKNOWN';
  if (accuracy <= 10) return 'HIGH';
  if (accuracy <= 50) return 'MEDIUM';
  return 'LOW';
};

/**
 * Validate location coordinates
 * @param {number} latitude - Latitude value
 * @param {number} longitude - Longitude value
 * @returns {boolean} True if valid coordinates
 */
export const validateCoordinates = (latitude, longitude) => {
  return (
    typeof latitude === 'number' &&
    typeof longitude === 'number' &&
    latitude >= -90 &&
    latitude <= 90 &&
    longitude >= -180 &&
    longitude <= 180
  );
};

/**
 * Format location for display
 * @param {number} latitude - Latitude value
 * @param {number} longitude - Longitude value
 * @returns {string} Formatted location string
 */
export const formatLocation = (latitude, longitude) => {
  if (!validateCoordinates(latitude, longitude)) {
    return 'Invalid coordinates';
  }
  return `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;
};

/**
 * Check if location services are likely spoofed (basic detection)
 * @param {Object} locationData - Location data with accuracy, speed, etc.
 * @returns {Object} Spoofing detection result
 */
export const detectLocationSpoofing = (locationData) => {
  const warnings = [];
  let suspiciousScore = 0;

  // Check for unrealistic accuracy
  if (locationData.accuracy && locationData.accuracy < 1) {
    warnings.push('Unrealistically high accuracy');
    suspiciousScore += 2;
  }

  // Check for impossible speed (if previous location available)
  if (locationData.speed && locationData.speed > 50) {
    // 50 m/s = 180 km/h
    warnings.push('Unrealistic speed detected');
    suspiciousScore += 3;
  }

  // Check for mock location flag (Android)
  if (locationData.isMock === true) {
    warnings.push('Mock location detected');
    suspiciousScore += 5;
  }

  return {
    isSuspicious: suspiciousScore >= 3,
    suspiciousScore,
    warnings,
    recommendation:
      suspiciousScore >= 5
        ? 'BLOCK'
        : suspiciousScore >= 3
        ? 'FLAG'
        : 'ALLOW',
  };
};

/**
 * Get campus presets for common locations
 * @returns {Object} Campus location presets
 */
export const getCampusPresets = () => {
  return {
    mainBuilding: {
      name: 'Main Building',
      latitude: 0,
      longitude: 0,
      radius: 100,
    },
    library: {
      name: 'Library',
      latitude: 0,
      longitude: 0,
      radius: 50,
    },
    lab: {
      name: 'Computer Lab',
      latitude: 0,
      longitude: 0,
      radius: 75,
    },
    auditorium: {
      name: 'Auditorium',
      latitude: 0,
      longitude: 0,
      radius: 150,
    },
  };
};
