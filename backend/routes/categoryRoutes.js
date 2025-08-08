const express = require('express');
const { body, validationResult } = require('express-validator');
const Category = require('../models/Category');
const { authenticateToken, logUserAction } = require('../middleware/auth');

const router = express.Router();

// @desc    Get all categories
// @route   GET /api/categories
// @access  Private
router.get('/', async (req, res) => {
  try {
    console.log('📂 GET /api/categories - Fetching all categories');
    
    const categories = await Category.getCategoriesWithCaseCounts();

    res.json({
      success: true,
      data: { categories }
    });

  } catch (error) {
    console.error('❌ Get categories error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching categories'
    });
  }
});

// @desc    Get single category by ID
// @route   GET /api/categories/:id
// @access  Private
router.get('/:id', async (req, res) => {
  try {
    const category = await Category.findById(req.params.id)
      .populate('createdBy', 'name email')
      .populate('lastUpdatedBy', 'name email');

    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }

    res.json({
      success: true,
      data: { category }
    });

  } catch (error) {
    console.error('❌ Get category error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching category'
    });
  }
});

// @desc    Create new category
// @route   POST /api/categories
// @access  Private
router.post('/', [
  logUserAction('create_category'),
  body('name')
    .notEmpty()
    .withMessage('Category name is required')
    .isLength({ max: 100 })
    .withMessage('Name cannot exceed 100 characters'),
  body('identifier')
    .optional()
    .matches(/^[a-z0-9-_]+$/)
    .withMessage('Identifier can only contain lowercase letters, numbers, hyphens and underscores'),
  body('description')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Description cannot exceed 500 characters'),
  body('icon')
    .optional()
    .isString(),
  body('color')
    .optional()
    .isString(),
  body('iconColor')
    .optional()
    .isString()
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

    const { name, identifier, description, icon, color, iconColor } = req.body;

    // Check if category with same identifier already exists
    const existingCategory = await Category.findOne({ 
      identifier: identifier || name.toLowerCase().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-')
    });
    
    if (existingCategory) {
      return res.status(400).json({
        success: false,
        message: 'Category with this identifier already exists'
      });
    }

    const category = new Category({
      name,
      identifier,
      description,
      icon,
      color,
      iconColor,
      createdBy: req.user._id,
      lastUpdatedBy: req.user._id
    });

    await category.save();

    const populatedCategory = await Category.findById(category._id)
      .populate('createdBy', 'name email');

    res.status(201).json({
      success: true,
      message: 'Category created successfully',
      data: { category: populatedCategory }
    });

  } catch (error) {
    console.error('❌ Create category error:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating category'
    });
  }
});

// @desc    Update category
// @route   PUT /api/categories/:id
// @access  Private
router.put('/:id', [
  logUserAction('update_category'),
  body('name')
    .optional()
    .isLength({ max: 100 })
    .withMessage('Name cannot exceed 100 characters'),
  body('description')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Description cannot exceed 500 characters'),
  body('isActive')
    .optional()
    .isBoolean()
    .withMessage('isActive must be boolean')
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

    const categoryId = req.params.id;
    const updates = req.body;

    const category = await Category.findByIdAndUpdate(
      categoryId,
      {
        ...updates,
        lastUpdatedBy: req.user._id
      },
      { new: true, runValidators: true }
    ).populate('createdBy', 'name email')
     .populate('lastUpdatedBy', 'name email');

    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }

    res.json({
      success: true,
      message: 'Category updated successfully',
      data: { category }
    });

  } catch (error) {
    console.error('❌ Update category error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating category'
    });
  }
});

// @desc    Delete category
// @route   DELETE /api/categories/:id
// @access  Private (Admin+)
router.delete('/:id', [
  logUserAction('delete_category')
], async (req, res) => {
  try {
    // Check if user has permission
    if (!['admin', 'super_admin'].includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Only administrators can delete categories'
      });
    }

    const categoryId = req.params.id;

    // Check if category has active cases
    const Case = require('../models/Case');
    const caseCount = await Case.countDocuments({ 
      category: { $exists: true },
      status: { $ne: 'Closed' }
    });

    if (caseCount > 0) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete category with active cases. Please close or reassign all cases first.'
      });
    }

    const category = await Category.findByIdAndDelete(categoryId);
    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }

    res.json({
      success: true,
      message: 'Category deleted successfully'
    });

  } catch (error) {
    console.error('❌ Delete category error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting category'
    });
  }
});

