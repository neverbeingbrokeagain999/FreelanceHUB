import mongoose from 'mongoose';

const whiteboardSchema = new mongoose.Schema({
  meetingId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Meeting',
    required: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  creator: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  elements: [{
    type: {
      type: String,
      enum: ['path', 'line', 'rectangle', 'circle', 'text', 'image'],
      required: true
    },
    points: [{
      x: Number,
      y: Number
    }],
    properties: {
      strokeColor: String,
      strokeWidth: Number,
      fillColor: String,
      text: String,
      fontSize: Number,
      fontFamily: String,
      imageUrl: String
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    timestamp: {
      type: Date,
      default: Date.now
    }
  }],
  snapshots: [{
    imageUrl: String,
    createdAt: {
      type: Date,
      default: Date.now
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  }],
  settings: {
    defaultStrokeColor: {
      type: String,
      default: '#000000'
    },
    defaultStrokeWidth: {
      type: Number,
      default: 2
    },
    defaultFillColor: {
      type: String,
      default: 'transparent'
    },
    backgroundColor: {
      type: String,
      default: '#ffffff'
    },
    width: {
      type: Number,
      default: 1920
    },
    height: {
      type: Number,
      default: 1080
    },
    allowedTools: [{
      type: String,
      enum: ['pen', 'line', 'rectangle', 'circle', 'text', 'eraser', 'image']
    }]
  },
  collaborators: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    permissions: {
      type: String,
      enum: ['view', 'edit', 'admin'],
      default: 'edit'
    },
    joinedAt: {
      type: Date,
      default: Date.now
    }
  }],
  status: {
    type: String,
    enum: ['active', 'archived'],
    default: 'active'
  },
  lastModified: {
    type: Date,
    default: Date.now
  },
  lastModifiedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

// Indexes
whiteboardSchema.index({ meetingId: 1 });
whiteboardSchema.index({ creator: 1 });
whiteboardSchema.index({ 'collaborators.user': 1 });
whiteboardSchema.index({ status: 1 });

// Methods
whiteboardSchema.methods.canUserAccess = function(userId) {
  if (this.creator.toString() === userId.toString()) return true;
  
  const collaborator = this.collaborators.find(
    c => c.user.toString() === userId.toString()
  );
  return !!collaborator;
};

whiteboardSchema.methods.canUserEdit = function(userId) {
  if (this.creator.toString() === userId.toString()) return true;
  
  const collaborator = this.collaborators.find(
    c => c.user.toString() === userId.toString()
  );
  return collaborator && ['edit', 'admin'].includes(collaborator.permissions);
};

whiteboardSchema.methods.addElement = function(element, userId) {
  if (!this.canUserEdit(userId)) {
    throw new Error('User does not have permission to edit');
  }
  
  this.elements.push({
    ...element,
    createdBy: userId,
    timestamp: new Date()
  });
  
  this.lastModified = new Date();
  this.lastModifiedBy = userId;
  
  return this.save();
};

whiteboardSchema.methods.updateElement = function(elementId, updates, userId) {
  if (!this.canUserEdit(userId)) {
    throw new Error('User does not have permission to edit');
  }
  
  const element = this.elements.id(elementId);
  if (!element) {
    throw new Error('Element not found');
  }
  
  Object.assign(element, updates);
  this.lastModified = new Date();
  this.lastModifiedBy = userId;
  
  return this.save();
};

whiteboardSchema.methods.removeElement = function(elementId, userId) {
  if (!this.canUserEdit(userId)) {
    throw new Error('User does not have permission to edit');
  }
  
  this.elements = this.elements.filter(e => e._id.toString() !== elementId.toString());
  this.lastModified = new Date();
  this.lastModifiedBy = userId;
  
  return this.save();
};

whiteboardSchema.methods.createSnapshot = async function(imageUrl, userId) {
  if (!this.canUserEdit(userId)) {
    throw new Error('User does not have permission to create snapshot');
  }
  
  this.snapshots.push({
    imageUrl,
    createdBy: userId
  });
  
  return this.save();
};

// Update lastModified on any change to elements
whiteboardSchema.pre('save', function(next) {
  if (this.isModified('elements')) {
    this.lastModified = new Date();
  }
  next();
});

const Whiteboard = mongoose.model('Whiteboard', whiteboardSchema);

export default Whiteboard;
