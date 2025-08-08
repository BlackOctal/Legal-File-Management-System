// routes/documentRoutes.js
const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { body, validationResult } = require('express-validator');
const Document = require('../models/Document');
const Case = require('../models/Case');
const { logUserAction } = require('../middleware/auth');
const { s3Service } = require('../services/s3Service');

const router = express.Router();

// Check if S3 is available
const isS3Available = process.env.AWS_S3_BUCKET && 
                      process.env.AWS_ACCESS_KEY_ID && 
                      process.env.AWS_SECRET_ACCESS_KEY;

// Ensure uploads directory exists for local storage fallback
const uploadsDir = process.env.UPLOAD_PATH || './uploads';
if (!isS3Available && !fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure multer for file uploads
const storage = multer.memoryStorage(); // Use memory storage for S3 uploads

const fileFilter = (req, file, cb) => {
  const allowedMimes = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/gif',
    'text/plain'
  ];

  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only PDF, DOC, DOCX, XLS, XLSX, JPG, PNG, GIF, and TXT files are allowed.'), false);
  }
};

const upload = multer({
  storage: storage,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE) || 10 * 1024 * 1024 // 10MB default
  },
  fileFilter: fileFilter
});

// Helper function to save file locally as fallback
const saveFileLocally = (fileBuffer, originalName, caseId) => {
  const casePath = path.join(uploadsDir, 'cases', caseId);
  
  if (!fs.existsSync(casePath)) {
    fs.mkdirSync(casePath, { recursive: true });
  }
  
  const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
  const ext = path.extname(originalName);
  const filename = `file-${uniqueSuffix}${ext}`;
  const filePath = path.join(casePath, filename);
  
  fs.writeFileSync(filePath, fileBuffer);
  
  return {
    filename,
    path: filePath
  };
};

// @desc    Get documents for a case
// @route   GET /api/documents/case/:caseId
// @access  Private
router.get('/case/:caseId', async (req, res) => {
  try {
    console.log('📄 GET /api/documents/case/:caseId - Fetching documents for case:', req.params.caseId);
    
    const { caseId } = req.params;
    const { type, status } = req.query;

    // Verify case exists
    const case_doc = await Case.findById(caseId);
    if (!case_doc) {
      return res.status(404).json({
        success: false,
        message: 'Case not found'
      });
    }

    // Build filter
    const filter = { caseId };
    if (type) filter.type = type;
    if (status) filter.status = status;

    const documents = await Document.find(filter)
      .populate('uploadedBy', 'name')
      .populate('reviewedBy', 'name')
      .populate('hearingId', 'date type')
      .sort({ createdAt: -1 });

    // Filter documents based on user access level and format response
    const accessibleDocuments = documents
      .filter(doc => doc.canUserAccess(req.user.role))
      .map(doc => ({
        id: doc._id,
        name: doc.originalName,
        type: doc.type,
        uploadDate: doc.createdAt.toLocaleDateString(),
        uploadedBy: doc.uploadedByName,
        size: doc.formattedSize,
        status: doc.status,
        hearingDate: doc.hearingId?.date ? new Date(doc.hearingId.date).toLocaleDateString() : null,
        description: doc.description,
        tags: doc.tags,
        downloadCount: doc.downloadCount,
        isConfidential: doc.isConfidential,
        storageType: doc.storageType
      }));

    console.log(`✅ Found ${accessibleDocuments.length} documents`);

    res.json({
      success: true,
      documents: accessibleDocuments
    });

  } catch (error) {
    console.error('❌ Get case documents error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching documents'
    });
  }
});

