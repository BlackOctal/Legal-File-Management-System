const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Authenticate JWT token
const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Access token required'
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId).select('-password');
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid token - user not found'
      });
    }

    if (user.status !== 'active') {
      return res.status(401).json({
        success: false,
        message: 'Account is inactive'
      });
    }

    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Invalid token'
      });
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token expired'
      });
    }
    
    console.error('Auth middleware error:', error);
    return res.status(500).json({
      success: false,
      message: 'Authentication error'
    });
  }
};

// Check if user has required role
const requireRole = (roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Insufficient permissions'
      });
    }

    next();
  };
};

// Check if user can perform specific action
const requirePermission = (action, targetRole = null) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    if (!req.user.canPerformAction(action, targetRole)) {
      return res.status(403).json({
        success: false,
        message: `You don't have permission to ${action.replace('_', ' ')}`
      });
    }

    next();
  };
};

// Middleware to check if user can access case
const canAccessCase = async (req, res, next) => {
  try {
    const caseId = req.params.caseId || req.params.id;
    
    if (!caseId) {
      return res.status(400).json({
        success: false,
        message: 'Case ID required'
      });
    }

    // For now, all authenticated users can access all cases
    // You can add more specific logic here if needed
    next();
  } catch (error) {
    console.error('Case access check error:', error);
    return res.status(500).json({
      success: false,
      message: 'Error checking case access'
    });
  }
};

// Middleware to log user actions
const logUserAction = (action) => {
  return (req, res, next) => {
    const originalSend = res.send;
    
    res.send = function(data) {
      // Log successful actions (status 200-299)
      if (res.statusCode >= 200 && res.statusCode < 300) {
        console.log(`User Action: ${req.user.name} (${req.user.role}) performed ${action} at ${new Date().toISOString()}`);
      }
      
      originalSend.call(this, data);
    };
    
    next();
  };
};

module.exports = {
  authenticateToken,
  requireRole,
  requirePermission,
  canAccessCase,
  logUserAction
};