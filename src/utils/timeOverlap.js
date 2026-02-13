import { startOfDay, endOfDay, addMinutes, parseISO } from 'date-fns';

/**
 * Check if two time ranges overlap
 * @param {Date} start1 - Start time of first range
 * @param {Date} end1 - End time of first range
 * @param {Date} start2 - Start time of second range
 * @param {Date} end2 - End time of second range
 * @returns {boolean} - True if ranges overlap
 */
export const hasTimeOverlap = (start1, end1, start2, end2) => {
  // Two ranges overlap if: start1 < end2 AND start2 < end1
  return start1 < end2 && start2 < end1;
};

/**
 * Calculate end time based on start time and duration
 * @param {Date} startTime - Start time
 * @param {number} durationMinutes - Duration in minutes
 * @returns {Date} - End time
 */
export const calculateEndTime = (startTime, durationMinutes) => {
  return addMinutes(startTime, durationMinutes);
};

/**
 * Get start and end of day for a given date
 * @param {Date} date - Date to get boundaries for
 * @returns {Object} - { dayStart, dayEnd }
 */
export const getDayBoundaries = (date) => {
  return {
    dayStart: startOfDay(date),
    dayEnd: endOfDay(date)
  };
};

/**
 * Parse date-time string in MM/DD/YYYY HH:MM format
 * @param {string} dateTimeStr - Date-time string
 * @returns {Date} - Parsed date
 */
export const parseDateTime = (dateTimeStr) => {
  // Expected format: MM/DD/YYYY HH:MM or YYYY-MM-DD HH:MM
  if (!dateTimeStr) {
    throw new Error('Date-time string is required');
  }

  // Handle MM/DD/YYYY HH:MM format
  if (dateTimeStr.includes('/')) {
    const [datePart, timePart] = dateTimeStr.split(' ');
    const [month, day, year] = datePart.split('/');
    const [hours, minutes] = timePart.split(':');

    const date = new Date(year, month - 1, day, hours, minutes);

    if (isNaN(date.getTime())) {
      throw new Error(`Invalid date-time format: ${dateTimeStr}`);
    }

    return date;
  }

  // Handle ISO format (YYYY-MM-DD HH:MM)
  const isoStr = dateTimeStr.replace(' ', 'T');
  const date = parseISO(isoStr);

  if (isNaN(date.getTime())) {
    throw new Error(`Invalid date-time format: ${dateTimeStr}`);
  }

  return date;
};

/**
 * Validate that a date is not in the past
 * @param {Date} date - Date to validate
 * @returns {boolean} - True if date is valid (today or future)
 */
export const isValidFutureDate = (date) => {
  const now = new Date();
  const today = startOfDay(now);
  const checkDate = startOfDay(date);

  return checkDate >= today;
};

/**
 * Format date for display
 * @param {Date} date - Date to format
 * @returns {string} - Formatted date string
 */
export const formatDateTime = (date) => {
  return date.toLocaleString('en-US', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  });
};
