import mongoose from 'mongoose';

const versionSchema = new mongoose.Schema({
  content: {
    type: String,
    required: true
  },
  delta: {
    type: Object, // Stores operational transforms for collaborative editing
    required: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  message: {
    type: String,
    trim: true
  }
});

const commentSchema = new mongoose.Schema({
  content: {
    type: String,
    required: true,
    trim: true
  },
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  position: {
    startOffset: Number,
    endOffset: Number,
    version: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Document.versions'
    }
  },
  resolved: {
    type: Boolean,
    default: false
  },
  resolvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  resolvedAt: Date,
  replies: [{
    content: {
      type: String,
      required: true,
      trim: true
    },
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }]
});

const documentSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  content: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ['text', 'markdown', 'rich-text'],
    default: 'rich-text'
  },
  creator: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  meeting: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Meeting'
  },
  project: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project'
  },
  versions: [versionSchema],
  comments: [commentSchema],
  collaborators: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    role: {
      type: String,
      enum: ['owner', 'editor', 'commenter', 'viewer'],
      default: 'viewer'
    },
    addedAt: {
      type: Date,
      default: Date.now
    },
    addedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  }],
  settings: {
    defaultMode: {
      type: String,
      enum: ['editing', 'viewing', 'suggesting'],
      default: 'editing'
    },
    allowComments: {
      type: Boolean,
      default: true
    },
    trackChanges: {
      type: Boolean,
      default: true
    },
    requireApproval: {
      type: Boolean,
      default: false
    }
  },
  tags: [{
    type: String,
    trim: true
  }],
  status: {
    type: String,
    enum: ['draft', 'in-review', 'published', 'archived'],
    default: 'draft'
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
documentSchema.index({ title: 'text' });
documentSchema.index({ meeting: 1 });
documentSchema.index({ project: 1 });
documentSchema.index({ creator: 1 });
documentSchema.index({ 'collaborators.user': 1 });
documentSchema.index({ status: 1 });
documentSchema.index({ tags: 1 });

// Methods
documentSchema.methods.canUserAccess = function(userId) {
  if (this.creator.toString() === userId.toString()) return true;
  
  const collaborator = this.collaborators.find(
    c => c.user.toString() === userId.toString()
  );
  return !!collaborator;
};

documentSchema.methods.canUserEdit = function(userId) {
  if (this.creator.toString() === userId.toString()) return true;
  
  const collaborator = this.collaborators.find(
    c => c.user.toString() === userId.toString()
  );
  return collaborator && ['owner', 'editor'].includes(collaborator.role);
};

documentSchema.methods.canUserComment = function(userId) {
  if (!this.settings.allowComments) return false;
  if (this.creator.toString() === userId.toString()) return true;
  
  const collaborator = this.collaborators.find(
    c => c.user.toString() === userId.toString()
  );
  return collaborator && ['owner', 'editor', 'commenter'].includes(collaborator.role);
};

documentSchema.methods.createVersion = async function(content, delta, userId, message = '') {
  if (!this.canUserEdit(userId)) {
    throw new Error('User does not have permission to create version');
  }

  this.versions.push({
    content,
    delta,
    createdBy: userId,
    message
  });

  this.content = content;
  this.lastModified = new Date();
  this.lastModifiedBy = userId;

  return this.save();
};

documentSchema.methods.addComment = async function(comment, userId) {
  if (!this.canUserComment(userId)) {
    throw new Error('User does not have permission to comment');
  }

  this.comments.push({
    ...comment,
    author: userId
  });

  return this.save();
};

// Pre-save hook to update lastModified
documentSchema.pre('save', function(next) {
  if (this.isModified('content')) {
    this.lastModified = new Date();
  }
  next();
});

const Document = mongoose.model('Document', documentSchema);

export default Document;
