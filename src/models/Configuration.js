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

const Configuration = mongoose.model('Configuration', configurationSchema);

export default Configuration;
