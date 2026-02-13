import mongoose from 'mongoose';
import Configuration from '../models/Configuration.js';
import Instructor from '../models/Instructor.js';
import ClassType from '../models/ClassType.js';
import Student from '../models/Student.js';
import { classTypeSeedData, configurationSeedData, instructorSeedData, studentSeedData } from '../utils/seedData.js';

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

    // Load configuration from seed data
    if (existingConfigurationsCount === 0) {
      await Configuration.insertMany(configurationSeedData);
      console.log('✓ Default configurations initialized');
    }

    // Load instructor from seed data
    const existingInstructorsCount = await Instructor.countDocuments();
    if (existingInstructorsCount === 0) {
      await Instructor.insertMany(instructorSeedData);
      console.log('✓ Default instructors initialized');
    }

    // Load classType from seeed data
    const existingClassTypesCount = await ClassType.countDocuments();
    if (existingClassTypesCount === 0) {
      await ClassType.insertMany(classTypeSeedData);
      console.log('✓ Default class types initialized');
    }

    // Load student from seed data
    const existingStudentsCount = await Student.countDocuments();
    if (existingStudentsCount === 0) {
      await Student.insertMany(studentSeedData);
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
