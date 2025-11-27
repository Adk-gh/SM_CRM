import React, { useState, useEffect } from 'react';
import { collection, getDocs, doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../../firebase';
import './Support.css';

const SupportTickets = () => {
  // State management
  const [theme, setTheme] = useState('light');
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [replyText, setReplyText] = useState('');
  const [showAlert, setShowAlert] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  const [alertType, setAlertType] = useState('success');
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);

  const submissionUrl = "https://support.example.com/new-ticket?appId=12345";
  const qrCodeUrl = `https://placehold.co/180x180/6E9FC1/FFFFFF?text=QR+Code`;

  // Fetch tickets from Firebase
  useEffect(() => {
    fetchTickets();
  }, []);

  const fetchTickets = async () => {
    try {
      setLoading(true);
      const querySnapshot = await getDocs(collection(db, 'supportTickets'));
      const ticketsData = [];
      
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        ticketsData.push({
          id: doc.id,
          ...data,
          // Convert Firestore timestamp to readable date
          created: data.createdAt?.toDate?.().toLocaleString() || 'Unknown date',
          // Ensure all required fields exist
          subject: data.issueTitle || 'No Subject',
          requester: data.userName || 'Unknown User',
          priority: 'Medium', // Default since we removed priority selection
          status: data.status || 'open',
          description: data.issueDescription || 'No description provided'
        });
      });

      // Sort by creation date (newest first)
      ticketsData.sort((a, b) => new Date(b.createdAt?.toDate?.()) - new Date(a.createdAt?.toDate?.()));
      
      setTickets(ticketsData);
    } catch (error) {
      console.error('Error fetching tickets:', error);
      showAlertMessage('Failed to load tickets from database.', 'danger');
    } finally {
      setLoading(false);
    }
  };

  // Theme management
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') || 'light';
    setTheme(savedTheme);
    document.documentElement.setAttribute('data-theme', savedTheme);
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
  };

  // Modal functions
  const openModal = (ticketId) => {
    const ticket = tickets.find(t => t.id === ticketId);
    setSelectedTicket(ticket);
    setModalOpen(true);
    setReplyText('');
  };

  const closeModal = () => {
    setModalOpen(false);
    setSelectedTicket(null);
  };

  const handleSuggestionClick = (reply) => {
    setReplyText(reply + '\n\n---\n');
  };

  const submitReply = async () => {
    if (replyText.trim() === '') {
      showAlertMessage('Please enter a response before sending.', 'danger');
      return;
    }
    
    try {
      // Update the ticket in Firebase
      const ticketRef = doc(db, 'supportTickets', selectedTicket.id);
      await updateDoc(ticketRef, {
        status: 'resolved',
        agentReply: replyText,
        resolvedAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });

      // Update local state
      setTickets(prevTickets => 
        prevTickets.map(ticket => 
          ticket.id === selectedTicket.id 
            ? { 
                ...ticket, 
                status: 'resolved',
                agentReply: replyText
              }
            : ticket
        )
      );

      showAlertMessage('Reply sent and ticket resolved successfully!', 'success');
      closeModal();
    } catch (error) {
      console.error('Error updating ticket:', error);
      showAlertMessage('Failed to update ticket. Please try again.', 'danger');
    }
  };

  // Alert functions
  const showAlertMessage = (message, type) => {
    setAlertMessage(message);
    setAlertType(type);
    setShowAlert(true);
    
    setTimeout(() => {
      setShowAlert(false);
    }, 3000);
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text)
      .then(() => {
        showAlertMessage('Link copied to clipboard!', 'success');
      })
      .catch(err => {
        console.error('Could not copy text: ', err);
        showAlertMessage('Failed to copy link.', 'danger');
      });
  };

  // Calculate statistics for charts
  const calculateStats = () => {
    const openTickets = tickets.filter(ticket => ticket.status === 'open');
    const resolvedTickets = tickets.filter(ticket => ticket.status === 'resolved');
    
    return {
      open: openTickets.length,
      resolved: resolvedTickets.length,
      total: tickets.length
    };
  };

  const stats = calculateStats();

  // Render functions
  const renderPriorityBadge = (priority) => {
    const priorityClass = `priority-${priority.toLowerCase()}`;
    return <span className={`priority-badge ${priorityClass}`}>{priority}</span>;
  };

  const renderStatusBadge = (status) => {
    const statusClass = `status-${status.toLowerCase()}`;
    return <span className={`status-badge ${statusClass}`}>{status}</span>;
  };

  const renderTickets = () => {
    if (loading) {
      return (
        <tr>
          <td colSpan="7" style={{ textAlign: 'center', padding: '20px' }}>
            <i className="fas fa-spinner fa-spin"></i> Loading tickets...
          </td>
        </tr>
      );
    }

    if (tickets.length === 0) {
      return (
        <tr>
          <td colSpan="7" style={{ textAlign: 'center', padding: '20px' }}>
            No tickets found. Tickets submitted through the form will appear here.
          </td>
        </tr>
      );
    }

    return tickets.map(ticket => (
      <tr key={ticket.id} onClick={() => openModal(ticket.id)}>
        <td>#{ticket.id.substring(0, 8)}...</td>
        <td>{ticket.subject}</td>
        <td>{ticket.requester}</td>
        <td>{renderPriorityBadge(ticket.priority)}</td>
        <td>{renderStatusBadge(ticket.status)}</td>
        <td>{ticket.created}</td>
        <td>
          <button 
            className="action-btn" 
            onClick={(e) => {
              e.stopPropagation();
              openModal(ticket.id);
            }}
          >
            <i className="fas fa-eye"></i> View
          </button>
        </td>
      </tr>
    ));
  };

  // Render user submissions from actual tickets
  const renderUserSubmissions = () => {
    const recentTickets = tickets.slice(0, 3); // Show 3 most recent tickets
    
    if (recentTickets.length === 0) {
      return (
        <div className="user-submission-item">
          <i 
            className="fas fa-info-circle submission-icon" 
            style={{color: 'var(--info-color)'}}
          ></i>
          <div className="submission-meta">
            <h4>No recent submissions</h4>
            <p>Submitted tickets will appear here</p>
          </div>
        </div>
      );
    }

    return recentTickets.map(ticket => {
      let icon = 'fas fa-bug';
      let iconColor = 'var(--danger-color)';
      
      if (ticket.issueCategory === 'feature') {
        icon = 'fas fa-lightbulb';
        iconColor = 'var(--info-color)';
      } else if (ticket.issueCategory === 'general') {
        icon = 'fas fa-question-circle';
        iconColor = 'var(--warning-color)';
      }

      return (
        <div key={ticket.id} className="user-submission-item">
          <i 
            className={`${icon} submission-icon`}
            style={{color: iconColor}}
          ></i>
          <div className="submission-meta">
            <h4>"{ticket.subject}"</h4>
            <p>Submitted by {ticket.requester} ({ticket.branchLabel || 'Unknown Branch'})</p>
          </div>
          <span className="submission-time">
            {ticket.createdAt?.toDate?.().toLocaleDateString() || 'Recent'}
          </span>
        </div>
      );
    });
  };

  return (
    <div className="support-tickets-full-width">
      {/* Theme Toggle Button */}
      <div className="theme-toggle">
        <button 
          id="theme-btn" 
          className="theme-btn" 
          aria-label="Toggle theme"
          onClick={toggleTheme}
        >
          <i className={theme === 'dark' ? 'fas fa-moon' : 'fas fa-sun'}></i>
        </button>
      </div>

      {/* Alert Message */}
      {showAlert && (
        <div 
          className="custom-message-box"
          style={{
            backgroundColor: alertType === 'success' ? 'var(--success-color)' : 'var(--danger-color)'
          }}
        >
          {alertMessage}
        </div>
      )}

      {/* Charts Section */}
      <div className="charts-section">
        {/* Card 1: Open Tickets */}
        <div className="chart-card">
          <h3>Ticket Overview</h3>
          <div className="chart-container open-tickets-chart">
            <div className="bar high" style={{height: `${(stats.open / Math.max(stats.total, 1)) * 100}%`}}>
              <span className="bar-label">Open ({stats.open})</span>
            </div>
            <div className="bar resolved" style={{height: `${(stats.resolved / Math.max(stats.total, 1)) * 100}%`}}>
              <span className="bar-label">Resolved ({stats.resolved})</span>
            </div>
          </div>
          <div className="chart-footer">
            Total Tickets: {stats.total}
          </div>
        </div>
        
        {/* Card 2: Response Time (Simulated Doughnut Chart) */}
        <div className="chart-card">
          <h3>Ticket Categories</h3>
          <div className="chart-container response-time-chart">
            <div className="category-stats">
              {ISSUE_CATEGORIES.map(cat => {
                const count = tickets.filter(t => t.issueCategory === cat.value).length;
                return (
                  <div key={cat.value} className="category-item">
                    <span className="category-icon">{cat.icon}</span>
                    <span className="category-name">{cat.label}</span>
                    <span className="category-count">({count})</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* QR Code Section */}
      <div className="content-card qr-code-section">
        <div className="qr-code-header">
          <h3>Quick Access: Submit a Ticket</h3>
          <button className="action-btn">
            <i className="fas fa-share-alt"></i> Share Link
          </button>
        </div>
        <div className="qr-code-content">
          <div className="qr-code-display">
            <div className="qr-code-container">
              <img 
                src={qrCodeUrl} 
                alt="QR Code" 
                style={{
                  width: '180px', 
                  height: '180px', 
                  display: 'block', 
                  borderRadius: '4px'
                }} 
              />
            </div>
            <div className="qr-code-info">
              <h4>Direct Submission URL</h4>
              <div className="qr-url">{submissionUrl}</div>
              
              <div className="instructions">
                <h5>How to Use</h5>
                <ol>
                  <li>Scan the QR code with your mobile device.</li>
                  <li>The link opens the pre-filled support form.</li>
                  <li>Alternatively, copy the URL and share it directly.</li>
                </ol>
              </div>
              
              <div className="download-options">
                <button className="action-btn btn-secondary">
                  <i className="fas fa-download"></i> Download PNG
                </button>
                <button 
                  className="action-btn btn-primary"
                  onClick={() => copyToClipboard(submissionUrl)}
                >
                  <i className="fas fa-copy"></i> Copy Link
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* User Submissions Card */}
      <div className="content-card user-submission-card">
        <div className="user-submission-header">
          <h3>Recent Ticket Submissions</h3>
          <p className="user-submission-description">
            Latest support tickets submitted by users.
          </p>
        </div>
        <div className="user-submission-list">
          {renderUserSubmissions()}
        </div>
      </div>

      {/* Tickets Table */}
      <div className="content-card ticket-table-container">
        <div className="ticket-table-header">
          <h3>All Support Tickets ({tickets.length})</h3>
          <button 
            className="action-btn btn-secondary" 
            onClick={fetchTickets}
            disabled={loading}
          >
            <i className={`fas ${loading ? 'fa-spinner fa-spin' : 'fa-sync'}`}></i> 
            {loading ? ' Refreshing...' : ' Refresh'}
          </button>
        </div>
        <div className="ticket-table-wrapper">
          <table className="ticket-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Subject</th>
                <th>Requester</th>
                <th>Priority</th>
                <th>Status</th>
                <th>Created</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {renderTickets()}
            </tbody>
          </table>
        </div>
      </div>

      {/* Ticket Detail/Reply Modal */}
      <div className={`modal ${modalOpen ? 'active' : ''}`}>
        <div className="modal-content">
          <div className="modal-header">
            <h3>
              Ticket #{selectedTicket?.id?.substring(0, 8)}...: {selectedTicket?.subject}
            </h3>
            <button className="close-modal" onClick={closeModal}>
              <i className="fas fa-times"></i>
            </button>
          </div>

          {selectedTicket && (
            <>
              <div className="ticket-details">
                <div className="detail-item">
                  <span className="detail-label">Requester</span>
                  <span className="detail-value">
                    {selectedTicket.requester}
                  </span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Email</span>
                  <span className="detail-value">
                    {selectedTicket.userEmail}
                  </span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Branch</span>
                  <span className="detail-value">
                    {selectedTicket.branchLabel}
                  </span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Category</span>
                  <span className="detail-value">
                    {selectedTicket.categoryLabel}
                  </span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Status</span>
                  <span className="detail-value">
                    {renderStatusBadge(selectedTicket.status)}
                  </span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Priority</span>
                  <span className="detail-value">
                    {renderPriorityBadge(selectedTicket.priority)}
                  </span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Created At</span>
                  <span className="detail-value">
                    {selectedTicket.created}
                  </span>
                </div>
              </div>

              <div className="suggestions-section">
                <h4>Ticket Description</h4>
                <p style={{color: 'var(--text-primary)', marginBottom: '20px', lineHeight: '1.6'}}>
                  {selectedTicket.description}
                </p>
                
                <h4>Quick Responses & Suggestions</h4>
                <div className="suggestions-grid">
                  <button 
                    className="suggestion-btn" 
                    onClick={() => handleSuggestionClick("I'm escalating this to the DevOps team immediately.")}
                  >
                    Escalate to DevOps
                  </button>
                  <button 
                    className="suggestion-btn" 
                    onClick={() => handleSuggestionClick("Thank you for reporting this. We are investigating the issue now.")}
                  >
                    Investigating
                  </button>
                  <button 
                    className="suggestion-btn" 
                    onClick={() => handleSuggestionClick("This issue has been resolved and verified. Please confirm on your end.")}
                  >
                    Issue Resolved
                  </button>
                  <button 
                    className="suggestion-btn" 
                    onClick={() => handleSuggestionClick("Can you please send me a screenshot of the error?")}
                  >
                    Request Screenshot
                  </button>
                </div>
              </div>

              <div className="reply-section">
                <label htmlFor="reply-textarea">Agent Reply</label>
                <textarea 
                  id="reply-textarea" 
                  placeholder="Type your response or use a quick reply suggestion above..."
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                ></textarea>
              </div>

              <div className="modal-actions">
                <button className="btn btn-secondary" onClick={closeModal}>
                  Cancel
                </button>
                <button className="btn btn-primary" onClick={submitReply}>
                  {selectedTicket.status === 'resolved' ? 'Update Reply' : 'Send Reply & Resolve'}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

// Add the ISSUE_CATEGORIES constant at the bottom
const ISSUE_CATEGORIES = [
  { value: 'technical', label: 'Technical Issue', icon: '💻' },
  { value: 'billing', label: 'Billing & Payments', icon: '💳' },
  { value: 'access', label: 'Account Access', icon: '🔐' },
  { value: 'feature', label: 'Feature Request', icon: '✨' },
  { value: 'bug', label: 'Report a Bug', icon: '🐛' },
  { value: 'general', label: 'General Inquiry', icon: '❓' }
];

export default SupportTickets;