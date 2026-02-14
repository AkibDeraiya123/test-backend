import ScheduledClass from '../models/ScheduledClass.js';
import Student from '../models/Student.js';
import Instructor from '../models/Instructor.js';
import ClassType from '../models/ClassType.js';
import { hasTimeOverlap, getDayBoundaries } from '../utils/timeOverlap.js';
import { getConfigurationCache } from '../controllers/configController.js';


const FIRST_NAMES = ['Alex', 'Jordan', 'Sam', 'Taylor', 'Morgan', 'Casey', 'Riley', 'Avery', 'Quinn', 'Jamie', 'Dakota', 'Skyler', 'Cameron', 'Reese', 'Parker'];
const LAST_NAMES = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez', 'Wilson', 'Anderson', 'Thomas', 'Taylor', 'Moore'];

/**
 * Generate random student name and email
 * @returns {{ name: string, email: string }}
 */
export const generateRandomNameAndEmail = () => {
  const first = FIRST_NAMES[Math.floor(Math.random() * FIRST_NAMES.length)];
  const last = LAST_NAMES[Math.floor(Math.random() * LAST_NAMES.length)];
  const name = `${first} ${last}`;
  const local = `${first.toLowerCase()}.${last.toLowerCase()}`.replace(/\s+/g, '');
  const suffix = Math.random().toString(36).slice(2, 8);
  const email = `${local}+${suffix}@example.com`;
  return { name, email };
};

/**
 * Check if instructor exists and is active, or auto-add if enabled
 * @param {string} instructorId - Instructor ID to validate
 * @param {boolean} autoAdd - Whether to auto-add if not found
 * @returns {Promise<Object>} - Validation result
 */
export const validateOrCreateInstructor = async (instructorId, autoAdd = false) => {
  let instructor = await Instructor.findOne({ instructorId, active: true });

  if (!instructor && autoAdd) {
    const { name, email } = generateRandomNameAndEmail();
    instructor = await Instructor.create({
      instructorId,
      name,
      email,
      active: true,
      metadata: {
        autoAdded: true
      }
    });
    return { valid: true, instructor, autoAdded: true };
  }

  if (!instructor) {
    return {
      valid: false,
      error: `Invalid instructor ID: ${instructorId}`
    };
  }

  return { valid: true, instructor, autoAdded: false };
};

/**
 * Check if class type exists and is active, or auto-add if enabled
 * @param {string} classTypeId - Class type ID to validate
 * @param {boolean} autoAdd - Whether to auto-add if not found
 * @returns {Promise<Object>} - Validation result
 */
export const validateOrCreateClassType = async (classTypeId, autoAdd = false) => {
  let classType = await ClassType.findOne({ classTypeId, active: true });

  if (!classType && autoAdd) {
    classType = await ClassType.create({
      classTypeId,
      name: `Class Type ${classTypeId}`,
      description: 'Auto-added from registration',
      active: true,
      metadata: {
        autoAdded: true
      }
    });
    return { valid: true, classType, autoAdded: true };
  }

  if (!classType) {
    return {
      valid: false,
      error: `Invalid class type ID: ${classTypeId}`
    };
  }

  return { valid: true, classType, autoAdded: false };
};

/**
 * Check if student exists and is active, or auto-add if enabled
 * @param {string} studentId - Student ID to validate
 * @param {boolean} autoAdd - Whether to auto-add if not found
 * @returns {Promise<Object>} - Validation result
 */
export const validateOrCreateStudent = async (studentId, autoAdd = false) => {
  let student = await Student.findOne({ studentId, active: true });

  if (!student && autoAdd) {
    // Auto-add student
    const { name, email } = generateRandomNameAndEmail();
    student = await Student.create({
      studentId,
      name,
      email,
      active: true,
      metadata: {
        autoAdded: true
      }
    });

    return { valid: true, student, autoAdded: true };
  }

  if (!student) {
    return {
      valid: false,
      error: `Invalid student ID: ${studentId}`
    };
  }

  return { valid: true, student, autoAdded: false };
};

