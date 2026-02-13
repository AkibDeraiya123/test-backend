import mongoose from 'mongoose';

const studentSchema = new mongoose.Schema({
  studentId: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  name: {
    type: String,
    trim: true,
    default: ''
  },
  email: {
    type: String,
    trim: true,
    lowercase: true,
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
    },
    autoAdded: {
      type: Boolean,
      default: false
    }
  }
});

// Indexes
studentSchema.index({ studentId: 1 }, { unique: true });
studentSchema.index({ active: 1 });

// Update timestamp on save
studentSchema.pre('save', function(next) {
  this.metadata.updatedAt = new Date();
  next();
});

const Student = mongoose.model('Student', studentSchema);

export default Student;
