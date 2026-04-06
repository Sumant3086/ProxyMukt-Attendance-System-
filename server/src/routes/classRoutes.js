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
import { authenticate, authorize } from '../middleware/auth.js';
import { validateObjectId, validateObjectIds } from '../middleware/validateObjectId.js';

const router = express.Router();

router.use(authenticate);

router.post('/', authorize(['FACULTY', 'ADMIN']), createClass);
router.get('/', getClasses);
router.get('/:id', validateObjectId(), getClassById);
router.put('/:id', authorize(['FACULTY', 'ADMIN']), validateObjectId(), updateClass);
router.delete('/:id', authorize(['ADMIN']), validateObjectId(), deleteClass);
router.post('/:id/students', authorize(['FACULTY', 'ADMIN']), validateObjectId(), validateObjectIds(['studentIds']), addStudents);
router.delete('/:id/students/:studentId', authorize(['FACULTY', 'ADMIN']), validateObjectId(), validateObjectId('studentId'), removeStudent);

export default router;
