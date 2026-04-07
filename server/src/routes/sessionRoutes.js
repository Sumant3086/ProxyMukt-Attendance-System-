import express from 'express';
import {
  createSession,
  startSession,
  pauseSession,
  resumeSession,
  endSession,
  getQRToken,
  getSessions,
  getSessionById,
  getSessionAttendance,
  updateVerificationSettings,
  toggleQR,
} from '../controllers/sessionController.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { validateObjectId } from '../middleware/validateObjectId.js';

const router = express.Router();

router.use(authenticate);

router.post('/', authorize(['FACULTY', 'ADMIN']), createSession);
router.post('/:id/start', authorize(['FACULTY', 'ADMIN']), validateObjectId(), startSession);
router.post('/:id/pause', authorize(['FACULTY', 'ADMIN']), validateObjectId(), pauseSession);
router.post('/:id/resume', authorize(['FACULTY', 'ADMIN']), validateObjectId(), resumeSession);
router.post('/:id/end', authorize(['FACULTY', 'ADMIN']), validateObjectId(), endSession);
router.patch('/:id/verification-settings', authorize(['FACULTY', 'ADMIN']), validateObjectId(), updateVerificationSettings);
router.patch('/:id/toggle-qr', authorize(['FACULTY', 'ADMIN']), validateObjectId(), toggleQR);
router.get('/:id/qr', validateObjectId(), getQRToken);
router.get('/', getSessions);
router.get('/:id', validateObjectId(), getSessionById);
router.get('/:id/attendance', authorize(['FACULTY', 'ADMIN']), validateObjectId(), getSessionAttendance);

export default router;
