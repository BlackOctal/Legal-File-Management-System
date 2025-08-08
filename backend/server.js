const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

// Import routes
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const caseRoutes = require('./routes/caseRoutes');
const hearingRoutes = require('./routes/hearingRoutes');
const documentRoutes = require('./routes/documentRoutes');
const noteRoutes = require('./routes/noteRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const categoryRoutes = require('./routes/categoryRoutes'); // NEW

// Try to import optional notification routes
let notificationRoutes = null;
try {
  notificationRoutes = require('./routes/notificationRoutes');
} catch (error) {
  console.log('⚠️ Notification routes not found - notifications disabled');
}

// Import middleware
const errorHandler = require('./middleware/errorHandler');
const { authenticateToken } = require('./middleware/auth');

// Try to import optional email service
let emailService = null;
try {
  emailService = require('./services/emailService');
} catch (error) {
  console.log('⚠️ Email service not found - email notifications disabled');
}

const app = express();

// CORS configuration - MOVED TO TOP AND SIMPLIFIED
const corsOptions = {
  origin: [
    'http://localhost:3000',
    'http://127.0.0.1:3000',
    process.env.FRONTEND_URL || 'http://localhost:3000'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
  optionsSuccessStatus: 200
};

// Apply CORS FIRST - before other middleware
app.use(cors(corsOptions));

// Handle preflight OPTIONS requests
app.options('*', cors(corsOptions));

// Security middleware - ADJUSTED
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
  crossOriginEmbedderPolicy: false // Allow cross-origin requests
}));

app.use(compression());

// Rate limiting
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again later.'
  }
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: {
    success: false,
    message: 'Too many authentication attempts, please try again later.'
  }
});

app.use('/api/auth', authLimiter);
app.use(generalLimiter);

// Body parsing middleware
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Logging
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

// Static files
app.use('/uploads', express.static('uploads'));

// MongoDB connection
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/law_case_system');

    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    
    mongoose.connection.on('error', (err) => {
      console.error('❌ MongoDB connection error:', err);
    });

    mongoose.connection.on('disconnected', () => {
      console.log('⚠️ MongoDB disconnected');
    });

    process.on('SIGINT', async () => {
      try {
        await mongoose.connection.close();
        console.log('📁 MongoDB connection closed through app termination');
        process.exit(0);
      } catch (err) {
        console.error('Error during MongoDB disconnection:', err);
        process.exit(1);
      }
    });

  } catch (error) {
    console.error('❌ MongoDB connection failed:', error);
    process.exit(1);
  }
};

// Initialize database connection
connectDB();

// Test email service on startup (if available)
const testEmailService = async () => {
  if (emailService && process.env.RESEND_API_KEY) {
    console.log('📧 Testing email service...');
    try {
      // Test with a dummy email - this will help verify the service is working
      const testResult = await emailService.sendTestEmail('test@example.com', 'Email service initialization test');
      if (testResult.success) {
        console.log('✅ Email service is working correctly');
      } else {
        console.log('⚠️ Email service test failed:', testResult.error);
      }
    } catch (error) {
      console.log('⚠️ Email service test error:', error.message);
    }
  } else if (!process.env.RESEND_API_KEY) {
    console.log('⚠️ RESEND_API_KEY not found - email notifications will not work');
  } else {
    console.log('⚠️ Email service not available - email notifications disabled');
  }
};

// Test email service
testEmailService();

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', authenticateToken, userRoutes);
app.use('/api/cases', authenticateToken, caseRoutes);
app.use('/api/hearings', authenticateToken, hearingRoutes);
app.use('/api/documents', authenticateToken, documentRoutes);
app.use('/api/notes', authenticateToken, noteRoutes);
app.use('/api/dashboard', authenticateToken, dashboardRoutes);
app.use('/api/categories', authenticateToken, categoryRoutes); // NEW

// Add notification routes if available
if (notificationRoutes) {
  app.use('/api/notifications', authenticateToken, notificationRoutes);
}

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({
    success: true,
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    version: process.env.npm_package_version || '1.0.0',
    environment: process.env.NODE_ENV || 'development',
    services: {
      database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
      email: emailService && process.env.RESEND_API_KEY ? 'configured' : 'not configured',
      notifications: notificationRoutes ? 'enabled' : 'disabled'
    }
  });
});

// API info endpoint
app.get('/api', (req, res) => {
  const endpoints = {
    auth: '/api/auth',
    users: '/api/users',
    cases: '/api/cases',
    hearings: '/api/hearings',
    documents: '/api/documents',
    notes: '/api/notes',
    dashboard: '/api/dashboard',
    categories: '/api/categories', // NEW
    health: '/api/health'
  };

  // Add notifications endpoint if available
  if (notificationRoutes) {
    endpoints.notifications = '/api/notifications';
  }

  res.json({
    success: true,
    message: 'Law Case Management System API',
    version: '1.0.0',
    endpoints
  });
});

// Error handling middleware
app.use(errorHandler);

// Handle 404
app.use('/api/*', (req, res) => {
  res.status(404).json({
    success: false,
    message: `API endpoint ${req.originalUrl} not found`
  });
});

app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Resource not found'
  });
});

// Updated to use port 5001
const PORT = process.env.PORT || 5001;

const server = app.listen(PORT, () => {
  console.log('\n🚀 Law Case Management System Backend');
  console.log('=====================================');
  console.log(`📡 Server running on port ${PORT}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔗 API URL: http://localhost:${PORT}/api`);
  console.log(`📊 Health Check: http://localhost:${PORT}/api/health`);
  console.log(`🌐 CORS enabled for: localhost:3000, 127.0.0.1:3000`);
  console.log(`📧 Email Service: ${emailService && process.env.RESEND_API_KEY ? '✅ Configured' : '❌ Not configured'}`);
  console.log(`🔔 Notifications: ${notificationRoutes ? '✅ Enabled' : '❌ Disabled'}`);
  console.log('=====================================\n');
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err, promise) => {
  console.error('❌ Unhandled Promise Rejection:', err.message);
  server.close(() => {
    process.exit(1);
  });
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error('❌ Uncaught Exception:', err.message);
  console.error(err.stack);
  process.exit(1);
});

module.exports = app;