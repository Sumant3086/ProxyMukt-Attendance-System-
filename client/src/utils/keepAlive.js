/**
 * Keep-Alive Service
 * Pings the backend every 4 minutes so Render free tier never hits its
 * 15-minute inactivity sleep threshold while the app is open in a browser tab.
 */

const PING_INTERVAL = 4 * 60 * 1000; // 4 minutes
const API_URL = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5001';

let pingInterval = null;
let isActive = false;

async function pingServer() {
  try {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), 8000);
    const res = await fetch(`${API_URL}/health`, { signal: controller.signal });
    clearTimeout(id);
    if (res.ok) {
      const d = await res.json();
      console.log('🏓 Keep-alive ping OK', d.uptime ? `(${Math.floor(d.uptime)}s up)` : '');
    }
  } catch {
    // Silent — server might be sleeping, axiosInstance retry handles it
  }
}

export function startKeepAlive() {
  if (isActive) return;
  isActive = true;

  // Immediate ping wakes the server as soon as the app loads in production
  pingServer();

  pingInterval = setInterval(pingServer, PING_INTERVAL);

  // Re-ping when the user switches back to this tab after being away
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden && isActive) pingServer();
  });
}

export function stopKeepAlive() {
  if (!isActive) return;
  isActive = false;
  if (pingInterval) {
    clearInterval(pingInterval);
    pingInterval = null;
  }
}
