import React, { useState, useEffect } from 'react';
import './DocumentFormModal.css';

const API = "https://dashboard-9qul.onrender.com";
const DocumentFormModal = ({ document, onClose, onSave }) => {
  const [activeTab, setActiveTab] = useState('files');
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [formError, setFormError] = useState('');
  const [dragActive, setDragActive] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [existingDocuments, setExistingDocuments] = useState([]);
  
  const [formData, setFormData] = useState({
    // Common fields
    surname: '',
    givenNames: '',
    documentNumber: '',
    dateOfBirth: '',
    placeOfBirth: '',
    issueDate: '',
    expiryDate: '',
    placeOfIssue: '',
    
    // Specific fields
    nationality: '',
    licenseClass: '',
    spouseName: '',
    marriageDate: '',
    marriagePlace: '',
    certificateNumber: '',
    divorceDate: '',
    courtName: '',
    caseNumber: '',
    hospitalName: '',
    doctorName: '',
    recordType: '',
    recordDate: '',
    
    // Notes
    notes: '',
    documentName: '',
    description: ''
  });

  // Fetch existing documents when modal opens
  useEffect(() => {
    fetchExistingDocuments();
  }, [document]);

  const fetchExistingDocuments = async () => {
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      const response = await fetch(
  `${API}/api/docs?folder=Identification%20%26%20Documents&subitem=${encodeURIComponent(document.subitem)}`,
  {
    headers: { 
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  }
);

      const data = await response.json();
      setExistingDocuments(data || []);
    } catch (error) {
      console.error('Failed to fetch existing documents:', error);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFiles(e.dataTransfer.files);
    }
  };

  const handleFileInput = (e) => {
    if (e.target.files && e.target.files[0]) {
      handleFiles(e.target.files);
    }
  };

  const handleFiles = (files) => {
    const newFiles = Array.from(files).map(file => ({
      name: file.name,
      size: (file.size / 1024).toFixed(2) + ' KB',
      type: file.type,
      file: file
    }));
    setUploadedFiles([...uploadedFiles, ...newFiles]);
    setShowUploadModal(false);
  };

  const removeFile = (index) => {
    setUploadedFiles(uploadedFiles.filter((_, i) => i !== index));
  };

  const deleteDocument = async (docId) => {
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      setIsLoading(true);
      await fetch(`${API}/api/docs/${docId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // Refresh the list
      await fetchExistingDocuments();
      
      // Call onSave to update counts in parent
      if (typeof onSave === 'function') {
        onSave();
      }
    } catch (error) {
      console.error('Failed to delete document:', error);
      setFormError('Failed to delete document');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async () => {
    // Reset previous error
    setFormError('');

    // Basic validation
    if (!uploadedFiles || uploadedFiles.length === 0) {
      setFormError('Please upload at least one file before saving.');
      return;
    }

    // Generate document name if not provided
    const docName = formData.documentName || 
                   `${document.title} - ${formData.givenNames || ''} ${formData.surname || ''}`.trim() ||
                   `New ${document.title}`;

    // Prepare metadata
    const metadata = {
      ...formData,
      documentName: docName,
      description: formData.description || '',
      timestamp: new Date().toISOString()
    };

    // Prepare FormData for upload
    const formDataToSend = new FormData();
    formDataToSend.append('folder', 'Identification & Documents');
    formDataToSend.append('subitem', document.subitem);
    formDataToSend.append('metadata', JSON.stringify(metadata));
    formDataToSend.append('documentName', docName);
    formDataToSend.append('description', formData.description || '');

    // Append files
    uploadedFiles.forEach(file => {
      formDataToSend.append('files', file.file);
    });

    const token = localStorage.getItem('token');
  if (!token) {
    setFormError('Authentication required. Please login again.');
    return;
  }
console.log('Uploading to:', `${API}/api/docs/upload`);
  console.log('Token exists:', !!token);
  console.log('Files to upload:', uploadedFiles.length);
  

    setIsLoading(true);

    try {
      const response = await fetch(`${API}/api/docs/upload`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
        // DO NOT set Content-Type for FormData!
      },
      body: formDataToSend
    });

      console.log('Response status:', response.status);
       if (!response.ok) {
      const errorText = await response.text();
      console.error('Upload failed with status:', response.status);
      console.error('Error response:', errorText);
      throw new Error(`Upload failed: ${response.status} ${response.statusText}`);
    }
    
    const result = await response.json();
    console.log('Upload result:', result);

      if (result.success) {
        console.log('Document saved successfully:', result.doc);
        
        // Clear form
        setFormData({
          surname: '',
          givenNames: '',
          documentNumber: '',
          dateOfBirth: '',
          placeOfBirth: '',
          issueDate: '',
          expiryDate: '',
          placeOfIssue: '',
          nationality: '',
          licenseClass: '',
          spouseName: '',
          marriageDate: '',
          marriagePlace: '',
          certificateNumber: '',
          divorceDate: '',
          courtName: '',
          caseNumber: '',
          hospitalName: '',
          doctorName: '',
          recordType: '',
          recordDate: '',
          notes: '',
          documentName: '',
          description: ''
        });
        setUploadedFiles([]);

        // Notify parent to update counts
        if (typeof onSave === 'function') {
          onSave();
        }

        // Refresh existing documents
        await fetchExistingDocuments();
        
        // Optionally close modal or stay open
        // onClose();
      } else {
        setFormError(result.message || 'Failed to save document');
      }
    } catch (error) {
      console.error('Upload failed:', error);
    setFormError(`Upload failed: ${error.message}`);
  } finally {
    setIsLoading(false);
    }
  };

  // Get form fields based on document type
  const getFormFields = () => {
    // Get specific fields based on document type
    const baseFields = (
      <>
        <div className="form-group">
          <label className="form-label">Document Name *</label>
          <input 
            type="text" 
            name="documentName" 
            value={formData.documentName} 
            onChange={handleChange} 
            placeholder="Give this document a name" 
            className="form-input" 
            required
          />
        </div>
        <div className="form-group">
          <label className="form-label">Description</label>
          <textarea 
            name="description" 
            value={formData.description} 
            onChange={handleChange} 
            placeholder="Add a short description" 
            className="form-textarea" 
            rows="3"
          />
        </div>
      </>
    );

    switch(document.id) {
      case 'passport':
        return (
          <>
            {baseFields}
            <div className="form-group">
              <label className="form-label">Document Type</label>
              <select name="recordType" value={formData.recordType} onChange={handleChange} className="form-input">
                <option value="">Select Type</option>
                <option value="passport">Passport</option>
                <option value="id-card">ID Card</option>
                <option value="national-id">National ID</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Given Names *</label>
              <input type="text" name="givenNames" value={formData.givenNames} onChange={handleChange} placeholder="Given Names" className="form-input" required />
            </div>
            <div className="form-group">
              <label className="form-label">Surname *</label>
              <input type="text" name="surname" value={formData.surname} onChange={handleChange} placeholder="Surname" className="form-input" required />
            </div>
            <div className="form-group">
              <label className="form-label">Document Number *</label>
              <input type="text" name="documentNumber" value={formData.documentNumber} onChange={handleChange} placeholder="Document Number" className="form-input" required />
            </div>
            <div className="form-group">
              <label className="form-label">Nationality</label>
              <input type="text" name="nationality" value={formData.nationality} onChange={handleChange} placeholder="Nationality" className="form-input" />
            </div>
            <div className="form-group">
              <label className="form-label">Date of Birth</label>
              <input type="date" name="dateOfBirth" value={formData.dateOfBirth} onChange={handleChange} className="form-input" />
            </div>
            <div className="form-group">
              <label className="form-label">Place of Birth</label>
              <input type="text" name="placeOfBirth" value={formData.placeOfBirth} onChange={handleChange} placeholder="Place of Birth" className="form-input" />
            </div>
            <div className="form-group">
              <label className="form-label">Issue Date</label>
              <input type="date" name="issueDate" value={formData.issueDate} onChange={handleChange} className="form-input" />
            </div>
            <div className="form-group">
              <label className="form-label">Expiry Date</label>
              <input type="date" name="expiryDate" value={formData.expiryDate} onChange={handleChange} className="form-input" />
            </div>
            <div className="form-group">
              <label className="form-label">Issuing Authority</label>
              <input type="text" name="placeOfIssue" value={formData.placeOfIssue} onChange={handleChange} placeholder="Issuing Authority" className="form-input" />
            </div>
            <div className="form-group">
              <label className="form-label">Notes</label>
              <textarea name="notes" value={formData.notes} onChange={handleChange} placeholder="Additional notes..." className="form-textarea" rows="3" />
            </div>
          </>
        );

      case 'drivers-license':
        return (
          <>
            {baseFields}
            <div className="form-group">
              <label className="form-label">Given Names *</label>
              <input type="text" name="givenNames" value={formData.givenNames} onChange={handleChange} placeholder="Given Names" className="form-input" required />
            </div>
            <div className="form-group">
              <label className="form-label">Surname *</label>
              <input type="text" name="surname" value={formData.surname} onChange={handleChange} placeholder="Surname" className="form-input" required />
            </div>
            <div className="form-group">
              <label className="form-label">Date of Birth</label>
              <input type="date" name="dateOfBirth" value={formData.dateOfBirth} onChange={handleChange} className="form-input" />
            </div>
            <div className="form-group">
              <label className="form-label">Expiry Date</label>
              <input type="date" name="expiryDate" value={formData.expiryDate} onChange={handleChange} className="form-input" />
            </div>
            <div className="form-group">
              <label className="form-label">Place of Issue</label>
              <input type="text" name="placeOfIssue" value={formData.placeOfIssue} onChange={handleChange} placeholder="Place of Issue" className="form-input" />
            </div>
            <div className="form-group">
              <label className="form-label">Licence Number *</label>
              <input type="text" name="documentNumber" value={formData.documentNumber} onChange={handleChange} placeholder="Licence Number" className="form-input" required />
            </div>
            <div className="form-group">
              <label className="form-label">Address</label>
              <input type="text" name="placeOfBirth" value={formData.placeOfBirth} onChange={handleChange} placeholder="Address" className="form-input" />
            </div>
            <div className="form-group">
              <label className="form-label">License Class</label>
              <input type="text" name="licenseClass" value={formData.licenseClass} onChange={handleChange} placeholder="e.g., Class C" className="form-input" />
            </div>
            <div className="form-group">
              <label className="form-label">Notes</label>
              <textarea name="notes" value={formData.notes} onChange={handleChange} placeholder="Additional notes..." className="form-textarea" rows="3" />
            </div>
          </>
        );

      // Add similar cases for other document types...

      default:
        return (
          <>
            {baseFields}
            <div className="form-group">
              <label className="form-label">Notes</label>
              <textarea name="notes" value={formData.notes} onChange={handleChange} placeholder="Add any relevant information here..." className="form-textarea" rows="6" />
            </div>
          </>
        );
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content-large" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">{document.title}</h2>
          <button className="modal-close" onClick={onClose} disabled={isLoading}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>

        <div className="modal-tabs">
          <button 
            className={`tab-button ${activeTab === 'files' ? 'active' : ''}`}
            onClick={() => setActiveTab('files')}
          >
            Upload Files
            <span className="add-icon-tab" onClick={(e) => {
              e.stopPropagation();
              setShowUploadModal(true);
            }}>
              <svg viewBox="0 0 24 24" fill="currentColor">
                <circle cx="12" cy="12" r="10"/>
                <line x1="12" y1="8" x2="12" y2="16" stroke="white" strokeWidth="2"/>
                <line x1="8" y1="12" x2="16" y2="12" stroke="white" strokeWidth="2"/>
              </svg>
            </span>
          </button>
          <button 
            className={`tab-button ${activeTab === 'details' ? 'active' : ''}`}
            onClick={() => setActiveTab('details')}
          >
            Document Details
          </button>
          <button 
            className={`tab-button ${activeTab === 'existing' ? 'active' : ''}`}
            onClick={() => setActiveTab('existing')}
          >
            Existing Documents ({existingDocuments.length})
          </button>
        </div>

        <div className="modal-body">
          {activeTab === 'files' && (
            <div className="files-section">
              {uploadedFiles.length > 0 ? (
                <div className="uploaded-files-list">
                  {uploadedFiles.map((file, index) => (
                    <div key={index} className="file-item">
                      <div className="file-icon">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/>
                          <polyline points="13 2 13 9 20 9"/>
                        </svg>
                      </div>
                      <div className="file-info">
                        <div className="file-name">{file.name}</div>
                        <div className="file-size">{file.size}</div>
                      </div>
                      <button className="file-remove" onClick={() => removeFile(index)} disabled={isLoading}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <line x1="18" y1="6" x2="6" y2="18"/>
                          <line x1="6" y1="6" x2="18" y2="18"/>
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="no-files-message">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/>
                    <polyline points="13 2 13 9 20 9"/>
                  </svg>
                  <p>No files uploaded yet</p>
                  <button className="upload-btn-inline" onClick={() => setShowUploadModal(true)} disabled={isLoading}>
                    Upload File
                  </button>
                </div>
              )}
            </div>
          )}

          {activeTab === 'details' && (
            <div className="details-section">
              {getFormFields()}
            </div>
          )}

          {activeTab === 'existing' && (
            <div className="existing-documents-section">
              {existingDocuments.length > 0 ? (
                <div className="documents-list">
                  {existingDocuments.map((doc, index) => (
                    <div key={doc._id || index} className="document-item">
                      <div className="document-icon">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                          <polyline points="14 2 14 8 20 8"/>
                        </svg>
                      </div>
                      <div className="document-info">
                        <div className="document-name">{doc.documentName || 'Unnamed Document'}</div>
                        <div className="document-description">{doc.description || 'No description'}</div>
                        <div className="document-date">
                          {new Date(doc.createdAt).toLocaleDateString()}
                        </div>
                        <div className="document-files-count">
                          {doc.files?.length || 0} files
                        </div>
                      </div>
                      <button 
                        className="document-delete" 
                        onClick={() => deleteDocument(doc._id)}
                        disabled={isLoading}
                      >
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <line x1="18" y1="6" x2="6" y2="18"/>
                          <line x1="6" y1="6" x2="18" y2="18"/>
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="no-documents-message">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                    <polyline points="14 2 14 8 20 8"/>
                  </svg>
                  <p>No documents saved yet</p>
                  <p className="subtext">Add your first document using the "Upload Files" tab</p>
                </div>
              )}
            </div>
          )}
        </div>

        {formError && (
          <div className="form-error">{formError}</div>
        )}

        <div className="modal-footer">
          <button className="btn-cancel" onClick={onClose} disabled={isLoading}>
            Cancel
          </button>
          <button className="btn-save" onClick={handleSubmit} disabled={isLoading || uploadedFiles.length === 0}>
            {isLoading ? 'Saving...' : 'Save Document'}
          </button>
        </div>
      </div>

      {showUploadModal && (
        <div className="upload-modal-overlay" onClick={() => !isLoading && setShowUploadModal(false)}>
          <div className="upload-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="upload-modal-header">
              <h3>Upload File</h3>
              <button className="modal-close" onClick={() => setShowUploadModal(false)} disabled={isLoading}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </div>
            
            <div 
              className={`upload-area ${dragActive ? 'drag-active' : ''}`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                <polyline points="17 8 12 3 7 8"/>
                <line x1="12" y1="3" x2="12" y2="15"/>
              </svg>
              <p>Drag a file here or browse for a file to upload</p>
              <p className="upload-hint">Supported: PDF, JPG, PNG, DOC, DOCX (Max 10MB)</p>
            </div>

            <div className="upload-modal-footer">
              <input 
                type="file" 
                id="file-input" 
                multiple 
                onChange={handleFileInput}
                style={{ display: 'none' }}
                disabled={isLoading}
              />
              <button className="btn-cancel" onClick={() => setShowUploadModal(false)} disabled={isLoading}>
                Cancel
              </button>
              <label htmlFor="file-input" className="btn-browse" style={isLoading ? { opacity: 0.5, cursor: 'not-allowed' } : {}}>
                Browse
              </label>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DocumentFormModal;