// @desc    Create subcategory
// @route   POST /api/categories/:id/subcategories
// @access  Private
router.post('/:id/subcategories', [
  logUserAction('create_subcategory'),
  body('name')
    .notEmpty()
    .withMessage('Subcategory name is required')
    .isLength({ max: 100 })
    .withMessage('Name cannot exceed 100 characters'),
  body('description')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Description cannot exceed 500 characters')
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

    const categoryId = req.params.id;
    const { name, description } = req.body;

    const category = await Category.findById(categoryId);
    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }

    // Check if subcategory with same name already exists
    const existingSubcategory = category.subcategories.find(sub => 
      sub.name.toLowerCase() === name.toLowerCase()
    );

    if (existingSubcategory) {
      return res.status(400).json({
        success: false,
        message: 'Subcategory with this name already exists'
      });
    }

    await category.addSubcategory({ name, description }, req.user._id);

    const updatedCategory = await Category.findById(categoryId)
      .populate('createdBy', 'name email')
      .populate('lastUpdatedBy', 'name email');

    res.status(201).json({
      success: true,
      message: 'Subcategory created successfully',
      data: { category: updatedCategory }
    });

  } catch (error) {
    console.error('❌ Create subcategory error:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating subcategory'
    });
  }
});

// @desc    Update subcategory
// @route   PUT /api/categories/:id/subcategories/:subId
// @access  Private
router.put('/:id/subcategories/:subId', [
  logUserAction('update_subcategory'),
  body('name')
    .optional()
    .isLength({ max: 100 })
    .withMessage('Name cannot exceed 100 characters'),
  body('description')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Description cannot exceed 500 characters'),
  body('isActive')
    .optional()
    .isBoolean()
    .withMessage('isActive must be boolean')
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

    const { id: categoryId, subId: subcategoryId } = req.params;
    const updates = req.body;

    const category = await Category.findById(categoryId);
    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }

    await category.updateSubcategory(subcategoryId, updates, req.user._id);

    const updatedCategory = await Category.findById(categoryId)
      .populate('createdBy', 'name email')
      .populate('lastUpdatedBy', 'name email');

    res.json({
      success: true,
      message: 'Subcategory updated successfully',
      data: { category: updatedCategory }
    });

  } catch (error) {
    console.error('❌ Update subcategory error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error updating subcategory'
    });
  }
});

// @desc    Delete subcategory
// @route   DELETE /api/categories/:id/subcategories/:subId
// @access  Private (Admin+)
router.delete('/:id/subcategories/:subId', [
  logUserAction('delete_subcategory')
], async (req, res) => {
  try {
    // Check if user has permission
    if (!['admin', 'super_admin'].includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Only administrators can delete subcategories'
      });
    }

    const { id: categoryId, subId: subcategoryId } = req.params;

    const category = await Category.findById(categoryId);
    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }

    const subcategory = category.subcategories.id(subcategoryId);
    if (!subcategory) {
      return res.status(404).json({
        success: false,
        message: 'Subcategory not found'
      });
    }

    // Check if subcategory has active cases
    const Case = require('../models/Case');
    const caseCount = await Case.countDocuments({ 
      subcategory: subcategory.name,
      status: { $ne: 'Closed' }
    });

    if (caseCount > 0) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete subcategory with active cases. Please close or reassign all cases first.'
      });
    }

    await category.removeSubcategory(subcategoryId, req.user._id);

    res.json({
      success: true,
      message: 'Subcategory deleted successfully'
    });

  } catch (error) {
    console.error('❌ Delete subcategory error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting subcategory'
    });
  }
});

