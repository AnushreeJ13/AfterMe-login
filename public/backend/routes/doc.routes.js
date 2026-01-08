import express from 'express';
import multer from 'multer';
import mongoose from 'mongoose';
import path from 'path';
import fs from 'fs';
import { promisify } from 'util';
import { verifyToken } from '../middleware/auth.middleware.js';
import Document from '../models/Document.js';
import User from '../models/User.js';

const router = express.Router();
const unlinkAsync = promisify(fs.unlink);

/* =========================
   MULTER CONFIGURATION
========================= */
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = './uploads/documents';
    
    // Create directory if it doesn't exist
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, `${req.user.id}-${uniqueSuffix}${ext}`);
  }
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/gif',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/plain'
  ];
  
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only images, PDFs, and documents are allowed.'), false);
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
    files: 10 // Max 10 files per upload
  }
});

/* =========================
   HELPER FUNCTIONS
========================= */
const validateDocumentData = (req) => {
  const { folder, subitem, documentName } = req.body;
  
  if (!folder || !subitem || !documentName) {
    throw new Error('Folder, subitem, and document name are required');
  }
  
  // Validate folder
  const validFolders = [
    'Identification & Documents',
    'Important Contacts',
    'Key Devices',
    'Legal',
    'Trusts',
    'Tax',
    'Real Estate',
    'Insurance',
    'Bank & Currency Accounts',
    'Investments',
    'Valuable Possessions',
    'Social & Digital',
    'Funeral Wishes',
    'Memory Lane',
    'Entrepreneur',
    'Charity'
  ];
  
  if (!validFolders.includes(folder)) {
    throw new Error('Invalid folder specified');
  }
};

const parseMetadata = (req) => {
  try {
    if (req.body.metadata) {
      return typeof req.body.metadata === 'string' 
        ? JSON.parse(req.body.metadata) 
        : req.body.metadata;
    }
    return {};
  } catch (error) {
    throw new Error('Invalid metadata format. Must be valid JSON.');
  }
};

/* =========================
   UPLOAD DOCUMENT
========================= */
router.post(
  '/upload',
  verifyToken,
  upload.array('files', 10),
  async (req, res) => {
    try {
      // Validate input
      validateDocumentData(req);
      
      // Parse metadata
      const metadata = parseMetadata(req);
      
      // Check if files were uploaded
      if (!req.files || req.files.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Please upload at least one file'
        });
      }

      // Prepare files data
      const files = req.files.map(file => ({
        filename: file.filename,
        originalname: file.originalname,
        mimetype: file.mimetype,
        size: file.size,
        path: file.path
      }));

      // Create document
      const document = new Document({
        user: req.user.id,
        folder: req.body.folder,
        subitem: req.body.subitem,
        documentName: req.body.documentName,
        description: req.body.description || '',
        files: files,
        metadata: metadata,
        tags: req.body.tags ? req.body.tags.split(',').map(tag => tag.trim()) : []
      });

      await document.save();

      // Log activity
      await User.findByIdAndUpdate(req.user.id, {
        $push: {
          activityLog: {
            action: 'document_upload',
            documentId: document._id,
            documentName: document.documentName,
            timestamp: new Date()
          }
        }
      });

      res.status(201).json({
        success: true,
        message: 'Document uploaded successfully',
        document: {
          _id: document._id,
          documentName: document.documentName,
          folder: document.folder,
          subitem: document.subitem,
          files: document.files.map(f => ({
            filename: f.filename,
            originalname: f.originalname,
            size: f.size
          })),
          createdAt: document.createdAt
        }
      });
    } catch (error) {
      console.error('Upload error:', error);
      
      // Cleanup uploaded files if error occurred
      if (req.files && req.files.length > 0) {
        req.files.forEach(async (file) => {
          try {
            await unlinkAsync(file.path);
          } catch (err) {
            console.error('Failed to delete file:', err);
          }
        });
      }
      
      res.status(400).json({
        success: false,
        message: error.message || 'Failed to upload document'
      });
    }
  }
);

