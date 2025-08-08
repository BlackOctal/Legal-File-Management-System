const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
    maxLength: [100, 'Name cannot be more than 100 characters']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email']
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minLength: [6, 'Password must be at least 6 characters']
  },
  role: {
    type: String,
    enum: ['super_admin', 'admin', 'staff'],
    default: 'staff'
  },
  status: {
    type: String,
    enum: ['active', 'inactive'],
    default: 'active'
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: function() {
      return this.role !== 'super_admin';
    }
  },
  lastLogin: {
    type: Date
  },
  phoneNumber: {
    type: String,
    trim: true
  },
  department: {
    type: String,
    trim: true
  }
}, {
  timestamps: true
});

// Index for better query performance
userSchema.index({ email: 1 });
userSchema.index({ role: 1 });
userSchema.index({ status: 1 });

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Compare password method
userSchema.methods.comparePassword = async function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// Remove password from JSON output
userSchema.methods.toJSON = function() {
  const userObject = this.toObject();
  delete userObject.password;
  return userObject;
};

// Check if user can perform action based on role
userSchema.methods.canPerformAction = function(action, targetRole = null) {
  const roleHierarchy = {
    'staff': 1,
    'admin': 2,
    'super_admin': 3
  };

  const userLevel = roleHierarchy[this.role];
  const targetLevel = targetRole ? roleHierarchy[targetRole] : 0;

  switch (action) {
    case 'create_case':
    case 'edit_case':
    case 'view_case':
    case 'add_note':
      return userLevel >= 1; // All roles can do these
    case 'delete_case':
      return userLevel >= 3; // Only super admin
    case 'manage_users':
      return userLevel >= 2 && userLevel > targetLevel; // Admin+ can manage lower roles
    case 'view_all_cases':
      return userLevel >= 1; // All roles
    default:
      return false;
  }
};

module.exports = mongoose.model('User', userSchema);