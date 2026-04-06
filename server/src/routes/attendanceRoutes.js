import express from 'express';
import {
  markAttendance,
  checkNearbySession,
  getStudentAttendance,
  getAttendanceStats,
  getClassAttendanceReport,
  getAnalytics,
  getPeerCluster,
} from '../controllers/attendanceController.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { attendanceRateLimit } from '../middleware/rateLimitMiddleware.js';

const router = express.Router();

router.use(authenticate);

router.post('/mark', authorize(['STUDENT']), attendanceRateLimit, markAttendance);
router.post('/check-nearby', authorize(['STUDENT']), checkNearbySession);
router.get('/my-attendance', authorize(['STUDENT']), getStudentAttendance);
router.get('/stats', authorize(['STUDENT']), getAttendanceStats);
router.get('/class/:classId/report', authorize(['FACULTY', 'ADMIN']), getClassAttendanceReport);
router.get('/analytics', authorize(['ADMIN']), getAnalytics);
router.get('/peer-cluster/:sessionId', authorize(['FACULTY', 'ADMIN']), getPeerCluster);

export default router;
