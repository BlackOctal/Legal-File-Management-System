const express = require('express');
const { body, validationResult, query } = require('express-validator');
const Hearing = require('../models/Hearing');
const Case = require('../models/Case');
const { logUserAction } = require('../middleware/auth');

const router = express.Router();

// @desc    Get hearings for a case
// @route   GET /api/hearings/case/:caseId
// @access  Private
router.get('/case/:caseId', [
  query('status').optional().isIn(['Scheduled', 'Completed', 'Cancelled', 'Postponed']),
  query('upcoming').optional().isBoolean()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { caseId } = req.params;
    const { status, upcoming } = req.query;

    // Verify case exists
    const case_doc = await Case.findById(caseId);
    if (!case_doc) {
      return res.status(404).json({
        success: false,
        message: 'Case not found'
      });
    }

    // Build filter
    const filter = { caseId };
    if (status) filter.status = status;
    
    if (upcoming === 'true') {
      filter.status = 'Scheduled';
      filter.date = { $gte: new Date() };
    }

    const hearings = await Hearing.find(filter)
      .populate('createdBy', 'name')
      .populate('lastUpdatedBy', 'name')
      .sort({ date: upcoming === 'true' ? 1 : -1 });

    res.json({
      success: true,
      data: { hearings }
    });

  } catch (error) {
    console.error('Get case hearings error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching hearings'
    });
  }
});

// @desc    Create new hearing
// @route   POST /api/hearings/case/:caseId
// @access  Private
router.post('/case/:caseId', [
  logUserAction('create_hearing'),
  body('date')
    .isISO8601()
    .withMessage('Invalid date format')
    .custom((value) => {
      const hearingDate = new Date(value);
      const now = new Date();
      if (hearingDate < now) {
        throw new Error('Hearing date cannot be in the past');
      }
      return true;
    }),
  body('time')
    .matches(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/)
    .withMessage('Invalid time format (HH:MM)'),
  body('type')
    .isIn([
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
    ])
    .withMessage('Invalid hearing type'),
  body('judge')
    .notEmpty()
    .withMessage('Presiding judge is required')
    .isLength({ max: 100 })
    .withMessage('Judge name cannot exceed 100 characters'),
  body('courtroom')
    .notEmpty()
    .withMessage('Courtroom is required')
    .isLength({ max: 50 })
    .withMessage('Courtroom cannot exceed 50 characters'),
  body('notes')
    .optional()
    .isLength({ max: 1000 })
    .withMessage('Notes cannot exceed 1000 characters'),
  body('documentsRequired')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Documents required description cannot exceed 500 characters'),
  body('attendees')
    .optional()
    .isArray()
    .withMessage('Attendees must be an array'),
  body('attendees.*.name')
    .optional()
    .notEmpty()
    .withMessage('Attendee name is required'),
  body('attendees.*.role')
    .optional()
    .notEmpty()
    .withMessage('Attendee role is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { caseId } = req.params;
    const {
      date,
      time,
      type,
      judge,
      courtroom,
      notes,
      documentsRequired,
      attendees = []
    } = req.body;

    // Verify case exists
    const case_doc = await Case.findById(caseId);
    if (!case_doc) {
      return res.status(404).json({
        success: false,
        message: 'Case not found'
      });
    }

    // Create hearing
    const hearing = new Hearing({
      caseId,
      date: new Date(date),
      time,
      type,
      judge,
      courtroom,
      notes,
      documentsRequired,
      attendees,
      createdBy: req.user._id,
      lastUpdatedBy: req.user._id
    });

    await hearing.save();

        // Manually trigger case update for next hearing date
    const Case = require('../models/Case');
    const caseDoc = await Case.findById(caseId);
    if (caseDoc) {
      const nextHearing = await Hearing.findOne({
        caseId: caseId,
        status: 'Scheduled',
        date: { $gte: new Date() }
      }).sort({ date: 1 });
      
      caseDoc.nextHearingDate = nextHearing ? nextHearing.date : null;
      await caseDoc.save();
      console.log(`✅ Updated case ${caseDoc.referenceNumber} next hearing date: ${caseDoc.nextHearingDate}`);
    }

    // Populate hearing
    const populatedHearing = await Hearing.findById(hearing._id)
      .populate('createdBy', 'name')
      .populate('caseId', 'referenceNumber title');

    res.status(201).json({
      success: true,
      message: 'Hearing scheduled successfully',
      data: { hearing: populatedHearing }
    });

  } catch (error) {
    console.error('Create hearing error:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating hearing'
    });
  }
});

