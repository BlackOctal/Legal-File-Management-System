#!/usr/bin/env node

/**
 * Migration Script: Local Files to S3
 * 
 * This script migrates existing local documents to AWS S3
 * Run with: npm run migrate-s3
 */

require('dotenv').config();
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const { s3Service, initializeS3Service, isS3Enabled } = require('../services/s3Service');
const Document = require('../models/Document');

async function connectDatabase() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');
  } catch (error) {
    console.error('❌ MongoDB connection failed:', error.message);
    process.exit(1);
  }
}

async function migrateDocumentsToS3() {
  console.log('🚀 Starting migration of documents from local storage to S3...\n');
  
  // Check if S3 is enabled
  if (!isS3Enabled()) {
    console.error('❌ S3 is not configured. Please check your environment variables.');
    process.exit(1);
  }
  
  // Initialize S3 service
  const s3Initialized = await initializeS3Service();
  if (!s3Initialized) {
    console.error('❌ Failed to initialize S3 service');
    process.exit(1);
  }
  
  // Find all local documents
  console.log('📋 Finding local documents...');
  const localDocuments = await Document.find({
    $or: [
      { storageType: 'local' },
      { storageType: { $exists: false } }, // Legacy documents without storageType
      { s3Key: { $exists: false } } // Documents without S3 key
    ]
  });
  
  console.log(`📊 Found ${localDocuments.length} documents to migrate\n`);
  
  if (localDocuments.length === 0) {
    console.log('✅ No documents need migration');
    return;
  }
  
  const migrationStats = {
    total: localDocuments.length,
    successful: 0,
    failed: 0,
    skipped: 0,
    errors: []
  };
  
  // Process each document
  for (let i = 0; i < localDocuments.length; i++) {
    const doc = localDocuments[i];
    const progress = `[${i + 1}/${localDocuments.length}]`;
    
    console.log(`${progress} Processing: ${doc.originalName || doc.name}`);
    
    try {
      // Skip if already has S3 key
      if (doc.s3Key) {
        console.log(`   ⏭️ Skipping - already has S3 key`);
        migrationStats.skipped++;
        continue;
      }
      
      // Check if local file exists
      const localPath = doc.path;
      if (!localPath || !fs.existsSync(localPath)) {
        console.log(`   ⚠️ Skipping - local file not found: ${localPath}`);
        migrationStats.skipped++;
        migrationStats.errors.push({
          documentId: doc._id,
          name: doc.originalName || doc.name,
          error: 'Local file not found'
        });
        continue;
      }
      
      // Generate S3 key
      const s3Key = s3Service.generateFileKey(
        doc.caseId,
        doc.originalName || doc.name,
        doc.uploadedBy
      );
      
      // Read file content
      const fileContent = fs.readFileSync(localPath);
      
      // Upload to S3
      console.log(`   📤 Uploading to S3...`);
      const uploadResult = await s3Service.uploadFromBuffer(
        fileContent,
        s3Key,
        doc.mimeType || 'application/octet-stream',
        {
          Metadata: {
            'case-id': doc.caseId.toString(),
            'uploaded-by': doc.uploadedBy.toString(),
            'document-type': doc.type,
            'original-name': doc.originalName || doc.name,
            'migrated': 'true',
            'migration-date': new Date().toISOString()
          }
        }
      );
      
      // Update document record
      await Document.findByIdAndUpdate(doc._id, {
        storageType: 's3',
        s3Key: uploadResult.key,
        s3Bucket: uploadResult.bucket,
        s3Url: uploadResult.url,
        s3ETag: uploadResult.etag
      });
      
      // Verify S3 upload
      const fileExists = await s3Service.fileExists(uploadResult.key);
      if (!fileExists) {
        throw new Error('S3 upload verification failed');
      }
      
      // Delete local file after successful upload
      try {
        fs.unlinkSync(localPath);
        console.log(`   🗑️ Deleted local file`);
      } catch (deleteError) {
        console.log(`   ⚠️ Could not delete local file: ${deleteError.message}`);
      }
      
      console.log(`   ✅ Migration successful`);
      migrationStats.successful++;
      
      // Add small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 100));
      
    } catch (error) {
      console.log(`   ❌ Migration failed: ${error.message}`);
      migrationStats.failed++;
      migrationStats.errors.push({
        documentId: doc._id,
        name: doc.originalName || doc.name,
        error: error.message
      });
    }
  }
  
  // Print summary
  console.log('\n📊 Migration Summary:');
  console.log(`   Total documents: ${migrationStats.total}`);
  console.log(`   ✅ Successful: ${migrationStats.successful}`);
  console.log(`   ❌ Failed: ${migrationStats.failed}`);
  console.log(`   ⏭️ Skipped: ${migrationStats.skipped}`);
  
  if (migrationStats.errors.length > 0) {
    console.log('\n❌ Errors encountered:');
    migrationStats.errors.forEach((error, index) => {
      console.log(`   ${index + 1}. ${error.name}: ${error.error}`);
    });
  }
  
  if (migrationStats.successful > 0) {
    console.log(`\n🎉 Successfully migrated ${migrationStats.successful} documents to S3!`);
  }
  
  return migrationStats;
}

async function verifyMigration() {
  console.log('\n🔍 Verifying migration...');
  
  const totalDocuments = await Document.countDocuments();
  const s3Documents = await Document.countDocuments({ storageType: 's3' });
  const localDocuments = await Document.countDocuments({ 
    $or: [
      { storageType: 'local' },
      { storageType: { $exists: false } }
    ]
  });
  
  console.log(`   Total documents: ${totalDocuments}`);
  console.log(`   S3 documents: ${s3Documents}`);
  console.log(`   Local documents: ${localDocuments}`);
  
  if (localDocuments === 0) {
    console.log('   ✅ All documents migrated to S3');
  } else {
    console.log(`   ⚠️ ${localDocuments} documents still in local storage`);
  }
}

async function main() {
  try {
    console.log('🔄 S3 Migration Tool Starting...\n');
    
    await connectDatabase();
    
    const stats = await migrateDocumentsToS3();
    
    await verifyMigration();
    
    console.log('\n✨ Migration process completed!');
    
    process.exit(0);
    
  } catch (error) {
    console.error('\n💥 Migration failed:', error.message);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
  }
}

// Handle process signals
process.on('SIGINT', async () => {
  console.log('\n\n⚠️ Migration interrupted by user');
  await mongoose.disconnect();
  process.exit(1);
});

process.on('unhandledRejection', (error) => {
  console.error('\n💥 Unhandled rejection:', error.message);
  process.exit(1);
});

// Run if script is executed directly
if (require.main === module) {
  main();
}

module.exports = { migrateDocumentsToS3 };