import express from 'express';
import {
  getAllUsers,
  getFacultyDetails,
  removeStudentFromClass,
  removeFaculty,
  removeStudent,
  getAllClasses,
  deleteClass,
  getDashboardStats,
} from '../controllers/adminController.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = express.Router();

// All admin routes require authentication and admin role
router.use(authenticate);
router.use(authorize(['ADMIN']));

// User Management
router.get('/users', getAllUsers);
router.get('/dashboard/stats', getDashboardStats);

// Faculty Management
router.get('/faculty/:facultyId', getFacultyDetails);
router.delete('/faculty/:facultyId', removeFaculty);

// Student Management
router.delete('/students/:studentId', removeStudent);
router.delete('/classes/:classId/students/:studentId', removeStudentFromClass);

// Class Management
router.get('/classes', getAllClasses);
router.delete('/classes/:classId', deleteClass);

export default router;