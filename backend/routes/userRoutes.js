const express = require('express');
const { body, validationResult, query } = require('express-validator');
const User = require('../models/User');
const { requireRole, logUserAction } = require('../middleware/auth');

const router = express.Router();

// @desc    Get all users
// @route   GET /api/users
// @access  Private (Admin+)
router.get('/', [
  requireRole(['admin', 'super_admin']),
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  query('role').optional().isIn(['staff', 'admin', 'super_admin']),
  query('status').optional().isIn(['active', 'inactive']),
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

    const {
      page = 1,
      limit = 10,
      role,
      status,
      search
    } = req.query;

    // Build filter object
    const filter = {};
    
    if (role) filter.role = role;
    if (status) filter.status = status;

    // Search functionality
    if (search) {
      filter.$or = [
        { name: new RegExp(search, 'i') },
        { email: new RegExp(search, 'i') },
        { department: new RegExp(search, 'i') }
      ];
    }

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Get users with population
    const users = await User.find(filter)
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    // Get total count for pagination
    const totalUsers = await User.countDocuments(filter);
    const totalPages = Math.ceil(totalUsers / parseInt(limit));

    res.json({
      success: true,
      data: {
        users,
        pagination: {
          currentPage: parseInt(page),
          totalPages,
          totalUsers,
          hasNext: page < totalPages,
          hasPrev: page > 1
        }
      }
    });

  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching users'
    });
  }
});

// @desc    Get single user by ID
// @route   GET /api/users/:id
// @access  Private (Admin+)
router.get('/:id', requireRole(['admin', 'super_admin']), async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .populate('createdBy', 'name email');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      data: { user }
    });

  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching user'
    });
  }
});

// @desc    Update user
// @route   PUT /api/users/:id
// @access  Private (Admin+)
router.put('/:id', [
  requireRole(['admin', 'super_admin']),
  logUserAction('update_user'),
  body('name')
    .optional()
    .isLength({ min: 2, max: 100 })
    .withMessage('Name must be between 2 and 100 characters'),
  body('email')
    .optional()
    .isEmail()
    .withMessage('Please enter a valid email')
    .normalizeEmail(),
  body('role')
    .optional()
    .isIn(['staff', 'admin', 'super_admin'])
    .withMessage('Invalid role'),
  body('status')
    .optional()
    .isIn(['active', 'inactive'])
    .withMessage('Invalid status'),
  body('phoneNumber')
    .optional()
    .isMobilePhone()
    .withMessage('Please enter a valid phone number'),
  body('department')
    .optional()
    .isLength({ max: 100 })
    .withMessage('Department name cannot exceed 100 characters')
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

    const userId = req.params.id;
    const updates = req.body;

    // Find the user to update
    const userToUpdate = await User.findById(userId);
    if (!userToUpdate) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Check if current user can update this user's role
    if (updates.role && !req.user.canPerformAction('manage_users', updates.role)) {
      return res.status(403).json({
        success: false,
        message: 'You cannot assign this role'
      });
    }

    // Check if current user can update this user (cannot update higher or equal role)
    if (!req.user.canPerformAction('manage_users', userToUpdate.role)) {
      return res.status(403).json({
        success: false,
        message: 'You cannot update this user'
      });
    }

    // Check email uniqueness if email is being updated
    if (updates.email && updates.email !== userToUpdate.email) {
      const existingUser = await User.findOne({ 
        email: updates.email,
        _id: { $ne: userId }
      });
      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: 'Email already exists'
        });
      }
    }

    // Update user
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      updates,
      { new: true, runValidators: true }
    ).populate('createdBy', 'name email');

    res.json({
      success: true,
      message: 'User updated successfully',
      data: { user: updatedUser }
    });

  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating user'
    });
  }
});

