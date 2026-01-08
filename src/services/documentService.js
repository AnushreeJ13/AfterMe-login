const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

class DocumentService {
  constructor() {
    this.getAuthHeaders = this.getAuthHeaders.bind(this);
  }

  getAuthHeaders() {
    const token = localStorage.getItem('token');
    return {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };
  }

  getFormDataHeaders() {
    const token = localStorage.getItem('token');
    return {
      'Authorization': `Bearer ${token}`
      // Don't set Content-Type for FormData
    };
  }

  // Upload document
  async uploadDocument(formData) {
    try {
      const response = await fetch(`${API_URL}/api/docs/upload`, {
        method: 'POST',
        headers: this.getFormDataHeaders(),
        body: formData
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Upload failed');
      }

      return await response.json();
    } catch (error) {
      console.error('Upload error:', error);
      throw error;
    }
  }

  // Get all documents
  async getDocuments(params = {}) {
    try {
      const queryParams = new URLSearchParams(params).toString();
      const response = await fetch(
        `${API_URL}/api/docs${queryParams ? `?${queryParams}` : ''}`,
        {
          headers: this.getAuthHeaders()
        }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch documents');
      }

      return await response.json();
    } catch (error) {
      console.error('Get documents error:', error);
      throw error;
    }
  }

  // Get document by ID
  async getDocumentById(id) {
    try {
      const response = await fetch(`${API_URL}/api/docs/${id}`, {
        headers: this.getAuthHeaders()
      });

      if (!response.ok) {
        throw new Error('Document not found');
      }

      return await response.json();
    } catch (error) {
      console.error('Get document error:', error);
      throw error;
    }
  }

  // Update document
  async updateDocument(id, data) {
    try {
      const response = await fetch(`${API_URL}/api/docs/${id}`, {
        method: 'PUT',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(data)
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Update failed');
      }

      return await response.json();
    } catch (error) {
      console.error('Update error:', error);
      throw error;
    }
  }

  // Delete document
  async deleteDocument(id) {
    try {
      const response = await fetch(`${API_URL}/api/docs/${id}`, {
        method: 'DELETE',
        headers: this.getAuthHeaders()
      });

      if (!response.ok) {
        throw new Error('Delete failed');
      }

      return await response.json();
    } catch (error) {
      console.error('Delete error:', error);
      throw error;
    }
  }

  // Get document counts
  async getDocumentCounts() {
    try {
      const response = await fetch(`${API_URL}/api/docs/counts/summary`, {
        headers: this.getAuthHeaders()
      });

      if (!response.ok) {
        throw new Error('Failed to fetch counts');
      }

      return await response.json();
    } catch (error) {
      console.error('Get counts error:', error);
      throw error;
    }
  }

  // Get folder statistics
  async getFolderStats() {
    try {
      const response = await fetch(`${API_URL}/api/docs/folders/stats`, {
        headers: this.getAuthHeaders()
      });

      if (!response.ok) {
        throw new Error('Failed to fetch folder stats');
      }

      return await response.json();
    } catch (error) {
      console.error('Get folder stats error:', error);
      throw error;
    }
  }

  // Search documents
  async searchDocuments(query, filters = {}) {
    try {
      const params = { q: query, ...filters };
      const queryParams = new URLSearchParams(params).toString();
      
      const response = await fetch(
        `${API_URL}/api/docs/search?${queryParams}`,
        {
          headers: this.getAuthHeaders()
        }
      );

      if (!response.ok) {
        throw new Error('Search failed');
      }

      return await response.json();
    } catch (error) {
      console.error('Search error:', error);
      throw error;
    }
  }

  // Get recent documents
  async getRecentDocuments(limit = 10) {
    try {
      const response = await fetch(
        `${API_URL}/api/docs/recent?limit=${limit}`,
        {
          headers: this.getAuthHeaders()
        }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch recent documents');
      }

      return await response.json();
    } catch (error) {
      console.error('Get recent error:', error);
      throw error;
    }
  }

  // Get all tags
  async getAllTags() {
    try {
      const response = await fetch(`${API_URL}/api/docs/tags/all`, {
        headers: this.getAuthHeaders()
      });

      if (!response.ok) {
        throw new Error('Failed to fetch tags');
      }

      return await response.json();
    } catch (error) {
      console.error('Get tags error:', error);
      throw error;
    }
  }

  // Share document
  async shareDocument(documentId, email, permission) {
    try {
      const response = await fetch(`${API_URL}/api/docs/${documentId}/share`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify({ email, permission })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Share failed');
      }

      return await response.json();
    } catch (error) {
      console.error('Share error:', error);
      throw error;
    }
  }

  // Get shared documents
  async getSharedDocuments() {
    try {
      const response = await fetch(`${API_URL}/api/docs/shared/with-me`, {
        headers: this.getAuthHeaders()
      });

      if (!response.ok) {
        throw new Error('Failed to fetch shared documents');
      }

      return await response.json();
    } catch (error) {
      console.error('Get shared error:', error);
      throw error;
    }
  }

  // Bulk delete
  async bulkDelete(documentIds) {
    try {
      const response = await fetch(`${API_URL}/api/docs/bulk-delete`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify({ documentIds })
      });

      if (!response.ok) {
        throw new Error('Bulk delete failed');
      }

      return await response.json();
    } catch (error) {
      console.error('Bulk delete error:', error);
      throw error;
    }
  }

  // Export documents
  async exportDocuments(folder, subitem) {
    try {
      const params = new URLSearchParams();
      if (folder) params.append('folder', folder);
      if (subitem) params.append('subitem', subitem);

      const response = await fetch(
        `${API_URL}/api/docs/export/json?${params.toString()}`,
        {
          headers: this.getAuthHeaders()
        }
      );

      if (!response.ok) {
        throw new Error('Export failed');
      }

      return await response.json();
    } catch (error) {
      console.error('Export error:', error);
      throw error;
    }
  }

  // Download file
  async downloadFile(documentId, fileId) {
    try {
      const response = await fetch(
        `${API_URL}/api/docs/${documentId}/files/${fileId}/download`,
        {
          headers: this.getAuthHeaders()
        }
      );

      if (!response.ok) {
        throw new Error('Download failed');
      }

      return await response.blob();
    } catch (error) {
      console.error('Download error:', error);
      throw error;
    }
  }
}

export default new DocumentService();