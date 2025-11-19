import express from 'express';
import { authenticate } from '../middleware/auth.js';
import { authorize } from '../middleware/role.js';
import {
  createZoomSession,
  syncZoomSession,
  getZoomParticipants,
  endZoomSession,
} from '../controllers/zoomController.js';

const router = express.Router();

// Faculty/Admin routes
router.post('/create', authenticate, authorize('FACULTY', 'ADMIN'), createZoomSession);
router.post('/:id/sync', authenticate, authorize('FACULTY', 'ADMIN'), syncZoomSession);
router.get('/:id/participants', authenticate, authorize('FACULTY', 'ADMIN'), getZoomParticipants);
router.post('/:id/end', authenticate, authorize('FACULTY', 'ADMIN'), endZoomSession);

export default router;
