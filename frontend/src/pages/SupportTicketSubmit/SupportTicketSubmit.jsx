import React, { useState, useRef } from 'react';
import { 
  Ticket, User, Mail, Phone, MapPin, 
  AlertCircle, FileText, Paperclip, Send, 
  CheckCircle, Loader2, X, AlertTriangle
} from 'lucide-react';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../../firebase';
import './SupportTicketSubmit.css';

const SM_BRANCHES = [
  { value: 'sm-megamall', label: 'SM Megamall' },
  { value: 'sm-mall-of-asia', label: 'SM Mall of Asia' },
  { value: 'sm-north-edsa', label: 'SM North EDSA' },
  { value: 'sm-city-cebu', label: 'SM City Cebu' },
  { value: 'sm-city-davao', label: 'SM City Davao' },
  { value: 'sm-city-clark', label: 'SM City Clark' },
  { value: 'sm-city-fairview', label: 'SM City Fairview' },
  { value: 'sm-city-baguio', label: 'SM City Baguio' },
  { value: 'sm-seaside-city-cebu', label: 'SM Seaside City Cebu' },
  { value: 'sm-southmall', label: 'SM Southmall' },
  { value: 'other', label: 'Other / Corporate Office' }
].sort((a, b) => a.label.localeCompare(b.label));

const ISSUE_CATEGORIES = [
  { value: 'technical', label: 'Technical Issue', icon: '💻' },
  { value: 'billing', label: 'Billing & Payments', icon: '💳' },
  { value: 'access', label: 'Account Access', icon: '🔐' },
  { value: 'feature', label: 'Feature Request', icon: '✨' },
  { value: 'bug', label: 'Report a Bug', icon: '🐛' },
  { value: 'general', label: 'General Inquiry', icon: '❓' }
];

