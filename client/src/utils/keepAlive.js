/**
 * Keep-Alive Service
 * Prevents Render free tier cold starts by pinging server every 5 minutes
 * Uses lightweight health endpoint to minimize resource usage
 */

const PING_INTERVAL = 5 * 60 * 1000; // 5 minutes (more frequent to prevent cold starts)
const API_URL = import.meta.env.PROD
  ? window.location.origin
  : (import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5001');

let pingInterval = null;
let isActive = false;

/**
 * Ping server to keep it awake
 */
async function pingServer() {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout
    
    const response = await fetch(`${API_URL}/health`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      signal: controller.signal,
    });
    
    clearTimeout(timeoutId);
    
    if (response.ok) {
      const data = await response.json();
      console.log('🏓 Keep-alive ping successful', data.uptime ? `(uptime: ${Math.floor(data.uptime)}s)` : '');
    }
  } catch (error) {
    if (error.name === 'AbortError') {
      console.warn('⚠️ Keep-alive ping timeout');
    } else {
      console.warn('⚠️ Keep-alive ping failed:', error.message);
    }
  }
}

/**
 * Start keep-alive service
 */
export function startKeepAlive() {
  if (isActive) return;
  
  isActive = true;
  console.log('🚀 Keep-alive service started (ping every 5 minutes)');
  
  // Ping immediately
  pingServer();
  
  // Then ping every 5 minutes
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
    const response = await fetch(`${API_URL}/health`, {
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
