const mongoose = require('mongoose');

const editLogSchema = new mongoose.Schema({
  editedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  editedByName: {
    type: String,
    required: true
  },
  editedAt: {
    type: Date,
    default: Date.now
  },
  changedFields: [{
    field: String,
    oldValue: mongoose.Schema.Types.Mixed,
    newValue: mongoose.Schema.Types.Mixed
  }],
  description: {
    type: String,
    required: true
  }
});

const caseSchema = new mongoose.Schema({
  referenceNumber: {
    type: String,
    required: true,
    unique: true
  },
  fileNumber: {
    type: String,
    required: true,
    unique: true
  },
  caseNumber: {
    type: String,
    required: true,
    unique: true
  },
  title: {
    type: String,
    required: [true, 'Case title is required'],
    trim: true,
    maxLength: [200, 'Title cannot be more than 200 characters']
  },
  clientNames: [{
    type: String,
    required: true,
    trim: true
  }],
  category: {
    type: String,
    required: [true, 'Category is required'],
    enum: ['financial', 'deeds', 'criminal', 'civil', 'family', 'corporate']
  },
  subcategory: {
    type: String,
    required: [true, 'Subcategory is required'],
    trim: true
  },
  status: {
    type: String,
    enum: ['Active', 'Pending', 'Closed'],
    default: 'Active'
  },
  priority: {
    type: String,
    enum: ['High', 'Medium', 'Low'],
    default: 'Medium'
  },
  description: {
    type: String,
    required: [true, 'Description is required'],
    maxLength: [1000, 'Description cannot be more than 1000 characters']
  },
  assignedLawyer: {
    type: String,
    required: [true, 'Assigned lawyer is required'],
    trim: true
  },
  courtName: {
    type: String,
    trim: true
  },
  judgeAssigned: {
    type: String,
    trim: true
  },
  nextHearingDate: {
    type: Date
  },
  lastHearingDate: {
    type: Date
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  lastUpdatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  editLogs: [editLogSchema],
  isInactive: {
    type: Boolean,
    default: false
  },
  monthsInactive: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// Indexes for better query performance
caseSchema.index({ category: 1, subcategory: 1 });
caseSchema.index({ status: 1 });
caseSchema.index({ nextHearingDate: 1 });
caseSchema.index({ lastHearingDate: 1 });
caseSchema.index({ assignedLawyer: 1 });
caseSchema.index({ createdBy: 1 });
caseSchema.index({ isInactive: 1 });

// Generate unique reference numbers
caseSchema.statics.generateReferenceNumber = async function() {
  const currentYear = new Date().getFullYear();
  const count = await this.countDocuments({
    referenceNumber: new RegExp(`^LC-${currentYear}-`)
  });
  const nextNumber = (count + 1).toString().padStart(3, '0');
  return `LC-${currentYear}-${nextNumber}`;
};

caseSchema.statics.generateFileNumber = async function() {
  const currentYear = new Date().getFullYear();
  const count = await this.countDocuments({
    fileNumber: new RegExp(`^F-.*-${currentYear}$`)
  });
  const nextNumber = (count + 1).toString().padStart(3, '0');
  return `F-${nextNumber}-${currentYear}`;
};

caseSchema.statics.generateCaseNumber = async function() {
  const currentYear = new Date().getFullYear().toString().slice(-2);
  const count = await this.countDocuments({
    caseNumber: new RegExp(`^C-${currentYear}-`)
  });
  const nextNumber = (count + 1).toString().padStart(3, '0');
  return `C-${currentYear}-${nextNumber}`;
};

// Method to check if case is inactive (>10 months since last hearing)
caseSchema.methods.checkInactiveStatus = function() {
  if (!this.lastHearingDate) {
    return false;
  }
  
  const now = new Date();
  const lastHearing = new Date(this.lastHearingDate);
  const monthsDiff = (now.getFullYear() - lastHearing.getFullYear()) * 12 + 
                    (now.getMonth() - lastHearing.getMonth());
  
  this.monthsInactive = monthsDiff;
  this.isInactive = monthsDiff >= 10 && !this.nextHearingDate;
  
  return this.isInactive;
};

// Method to add edit log
caseSchema.methods.addEditLog = function(editedBy, editedByName, description, changedFields = []) {
  this.editLogs.push({
    editedBy,
    editedByName,
    description,
    changedFields,
    editedAt: new Date()
  });
};

// Virtual for case age
caseSchema.virtual('caseAge').get(function() {
  const now = new Date();
  const created = new Date(this.createdAt);
  const daysDiff = Math.floor((now - created) / (1000 * 60 * 60 * 24));
  return daysDiff;
});

// Ensure virtual fields are serialized
caseSchema.set('toJSON', { virtuals: true });

module.exports = mongoose.model('Case', caseSchema);