import Student from '../models/Student.js';
import Instructor from '../models/Instructor.js';
import ClassType from '../models/ClassType.js';
import { ValidationError, NotFoundError } from '../middleware/errorHandler.js';

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

export const createStudent = async (req, res, next) => {
  try {
    const { studentId, name, email } = req.body;

    if (!studentId || !name) {
      throw new ValidationError('studentId and name are required');
    }

    const existing = await Student.findOne({ studentId });
    if (existing) {
      throw new ValidationError(`Student with ID ${studentId} already exists`);
    }

    const student = await Student.create({
      studentId,
      name,
      email,
      active: true
    });

    res.status(201).json({
      success: true,
      data: student
    });
  } catch (error) {
    next(error);
  }
};

export const updateStudent = async (req, res, next) => {
  try {
    const { studentId } = req.params;
    const { name, email } = req.body;

    const student = await Student.findOne({ studentId });
    if (!student) {
      throw new NotFoundError(`Student with ID ${studentId} not found`);
    }

    if (name) student.name = name;
    if (email !== undefined) student.email = email;

    await student.save();

    res.json({
      success: true,
      data: student
    });
  } catch (error) {
    next(error);
  }
};

export const deleteStudent = async (req, res, next) => {
  try {
    const { studentId } = req.params;

    const student = await Student.findOne({ studentId });
    if (!student) {
      throw new NotFoundError(`Student with ID ${studentId} not found`);
    }

    student.active = false;
    await student.save();

    res.json({
      success: true,
      message: `Student ${studentId} has been deactivated`
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

export const createInstructor = async (req, res, next) => {
  try {
    const { instructorId, name, email } = req.body;

    if (!instructorId || !name) {
      throw new ValidationError('instructorId and name are required');
    }

    const existing = await Instructor.findOne({ instructorId });
    if (existing) {
      throw new ValidationError(`Instructor with ID ${instructorId} already exists`);
    }

    const instructor = await Instructor.create({
      instructorId,
      name,
      email,
      active: true
    });

    res.status(201).json({
      success: true,
      data: instructor
    });
  } catch (error) {
    next(error);
  }
};

export const updateInstructor = async (req, res, next) => {
  try {
    const { instructorId } = req.params;
    const { name, email } = req.body;

    const instructor = await Instructor.findOne({ instructorId });
    if (!instructor) {
      throw new NotFoundError(`Instructor with ID ${instructorId} not found`);
    }

    if (name) instructor.name = name;
    if (email !== undefined) instructor.email = email;

    await instructor.save();

    res.json({
      success: true,
      data: instructor
    });
  } catch (error) {
    next(error);
  }
};

export const deleteInstructor = async (req, res, next) => {
  try {
    const { instructorId } = req.params;

    const instructor = await Instructor.findOne({ instructorId });
    if (!instructor) {
      throw new NotFoundError(`Instructor with ID ${instructorId} not found`);
    }

    instructor.active = false;
    await instructor.save();

    res.json({
      success: true,
      message: `Instructor ${instructorId} has been deactivated`
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

export const createClassType = async (req, res, next) => {
  try {
    const { classTypeId, name, description } = req.body;

    if (!classTypeId || !name) {
      throw new ValidationError('classTypeId and name are required');
    }

    const existing = await ClassType.findOne({ classTypeId });
    if (existing) {
      throw new ValidationError(`Class type with ID ${classTypeId} already exists`);
    }

    const classType = await ClassType.create({
      classTypeId,
      name,
      description,
      active: true
    });

    res.status(201).json({
      success: true,
      data: classType
    });
  } catch (error) {
    next(error);
  }
};

export const updateClassType = async (req, res, next) => {
  try {
    const { classTypeId } = req.params;
    const { name, description } = req.body;

    const classType = await ClassType.findOne({ classTypeId });
    if (!classType) {
      throw new NotFoundError(`Class type with ID ${classTypeId} not found`);
    }

    if (name) classType.name = name;
    if (description !== undefined) classType.description = description;

    await classType.save();

    res.json({
      success: true,
      data: classType
    });
  } catch (error) {
    next(error);
  }
};

export const deleteClassType = async (req, res, next) => {
  try {
    const { classTypeId } = req.params;

    const classType = await ClassType.findOne({ classTypeId });
    if (!classType) {
      throw new NotFoundError(`Class type with ID ${classTypeId} not found`);
    }

    classType.active = false;
    await classType.save();

    res.json({
      success: true,
      message: `Class type ${classTypeId} has been deactivated`
    });
  } catch (error) {
    next(error);
  }
};
