const mongoose = require('mongoose');

const versionSchema = new mongoose.Schema({
  content: {
    type: String,
    required: true
  },
  commitMessage: {
    type: String,
    required: true
  },
  creator: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
});

const collaboratorSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  role: {
    type: String,
    enum: ['viewer', 'editor'],
    default: 'viewer'
  },
  addedAt: {
    type: Date,
    default: Date.now
  },
  addedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
});

const codeSnippetSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
    minlength: 1,
    maxlength: 100
  },
  content: {
    type: String,
    required: true,
    maxlength: 50000 // 50KB max
  },
  language: {
    type: String,
    required: true,
    enum: [
      'javascript',
      'python',
      'java',
      'cpp',
      'ruby',
      'go',
      'rust',
      'php',
      'csharp',
      'typescript',
      'html',
      'css',
      'sql'
    ]
  },
  creator: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  visibility: {
    type: String,
    enum: ['private', 'public', 'unlisted'],
    default: 'private'
  },
  collaborators: [collaboratorSchema],
  versions: [versionSchema],
  tags: [{
    type: String,
    trim: true,
    maxlength: 30
  }],
  description: {
    type: String,
    trim: true,
    maxlength: 500
  },
  version: {
    type: Number,
    default: 1
  },
  executionConfig: {
    timeout: {
      type: Number,
      default: 5000, // 5 seconds
      max: 30000 // 30 seconds
    },
    memory: {
      type: Number,
      default: 128 * 1024 * 1024, // 128MB
      max: 512 * 1024 * 1024 // 512MB
    }
  },
  stats: {
    views: {
      type: Number,
      default: 0
    },
    executions: {
      type: Number,
      default: 0
    },
    forks: {
      type: Number,
      default: 0
    }
  },
  forkedFrom: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'CodeSnippet'
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes
codeSnippetSchema.index({ title: 'text', description: 'text', tags: 'text' });
codeSnippetSchema.index({ creator: 1, 'collaborators.user': 1 });
codeSnippetSchema.index({ visibility: 1, updatedAt: -1 });

// Virtual for checking user permissions
codeSnippetSchema.virtual('permissions').get(function() {
  return {
    canEdit: (userId) => {
      if (this.creator.toString() === userId.toString()) return true;
      const collaborator = this.collaborators.find(c => 
        c.user.toString() === userId.toString()
      );
      return collaborator?.role === 'editor';
    },
    canView: (userId) => {
      if (this.visibility === 'public') return true;
      if (this.creator.toString() === userId.toString()) return true;
      return this.collaborators.some(c => 
        c.user.toString() === userId.toString()
      );
    }
  };
});

// Methods
codeSnippetSchema.methods.addCollaborator = async function(userId, role, addedBy) {
  if (this.collaborators.some(c => c.user.toString() === userId.toString())) {
    throw new Error('User is already a collaborator');
  }

  this.collaborators.push({
    user: userId,
    role,
    addedBy
  });

  await this.save();
  return this;
};

codeSnippetSchema.methods.removeCollaborator = async function(userId) {
  this.collaborators = this.collaborators.filter(
    c => c.user.toString() !== userId.toString()
  );
  
  await this.save();
  return this;
};

codeSnippetSchema.methods.addVersion = async function(content, commitMessage, creator) {
  this.versions.push({
    content,
    commitMessage,
    creator
  });

  await this.save();
  return this;
};

codeSnippetSchema.methods.restoreVersion = async function(versionId) {
  const version = this.versions.id(versionId);
  if (!version) {
    throw new Error('Version not found');
  }

  this.content = version.content;
  this.version += 1;
  
  await this.save();
  return this;
};

codeSnippetSchema.methods.fork = async function(userId) {
  const fork = new this.constructor({
    title: `${this.title} (Fork)`,
    content: this.content,
    language: this.language,
    creator: userId,
    visibility: 'private',
    description: this.description,
    tags: this.tags,
    forkedFrom: this._id,
    executionConfig: this.executionConfig
  });

  await fork.save();
  this.stats.forks += 1;
  await this.save();

  return fork;
};

// Ensure version increments on content changes
codeSnippetSchema.pre('save', function(next) {
  if (this.isModified('content')) {
    this.version += 1;
  }
  next();
});

module.exports = mongoose.model('CodeSnippet', codeSnippetSchema);
