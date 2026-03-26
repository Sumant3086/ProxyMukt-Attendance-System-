import express from 'express';
import { authenticate, authorize } from '../middleware/auth.js';
import {
  addIPRule,
  getIPRules,
  checkIPStatus,
  updateIPRule,
  deleteIPRule,
} from '../controllers/ipWhitelistController.js';

const router = express.Router();

router.use(authenticate);

// Public route to check IP status
router.get('/check', checkIPStatus);

// Admin routes
router.use(authorize(['ADMIN']));
router.post('/', addIPRule);
router.get('/', getIPRules);
router.put('/:id', updateIPRule);
router.delete('/:id', deleteIPRule);

export default router;