// @desc    Update hearing
// @route   PUT /api/hearings/:id
// @access  Private
router.put('/:id', [
  logUserAction('update_hearing'),
  body('date')
    .optional()
    .isISO8601()
    .withMessage('Invalid date format'),
  body('time')
    .optional()
    .matches(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/)
    .withMessage('Invalid time format (HH:MM)'),
  body('type')
    .optional()
    .isIn([
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
    ]),
  body('status')
    .optional()
    .isIn(['Scheduled', 'Completed', 'Cancelled', 'Postponed']),
  body('outcome')
    .optional()
    .isIn(['Favorable', 'Unfavorable', 'Adjourned', 'Filed', 'Settlement Reached', 'Dismissed']),
  body('judge')
    .optional()
    .isLength({ max: 100 }),
  body('courtroom')
    .optional()
    .isLength({ max: 50 }),
  body('notes')
    .optional()
    .isLength({ max: 1000 }),
  body('documentsRequired')
    .optional()
    .isLength({ max: 500 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const hearingId = req.params.id;
    const updates = req.body;

    // Find existing hearing
    const existingHearing = await Hearing.findById(hearingId);
    if (!existingHearing) {
      return res.status(404).json({
        success: false,
        message: 'Hearing not found'
      });
    }

    // Validate date if being updated
    if (updates.date) {
      const hearingDate = new Date(updates.date);
      const now = new Date();
      if (hearingDate < now && updates.status !== 'Completed') {
        return res.status(400).json({
          success: false,
          message: 'Hearing date cannot be in the past unless marking as completed'
        });
      }
      updates.date = hearingDate;
    }

    // If marking as completed, outcome is required
    if (updates.status === 'Completed' && !updates.outcome && !existingHearing.outcome) {
      return res.status(400).json({
        success: false,
        message: 'Outcome is required when marking hearing as completed'
      });
    }

    // Update hearing
    const updatedHearing = await Hearing.findByIdAndUpdate(
      hearingId,
      {
        ...updates,
        lastUpdatedBy: req.user._id
      },
      { new: true, runValidators: true }
    ).populate('createdBy', 'name')
     .populate('lastUpdatedBy', 'name')
     .populate('caseId', 'referenceNumber title');

    res.json({
      success: true,
      message: 'Hearing updated successfully',
      data: { hearing: updatedHearing }
    });

  } catch (error) {
    console.error('Update hearing error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating hearing'
    });
  }
});

// @desc    Delete hearing
// @route   DELETE /api/hearings/:id
// @access  Private (Admin+)
router.delete('/:id', [
  logUserAction('delete_hearing')
], async (req, res) => {
  try {
    // Check permissions - only admin and super_admin can delete hearings
    if (!['admin', 'super_admin'].includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Only administrators can delete hearings'
      });
    }

    const hearing = await Hearing.findById(req.params.id);
    if (!hearing) {
      return res.status(404).json({
        success: false,
        message: 'Hearing not found'
      });
    }

    await Hearing.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'Hearing deleted successfully'
    });

  } catch (error) {
    console.error('Delete hearing error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting hearing'
    });
  }
});

// @desc    Get upcoming hearings (next 2 weeks)
// @route   GET /api/hearings/upcoming
// @access  Private
router.get('/upcoming', [
  query('days').optional().isInt({ min: 1, max: 365 }).withMessage('Days must be between 1 and 365')
], async (req, res) => {
  try {
    const { days = 14 } = req.query;
    
    const upcomingHearings = await Hearing.getUpcomingHearings(parseInt(days));

    res.json({
      success: true,
      data: { hearings: upcomingHearings }
    });

  } catch (error) {
    console.error('Get upcoming hearings error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching upcoming hearings'
    });
  }
});

// @desc    Get hearings needing reminders
// @route   GET /api/hearings/reminders
// @access  Private (Admin+)
router.get('/reminders', async (req, res) => {
  try {
    // Only admin and super_admin can access reminder functionality
    if (!['admin', 'super_admin'].includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Only administrators can access reminder functionality'
      });
    }

    const hearings = await Hearing.getHearingsNeedingReminders();

    res.json({
      success: true,
      data: { hearings }
    });

  } catch (error) {
    console.error('Get reminder hearings error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching hearings needing reminders'
    });
  }
});

