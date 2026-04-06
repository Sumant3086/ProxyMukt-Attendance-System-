import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import { createServer } from 'http';
import { Server } from 'socket.io';
import connectDB from './config/db.js';
import { errorHandler, notFound } from './middleware/errorHandler.js';
import authRoutes from './routes/authRoutes.js';
import classRoutes from './routes/classRoutes.js';
import sessionRoutes from './routes/sessionRoutes.js';
import attendanceRoutes from './routes/attendanceRoutes.js';
import analyticsRoutes from './routes/analyticsRoutes.js';
import auditRoutes from './routes/auditRoutes.js';
import onlineSessionRoutes from './routes/onlineSessionRoutes.js';
import zoomRoutes from './routes/zoomRoutes.js';
import notificationRoutes from './routes/notificationRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import alertRoutes from './routes/alertRoutes.js';
import appealRoutes from './routes/appealRoutes.js';
import ipWhitelistRoutes from './routes/ipWhitelistRoutes.js';
import { generateQRToken, getQRRotationInterval } from './utils/qr.js';
import { setIO } from './utils/ioManager.js';

// FANG-Level Middleware Imports
import { 
  contentSecurityPolicy, 
  securityHeaders, 
  sanitizeMiddleware,
  suspiciousPatternMiddleware 
} from './middleware/advancedSecurity.js';
import { 
  etagMiddleware, 
  responseTimeMiddleware,
  responseHelpersMiddleware 
} from './middleware/responseOptimization.js';
import { circuitBreakerMiddleware, getCircuitBreakerHealth } from './utils/circuitBreaker.js';
import { advancedRateLimit } from './utils/advancedRateLimiter.js';
import { getConnectionStats } from './utils/ioManager.js';
import { sanitizeInput } from './middleware/inputValidation.js';

dotenv.config();

const app = express();

// Trust proxy for rate limiting (required for Render deployment)
app.set('trust proxy', 1);

const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    credentials: true,
  },
  // WebSocket optimization
  pingTimeout: 60000,
  pingInterval: 25000,
  transports: ['websocket', 'polling'],
  allowEIO3: true
});

// Connect to database
connectDB();

// Set global io instance (with optimizations)
setIO(io);

// ============================================
// FANG-LEVEL MIDDLEWARE STACK
// ============================================

// 1. Security Headers (First line of defense)
app.use(contentSecurityPolicy());
app.use(securityHeaders());
app.use(helmet({
  contentSecurityPolicy: false, // Using custom CSP
  crossOriginEmbedderPolicy: false
}));

// 2. CORS Configuration
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true,
}));

// 3. Body Parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// 4. Input Sanitization (Prevent XSS, SQL/NoSQL Injection)
app.use(sanitizeInput);
app.use(sanitizeMiddleware);
app.use(suspiciousPatternMiddleware);

// 5. Response Optimization
app.use(responseTimeMiddleware);
app.use(etagMiddleware);
app.use(responseHelpersMiddleware);

// 6. Circuit Breaker Monitoring
app.use(circuitBreakerMiddleware);

// 7. Basic Rate Limiting (Fallback)
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 500,
  message: 'Too many requests from this IP, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api/', limiter);

// ============================================
// HEALTH & MONITORING ENDPOINTS
// ============================================

app.get('/health', (req, res) => {
  const health = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: {
      used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024) + ' MB',
      total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024) + ' MB'
    },
    circuitBreakers: getCircuitBreakerHealth(),
    websockets: getConnectionStats()
  };
  
  res.json(health);
});

app.get('/metrics', (req, res) => {
  const metrics = {
    timestamp: new Date().toISOString(),
    process: {
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      cpu: process.cpuUsage()
    },
    circuitBreakers: getCircuitBreakerHealth(),
    websockets: getConnectionStats()
  };
  
  res.json(metrics);
});

// ============================================
// API ROUTES
// ============================================

app.get('/', (req, res) => {
  res.json({ 
    message: 'ProxyMukt Attendance System API',
    version: '2.0.0',
    features: [
      'Multi-layer fraud detection',
      'Real-time WebSocket updates',
      'Advanced rate limiting',
      'Circuit breaker pattern',
      'Response optimization',
      'Security hardening'
    ],
    timestamp: new Date().toISOString()
  });
});

app.get('/api/test', (req, res) => {
  res.json({ 
    message: 'API is working', 
    timestamp: new Date().toISOString(),
    responseTime: res.getHeader('X-Response-Time')
  });
});

app.use('/api/auth', authRoutes);
app.use('/api/classes', classRoutes);
app.use('/api/sessions', sessionRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/audit', auditRoutes);
app.use('/api/online-sessions', onlineSessionRoutes);
app.use('/api/zoom', zoomRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/alerts', alertRoutes);
app.use('/api/appeals', appealRoutes);
app.use('/api/ip-whitelist', ipWhitelistRoutes);

// Error handlers
app.use(notFound);
app.use(errorHandler);

// Socket.IO for real-time QR updates and alerts
const activeSessions = new Map();
const adminConnections = new Map(); // Track admin connections for alerts

io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);
  
  // Admin joins alerts namespace
  socket.on('admin-join-alerts', (adminId) => {
    socket.join(`admin-${adminId}`);
    adminConnections.set(adminId, socket.id);
    console.log(`Admin ${adminId} joined alerts namespace`);
  });
  
  socket.on('join-session', (sessionId) => {
    socket.join(`session-${sessionId}`);
    
    if (!activeSessions.has(sessionId)) {
      const interval = setInterval(() => {
        const qrToken = generateQRToken(sessionId);
        io.to(`session-${sessionId}`).emit('qr-update', { qrToken });
      }, getQRRotationInterval());
      
      activeSessions.set(sessionId, interval);
      
      // Send initial QR
      const qrToken = generateQRToken(sessionId);
      socket.emit('qr-update', { qrToken });
    }
  });
  
  socket.on('leave-session', (sessionId) => {
    socket.leave(`session-${sessionId}`);
    
    const room = io.sockets.adapter.rooms.get(`session-${sessionId}`);
    if (!room || room.size === 0) {
      const interval = activeSessions.get(sessionId);
      if (interval) {
        clearInterval(interval);
        activeSessions.delete(sessionId);
      }
    }
  });
  
  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
    // Remove admin from connections
    for (const [adminId, socketId] of adminConnections.entries()) {
      if (socketId === socket.id) {
        adminConnections.delete(adminId);
        break;
      }
    }
  });
});

// Export io for use in controllers
export { io };

const PORT = process.env.PORT || 5000;

console.log('🔧 Server configuration:');
console.log('- NODE_ENV:', process.env.NODE_ENV);
console.log('- PORT:', PORT);
console.log('- CLIENT_URL:', process.env.CLIENT_URL);
console.log('- Static file serving: DISABLED for backend-only deployment');

httpServer.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});

// Global error handlers for production
process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error);
  // Log but don't exit in production
  if (process.env.NODE_ENV !== 'production') {
    process.exit(1);
  }
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
  // Log but don't exit in production
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('👋 SIGTERM received, shutting down gracefully');
  httpServer.close(() => {
    console.log('✅ Server closed');
    process.exit(0);
  });
});
