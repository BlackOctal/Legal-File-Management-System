#!/usr/bin/env node

/**
 * System Health Check Script
 * 
 * This script checks the health of all system components
 * Run with: npm run health-check
 */

require('dotenv').config();
const mongoose = require('mongoose');
const { s3Service, initializeS3Service, isS3Enabled } = require('../services/s3Service');

async function checkDatabase() {
  console.log('🗄️ Checking Database Connection...');
  
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 5000
    });
    
    const dbStats = await mongoose.connection.db.admin().ping();
    console.log('   ✅ MongoDB connection: OK');
    
    // Check collections
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log(`   📊 Collections found: ${collections.length}`);
    
    return { status: 'OK', collections: collections.length };
  } catch (error) {
    console.log(`   ❌ MongoDB connection: FAILED - ${error.message}`);
    return { status: 'FAILED', error: error.message };
  }
}

async function checkS3Service() {
  console.log('\n☁️ Checking S3 Service...');
  
  if (!isS3Enabled()) {
    console.log('   ⚠️ S3 not configured - using local storage');
    return { status: 'NOT_CONFIGURED' };
  }
  
  try {
    // Initialize S3
    const initialized = await initializeS3Service();
    if (!initialized) {
      throw new Error('S3 initialization failed');
    }
    
    // Test bucket access
    const bucketAccess = await s3Service.checkBucketAccess();
    if (!bucketAccess) {
      throw new Error('Bucket access failed');
    }
    
    console.log('   ✅ S3 service: OK');
    console.log(`   📁 Bucket: ${process.env.AWS_S3_BUCKET}`);
    console.log(`   🌍 Region: ${process.env.AWS_REGION}`);
    
    return { 
      status: 'OK', 
      bucket: process.env.AWS_S3_BUCKET,
      region: process.env.AWS_REGION
    };
  } catch (error) {
    console.log(`   ❌ S3 service: FAILED - ${error.message}`);
    return { status: 'FAILED', error: error.message };
  }
}

async function checkEnvironmentVariables() {
  console.log('\n🔧 Checking Environment Variables...');
  
  const requiredVars = [
    'PORT',
    'MONGODB_URI',
    'JWT_SECRET',
    'FRONTEND_URL'
  ];
  
  const optionalVars = [
    'AWS_ACCESS_KEY_ID',
    'AWS_SECRET_ACCESS_KEY',
    'AWS_REGION',
    'AWS_S3_BUCKET',
    'RESEND_API_KEY',
    'EMAIL_FROM'
  ];
  
  const results = {
    required: { found: 0, missing: [] },
    optional: { found: 0, missing: [] }
  };
  
  // Check required variables
  console.log('   Required variables:');
  requiredVars.forEach(varName => {
    if (process.env[varName]) {
      console.log(`     ✅ ${varName}: Set`);
      results.required.found++;
    } else {
      console.log(`     ❌ ${varName}: Missing`);
      results.required.missing.push(varName);
    }
  });
  
  // Check optional variables
  console.log('   Optional variables:');
  optionalVars.forEach(varName => {
    if (process.env[varName]) {
      console.log(`     ✅ ${varName}: Set`);
      results.optional.found++;
    } else {
      console.log(`     ⚠️ ${varName}: Not set`);
      results.optional.missing.push(varName);
    }
  });
  
  return results;
}

