import axios from 'axios';
import { getCachedProxyCheck, cacheProxyCheck } from './cache.js';
import {
  DEVICE_RISK_PROXY_VPN,
  DEVICE_RISK_TOR,
} from '../config/constants.js';

/**
 * Advanced proxy detection using multiple methods
 */
export const advancedProxyDetection = async (ip, userAgent = '') => {
  // Skip for private IPs
  if (isPrivateIP(ip)) {
    return {
      isProxy: false,
      isVPN: false,
      isTor: false,
      provider: null,
      riskScore: 0,
      methods: ['PRIVATE_IP'],
    };
  }

  // Check cache first
  const cached = await getCachedProxyCheck(ip);
  if (cached) {
    return { ...cached, fromCache: true };
  }

  const results = {
    isProxy: false,
    isVPN: false,
    isTor: false,
    provider: null,
    riskScore: 0,
    methods: [],
    details: {},
  };

  // Method 1: IP Reputation (proxycheck.io)
  const method1 = await checkIPReputation(ip);
  if (method1) {
    results.methods.push('IP_REPUTATION');
    results.details.ipReputation = method1;
    results.isProxy = results.isProxy || method1.isProxy;
    results.isVPN = results.isVPN || method1.isVPN;
    results.isTor = results.isTor || method1.isTor;
    results.riskScore += method1.riskScore;
    results.provider = method1.provider;
  }

  // Method 2: ASN Analysis
  const method2 = await analyzeASN(ip);
  if (method2) {
    results.methods.push('ASN_ANALYSIS');
    results.details.asn = method2;
    results.isProxy = results.isProxy || method2.isProxy;
    results.riskScore += method2.riskScore;
  }

  // Method 3: Reverse DNS
  const method3 = await reverseDNS(ip);
  if (method3) {
    results.methods.push('REVERSE_DNS');
    results.details.reverseDNS = method3;
    results.isProxy = results.isProxy || method3.isProxy;
    results.riskScore += method3.riskScore;
  }

  // Method 4: Datacenter Detection
  const method4 = await detectDatacenter(ip);
  if (method4) {
    results.methods.push('DATACENTER_DETECTION');
    results.details.datacenter = method4;
    results.isProxy = results.isProxy || method4.isProxy;
    results.riskScore += method4.riskScore;
  }

  // Method 5: User Agent Analysis
  if (userAgent) {
    const method5 = analyzeUserAgent(userAgent);
    if (method5) {
      results.methods.push('USER_AGENT_ANALYSIS');
      results.details.userAgent = method5;
      results.riskScore += method5.riskScore;
    }
  }

  // Cap risk score at 100
  results.riskScore = Math.min(results.riskScore, 100);

  // Cache the result
  await cacheProxyCheck(ip, results);

  return results;
};

/**
 * Check if IP is private
 */
const isPrivateIP = (ip) => {
  const privateRanges = [
    /^127\./, // Loopback
    /^192\.168\./, // Private
    /^10\./, // Private
    /^172\.(1[6-9]|2[0-9]|3[01])\./, // Private
    /^::1$/, // IPv6 loopback
    /^fc00:/, // IPv6 private
  ];

  return privateRanges.some((range) => range.test(ip));
};

/**
 * Method 1: IP Reputation Check
 */
const checkIPReputation = async (ip) => {
  try {
    const response = await axios.get(
      `https://proxycheck.io/v2/${ip}?vpn=1&asn=1&threat=1`,
      { timeout: 3000 }
    );

    if (response.data && response.data[ip]) {
      const data = response.data[ip];
      return {
        isProxy: data.proxy === 'yes',
        isVPN: data.type === 'VPN',
        isTor: data.type === 'TOR',
        provider: data.provider || null,
        riskScore: calculateReputationRiskScore(data),
      };
    }
  } catch (error) {
    console.error('IP reputation check failed:', error.message);
  }

  return null;
};

/**
 * Method 2: ASN Analysis
 */
const analyzeASN = async (ip) => {
  try {
    const response = await axios.get(`https://ipapi.co/${ip}/json/`, {
      timeout: 3000,
    });

    if (response.data) {
      const data = response.data;
      const suspiciousOrgs = [
        'vpn',
        'proxy',
        'hosting',
        'datacenter',
        'cloud',
        'aws',
        'azure',
        'gcp',
      ];

      const orgLower = (data.org || '').toLowerCase();
      const isProxy = suspiciousOrgs.some((term) => orgLower.includes(term));

      return {
        isProxy,
        riskScore: isProxy ? 40 : 0,
        org: data.org,
        asn: data.asn,
      };
    }
  } catch (error) {
    console.error('ASN analysis failed:', error.message);
  }

  return null;
};

/**
 * Method 3: Reverse DNS Lookup
 */