// @desc    Upload document for a case
// @route   POST /api/documents/case/:caseId/upload
// @access  Private
router.post('/case/:caseId/upload', [
  logUserAction('upload_document'),
  upload.single('file'),
  body('type')
    .isIn(['Legal Filing', 'Evidence', 'Contract', 'Testimony', 'Correspondence', 'Financial Statement', 'Court Order', 'Affidavit', 'Other'])
    .withMessage('Invalid document type'),
  body('description')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Description cannot exceed 500 characters'),
  body('tags')
    .optional()
    .isString(),
  body('hearingId')
    .optional()
    .isMongoId()
    .withMessage('Invalid hearing ID'),
  body('isConfidential')
    .optional()
    .isBoolean(),
  body('accessLevel')
    .optional()
    .isIn(['public', 'internal', 'restricted'])
], async (req, res) => {
  try {
    console.log('📤 POST /api/documents/case/:caseId/upload - Uploading document');
    console.log('User:', req.user.name, req.user.role);
    console.log('Case ID:', req.params.caseId);
    console.log('File info:', req.file ? {
      originalname: req.file.originalname,
      mimetype: req.file.mimetype,
      size: req.file.size
    } : 'No file');

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded'
      });
    }

    const { caseId } = req.params;
    const { type, description, tags, hearingId, isConfidential, accessLevel } = req.body;

    // Verify case exists
    const case_doc = await Case.findById(caseId);
    if (!case_doc) {
      return res.status(404).json({
        success: false,
        message: 'Case not found'
      });
    }

    // Process tags
    const processedTags = tags ? tags.split(',').map(tag => tag.trim()).filter(tag => tag) : [];

    let storageResult;
    let documentData = {
      caseId,
      hearingId: hearingId || undefined,
      name: req.file.originalname,
      originalName: req.file.originalname,
      type,
      mimeType: req.file.mimetype,
      size: req.file.size,
      formattedSize: Document.formatFileSize(req.file.size),
      uploadedBy: req.user._id,
      uploadedByName: req.user.name,
      description,
      tags: processedTags,
      isConfidential: isConfidential === 'true',
      accessLevel: accessLevel || 'internal'
    };

    try {
      if (isS3Available) {
        console.log('📁 Uploading to S3...');
        // Upload to S3
        storageResult = await s3Service.uploadFile(
          req.file.buffer,
          req.file.originalname,
          req.file.mimetype,
          caseId,
          req.user._id
        );

        documentData = {
          ...documentData,
          filename: storageResult.fileName,
          storageType: 's3',
          s3Key: storageResult.key,
          s3Bucket: storageResult.bucket,
          s3Location: storageResult.location
        };

        console.log('✅ File uploaded to S3:', storageResult.key);
      } else {
        console.log('💾 Uploading to local storage...');
        // Fallback to local storage
        const localResult = saveFileLocally(req.file.buffer, req.file.originalname, caseId);
        
        documentData = {
          ...documentData,
          filename: localResult.filename,
          storageType: 'local',
          path: localResult.path
        };

        console.log('✅ File saved locally:', localResult.path);
      }

      // Create document record
      const document = new Document(documentData);
      await document.save();

      // Populate document
      const populatedDocument = await Document.findById(document._id)
        .populate('uploadedBy', 'name')
        .populate('hearingId', 'date type');

      console.log('🎉 Document upload completed successfully');

      res.status(201).json({
        success: true,
        message: 'Document uploaded successfully',
        data: { document: populatedDocument }
      });

    } catch (storageError) {
      console.error('❌ Storage error:', storageError);
      
      if (isS3Available) {
        console.log('⚠️ S3 upload failed, falling back to local storage...');
        
        try {
          // Fallback to local storage
          const localResult = saveFileLocally(req.file.buffer, req.file.originalname, caseId);
          
          documentData = {
            ...documentData,
            filename: localResult.filename,
            storageType: 'local',
            path: localResult.path
          };

          const document = new Document(documentData);
          await document.save();

          const populatedDocument = await Document.findById(document._id)
            .populate('uploadedBy', 'name')
            .populate('hearingId', 'date type');

          console.log('✅ Document saved to local storage as fallback');

          res.status(201).json({
            success: true,
            message: 'Document uploaded successfully (using local storage)',
            data: { document: populatedDocument }
          });

        } catch (fallbackError) {
          console.error('❌ Local storage fallback failed:', fallbackError);
          throw new Error('Both S3 and local storage failed');
        }
      } else {
        throw storageError;
      }
    }

  } catch (error) {
    console.error('❌ Upload document error:', error);
    res.status(500).json({
      success: false,
      message: 'Error uploading document: ' + error.message
    });
  }
});

