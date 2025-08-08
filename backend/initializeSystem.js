// const mongoose = require('mongoose');
// const bcrypt = require('bcryptjs');
// require('dotenv').config();

// // Import models
// const User = require('./models/User');
// const Category = require('./models/Category');

// const initializeSystem = async () => {
//   try {
//     // Connect to MongoDB
//     await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/law_case_system');
//     console.log('Connected to MongoDB');

//     // Check if super admin exists
//     let superAdmin = await User.findOne({ role: 'super_admin' });
    
//     if (!superAdmin) {
//       // Create super admin
//       superAdmin = await User.create({
//         name: 'Super Administrator',
//         email: process.env.SUPER_ADMIN_EMAIL || 'superadmin@lawfirm.com',
//         password: process.env.SUPER_ADMIN_PASSWORD || 'SuperAdmin@123',
//         role: 'super_admin',
//         department: 'Administration',
//         status: 'active'
//       });
//       console.log('✅ Super admin created');
//     }

//     // Check if categories exist
//     const categoryCount = await Category.countDocuments();
    
//     if (categoryCount === 0) {
//       console.log('📂 Initializing default categories...');
      
//       const defaultCategories = [
//         {
//           name: 'Financial Cases',
//           identifier: 'financial',
//           description: 'Loan settlements, debt recovery, and bankruptcy cases',
//           icon: 'ri-money-dollar-circle-line',
//           color: 'bg-green-50 border-green-200 hover:bg-green-100',
//           iconColor: 'text-green-600',
//           subcategories: [
//             { name: 'Loan Settlement', description: 'Mortgage and personal loan settlements', createdBy: superAdmin._id },
//             { name: 'Debt Recovery', description: 'Collection and recovery cases', createdBy: superAdmin._id },
//             { name: 'Bankruptcy', description: 'Corporate and personal bankruptcy', createdBy: superAdmin._id }
//           ]
//         },
//         {
//           name: 'Property Deeds',
//           identifier: 'deeds',
//           description: 'Property transfers, title disputes, and registrations',
//           icon: 'ri-home-4-line',
//           color: 'bg-blue-50 border-blue-200 hover:bg-blue-100',
//           iconColor: 'text-blue-600',
//           subcategories: [
//             { name: 'Property Transfer', description: 'Ownership transfer documentation', createdBy: superAdmin._id },
//             { name: 'Title Dispute', description: 'Property ownership disputes', createdBy: superAdmin._id },
//             { name: 'Registration', description: 'Property registration matters', createdBy: superAdmin._id }
//           ]
//         },
//         {
//           name: 'Criminal Cases',
//           identifier: 'criminal',
//           description: 'Criminal defense, prosecution, and appeals',
//           icon: 'ri-scales-3-line',
//           color: 'bg-red-50 border-red-200 hover:bg-red-100',
//           iconColor: 'text-red-600',
//           subcategories: [
//             { name: 'Defense', description: 'Criminal defense representation', createdBy: superAdmin._id },
//             { name: 'Prosecution', description: 'State prosecution cases', createdBy: superAdmin._id },
//             { name: 'Appeals', description: 'Criminal appeal proceedings', createdBy: superAdmin._id }
//           ]
//         },
//         {
//           name: 'Civil Litigation',
//           identifier: 'civil',
//           description: 'Contract disputes, personal injury, and tort cases',
//           icon: 'ri-file-text-line',
//           color: 'bg-purple-50 border-purple-200 hover:bg-purple-100',
//           iconColor: 'text-purple-600',
//           subcategories: [
//             { name: 'Contract Dispute', description: 'Business and personal contracts', createdBy: superAdmin._id },
//             { name: 'Personal Injury', description: 'Accident and injury claims', createdBy: superAdmin._id },
//             { name: 'Torts', description: 'Civil wrong and damages', createdBy: superAdmin._id }
//           ]
//         },
//         {
//           name: 'Family Law',
//           identifier: 'family',
//           description: 'Divorce, custody, adoption, and domestic relations',
//           icon: 'ri-group-line',
//           color: 'bg-orange-50 border-orange-200 hover:bg-orange-100',
//           iconColor: 'text-orange-600',
//           subcategories: [
//             { name: 'Divorce', description: 'Marriage dissolution proceedings', createdBy: superAdmin._id },
//             { name: 'Custody', description: 'Child custody and support', createdBy: superAdmin._id },
//             { name: 'Adoption', description: 'Adoption proceedings', createdBy: superAdmin._id }
//           ]
//         },
//         {
//           name: 'Corporate Law',
//           identifier: 'corporate',
//           description: 'Business formation, contracts, and compliance',
//           icon: 'ri-building-line',
//           color: 'bg-indigo-50 border-indigo-200 hover:bg-indigo-100',
//           iconColor: 'text-indigo-600',
//           subcategories: [
//             { name: 'Formation', description: 'Company setup and structure', createdBy: superAdmin._id },
//             { name: 'Contracts', description: 'Business agreements', createdBy: superAdmin._id },
//             { name: 'Compliance', description: 'Regulatory compliance matters', createdBy: superAdmin._id }
//           ]
//         }
//       ];

//       for (const categoryData of defaultCategories) {
//         await Category.create({
//           ...categoryData,
//           createdBy: superAdmin._id,
//           lastUpdatedBy: superAdmin._id
//         });
//       }

//       console.log('✅ Default categories created');
//     }

//     console.log('\n=== System Initialization Complete ===');
//     console.log('Super Admin Credentials:');
//     console.log(`Email: ${superAdmin.email}`);
//     console.log('Password: SuperAdmin@123 (change this after first login)');
//     console.log('========================================\n');

//   } catch (error) {
//     console.error('❌ Initialization error:', error);
//   } finally {
//     await mongoose.disconnect();
//     console.log('Disconnected from MongoDB');
//     process.exit(0);
//   }
// };

// // Run initialization
// initializeSystem();