import express from 'express';
import {
  getScheduledClasses,
  getScheduledClass,
  createScheduledClass,
  updateScheduledClass,
  deleteScheduledClass
} from '../controllers/classController.js';

const router = express.Router();

router.get('/', getScheduledClasses);
router.get('/:registrationId', getScheduledClass);
router.post('/', createScheduledClass);
router.put('/:registrationId', updateScheduledClass);
router.delete('/:registrationId', deleteScheduledClass);

export default router;
