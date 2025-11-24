import React, { useState, useEffect } from 'react';
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

  // Mock data
  const tickets = [
    { 
      id: 1001, 
      subject: 'Email notifications broken', 
      requester: 'Jane Doe', 
      priority: 'High', 
      status: 'Pending', 
      created: '2024-10-25 10:00 AM', 
      description: "Users are not receiving any email notifications for ticket updates or new assignments. This started happening approximately one hour ago." 
    },
    { 
      id: 1002, 
      subject: 'Login flow broken on Safari', 
      requester: 'Mark Lee', 
      priority: 'High', 
      status: 'Pending', 
      created: '2024-10-25 09:30 AM', 
      description: "Multiple users reporting that the login button does nothing when using Safari (version 17.x)." 
    },
    { 
      id: 1003, 
      subject: 'Typo on Contact Us page', 
      requester: 'Support Team', 
      priority: 'Low', 
      status: 'Resolved', 
      created: '2024-10-24 11:15 AM', 
      description: "There is a minor spelling mistake in the main paragraph of the contact us section." 
    },
    { 
      id: 1004, 
      subject: 'Request for API key renewal', 
      requester: 'External Partner', 
      priority: 'Medium', 
      status: 'Pending', 
      created: '2024-10-24 02:00 PM', 
      description: "The API key provided to our integration team is set to expire next week. Requesting a renewal key." 
    },
    { 
      id: 1005, 
      subject: 'Performance lag when running large reports', 
      requester: 'Admin User', 
      priority: 'Medium', 
      status: 'Pending', 
      created: '2024-10-23 04:45 PM', 
      description: "Running any report containing more than 50,000 records takes over 3 minutes to complete." 
    },
  ];

  const submissionUrl = "https://support.example.com/new-ticket?appId=12345";
  const qrCodeUrl = `https://placehold.co/180x180/6E9FC1/FFFFFF?text=QR+Code`;

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

  const submitReply = () => {
    if (replyText.trim() === '') {
      showAlertMessage('Please enter a response before sending.', 'danger');
      return;
    }
    
    // Mock submission logic
    console.log('Sending reply:', replyText);
    showAlertMessage('Reply sent and ticket resolved (mock action).', 'success');
    closeModal();
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
    return tickets.map(ticket => (
      <tr key={ticket.id} onClick={() => openModal(ticket.id)}>
        <td>#{ticket.id}</td>
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
          <h3>Open Tickets</h3>
          <div className="chart-container open-tickets-chart">
            <div className="bar high">
              <span className="bar-label">High</span>
            </div>
            <div className="bar medium">
              <span className="bar-label">Medium</span>
            </div>
            <div className="bar low">
              <span className="bar-label">Low</span>
            </div>
            <div className="bar resolved">
              <span className="bar-label">Resolved</span>
            </div>
          </div>
        </div>
        
        {/* Card 2: Response Time (Simulated Doughnut Chart) */}
        <div className="chart-card">
          <h3>Avg. Response Time (24h)</h3>
          <div className="chart-container response-time-chart">
            <div className="doughnut-container"></div>
            <div className="response-time-display">1h 15m</div>
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
          <h3>Recent Feedback & Submissions</h3>
          <p className="user-submission-description">
            Latest bug reports and feature requests from the last 24 hours.
          </p>
        </div>
        <div className="user-submission-list">
          <div className="user-submission-item">
            <i 
              className="fas fa-bug submission-icon" 
              style={{color: 'var(--danger-color)'}}
            ></i>
            <div className="submission-meta">
              <h4>"Checkout button fails intermittently"</h4>
              <p>Reported by Jane Smith (Customer)</p>
            </div>
            <span className="submission-time">2 hours ago</span>
          </div>
          <div className="user-submission-item">
            <i 
              className="fas fa-lightbulb submission-icon" 
              style={{color: 'var(--info-color)'}}
            ></i>
            <div className="submission-meta">
              <h4>Feature Request: Dark mode for mobile app</h4>
              <p>Submitted by Team Alpha (Internal)</p>
            </div>
            <span className="submission-time">4 hours ago</span>
          </div>
          <div className="user-submission-item">
            <i 
              className="fas fa-exclamation-triangle submission-icon" 
              style={{color: 'var(--warning-color)'}}
            ></i>
            <div className="submission-meta">
              <h4>Latency spikes in US-East servers</h4>
              <p>Reported by John Doe (Monitor)</p>
            </div>
            <span className="submission-time">8 hours ago</span>
          </div>
        </div>
      </div>

      {/* Tickets Table */}
      <div className="content-card ticket-table-container">
        <h3>Priority Tickets</h3>
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
              Ticket #{selectedTicket?.id}: {selectedTicket?.subject}
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
                  Send Reply & Resolve
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default SupportTickets;