import express from 'express';
import {
  createSession,
  startSession,
  endSession,
  getQRToken,
  getSessions,
  getSessionById,
  getSessionAttendance,
  updateVerificationSettings,
} from '../controllers/sessionController.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { validateObjectId } from '../middleware/validateObjectId.js';

const router = express.Router();

router.use(authenticate);

router.post('/', authorize(['FACULTY', 'ADMIN']), createSession);
router.post('/:id/start', authorize(['FACULTY', 'ADMIN']), validateObjectId(), startSession);
router.post('/:id/end', authorize(['FACULTY', 'ADMIN']), validateObjectId(), endSession);
router.patch('/:id/verification-settings', authorize(['FACULTY', 'ADMIN']), validateObjectId(), updateVerificationSettings);
router.get('/:id/qr', validateObjectId(), getQRToken);
router.get('/', getSessions);
router.get('/:id', validateObjectId(), getSessionById);
router.get('/:id/attendance', authorize(['FACULTY', 'ADMIN']), validateObjectId(), getSessionAttendance);

export default router;
