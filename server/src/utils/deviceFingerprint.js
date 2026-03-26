import crypto from 'crypto';
import { SHARED_DEVICE_THRESHOLD, DEVICE_RISK_SHARED, DEVICE_RISK_PROXY_VPN, DEVICE_RISK_TOR, DEVICE_RISK_SUSPICIOUS_UA, DEVICE_RISK_THRESHOLD, MIN_USER_AGENT_LENGTH } from '../config/constants.js';

/**
 * Generate device fingerprint from request headers
 */
export const generateDeviceFingerprint = (req) => {
  // Safely handle cases where req.headers might not exist
  if (!req || !req.headers) {
    return 'N/A';
  }

  const components = [
    req.headers['user-agent'] || '',
    req.headers['accept-language'] || '',
    req.headers['accept-encoding'] || '',
    req.headers['accept'] || '',
    req.ip || req.connection?.remoteAddress || '',
  ];

  const fingerprint = components.join('|');
  return crypto.createHash('sha256').update(fingerprint).digest('hex');
};

/**
 * Parse user agent to extract device info
 */
export const parseUserAgent = (userAgent) => {
  if (!userAgent) {
    return {
      browser: 'Unknown',
      os: 'Unknown',
      platform: 'Unknown',
    };
  }

  // Detect browser
  let browser = 'Unknown';
  if (userAgent.includes('Chrome') && !userAgent.includes('Edg')) {
    browser = 'Chrome';
  } else if (userAgent.includes('Firefox')) {
    browser = 'Firefox';
  } else if (userAgent.includes('Safari') && !userAgent.includes('Chrome')) {
    browser = 'Safari';
  } else if (userAgent.includes('Edg')) {
    browser = 'Edge';
  } else if (userAgent.includes('Opera') || userAgent.includes('OPR')) {
    browser = 'Opera';
  }

  // Detect OS
  let os = 'Unknown';
  if (userAgent.includes('Windows')) {
    os = 'Windows';
  } else if (userAgent.includes('Mac OS')) {
    os = 'macOS';
  } else if (userAgent.includes('Linux')) {
    os = 'Linux';
  } else if (userAgent.includes('Android')) {
    os = 'Android';
  } else if (userAgent.includes('iOS') || userAgent.includes('iPhone') || userAgent.includes('iPad')) {
    os = 'iOS';
  }

  // Detect platform
  let platform = 'Unknown';
  if (userAgent.includes('Mobile') || userAgent.includes('Android') || userAgent.includes('iPhone')) {
    platform = 'Mobile';
  } else if (userAgent.includes('Tablet') || userAgent.includes('iPad')) {
    platform = 'Tablet';
  } else {
    platform = 'Desktop';
  }

  return { browser, os, platform };
};

/**
 * Detect suspicious device patterns
 */
export const detectSuspiciousDevice = (deviceInfo, previousDevices = []) => {
  const suspicionFlags = [];
  let riskScore = 0;

  // Check if device fingerprint has been used by multiple users
  const fingerprintCount = previousDevices.filter(
    (d) => d.deviceFingerprint === deviceInfo.deviceFingerprint
  ).length;

  if (fingerprintCount > SHARED_DEVICE_THRESHOLD) {
    suspicionFlags.push('SHARED_DEVICE');
    riskScore += DEVICE_RISK_SHARED;
  }

  // Check for proxy/VPN
  if (deviceInfo.isProxy || deviceInfo.isVPN) {
    suspicionFlags.push('PROXY_VPN_DETECTED');
    riskScore += DEVICE_RISK_PROXY_VPN;
  }

  // Check for Tor
  if (deviceInfo.isTor) {
    suspicionFlags.push('TOR_DETECTED');
    riskScore += DEVICE_RISK_TOR;
  }

  // Check for unusual user agent
  if (!deviceInfo.userAgent || deviceInfo.userAgent.length < MIN_USER_AGENT_LENGTH) {
    suspicionFlags.push('SUSPICIOUS_USER_AGENT');
    riskScore += DEVICE_RISK_SUSPICIOUS_UA;
  }

  return {
    isSuspicious: riskScore > DEVICE_RISK_THRESHOLD,
    riskScore,
    flags: suspicionFlags,
  };
};