// @desc    Delete user
// @route   DELETE /api/users/:id
// @access  Private (Admin+)
router.delete('/:id', [
  requireRole(['admin', 'super_admin']),
  logUserAction('delete_user')
], async (req, res) => {
  try {
    const userId = req.params.id;

    // Find the user to delete
    const userToDelete = await User.findById(userId);
    if (!userToDelete) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Check if current user can delete this user
    if (!req.user.canPerformAction('manage_users', userToDelete.role)) {
      return res.status(403).json({
        success: false,
        message: 'You cannot delete this user'
      });
    }

    // Prevent deleting self
    if (userId === req.user._id.toString()) {
      return res.status(400).json({
        success: false,
        message: 'You cannot delete your own account'
      });
    }

    // Check if this is the last super admin
    if (userToDelete.role === 'super_admin') {
      const superAdminCount = await User.countDocuments({ 
        role: 'super_admin',
        status: 'active'
      });
      if (superAdminCount <= 1) {
        return res.status(400).json({
          success: false,
          message: 'Cannot delete the last super admin'
        });
      }
    }

    // Instead of hard delete, we'll set status to inactive
    // This preserves data integrity for cases, notes, etc.
    await User.findByIdAndUpdate(userId, { status: 'inactive' });

    res.json({
      success: true,
      message: 'User deactivated successfully'
    });

  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting user'
    });
  }
});

// @desc    Reset user password
// @route   PUT /api/users/:id/reset-password
// @access  Private (Admin+)
router.put('/:id/reset-password', [
  requireRole(['admin', 'super_admin']),
  logUserAction('reset_password'),
  body('newPassword')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters')
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

    const userId = req.params.id;
    const { newPassword } = req.body;

    // Find the user
    const userToUpdate = await User.findById(userId);
    if (!userToUpdate) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Check permissions
    if (!req.user.canPerformAction('manage_users', userToUpdate.role)) {
      return res.status(403).json({
        success: false,
        message: 'You cannot reset this user\'s password'
      });
    }

    // Update password
    userToUpdate.password = newPassword;
    await userToUpdate.save();

    res.json({
      success: true,
      message: 'Password reset successfully'
    });

  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({
      success: false,
      message: 'Error resetting password'
    });
  }
});

// @desc    Get user statistics
// @route   GET /api/users/stats
// @access  Private (Admin+)
router.get('/stats/overview', requireRole(['admin', 'super_admin']), async (req, res) => {
  try {
    const stats = await User.aggregate([
      {
        $group: {
          _id: null,
          totalUsers: { $sum: 1 },
          activeUsers: {
            $sum: { $cond: [{ $eq: ['$status', 'active'] }, 1, 0] }
          },
          inactiveUsers: {
            $sum: { $cond: [{ $eq: ['$status', 'inactive'] }, 1, 0] }
          },
          superAdmins: {
            $sum: { $cond: [{ $eq: ['$role', 'super_admin'] }, 1, 0] }
          },
          admins: {
            $sum: { $cond: [{ $eq: ['$role', 'admin'] }, 1, 0] }
          },
          staff: {
            $sum: { $cond: [{ $eq: ['$role', 'staff'] }, 1, 0] }
          }
        }
      }
    ]);

    // Get users by department
    const usersByDepartment = await User.aggregate([
      {
        $match: { 
          status: 'active',
          department: { $exists: true, $ne: null, $ne: '' }
        }
      },
      {
        $group: {
          _id: '$department',
          count: { $sum: 1 }
        }
      },
      {
        $sort: { count: -1 }
      }
    ]);

    // Get recent registrations (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const recentRegistrations = await User.countDocuments({
      createdAt: { $gte: thirtyDaysAgo }
    });

    res.json({
      success: true,
      data: {
        overview: stats[0] || {
          totalUsers: 0,
          activeUsers: 0,
          inactiveUsers: 0,
          superAdmins: 0,
          admins: 0,
          staff: 0
        },
        usersByDepartment,
        recentRegistrations
      }
    });

  } catch (error) {
    console.error('Get user stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching user statistics'
    });
  }
});

// @desc    Get users by role
// @route   GET /api/users/role/:role
// @access  Private (Admin+)
router.get('/role/:role', [
  requireRole(['admin', 'super_admin'])
], async (req, res) => {
  try {
    const { role } = req.params;
    const { status = 'active' } = req.query;

    if (!['staff', 'admin', 'super_admin'].includes(role)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid role'
      });
    }

    const users = await User.find({ role, status })
      .select('name email department phoneNumber createdAt lastLogin')
      .sort({ name: 1 });

    res.json({
      success: true,
      data: { users }
    });

  } catch (error) {
    console.error('Get users by role error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching users by role'
    });
  }
});

module.exports = router;