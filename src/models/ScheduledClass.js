import mongoose from 'mongoose';

const scheduledClassSchema = new mongoose.Schema({
  registrationId: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  classTypeId: {
    type: String,
    required: true,
    trim: true
  },
  instructorId: {
    type: String,
    required: true,
    trim: true
  },
  studentIds: [{
    type: String,
    trim: true
  }],
  schedule: {
    date: {
      type: Date,
      required: true
    },
    startTime: {
      type: Date,
      required: true
    },
    durationMinutes: {
      type: Number,
      required: true
    },
    endTime: {
      type: Date,
      required: true
    }
  },
  status: {
    type: String,
    enum: ['scheduled', 'completed', 'cancelled'],
    default: 'scheduled'
  },
  metadata: {
    createdAt: {
      type: Date,
      default: Date.now
    },
    updatedAt: {
      type: Date,
      default: Date.now
    },
    createdBy: {
      type: String,
      default: 'manual'
    },
    csvBatchId: {
      type: String,
      default: null
    }
  }
});

// Critical Indexes for performance
scheduledClassSchema.index({ registrationId: 1 }, { unique: true });
scheduledClassSchema.index({ 'schedule.date': 1, instructorId: 1 });
scheduledClassSchema.index({ 'schedule.date': 1, studentIds: 1 });
scheduledClassSchema.index({ 'schedule.startTime': 1, 'schedule.endTime': 1 });
scheduledClassSchema.index({ classTypeId: 1, 'schedule.date': 1 });
scheduledClassSchema.index({ status: 1 });
// Compound index for common queries
scheduledClassSchema.index({ 'schedule.date': 1, status: 1, instructorId: 1 });

// Update timestamp on save
scheduledClassSchema.pre('save', function(next) {
  this.metadata.updatedAt = new Date();
  next();
});

const ScheduledClass = mongoose.model('ScheduledClass', scheduledClassSchema);

export default ScheduledClass;
