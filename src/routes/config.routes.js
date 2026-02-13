import express from 'express';
import {
  getAllConfigurations,
  getConfiguration,
  updateConfiguration
} from '../controllers/configController.js';

const router = express.Router();

router.get('/', getAllConfigurations);
router.get('/:key', getConfiguration);
router.put('/:key', updateConfiguration);

export default router;
