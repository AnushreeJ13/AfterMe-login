import mongoose from 'mongoose';

const documentSchema = new mongoose.Schema({
  user: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },

  folder: { 
    type: String, 
    required: true,
    enum: [
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
    ]
  },

  subitem: { 
    type: String, 
    required: true 
  },

  documentName: { 
    type: String, 
    required: true 
  },

  description: { 
    type: String, 
    default: '' 
  },

  files: [
    {
      filename: { type: String, required: true },
      originalname: { type: String, required: true },
      mimetype: { type: String, required: true },
      size: { type: Number, required: true },
      path: { type: String, required: true },
      uploadedAt: { type: Date, default: Date.now }
    }
  ],

  metadata: {
    // Passport/ID Card
    givenNames: String,
    surname: String,
    documentNumber: String,
    nationality: String,
    dateOfBirth: Date,
    placeOfBirth: String,
    issueDate: Date,
    expiryDate: Date,
    placeOfIssue: String,
    
    // Driver's License
    licenseClass: String,
    address: String,
    
    // Birth Certificate
    fatherName: String,
    motherName: String,
    registrationNumber: String,
    registrationDate: Date,
    
    // Marriage Certificate
    spouseGivenNames: String,
    spouseSurname: String,
    marriageDate: Date,
    marriagePlace: String,
    certificateNumber: String,
    
    // Divorce Certificate
    formerSpouseName: String,
    formerSpouseSurname: String,
    divorceDate: Date,
    courtName: String,
    caseNumber: String,
    decreeAbsoluteDate: Date,
    
    // Medical Records
    hospitalName: String,
    doctorName: String,
    recordType: String,
    recordDate: Date,
    
    // Miscellaneous
    documentType: String,
    issueAuthority: String,
    
    // Common
    notes: String,
    location: String,
    status: { type: String, default: 'active' }
  },

  tags: [String],
  
  isShared: { 
    type: Boolean, 
    default: false 
  },
  
  sharedWith: [
    {
      userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      email: String,
      permission: { type: String, enum: ['view', 'edit'], default: 'view' },
      sharedAt: { type: Date, default: Date.now }
    }
  ],

  // Soft delete
  isDeleted: { type: Boolean, default: false },
  deletedAt: Date,
  
  // Versioning
  version: { type: Number, default: 1 },
  previousVersions: [
    {
      data: Object,
      version: Number,
      updatedAt: Date,
      updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
    }
  ],

  // Timestamps
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Indexes for faster queries
documentSchema.index({ user: 1, folder: 1, subitem: 1 });
documentSchema.index({ user: 1, createdAt: -1 });
documentSchema.index({ user: 1, 'metadata.documentNumber': 1 });
documentSchema.index({ user: 1, isDeleted: 1 });
documentSchema.index({ 'files.filename': 1 });
documentSchema.index({ tags: 1 });

// Middleware to update updatedAt
documentSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Soft delete method
documentSchema.methods.softDelete = function() {
  this.isDeleted = true;
  this.deletedAt = new Date();
  return this.save();
};

// Restore method
documentSchema.methods.restore = function() {
  this.isDeleted = false;
  this.deletedAt = null;
  return this.save();
};

// Method to create a new version
documentSchema.methods.createVersion = function(userId) {
  this.previousVersions.push({
    data: {
      documentName: this.documentName,
      description: this.description,
      metadata: this.metadata,
      tags: this.tags
    },
    version: this.version,
    updatedAt: this.updatedAt,
    updatedBy: userId
  });
  this.version += 1;
  return this.save();
};

// Static method to get counts by category
documentSchema.statics.getCountsByUser = async function(userId) {
  return this.aggregate([
    { $match: { user: mongoose.Types.ObjectId(userId), isDeleted: false } },
    {
      $group: {
        _id: { folder: '$folder', subitem: '$subitem' },
        count: { $sum: 1 },
        totalSize: { $sum: { $sum: '$files.size' } },
        lastUpdated: { $max: '$updatedAt' }
      }
    },
    {
      $project: {
        folder: '$_id.folder',
        subitem: '$_id.subitem',
        count: 1,
        totalSize: 1,
        lastUpdated: 1,
        _id: 0
      }
    },
    { $sort: { folder: 1, subitem: 1 } }
  ]);
};

// Static method to get folder statistics
documentSchema.statics.getFolderStats = async function(userId) {
  return this.aggregate([
    { $match: { user: mongoose.Types.ObjectId(userId), isDeleted: false } },
    {
      $group: {
        _id: '$folder',
        totalDocuments: { $sum: 1 },
        totalSize: { $sum: { $sum: '$files.size' } },
        subitems: { $addToSet: '$subitem' },
        lastUpdated: { $max: '$updatedAt' }
      }
    },
    {
      $project: {
        folder: '$_id',
        totalDocuments: 1,
        totalSize: 1,
        subitemCount: { $size: '$subitems' },
        lastUpdated: 1,
        _id: 0
      }
    },
    { $sort: { folder: 1 } }
  ]);
};

// Virtual for total file size
documentSchema.virtual('totalFileSize').get(function() {
  return this.files.reduce((total, file) => total + file.size, 0);
});

// Virtual for formatted size
documentSchema.virtual('formattedSize').get(function() {
  const bytes = this.totalFileSize;
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
});

const Document = mongoose.model('Document', documentSchema);

export default Document;