const SupportTicketSubmit = () => {
  const fileInputRef = useRef(null);
  const [formData, setFormData] = useState({
    userName: '',
    userEmail: '',
    userPhone: '',
    smBranch: '',
    issueCategory: '',
    issueTitle: '',
    issueDescription: '',
    files: []
  });

  const [uiState, setUiState] = useState({
    loading: false,
    submitted: false,
    ticketId: '',
    dragActive: false,
    message: null
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const newFiles = Array.from(e.target.files);
      setFormData(prev => ({ ...prev, files: [...prev.files, ...newFiles] }));
    }
  };

  const removeFile = (index) => {
    setFormData(prev => ({
      ...prev,
      files: prev.files.filter((_, i) => i !== index)
    }));
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setUiState(prev => ({ ...prev, dragActive: true }));
    } else if (e.type === "dragleave") {
      setUiState(prev => ({ ...prev, dragActive: false }));
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setUiState(prev => ({ ...prev, dragActive: false }));
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const newFiles = Array.from(e.dataTransfer.files);
      setFormData(prev => ({ ...prev, files: [...prev.files, ...newFiles] }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setUiState(prev => ({ ...prev, loading: true, message: null }));

    try {
      // Prepare ticket data for Firebase
      const ticketData = {
        userName: formData.userName,
        userEmail: formData.userEmail,
        userPhone: formData.userPhone,
        smBranch: formData.smBranch,
        issueCategory: formData.issueCategory,
        issueTitle: formData.issueTitle,
        issueDescription: formData.issueDescription,
        status: 'open',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        // Store file metadata
        attachments: formData.files.map(file => ({
          name: file.name,
          size: file.size,
          type: file.type,
          lastModified: file.lastModified
        })),
        // Additional metadata for display
        branchLabel: SM_BRANCHES.find(b => b.value === formData.smBranch)?.label || 'N/A',
        categoryLabel: ISSUE_CATEGORIES.find(cat => cat.value === formData.issueCategory)?.label || 'N/A',
      };

      console.log('Submitting ticket data:', ticketData);

      // Add document to Firestore 'supportTickets' collection
      const docRef = await addDoc(collection(db, 'supportTickets'), ticketData);
      
      // Use the Firestore-generated document ID as ticket ID
      const newTicketId = docRef.id;

      console.log('Ticket successfully saved with ID:', newTicketId);

      setUiState({
        loading: false,
        submitted: true,
        ticketId: newTicketId,
        dragActive: false,
        message: { 
          type: 'success', 
          text: `Ticket ${newTicketId} submitted successfully! We'll get back to you soon.` 
        }
      });

    } catch (error) {
      console.error('Error submitting ticket to Firebase:', error);
      console.error('Error details:', error.code, error.message);
      
      let errorMessage = 'Failed to submit ticket. Please try again.';
      
      if (error.code === 'permission-denied') {
        errorMessage = 'Database permission denied. Please check Firebase rules.';
      } else if (error.code === 'unavailable') {
        errorMessage = 'Network error. Please check your internet connection.';
      }
      
      setUiState(prev => ({
        ...prev,
        loading: false,
        message: { 
          type: 'error', 
          text: errorMessage
        }
      }));
    }
  };

  const resetForm = () => {
    setFormData({
      userName: '',
      userEmail: '',
      userPhone: '',
      smBranch: '',
      issueCategory: '',
      issueTitle: '',
      issueDescription: '',
      files: []
    });
    setUiState({
      loading: false,
      submitted: false,
      ticketId: '',
      dragActive: false,
      message: null
    });
  };

  const MessageNotification = ({ message, onDismiss }) => {
    if (!message) return null;

    return (
      <div className={`message-notification ${message.type === 'success' ? 'message-success' : 'message-error'}`}>
        {message.type === 'success' ? <CheckCircle className="notification-icon" /> : <AlertTriangle className="notification-icon" />}
        <span className="notification-text">{message.text}</span>
        <button onClick={onDismiss} className="notification-dismiss">
          <X className="notification-icon-small" />
        </button>
      </div>
    );
  };

  if (uiState.submitted) {
    return (
      <div className="support-ticket-container">
        <MessageNotification message={uiState.message} onDismiss={() => setUiState(prev => ({ ...prev, message: null }))} />
        
        <div className="ticket-container">
          <div className="ticket-header">
            <h1><CheckCircle className="header-icon" /> Ticket Submitted Successfully</h1>
            <p>We have received your support request and will get back to you shortly.</p>
          </div>
          
          <div className="ticket-content">
            <div className="success-message">
              <div className="success-icon">
                <CheckCircle className="success-icon-large" />
              </div>
              <h2>Submission Confirmed!</h2>
              <p>A confirmation email has been sent to <strong>{formData.userEmail}</strong>.</p>
              
              <div className="ticket-id-display">
                Ticket ID: {uiState.ticketId}
              </div>
              
              <div className="ticket-details-grid">
                <div className="ticket-detail-item">
                  <span className="detail-label">Status:</span>
                  <span className="detail-value status-open">Open</span>
                </div>
                <div className="ticket-detail-item">
                  <span className="detail-label">Branch:</span>
                  <span className="detail-value">
                    {SM_BRANCHES.find(b => b.value === formData.smBranch)?.label || 'N/A'}
                  </span>
                </div>
                <div className="ticket-detail-item">
                  <span className="detail-label">Category:</span>
                  <span className="detail-value">
                    {ISSUE_CATEGORIES.find(cat => cat.value === formData.issueCategory)?.label || 'N/A'}
                  </span>
                </div>
              </div>

              <button className="btn btn-success" onClick={resetForm}>
                Submit Another Ticket
              </button>
            </div>
          </div>
          
          <div className="ticket-footer">
            <p>Need immediate assistance? Contact our support team directly.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="support-ticket-container">
      <MessageNotification message={uiState.message} onDismiss={() => setUiState(prev => ({ ...prev, message: null }))} />
      
      <div className="ticket-container">
        <div className="ticket-header">
          <h1><Ticket className="header-icon" /> Support Ticket Submission</h1>
          <p>Report an issue or request assistance from our support team</p>
        </div>

        <div className="ticket-content">
          <form onSubmit={handleSubmit} className="ticket-form">
            <div className="form-section">
              <h3 className="form-section-title">
                <User className="section-icon" /> Contact Information
              </h3>
              
              <div className="form-grid">
                <div className="form-group">
                  <label htmlFor="userName">Full Name *</label>
                  <input
                    type="text"
                    id="userName"
                    name="userName"
                    value={formData.userName}
                    onChange={handleInputChange}
                    placeholder="Enter your full name"
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="userEmail">Email Address *</label>
                  <input
                    type="email"
                    id="userEmail"
                    name="userEmail"
                    value={formData.userEmail}
                    onChange={handleInputChange}
                    placeholder="Enter your email"
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="userPhone">Phone Number</label>
                  <input
                    type="tel"
                    id="userPhone"
                    name="userPhone"
                    value={formData.userPhone}
                    onChange={handleInputChange}
                    placeholder="Enter your phone number"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="smBranch">Branch Location *</label>
                  <select
                    id="smBranch"
                    name="smBranch"
                    value={formData.smBranch}
                    onChange={handleInputChange}
                    required
                  >
                    <option value="">Select Branch</option>
                    {SM_BRANCHES.map(branch => (
                      <option key={branch.value} value={branch.value}>{branch.label}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            <div className="form-section">
              <h3 className="form-section-title">
                <AlertCircle className="section-icon" /> Issue Details
              </h3>

              <div className="form-grid">
                <div className="form-group full-width">
                  <label htmlFor="issueCategory">Category *</label>
                  <select
                    id="issueCategory"
                    name="issueCategory"
                    value={formData.issueCategory}
                    onChange={handleInputChange}
                    required
                  >
                    <option value="">Select Category</option>
                    {ISSUE_CATEGORIES.map(cat => (
                      <option key={cat.value} value={cat.value}>
                        {cat.icon} {cat.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group full-width">
                  <label htmlFor="issueTitle">Subject *</label>
                  <input
                    type="text"
                    id="issueTitle"
                    name="issueTitle"
                    value={formData.issueTitle}
                    onChange={handleInputChange}
                    placeholder="Brief summary of the issue"
                    required
                  />
                </div>

                <div className="form-group full-width">
                  <label htmlFor="issueDescription">Description *</label>
                  <textarea
                    id="issueDescription"
                    name="issueDescription"
                    value={formData.issueDescription}
                    onChange={handleInputChange}
                    placeholder="Please describe the issue in detail..."
                    required
                    rows="6"
                  />
                </div>
              </div>

              <div className="form-group full-width">
                <label>Attachments (Optional)</label>
                <div 
                  className={`file-drop-zone ${uiState.dragActive ? 'active' : ''}`}
                  onDragEnter={handleDrag}
                  onDragLeave={handleDrag}
                  onDragOver={handleDrag}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    onChange={handleFileChange}
                    className="file-input-hidden"
                  />
                  <div className="file-drop-icon">
                    <Paperclip className="file-icon" />
                  </div>
                  <p className="file-drop-text">
                    <span className="file-drop-cta">Click to upload</span> or drag files here
                  </p>
                  <span className="file-drop-hint">Maximum file size: 10MB (Images, PDF, Documents)</span>
                </div>

                {formData.files.length > 0 && (
                  <div className="file-list-container">
                    {formData.files.map((file, idx) => (
                      <div key={idx} className="file-list-item">
                        <div className="file-info">
                          <FileText className="file-item-icon" />
                          <span className="file-name">{file.name}</span>
                        </div>
                        <button 
                          type="button" 
                          onClick={() => removeFile(idx)}
                          className="file-remove-btn"
                        >
                          <X className="file-remove-icon" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <button 
              type="submit" 
              className="submit-btn"
              disabled={uiState.loading}
            >
              {uiState.loading ? (
                <>
                  <Loader2 className="loading-spinner" />
                  Submitting...
                </>
              ) : (
                <>
                  <Send className="submit-icon" />
                  Submit Ticket
                </>
              )}
            </button>
          </form>
        </div>

        <div className="ticket-footer">
          <p>For urgent matters, please contact our support hotline directly.</p>
        </div>
      </div>
    </div>
  );
};

export default SupportTicketSubmit;