const mongoose = require('mongoose');

const noteSchema = new mongoose.Schema({
  caseId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Case',
    required: true
  },
  content: {
    type: String,
    required: [true, 'Note content is required'],
    maxLength: [1000, 'Note content cannot be more than 1000 characters']
  },
  type: {
    type: String,
    required: [true, 'Note type is required'],
    enum: ['Case Note', 'Meeting Note', 'Strategy Note', 'Hearing Note', 'Client Communication', 'Internal Note']
  },
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  authorName: {
    type: String,
    required: true
  },
  tags: [{
    type: String,
    trim: true,
    lowercase: true
  }],
  priority: {
    type: String,
    enum: ['Low', 'Medium', 'High', 'Urgent'],
    default: 'Medium'
  },
  isPrivate: {
    type: Boolean,
    default: false
  },
  accessLevel: {
    type: String,
    enum: ['all', 'admin_only', 'author_only'],
    default: 'all'
  },
  relatedHearing: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Hearing'
  },
  followUpRequired: {
    type: Boolean,
    default: false
  },
  followUpDate: {
    type: Date
  },
  followUpCompleted: {
    type: Boolean,
    default: false
  },
  lastEditedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  lastEditedAt: {
    type: Date
  },
  editHistory: [{
    editedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    editedByName: String,
    editedAt: {
      type: Date,
      default: Date.now
    },
    previousContent: String,
    changeDescription: String
  }]
}, {
  timestamps: true
});

// Indexes
noteSchema.index({ caseId: 1 });
noteSchema.index({ author: 1 });
noteSchema.index({ type: 1 });
noteSchema.index({ priority: 1 });
noteSchema.index({ createdAt: -1 });
noteSchema.index({ followUpRequired: 1, followUpCompleted: 1 });
noteSchema.index({ tags: 1 });

// Virtual for formatted date and time
noteSchema.virtual('formattedDate').get(function() {
  return this.createdAt.toLocaleDateString();
});

noteSchema.virtual('formattedTime').get(function() {
  return this.createdAt.toLocaleTimeString('en-US', { 
    hour: '2-digit', 
    minute: '2-digit',
    hour12: true 
  });
});

// Virtual for note age
noteSchema.virtual('noteAge').get(function() {
  const now = new Date();
  const created = new Date(this.createdAt);
  const hoursDiff = Math.floor((now - created) / (1000 * 60 * 60));
  
  if (hoursDiff < 1) return 'Just now';
  if (hoursDiff < 24) return `${hoursDiff} hour${hoursDiff > 1 ? 's' : ''} ago`;
  
  const daysDiff = Math.floor(hoursDiff / 24);
  if (daysDiff < 7) return `${daysDiff} day${daysDiff > 1 ? 's' : ''} ago`;
  
  const weeksDiff = Math.floor(daysDiff / 7);
  if (weeksDiff < 4) return `${weeksDiff} week${weeksDiff > 1 ? 's' : ''} ago`;
  
  const monthsDiff = Math.floor(daysDiff / 30);
  return `${monthsDiff} month${monthsDiff > 1 ? 's' : ''} ago`;
});

// Method to check if user can access note
noteSchema.methods.canUserAccess = function(userId, userRole) {
  if (this.accessLevel === 'all') return true;
  if (this.accessLevel === 'author_only') return this.author.toString() === userId.toString();
  if (this.accessLevel === 'admin_only') return ['admin', 'super_admin'].includes(userRole);
  return false;
};

// Method to add edit history
noteSchema.methods.addEditHistory = function(editedBy, editedByName, previousContent, changeDescription) {
  this.editHistory.push({
    editedBy,
    editedByName,
    editedAt: new Date(),
    previousContent,
    changeDescription: changeDescription || 'Note content updated'
  });
  
  this.lastEditedBy = editedBy;
  this.lastEditedAt = new Date();
};

// Static method to get notes by case with access control
noteSchema.statics.getNotesByCase = function(caseId, userId, userRole) {
  return this.find({ caseId })
    .populate('author', 'name')
    .populate('lastEditedBy', 'name')
    .populate('relatedHearing', 'date type')
    .sort({ createdAt: -1 })
    .then(notes => {
      return notes.filter(note => note.canUserAccess(userId, userRole));
    });
};

// Static method to get notes requiring follow-up
noteSchema.statics.getNotesRequiringFollowUp = function() {
  const today = new Date();
  today.setHours(23, 59, 59, 999);
  
  return this.find({
    followUpRequired: true,
    followUpCompleted: false,
    followUpDate: { $lte: today }
  }).populate('caseId', 'referenceNumber title')
    .populate('author', 'name')
    .sort({ followUpDate: 1 });
};

// Static method to search notes by content or tags
noteSchema.statics.searchNotes = function(caseId, searchTerm, userId, userRole) {
  const searchRegex = new RegExp(searchTerm, 'i');
  
  return this.find({
    caseId,
    $or: [
      { content: searchRegex },
      { tags: { $in: [searchRegex] } },
      { type: searchRegex }
    ]
  }).populate('author', 'name')
    .sort({ createdAt: -1 })
    .then(notes => {
      return notes.filter(note => note.canUserAccess(userId, userRole));
    });
};

// Pre-save middleware to process tags
noteSchema.pre('save', function(next) {
  if (this.isModified('tags')) {
    this.tags = this.tags
      .filter(tag => tag && tag.trim())
      .map(tag => tag.trim().toLowerCase())
      .filter((tag, index, array) => array.indexOf(tag) === index); // Remove duplicates
  }
  next();
});

// Ensure virtual fields are serialized
noteSchema.set('toJSON', { virtuals: true });

module.exports = mongoose.model('Note', noteSchema);