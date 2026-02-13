import dotenv from 'dotenv';

dotenv.config();

const config = {
  port: process.env.PORT || 5000,
  nodeEnv: process.env.NODE_ENV || 'development',
  mongodbUri: process.env.MONGODB_URI || 'mongodb://localhost:27017/class-scheduler',
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:5173',
  maxFileSize: parseInt(process.env.MAX_FILE_SIZE || '10485760', 10), // 10MB
  uploadDir: process.env.UPLOAD_DIR || './uploads',
  logLevel: process.env.LOG_LEVEL || 'info'
};

export default config;
