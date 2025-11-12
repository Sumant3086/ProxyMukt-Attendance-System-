import crypto from 'crypto';

const QR_ROTATION_INTERVAL = parseInt(process.env.QR_ROTATION_INTERVAL) || 20000; // 20 seconds
const QR_SECRET = process.env.QR_SECRET || 'default-qr-secret-change-me';

/**
 * Generate QR token with HMAC signature
 * @param {string} sessionId - Session ID
 * @returns {string} Signed QR token
 */
export const generateQRToken = (sessionId) => {
  // Round timestamp to interval (20 sec blocks)
  const now = Date.now();
  const roundedTime = Math.floor(now / QR_ROTATION_INTERVAL) * QR_ROTATION_INTERVAL;
  
  const payload = {
    sid: sessionId,
    t: roundedTime,
  };
  
  // Create HMAC signature
  const payloadString = JSON.stringify(payload);
  const signature = crypto
    .createHmac('sha256', QR_SECRET)
    .update(payloadString)
    .digest('hex');
  
  // Encode payload and append signature
  const encodedPayload = Buffer.from(payloadString).toString('base64');
  const token = `${encodedPayload}.${signature}`;
  
  return token;
};

/**
 * Verify QR token signature and expiration
 * @param {string} token - QR token to verify
 * @returns {object|null} Decoded payload or null if invalid
 */
export const verifyQRToken = (token) => {
  try {
    const [encodedPayload, signature] = token.split('.');
    
    if (!encodedPayload || !signature) {
      return null;
    }
    
    // Decode payload
    const payloadString = Buffer.from(encodedPayload, 'base64').toString('utf-8');
    const payload = JSON.parse(payloadString);
    
    // Verify signature
    const expectedSignature = crypto
      .createHmac('sha256', QR_SECRET)
      .update(payloadString)
      .digest('hex');
    
    if (signature !== expectedSignature) {
      return null;
    }
    
    // Check expiration (allow current and previous interval)
    const now = Date.now();
    const currentInterval = Math.floor(now / QR_ROTATION_INTERVAL) * QR_ROTATION_INTERVAL;
    const previousInterval = currentInterval - QR_ROTATION_INTERVAL;
    
    if (payload.t !== currentInterval && payload.t !== previousInterval) {
      return null;
    }
    
    return payload;
  } catch (error) {
    return null;
  }
};

/**
 * Get QR rotation interval in milliseconds
 */
export const getQRRotationInterval = () => QR_ROTATION_INTERVAL;