/* =========================
   GET ALL DOCUMENTS
========================= */
router.get('/', verifyToken, async (req, res) => {
  try {
    const {
      folder,
      subitem,
      search,
      page = 1,
      limit = 20,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    // Build query
    const query = { 
      user: req.user.id,
      isDeleted: false 
    };

    if (folder) query.folder = folder;
    if (subitem) query.subitem = subitem;
    
    // Search functionality
    if (search) {
      query.$or = [
        { documentName: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { 'metadata.notes': { $regex: search, $options: 'i' } },
        { tags: { $regex: search, $options: 'i' } }
      ];
    }

    // Pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    // Sorting
    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    // Execute query
    const documents = await Document.find(query)
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit))
      .select('-previousVersions -__v');

    const total = await Document.countDocuments(query);

    res.json({
      success: true,
      documents,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Get documents error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch documents'
    });
  }
});

/* =========================
   GET SINGLE DOCUMENT
========================= */
router.get('/:id', verifyToken, async (req, res) => {
  try {
    const document = await Document.findOne({
      _id: req.params.id,
      user: req.user.id,
      isDeleted: false
    }).select('-previousVersions -__v');

    if (!document) {
      return res.status(404).json({
        success: false,
        message: 'Document not found'
      });
    }

    res.json({
      success: true,
      document
    });
  } catch (error) {
    console.error('Get document error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch document'
    });
  }
});

/* =========================
   UPDATE DOCUMENT
========================= */
router.put('/:id', verifyToken, async (req, res) => {
  try {
    const document = await Document.findOne({
      _id: req.params.id,
      user: req.user.id,
      isDeleted: false
    });

    if (!document) {
      return res.status(404).json({
        success: false,
        message: 'Document not found'
      });
    }

    // Create version before update
    await document.createVersion(req.user.id);

    // Update document
    const updates = {};
    
    if (req.body.documentName) updates.documentName = req.body.documentName;
    if (req.body.description !== undefined) updates.description = req.body.description;
    if (req.body.folder) updates.folder = req.body.folder;
    if (req.body.subitem) updates.subitem = req.body.subitem;
    if (req.body.tags) updates.tags = req.body.tags.split(',').map(tag => tag.trim());
    
    // Update metadata if provided
    if (req.body.metadata) {
      const newMetadata = typeof req.body.metadata === 'string' 
        ? JSON.parse(req.body.metadata) 
        : req.body.metadata;
      updates.metadata = { ...document.metadata, ...newMetadata };
    }

    // Add files if provided (for adding more files)
    if (req.body.filesToAdd) {
      const filesToAdd = typeof req.body.filesToAdd === 'string' 
        ? JSON.parse(req.body.filesToAdd) 
        : req.body.filesToAdd;
      updates.$push = { files: { $each: filesToAdd } };
    }

    const updatedDocument = await Document.findByIdAndUpdate(
      req.params.id,
      updates,
      { new: true, runValidators: true }
    ).select('-previousVersions -__v');

    // Log activity
    await User.findByIdAndUpdate(req.user.id, {
      $push: {
        activityLog: {
          action: 'document_update',
          documentId: updatedDocument._id,
          documentName: updatedDocument.documentName,
          timestamp: new Date()
        }
      }
    });

    res.json({
      success: true,
      message: 'Document updated successfully',
      document: updatedDocument
    });
  } catch (error) {
    console.error('Update document error:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to update document'
    });
  }
});

/* =========================
   DELETE DOCUMENT (Soft Delete)
========================= */
router.delete('/:id', verifyToken, async (req, res) => {
  try {
    const document = await Document.findOne({
      _id: req.params.id,
      user: req.user.id,
      isDeleted: false
    });

    if (!document) {
      return res.status(404).json({
        success: false,
        message: 'Document not found'
      });
    }

    // Soft delete
    await document.softDelete();

    // Log activity
    await User.findByIdAndUpdate(req.user.id, {
      $push: {
        activityLog: {
          action: 'document_delete',
          documentId: document._id,
          documentName: document.documentName,
          timestamp: new Date()
        }
      }
    });

    res.json({
      success: true,
      message: 'Document deleted successfully'
    });
  } catch (error) {
    console.error('Delete document error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete document'
    });
  }
});