// @desc    Download document
// @route   GET /api/documents/:id/download
// @access  Private
router.get('/:id/download', async (req, res) => {
  try {
    console.log('⬇️ GET /api/documents/:id/download - Downloading document:', req.params.id);

    const document = await Document.findById(req.params.id);
    if (!document) {
      return res.status(404).json({
        success: false,
        message: 'Document not found'
      });
    }

    // Check if user can access document
    if (!document.canUserAccess(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to access this document'
      });
    }

    try {
      if (document.isS3Storage()) {
        console.log('📁 Downloading from S3...');
        
        // Download from S3
        const s3Result = await s3Service.downloadFile(document.s3Key);
        
        // Increment download count
        await document.incrementDownloadCount(req.user._id);

        // Set appropriate headers
        res.setHeader('Content-Disposition', `attachment; filename="${document.originalName}"`);
        res.setHeader('Content-Type', document.mimeType);
        res.setHeader('Content-Length', s3Result.body.length);

        // Send file
        res.send(s3Result.body);
        
        console.log('✅ File downloaded from S3');
      } else {
        console.log('💾 Downloading from local storage...');
        
        // Download from local storage
        if (!fs.existsSync(document.path)) {
          return res.status(404).json({
            success: false,
            message: 'File not found on server'
          });
        }

        // Increment download count
        await document.incrementDownloadCount(req.user._id);

        // Set appropriate headers
        res.setHeader('Content-Disposition', `attachment; filename="${document.originalName}"`);
        res.setHeader('Content-Type', document.mimeType);

        // Stream file
        const fileStream = fs.createReadStream(document.path);
        fileStream.pipe(res);
        
        console.log('✅ File downloaded from local storage');
      }
    } catch (downloadError) {
      console.error('❌ Download error:', downloadError);
      return res.status(500).json({
        success: false,
        message: 'Error downloading document: ' + downloadError.message
      });
    }

  } catch (error) {
    console.error('❌ Download document error:', error);
    res.status(500).json({
      success: false,
      message: 'Error downloading document'
    });
  }
});

// @desc    Delete document
// @route   DELETE /api/documents/:id
// @access  Private (Admin+)
router.delete('/:id', [
  logUserAction('delete_document')
], async (req, res) => {
  try {
    console.log('🗑️ DELETE /api/documents/:id - Deleting document:', req.params.id);

    const document = await Document.findById(req.params.id);
    if (!document) {
      return res.status(404).json({
        success: false,
        message: 'Document not found'
      });
    }

    // Check permissions - only admin+ or document uploader can delete
    if (!['admin', 'super_admin'].includes(req.user.role) && 
        document.uploadedBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to delete this document'
      });
    }

    try {
      if (document.isS3Storage()) {
        console.log('📁 Deleting from S3...');
        // Delete from S3
        await s3Service.deleteFile(document.s3Key);
        console.log('✅ File deleted from S3');
      } else {
        console.log('💾 Deleting from local storage...');
        // Delete from local filesystem
        if (fs.existsSync(document.path)) {
          fs.unlinkSync(document.path);
          console.log('✅ File deleted from local storage');
        }
      }
    } catch (deleteError) {
      console.error('⚠️ Error deleting physical file:', deleteError);
      // Continue with database deletion even if file deletion fails
    }

    // Delete document record
    await Document.findByIdAndDelete(req.params.id);

    console.log('🎉 Document deleted successfully');

    res.json({
      success: true,
      message: 'Document deleted successfully'
    });

  } catch (error) {
    console.error('❌ Delete document error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting document'
    });
  }
});

