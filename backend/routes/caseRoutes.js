const express = require('express');
const { body, validationResult, query } = require('express-validator');
const Case = require('../models/Case');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// @desc    Get all cases with filtering and pagination
// @route   GET /api/cases
// @access  Private
router.get('/', async (req, res) => {
  try {
    console.log('📋 GET /api/cases - Fetching all cases');
    console.log('Query params:', req.query);
    console.log('User:', req.user.name, req.user.role);

    const {
      page = 1,
      limit = 10,
      category,
      subcategory,
      status,
      priority,
      search,
      inactive,
      assignedLawyer
    } = req.query;

    // Build filter object
    const filter = {};

    if (category) filter.category = category;
    if (subcategory) filter.subcategory = subcategory;
    if (status) filter.status = status;
    if (priority) filter.priority = priority;
    if (assignedLawyer) filter.assignedLawyer = new RegExp(assignedLawyer, 'i');
    
    // Filter for inactive cases
    if (inactive === 'true') {
      filter.isInactive = true;
    }

    // Search functionality
    if (search) {
      filter.$or = [
        { referenceNumber: new RegExp(search, 'i') },
        { title: new RegExp(search, 'i') },
        { clientNames: { $elemMatch: { $regex: search, $options: 'i' } } },
        { description: new RegExp(search, 'i') }
      ];
    }

    console.log('Applied filters:', filter);

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Get cases with population
    const cases = await Case.find(filter)
      .populate('createdBy', 'name')
      .populate('lastUpdatedBy', 'name')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    // Get total count for pagination
    const totalCases = await Case.countDocuments(filter);
    const totalPages = Math.ceil(totalCases / parseInt(limit));

    console.log(`✅ Found ${cases.length} cases out of ${totalCases} total`);

    res.json({
      success: true,
      data: {
        cases,
        pagination: {
          currentPage: parseInt(page),
          totalPages,
          totalCases,
          hasNext: page < totalPages,
          hasPrev: page > 1
        }
      }
    });

  } catch (error) {
    console.error('❌ Get cases error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching cases'
    });
  }
});

// @desc    Get single case by ID
// @route   GET /api/cases/:id
// @access  Private
router.get('/:id', async (req, res) => {
  try {
    console.log('📋 GET /api/cases/:id - Fetching case:', req.params.id);

    const case_doc = await Case.findById(req.params.id)
      .populate('createdBy', 'name email')
      .populate('lastUpdatedBy', 'name email')
      .populate({
        path: 'editLogs.editedBy',
        select: 'name email'
      });

    if (!case_doc) {
      console.log('❌ Case not found:', req.params.id);
      return res.status(404).json({
        success: false,
        message: 'Case not found'
      });
    }

    console.log('✅ Case found:', case_doc.referenceNumber);

    res.json({
      success: true,
      data: { case: case_doc }
    });

  } catch (error) {
    console.error('❌ Get case error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching case'
    });
  }
});

