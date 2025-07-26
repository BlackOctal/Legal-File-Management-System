const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { body, validationResult } = require('express-validator');
const Document = require('../models/Document');
const Case = require('../models/Case');
const { logUserAction } = require('../middleware/auth');

const router = express.Router();

// Ensure uploads directory exists
const uploadsDir = process.env.UPLOAD_PATH || './uploads';
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const caseId = req.params.caseId || req.body.caseId;
    const casePath = path.join(uploadsDir, 'cases', caseId);
    
    // Create case-specific directory
    if (!fs.existsSync(casePath)) {
      fs.mkdirSync(casePath, { recursive: true });
    }
    
    cb(null, casePath);
  },
  filename: function (req, file, cb) {
    // Generate unique filename
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    const filename = `${file.fieldname}-${uniqueSuffix}${ext}`;
    cb(null, filename);
  }
});

// File filter for allowed types
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

// @desc    Get documents for a case
// @route   GET /api/documents/case/:caseId
// @access  Private
router.get('/case/:caseId', async (req, res) => {
  try {
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

    // Filter documents based on user access level
    const accessibleDocuments = documents.filter(doc => 
      doc.canUserAccess(req.user.role)
    );

    res.json({
      success: true,
      data: { documents: accessibleDocuments }
    });

  } catch (error) {
    console.error('Get case documents error:', error);
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
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      // Clean up uploaded file if validation fails
      if (req.file) {
        fs.unlink(req.file.path, (err) => {
          if (err) console.error('Error deleting file:', err);
        });
      }
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
      // Clean up uploaded file
      fs.unlink(req.file.path, (err) => {
        if (err) console.error('Error deleting file:', err);
      });
      return res.status(404).json({
        success: false,
        message: 'Case not found'
      });
    }

    // Process tags
    const processedTags = tags ? tags.split(',').map(tag => tag.trim()).filter(tag => tag) : [];

    // Create document record
    const document = new Document({
      caseId,
      hearingId: hearingId || undefined,
      name: req.file.originalname,
      originalName: req.file.originalname,
      filename: req.file.filename,
      type,
      mimeType: req.file.mimetype,
      size: req.file.size,
      formattedSize: Document.formatFileSize(req.file.size),
      uploadedBy: req.user._id,
      uploadedByName: req.user.name,
      description,
      tags: processedTags,
      isConfidential: isConfidential === 'true',
      accessLevel: accessLevel || 'internal',
      path: req.file.path
    });

    await document.save();

    // Populate document
    const populatedDocument = await Document.findById(document._id)
      .populate('uploadedBy', 'name')
      .populate('hearingId', 'date type');

    res.status(201).json({
      success: true,
      message: 'Document uploaded successfully',
      data: { document: populatedDocument }
    });

  } catch (error) {
    // Clean up uploaded file on error
    if (req.file) {
      fs.unlink(req.file.path, (err) => {
        if (err) console.error('Error deleting file:', err);
      });
    }
    
    console.error('Upload document error:', error);
    res.status(500).json({
      success: false,
      message: 'Error uploading document'
    });
  }
});

// @desc    Download document
// @route   GET /api/documents/:id/download
// @access  Private
router.get('/:id/download', async (req, res) => {
  try {
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

    // Check if file exists
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

  } catch (error) {
    console.error('Download document error:', error);
    res.status(500).json({
      success: false,
      message: 'Error downloading document'
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

// @desc    Delete document
// @route   DELETE /api/documents/:id
// @access  Private (Admin+)
router.delete('/:id', [
  logUserAction('delete_document')
], async (req, res) => {
  try {
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

    // Delete file from filesystem
    if (fs.existsSync(document.path)) {
      fs.unlink(document.path, (err) => {
        if (err) console.error('Error deleting file:', err);
      });
    }

    // Delete document record
    await Document.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'Document deleted successfully'
    });

  } catch (error) {
    console.error('Delete document error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting document'
    });
  }
});

// @desc    Get document types and stats
// @route   GET /api/documents/stats
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
                cond: { $eq: ['$$this', 'Approved'] }
              }
            }
          },
          pending: {
            $size: {
              $filter: {
                input: '$statuses',
                cond: { $eq: ['$$this', 'Pending Review'] }
              }
            }
          }
        }
      }
    ]);

    res.json({
      success: true,
      data: { stats }
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