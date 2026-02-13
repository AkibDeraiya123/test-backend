import express from 'express';
import masterRoutes from './master.routes.js';
import configRoutes from './config.routes.js';
import classRoutes from './class.routes.js';
import uploadRoutes from './upload.routes.js';
import reportRoutes from './report.routes.js';

const router = express.Router();

// Mount routes
router.use('/masters', masterRoutes);
router.use('/config', configRoutes);
router.use('/classes', classRoutes);
router.use('/upload', uploadRoutes);
router.use('/reports', reportRoutes);

export default router;