// @desc    Create new case
// @route   POST /api/cases
// @access  Private
router.post('/', [
  body('referenceNumber')
    .notEmpty()
    .withMessage('Reference number is required')
    .isLength({ max: 50 })
    .withMessage('Reference number cannot exceed 50 characters'),
  body('fileNumber')
    .notEmpty()
    .withMessage('File number is required')
    .isLength({ max: 50 })
    .withMessage('File number cannot exceed 50 characters'),
  body('caseNumber')
    .notEmpty()
    .withMessage('Case number is required')
    .isLength({ max: 50 })
    .withMessage('Case number cannot exceed 50 characters'),
  body('title')
    .notEmpty()
    .withMessage('Case title is required')
    .isLength({ max: 200 })
    .withMessage('Title cannot exceed 200 characters'),
  body('clientNames')
    .isArray({ min: 1 })
    .withMessage('At least one client name is required'),
  body('clientNames.*')
    .notEmpty()
    .withMessage('Client name cannot be empty'),
  body('category')
    .notEmpty()
    .withMessage('Category is required'),
  body('subcategory')
    .notEmpty()
    .withMessage('Subcategory is required'),
  body('description')
    .notEmpty()
    .withMessage('Description is required')
    .isLength({ max: 1000 })
    .withMessage('Description cannot exceed 1000 characters'),
  body('assignedLawyer')
    .notEmpty()
    .withMessage('Assigned lawyer is required'),
  body('priority')
    .optional()
    .isIn(['High', 'Medium', 'Low'])
    .withMessage('Invalid priority')
], async (req, res) => {
  try {
    console.log('📝 POST /api/cases - Creating new case');
    console.log('User:', req.user.name, req.user.email, req.user.role);
    console.log('Request body:', JSON.stringify(req.body, null, 2));

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log('❌ Validation errors:', errors.array());
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const {
      referenceNumber,
      fileNumber,
      caseNumber,
      title,
      clientNames,
      category,
      subcategory,
      description,
      assignedLawyer,
      priority = 'Medium',
      courtName,
      judgeAssigned
    } = req.body;

    console.log('✅ Validation passed');

    // Check for duplicate reference numbers
    const existingCase = await Case.findOne({
      $or: [
        { referenceNumber },
        { fileNumber },
        { caseNumber }
      ]
    });

    if (existingCase) {
      return res.status(400).json({
        success: false,
        message: 'A case with this reference number, file number, or case number already exists'
      });
    }

    // Create new case with manual reference numbers
    const newCase = new Case({
      referenceNumber,
      fileNumber,
      caseNumber,
      title,
      clientNames,
      category,
      subcategory,
      description,
      assignedLawyer,
      priority,
      courtName,
      judgeAssigned,
      createdBy: req.user._id,
      lastUpdatedBy: req.user._id
    });

    console.log('💾 Saving case to database...');

    // Add creation log
    newCase.addEditLog(
      req.user._id,
      req.user.name,
      'Case created',
      []
    );

    await newCase.save();

    console.log('✅ Case saved successfully with ID:', newCase._id);

    // Populate created case
    const populatedCase = await Case.findById(newCase._id)
      .populate('createdBy', 'name email')
      .populate('lastUpdatedBy', 'name email');

    console.log('🎉 Case creation completed successfully');

    res.status(201).json({
      success: true,
      message: 'Case created successfully',
      data: { case: populatedCase }
    });

  } catch (error) {
    console.error('❌ Create case error:', error);
    
    // Handle duplicate key errors
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern)[0];
      return res.status(400).json({
        success: false,
        message: `A case with this ${field} already exists`
      });
    }

    res.status(500).json({
      success: false,
      message: 'Error creating case',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// @desc    Update case
// @route   PUT /api/cases/:id
// @access  Private
router.put('/:id', [
  body('referenceNumber')
    .optional()
    .isLength({ max: 50 })
    .withMessage('Reference number cannot exceed 50 characters'),
  body('fileNumber')
    .optional()
    .isLength({ max: 50 })
    .withMessage('File number cannot exceed 50 characters'),
  body('caseNumber')
    .optional()
    .isLength({ max: 50 })
    .withMessage('Case number cannot exceed 50 characters'),
  body('title')
    .optional()
    .isLength({ max: 200 })
    .withMessage('Title cannot exceed 200 characters'),
  body('clientNames')
    .optional()
    .isArray({ min: 1 })
    .withMessage('At least one client name is required'),
  body('description')
    .optional()
    .isLength({ max: 1000 })
    .withMessage('Description cannot exceed 1000 characters'),
  body('status')
    .optional()
    .isIn(['Active', 'Pending', 'Closed'])
    .withMessage('Invalid status'),
  body('priority')
    .optional()
    .isIn(['High', 'Medium', 'Low'])
    .withMessage('Invalid priority')
], async (req, res) => {
  try {
    console.log('📝 PUT /api/cases/:id - Updating case:', req.params.id);
    console.log('User:', req.user.name, req.user.role);
    console.log('Updates:', req.body);

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const caseId = req.params.id;
    const updates = req.body;

    // Find the existing case
    const existingCase = await Case.findById(caseId);
    if (!existingCase) {
      return res.status(404).json({
        success: false,
        message: 'Case not found'
      });
    }

    // Check for duplicates if reference numbers are being updated
    if (updates.referenceNumber || updates.fileNumber || updates.caseNumber) {
      const duplicateCheck = {};
      if (updates.referenceNumber) duplicateCheck.referenceNumber = updates.referenceNumber;
      if (updates.fileNumber) duplicateCheck.fileNumber = updates.fileNumber;
      if (updates.caseNumber) duplicateCheck.caseNumber = updates.caseNumber;

      const existingDuplicate = await Case.findOne({
        $and: [
          { _id: { $ne: caseId } },
          { $or: Object.keys(duplicateCheck).map(key => ({ [key]: duplicateCheck[key] })) }
        ]
      });

      if (existingDuplicate) {
        return res.status(400).json({
          success: false,
          message: 'A case with this reference number, file number, or case number already exists'
        });
      }
    }

    // Track changed fields for audit log
    const changedFields = [];
    Object.keys(updates).forEach(key => {
      if (JSON.stringify(existingCase[key]) !== JSON.stringify(updates[key])) {
        changedFields.push({
          field: key,
          oldValue: existingCase[key],
          newValue: updates[key]
        });
      }
    });

    // Update case
    const updatedCase = await Case.findByIdAndUpdate(
      caseId,
      {
        ...updates,
        lastUpdatedBy: req.user._id
      },
      { new: true, runValidators: true }
    ).populate('createdBy', 'name email')
     .populate('lastUpdatedBy', 'name email');

    // Add edit log
    if (changedFields.length > 0) {
      updatedCase.addEditLog(
        req.user._id,
        req.user.name,
        `Case updated - ${changedFields.map(f => f.field).join(', ')} modified`,
        changedFields
      );
      await updatedCase.save();
    }

    console.log('✅ Case updated successfully');

    res.json({
      success: true,
      message: 'Case updated successfully',
      data: { case: updatedCase }
    });

  } catch (error) {
    console.error('❌ Update case error:', error);
    
    // Handle duplicate key errors
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern)[0];
      return res.status(400).json({
        success: false,
        message: `A case with this ${field} already exists`
      });
    }

    res.status(500).json({
      success: false,
      message: 'Error updating case'
    });
  }
});

// @desc    Delete case
// @route   DELETE /api/cases/:id
// @access  Private (Super Admin only)
router.delete('/:id', async (req, res) => {
  try {
    console.log('🗑️ DELETE /api/cases/:id - Deleting case:', req.params.id);
    console.log('User:', req.user.name, req.user.role);

    // Check if user has permission to delete
    if (req.user.role !== 'super_admin') {
      return res.status(403).json({
        success: false,
        message: 'Only Super Admin can delete cases'
      });
    }

    const caseId = req.params.id;

    const deletedCase = await Case.findByIdAndDelete(caseId);
    if (!deletedCase) {
      return res.status(404).json({
        success: false,
        message: 'Case not found'
      });
    }

    console.log('✅ Case deleted successfully');

    res.json({
      success: true,
      message: 'Case deleted successfully'
    });

  } catch (error) {
    console.error('❌ Delete case error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting case'
    });
  }
});

