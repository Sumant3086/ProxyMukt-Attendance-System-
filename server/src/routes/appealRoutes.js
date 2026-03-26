import express from 'express';
import { authenticate, authorize } from '../middleware/auth.js';
import {
  createAppeal,
  getStudentAppeals,
  getAllAppeals,
  reviewAppeal,
  getAppealStats,
} from '../controllers/appealController.js';

const router = express.Router();

router.use(authenticate);

// Student routes
router.post('/', createAppeal);
router.get('/my-appeals', getStudentAppeals);

// Admin routes
router.use(authorize(['ADMIN']));
router.get('/', getAllAppeals);
router.get('/stats', getAppealStats);
router.put('/:id/review', reviewAppeal);

export default router;
