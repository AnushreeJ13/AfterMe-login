import React, { useState, useEffect } from 'react';
import './ExpertAdvisor.css';

const API = (process.env.REACT_APP_API_URL || '').replace(/\/$/, '');

const ExpertAdvisor = () => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [documentCounts, setDocumentCounts] = useState({});
  const [isLoading, setIsLoading] = useState(true);

  // Fetch counts on component mount
  useEffect(() => {
    fetchDocumentCounts();
  }, []);

  const fetchDocumentCounts = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch(`${API}/api/docs/counts`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const counts = await response.json();
      
      const countsMap = {};
      counts.forEach(c => {
        const key = `${c._id.folder}|${c._id.subitem}`;
        countsMap[key] = c.count;
      });
      
      setDocumentCounts(countsMap);
    } catch (error) {
      console.error('Failed to fetch counts:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getFolderCount = (folderName) => {
    let total = 0;
    // Count all documents in this folder
    Object.keys(documentCounts).forEach(key => {
      const [folder, subitem] = key.split('|');
      if (folder === folderName) {
        total += documentCounts[key];
      }
    });
    return total;
  };

  const folders = [
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

  if (isLoading) {
    return (
      <div className="trusted-appointees-page">
        <div className="page-header">
          <h1 className="page-title">My Expert Advisors</h1>
        </div>
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="expert-advisor-page">
      <div className="page-header">
        <h1 className="page-title">My Expert Advisors</h1>
      </div>

      <div className="appointees-section">
        <div className="add-appointee-card">
          <div className="add-icon-circle">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="12" y1="5" x2="12" y2="19"></line>
              <line x1="5" y1="12" x2="19" y2="12"></line>
            </svg>
          </div>
          <p className="add-appointee-text">Add a New Expert<br/>Advisor</p>
        </div>
      </div>

      <div className="legacy-section">
        <h2 className="section-title">My Legacy Assets Memories</h2>
        <h3 className="section-subtitle">Folder</h3>

        <div className="folders-list">
          {folders.map((folder, index) => {
            const count = getFolderCount(folder);
            return (
              <div key={index} className="folder-item">
                <svg className="folder-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
                </svg>
                <span className="folder-name">{folder}</span>
                {count > 0 && (
                  <span className="folder-count-badge">{count}</span>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default ExpertAdvisor;