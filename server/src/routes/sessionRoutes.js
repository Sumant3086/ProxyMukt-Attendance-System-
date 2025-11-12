import express from 'express';
import {
  createSession,
  startSession,
  endSession,
  getQRToken,
  getSessions,
  getSessionById,
  getSessionAttendance,
} from '../controllers/sessionController.js';
import { authenticate } from '../middleware/auth.js';
import { authorize } from '../middleware/role.js';

const router = express.Router();

router.use(authenticate);

router.post('/', authorize('FACULTY', 'ADMIN'), createSession);
router.post('/:id/start', authorize('FACULTY', 'ADMIN'), startSession);
router.post('/:id/end', authorize('FACULTY', 'ADMIN'), endSession);
router.get('/:id/qr', getQRToken);
router.get('/', getSessions);
router.get('/:id', getSessionById);
router.get('/:id/attendance', authorize('FACULTY', 'ADMIN'), getSessionAttendance);

export default router;
