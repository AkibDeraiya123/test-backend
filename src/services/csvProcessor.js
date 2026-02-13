import fs from 'fs';
import csvParser from 'csv-parser';
import { v4 as uuidv4 } from 'uuid';
import ScheduledClass from '../models/ScheduledClass.js';
import { validateScheduledClass } from './validationService.js';
import { parseDateTime, calculateEndTime, isValidFutureDate } from '../utils/timeOverlap.js';
import { getConfigurationCache } from '../controllers/configController.js';

/**
 * Parse a single CSV row and normalize field names
 * @param {Object} row - Raw CSV row
 * @returns {Object} - Normalized row data
 */
const parseCSVRow = (row) => {
  // Handle different column name formats (with/without spaces, case-insensitive)
  const normalized = {};

  Object.keys(row).forEach(key => {
    const normalizedKey = key.toLowerCase().replace(/\s+/g, '');
    normalized[normalizedKey] = row[key];
  });

  return {
    registrationId: normalized['registrationid'] || normalized['regid'],
    studentId: normalized['studentid'] || normalized['student'],
    instructorId: normalized['instructorid'] || normalized['instructor'],
    classId: normalized['classid'] || normalized['class'],
    startTime: normalized['classstarttime'] || normalized['starttime'],
    action: (normalized['action'] || '').toLowerCase()
  };
};

/**
 * Process "new" action - create a new class
 */
const processNewClass = async (parsedRow, config, rowNumber, batchId) => {
  const { studentId, instructorId, classId, startTime } = parsedRow;

  try {
    // Validate required fields
    if (!studentId || !instructorId || !classId || !startTime) {
      return {
        rowNumber,
        registrationId: null,
        action: 'new',
        status: 'error',
        message: 'Missing required fields (studentId, instructorId, classId, or startTime)'
      };
    }

    // Parse start time
    let parsedStartTime;
    try {
      parsedStartTime = parseDateTime(startTime);
    } catch (error) {
      return {
        rowNumber,
        registrationId: null,
        action: 'new',
        status: 'error',
        message: `Invalid date-time format: ${error.message}`
      };
    }

    // Validate date is not in the past
    if (!isValidFutureDate(parsedStartTime)) {
      return {
        rowNumber,
        registrationId: null,
        action: 'new',
        status: 'error',
        message: 'Cannot schedule classes in the past'
      };
    }

    // Calculate end time
    const endTime = calculateEndTime(parsedStartTime, config.class_duration_minutes);

    // Validate the class
    const validation = await validateScheduledClass({
      instructorId,
      studentId,
      classTypeId: classId,
      startTime: parsedStartTime,
      endTime,
      date: parsedStartTime
    });

    if (!validation.valid) {
      return {
        rowNumber,
        registrationId: null,
        action: 'new',
        status: 'error',
        message: validation.error
      };
    }

    // Generate registration ID
    const registrationId = `REG_${uuidv4().split('-')[0].toUpperCase()}`;

    // Create the scheduled class
    const scheduledClass = await ScheduledClass.create({
      registrationId,
      classTypeId: classId,
      instructorId,
      studentIds: [studentId],
      schedule: {
        date: parsedStartTime,
        startTime: parsedStartTime,
        durationMinutes: config.class_duration_minutes,
        endTime
      },
      status: 'scheduled',
      metadata: {
        createdBy: 'csv_upload',
        csvBatchId: batchId
      }
    });

    return {
      rowNumber,
      registrationId: scheduledClass.registrationId,
      action: 'new',
      status: 'success',
      message: validation.studentAutoAdded
        ? `Class created successfully. Student ${studentId} was auto-added.`
        : 'Class created successfully'
    };
  } catch (error) {
    return {
      rowNumber,
      registrationId: null,
      action: 'new',
      status: 'error',
      message: error.message
    };
  }
};

/**
 * Process "update" action - update an existing class
 */
const processUpdateClass = async (parsedRow, config, rowNumber, batchId) => {
  const { registrationId, studentId, instructorId, classId, startTime } = parsedRow;

  try {
    // Validate registration ID
    if (!registrationId || registrationId.toLowerCase() === 'null') {
      return {
        rowNumber,
        registrationId: null,
        action: 'update',
        status: 'error',
        message: 'Registration ID is required for update action'
      };
    }

    // Find existing class
    const existingClass = await ScheduledClass.findOne({ registrationId });

    if (!existingClass) {
      return {
        rowNumber,
        registrationId,
        action: 'update',
        status: 'error',
        message: `Class with registration ID ${registrationId} not found`
      };
    }

    if (existingClass.status === 'cancelled') {
      return {
        rowNumber,
        registrationId,
        action: 'update',
        status: 'error',
        message: 'Cannot update a cancelled class'
      };
    }

    // Use provided values or keep existing
    const updatedStudentId = studentId || existingClass.studentIds[0];
    const updatedInstructorId = instructorId || existingClass.instructorId;
    const updatedClassId = classId || existingClass.classTypeId;

    let parsedStartTime;
    if (startTime) {
      try {
        parsedStartTime = parseDateTime(startTime);
      } catch (error) {
        return {
          rowNumber,
          registrationId,
          action: 'update',
          status: 'error',
          message: `Invalid date-time format: ${error.message}`
        };
      }

      if (!isValidFutureDate(parsedStartTime)) {
        return {
          rowNumber,
          registrationId,
          action: 'update',
          status: 'error',
          message: 'Cannot schedule classes in the past'
        };
      }
    } else {
      parsedStartTime = existingClass.schedule.startTime;
    }

    // Calculate end time
    const endTime = calculateEndTime(parsedStartTime, config.class_duration_minutes);

    // Validate the updated class
    const validation = await validateScheduledClass(
      {
        instructorId: updatedInstructorId,
        studentId: updatedStudentId,
        classTypeId: updatedClassId,
        startTime: parsedStartTime,
        endTime,
        date: parsedStartTime
      },
      registrationId
    );

    if (!validation.valid) {
      return {
        rowNumber,
        registrationId,
        action: 'update',
        status: 'error',
        message: validation.error
      };
    }

    // Update the class
    existingClass.classTypeId = updatedClassId;
    existingClass.instructorId = updatedInstructorId;
    existingClass.studentIds = [updatedStudentId];
    existingClass.schedule = {
      date: parsedStartTime,
      startTime: parsedStartTime,
      durationMinutes: config.class_duration_minutes,
      endTime
    };

    await existingClass.save();

    return {
      rowNumber,
      registrationId,
      action: 'update',
      status: 'success',
      message: 'Class updated successfully'
    };
  } catch (error) {
    return {
      rowNumber,
      registrationId: registrationId || null,
      action: 'update',
      status: 'error',
      message: error.message
    };
  }
};

