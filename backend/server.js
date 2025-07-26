// const express = require('express');
// const mongoose = require('mongoose');
// const cors = require('cors');
// const helmet = require('helmet');
// const compression = require('compression');
// const morgan = require('morgan');
// const rateLimit = require('express-rate-limit');
// require('dotenv').config();

// // Import routes
// const authRoutes = require('./routes/authRoutes');
// const userRoutes = require('./routes/userRoutes');
// const caseRoutes = require('./routes/caseRoutes');
// const hearingRoutes = require('./routes/hearingRoutes');
// const documentRoutes = require('./routes/documentRoutes');
// const noteRoutes = require('./routes/noteRoutes');
// const dashboardRoutes = require('./routes/dashboardRoutes');
// const notificationRoutes = require('./routes/notificationRoutes');

// // Import middleware
// const errorHandler = require('./middleware/errorHandler');
// const { authenticateToken } = require('./middleware/auth');

// // Import services
// const { initializeCronJobs } = require('./services/cronJobs');
// const { initializeS3Service } = require('./services/s3Service');

// const app = express();

// // Security middleware
// app.use(helmet({
//   contentSecurityPolicy: {
//     directives: {
//       defaultSrc: ["'self'"],
//       styleSrc: ["'self'", "'unsafe-inline'"],
//       scriptSrc: ["'self'"],
//       imgSrc: ["'self'", "data:", "https:"],
//     },
//   },
// }));

// app.use(compression());

// // Rate limiting - separate limits for different endpoints
// const generalLimiter = rateLimit({
//   windowMs: 15 * 60 * 1000, // 15 minutes
//   max: 100, // limit each IP to 100 requests per windowMs
//   message: {
//     success: false,
//     message: 'Too many requests from this IP, please try again later.'
//   }
// });

// const authLimiter = rateLimit({
//   windowMs: 15 * 60 * 1000, // 15 minutes
//   max: 5, // limit each IP to 5 auth requests per windowMs
//   message: {
//     success: false,
//     message: 'Too many authentication attempts, please try again later.'
//   }
// });

// const uploadLimiter = rateLimit({
//   windowMs: 15 * 60 * 1000, // 15 minutes
//   max: 10, // limit each IP to 10 uploads per windowMs
//   message: {
//     success: false,
//     message: 'Too many upload attempts, please try again later.'
//   }
// });

// // Apply rate limiting
// app.use('/api/auth', authLimiter);
// app.use('/api/documents', uploadLimiter);
// app.use(generalLimiter);

// // CORS configuration
// const corsOptions = {
//   origin: function (origin, callback) {
//     // Allow requests with no origin (like mobile apps or curl requests)
//     if (!origin) return callback(null, true);
    
//     const allowedOrigins = [
//       process.env.FRONTEND_URL || 'http://localhost:3000',
//       'http://localhost:3000',
//       'http://127.0.0.1:3000'
//     ];
    
//     if (allowedOrigins.indexOf(origin) !== -1) {
//       callback(null, true);
//     } else {
//       callback(new Error('Not allowed by CORS'));
//     }
//   },
//   credentials: true,
//   methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
//   allowedHeaders: ['Content-Type', 'Authorization']
// };

// app.use(cors(corsOptions));

// // Body parsing middleware
// app.use(express.json({ limit: '50mb' }));
// app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// // Logging middleware
// if (process.env.NODE_ENV === 'development') {
//   app.use(morgan('dev'));
// } else {
//   app.use(morgan('combined'));
// }

// // Static files for uploaded documents (local storage fallback)
// app.use('/uploads', express.static('uploads'));

// // MongoDB connection with better error handling
// const connectDB = async () => {
//   try {
//     const conn = await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/law_case_system', {
//       useNewUrlParser: true,
//       useUnifiedTopology: true,
//     });

//     console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    
//     // Handle connection events
//     mongoose.connection.on('error', (err) => {
//       console.error('❌ MongoDB connection error:', err);
//     });

//     mongoose.connection.on('disconnected', () => {
//       console.log('⚠️ MongoDB disconnected');
//     });

//     // Graceful shutdown
//     process.on('SIGINT', async () => {
//       try {
//         await mongoose.connection.close();
//         console.log('📁 MongoDB connection closed through app termination');
//         process.exit(0);
//       } catch (err) {
//         console.error('Error during MongoDB disconnection:', err);
//         process.exit(1);
//       }
//     });

//   } catch (error) {
//     console.error('❌ MongoDB connection failed:', error);
//     process.exit(1);
//   }
// };

// // Initialize database connection
// connectDB();

// // Initialize services
// if (process.env.NODE_ENV !== 'test') {
//   // Initialize S3 service
//   initializeS3Service();
  
//   // Initialize cron jobs
//   setTimeout(() => {
//     initializeCronJobs();
//   }, 5000); // Wait 5 seconds for DB connection to stabilize
// }

