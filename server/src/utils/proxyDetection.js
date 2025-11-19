import axios from 'axios';

/**
 * Check if IP is proxy/VPN using multiple free APIs
 */
export const checkProxyVPN = async (ip) => {
  // Skip check for localhost/private IPs
  if (
    !ip ||
    ip === '::1' ||
    ip === '127.0.0.1' ||
    ip.startsWith('192.168.') ||
    ip.startsWith('10.') ||
    ip.startsWith('172.')
  ) {
    return {
      isProxy: false,
      isVPN: false,
      isTor: false,
      provider: null,
      riskScore: 0,
    };
  }

  try {
    // Method 1: proxycheck.io (1000 free queries/day)
    const response = await axios.get(`https://proxycheck.io/v2/${ip}?vpn=1&asn=1`, {
      timeout: 3000,
    });

    if (response.data && response.data[ip]) {
      const data = response.data[ip];
      return {
        isProxy: data.proxy === 'yes',
        isVPN: data.type === 'VPN',
        isTor: data.type === 'TOR',
        provider: data.provider || null,
        riskScore: calculateRiskScore(data),
      };
    }
  } catch (error) {
    console.error('Proxy detection error:', error.message);
  }

  // Fallback: Method 2 - ipapi.co (30k free requests/month)
  try {
    const response = await axios.get(`https://ipapi.co/${ip}/json/`, {
      timeout: 3000,
    });

    if (response.data) {
      const data = response.data;
      // ipapi doesn't directly tell proxy, but we can infer from org/asn
      const suspiciousOrgs = ['vpn', 'proxy', 'hosting', 'datacenter', 'cloud'];
      const orgLower = (data.org || '').toLowerCase();
      const isProxy = suspiciousOrgs.some((term) => orgLower.includes(term));

      return {
        isProxy,
        isVPN: isProxy,
        isTor: false,
        provider: data.org || null,
        riskScore: isProxy ? 60 : 0,
      };
    }
  } catch (error) {
    console.error('IP API error:', error.message);
  }

  // If all methods fail, return safe default
  return {
    isProxy: false,
    isVPN: false,
    isTor: false,
    provider: null,
    riskScore: 0,
  };
};

/**
 * Calculate risk score based on proxy check data
 */
const calculateRiskScore = (data) => {
  let score = 0;

  if (data.proxy === 'yes') score += 40;
  if (data.type === 'VPN') score += 30;
  if (data.type === 'TOR') score += 50;
  if (data.type === 'DCH') score += 20; // Datacenter/Hosting

  return Math.min(score, 100);
};

/**
 * Batch check multiple IPs (for analytics)
 */
export const batchCheckProxyVPN = async (ips) => {
  const results = {};

  for (const ip of ips) {
    results[ip] = await checkProxyVPN(ip);
    // Add small delay to avoid rate limiting
    await new Promise((resolve) => setTimeout(resolve, 100));
  }

  return results;
};
