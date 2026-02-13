import express from 'express';
import upload from '../middleware/upload.js';
import {
  uploadCSV,
  getUploadStatus,
  getUploadHistory
} from '../controllers/uploadController.js';

const router = express.Router();

router.post('/csv', upload.single('file'), uploadCSV);
router.get('/status/:batchId', getUploadStatus);
router.get('/history', getUploadHistory);

export default router;
