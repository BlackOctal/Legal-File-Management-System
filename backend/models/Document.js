const mongoose = require('mongoose');

const documentSchema = new mongoose.Schema({
  caseId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Case',
    required: true
  },
  hearingId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Hearing'
  },
  name: {
    type: String,
    required: [true, 'Document name is required'],
    trim: true
  },
  originalName: {
    type: String,
    required: true
  },
  filename: {
    type: String,
    required: true,
    unique: true
  },
  type: {
    type: String,
    required: [true, 'Document type is required'],
    enum: [
      'Legal Filing',
      'Evidence',
      'Contract',
      'Testimony',
      'Correspondence',
      'Financial Statement',
      'Court Order',
      'Affidavit',
      'Other'
    ]
  },
  mimeType: {
    type: String,
    required: true
  },
  size: {
    type: Number,
    required: true
  },
  formattedSize: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['Approved', 'Pending Review', 'In Review', 'Required', 'Rejected'],
    default: 'Pending Review'
  },
  uploadedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  uploadedByName: {
    type: String,
    required: true
  },
  reviewedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  reviewedAt: {
    type: Date
  },
  reviewNotes: {
    type: String,
    maxLength: [500, 'Review notes cannot be more than 500 characters']
  },
  tags: [{
    type: String,
    trim: true
  }],
  description: {
    type: String,
    maxLength: [500, 'Description cannot be more than 500 characters']
  },
  isConfidential: {
    type: Boolean,
    default: false
  },
  accessLevel: {
    type: String,
    enum: ['public', 'internal', 'restricted'],
    default: 'internal'
  },
  downloadCount: {
    type: Number,
    default: 0
  },
  lastDownloaded: {
    type: Date
  },
  lastDownloadedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  path: {
    type: String,
    required: true
  }
}, {
  timestamps: true
});

// Indexes
documentSchema.index({ caseId: 1 });
documentSchema.index({ hearingId: 1 });
documentSchema.index({ type: 1 });
documentSchema.index({ status: 1 });
documentSchema.index({ uploadedBy: 1 });
documentSchema.index({ filename: 1 });
documentSchema.index({ createdAt: -1 });

// Virtual for file extension
documentSchema.virtual('fileExtension').get(function() {
  return this.originalName.split('.').pop().toLowerCase();
});

// Virtual for formatted upload date
documentSchema.virtual('formattedUploadDate').get(function() {
  return this.createdAt.toLocaleDateString();
});

// Method to format file size
documentSchema.statics.formatFileSize = function(bytes) {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

// Method to increment download count
documentSchema.methods.incrementDownloadCount = function(userId) {
  this.downloadCount += 1;
  this.lastDownloaded = new Date();
  this.lastDownloadedBy = userId;
  return this.save();
};

// Method to check if user can access document
documentSchema.methods.canUserAccess = function(userRole) {
  if (this.accessLevel === 'public') return true;
  if (this.accessLevel === 'internal' && ['staff', 'admin', 'super_admin'].includes(userRole)) return true;
  if (this.accessLevel === 'restricted' && ['admin', 'super_admin'].includes(userRole)) return true;
  return false;
};

// Static method to get documents by case
documentSchema.statics.getDocumentsByCase = function(caseId, userRole = 'staff') {
  return this.find({ caseId })
    .populate('uploadedBy', 'name')
    .populate('reviewedBy', 'name')
    .sort({ createdAt: -1 });
};

// Pre-save middleware to set formatted size
documentSchema.pre('save', function(next) {
  if (this.isModified('size')) {
    this.formattedSize = this.constructor.formatFileSize(this.size);
  }
  next();
});

// Ensure virtual fields are serialized
documentSchema.set('toJSON', { virtuals: true });

module.exports = mongoose.model('Document', documentSchema);