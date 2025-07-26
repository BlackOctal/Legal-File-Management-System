const express = require('express');
const { body, validationResult, query } = require('express-validator');
const Note = require('../models/Note');
const Case = require('../models/Case');
const { logUserAction } = require('../middleware/auth');

const router = express.Router();

// @desc    Get notes for a case
// @route   GET /api/notes/case/:caseId
// @access  Private
router.get('/case/:caseId', [
  query('type').optional().isIn(['Case Note', 'Meeting Note', 'Strategy Note', 'Hearing Note', 'Client Communication', 'Internal Note']),
  query('priority').optional().isIn(['Low', 'Medium', 'High', 'Urgent']),
  query('search').optional().isLength({ min: 1, max: 100 })
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
    const { type, priority, search } = req.query;

    // Verify case exists
    const case_doc = await Case.findById(caseId);
    if (!case_doc) {
      return res.status(404).json({
        success: false,
        message: 'Case not found'
      });
    }

    let notes;

    if (search) {
      // Use search functionality
      notes = await Note.searchNotes(caseId, search, req.user._id, req.user.role);
    } else {
      // Get notes with filtering
      notes = await Note.getNotesByCase(caseId, req.user._id, req.user.role);
      
      // Apply additional filters
      if (type) {
        notes = notes.filter(note => note.type === type);
      }
      if (priority) {
        notes = notes.filter(note => note.priority === priority);
      }
    }

    res.json({
      success: true,
      data: { notes }
    });

  } catch (error) {
    console.error('Get case notes error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching notes'
    });
  }
});

// @desc    Create new note
// @route   POST /api/notes/case/:caseId
// @access  Private
router.post('/case/:caseId', [
  logUserAction('add_note'),
  body('content')
    .notEmpty()
    .withMessage('Note content is required')
    .isLength({ max: 1000 })
    .withMessage('Note content cannot exceed 1000 characters'),
  body('type')
    .isIn(['Case Note', 'Meeting Note', 'Strategy Note', 'Hearing Note', 'Client Communication', 'Internal Note'])
    .withMessage('Invalid note type'),
  body('priority')
    .optional()
    .isIn(['Low', 'Medium', 'High', 'Urgent'])
    .withMessage('Invalid priority'),
  body('tags')
    .optional()
    .isString()
    .withMessage('Tags must be a string'),
  body('isPrivate')
    .optional()
    .isBoolean()
    .withMessage('isPrivate must be a boolean'),
  body('accessLevel')
    .optional()
    .isIn(['all', 'admin_only', 'author_only'])
    .withMessage('Invalid access level'),
  body('relatedHearing')
    .optional()
    .isMongoId()
    .withMessage('Invalid hearing ID'),
  body('followUpRequired')
    .optional()
    .isBoolean(),
  body('followUpDate')
    .optional()
    .isISO8601()
    .withMessage('Invalid follow-up date')
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
      content,
      type,
      priority = 'Medium',
      tags,
      isPrivate = false,
      accessLevel = 'all',
      relatedHearing,
      followUpRequired = false,
      followUpDate
    } = req.body;

    // Verify case exists
    const case_doc = await Case.findById(caseId);
    if (!case_doc) {
      return res.status(404).json({
        success: false,
        message: 'Case not found'
      });
    }

    // Process tags
    const processedTags = tags ? tags.split(',').map(tag => tag.trim()).filter(tag => tag) : [];

    // Create note
    const note = await Note.create({
      caseId,
      content,
      type,
      author: req.user._id,
      authorName: req.user.name,
      priority,
      tags: processedTags,
      isPrivate,
      accessLevel,
      relatedHearing: relatedHearing || undefined,
      followUpRequired,
      followUpDate: followUpDate ? new Date(followUpDate) : undefined
    });

    // Populate note
    const populatedNote = await Note.findById(note._id)
      .populate('author', 'name')
      .populate('relatedHearing', 'date type');

    res.status(201).json({
      success: true,
      message: 'Note created successfully',
      data: { note: populatedNote }
    });

  } catch (error) {
    console.error('Create note error:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating note'
    });
  }
});

