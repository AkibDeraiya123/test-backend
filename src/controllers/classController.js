import ScheduledClass from '../models/ScheduledClass.js';
import { ValidationError, NotFoundError } from '../middleware/errorHandler.js';
import { validateScheduledClass } from '../services/validationService.js';
import { parseDateTime, calculateEndTime, isValidFutureDate } from '../utils/timeOverlap.js';
import { getConfigurationCache } from './configController.js';
import { v4 as uuidv4 } from 'uuid';

/**
 * Get all scheduled classes with filters
 */
export const getScheduledClasses = async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 50,
      date,
      instructorId,
      studentId,
      classTypeId,
      status = 'scheduled'
    } = req.query;

    const query = {};

    if (status) {
      query.status = status;
    }

    if (date) {
      const searchDate = new Date(date);
      const dayStart = new Date(searchDate.setHours(0, 0, 0, 0));
      const dayEnd = new Date(searchDate.setHours(23, 59, 59, 999));
      query['schedule.date'] = { $gte: dayStart, $lte: dayEnd };
    }

    if (instructorId) {
      query.instructorId = instructorId;
    }

    if (studentId) {
      query.studentIds = studentId;
    }

    if (classTypeId) {
      query.classTypeId = classTypeId;
    }

    const classes = await ScheduledClass.find(query)
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ 'schedule.startTime': 1 });

    const total = await ScheduledClass.countDocuments(query);

    res.json({
      success: true,
      data: classes,
      pagination: {
        total,
        page: parseInt(page),
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get single scheduled class by registration ID
 */
export const getScheduledClass = async (req, res, next) => {
  try {
    const { registrationId } = req.params;

    const scheduledClass = await ScheduledClass.findOne({ registrationId });

    if (!scheduledClass) {
      throw new NotFoundError(`Class with registration ID ${registrationId} not found`);
    }

    res.json({
      success: true,
      data: scheduledClass
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Create a new scheduled class
 */
export const createScheduledClass = async (req, res, next) => {
  try {
    const { classTypeId, instructorId, studentId, startTime } = req.body;

    // Validate required fields
    if (!classTypeId || !instructorId || !studentId || !startTime) {
      throw new ValidationError('classTypeId, instructorId, studentId, and startTime are required');
    }

    // Get configuration
    const config = await getConfigurationCache();

    // Parse start time
    let parsedStartTime;
    try {
      parsedStartTime = typeof startTime === 'string' ? parseDateTime(startTime) : new Date(startTime);
    } catch (error) {
      throw new ValidationError(`Invalid start time format: ${error.message}`);
    }

    // Validate date is not in the past
    if (!isValidFutureDate(parsedStartTime)) {
      throw new ValidationError('Cannot schedule classes in the past');
    }

    // Calculate end time
    const endTime = calculateEndTime(parsedStartTime, config.class_duration_minutes);

    // Validate the scheduled class
    const validation = await validateScheduledClass({
      instructorId,
      studentId,
      classTypeId,
      startTime: parsedStartTime,
      endTime,
      date: parsedStartTime
    });

    if (!validation.valid) {
      throw new ValidationError(validation.error);
    }

    // Generate registration ID
    const registrationId = `REG_${uuidv4().split('-')[0].toUpperCase()}`;

    // Create scheduled class
    const scheduledClass = await ScheduledClass.create({
      registrationId,
      classTypeId,
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
        createdBy: 'manual'
      }
    });

    res.status(201).json({
      success: true,
      data: scheduledClass,
      message: validation.studentAutoAdded
        ? `Class created. Student ${studentId} was auto-added.`
        : 'Class created successfully'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update an existing scheduled class
 */
export const updateScheduledClass = async (req, res, next) => {
  try {
    const { registrationId } = req.params;
    const { classTypeId, instructorId, studentId, startTime } = req.body;

    // Find existing class
    const existingClass = await ScheduledClass.findOne({ registrationId });

    if (!existingClass) {
      throw new NotFoundError(`Class with registration ID ${registrationId} not found`);
    }

    if (existingClass.status === 'cancelled') {
      throw new ValidationError('Cannot update a cancelled class');
    }

    // Get configuration
    const config = await getConfigurationCache();

    // Use existing values if not provided
    const updatedClassTypeId = classTypeId || existingClass.classTypeId;
    const updatedInstructorId = instructorId || existingClass.instructorId;
    const updatedStudentId = studentId || existingClass.studentIds[0];

    let parsedStartTime;
    if (startTime) {
      try {
        parsedStartTime = typeof startTime === 'string' ? parseDateTime(startTime) : new Date(startTime);
      } catch (error) {
        throw new ValidationError(`Invalid start time format: ${error.message}`);
      }

      // Validate date is not in the past
      if (!isValidFutureDate(parsedStartTime)) {
        throw new ValidationError('Cannot schedule classes in the past');
      }
    } else {
      parsedStartTime = existingClass.schedule.startTime;
    }

    // Calculate end time
    const endTime = calculateEndTime(parsedStartTime, config.class_duration_minutes);

    // Validate the updated class (excluding current registration)
    const validation = await validateScheduledClass(
      {
        instructorId: updatedInstructorId,
        studentId: updatedStudentId,
        classTypeId: updatedClassTypeId,
        startTime: parsedStartTime,
        endTime,
        date: parsedStartTime
      },
      registrationId
    );

    if (!validation.valid) {
      throw new ValidationError(validation.error);
    }

    // Update the class
    existingClass.classTypeId = updatedClassTypeId;
    existingClass.instructorId = updatedInstructorId;
    existingClass.studentIds = [updatedStudentId];
    existingClass.schedule = {
      date: parsedStartTime,
      startTime: parsedStartTime,
      durationMinutes: config.class_duration_minutes,
      endTime
    };

    await existingClass.save();

    res.json({
      success: true,
      data: existingClass,
      message: 'Class updated successfully'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete (cancel) a scheduled class
 */
export const deleteScheduledClass = async (req, res, next) => {
  try {
    const { registrationId } = req.params;

    const scheduledClass = await ScheduledClass.findOne({ registrationId });

    if (!scheduledClass) {
      throw new NotFoundError(`Class with registration ID ${registrationId} not found`);
    }

    // Soft delete - set status to cancelled
    scheduledClass.status = 'cancelled';
    await scheduledClass.save();

    res.json({
      success: true,
      message: `Class ${registrationId} has been cancelled`
    });
  } catch (error) {
    next(error);
  }
};
