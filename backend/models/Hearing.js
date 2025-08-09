const mongoose = require('mongoose');

const hearingSchema = new mongoose.Schema({
  caseId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Case',
    required: true
  },
  date: {
    type: Date,
    required: [true, 'Hearing date is required']
  },
  time: {
    type: String,
    required: [true, 'Hearing time is required'],
    match: [/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Please enter a valid time format (HH:MM)']
  },
  type: {
    type: String,
    required: [true, 'Hearing type is required'],
    enum: [
      'Initial Hearing',
      'Pre-trial Conference',
      'Motion Hearing',
      'Settlement Conference',
      'Trial',
      'Final Hearing',
      'Status Conference',
      'Mediation',
      'Arbitration',
      'Case Filing'
    ]
  },
  status: {
    type: String,
    enum: ['Scheduled', 'Completed', 'Cancelled', 'Postponed'],
    default: 'Scheduled'
  },
  judge: {
    type: String,
    required: [true, 'Presiding judge is required'],
    trim: true
  },
  courtroom: {
    type: String,
    required: [true, 'Courtroom is required'],
    trim: true
  },
  outcome: {
    type: String,
    enum: ['Favorable', 'Unfavorable', 'Adjourned', 'Filed', 'Settlement Reached', 'Dismissed'],
    required: function() {
      return this.status === 'Completed';
    }
  },
  notes: {
    type: String,
    maxLength: [1000, 'Notes cannot be more than 1000 characters']
  },
  documentsRequired: {
    type: String,
    maxLength: [500, 'Documents required description cannot be more than 500 characters']
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
  attendees: [{
    name: {
      type: String,
      required: true
    },
    role: {
      type: String,
      required: true
    },
    present: {
      type: Boolean,
      default: false
    }
  }],
  reminderSent: {
    type: Boolean,
    default: false
  },
  reminderDate: {
    type: Date
  }
}, {
  timestamps: true
});

// Indexes
hearingSchema.index({ caseId: 1 });
hearingSchema.index({ date: 1 });
hearingSchema.index({ status: 1 });
hearingSchema.index({ createdBy: 1 });
hearingSchema.index({ date: 1, status: 1 });

// Virtual for formatted date and time
hearingSchema.virtual('formattedDateTime').get(function() {
  const date = new Date(this.date);
  const dateStr = date.toLocaleDateString();
  return `${dateStr} at ${this.time}`;
});

// Virtual to check if hearing is upcoming (within next 2 weeks)
hearingSchema.virtual('isUpcoming').get(function() {
  if (this.status !== 'Scheduled') return false;
  
  const now = new Date();
  const hearingDate = new Date(this.date);
  const twoWeeksFromNow = new Date(now.getTime() + (14 * 24 * 60 * 60 * 1000));
  
  return hearingDate >= now && hearingDate <= twoWeeksFromNow;
});

// Virtual to check if hearing needs reminder
hearingSchema.virtual('needsReminder').get(function() {
  if (this.status !== 'Scheduled' || this.reminderSent) return false;
  
  const now = new Date();
  const hearingDate = new Date(this.date);
  const threeDaysFromNow = new Date(now.getTime() + (3 * 24 * 60 * 60 * 1000));
  
  return hearingDate <= threeDaysFromNow && hearingDate > now;
});

// Method to mark reminder as sent
hearingSchema.methods.markReminderSent = function() {
  this.reminderSent = true;
  this.reminderDate = new Date();
  return this.save();
};

// Static method to get upcoming hearings
hearingSchema.statics.getUpcomingHearings = function(days = 14) {
  const now = new Date();
  const futureDate = new Date(now.getTime() + (days * 24 * 60 * 60 * 1000));
  
  return this.find({
    date: {
      $gte: now,
      $lte: futureDate
    },
    status: 'Scheduled'
  }).populate('caseId').sort({ date: 1 });
};

// Static method to get hearings that need reminders
hearingSchema.statics.getHearingsNeedingReminders = function() {
  const now = new Date();
  const threeDaysFromNow = new Date(now.getTime() + (3 * 24 * 60 * 60 * 1000));
  
  return this.find({
    date: {
      $gte: now,
      $lte: threeDaysFromNow
    },
    status: 'Scheduled',
    reminderSent: false
  }).populate('caseId');
};

// Pre-save middleware to update case's next/last hearing dates
hearingSchema.pre('save', async function(next) {
  if (this.isModified('date') || this.isModified('status') || this.isNew) {
    try {
      const Case = mongoose.model('Case');
      const caseDoc = await Case.findById(this.caseId);
      
      if (caseDoc) {
        console.log(`Updating case ${caseDoc.referenceNumber} hearing dates...`);
        
        // Always recalculate next hearing date for scheduled hearings
        const nextHearing = await mongoose.model('Hearing').findOne({
          caseId: this.caseId,
          status: 'Scheduled',
          date: { $gte: new Date() }
        }).sort({ date: 1 });
        
        const previousNextDate = caseDoc.nextHearingDate;
        caseDoc.nextHearingDate = nextHearing ? nextHearing.date : null;
        
        console.log(`Next hearing updated: ${previousNextDate} -> ${caseDoc.nextHearingDate}`);
        
        // Update last hearing date for completed hearings
        if (this.status === 'Completed') {
          const lastHearing = await mongoose.model('Hearing').findOne({
            caseId: this.caseId,
            status: 'Completed'
          }).sort({ date: -1 });
          
          caseDoc.lastHearingDate = lastHearing ? lastHearing.date : null;
          console.log(`Last hearing updated: ${caseDoc.lastHearingDate}`);
        }
        
        await caseDoc.save();
        console.log(`✅ Case ${caseDoc.referenceNumber} hearing dates updated successfully`);
      }
    } catch (error) {
      console.error('Error updating case hearing dates:', error);
    }
  }
  next();
});


// Ensure virtual fields are serialized
hearingSchema.set('toJSON', { virtuals: true });

module.exports = mongoose.model('Hearing', hearingSchema);