// @desc    Initialize default categories
// @route   POST /api/categories/initialize
// @access  Private (Super Admin only)
router.post('/initialize', async (req, res) => {
  try {
    if (req.user.role !== 'super_admin') {
      return res.status(403).json({
        success: false,
        message: 'Only Super Admin can initialize default categories'
      });
    }

    // Check if categories already exist
    const existingCategories = await Category.countDocuments();
    if (existingCategories > 0) {
      return res.status(400).json({
        success: false,
        message: 'Categories already exist. Use regular create/update endpoints.'
      });
    }

    // Default categories data
    const defaultCategories = [
      {
        name: 'Financial Cases',
        identifier: 'financial',
        description: 'Loan settlements, debt recovery, and bankruptcy cases',
        icon: 'ri-money-dollar-circle-line',
        color: 'bg-green-50 border-green-200 hover:bg-green-100',
        iconColor: 'text-green-600',
        subcategories: [
          { name: 'Loan Settlement', description: 'Mortgage and personal loan settlements' },
          { name: 'Debt Recovery', description: 'Collection and recovery cases' },
          { name: 'Bankruptcy', description: 'Corporate and personal bankruptcy' }
        ]
      },
      {
        name: 'Property Deeds',
        identifier: 'deeds',
        description: 'Property transfers, title disputes, and registrations',
        icon: 'ri-home-4-line',
        color: 'bg-blue-50 border-blue-200 hover:bg-blue-100',
        iconColor: 'text-blue-600',
        subcategories: [
          { name: 'Property Transfer', description: 'Ownership transfer documentation' },
          { name: 'Title Dispute', description: 'Property ownership disputes' },
          { name: 'Registration', description: 'Property registration matters' }
        ]
      },
      {
        name: 'Criminal Cases',
        identifier: 'criminal',
        description: 'Criminal defense, prosecution, and appeals',
        icon: 'ri-scales-3-line',
        color: 'bg-red-50 border-red-200 hover:bg-red-100',
        iconColor: 'text-red-600',
        subcategories: [
          { name: 'Defense', description: 'Criminal defense representation' },
          { name: 'Prosecution', description: 'State prosecution cases' },
          { name: 'Appeals', description: 'Criminal appeal proceedings' }
        ]
      },
      {
        name: 'Civil Litigation',
        identifier: 'civil',
        description: 'Contract disputes, personal injury, and tort cases',
        icon: 'ri-file-text-line',
        color: 'bg-purple-50 border-purple-200 hover:bg-purple-100',
        iconColor: 'text-purple-600',
        subcategories: [
          { name: 'Contract Dispute', description: 'Business and personal contracts' },
          { name: 'Personal Injury', description: 'Accident and injury claims' },
          { name: 'Torts', description: 'Civil wrong and damages' }
        ]
      },
      {
        name: 'Family Law',
        identifier: 'family',
        description: 'Divorce, custody, adoption, and domestic relations',
        icon: 'ri-group-line',
        color: 'bg-orange-50 border-orange-200 hover:bg-orange-100',
        iconColor: 'text-orange-600',
        subcategories: [
          { name: 'Divorce', description: 'Marriage dissolution proceedings' },
          { name: 'Custody', description: 'Child custody and support' },
          { name: 'Adoption', description: 'Adoption proceedings' }
        ]
      },
      {
        name: 'Corporate Law',
        identifier: 'corporate',
        description: 'Business formation, contracts, and compliance',
        icon: 'ri-building-line',
        color: 'bg-indigo-50 border-indigo-200 hover:bg-indigo-100',
        iconColor: 'text-indigo-600',
        subcategories: [
          { name: 'Formation', description: 'Company setup and structure' },
          { name: 'Contracts', description: 'Business agreements' },
          { name: 'Compliance', description: 'Regulatory compliance matters' }
        ]
      }
    ];

    // Create categories
    const createdCategories = [];
    for (const categoryData of defaultCategories) {
      const { subcategories, ...categoryInfo } = categoryData;
      
      const category = new Category({
        ...categoryInfo,
        createdBy: req.user._id,
        lastUpdatedBy: req.user._id
      });

      // Add subcategories
      for (const subData of subcategories) {
        category.subcategories.push({
          ...subData,
          createdBy: req.user._id
        });
      }

      await category.save();
      createdCategories.push(category);
    }

    res.status(201).json({
      success: true,
      message: `${createdCategories.length} default categories initialized successfully`,
      data: { categories: createdCategories }
    });

  } catch (error) {
    console.error('❌ Initialize categories error:', error);
    res.status(500).json({
      success: false,
      message: 'Error initializing categories'
    });
  }
});

module.exports = router;