// @desc    Update note
// @route   PUT /api/notes/:id
// @access  Private (Author or Admin+)
router.put('/:id', [
  logUserAction('update_note'),
  body('content')
    .optional()
    .isLength({ max: 1000 })
    .withMessage('Note content cannot exceed 1000 characters'),
  body('type')
    .optional()
    .isIn(['Case Note', 'Meeting Note', 'Strategy Note', 'Hearing Note', 'Client Communication', 'Internal Note']),
  body('priority')
    .optional()
    .isIn(['Low', 'Medium', 'High', 'Urgent']),
  body('tags')
    .optional()
    .isString(),
  body('followUpRequired')
    .optional()
    .isBoolean(),
  body('followUpDate')
    .optional()
    .isISO8601(),
  body('followUpCompleted')
    .optional()
    .isBoolean()
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

    const noteId = req.params.id;
    const {
      content,
      type,
      priority,
      tags,
      followUpRequired,
      followUpDate,
      followUpCompleted
    } = req.body;

    // Find existing note
    const existingNote = await Note.findById(noteId);
    if (!existingNote) {
      return res.status(404).json({
        success: false,
        message: 'Note not found'
      });
    }

    // Check permissions - only author, admin, or super_admin can edit
    if (existingNote.author.toString() !== req.user._id.toString() && 
        !['admin', 'super_admin'].includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'You can only edit your own notes'
      });
    }

    // Prepare update data
    const updateData = {};
    if (content !== undefined) updateData.content = content;
    if (type) updateData.type = type;
    if (priority) updateData.priority = priority;
    if (followUpRequired !== undefined) updateData.followUpRequired = followUpRequired;
    if (followUpDate) updateData.followUpDate = new Date(followUpDate);
    if (followUpCompleted !== undefined) updateData.followUpCompleted = followUpCompleted;

    // Process tags if provided
    if (tags !== undefined) {
      updateData.tags = tags ? tags.split(',').map(tag => tag.trim()).filter(tag => tag) : [];
    }

    // Add edit history if content changed
    if (content !== undefined && content !== existingNote.content) {
      existingNote.addEditHistory(
        req.user._id,
        req.user.name,
        existingNote.content,
        'Note content updated'
      );
    }

    // Update note
    const updatedNote = await Note.findByIdAndUpdate(
      noteId,
      updateData,
      { new: true, runValidators: true }
    ).populate('author', 'name')
     .populate('lastEditedBy', 'name')
     .populate('relatedHearing', 'date type');

    res.json({
      success: true,
      message: 'Note updated successfully',
      data: { note: updatedNote }
    });

  } catch (error) {
    console.error('Update note error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating note'
    });
  }
});

// @desc    Delete note
// @route   DELETE /api/notes/:id
// @access  Private (Author or Admin+)
router.delete('/:id', [
  logUserAction('delete_note')
], async (req, res) => {
  try {
    const note = await Note.findById(req.params.id);
    if (!note) {
      return res.status(404).json({
        success: false,
        message: 'Note not found'
      });
    }

    // Check permissions - only author, admin, or super_admin can delete
    if (note.author.toString() !== req.user._id.toString() && 
        !['admin', 'super_admin'].includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'You can only delete your own notes'
      });
    }

    await Note.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'Note deleted successfully'
    });

  } catch (error) {
    console.error('Delete note error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting note'
    });
  }
});

// @desc    Get notes requiring follow-up
// @route   GET /api/notes/follow-up
// @access  Private
router.get('/follow-up', async (req, res) => {
  try {
    const notes = await Note.getNotesRequiringFollowUp();

    res.json({
      success: true,
      data: { notes }
    });

  } catch (error) {
    console.error('Get follow-up notes error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching follow-up notes'
    });
  }
});

// @desc    Mark follow-up as completed
// @route   PUT /api/notes/:id/complete-followup
// @access  Private
router.put('/:id/complete-followup', async (req, res) => {
  try {
    const note = await Note.findById(req.params.id);
    if (!note) {
      return res.status(404).json({
        success: false,
        message: 'Note not found'
      });
    }

    // Check permissions
    if (note.author.toString() !== req.user._id.toString() && 
        !['admin', 'super_admin'].includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'You can only update your own notes'
      });
    }

    note.followUpCompleted = true;
    await note.save();

    res.json({
      success: true,
      message: 'Follow-up marked as completed',
      data: { note }
    });

  } catch (error) {
    console.error('Complete follow-up error:', error);
    res.status(500).json({
      success: false,
      message: 'Error completing follow-up'
    });
  }
});

// @desc    Get note statistics
// @route   GET /api/notes/stats
// @access  Private
router.get('/stats/overview', async (req, res) => {
  try {
    const stats = await Note.aggregate([
      {
        $group: {
          _id: null,
          totalNotes: { $sum: 1 },
          notesByType: {
            $push: '$type'
          },
          notesByPriority: {
            $push: '$priority'
          },
          pendingFollowUps: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $eq: ['$followUpRequired', true] },
                    { $eq: ['$followUpCompleted', false] }
                  ]
                },
                1,
                0
              ]
            }
          }
        }
      }
    ]);

    // Get notes by author
    const notesByAuthor = await Note.aggregate([
      {
        $group: {
          _id: '$authorName',
          count: { $sum: 1 }
        }
      },
      {
        $sort: { count: -1 }
      }
    ]);

    res.json({
      success: true,
      data: {
        overview: stats[0] || {
          totalNotes: 0,
          notesByType: [],
          notesByPriority: [],
          pendingFollowUps: 0
        },
        notesByAuthor
      }
    });

  } catch (error) {
    console.error('Get note stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching note statistics'
    });
  }
});

module.exports = router;