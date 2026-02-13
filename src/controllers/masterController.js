import Student from '../models/Student.js';
import Instructor from '../models/Instructor.js';
import ClassType from '../models/ClassType.js';

// ========== STUDENTS ==========

export const getStudents = async (req, res, next) => {
  try {
    const { page = 1, limit = 50, search = '' } = req.query;
    const query = { active: true };

    if (search) {
      query.$or = [
        { studentId: { $regex: search, $options: 'i' } },
        { name: { $regex: search, $options: 'i' } }
      ];
    }

    const students = await Student.find(query)
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ 'metadata.createdAt': -1 });

    const total = await Student.countDocuments(query);

    res.json({
      success: true,
      data: students,
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

// ========== INSTRUCTORS ==========

export const getInstructors = async (req, res, next) => {
  try {
    const { page = 1, limit = 50, search = '' } = req.query;
    const query = { active: true };

    if (search) {
      query.$or = [
        { instructorId: { $regex: search, $options: 'i' } },
        { name: { $regex: search, $options: 'i' } }
      ];
    }

    const instructors = await Instructor.find(query)
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ 'metadata.createdAt': -1 });

    const total = await Instructor.countDocuments(query);

    res.json({
      success: true,
      data: instructors,
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

// ========== CLASS TYPES ==========

export const getClassTypes = async (req, res, next) => {
  try {
    const { page = 1, limit = 50, search = '' } = req.query;
    const query = { active: true };

    if (search) {
      query.$or = [
        { classTypeId: { $regex: search, $options: 'i' } },
        { name: { $regex: search, $options: 'i' } }
      ];
    }

    const classTypes = await ClassType.find(query)
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ 'metadata.createdAt': -1 });

    const total = await ClassType.countDocuments(query);

    res.json({
      success: true,
      data: classTypes,
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

