const express = require('express');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const { authenticateToken } = require('../middleware/auth');

// Try to import optional services
let Notification = null;
let emailService = null;

try {
  Notification = require('../models/Notification');
} catch (error) {
  console.log('⚠️ Notification model not found - notifications disabled');
}

try {
  emailService = require('../services/emailService');
} catch (error) {
  console.log('⚠️ Email service not found - email notifications disabled');
}

const router = express.Router();

// Generate JWT token
const generateToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d'
  });
};

// Generate temporary password
const generateTempPassword = () => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
  let password = '';
  for (let i = 0; i < 12; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
};

// @desc    Register user (only admins and super_admin can register new users)
// @route   POST /api/auth/register
// @access  Private (Admin+)
router.post('/register', [
  authenticateToken,
  body('name')
    .notEmpty()
    .withMessage('Name is required')
    .isLength({ min: 2, max: 100 })
    .withMessage('Name must be between 2 and 100 characters'),
  body('email')
    .isEmail()
    .withMessage('Please enter a valid email')
    .normalizeEmail(),
  body('password')
    .optional()
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters'),
  body('role')
    .isIn(['staff', 'admin', 'super_admin'])
    .withMessage('Invalid role'),
  body('phoneNumber')
    .optional()
    .isMobilePhone()
    .withMessage('Please enter a valid phone number'),
  body('department')
    .optional()
    .isLength({ max: 100 })
    .withMessage('Department name cannot exceed 100 characters'),
  body('sendEmail')
    .optional()
    .isBoolean()
    .withMessage('sendEmail must be boolean')
], async (req, res) => {
  try {
    // Check validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { name, email, password, role, phoneNumber, department, sendEmail = true } = req.body;

    // Check if user can create this role
    if (!req.user.canPerformAction('manage_users', role)) {
      return res.status(403).json({
        success: false,
        message: 'You cannot create users with this role'
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User with this email already exists'
      });
    }

    // Generate temporary password if not provided
    const tempPassword = password || generateTempPassword();

    // Create user
    const user = new User({
      name,
      email,
      password: tempPassword,
      role,
      phoneNumber,
      department,
      createdBy: req.user._id
    });

    await user.save();

    console.log('✅ User created successfully:', email, 'Role:', role);

    // Create welcome notification for the new user (if Notification model exists)
    if (Notification) {
      try {
        await Notification.createNotification({
          recipient: user._id,
          type: 'staff_registered',
          title: 'Welcome to Law Case Management System',
          message: `Your account has been created by ${req.user.name}. Please check your email for login details.`,
          priority: 'high',
          createdBy: req.user._id,
          data: {
            userId: user._id,
            metadata: {
              createdBy: req.user.name,
              role: user.role
            }
          }
        });
        console.log('✅ Welcome notification created for user');
      } catch (notificationError) {
        console.error('⚠️ Error creating welcome notification:', notificationError);
        // Don't fail the registration if notification fails
      }
    }

    // Send email notification if requested and email service is available
    let emailSent = false;
    if (sendEmail && emailService) {
      try {
        console.log('📧 Attempting to send registration email to:', email);
        
        emailSent = await emailService.sendStaffRegistrationNotification(
          email,
          {
            name: user.name,
            role: user.role,
            department: user.department
          },
          tempPassword,
          req.user.name
        );

        if (emailSent) {
          console.log('✅ Registration email sent successfully to:', email);
        } else {
          console.log('⚠️ Registration email failed to send to:', email);
        }
      } catch (emailError) {
        console.error('❌ Error sending registration email:', emailError);
        // Don't fail the registration if email fails
      }
    }

    // Notify admins about new user registration (if Notification model exists)
    if (Notification) {
      try {
        const adminUsers = await User.find({ 
          role: { $in: ['admin', 'super_admin'] }, 
          status: 'active',
          _id: { $ne: user._id } // Don't notify the user themselves
        });

        for (const admin of adminUsers) {
          await Notification.createNotification({
            recipient: admin._id,
            type: 'staff_registered',
            title: 'New User Registered',
            message: `A new ${role} user "${name}" has been registered by ${req.user.name}.`,
            priority: 'medium',
            createdBy: req.user._id,
            data: {
              userId: user._id,
              metadata: {
                newUserName: name,
                newUserEmail: email,
                newUserRole: role,
                registeredBy: req.user.name
              }
            }
          });
        }
        console.log('✅ Admin notifications created for new user registration');
      } catch (adminNotificationError) {
        console.error('⚠️ Error creating admin notifications:', adminNotificationError);
      }
    }

    res.status(201).json({
      success: true,
      message: `User created successfully${emailSent ? ' and welcome email sent' : emailService ? ' (email notification failed)' : ''}`,
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          status: user.status,
          department: user.department,
          phoneNumber: user.phoneNumber,
          createdAt: user.createdAt
        },
        emailSent: emailSent,
        tempPassword: password ? undefined : tempPassword // Only show temp password if it was generated
      }
    });

  } catch (error) {
    console.error('❌ Registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating user',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
router.post('/login', [
  body('email')
    .isEmail()
    .withMessage('Please enter a valid email')
    .normalizeEmail(),
  body('password')
    .notEmpty()
    .withMessage('Password is required')
], async (req, res) => {
  try {
    // Check validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { email, password } = req.body;

    // Check if user exists
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Check if account is active
    if (user.status !== 'active') {
      return res.status(401).json({
        success: false,
        message: 'Account is inactive. Please contact administrator.'
      });
    }

    // Check password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    // Generate token
    const token = generateToken(user._id);

    console.log('✅ User logged in successfully:', email);

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        token,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          status: user.status,
          lastLogin: user.lastLogin,
          phoneNumber: user.phoneNumber,
          department: user.department
        }
      }
    });

  } catch (error) {
    console.error('❌ Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Error during login'
    });
  }
});