// // API Routes
// app.use('/api/auth', authRoutes);
// app.use('/api/users', authenticateToken, userRoutes);
// app.use('/api/cases', authenticateToken, caseRoutes);
// app.use('/api/hearings', authenticateToken, hearingRoutes);
// app.use('/api/documents', authenticateToken, documentRoutes);
// app.use('/api/notes', authenticateToken, noteRoutes);
// app.use('/api/dashboard', authenticateToken, dashboardRoutes);
// app.use('/api/notifications', authenticateToken, notificationRoutes);

// // Health check endpoint
// app.get('/api/health', (req, res) => {
//   res.status(200).json({
//     success: true,
//     status: 'OK',
//     timestamp: new Date().toISOString(),
//     uptime: process.uptime(),
//     version: process.env.npm_package_version || '1.0.0',
//     environment: process.env.NODE_ENV || 'development'
//   });
// });

// // API info endpoint
// app.get('/api', (req, res) => {
//   res.json({
//     success: true,
//     message: 'Law Case Management System API',
//     version: '1.0.0',
//     endpoints: {
//       auth: '/api/auth',
//       users: '/api/users',
//       cases: '/api/cases',
//       hearings: '/api/hearings',
//       documents: '/api/documents',
//       notes: '/api/notes',
//       dashboard: '/api/dashboard',
//       notifications: '/api/notifications',
//       health: '/api/health'
//     }
//   });
// });

// // Error handling middleware (must be last)
// app.use(errorHandler);

// // Handle 404 for API routes
// app.use('/api/*', (req, res) => {
//   res.status(404).json({
//     success: false,
//     message: `API endpoint ${req.originalUrl} not found`,
//     availableEndpoints: [
//       '/api/auth',
//       '/api/users',
//       '/api/cases',
//       '/api/hearings',
//       '/api/documents',
//       '/api/notes',
//       '/api/dashboard',
//       '/api/notifications'
//     ]
//   });
// });

// // Handle all other 404s
// app.use('*', (req, res) => {
//   res.status(404).json({
//     success: false,
//     message: 'Resource not found'
//   });
// });

// const PORT = process.env.PORT || 5000;

// const server = app.listen(PORT, () => {
//   console.log('\n🚀 Law Case Management System Backend');
//   console.log('=====================================');
//   console.log(`📡 Server running on port ${PORT}`);
//   console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
//   console.log(`🔗 API URL: http://localhost:${PORT}/api`);
//   console.log(`📊 Health Check: http://localhost:${PORT}/api/health`);
//   console.log('=====================================\n');
// });

// // Handle unhandled promise rejections
// process.on('unhandledRejection', (err, promise) => {
//   console.error('❌ Unhandled Promise Rejection:', err.message);
//   // Close server & exit process
//   server.close(() => {
//     process.exit(1);
//   });
// });

// // Handle uncaught exceptions
// process.on('uncaughtException', (err) => {
//   console.error('❌ Uncaught Exception:', err.message);
//   console.error(err.stack);
//   process.exit(1);
// });

// module.exports = app;





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
// const notificationRoutes = require('./routes/notificationRoutes'); // Comment out if missing

// Import middleware
const errorHandler = require('./middleware/errorHandler');
const { authenticateToken } = require('./middleware/auth');

// Import services
// const { initializeCronJobs } = require('./services/cronJobs'); // Comment out temporarily
// const { initializeS3Service } = require('./services/s3Service'); // Comment out if missing

const app = express();

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
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

// CORS configuration
const corsOptions = {
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);
    
    const allowedOrigins = [
      process.env.FRONTEND_URL || 'http://localhost:3000',
      'http://localhost:3000',
      'http://127.0.0.1:3000'
    ];
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
};

app.use(cors(corsOptions));

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
// MongoDB connection - Updated to remove deprecated options
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

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', authenticateToken, userRoutes);
app.use('/api/cases', authenticateToken, caseRoutes);
app.use('/api/hearings', authenticateToken, hearingRoutes);
app.use('/api/documents', authenticateToken, documentRoutes);
app.use('/api/notes', authenticateToken, noteRoutes);
app.use('/api/dashboard', authenticateToken, dashboardRoutes);
// app.use('/api/notifications', authenticateToken, notificationRoutes); // Comment out if missing

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({
    success: true,
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    version: process.env.npm_package_version || '1.0.0',
    environment: process.env.NODE_ENV || 'development'
  });
});

// API info endpoint
app.get('/api', (req, res) => {
  res.json({
    success: true,
    message: 'Law Case Management System API',
    version: '1.0.0',
    endpoints: {
      auth: '/api/auth',
      users: '/api/users',
      cases: '/api/cases',
      hearings: '/api/hearings',
      documents: '/api/documents',
      notes: '/api/notes',
      dashboard: '/api/dashboard',
      health: '/api/health'
    }
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

const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, () => {
  console.log('\n🚀 Law Case Management System Backend');
  console.log('=====================================');
  console.log(`📡 Server running on port ${PORT}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔗 API URL: http://localhost:${PORT}/api`);
  console.log(`📊 Health Check: http://localhost:${PORT}/api/health`);
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