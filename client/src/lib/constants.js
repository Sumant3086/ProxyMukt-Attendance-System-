// ============================================
// ATTENDANCE THRESHOLDS (University Policy)
// ============================================
export const ATTENDANCE_THRESHOLD_GOOD = 75;      // >= 75% is considered good (university requirement)
export const ATTENDANCE_THRESHOLD_WARNING = 60;   // 60-74% is warning zone
// below 60% is at-risk

// ============================================
// UI DISPLAY LIMITS
// ============================================
export const RECENT_ATTENDANCE_LIMIT = 5;         // recent attendance records shown on student dashboard
export const RECENT_SESSIONS_LIMIT = 10;          // recent sessions shown in analytics tables
export const DAILY_TREND_DAYS = 30;               // days of trend data shown in analytics
export const DAILY_TREND_DISPLAY = 10;            // last N days shown in trend chart
export const MONTHLY_TREND_MONTHS = 6;            // months of monthly trend data

// ============================================
// PAGINATION
// ============================================
export const DEFAULT_PAGE_SIZE = 10;              // users per page in admin dashboard
export const CURSOR_PAGE_SIZE = 20;               // cursor-based pagination size

// ============================================
// USER ROLES
// ============================================
export const USER_ROLES = {
  ADMIN: 'ADMIN',
  FACULTY: 'FACULTY',
  STUDENT: 'STUDENT'
};

// ============================================
// TIMING CONSTANTS (milliseconds)
// ============================================
export const VERIFICATION_STEP_DELAY = 1500;     // Delay between verification steps
export const SUCCESS_MESSAGE_DELAY = 3000;       // How long to show success message
export const REDIRECT_DELAY = 1000;              // Delay before redirect
export const QR_SCAN_INTERVAL = 500;             // QR code scanning interval
export const LOCATION_TIMEOUT = 10000;           // Location request timeout
export const WEBSOCKET_RECONNECT_DELAY = 2000;   // WebSocket reconnection delay
export const ATTENDANCE_SUCCESS_DISPLAY = 5000;  // How long to show attendance success message

// ============================================
// API ENDPOINTS AND URLS
// ============================================
export const DEFAULT_WEBSOCKET_URL = 'http://localhost:5000';  // Fallback WebSocket URL
export const FACE_API_MODEL_URL = 'https://cdn.jsdelivr.net/npm/@vladmandic/face-api/model';  // Face detection model URL
