import express from 'express';
import {
  markAttendance,
  checkNearbySession,
  getStudentAttendance,
  getAttendanceStats,
  getClassAttendanceReport,
  getAnalytics,
} from '../controllers/attendanceController.js';
import { authenticate } from '../middleware/auth.js';
import { authorize } from '../middleware/role.js';

const router = express.Router();

router.use(authenticate);

router.post('/mark', authorize('STUDENT'), markAttendance);
router.post('/check-nearby', authorize('STUDENT'), checkNearbySession);
router.get('/my-attendance', authorize('STUDENT'), getStudentAttendance);
router.get('/stats', authorize('STUDENT'), getAttendanceStats);
router.get('/class/:classId/report', authorize('FACULTY', 'ADMIN'), getClassAttendanceReport);
router.get('/analytics', authorize('ADMIN'), getAnalytics);

export default router;
