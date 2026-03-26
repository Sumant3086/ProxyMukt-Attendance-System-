import express from 'express';
import { authenticate, authorize } from '../middleware/auth.js';
import {
  getAlerts,
  getAlertById,
  reviewAlert,
  getVerificationQueue,
  assignVerificationTask,
  getAlertStats,
} from '../controllers/alertController.js';

const router = express.Router();

// All alert routes require authentication and admin role
router.use(authenticate);
router.use(authorize(['ADMIN']));

// Alert endpoints
router.get('/', getAlerts);
router.get('/stats', getAlertStats);
router.get('/:id', getAlertById);
router.put('/:id/review', reviewAlert);

// Verification queue endpoints
router.get('/queue/list', getVerificationQueue);
router.put('/queue/:id/assign', assignVerificationTask);

export default router;
