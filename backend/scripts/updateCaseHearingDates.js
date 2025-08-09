const mongoose = require('mongoose');
const Case = require('../models/Case');
const Hearing = require('../models/Hearing');
require('dotenv').config();

const updateExistingCases = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/law_case_system');
    console.log('Connected to MongoDB');

    const cases = await Case.find({});
    console.log(`Found ${cases.length} cases to update`);

    for (const caseDoc of cases) {
      // Find next scheduled hearing
      const nextHearing = await Hearing.findOne({
        caseId: caseDoc._id,
        status: 'Scheduled',
        date: { $gte: new Date() }
      }).sort({ date: 1 });

      // Find last completed hearing
      const lastHearing = await Hearing.findOne({
        caseId: caseDoc._id,
        status: 'Completed'
      }).sort({ date: -1 });

      const oldNext = caseDoc.nextHearingDate;
      const oldLast = caseDoc.lastHearingDate;

      caseDoc.nextHearingDate = nextHearing ? nextHearing.date : null;
      caseDoc.lastHearingDate = lastHearing ? lastHearing.date : null;

      await caseDoc.save();

      console.log(`Updated ${caseDoc.referenceNumber}:`);
      console.log(`  Next: ${oldNext} -> ${caseDoc.nextHearingDate}`);
      console.log(`  Last: ${oldLast} -> ${caseDoc.lastHearingDate}`);
    }

    console.log('✅ All cases updated successfully');
  } catch (error) {
    console.error('❌ Error updating cases:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
    process.exit(0);
  }
};

updateExistingCases();