// @desc    Update document details
// @route   PUT /api/documents/:id
// @access  Private
router.put('/:id', [
  logUserAction('update_document'),
  body('type')
    .optional()
    .isIn(['Legal Filing', 'Evidence', 'Contract', 'Testimony', 'Correspondence', 'Financial Statement', 'Court Order', 'Affidavit', 'Other']),
  body('description')
    .optional()
    .isLength({ max: 500 }),
  body('tags')
    .optional()
    .isString(),
  body('status')
    .optional()
    .isIn(['Approved', 'Pending Review', 'In Review', 'Required', 'Rejected']),
  body('reviewNotes')
    .optional()
    .isLength({ max: 500 }),
  body('accessLevel')
    .optional()
    .isIn(['public', 'internal', 'restricted'])
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

    const { type, description, tags, status, reviewNotes, accessLevel } = req.body;

    const document = await Document.findById(req.params.id);
    if (!document) {
      return res.status(404).json({
        success: false,
        message: 'Document not found'
      });
    }

    // Process tags if provided
    const processedTags = tags ? tags.split(',').map(tag => tag.trim()).filter(tag => tag) : undefined;

    // Update fields
    const updateData = {};
    if (type) updateData.type = type;
    if (description !== undefined) updateData.description = description;
    if (processedTags) updateData.tags = processedTags;
    if (accessLevel) updateData.accessLevel = accessLevel;
    
    // Handle status updates (typically done by admin/super_admin)
    if (status && ['admin', 'super_admin'].includes(req.user.role)) {
      updateData.status = status;
      updateData.reviewedBy = req.user._id;
      updateData.reviewedAt = new Date();
      if (reviewNotes) updateData.reviewNotes = reviewNotes;
    }

    const updatedDocument = await Document.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    ).populate('uploadedBy', 'name')
     .populate('reviewedBy', 'name');

    res.json({
      success: true,
      message: 'Document updated successfully',
      data: { document: updatedDocument }
    });

  } catch (error) {
    console.error('Update document error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating document'
    });
  }
});

// @desc    Get document statistics
// @route   GET /api/documents/stats/overview
// @access  Private
router.get('/stats/overview', async (req, res) => {
  try {
    const stats = await Document.aggregate([
      {
        $group: {
          _id: '$type',
          count: { $sum: 1 },
          totalSize: { $sum: '$size' },
          statuses: {
            $push: '$status'
          },
          storageTypes: {
            $push: '$storageType'
          }
        }
      },
      {
        $project: {
          type: '$_id',
          count: 1,
          totalSize: 1,
          approved: {
            $size: {
              $filter: {
                input: '$statuses',
                cond: { $eq: ['$this', 'Approved'] }
              }
            }
          },
          pending: {
            $size: {
              $filter: {
                input: '$statuses',
                cond: { $eq: ['$this', 'Pending Review'] }
              }
            }
          },
          s3Count: {
            $size: {
              $filter: {
                input: '$storageTypes',
                cond: { $eq: ['$this', 's3'] }
              }
            }
          },
          localCount: {
            $size: {
              $filter: {
                input: '$storageTypes',
                cond: { $eq: ['$this', 'local'] }
              }
            }
          }
        }
      }
    ]);

    // Get overall storage statistics
    const overallStats = await Document.aggregate([
      {
        $group: {
          _id: null,
          totalDocuments: { $sum: 1 },
          totalSize: { $sum: '$size' },
          s3Documents: {
            $sum: { $cond: [{ $eq: ['$storageType', 's3'] }, 1, 0] }
          },
          localDocuments: {
            $sum: { $cond: [{ $eq: ['$storageType', 'local'] }, 1, 0] }
          }
        }
      }
    ]);

    res.json({
      success: true,
      data: { 
        stats,
        overall: overallStats[0] || {
          totalDocuments: 0,
          totalSize: 0,
          s3Documents: 0,
          localDocuments: 0
        }
      }
    });

  } catch (error) {
    console.error('Get document stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching document statistics'
    });
  }
});

module.exports = router;