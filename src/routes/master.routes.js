import express from 'express';
import {
  // Students
  getStudents,
  // Instructors
  getInstructors,
  // Class Types
  getClassTypes,
} from '../controllers/masterController.js';

const router = express.Router();

// ========== STUDENTS ROUTES ==========
router.get('/students', getStudents);

// ========== INSTRUCTORS ROUTES ==========
router.get('/instructors', getInstructors);

// ========== CLASS TYPES ROUTES ==========
router.get('/class-types', getClassTypes);

export default router;
