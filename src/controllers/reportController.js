import {
  getClassesPerDay,
  getFilteredClasses,
  getDashboardStatistics,
  getInstructorReport
} from '../services/analyticsService.js';
import { ValidationError } from '../middleware/errorHandler.js';

/**
 * Get classes per day for line graph
 */
export const classesPerDay = async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query;

    if (!startDate || !endDate) {
      throw new ValidationError('startDate and endDate are required');
    }

    const start = new Date(startDate);
    const end = new Date(endDate);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      throw new ValidationError('Invalid date format');
    }

    if (start > end) {
      throw new ValidationError('startDate must be before endDate');
    }

    const data = await getClassesPerDay(start, end);

    res.json({
      success: true,
      data,
      dateRange: { startDate, endDate }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get filtered classes report
 */
export const filteredClasses = async (req, res, next) => {
  try {
    const filters = {
      startDate: req.query.startDate,
      endDate: req.query.endDate,
      instructorId: req.query.instructorId,
      studentId: req.query.studentId,
      classTypeId: req.query.classTypeId,
      status: req.query.status || 'scheduled',
      page: parseInt(req.query.page) || 1,
      limit: parseInt(req.query.limit) || 50
    };

    const result = await getFilteredClasses(filters);

    res.json({
      success: true,
      data: result.classes,
      pagination: {
        total: result.total,
        page: result.page,
        pages: result.pages
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get dashboard statistics
 */
export const statistics = async (req, res, next) => {
  try {
    const stats = await getDashboardStatistics();

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get instructor report
 */
export const instructorReport = async (req, res, next) => {
  try {
    const { instructorId } = req.params;
    const { startDate, endDate } = req.query;

    if (!instructorId) {
      throw new ValidationError('instructorId is required');
    }

    const report = await getInstructorReport(instructorId, startDate, endDate);

    if (!report) {
      return res.status(404).json({
        success: false,
        error: {
          message: `Instructor with ID ${instructorId} not found`
        }
      });
    }

    res.json({
      success: true,
      data: report
    });
  } catch (error) {
    next(error);
  }
};
