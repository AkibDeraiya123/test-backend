import mongoose from 'mongoose';

const classTypeSchema = new mongoose.Schema({
  classTypeId: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true,
    default: ''
  },
  active: {
    type: Boolean,
    default: true
  },
  metadata: {
    createdAt: {
      type: Date,
      default: Date.now
    },
    updatedAt: {
      type: Date,
      default: Date.now
    }
  }
});

// Indexes
classTypeSchema.index({ classTypeId: 1 }, { unique: true });
classTypeSchema.index({ active: 1 });

// Update timestamp on save
classTypeSchema.pre('save', function(next) {
  this.metadata.updatedAt = new Date();
  next();
});

const ClassType = mongoose.model('ClassType', classTypeSchema);

export default ClassType;
