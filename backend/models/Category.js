const mongoose = require('mongoose');

const subcategorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Subcategory name is required'],
    trim: true,
    maxLength: [100, 'Subcategory name cannot exceed 100 characters']
  },
  description: {
    type: String,
    trim: true,
    maxLength: [500, 'Description cannot exceed 500 characters']
  },
  isActive: {
    type: Boolean,
    default: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const categorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Category name is required'],
    trim: true,
    maxLength: [100, 'Category name cannot exceed 100 characters']
  },
  identifier: {
    type: String,
    required: [true, 'Category identifier is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^[a-z0-9-_]+$/, 'Identifier can only contain lowercase letters, numbers, hyphens and underscores']
  },
  description: {
    type: String,
    trim: true,
    maxLength: [500, 'Description cannot exceed 500 characters']
  },
  icon: {
    type: String,
    default: 'ri-folder-line'
  },
  color: {
    type: String,
    default: 'bg-blue-50 border-blue-200 hover:bg-blue-100'
  },
  iconColor: {
    type: String,
    default: 'text-blue-600'
  },
  subcategories: [subcategorySchema],
  isActive: {
    type: Boolean,
    default: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  lastUpdatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

// Indexes
categorySchema.index({ identifier: 1 });
categorySchema.index({ isActive: 1 });
categorySchema.index({ createdBy: 1 });

// Virtual for case count
categorySchema.virtual('caseCount', {
  ref: 'Case',
  localField: 'identifier',
  foreignField: 'category',
  count: true
});

// Methods
categorySchema.methods.addSubcategory = function(subcategoryData, userId) {
  this.subcategories.push({
    ...subcategoryData,
    createdBy: userId
  });
  this.lastUpdatedBy = userId;
  return this.save();
};

categorySchema.methods.removeSubcategory = function(subcategoryId, userId) {
  this.subcategories.id(subcategoryId).remove();
  this.lastUpdatedBy = userId;
  return this.save();
};

categorySchema.methods.updateSubcategory = function(subcategoryId, updates, userId) {
  const subcategory = this.subcategories.id(subcategoryId);
  if (subcategory) {
    Object.assign(subcategory, updates);
    this.lastUpdatedBy = userId;
    return this.save();
  }
  throw new Error('Subcategory not found');
};

// Static methods
categorySchema.statics.getActiveCategories = function() {
  return this.find({ isActive: true })
    .populate('createdBy', 'name')
    .populate('lastUpdatedBy', 'name')
    .sort({ name: 1 });
};

categorySchema.statics.getCategoriesWithCaseCounts = async function() {
  const Case = mongoose.model('Case');
  
  const categories = await this.find({ isActive: true }).sort({ name: 1 });
  
  for (let category of categories) {
    const caseCount = await Case.countDocuments({ 
      category: category.identifier,
      status: { $ne: 'Closed' }
    });
    category.caseCount = caseCount;
  }
  
  return categories;
};

// Pre-save middleware
categorySchema.pre('save', function(next) {
  if (this.isModified('name') && !this.isModified('identifier')) {
    // Auto-generate identifier from name if not provided
    this.identifier = this.name.toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .trim();
  }
  next();
});

// Ensure virtual fields are serialized
categorySchema.set('toJSON', { virtuals: true });

module.exports = mongoose.model('Category', categorySchema);