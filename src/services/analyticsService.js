import ScheduledClass from '../models/ScheduledClass.js';
import Student from '../models/Student.js';
import Instructor from '../models/Instructor.js';
import ClassType from '../models/ClassType.js';
import { startOfDay, endOfDay, format } from 'date-fns';

/**
 * Get classes per day for a date range (for line graph)
 * @param {Date} startDate - Start date
 * @param {Date} endDate - End date
 * @returns {Promise<Array>} - Array of { date, count }
 */
export const getClassesPerDay = async (startDate, endDate) => {
  const start = startOfDay(startDate);
  const end = endOfDay(endDate);

  // Aggregate classes by date
  const results = await ScheduledClass.aggregate([
    {
      $match: {
        'schedule.date': { $gte: start, $lte: end },
        status: 'scheduled'
      }
    },
    {
      $group: {
        _id: {
          $dateToString: { format: '%Y-%m-%d', date: '$schedule.date' }
        },
        count: { $sum: 1 }
      }
    },
    {
      $sort: { _id: 1 }
    },
    {
      $project: {
        _id: 0,
        date: '$_id',
        count: 1
      }
    }
  ]);

  return results;
};

/**
 * Get filtered classes with advanced filters
 * @param {Object} filters - Filter criteria
 * @returns {Promise<Array>} - Filtered classes
 */
export const getFilteredClasses = async (filters) => {
  const {
    startDate,
    endDate,
    instructorId,
    studentId,
    classTypeId,
    status = 'scheduled',
    page = 1,
    limit = 50
  } = filters;

  const query = {};

  if (status) {
    query.status = status;
  }

  if (startDate || endDate) {
    query['schedule.date'] = {};
    if (startDate) {
      query['schedule.date'].$gte = startOfDay(new Date(startDate));
    }
    if (endDate) {
      query['schedule.date'].$lte = endOfDay(new Date(endDate));
    }
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

  // Populate with names for better display
  const enrichedClasses = await Promise.all(
    classes.map(async (cls) => {
      const instructor = await Instructor.findOne({ instructorId: cls.instructorId });
      const classType = await ClassType.findOne({ classTypeId: cls.classTypeId });
      const students = await Student.find({ studentId: { $in: cls.studentIds } });

      return {
        ...cls.toObject(),
        instructorName: instructor?.name || cls.instructorId,
        classTypeName: classType?.name || cls.classTypeId,
        studentNames: students.map(s => s.name || s.studentId)
      };
    })
  );

  return {
    classes: enrichedClasses,
    total,
    page: parseInt(page),
    pages: Math.ceil(total / limit)
  };
};

/**
 * Get dashboard statistics
 * @returns {Promise<Object>} - Dashboard statistics
 */
export const getDashboardStatistics = async () => {
  const today = new Date();
  const todayStart = startOfDay(today);
  const todayEnd = endOfDay(today);

  // Total counts
  const totalStudents = await Student.countDocuments({ active: true });
  const totalInstructors = await Instructor.countDocuments({ active: true });
  const totalClassTypes = await ClassType.countDocuments({ active: true });
  const totalScheduledClasses = await ScheduledClass.countDocuments({ status: 'scheduled' });

  // Today's classes
  const todayClasses = await ScheduledClass.countDocuments({
    'schedule.date': { $gte: todayStart, $lte: todayEnd },
    status: 'scheduled'
  });

  // Upcoming classes (next 7 days)
  const nextWeekEnd = new Date(today);
  nextWeekEnd.setDate(nextWeekEnd.getDate() + 7);

  const upcomingClasses = await ScheduledClass.countDocuments({
    'schedule.date': { $gte: todayStart, $lte: nextWeekEnd },
    status: 'scheduled'
  });

  // Most popular class type
  const popularClassTypes = await ScheduledClass.aggregate([
    {
      $match: { status: 'scheduled' }
    },
    {
      $group: {
        _id: '$classTypeId',
        count: { $sum: 1 }
      }
    },
    {
      $sort: { count: -1 }
    },
    {
      $limit: 5
    }
  ]);

  // Enrich with class type names
  const popularClassTypesWithNames = await Promise.all(
    popularClassTypes.map(async (item) => {
      const classType = await ClassType.findOne({ classTypeId: item._id });
      return {
        classTypeId: item._id,
        classTypeName: classType?.name || item._id,
        count: item.count
      };
    })
  );

  // Busiest instructors
  const busiestInstructors = await ScheduledClass.aggregate([
    {
      $match: { status: 'scheduled' }
    },
    {
      $group: {
        _id: '$instructorId',
        count: { $sum: 1 }
      }
    },
    {
      $sort: { count: -1 }
    },
    {
      $limit: 5
    }
  ]);

  // Enrich with instructor names
  const busiestInstructorsWithNames = await Promise.all(
    busiestInstructors.map(async (item) => {
      const instructor = await Instructor.findOne({ instructorId: item._id });
      return {
        instructorId: item._id,
        instructorName: instructor?.name || item._id,
        count: item.count
      };
    })
  );

  return {
    counts: {
      totalStudents,
      totalInstructors,
      totalClassTypes,
      totalScheduledClasses,
      todayClasses,
      upcomingClasses
    },
    popularClassTypes: popularClassTypesWithNames,
    busiestInstructors: busiestInstructorsWithNames
  };
};

/**
 * Get classes by instructor (for reports)
 * @param {string} instructorId - Instructor ID
 * @param {Date} startDate - Start date
 * @param {Date} endDate - End date
 * @returns {Promise<Object>} - Instructor report
 */
export const getInstructorReport = async (instructorId, startDate, endDate) => {
  const start = startDate ? startOfDay(new Date(startDate)) : new Date(0);
  const end = endDate ? endOfDay(new Date(endDate)) : new Date('2099-12-31');

  const instructor = await Instructor.findOne({ instructorId });

  if (!instructor) {
    return null;
  }

  const classes = await ScheduledClass.find({
    instructorId,
    'schedule.date': { $gte: start, $lte: end },
    status: 'scheduled'
  }).sort({ 'schedule.startTime': 1 });

  // Group by date
  const classesByDate = {};
  classes.forEach(cls => {
    const dateKey = format(cls.schedule.date, 'yyyy-MM-dd');
    if (!classesByDate[dateKey]) {
      classesByDate[dateKey] = [];
    }
    classesByDate[dateKey].push(cls);
  });

  return {
    instructor: {
      instructorId: instructor.instructorId,
      name: instructor.name,
      email: instructor.email
    },
    totalClasses: classes.length,
    classesByDate,
    dateRange: { startDate, endDate }
  };
};
