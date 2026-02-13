import mongoose from 'mongoose';

const instructorSchema = new mongoose.Schema({
  instructorId: {
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
    }
  }
});

// Indexes
instructorSchema.index({ instructorId: 1 }, { unique: true });
instructorSchema.index({ active: 1 });

// Update timestamp on save
instructorSchema.pre('save', function(next) {
  this.metadata.updatedAt = new Date();
  next();
});

const Instructor = mongoose.model('Instructor', instructorSchema);

export default Instructor;