// @desc    Mark reminder as sent
// @route   PUT /api/hearings/:id/mark-reminder-sent
// @access  Private (Admin+)
router.put('/:id/mark-reminder-sent', async (req, res) => {
  try {
    // Only admin and super_admin can mark reminders as sent
    if (!['admin', 'super_admin'].includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Only administrators can mark reminders as sent'
      });
    }

    const hearing = await Hearing.findById(req.params.id);
    if (!hearing) {
      return res.status(404).json({
        success: false,
        message: 'Hearing not found'
      });
    }

    await hearing.markReminderSent();

    res.json({
      success: true,
      message: 'Reminder marked as sent'
    });

  } catch (error) {
    console.error('Mark reminder sent error:', error);
    res.status(500).json({
      success: false,
      message: 'Error marking reminder as sent'
    });
  }
});

// @desc    Update attendee presence
// @route   PUT /api/hearings/:id/attendees
// @access  Private
router.put('/:id/attendees', [
  body('attendees').isArray().withMessage('Attendees must be an array'),
  body('attendees.*.name').notEmpty().withMessage('Attendee name is required'),
  body('attendees.*.role').notEmpty().withMessage('Attendee role is required'),
  body('attendees.*.present').isBoolean().withMessage('Attendee presence must be boolean')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { attendees } = req.body;

    const hearing = await Hearing.findByIdAndUpdate(
      req.params.id,
      { 
        attendees,
        lastUpdatedBy: req.user._id 
      },
      { new: true, runValidators: true }
    ).populate('caseId', 'referenceNumber title');

    if (!hearing) {
      return res.status(404).json({
        success: false,
        message: 'Hearing not found'
      });
    }

    res.json({
      success: true,
      message: 'Attendee information updated successfully',
      data: { hearing }
    });

  } catch (error) {
    console.error('Update attendees error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating attendee information'
    });
  }
});

// @desc    Get hearing statistics
// @route   GET /api/hearings/stats
// @access  Private
router.get('/stats/overview', async (req, res) => {
  try {
    const stats = await Hearing.aggregate([
      {
        $group: {
          _id: null,
          totalHearings: { $sum: 1 },
          scheduledHearings: {
            $sum: { $cond: [{ $eq: ['$status', 'Scheduled'] }, 1, 0] }
          },
          completedHearings: {
            $sum: { $cond: [{ $eq: ['$status', 'Completed'] }, 1, 0] }
          },
          cancelledHearings: {
            $sum: { $cond: [{ $eq: ['$status', 'Cancelled'] }, 1, 0] }
          },
          postponedHearings: {
            $sum: { $cond: [{ $eq: ['$status', 'Postponed'] }, 1, 0] }
          }
        }
      }
    ]);

    // Get hearings by type
    const hearingsByType = await Hearing.aggregate([
      {
        $group: {
          _id: '$type',
          count: { $sum: 1 },
          scheduled: {
            $sum: { $cond: [{ $eq: ['$status', 'Scheduled'] }, 1, 0] }
          }
        }
      }
    ]);

    // Get upcoming hearings count by date ranges
    const now = new Date();
    const tomorrow = new Date(now.getTime() + (24 * 60 * 60 * 1000));
    const nextWeek = new Date(now.getTime() + (7 * 24 * 60 * 60 * 1000));
    const nextMonth = new Date(now.getTime() + (30 * 24 * 60 * 60 * 1000));

    const upcomingCounts = await Hearing.aggregate([
      {
        $match: {
          status: 'Scheduled',
          date: { $gte: now }
        }
      },
      {
        $group: {
          _id: null,
          tomorrow: {
            $sum: { $cond: [{ $lte: ['$date', tomorrow] }, 1, 0] }
          },
          nextWeek: {
            $sum: { $cond: [{ $lte: ['$date', nextWeek] }, 1, 0] }
          },
          nextMonth: {
            $sum: { $cond: [{ $lte: ['$date', nextMonth] }, 1, 0] }
          }
        }
      }
    ]);

    res.json({
      success: true,
      data: {
        overview: stats[0] || {
          totalHearings: 0,
          scheduledHearings: 0,
          completedHearings: 0,
          cancelledHearings: 0,
          postponedHearings: 0
        },
        hearingsByType,
        upcomingCounts: upcomingCounts[0] || {
          tomorrow: 0,
          nextWeek: 0,
          nextMonth: 0
        }
      }
    });

  } catch (error) {
    console.error('Get hearing stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching hearing statistics'
    });
  }
});

module.exports = router;