/**
 * Check for schedule conflicts (overlapping classes)
 * @param {Object} classData - Class data to check
 * @param {string} excludeRegistrationId - Registration ID to exclude from check (for updates)
 * @returns {Promise<Object>} - Validation result
 */
export const checkScheduleConflicts = async (classData, excludeRegistrationId = null) => {
  const { instructorId, studentId, startTime, endTime, date } = classData;

  const { dayStart, dayEnd } = getDayBoundaries(date || startTime);

  // Build query to find potential conflicts
  const query = {
    'schedule.date': { $gte: dayStart, $lte: dayEnd },
    status: 'scheduled',
    $or: [
      { instructorId },
      { studentIds: studentId }
    ]
  };

  // Exclude current class if updating
  if (excludeRegistrationId) {
    query.registrationId = { $ne: excludeRegistrationId };
  }

  const potentialConflicts = await ScheduledClass.find(query);

  // Check each potential conflict for actual time overlap
  const conflicts = [];

  for (const existingClass of potentialConflicts) {
    const overlaps = hasTimeOverlap(
      startTime,
      endTime,
      existingClass.schedule.startTime,
      existingClass.schedule.endTime
    );

    if (overlaps) {
      const conflictType = existingClass.instructorId === instructorId
        ? 'instructor'
        : 'student';

      conflicts.push({
        type: conflictType,
        registrationId: existingClass.registrationId,
        startTime: existingClass.schedule.startTime,
        endTime: existingClass.schedule.endTime,
        message: `${conflictType === 'instructor' ? 'Instructor' : 'Student'} has conflicting class at ${existingClass.schedule.startTime.toLocaleString()}`
      });
    }
  }

  if (conflicts.length > 0) {
    return {
      valid: false,
      conflicts,
      error: `Schedule conflict: ${conflicts[0].message}`
    };
  }

  return { valid: true, conflicts: [] };
};

/**
 * Check instructor daily class limit
 * @param {string} instructorId - Instructor ID
 * @param {Date} date - Date to check
 * @param {number} maxClasses - Maximum allowed classes
 * @param {string} excludeRegistrationId - Registration ID to exclude (for updates)
 * @returns {Promise<Object>} - Validation result
 */
export const checkInstructorDailyLimit = async (instructorId, date, maxClasses, excludeRegistrationId = null) => {
  const { dayStart, dayEnd } = getDayBoundaries(date);

  const query = {
    instructorId,
    'schedule.date': { $gte: dayStart, $lte: dayEnd },
    status: 'scheduled'
  };

  if (excludeRegistrationId) {
    query.registrationId = { $ne: excludeRegistrationId };
  }

  const count = await ScheduledClass.countDocuments(query);

  if (count >= maxClasses) {
    return {
      valid: false,
      error: `Instructor ${instructorId} has reached daily limit of ${maxClasses} classes`
    };
  }

  return { valid: true, currentCount: count, maxClasses };
};

/**
 * Check student daily class limit
 * @param {string} studentId - Student ID
 * @param {Date} date - Date to check
 * @param {number} maxClasses - Maximum allowed classes
 * @param {string} excludeRegistrationId - Registration ID to exclude (for updates)
 * @returns {Promise<Object>} - Validation result
 */
export const checkStudentDailyLimit = async (studentId, date, maxClasses, excludeRegistrationId = null) => {
  const { dayStart, dayEnd } = getDayBoundaries(date);

  const query = {
    studentIds: studentId,
    'schedule.date': { $gte: dayStart, $lte: dayEnd },
    status: 'scheduled'
  };

  if (excludeRegistrationId) {
    query.registrationId = { $ne: excludeRegistrationId };
  }

  const count = await ScheduledClass.countDocuments(query);

  if (count >= maxClasses) {
    return {
      valid: false,
      error: `Student ${studentId} has reached daily limit of ${maxClasses} classes`
    };
  }

  return { valid: true, currentCount: count, maxClasses };
};

