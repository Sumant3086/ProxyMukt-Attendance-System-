import express from 'express';
import { authenticate } from '../middleware/auth.js';
import { authorize } from '../middleware/role.js';
import {
  createOnlineSession,
  startOnlineSession,
  endOnlineSession,
  joinOnlineSession,
  leaveOnlineSession,
  updateEngagement,
  getOnlineSession,
} from '../controllers/onlineSessionController.js';

const router = express.Router();

// Faculty/Admin routes
router.post('/', authenticate, authorize('FACULTY', 'ADMIN'), createOnlineSession);
router.post('/:id/start', authenticate, authorize('FACULTY', 'ADMIN'), startOnlineSession);
router.post('/:id/end', authenticate, authorize('FACULTY', 'ADMIN'), endOnlineSession);
router.get('/:id', authenticate, getOnlineSession);

// Student routes
router.post('/:id/join', authenticate, authorize('STUDENT'), joinOnlineSession);
router.post('/:id/leave', authenticate, authorize('STUDENT'), leaveOnlineSession);
router.post('/:id/engagement', authenticate, authorize('STUDENT'), updateEngagement);

export default router;
