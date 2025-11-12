import express from 'express';
import {
  createClass,
  getClasses,
  getClassById,
  updateClass,
  deleteClass,
  addStudents,
  removeStudent,
} from '../controllers/classController.js';
import { authenticate } from '../middleware/auth.js';
import { authorize } from '../middleware/role.js';

const router = express.Router();

router.use(authenticate);

router.post('/', authorize('FACULTY', 'ADMIN'), createClass);
router.get('/', getClasses);
router.get('/:id', getClassById);
router.put('/:id', authorize('FACULTY', 'ADMIN'), updateClass);
router.delete('/:id', authorize('ADMIN'), deleteClass);
router.post('/:id/students', authorize('FACULTY', 'ADMIN'), addStudents);
router.delete('/:id/students/:studentId', authorize('FACULTY', 'ADMIN'), removeStudent);

export default router;