/**
 * Check class type daily limit
 * @param {string} classTypeId - Class type ID
 * @param {Date} date - Date to check
 * @param {number} maxClasses - Maximum allowed classes
 * @param {string} excludeRegistrationId - Registration ID to exclude (for updates)
 * @returns {Promise<Object>} - Validation result
 */
export const checkClassTypeDailyLimit = async (classTypeId, date, maxClasses, excludeRegistrationId = null) => {
  const { dayStart, dayEnd } = getDayBoundaries(date);

  const query = {
    classTypeId,
    'schedule.date': { $gte: dayStart, $lte: dayEnd },
    status: 'scheduled'
  };

  if (excludeRegistrationId) {
    query.registrationId = { $ne: excludeRegistrationId };
  }

  const count = await ScheduledClass.countDocuments(query);

  if (count >= maxClasses) {
    return {
      valid: false,
      error: `Class type ${classTypeId} has reached daily limit of ${maxClasses} classes`
    };
  }

  return { valid: true, currentCount: count, maxClasses };
};

/**
 * Comprehensive validation for scheduling a class
 * @param {Object} classData - Class data to validate
 * @param {string} excludeRegistrationId - Registration ID to exclude (for updates)
 * @returns {Promise<Object>} - Validation result
 */
export const validateScheduledClass = async (classData, excludeRegistrationId = null) => {
  const { instructorId, studentId, classTypeId, startTime, endTime, date } = classData;

  // Load configuration
  const config = await getConfigurationCache();

  const errors = [];

  // 1. Validate or create instructor
  const instructorValidation = await validateOrCreateInstructor(
    instructorId,
    config.enable_instructor_auto_add
  );
  if (!instructorValidation.valid) {
    errors.push(instructorValidation.error);
  }

  // 2. Validate or create class type
  const classTypeValidation = await validateOrCreateClassType(
    classTypeId,
    config.enable_class_type_auto_add
  );
  if (!classTypeValidation.valid) {
    errors.push(classTypeValidation.error);
  }

  // 3. Validate or create student
  const studentValidation = await validateOrCreateStudent(
    studentId,
    config.enable_student_auto_add
  );
  if (!studentValidation.valid) {
    errors.push(studentValidation.error);
  }

  // If basic validations failed, return early
  if (errors.length > 0) {
    return {
      valid: false,
      errors,
      error: errors[0]
    };
  }

  // 4. Check schedule conflicts
  const conflictCheck = await checkScheduleConflicts(
    { instructorId, studentId, startTime, endTime, date },
    excludeRegistrationId
  );
  if (!conflictCheck.valid) {
    errors.push(conflictCheck.error);
  }

  // 5. Check instructor daily limit
  const instructorLimitCheck = await checkInstructorDailyLimit(
    instructorId,
    date || startTime,
    config.instructor_max_classes_per_day,
    excludeRegistrationId
  );
  if (!instructorLimitCheck.valid) {
    errors.push(instructorLimitCheck.error);
  }

  // 6. Check student daily limit
  const studentLimitCheck = await checkStudentDailyLimit(
    studentId,
    date || startTime,
    config.student_max_classes_per_day,
    excludeRegistrationId
  );
  if (!studentLimitCheck.valid) {
    errors.push(studentLimitCheck.error);
  }

  // 7. Check class type daily limit
  const classTypeLimitCheck = await checkClassTypeDailyLimit(
    classTypeId,
    date || startTime,
    config.max_classes_per_type_per_day,
    excludeRegistrationId
  );
  if (!classTypeLimitCheck.valid) {
    errors.push(classTypeLimitCheck.error);
  }

  // Return result
  if (errors.length > 0) {
    return {
      valid: false,
      errors,
      error: errors[0]
    };
  }

  return {
    valid: true,
    studentAutoAdded: studentValidation.autoAdded,
    instructorAutoAdded: instructorValidation.autoAdded,
    classTypeAutoAdded: classTypeValidation.autoAdded
  };
};