/* =========================
   RESTORE DOCUMENT
========================= */
router.post('/:id/restore', verifyToken, async (req, res) => {
  try {
    const document = await Document.findOne({
      _id: req.params.id,
      user: req.user.id,
      isDeleted: true
    });

    if (!document) {
      return res.status(404).json({
        success: false,
        message: 'Deleted document not found'
      });
    }

    await document.restore();

    res.json({
      success: true,
      message: 'Document restored successfully',
      document
    });
  } catch (error) {
    console.error('Restore document error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to restore document'
    });
  }
});

/* =========================
   DELETE FILE FROM DOCUMENT
========================= */
router.delete('/:id/files/:fileId', verifyToken, async (req, res) => {
  try {
    const document = await Document.findOne({
      _id: req.params.id,
      user: req.user.id,
      isDeleted: false
    });

    if (!document) {
      return res.status(404).json({
        success: false,
        message: 'Document not found'
      });
    }

    const fileIndex = document.files.findIndex(
      file => file._id.toString() === req.params.fileId
    );

    if (fileIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'File not found'
      });
    }

    // Delete file from filesystem
    const fileToDelete = document.files[fileIndex];
    try {
      await unlinkAsync(fileToDelete.path);
    } catch (err) {
      console.error('Failed to delete file from filesystem:', err);
    }

    // Remove file from document
    document.files.splice(fileIndex, 1);
    await document.save();

    res.json({
      success: true,
      message: 'File deleted successfully',
      document
    });
  } catch (error) {
    console.error('Delete file error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete file'
    });
  }
});

/* =========================
   GET DOCUMENT COUNTS
========================= */
router.get('/counts/summary', verifyToken, async (req, res) => {
  try {
    const counts = await Document.aggregate([
      { 
        $match: { 
          user: mongoose.Types.ObjectId(req.user.id),
          isDeleted: false 
        } 
      },
      {
        $group: {
          _id: { folder: '$folder', subitem: '$subitem' },
          count: { $sum: 1 },
          totalSize: { $sum: { $sum: '$files.size' } }
        }
      },
      {
        $group: {
          _id: '$_id.folder',
          subitems: {
            $push: {
              subitem: '$_id.subitem',
              count: '$count',
              totalSize: '$totalSize'
            }
          },
          totalCount: { $sum: '$count' },
          folderTotalSize: { $sum: '$totalSize' }
        }
      },
      {
        $project: {
          folder: '$_id',
          subitems: 1,
          totalCount: 1,
          folderTotalSize: 1,
          _id: 0
        }
      }
    ]);

    // Format for easy frontend consumption
    const formattedCounts = {};
    counts.forEach(folder => {
      folder.subitems.forEach(subitem => {
        const key = `${folder.folder}|${subitem.subitem}`;
        formattedCounts[key] = subitem.count;
      });
    });

    res.json({
      success: true,
      counts: formattedCounts,
      folderStats: counts
    });
  } catch (error) {
    console.error('Get counts error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch document counts'
    });
  }
});

/* =========================
   GET FOLDER STATISTICS
========================= */
router.get('/folders/stats', verifyToken, async (req, res) => {
  try {
    const stats = await Document.getFolderStats(req.user.id);
    
    res.json({
      success: true,
      stats
    });
  } catch (error) {
    console.error('Get folder stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch folder statistics'
    });
  }
});

/* =========================
   SEARCH DOCUMENTS
========================= */
router.get('/search', verifyToken, async (req, res) => {
  try {
    const { q, folder, dateFrom, dateTo } = req.query;
    
    const query = {
      user: req.user.id,
      isDeleted: false
    };
    
    // Text search
    if (q) {
      query.$text = { $search: q };
    }
    
    // Folder filter
    if (folder) {
      query.folder = folder;
    }
    
    // Date range filter
    if (dateFrom || dateTo) {
      query.createdAt = {};
      if (dateFrom) query.createdAt.$gte = new Date(dateFrom);
      if (dateTo) query.createdAt.$lte = new Date(dateTo);
    }
    
    const documents = await Document.find(query)
      .sort({ createdAt: -1 })
      .limit(50)
      .select('documentName folder subitem description createdAt files metadata');
    
    res.json({
      success: true,
      count: documents.length,
      documents
    });
  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to search documents'
    });
  }
});

