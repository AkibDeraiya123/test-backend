import mongoose from 'mongoose';
import Configuration from '../models/Configuration.js';
import Instructor from '../models/Instructor.js';
import ClassType from '../models/ClassType.js';
import Student from '../models/Student.js';

const connectDatabase = async () => {
  try {
    const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/class-scheduler';

    await mongoose.connect(mongoURI);

    console.log('✓ MongoDB connected successfully');
    console.log(`✓ Database: ${mongoose.connection.name}`);

    // Initialize default configurations if they don't exist
    await initializeConfigurations();

  } catch (error) {
    console.error('✗ MongoDB connection error:', error.message);
    process.exit(1);
  }
};

const initializeConfigurations = async () => {
  try {
    const existingConfigurationsCount = await Configuration.countDocuments();

    if (existingConfigurationsCount === 0) {
      const defaultConfigurations = Configuration.getDefaults();
      await Configuration.insertMany(defaultConfigurations);
      console.log('✓ Default configurations initialized');
    }

    // I also want to add the default instructors and class types if they don't exist
    const existingInstructorsCount = await Instructor.countDocuments();
    if (existingInstructorsCount === 0) {
      // Generating 50 default instructors with random names and instructor IDs starting from 1 to 50
      const defaultInstructors = [];
      for (let i = 1; i <= 50; i++) {
        defaultInstructors.push({
          instructorId: `${i}`,
          name: `Instructor ${i}`,
          active: true
        });
      };

      await Instructor.insertMany(defaultInstructors);

      console.log('✓ Default instructors initialized');
    }

    const existingClassTypesCount = await ClassType.countDocuments();
    if (existingClassTypesCount === 0) {
      // Generating 50 default class types with random names and class type IDs starting from 1 to 50
      const defaultClassTypes = [];
      for (let i = 1; i <= 50; i++) {
        defaultClassTypes.push({
          classTypeId: `${i}`,
          name: `Class Type ${i}`,
          active: true
        });
      };

      await ClassType.insertMany(defaultClassTypes);
      console.log('✓ Default class types initialized');
    }

    // Add student IDs as well starting from 1 to 50
    const existingStudentsCount = await Student.countDocuments();
    if (existingStudentsCount === 0) {
      // Generating 50 default students with random names and student IDs starting from 1 to 50
      const defaultStudents = [];
      for (let i = 1; i <= 50; i++) {
        defaultStudents.push({
          studentId: `${i}`,
          name: `Student ${i}`,
          active: true
        });
      };
      await Student.insertMany(defaultStudents);
      console.log('✓ Default students initialized');
    }
  } catch (error) {
    console.error('✗ Error initializing configurations:', error.message);
  }
};

// Handle connection events
mongoose.connection.on('error', (error) => {
  console.error('MongoDB connection error:', error);
});

mongoose.connection.on('disconnected', () => {
  console.log('MongoDB disconnected');
});

// Graceful shutdown
process.on('SIGINT', async () => {
  await mongoose.connection.close();
  console.log('MongoDB connection closed through app termination');
  process.exit(0);
});

export default connectDatabase;
