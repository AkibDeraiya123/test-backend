import mongoose from 'mongoose';

const configurationSchema = new mongoose.Schema({
  key: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  value: {
    type: mongoose.Schema.Types.Mixed,
    required: true
  },
  dataType: {
    type: String,
    enum: ['number', 'string', 'boolean'],
    required: true
  },
  description: {
    type: String,
    default: ''
  },
  category: {
    type: String,
    enum: ['limits', 'features', 'system'],
    default: 'system'
  },
  metadata: {
    updatedAt: {
      type: Date,
      default: Date.now
    },
    updatedBy: {
      type: String,
      default: 'system'
    }
  }
});

// Index
configurationSchema.index({ key: 1 }, { unique: true });

// Update timestamp on save
configurationSchema.pre('save', function(next) {
  this.metadata.updatedAt = new Date();
  next();
});

// Static method to get default configurations
configurationSchema.statics.getDefaults = function() {
  return [
    {
      key: 'student_max_classes_per_day',
      value: 3,
      dataType: 'number',
      description: 'Maximum number of classes a student can schedule per day',
      category: 'limits'
    },
    {
      key: 'instructor_max_classes_per_day',
      value: 5,
      dataType: 'number',
      description: 'Maximum number of classes an instructor can teach per day',
      category: 'limits'
    },
    {
      key: 'class_duration_minutes',
      value: 60,
      dataType: 'number',
      description: 'Default duration of a class in minutes',
      category: 'system'
    },
    {
      key: 'max_classes_per_type_per_day',
      value: 10,
      dataType: 'number',
      description: 'Maximum number of classes of a specific type that can be scheduled per day',
      category: 'limits'
    },
    {
      key: 'enable_student_auto_add',
      value: true,
      dataType: 'boolean',
      description: 'Automatically add new student IDs found in CSV uploads',
      category: 'features'
    }
  ];
};

const Configuration = mongoose.model('Configuration', configurationSchema);

export default Configuration;
