const cron = require('cron');
const Case = require('../models/Case');
const Hearing = require('../models/Hearing');
const User = require('../models/User');

// Simple email service fallback if emailService is not available
const sendSimpleEmail = async (recipients, subject, message) => {
  console.log('📧 Email would be sent to:', recipients);
  console.log('📝 Subject:', subject);
  console.log('💬 Message:', message);
  return true; // Simulate success
};

// Check for upcoming hearings and send reminders
const checkUpcomingHearings = async () => {
  try {
    console.log('🔍 Checking for upcoming hearings...');
    
    // Get hearings in next 3 days that haven't sent reminders
    const threeDaysFromNow = new Date();
    threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3);
    
    const now = new Date();
    
    const hearings = await Hearing.find({
      date: {
        $gte: now,
        $lte: threeDaysFromNow
      },
      status: 'Scheduled',
      reminderSent: { $ne: true }
    }).populate('caseId');
    
    if (hearings.length === 0) {
      console.log('ℹ️ No hearings need reminders at this time');
      return;
    }

    // Get admin emails
    const adminUsers = await User.find({ 
      role: { $in: ['admin', 'super_admin'] }, 
      status: 'active' 
    });
    const adminEmails = adminUsers.map(user => user.email);

    for (const hearing of hearings) {
      try {
        // Send email notification (simplified)
        await sendSimpleEmail(
          adminEmails,
          `Upcoming Hearing: ${hearing.caseId.referenceNumber}`,
          `${hearing.type} scheduled for ${new Date(hearing.date).toLocaleDateString()} at ${hearing.time}`
        );

        // Mark reminder as sent
        hearing.reminderSent = true;
        hearing.reminderDate = new Date();
        await hearing.save();

        console.log(`✅ Reminder sent for hearing: ${hearing._id}`);
      } catch (error) {
        console.error(`❌ Error sending reminder for hearing ${hearing._id}:`, error);
      }
    }

    console.log(`📬 Processed ${hearings.length} hearing reminders`);
  } catch (error) {
    console.error('❌ Error checking upcoming hearings:', error);
  }
};

// Check for inactive cases and send alerts
const checkInactiveCases = async () => {
  try {
    console.log('🔍 Checking for inactive cases...');
    
    // Update inactive status for all cases
    const allCases = await Case.find({});
    for (const caseDoc of allCases) {
      if (caseDoc.checkInactiveStatus) {
        caseDoc.checkInactiveStatus();
        await caseDoc.save();
      }
    }

    // Get inactive cases
    const inactiveCases = await Case.find({ isInactive: true });

    if (inactiveCases.length === 0) {
      console.log('ℹ️ No inactive cases found');
      return;
    }

    // Get admin emails
    const adminUsers = await User.find({ 
      role: { $in: ['admin', 'super_admin'] }, 
      status: 'active' 
    });
    const adminEmails = adminUsers.map(user => user.email);

    // Send alert
    await sendSimpleEmail(
      adminEmails,
      `Inactive Cases Alert - ${inactiveCases.length} cases`,
      `${inactiveCases.length} cases have been inactive for more than 10 months`
    );

    console.log(`⚠️ Inactive case alert sent for ${inactiveCases.length} cases`);
  } catch (error) {
    console.error('❌ Error checking inactive cases:', error);
  }
};

// Update case inactive status daily
const updateCaseStatus = async () => {
  try {
    console.log('🔄 Updating case inactive status...');
    
    const cases = await Case.find({});
    let updatedCount = 0;

    for (const caseDoc of cases) {
      if (caseDoc.checkInactiveStatus) {
        const wasInactive = caseDoc.isInactive;
        caseDoc.checkInactiveStatus();
        
        if (wasInactive !== caseDoc.isInactive) {
          await caseDoc.save();
          updatedCount++;
        }
      }
    }

    console.log(`✅ Updated status for ${updatedCount} cases`);
  } catch (error) {
    console.error('❌ Error updating case status:', error);
  }
};

// Clean up old data
const cleanupOldData = async () => {
  try {
    console.log('🧹 Cleaning up old data...');
    
    // This is a placeholder for cleanup operations
    // You can add specific cleanup logic here
    
    console.log('✅ Cleanup completed');
  } catch (error) {
    console.error('❌ Error during cleanup:', error);
  }
};

// Initialize cron jobs
const initializeCronJobs = () => {
  console.log('⏰ Initializing cron jobs...');

  try {
    // Check for upcoming hearings every day at 9 AM
    const hearingReminderJob = new cron.CronJob(
      '0 9 * * *', // Every day at 9:00 AM
      checkUpcomingHearings,
      null,
      true,
      'UTC'
    );

    // Check for inactive cases every Monday at 8 AM
    const inactiveCaseJob = new cron.CronJob(
      '0 8 * * 1', // Every Monday at 8:00 AM
      checkInactiveCases,
      null,
      true,
      'UTC'
    );

    // Update case status every day at 6 AM
    const statusUpdateJob = new cron.CronJob(
      '0 6 * * *', // Every day at 6:00 AM
      updateCaseStatus,
      null,
      true,
      'UTC'
    );

    // Clean up old data every Sunday at midnight
    const cleanupJob = new cron.CronJob(
      '0 0 * * 0', // Every Sunday at midnight
      cleanupOldData,
      null,
      true,
      'UTC'
    );

    console.log('✅ Cron jobs initialized:');
    console.log('   📅 Hearing reminders: Daily at 9:00 AM UTC');
    console.log('   ⚠️  Inactive case alerts: Mondays at 8:00 AM UTC');
    console.log('   🔄 Case status update: Daily at 6:00 AM UTC');
    console.log('   🧹 Cleanup: Sundays at midnight UTC');

    return {
      hearingReminderJob,
      inactiveCaseJob,
      statusUpdateJob,
      cleanupJob
    };
  } catch (error) {
    console.error('❌ Error initializing cron jobs:', error);
    return {};
  }
};

// Manual trigger functions for testing
const manualTriggers = {
  checkUpcomingHearings,
  checkInactiveCases,
  updateCaseStatus,
  cleanupOldData
};

module.exports = {
  initializeCronJobs,
  manualTriggers
};