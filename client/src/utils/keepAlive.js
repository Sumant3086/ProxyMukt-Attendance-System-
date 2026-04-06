/**
 * Keep-Alive Service
 * Prevents Render free tier cold starts by pinging server every 10 minutes
 */

const PING_INTERVAL = 10 * 60 * 1000; // 10 minutes
const API_URL = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000';

let pingInterval = null;
let isActive = false;

/**
 * Ping server to keep it awake
 */
async function pingServer() {
  try {
    const response = await fetch(`${API_URL}/api/test`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });
    
    if (response.ok) {
      console.log('🏓 Keep-alive ping successful');
    }
  } catch (error) {
    console.warn('⚠️ Keep-alive ping failed:', error.message);
  }
}

/**
 * Start keep-alive service
 */
export function startKeepAlive() {
  if (isActive) return;
  
  isActive = true;
  console.log('🚀 Keep-alive service started');
  
  // Ping immediately
  pingServer();
  
  // Then ping every 10 minutes
  pingInterval = setInterval(pingServer, PING_INTERVAL);
  
  // Also ping when user becomes active after being idle
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden && isActive) {
      pingServer();
    }
  });
}

/**
 * Stop keep-alive service
 */
export function stopKeepAlive() {
  if (!isActive) return;
  
  isActive = false;
  console.log('🛑 Keep-alive service stopped');
  
  if (pingInterval) {
    clearInterval(pingInterval);
    pingInterval = null;
  }
}

/**
 * Check if server is awake
 */
export async function checkServerStatus() {
  try {
    const startTime = Date.now();
    const response = await fetch(`${API_URL}/api/test`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });
    const duration = Date.now() - startTime;
    
    return {
      isAwake: response.ok,
      responseTime: duration,
      isColdStart: duration > 5000, // > 5 seconds indicates cold start
    };
  } catch (error) {
    return {
      isAwake: false,
      responseTime: null,
      isColdStart: false,
      error: error.message,
    };
  }
}
