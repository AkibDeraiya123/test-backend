import express from 'express';
import {
  // Students
  getStudents,
  createStudent,
  updateStudent,
  deleteStudent,
  // Instructors
  getInstructors,
  createInstructor,
  updateInstructor,
  deleteInstructor,
  // Class Types
  getClassTypes,
  createClassType,
  updateClassType,
  deleteClassType
} from '../controllers/masterController.js';

const router = express.Router();

// ========== STUDENTS ROUTES ==========
router.get('/students', getStudents);
router.post('/students', createStudent);
router.put('/students/:studentId', updateStudent);
router.delete('/students/:studentId', deleteStudent);

// ========== INSTRUCTORS ROUTES ==========
router.get('/instructors', getInstructors);
router.post('/instructors', createInstructor);
router.put('/instructors/:instructorId', updateInstructor);
router.delete('/instructors/:instructorId', deleteInstructor);

// ========== CLASS TYPES ROUTES ==========
router.get('/class-types', getClassTypes);
router.post('/class-types', createClassType);
router.put('/class-types/:classTypeId', updateClassType);
router.delete('/class-types/:classTypeId', deleteClassType);

export default router;
