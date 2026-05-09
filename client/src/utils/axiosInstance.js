import axios from 'axios';
import { useAuthStore } from '../store/authStore';

const axiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5001/api',
  withCredentials: true,
  timeout: 30000, // 30 s — covers Render free tier cold start (can take 20-50 s)
  headers: {
    'Content-Type': 'application/json',
  },
});

// GET cache — 2 minute TTL
const requestCache = new Map();
const CACHE_TTL = 2 * 60 * 1000;

// ── Request interceptor ────────────────────────────────────────────
axiosInstance.interceptors.request.use(
  (config) => {
    const token = useAuthStore.getState().token;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    config.metadata = { startTime: Date.now() };

    // Serve from cache for GET requests (skip real-time endpoints)
    if (config.method === 'get' && !config.url?.includes('check-nearby')) {
      const cacheKey = `${config.url}${JSON.stringify(config.params || {})}`;
      const cached = requestCache.get(cacheKey);
      if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
        config.adapter = () => Promise.resolve({
          data: cached.data,
          status: 200,
          statusText: 'OK (cached)',
          headers: cached.headers,
          config,
        });
      }
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// ── Response interceptor ───────────────────────────────────────────
axiosInstance.interceptors.response.use(
  (response) => {
    // Cache successful GET responses
    if (response.config.method === 'get' && response.status === 200) {
      const cacheKey = `${response.config.url}${JSON.stringify(response.config.params || {})}`;
      requestCache.set(cacheKey, {
        data: response.data,
        headers: response.headers,
        timestamp: Date.now(),
      });
      if (requestCache.size > 50) {
        requestCache.delete(requestCache.keys().next().value);
      }
    }
    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    // ── Retry once on network/timeout errors (Render cold start) ──
    // A network error or timeout usually means the backend is still waking up.
    // Wait 5 s then retry once — by then the server is usually ready.
    const isNetworkError = !error.response && error.request;
    const isTimeout = error.code === 'ECONNABORTED';
    if ((isNetworkError || isTimeout) && !originalRequest._coldStartRetry) {
      originalRequest._coldStartRetry = true;
      await new Promise((r) => setTimeout(r, 5000));
      return axiosInstance(originalRequest);
    }

    // ── Token refresh on 401 ───────────────────────────────────────
    const isAuthEndpoint =
      originalRequest.url?.includes('/auth/login') ||
      originalRequest.url?.includes('/auth/register') ||
      originalRequest.url?.includes('/auth/refresh');

    if (error.response?.status === 401 && !originalRequest._retry && !isAuthEndpoint) {
      originalRequest._retry = true;
      try {
        const { data } = await axios.post(
          `${import.meta.env.VITE_API_URL || 'http://localhost:5001/api'}/auth/refresh`,
          {},
          { withCredentials: true }
        );
        useAuthStore.getState().setToken(data.data.accessToken);
        originalRequest.headers.Authorization = `Bearer ${data.data.accessToken}`;
        return axiosInstance(originalRequest);
      } catch {
        const currentPath = window.location.pathname;
        if (currentPath !== '/login' && currentPath !== '/register') {
          useAuthStore.getState().logout();
          window.location.href = '/login';
        }
      }
    }

    return Promise.reject(error);
  }
);

export const clearCache = () => requestCache.clear();

export default axiosInstance;