/* =========================
   GET RECENT DOCUMENTS
========================= */
router.get('/recent', verifyToken, async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    
    const recentDocuments = await Document.find({
      user: req.user.id,
      isDeleted: false
    })
    .sort({ updatedAt: -1 })
    .limit(limit)
    .select('documentName folder subitem updatedAt files metadata');
    
    res.json({
      success: true,
      documents: recentDocuments
    });
  } catch (error) {
    console.error('Get recent error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch recent documents'
    });
  }
});

/* =========================
   GET TAGS
========================= */
router.get('/tags/all', verifyToken, async (req, res) => {
  try {
    const tags = await Document.aggregate([
      { 
        $match: { 
          user: mongoose.Types.ObjectId(req.user.id),
          isDeleted: false 
        } 
      },
      { $unwind: '$tags' },
      { $group: { _id: '$tags', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);
    
    res.json({
      success: true,
      tags: tags.map(tag => ({ name: tag._id, count: tag.count }))
    });
  } catch (error) {
    console.error('Get tags error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch tags'
    });
  }
});

/* =========================
   SHARE DOCUMENT
========================= */
router.post('/:id/share', verifyToken, async (req, res) => {
  try {
    const { email, permission } = req.body;
    
    if (!email || !permission) {
      return res.status(400).json({
        success: false,
        message: 'Email and permission are required'
      });
    }
    
    // Find user to share with
    const userToShare = await User.findOne({ email });
    if (!userToShare) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    // Check if sharing with self
    if (userToShare._id.toString() === req.user.id) {
      return res.status(400).json({
        success: false,
        message: 'Cannot share document with yourself'
      });
    }
    
    const document = await Document.findOne({
      _id: req.params.id,
      user: req.user.id,
      isDeleted: false
    });
    
    if (!document) {
      return res.status(404).json({
        success: false,
        message: 'Document not found'
      });
    }
    
    // Check if already shared
    const alreadyShared = document.sharedWith.find(
      share => share.userId.toString() === userToShare._id.toString()
    );
    
    if (alreadyShared) {
      return res.status(400).json({
        success: false,
        message: 'Document already shared with this user'
      });
    }
    
    // Add to sharedWith
    document.sharedWith.push({
      userId: userToShare._id,
      email: userToShare.email,
      permission
    });
    
    document.isShared = true;
    await document.save();
    
    res.json({
      success: true,
      message: 'Document shared successfully'
    });
  } catch (error) {
    console.error('Share error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to share document'
    });
  }
});

/* =========================
   GET SHARED DOCUMENTS
========================= */
router.get('/shared/with-me', verifyToken, async (req, res) => {
  try {
    const sharedDocuments = await Document.find({
      'sharedWith.userId': req.user.id,
      isDeleted: false
    })
    .populate('user', 'name email')
    .select('-previousVersions -__v');
    
    res.json({
      success: true,
      documents: sharedDocuments
    });
  } catch (error) {
    console.error('Get shared error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch shared documents'
    });
  }
});

/* =========================
   BULK DELETE DOCUMENTS
========================= */
router.post('/bulk-delete', verifyToken, async (req, res) => {
  try {
    const { documentIds } = req.body;
    
    if (!documentIds || !Array.isArray(documentIds) || documentIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Document IDs are required'
      });
    }
    
    await Document.updateMany(
      {
        _id: { $in: documentIds },
        user: req.user.id,
        isDeleted: false
      },
      {
        isDeleted: true,
        deletedAt: new Date()
      }
    );
    
    res.json({
      success: true,
      message: `${documentIds.length} documents deleted successfully`
    });
  } catch (error) {
    console.error('Bulk delete error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete documents'
    });
  }
});

/* =========================
   EXPORT DOCUMENTS DATA (JSON)
========================= */
router.get('/export/json', verifyToken, async (req, res) => {
  try {
    const { folder, subitem } = req.query;
    
    const query = { 
      user: req.user.id,
      isDeleted: false 
    };
    
    if (folder) query.folder = folder;
    if (subitem) query.subitem = subitem;
    
    const documents = await Document.find(query)
      .select('-previousVersions -__v -sharedWith');
    
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename=documents-export-${Date.now()}.json`);
    
    res.json({
      success: true,
      exportDate: new Date(),
      count: documents.length,
      documents
    });
  } catch (error) {
    console.error('Export error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to export documents'
    });
  }
});

export default router;