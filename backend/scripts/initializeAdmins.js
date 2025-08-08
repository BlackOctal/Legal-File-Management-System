const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// User schema (copied from models/User.js since we need it here)
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

const User = mongoose.model('User', userSchema);

const initializeAdmins = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/law_case_system');
    console.log('Connected to MongoDB');

    // Check if super admin already exists
    const existingSuperAdmin = await User.findOne({ role: 'super_admin' });
    if (existingSuperAdmin) {
      console.log('Super admin already exists');
    } else {
      // Create super admin
      const superAdmin = new User({
        name: 'Super Administrator',
        email: process.env.SUPER_ADMIN_EMAIL || 'superadmin@lawfirm.com',
        password: process.env.SUPER_ADMIN_PASSWORD || 'SuperAdmin@123',
        role: 'super_admin',
        department: 'Administration'
      });

      await superAdmin.save();
      console.log('Super admin created successfully');
    }

    // Get super admin ID for creating other admins
    const superAdminUser = await User.findOne({ role: 'super_admin' });

    // Create Admin 1
    const existingAdmin1 = await User.findOne({ 
      email: process.env.ADMIN1_EMAIL || 'admin1@lawfirm.com' 
    });
    
    if (existingAdmin1) {
      console.log('Admin 1 already exists');
    } else {
      const admin1 = new User({
        name: 'Admin One',
        email: process.env.ADMIN1_EMAIL || 'admin1@lawfirm.com',
        password: process.env.ADMIN1_PASSWORD || 'Admin1@123',
        role: 'admin',
        department: 'Legal Operations',
        createdBy: superAdminUser._id
      });

      await admin1.save();
      console.log('Admin 1 created successfully');
    }

    // Create Admin 2
    const existingAdmin2 = await User.findOne({ 
      email: process.env.ADMIN2_EMAIL || 'admin2@lawfirm.com' 
    });
    
    if (existingAdmin2) {
      console.log('Admin 2 already exists');
    } else {
      const admin2 = new User({
        name: 'Admin Two',
        email: process.env.ADMIN2_EMAIL || 'admin2@lawfirm.com',
        password: process.env.ADMIN2_PASSWORD || 'Admin2@123',
        role: 'admin',
        department: 'Case Management',
        createdBy: superAdminUser._id
      });

      await admin2.save();
      console.log('Admin 2 created successfully');
    }

    console.log('\n=== Default Users Created ===');
    console.log('Super Admin:');
    console.log(`Email: ${process.env.SUPER_ADMIN_EMAIL || 'superadmin@lawfirm.com'}`);
    console.log(`Password: ${process.env.SUPER_ADMIN_PASSWORD || 'SuperAdmin123!'}`);
    console.log('\nAdmin 1:');
    console.log(`Email: ${process.env.ADMIN1_EMAIL || 'admin1@lawfirm.com'}`);
    console.log(`Password: ${process.env.ADMIN1_PASSWORD || 'Admin1@123'}`);
    console.log('\nAdmin 2:');
    console.log(`Email: ${process.env.ADMIN2_EMAIL || 'admin2@lawfirm.com'}`);
    console.log(`Password: ${process.env.ADMIN2_PASSWORD || 'Admin2@123'}`);
    console.log('=============================\n');

  } catch (error) {
    console.error('Error initializing admins:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
    process.exit(0);
  }
};

// Run the initialization
initializeAdmins();