/**
 * Process "delete" action - cancel an existing class
 */
const processDeleteClass = async (parsedRow, rowNumber) => {
  const { registrationId } = parsedRow;

  try {
    // Validate registration ID
    if (!registrationId || registrationId.toLowerCase() === 'null') {
      return {
        rowNumber,
        registrationId: null,
        action: 'delete',
        status: 'error',
        message: 'Registration ID is required for delete action'
      };
    }

    // Find existing class
    const existingClass = await ScheduledClass.findOne({ registrationId });

    if (!existingClass) {
      return {
        rowNumber,
        registrationId,
        action: 'delete',
        status: 'error',
        message: `Class with registration ID ${registrationId} not found`
      };
    }

    // Soft delete - set status to cancelled
    existingClass.status = 'cancelled';
    await existingClass.save();

    return {
      rowNumber,
      registrationId,
      action: 'delete',
      status: 'success',
      message: 'Class cancelled successfully'
    };
  } catch (error) {
    return {
      rowNumber,
      registrationId: registrationId || null,
      action: 'delete',
      status: 'error',
      message: error.message
    };
  }
};

/**
 * Process a single CSV row
 */
const processSingleRow = async (row, rowNumber, batchId, config) => {
  try {
    // Parse and normalize row
    const parsedRow = parseCSVRow(row);
    const { action } = parsedRow;

    // Validate action
    if (!action || !['new', 'update', 'delete'].includes(action)) {
      return {
        rowNumber,
        registrationId: parsedRow.registrationId || null,
        action: action || 'unknown',
        status: 'error',
        message: `Invalid action: ${action}. Must be 'new', 'update', or 'delete'`
      };
    }

    // Process based on action
    switch (action) {
      case 'new':
        return await processNewClass(parsedRow, config, rowNumber, batchId);
      case 'update':
        return await processUpdateClass(parsedRow, config, rowNumber, batchId);
      case 'delete':
        return await processDeleteClass(parsedRow, rowNumber);
      default:
        return {
          rowNumber,
          registrationId: parsedRow.registrationId || null,
          action,
          status: 'error',
          message: 'Unknown action'
        };
    }
  } catch (error) {
    return {
      rowNumber,
      registrationId: null,
      action: 'unknown',
      status: 'error',
      message: error.message
    };
  }
};

/**
 * Process CSV file with streaming
 * @param {string} filePath - Path to CSV file
 * @param {string} batchId - Batch ID for tracking
 * @param {Function} progressCallback - Callback for progress updates
 * @returns {Promise<Object>} - Processing results
 */
export const processCSVFile = async (filePath, batchId, progressCallback = null) => {
  return new Promise((resolve, reject) => {
    const results = [];
    let rowNumber = 0;
    let successCount = 0;
    let errorCount = 0;

    // Load configuration once
    getConfigurationCache()
      .then(config => {
        const stream = fs.createReadStream(filePath);
        const parser = csvParser();

        stream
          .pipe(parser)
          .on('data', async (row) => {
            // Pause stream while processing
            parser.pause();
            rowNumber++;

            try {
              const result = await processSingleRow(row, rowNumber, batchId, config);
              results.push(result);

              if (result.status === 'success') {
                successCount++;
              } else {
                errorCount++;
              }

              // Progress callback
              if (progressCallback) {
                progressCallback({
                  batchId,
                  rowsProcessed: rowNumber,
                  successCount,
                  errorCount
                });
              }
            } catch (error) {
              results.push({
                rowNumber,
                registrationId: null,
                action: 'unknown',
                status: 'error',
                message: error.message
              });
              errorCount++;
            }

            // Resume stream
            parser.resume();
          })
          .on('end', () => {
            // Clean up - delete uploaded file
            fs.unlinkSync(filePath);

            resolve({
              batchId,
              totalRows: rowNumber,
              successCount,
              errorCount,
              results
            });
          })
          .on('error', (error) => {
            reject(error);
          });
      })
      .catch(reject);
  });
};
