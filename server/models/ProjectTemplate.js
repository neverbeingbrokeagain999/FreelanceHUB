import mongoose from 'mongoose';

const projectTemplateSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true
  },
  category: {
    type: String,
    required: true
  },
  skills: [{
    type: String,
    required: true
  }],
  budget: {
    type: Number
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

export default mongoose.model('ProjectTemplate', projectTemplateSchema);