// @desc    Get current user
// @route   GET /api/auth/me
// @access  Private
router.get('/me', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .populate('createdBy', 'name email');

    res.json({
      success: true,
      data: {
        user
      }
    });
  } catch (error) {
    console.error('❌ Get current user error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching user data'
    });
  }
});

// @desc    Update current user profile
// @route   PUT /api/auth/profile
// @access  Private
router.put('/profile', [
  authenticateToken,
  body('name')
    .optional()
    .isLength({ min: 2, max: 100 })
    .withMessage('Name must be between 2 and 100 characters'),
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

    const { name, phoneNumber, department } = req.body;

    const user = await User.findByIdAndUpdate(
      req.user._id,
      {
        ...(name && { name }),
        ...(phoneNumber && { phoneNumber }),
        ...(department && { department })
      },
      { new: true, runValidators: true }
    );

    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: { user }
    });

  } catch (error) {
    console.error('❌ Profile update error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating profile'
    });
  }
});

// @desc    Change password
// @route   PUT /api/auth/change-password
// @access  Private
router.put('/change-password', [
  authenticateToken,
  body('currentPassword')
    .notEmpty()
    .withMessage('Current password is required'),
  body('newPassword')
    .isLength({ min: 6 })
    .withMessage('New password must be at least 6 characters')
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

    const { currentPassword, newPassword } = req.body;

    // Get user with password
    const user = await User.findById(req.user._id).select('+password');

    // Verify current password
    const isCurrentPasswordValid = await user.comparePassword(currentPassword);
    if (!isCurrentPasswordValid) {
      return res.status(400).json({
        success: false,
        message: 'Current password is incorrect'
      });
    }

    // Update password
    user.password = newPassword;
    await user.save();

    console.log('✅ Password changed successfully for user:', user.email);

    res.json({
      success: true,
      message: 'Password changed successfully'
    });

  } catch (error) {
    console.error('❌ Change password error:', error);
    res.status(500).json({
      success: false,
      message: 'Error changing password'
    });
  }
});

// @desc    Refresh token
// @route   POST /api/auth/refresh
// @access  Private
router.post('/refresh', authenticateToken, async (req, res) => {
  try {
    const token = generateToken(req.user._id);

    res.json({
      success: true,
      data: { token }
    });

  } catch (error) {
    console.error('❌ Token refresh error:', error);
    res.status(500).json({
      success: false,
      message: 'Error refreshing token'
    });
  }
});

// @desc    Test email service
// @route   POST /api/auth/test-email
// @access  Private (Admin+)
router.post('/test-email', [
  authenticateToken,
  body('email')
    .isEmail()
    .withMessage('Please enter a valid email')
    .normalizeEmail(),
  body('message')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Message cannot exceed 500 characters')
], async (req, res) => {
  try {
    // Check if user has permission
    if (!['admin', 'super_admin'].includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Only administrators can test email service'
      });
    }

    if (!emailService) {
      return res.status(503).json({
        success: false,
        message: 'Email service is not available'
      });
    }

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { email, message } = req.body;

    console.log('📧 Testing email service...');
    const result = await emailService.sendTestEmail(email, message);

    if (result.success) {
      res.json({
        success: true,
        message: 'Test email sent successfully',
        data: {
          emailId: result.data?.id,
          recipient: email
        }
      });
    } else {
      res.status(500).json({
        success: false,
        message: 'Test email failed to send',
        error: result.error
      });
    }

  } catch (error) {
    console.error('❌ Test email error:', error);
    res.status(500).json({
      success: false,
      message: 'Error testing email service'
    });
  }
});

module.exports = router;