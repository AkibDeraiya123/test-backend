import express from 'express';
import {
  getAllConfigurations,
  updateConfiguration
} from '../controllers/configController.js';

const router = express.Router();

router.get('/', getAllConfigurations);
router.put('/:key', updateConfiguration);

export default router;
