/**
 * WebSocket Manager with Room-based Broadcasting
 * FANG-Level: Optimized for scalability and performance
 */

// Global io instance manager to avoid circular imports
let ioInstance = null;

export const setIO = (io) => {
  ioInstance = io;
  setupSocketOptimizations(io);
};

export const getIO = () => {
  return ioInstance;
};

/**
 * Setup WebSocket optimizations
 */
function setupSocketOptimizations(io) {
  io.on('connection', (socket) => {
    console.log(`✅ Client connected: ${socket.id}`);

    // Join user-specific room
    if (socket.handshake.auth?.userId) {
      const userId = socket.handshake.auth.userId;
      socket.join(`user-${userId}`);
      console.log(`👤 User ${userId} joined personal room`);
    }

    // Join role-specific room
    if (socket.handshake.auth?.role) {
      const role = socket.handshake.auth.role;
      socket.join(`role-${role}`);
      console.log(`🎭 User joined ${role} room`);
    }

    // Handle joining class rooms
    socket.on('join-class', (classId) => {
      socket.join(`class-${classId}`);
      console.log(`📚 Socket ${socket.id} joined class-${classId}`);
      socket.emit('joined-class', { classId });
    });

    // Handle joining session rooms
    socket.on('join-session', (sessionId) => {
      socket.join(`session-${sessionId}`);
      console.log(`📝 Socket ${socket.id} joined session-${sessionId}`);
      socket.emit('joined-session', { sessionId });
    });

    // Handle leaving rooms
    socket.on('leave-class', (classId) => {
      socket.leave(`class-${classId}`);
      console.log(`📚 Socket ${socket.id} left class-${classId}`);
    });

    socket.on('leave-session', (sessionId) => {
      socket.leave(`session-${sessionId}`);
      console.log(`📝 Socket ${socket.id} left session-${sessionId}`);
    });

    // Handle disconnection
    socket.on('disconnect', () => {
      console.log(`❌ Client disconnected: ${socket.id}`);
    });

    // Heartbeat for connection monitoring
    socket.on('ping', () => {
      socket.emit('pong', { timestamp: Date.now() });
    });
  });

  // Monitor connection count
  setInterval(() => {
    const sockets = io.sockets.sockets.size;
    console.log(`📊 Active WebSocket connections: ${sockets}`);
  }, 60000); // Every minute
}

/**
 * Emit to specific user
 */
export function emitToUser(userId, event, data) {
  if (!ioInstance) return;
  ioInstance.to(`user-${userId}`).emit(event, data);
}

/**
 * Emit to specific role (ADMIN, FACULTY, STUDENT)
 */
export function emitToRole(role, event, data) {
  if (!ioInstance) return;
  ioInstance.to(`role-${role}`).emit(event, data);
}

/**
 * Emit to specific class
 */
export function emitToClass(classId, event, data) {
  if (!ioInstance) return;
  ioInstance.to(`class-${classId}`).emit(event, data);
}

/**
 * Emit to specific session
 */
export function emitToSession(sessionId, event, data) {
  if (!ioInstance) return;
  ioInstance.to(`session-${sessionId}`).emit(event, data);
}

/**
 * Broadcast to all connected clients
 */
export function broadcastToAll(event, data) {
  if (!ioInstance) return;
  ioInstance.emit(event, data);
}

/**
 * Get connection statistics
 */
export function getConnectionStats() {
  if (!ioInstance) return null;

  const sockets = Array.from(ioInstance.sockets.sockets.values());
  const rooms = new Set();

  sockets.forEach(socket => {
    socket.rooms.forEach(room => {
      if (room !== socket.id) {
        rooms.add(room);
      }
    });
  });

  return {
    totalConnections: sockets.length,
    totalRooms: rooms.size,
    rooms: Array.from(rooms),
    timestamp: Date.now()
  };
}

/**
 * Emit attendance marked event (optimized)
 */
export function emitAttendanceMarked(sessionId, classId, studentId, data) {
  if (!ioInstance) return;

  // Emit to session room (faculty monitoring)
  emitToSession(sessionId, 'attendance-marked', {
    studentId,
    ...data,
    timestamp: Date.now()
  });

  // Emit to class room
  emitToClass(classId, 'class-attendance-update', {
    sessionId,
    studentId,
    timestamp: Date.now()
  });

  // Emit to student
  emitToUser(studentId, 'attendance-confirmed', {
    sessionId,
    ...data,
    timestamp: Date.now()
  });

  // Emit to admins only if high risk
  if (data.riskScore >= 70) {
    emitToRole('ADMIN', 'high-risk-attendance', {
      sessionId,
      classId,
      studentId,
      riskScore: data.riskScore,
      timestamp: Date.now()
    });
  }
}

/**
 * Emit alert event (optimized)
 */
export function emitAlert(alert) {
  if (!ioInstance) return;

  // Emit to admins
  emitToRole('ADMIN', 'new-alert', {
    alert,
    timestamp: Date.now()
  });

  // Emit to faculty of the class
  if (alert.class) {
    emitToClass(alert.class, 'class-alert', {
      alert,
      timestamp: Date.now()
    });
  }
}

/**
 * Emit session status change
 */
export function emitSessionStatusChange(sessionId, classId, status, data = {}) {
  if (!ioInstance) return;

  // Emit to session room
  emitToSession(sessionId, 'session-status-changed', {
    status,
    ...data,
    timestamp: Date.now()
  });

  // Emit to class room
  emitToClass(classId, 'class-session-update', {
    sessionId,
    status,
    timestamp: Date.now()
  });
}

export default {
  setIO,
  getIO,
  emitToUser,
  emitToRole,
  emitToClass,
  emitToSession,
  broadcastToAll,
  getConnectionStats,
  emitAttendanceMarked,
  emitAlert,
  emitSessionStatusChange
};
