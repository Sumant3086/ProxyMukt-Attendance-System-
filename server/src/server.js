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
import { generateQRToken, getQRRotationInterval } from './utils/qr.js';

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
});

// Connect to database
connectDB();

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Rate limiting - Increased limits for development
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 500, // Increased from 100 to 500 requests per windowMs
  message: 'Too many requests from this IP, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api/', limiter);

// Routes
app.get('/', (req, res) => {
  res.json({ 
    message: 'Attendance System API',
    version: '1.0.0',
    timestamp: new Date().toISOString()
  });
});

// Test route
app.get('/api/test', (req, res) => {
  res.json({ message: 'API is working', timestamp: new Date().toISOString() });
});

app.use('/api/auth', (req, res, next) => {
  console.log('Auth route accessed:', req.method, req.path);
  next();
}, authRoutes);
app.use('/api/classes', classRoutes);
app.use('/api/sessions', sessionRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/audit', auditRoutes);
app.use('/api/online-sessions', onlineSessionRoutes);
app.use('/api/zoom', zoomRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/admin', adminRoutes);

// Error handlers
app.use(notFound);
app.use(errorHandler);

// Socket.IO for real-time QR updates
const activeSessions = new Map();

io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);
  
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
  });
});

const PORT = process.env.PORT || 5000;

console.log('🔧 Server configuration:');
console.log('- NODE_ENV:', process.env.NODE_ENV);
console.log('- PORT:', PORT);
console.log('- CLIENT_URL:', process.env.CLIENT_URL);
console.log('- Static file serving: DISABLED for backend-only deployment');

httpServer.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
