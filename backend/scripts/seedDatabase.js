const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// Import models
const User = require('../models/User');
const Case = require('../models/Case');
const Hearing = require('../models/Hearing');
const Note = require('../models/Note');

const seedDatabase = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/law_case_system');
    console.log('Connected to MongoDB');

    // Clear existing data (be careful in production!)
    console.log('Clearing existing data...');
    await User.deleteMany({});
    await Case.deleteMany({});
    await Hearing.deleteMany({});
    await Note.deleteMany({});

    // Create users
    console.log('Creating users...');
    
    const superAdmin = await User.create({
      name: 'Super Administrator',
      email: 'superadmin@lawfirm.com',
      password: 'SuperAdmin@123',
      role: 'super_admin',
      department: 'Administration',
      status: 'active'
    });

    const admin1 = await User.create({
      name: 'Admin One',
      email: 'admin1@lawfirm.com',
      password: 'Admin1@123',
      role: 'admin',
      department: 'Legal Operations',
      createdBy: superAdmin._id,
      status: 'active'
    });

    const admin2 = await User.create({
      name: 'Admin Two',
      email: 'admin2@lawfirm.com',
      password: 'Admin2@123',
      role: 'admin',
      department: 'Case Management',
      createdBy: superAdmin._id,
      status: 'active'
    });

    const staff1 = await User.create({
      name: 'Sarah Johnson',
      email: 'sarah.johnson@lawfirm.com',
      password: 'Staff123@',
      role: 'staff',
      department: 'Financial Cases',
      createdBy: admin1._id,
      status: 'active'
    });

    const staff2 = await User.create({
      name: 'Mike Davis',
      email: 'mike.davis@lawfirm.com',
      password: 'Staff123@',
      role: 'staff',
      department: 'Property Law',
      createdBy: admin1._id,
      status: 'active'
    });

    console.log('Users created successfully');

    // Create sample cases
    console.log('Creating sample cases...');

    const case1 = await Case.create({
      referenceNumber: 'LC-2024-001',
      fileNumber: 'F-001-2024',
      caseNumber: 'C-24-001',
      title: 'Loan Settlement Dispute',
      clientNames: ['Johnson & Associates', 'ABC Corporation'],
      category: 'financial',
      subcategory: 'Loan Settlement',
      status: 'Active',
      priority: 'High',
      description: 'Complex loan settlement case involving multiple parties and significant financial exposure. Requires careful documentation and strategic approach.',
      assignedLawyer: 'Sarah Johnson',
      courtName: 'District Court Central',
      judgeAssigned: 'Hon. Michael Roberts',
      createdBy: admin1._id,
      lastUpdatedBy: admin1._id
    });

    const case2 = await Case.create({
      referenceNumber: 'LC-2024-002',
      fileNumber: 'F-002-2024',
      caseNumber: 'C-24-002',
      title: 'Property Transfer Case',
      clientNames: ['Maria Rodriguez'],
      category: 'deeds',
      subcategory: 'Property Transfer',
      status: 'Active',
      priority: 'Medium',
      description: 'Property ownership transfer involving title verification and documentation review.',
      assignedLawyer: 'Mike Davis',
      courtName: 'Property Court East',
      judgeAssigned: 'Hon. Sarah Wilson',
      createdBy: admin2._id,
      lastUpdatedBy: admin2._id
    });

    // Create an inactive case (older than 10 months)
    const inactiveCase = await Case.create({
      referenceNumber: 'LC-2023-045',
      fileNumber: 'F-045-2023',
      caseNumber: 'C-23-045',
      title: 'Corporate Bankruptcy',
      clientNames: ['Tech Solutions Inc'],
      category: 'financial',
      subcategory: 'Bankruptcy',
      status: 'Pending',
      priority: 'Low',
      description: 'Corporate bankruptcy case that has been stalled due to client unavailability.',
      assignedLawyer: 'Sarah Johnson',
      lastHearingDate: new Date('2023-02-15'), // More than 10 months ago
      createdBy: admin1._id,
      lastUpdatedBy: admin1._id,
      createdAt: new Date('2023-01-10'),
      updatedAt: new Date('2023-02-15')
    });

    console.log('Cases created successfully');

    // Create sample hearings
    console.log('Creating sample hearings...');

    const hearing1 = await Hearing.create({
      caseId: case1._id,
      date: new Date('2024-12-28'),
      time: '10:00',
      type: 'Pre-trial Conference',
      status: 'Scheduled',
      judge: 'Hon. Michael Roberts',
      courtroom: 'Courtroom 3A',
      notes: 'Pre-trial conference to discuss settlement options and case timeline.',
      documentsRequired: 'Financial statements, loan agreements, correspondence records',
      createdBy: admin1._id,
      lastUpdatedBy: admin1._id
    });

    const hearing2 = await Hearing.create({
      caseId: case2._id,
      date: new Date('2024-12-30'),
      time: '14:30',
      type: 'Final Hearing',
      status: 'Scheduled',
      judge: 'Hon. Sarah Wilson',
      courtroom: 'Courtroom 2B',
      notes: 'Final hearing for property transfer approval.',
      documentsRequired: 'Title deeds, survey reports, tax clearance certificates',
      createdBy: admin2._id,
      lastUpdatedBy: admin2._id
    });

    // Create a completed hearing
    const completedHearing = await Hearing.create({
      caseId: case1._id,
      date: new Date('2024-11-15'),
      time: '14:30',
      type: 'Initial Hearing',
      status: 'Completed',
      judge: 'Hon. Michael Roberts',
      courtroom: 'Courtroom 3A',
      outcome: 'Adjourned',
      notes: 'Initial hearing completed. Case adjourned for document submission. Opposing counsel requested additional time for discovery.',
      createdBy: admin1._id,
      lastUpdatedBy: admin1._id,
      createdAt: new Date('2024-11-10'),
      updatedAt: new Date('2024-11-15')
    });

    console.log('Hearings created successfully');

    // Create sample notes
    console.log('Creating sample notes...');

    await Note.create({
      caseId: case1._id,
      content: 'Client meeting scheduled for next week to discuss settlement options. Need to prepare financial analysis and potential negotiation strategies.',
      type: 'Meeting Note',
      author: staff1._id,
      authorName: staff1.name,
      tags: ['settlement', 'client-meeting', 'strategy'],
      priority: 'Medium',
      relatedHearing: hearing1._id
    });

    await Note.create({
      caseId: case1._id,
      content: 'Opposing counsel has agreed to mediation. Mediator John Davis available on Jan 10th. Need to confirm with client and prepare mediation brief.',
      type: 'Strategy Note',
      author: admin1._id,
      authorName: admin1.name,
      tags: ['mediation', 'strategy', 'negotiation'],
      priority: 'High',
      followUpRequired: true,
      followUpDate: new Date('2024-12-20')
    });

    await Note.create({
      caseId: case2._id,
      content: 'Property survey completed. All boundaries confirmed. Ready to proceed with transfer documentation.',
      type: 'Case Note',
      author: staff2._id,
      authorName: staff2.name,
      tags: ['survey', 'documentation', 'transfer'],
      priority: 'Medium'
    });

    console.log('Notes created successfully');

    // Update case hearing dates
    console.log('Updating case hearing dates...');
    
    case1.nextHearingDate = hearing1.date;
    case1.lastHearingDate = completedHearing.date;
    await case1.save();

    case2.nextHearingDate = hearing2.date;
    await case2.save();

    // Mark inactive case
    inactiveCase.checkInactiveStatus();
    await inactiveCase.save();

    console.log('\n=== Sample Data Created Successfully ===');
    console.log('Users:');
    console.log(`- Super Admin: ${superAdmin.email} / SuperAdmin@123`);
    console.log(`- Admin 1: ${admin1.email} / Admin1@123`);
    console.log(`- Admin 2: ${admin2.email} / Admin2@123`);
    console.log(`- Staff 1: ${staff1.email} / Staff123@`);
    console.log(`- Staff 2: ${staff2.email} / Staff123@`);
    console.log('\nCases:');
    console.log(`- ${case1.referenceNumber}: ${case1.title}`);
    console.log(`- ${case2.referenceNumber}: ${case2.title}`);
    console.log(`- ${inactiveCase.referenceNumber}: ${inactiveCase.title} (Inactive)`);
    console.log('\nHearings:');
    console.log(`- ${hearing1.type} for ${case1.referenceNumber} on ${hearing1.date.toDateString()}`);
    console.log(`- ${hearing2.type} for ${case2.referenceNumber} on ${hearing2.date.toDateString()}`);
    console.log('=======================================\n');

  } catch (error) {
    console.error('Error seeding database:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
    process.exit(0);
  }
};

// Run the seeding
seedDatabase();