// @desc    Get cases by category
// @route   GET /api/cases/category/:category
// @access  Private
router.get('/category/:category', async (req, res) => {
  try {
    console.log('📂 GET /api/cases/category/:category - Category:', req.params.category);

    const { category } = req.params;
    const { subcategory } = req.query;

    const filter = { category };
    if (subcategory) {
      filter.subcategory = subcategory;
    }

    const cases = await Case.find(filter)
      .populate('createdBy', 'name')
      .sort({ createdAt: -1 });

    console.log(`✅ Found ${cases.length} cases in category ${category}`);

    res.json({
      success: true,
      data: { cases }
    });

  } catch (error) {
    console.error('❌ Get cases by category error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching cases by category'
    });
  }
});

// @desc    Get case statistics
// @route   GET /api/cases/stats/overview
// @access  Private
router.get('/stats/overview', async (req, res) => {
  try {
    console.log('📊 GET /api/cases/stats/overview - Fetching case statistics');

    const stats = await Case.aggregate([
      {
        $group: {
          _id: null,
          totalCases: { $sum: 1 },
          activeCases: {
            $sum: { $cond: [{ $eq: ['$status', 'Active'] }, 1, 0] }
          },
          pendingCases: {
            $sum: { $cond: [{ $eq: ['$status', 'Pending'] }, 1, 0] }
          },
          closedCases: {
            $sum: { $cond: [{ $eq: ['$status', 'Closed'] }, 1, 0] }
          },
          inactiveCases: {
            $sum: { $cond: ['$isInactive', 1, 0] }
          },
          highPriorityCases: {
            $sum: { $cond: [{ $eq: ['$priority', 'High'] }, 1, 0] }
          }
        }
      }
    ]);

    const categoryStats = await Case.aggregate([
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 },
          active: {
            $sum: { $cond: [{ $eq: ['$status', 'Active'] }, 1, 0] }
          }
        }
      }
    ]);

    console.log('✅ Statistics computed successfully');

    res.json({
      success: true,
      data: {
        overview: stats[0] || {
          totalCases: 0,
          activeCases: 0,
          pendingCases: 0,
          closedCases: 0,
          inactiveCases: 0,
          highPriorityCases: 0
        },
        byCategory: categoryStats
      }
    });

  } catch (error) {
    console.error('❌ Get case stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching case statistics'
    });
  }
});

module.exports = router;