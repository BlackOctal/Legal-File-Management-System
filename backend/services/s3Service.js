// services/s3Service.js
const AWS = require('aws-sdk');
const { v4: uuidv4 } = require('uuid');
const path = require('path');

// Configure AWS
AWS.config.update({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION || 'eu-north-1'
});

const s3 = new AWS.S3();

const s3Service = {
  // Check if S3 bucket is accessible
  checkBucketAccess: async () => {
    try {
      await s3.headBucket({ Bucket: process.env.AWS_S3_BUCKET }).promise();
      console.log('📁 S3 bucket access verified');
      return true;
    } catch (error) {
      console.error('S3 bucket access error:', error.message);
      return false;
    }
  },

  // Upload file to S3
  uploadFile: async (fileBuffer, originalName, mimeType, caseId, userId) => {
    try {
      const fileExtension = path.extname(originalName);
      const fileName = `${uuidv4()}${fileExtension}`;
      const key = `cases/${caseId}/documents/${fileName}`;

      const uploadParams = {
        Bucket: process.env.AWS_S3_BUCKET,
        Key: key,
        Body: fileBuffer,
        ContentType: mimeType,
        Metadata: {
          originalName: originalName,
          uploadedBy: userId.toString(),
          caseId: caseId.toString(),
          uploadDate: new Date().toISOString()
        },
        ServerSideEncryption: 'AES256'
      };

      const result = await s3.upload(uploadParams).promise();
      
      return {
        success: true,
        key: key,
        location: result.Location,
        fileName: fileName,
        bucket: process.env.AWS_S3_BUCKET
      };
    } catch (error) {
      console.error('S3 upload error:', error);
      throw new Error(`Failed to upload file to S3: ${error.message}`);
    }
  },

  // Download file from S3
  downloadFile: async (key) => {
    try {
      const params = {
        Bucket: process.env.AWS_S3_BUCKET,
        Key: key
      };

      const result = await s3.getObject(params).promise();
      return {
        success: true,
        body: result.Body,
        contentType: result.ContentType,
        metadata: result.Metadata
      };
    } catch (error) {
      console.error('S3 download error:', error);
      throw new Error(`Failed to download file from S3: ${error.message}`);
    }
  },

  // Delete file from S3
  deleteFile: async (key) => {
    try {
      const params = {
        Bucket: process.env.AWS_S3_BUCKET,
        Key: key
      };

      await s3.deleteObject(params).promise();
      return { success: true };
    } catch (error) {
      console.error('S3 delete error:', error);
      throw new Error(`Failed to delete file from S3: ${error.message}`);
    }
  },

  // Generate signed URL for temporary access
  generateSignedUrl: async (key, expires = 3600) => {
    try {
      const params = {
        Bucket: process.env.AWS_S3_BUCKET,
        Key: key,
        Expires: expires
      };

      const url = await s3.getSignedUrlPromise('getObject', params);
      return {
        success: true,
        url: url
      };
    } catch (error) {
      console.error('S3 signed URL error:', error);
      throw new Error(`Failed to generate signed URL: ${error.message}`);
    }
  },

  // List files in a case folder
  listCaseFiles: async (caseId) => {
    try {
      const params = {
        Bucket: process.env.AWS_S3_BUCKET,
        Prefix: `cases/${caseId}/documents/`
      };

      const result = await s3.listObjectsV2(params).promise();
      return {
        success: true,
        files: result.Contents || []
      };
    } catch (error) {
      console.error('S3 list files error:', error);
      throw new Error(`Failed to list files: ${error.message}`);
    }
  }
};

// Initialize S3 service
const initializeS3Service = async () => {
  try {
    if (!process.env.AWS_S3_BUCKET) {
      console.log('ℹ️ AWS_S3_BUCKET not configured - using local storage');
      return false;
    }

    if (!process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY) {
      console.log('⚠️ AWS credentials not configured - using local storage');
      return false;
    }

    const isAccessible = await s3Service.checkBucketAccess();
    if (isAccessible) {
      console.log(`✅ S3 service ready with bucket: ${process.env.AWS_S3_BUCKET}`);
      return true;
    } else {
      console.log(`⚠️ S3 service not accessible - using local storage`);
      return false;
    }
  } catch (error) {
    console.error('Failed to initialize S3 service:', error.message);
    return false;
  }
};

module.exports = {
  s3Service,
  initializeS3Service
};