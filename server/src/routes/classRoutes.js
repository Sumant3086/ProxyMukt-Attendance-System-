import express from 'express';
import {
  createClass,
  getClasses,
  getClassById,
  updateClass,
  deleteClass,
  addStudents,
  removeStudent,
  getAvailableStudents,
} from '../controllers/classController.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { validateObjectId, validateObjectIds } from '../middleware/validateObjectId.js';

const router = express.Router();

router.use(authenticate);

// Remove debug endpoint in production - security risk
if (process.env.NODE_ENV === 'development') {
  router.get('/debug-auth', (req, res) => {
    res.json({
      success: true,
      user: req.user ? {
        id: req.user._id,
        email: req.user.email,
        role: req.user.role,
      } : null,
    });
  });
}

router.post('/', authorize(['FACULTY', 'ADMIN']), createClass);
router.get('/', getClasses);
router.get('/students/available', authorize(['FACULTY', 'ADMIN']), getAvailableStudents);
router.get('/:id', validateObjectId(), getClassById);
router.put('/:id', authorize(['FACULTY', 'ADMIN']), validateObjectId(), updateClass);
router.delete('/:id', authorize(['ADMIN']), validateObjectId(), deleteClass);
router.post('/:id/students', authorize(['FACULTY', 'ADMIN']), validateObjectId(), validateObjectIds(['studentIds']), addStudents);
router.delete('/:id/students/:studentId', authorize(['FACULTY', 'ADMIN']), validateObjectId(), validateObjectId('studentId'), removeStudent);

export default router;