const reverseDNS = async (ip) => {
  try {
    const response = await axios.get(
      `https://dns.google/resolve?name=${ip}&type=PTR`,
      { timeout: 3000 }
    );

    if (response.data && response.data.Answer) {
      const hostname = response.data.Answer[0]?.data || '';
      const suspiciousPatterns = [
        /proxy/i,
        /vpn/i,
        /hosting/i,
        /datacenter/i,
        /cloud/i,
      ];

      const isSuspicious = suspiciousPatterns.some((pattern) =>
        pattern.test(hostname)
      );

      return {
        isProxy: isSuspicious,
        riskScore: isSuspicious ? 30 : 0,
        hostname,
      };
    }
  } catch (error) {
    console.error('Reverse DNS lookup failed:', error.message);
  }

  return null;
};

/**
 * Method 4: Datacenter Detection
 */
const detectDatacenter = async (ip) => {
  try {
    const response = await axios.get(
      `https://api.abuseipdb.com/api/v2/check?ipAddress=${ip}`,
      {
        headers: {
          Key: process.env.ABUSEIPDB_API_KEY || '',
          Accept: 'application/json',
        },
        timeout: 3000,
      }
    );

    if (response.data && response.data.data) {
      const data = response.data.data;
      return {
        isProxy: data.isDatacenter || data.isProxy,
        riskScore: (data.abuseConfidenceScore || 0) / 2, // Scale to 0-50
        abuseScore: data.abuseConfidenceScore,
        isDatacenter: data.isDatacenter,
      };
    }
  } catch (error) {
    console.error('Datacenter detection failed:', error.message);
  }

  return null;
};

/**
 * Method 5: User Agent Analysis
 */
const analyzeUserAgent = (userAgent) => {
  const suspiciousPatterns = [
    /headless/i,
    /bot/i,
    /crawler/i,
    /scraper/i,
    /curl/i,
    /wget/i,
    /python/i,
    /java(?!script)/i,
  ];

  const isSuspicious = suspiciousPatterns.some((pattern) =>
    pattern.test(userAgent)
  );

  return {
    isSuspicious,
    riskScore: isSuspicious ? 20 : 0,
  };
};

/**
 * Calculate risk score from IP reputation data
 */
const calculateReputationRiskScore = (data) => {
  let score = 0;

  if (data.proxy === 'yes') score += DEVICE_RISK_PROXY_VPN;
  if (data.type === 'VPN') score += DEVICE_RISK_PROXY_VPN;
  if (data.type === 'TOR') score += DEVICE_RISK_TOR;
  if (data.threat === 'yes') score += 30;

  return Math.min(score, 100);
};

/**
 * Behavioral analysis for fraud detection
 */
export const analyzeBehavior = async (userId, currentAttendance) => {
  try {
    const Attendance = (await import('../models/Attendance.js')).default;

    // Get recent attendances (last 24 hours)
    const recentAttendances = await Attendance.find({
      student: userId,
      createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
    })
      .sort('-createdAt')
      .limit(10)
      .lean();

    const suspiciousPatterns = [];
    let riskScore = 0;

    // Check for rapid location changes
    if (recentAttendances.length > 0) {
      const previous = recentAttendances[0];

      if (
        currentAttendance.location &&
        previous.location &&
        previous.location.latitude
      ) {
        const { calculateDistance } = await import('./geofencing.js');

        const distance = calculateDistance(
          currentAttendance.location.latitude,
          currentAttendance.location.longitude,
          previous.location.latitude,
          previous.location.longitude
        );

        const timeDiff =
          (currentAttendance.markedAt - previous.markedAt) / 1000 / 60; // minutes

        if (timeDiff > 0) {
          const speed = distance / timeDiff; // meters per minute

          if (speed > 1000) {
            // > 1km/min = suspicious
            suspiciousPatterns.push('RAPID_LOCATION_CHANGE');
            riskScore += 30;
          }
        }
      }
    }

    // Check for IP changes
    const ips = recentAttendances.map((a) => a.deviceInfo?.ip).filter(Boolean);
    if (new Set(ips).size > 5) {
      suspiciousPatterns.push('MULTIPLE_IPS');
      riskScore += 20;
    }

    // Check for device changes
    const devices = recentAttendances
      .map((a) => a.deviceInfo?.deviceFingerprint)
      .filter(Boolean);
    if (new Set(devices).size > 3) {
      suspiciousPatterns.push('MULTIPLE_DEVICES');
      riskScore += 15;
    }

    // Check for unusual timing
    const hours = recentAttendances.map((a) => new Date(a.markedAt).getHours());
    const avgHour =
      hours.reduce((a, b) => a + b, 0) / hours.length;
    const currentHour = new Date(currentAttendance.markedAt).getHours();

    if (Math.abs(currentHour - avgHour) > 6) {
      suspiciousPatterns.push('UNUSUAL_TIMING');
      riskScore += 10;
    }

    return {
      riskScore: Math.min(riskScore, 100),
      patterns: suspiciousPatterns,
      recentCount: recentAttendances.length,
    };
  } catch (error) {
    console.error('Behavior analysis failed:', error);
    return {
      riskScore: 0,
      patterns: [],
      recentCount: 0,
    };
  }
};
