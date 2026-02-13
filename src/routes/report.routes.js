import express from 'express';
import {
  classesPerDay,
  filteredClasses,
  statistics,
  instructorReport
} from '../controllers/reportController.js';

const router = express.Router();

router.get('/classes-per-day', classesPerDay);
router.get('/classes-filtered', filteredClasses);
router.get('/statistics', statistics);
router.get('/instructor/:instructorId', instructorReport);

export default router;
