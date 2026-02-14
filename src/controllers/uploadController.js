import { v4 as uuidv4 } from 'uuid';
import { processCSVFile } from '../services/csvProcessor.js';
import { ValidationError } from '../middleware/errorHandler.js';

// Store upload status in memory (in production, use Redis or database)
const uploadStatus = new Map();

/**
 * Upload and process CSV file
 */
export const uploadCSV = async (req, res, next) => {
  try {
    if (!req.file) {
      throw new ValidationError('No file uploaded');
    }

    const batchId = `BATCH_${uuidv4().split('-')[0].toUpperCase()}`;
    const filePath = req.file.path;
    const fileName = req.file.originalname;

    // Initialize status
    uploadStatus.set(batchId, {
      batchId,
      fileName,
      status: 'processing',
      totalRows: 0,
      successCount: 0,
      errorCount: 0,
      results: [],
      startedAt: new Date()
    });

    // Respond immediately with batch ID
    res.json({
      success: true,
      message: 'CSV upload received. Processing in background.',
      batchId,
      fileName,
      statusUrl: `/api/upload/status/${batchId}`
    });

    // Process CSV asynchronously
    processCSVFile(filePath, batchId, (progress) => {
      // Update progress
      const currentStatus = uploadStatus.get(batchId);
      if (currentStatus) {
        uploadStatus.set(batchId, {
          ...currentStatus,
          ...progress
        });
      }
    })
      .then((result) => {
        // Update final status
        uploadStatus.set(batchId, {
          batchId,
          fileName,
          status: 'completed',
          totalRows: result.totalRows,
          successCount: result.successCount,
          errorCount: result.errorCount,
          results: result.results,
          startedAt: uploadStatus.get(batchId).startedAt,
          completedAt: new Date()
        });
      })
      .catch((error) => {
        // Update error status
        uploadStatus.set(batchId, {
          batchId,
          fileName,
          status: 'failed',
          error: error.message,
          startedAt: uploadStatus.get(batchId).startedAt,
          failedAt: new Date()
        });
      });
  } catch (error) {
    next(error);
  }
};

/**
 * Get upload status by batch ID
 */
export const getUploadStatus = async (req, res, next) => {
  try {
    const { batchId } = req.params;

    const status = uploadStatus.get(batchId);

    if (!status) {
      return res.status(404).json({
        success: false,
        error: {
          message: `Upload with batch ID ${batchId} not found`
        }
      });
    }

    // Return a deep copy so concurrent requests get a stable snapshot and
    // we never expose the live Map value (avoids partial results if the
    // completed write is still in progress)
    const snapshot = JSON.parse(JSON.stringify(status));
    res.json({
      success: true,
      data: snapshot
    });
  } catch (error) {
    next(error);
  }
};