async function checkFileSystem() {
  console.log('\n📁 Checking File System...');
  
  const fs = require('fs');
  const path = require('path');
  
  const uploadsDir = process.env.UPLOAD_PATH || './uploads';
  
  try {
    // Check if uploads directory exists
    if (fs.existsSync(uploadsDir)) {
      console.log(`   ✅ Uploads directory exists: ${uploadsDir}`);
      
      // Check permissions
      fs.accessSync(uploadsDir, fs.constants.R_OK | fs.constants.W_OK);
      console.log('   ✅ Directory permissions: OK');
      
      // Count files
      const stats = fs.statSync(uploadsDir);
      if (stats.isDirectory()) {
        const files = fs.readdirSync(uploadsDir, { recursive: true });
        console.log(`   📊 Files in uploads: ${files.length}`);
      }
      
      return { status: 'OK', path: uploadsDir };
    } else {
      console.log(`   ⚠️ Uploads directory not found: ${uploadsDir}`);
      
      // Create directory
      fs.mkdirSync(uploadsDir, { recursive: true });
      console.log('   ✅ Created uploads directory');
      
      return { status: 'CREATED', path: uploadsDir };
    }
  } catch (error) {
    console.log(`   ❌ File system check failed: ${error.message}`);
    return { status: 'FAILED', error: error.message };
  }
}

async function checkDocumentStorage() {
  console.log('\n📄 Checking Document Storage...');
  
  try {
    const Document = require('../models/Document');
    
    const totalDocs = await Document.countDocuments();
    const s3Docs = await Document.countDocuments({ storageType: 's3' });
    const localDocs = await Document.countDocuments({ 
      $or: [
        { storageType: 'local' },
        { storageType: { $exists: false } }
      ]
    });
    
    console.log(`   📊 Total documents: ${totalDocs}`);
    console.log(`   ☁️ S3 documents: ${s3Docs}`);
    console.log(`   💾 Local documents: ${localDocs}`);
    
    if (totalDocs > 0) {
      const s3Percentage = ((s3Docs / totalDocs) * 100).toFixed(1);
      console.log(`   📈 S3 migration: ${s3Percentage}%`);
    }
    
    return {
      status: 'OK',
      total: totalDocs,
      s3: s3Docs,
      local: localDocs
    };
  } catch (error) {
    console.log(`   ❌ Document storage check failed: ${error.message}`);
    return { status: 'FAILED', error: error.message };
  }
}

async function generateHealthReport() {
  console.log('🏥 System Health Check Report');
  console.log('=' .repeat(50));
  
  const report = {
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    checks: {}
  };
  
  // Run all health checks
  report.checks.environment = await checkEnvironmentVariables();
  report.checks.database = await checkDatabase();
  report.checks.s3 = await checkS3Service();
  report.checks.fileSystem = await checkFileSystem();
  report.checks.documents = await checkDocumentStorage();
  
  // Generate overall status
  const hasErrors = Object.values(report.checks).some(check => 
    check.status === 'FAILED' || 
    (check.required && check.required.missing.length > 0)
  );
  
  report.overallStatus = hasErrors ? 'DEGRADED' : 'HEALTHY';
  
  console.log('\n📋 Overall System Status:');
  if (report.overallStatus === 'HEALTHY') {
    console.log('   🟢 HEALTHY - All systems operational');
  } else {
    console.log('   🟡 DEGRADED - Some issues detected');
  }
  
  console.log(`\n   Environment: ${report.environment}`);
  console.log(`   Timestamp: ${report.timestamp}`);
  
  return report;
}

async function main() {
  try {
    const report = await generateHealthReport();
    
    // Write report to file
    const fs = require('fs');
    const path = require('path');
    
    const reportsDir = './logs';
    if (!fs.existsSync(reportsDir)) {
      fs.mkdirSync(reportsDir, { recursive: true });
    }
    
    const reportPath = path.join(reportsDir, `health-report-${Date.now()}.json`);
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    
    console.log(`\n💾 Health report saved to: ${reportPath}`);
    
    // Exit with appropriate code
    process.exit(report.overallStatus === 'HEALTHY' ? 0 : 1);
    
  } catch (error) {
    console.error('\n💥 Health check failed:', error.message);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
  }
}

// Handle process signals
process.on('unhandledRejection', (error) => {
  console.error('\n💥 Unhandled rejection:', error.message);
  process.exit(1);
});

// Run if script is executed directly
if (require.main === module) {
  main();
}

module.exports = { generateHealthReport };