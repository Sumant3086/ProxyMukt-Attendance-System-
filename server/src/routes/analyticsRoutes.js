import express from 'express';
import {
  getAttendanceAnalytics,
  getStudentAnalytics,
  exportAttendanceCSV,
  getClassAnalytics,
  getAnalyticsBySection,
} from '../controllers/analyticsController.js';
import { authenticate } from '../middleware/auth.js';
import { authorize } from '../middleware/role.js';

const router = express.Router();

router.use(authenticate);

// Lazy loading endpoint for analytics sections
router.get('/section', authorize('ADMIN', 'FACULTY'), getAnalyticsBySection);

// Admin/Faculty analytics
router.get('/attendance', authorize('ADMIN', 'FACULTY'), getAttendanceAnalytics);
router.get('/class/:id', authorize('ADMIN', 'FACULTY'), getClassAnalytics);
router.get('/export/csv', authorize('ADMIN', 'FACULTY'), exportAttendanceCSV);

// Student analytics
router.get('/student', getStudentAnalytics);
router.get('/student/:studentId', authorize('ADMIN', 'FACULTY'), getStudentAnalytics);

export default router;
