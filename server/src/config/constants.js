// ============================================
// ATTENDANCE THRESHOLDS (University Policy)
// ============================================
export const ATTENDANCE_THRESHOLD_GOOD = 75;     // >= 75% is good standing
export const ATTENDANCE_THRESHOLD_WARNING = 60;  // 60-74% is warning zone
// Below 60% is considered "At Risk"

// ============================================
// PAGINATION & DISPLAY LIMITS
// ============================================
export const DEFAULT_PAGE_SIZE = 10;             // users per page in admin dashboard
export const AUDIT_LOG_PAGE_SIZE = 50;           // audit logs per page
export const TOP_USERS_LIMIT = 10;               // top users in activity aggregation

// ============================================
// ANALYTICS LIMITS
// ============================================
export const DAILY_TREND_DAYS = 30;              // days of trend data to compute
export const AT_RISK_DISPLAY_LIMIT = 20;         // max at-risk students shown
export const RECENT_SESSIONS_LIMIT = 10;         // recent sessions in student analytics
export const MONTHLY_TREND_MONTHS = 6;           // months of monthly trend data
export const RECENT_ATTENDANCE_LIMIT = 5;        // recent attendance records on dashboard

// ============================================
// GEOFENCING CONFIGURATION
// ============================================
export const DEFAULT_GEOFENCE_RADIUS = 100;      // default radius in meters
export const EARTH_RADIUS_METERS = 6371e3;       // Earth's radius for Haversine formula

// ============================================
// DEVICE FINGERPRINTING & SECURITY
// ============================================
export const SHARED_DEVICE_THRESHOLD = 3;        // fingerprint used by >N users = suspicious
export const DEVICE_RISK_SHARED = 30;            // risk score for shared device
export const DEVICE_RISK_PROXY_VPN = 40;         // risk score for proxy/VPN
export const DEVICE_RISK_TOR = 50;               // risk score for Tor
export const DEVICE_RISK_SUSPICIOUS_UA = 20;     // risk score for suspicious user agent
export const DEVICE_RISK_THRESHOLD = 50;         // riskScore > N = suspicious device
export const MIN_USER_AGENT_LENGTH = 20;         // minimum user agent length

// ============================================
// LOCATION SPOOFING DETECTION
// ============================================
export const UNREALISTIC_ACCURACY_THRESHOLD = 1; // GPS accuracy < 1m = suspicious
export const UNREALISTIC_SPEED_THRESHOLD = 50;   // speed > 50 m/s (180 km/h) = suspicious
export const SPOOFING_SCORE_ACCURACY = 2;        // suspicion score for unrealistic accuracy
export const SPOOFING_SCORE_SPEED = 3;           // suspicion score for unrealistic speed
export const SPOOFING_SCORE_MOCK = 5;            // suspicion score for mock location
export const SPOOFING_FLAG_THRESHOLD = 3;        // score >= N = FLAG recommendation
export const SPOOFING_BLOCK_THRESHOLD = 5;       // score >= N = BLOCK recommendation

// ============================================
// TOKEN & SESSION CONFIGURATION
// ============================================
export const REFRESH_TOKEN_EXPIRY = 7 * 24 * 60 * 60 * 1000; // 7 days in milliseconds
export const QR_TOKEN_ROTATION_INTERVAL = 20000; // QR code rotation interval in ms (20 seconds)

// ============================================
// RATE LIMITING
// ============================================
export const RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000; // 15 minutes
export const RATE_LIMIT_MAX_REQUESTS = 500;         // max requests per window

// ============================================
// SESSION CONFIGURATION
// ============================================
export const DEFAULT_SESSION_DURATION = 60;      // default session duration in minutes
export const SESSION_STATUS_ENUM = ['SCHEDULED', 'LIVE', 'COMPLETED', 'CANCELLED'];
export const ATTENDANCE_SOURCE_ENUM = ['QR', 'FACE', 'ZOOM', 'GOOGLE_MEET', 'TEAMS', 'WEBRTC'];

// ============================================
// USER ROLES
// ============================================
export const USER_ROLES = {
  ADMIN: 'ADMIN',
  FACULTY: 'FACULTY',
  STUDENT: 'STUDENT'
};

// ============================================
// ATTENDANCE STATUS
// ============================================
export const ATTENDANCE_STATUS = {
  PRESENT: 'PRESENT',
  ABSENT: 'ABSENT',
  LATE: 'LATE'
};
