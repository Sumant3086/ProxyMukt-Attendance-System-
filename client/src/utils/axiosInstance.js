import axios from 'axios';
import { useAuthStore } from '../store/authStore';

// In production the frontend is served from the same Express server,
// so /api resolves to the correct backend without any env var.
const axiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_URL || (import.meta.env.PROD ? '/api' : 'http://localhost:5001/api'),
  withCredentials: true,
  timeout: 10000, // Reduced to 10 seconds
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request cache for GET requests (2 minute TTL for faster responses)
const requestCache = new Map();
const CACHE_TTL = 2 * 60 * 1000; // 2 minutes (reduced from 5)

// Request interceptor
axiosInstance.interceptors.request.use(
  (config) => {
    const token = useAuthStore.getState().token;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // Add request timestamp for performance monitoring
    config.metadata = { startTime: Date.now() };
    
    // Check cache for GET requests (except real-time data)
    if (config.method === 'get' && !config.url?.includes('check-nearby')) {
      const cacheKey = `${config.url}${JSON.stringify(config.params || {})}`;
      const cached = requestCache.get(cacheKey);
      
      if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
        console.log('📦 Cache hit:', config.url);
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

// Response interceptor
axiosInstance.interceptors.response.use(
  (response) => {
    // Log response time
    const startTime = response.config?.metadata?.startTime;
    if (startTime) {
      const duration = Date.now() - startTime;
      if (duration > 1000) {
        console.warn(`⚠️ Slow request (${duration}ms):`, response.config.url);
      }
    }
    
    // Cache GET responses
    if (response.config.method === 'get' && response.status === 200) {
      const cacheKey = `${response.config.url}${JSON.stringify(response.config.params || {})}`;
      requestCache.set(cacheKey, {
        data: response.data,
        headers: response.headers,
        timestamp: Date.now(),
      });
      
      // Clean old cache entries
      if (requestCache.size > 50) {
        const oldestKey = requestCache.keys().next().value;
        requestCache.delete(oldestKey);
      }
    }
    
    return response;
  },
  async (error) => {
    const originalRequest = error.config;
    
    // Log error details
    if (error.response) {
      console.error(`❌ API Error (${error.response.status}):`, originalRequest.url);
    } else if (error.request) {
      console.error('❌ Network Error:', originalRequest.url);
    }
    
    // Don't try to refresh token on login/register endpoints
    const isAuthEndpoint = originalRequest.url?.includes('/auth/login') || 
                          originalRequest.url?.includes('/auth/register') ||
                          originalRequest.url?.includes('/auth/refresh');
    
    // If 401 and not already retried and not an auth endpoint
    if (error.response?.status === 401 && !originalRequest._retry && !isAuthEndpoint) {
      originalRequest._retry = true;
      
      try {
        const { data } = await axios.post(
          `${import.meta.env.VITE_API_URL || (import.meta.env.PROD ? '/api' : 'http://localhost:5001/api')}/auth/refresh`,
          {},
          { withCredentials: true }
        );
        
        useAuthStore.getState().setToken(data.data.accessToken);
        originalRequest.headers.Authorization = `Bearer ${data.data.accessToken}`;
        
        return axiosInstance(originalRequest);
      } catch (refreshError) {
        // Only logout and redirect if we're not already on login/register page
        const currentPath = window.location.pathname;
        if (currentPath !== '/login' && currentPath !== '/register') {
          useAuthStore.getState().logout();
          window.location.href = '/login';
        }
        return Promise.reject(refreshError);
      }
    }
    
    return Promise.reject(error);
  }
);

// Clear cache function (call after mutations)
export const clearCache = () => {
  requestCache.clear();
  console.log('🗑️ Request cache cleared');
};

export default axiosInstance;
