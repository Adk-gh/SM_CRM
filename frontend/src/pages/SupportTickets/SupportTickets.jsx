import React, { useState, useEffect } from 'react';
import { collection, getDocs, doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../../firebase'; 
import './Support.css';

// =======================================
// API CONSTANTS - USE YOUR ACTUAL URL
// =======================================
const FORWARD_ALL_API_URL = 'https://sm-crm-rho.vercel.app/api/forward-all';

// =======================================
// SYSTEM & CATEGORY MAPPING CONSTANTS
// =======================================
const ISSUE_CATEGORIES = [
    { value: 'technical', label: 'Technical Issue', icon: '💻' },
    { value: 'billing', label: 'Billing & Payments', icon: '💳' },
    { value: 'access', label: 'Account Access', icon: '🔐' },
    { value: 'feature', label: 'Feature Request', icon: '✨' },
    { value: 'bug', label: 'Report a Bug', icon: '🐛' },
    { value: 'general', label: 'General Inquiry', icon: '❓' },
    { value: 'transaction', label: 'Transaction Error', icon: '💸' },
    { value: 'fulfillment', label: 'Fulfillment/Shipping', icon: '📦' },
    { value: 'stock_issue', label: 'Inventory Stock Issue', icon: '📦' },
    { value: 'order_status', label: 'Order Status Inquiry', icon: '🛍️' },
    { value: 'website_error', label: 'E-commerce Website Error', icon: '🌐' }
];

const RELEVANT_CATEGORIES = [
    'billing', 
    'transaction', 
    'fulfillment', 
    'stock_issue', 
    'order_status', 
    'website_error'
];

// =======================================
// MOCK AUTH HOOK
// =======================================
const useMockAuth = () => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    const getIdToken = async () => {
        return 'mock-firebase-id-token-12345'; 
    };

    useEffect(() => {
        const simulatedAdmin = {
            uid: 'admin123',
            email: 'admin@example.com',
            role: 'admin', 
            getIdToken: getIdToken, 
        };

        setTimeout(() => {
            setUser(simulatedAdmin);
            setLoading(false);
        }, 500); 
    }, []);

    const isAdmin = user && (user.role === 'admin' || user.role === 'marketing');
    return { user, loading: loading, isAdmin };
};

const SupportTickets = () => {
    const { user, loading: authLoading, isAdmin } = useMockAuth(); 
    const [theme, setTheme] = useState('light');
    const [modalOpen, setModalOpen] = useState(false);
    const [selectedTicket, setSelectedTicket] = useState(null);
    const [replyText, setReplyText] = useState('');
    const [showAlert, setShowAlert] = useState(false);
    const [alertMessage, setAlertMessage] = useState('');
    const [alertType, setAlertType] = useState('success');
    const [tickets, setTickets] = useState([]);
    const [loading, setLoading] = useState(true); 
    const [bulkForwardLoading, setBulkForwardLoading] = useState(false);

    // --- Data Fetching ---
    useEffect(() => {
        if (authLoading) return;
        if (isAdmin) {
            fetchTickets();
        } else {
            setLoading(false);
            if (user) {
                showAlertMessage('Access Denied: Your account does not have staff privileges to view tickets.', 'danger');
            }
        }
    }, [isAdmin, authLoading, user]); 

    const fetchTickets = async () => {
        try {
            setLoading(true);
            const querySnapshot = await getDocs(collection(db, 'supportTickets'));
            const ticketsData = [];
            
            querySnapshot.forEach((doc) => {
                const data = doc.data();
                const categoryMatch = ISSUE_CATEGORIES.find(cat => cat.value === data.issueCategory);

                ticketsData.push({
                    id: doc.id,
                    ...data,
                    created: data.createdAt?.toDate?.().toLocaleString() || 'Unknown date',
                    subject: data.issueTitle || 'No Subject',
                    requester: data.userName || 'Unknown User',
                    priority: data.priority || 'Medium',
                    status: data.status || 'open',
                    description: data.issueDescription || 'No description provided',
                    categoryLabel: categoryMatch?.label || 'General Inquiry',
                    branchLabel: data.smBranch || 'N/A',
                    posNotificationStatus: data.posNotificationStatus || null 
                });
            });

            ticketsData.sort((a, b) => new Date(b.createdAt?.toDate?.()) - new Date(a.createdAt?.toDate?.()));
            setTickets(ticketsData);
        } catch (error) {
            console.error('Error fetching tickets:', error);
            showAlertMessage('Failed to load tickets from database.', 'danger');
        } finally {
            setLoading(false);
        }
    };

    // --- Theme Functions ---
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

    const openModal = (ticketId) => {
        const ticket = tickets.find(t => t.id === ticketId);
        setSelectedTicket(ticket);
        setModalOpen(true);
        setReplyText(ticket?.agentReply || '');
    };

    const closeModal = () => {
        setModalOpen(false);
        setSelectedTicket(null);
    };

    const showAlertMessage = (message, type) => {
        setAlertMessage(message);
        setAlertType(type);
        setShowAlert(true);
        setTimeout(() => {
            setShowAlert(false);
        }, 5000);
    };

    // --- UPDATED: Bulk Forward All Tickets ---
    const handleBulkForwardAll = async () => {
        if (!isAdmin || !user) {
            showAlertMessage('Permission denied. Must be logged in as staff.', 'danger');
            return;
        }

        try {
            setBulkForwardLoading(true);
            showAlertMessage('Bulk forwarding all tickets to external systems...', 'info');

            const response = await fetch(FORWARD_ALL_API_URL, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                }
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
            }

            const result = await response.json();
            
            if (result.forwarded && result.forwarded.length > 0) {
                showAlertMessage(`Successfully forwarded ${result.forwarded.length} tickets to external systems!`, 'success');
                
                // Update local ticket statuses based on the result
                const updatedTickets = tickets.map(ticket => {
                    const ticketResult = result.forwarded.find(item => item.ticketId === ticket.id);
                    if (ticketResult && ticketResult.status.includes('forwarded')) {
                        return {
                            ...ticket,
                            posNotificationStatus: 'sent',
                            posNotificationLog: new Date()
                        };
                    }
                    return ticket;
                });
                
                setTickets(updatedTickets);
                
                // Also update Firestore with the new statuses
                await updateFirestoreTickets(result.forwarded);
                
            } else {
                showAlertMessage('No tickets were forwarded. Please check if there are tickets to process.', 'info');
            }

        } catch (error) {
            console.error('Bulk forward failed:', error);
            showAlertMessage(`Bulk forward failed: ${error.message}`, 'danger');
        } finally {
            setBulkForwardLoading(false);
        }
    };

    // Helper function to update Firestore with forwarding status
    const updateFirestoreTickets = async (forwardedResults) => {
        try {
            for (const result of forwardedResults) {
                if (result.status.includes('forwarded')) {
                    const ticketRef = doc(db, 'supportTickets', result.ticketId);
                    await updateDoc(ticketRef, {
                        posNotificationStatus: 'sent',
                        posNotificationLog: serverTimestamp(),
                        updatedAt: serverTimestamp()
                    });
                }
            }
        } catch (error) {
            console.error('Error updating Firestore tickets:', error);
        }
    };

    // --- Individual Ticket Forwarding ---
    const handleNotifySystem = async (ticket) => {
        if (!isAdmin || !user) {
            showAlertMessage('Permission denied. Must be logged in as staff.', 'danger');
            return;
        }

        if (ticket.posNotificationStatus === 'sent') {
             showAlertMessage('Notification has already been sent. Skipping API call.', 'info');
             return;
        }

        try {
            setLoading(true);
            showAlertMessage(`Forwarding ticket to external system...`, 'info');

            // Since your API forwards all tickets, we'll call it and then check the specific result
            const response = await fetch(FORWARD_ALL_API_URL, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                }
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const result = await response.json();
            
            // Find if our specific ticket was forwarded
            const ticketResult = result.forwarded?.find(item => item.ticketId === ticket.id);
            
            const ticketRef = doc(db, 'supportTickets', ticket.id);
            const statusUpdate = {};

            if (ticketResult && ticketResult.status.includes('forwarded')) {
                statusUpdate.posNotificationStatus = 'sent'; 
                statusUpdate.posNotificationLog = serverTimestamp();
                showAlertMessage(`Successfully forwarded ticket to external system!`, 'success');
            } else {
                statusUpdate.posNotificationStatus = 'failed';
                statusUpdate.posNotificationLog = serverTimestamp();
                showAlertMessage(`Failed to forward ticket. System response: ${ticketResult?.status}`, 'danger');
            }
            
            await updateDoc(ticketRef, { ...statusUpdate, updatedAt: serverTimestamp() });

            // Update local state
            setTickets(prevTickets => 
                prevTickets.map(t => 
                  t.id === ticket.id ? { ...t, ...statusUpdate } : t
                )
            );
            
            setSelectedTicket(prev => prev ? { ...prev, ...statusUpdate } : null);

        } catch (error) {
            console.error('Notification failed:', error);
            showAlertMessage(`Failed to forward ticket. Error: ${error.message}`, 'danger');
        } finally {
            setLoading(false);
        }
    };

    // --- Ticket Resolution Handler ---
    const submitReply = async () => {
        if (replyText.trim() === '') {
            showAlertMessage('Please enter a response before sending.', 'danger');
            return;
        }
        
        if (!isAdmin) {
            showAlertMessage('Permission denied. You cannot modify tickets.', 'danger');
            return;
        }
        
        try {
            const ticketRef = doc(db, 'supportTickets', selectedTicket.id);
            
            const updateData = {
                status: 'resolved',
                agentReply: replyText,
                resolvedAt: serverTimestamp(),
                updatedAt: serverTimestamp(),
            };
            
            await updateDoc(ticketRef, updateData);

            setTickets(prevTickets => 
                prevTickets.map(ticket => 
                    ticket.id === selectedTicket.id 
                      ? { ...ticket, status: 'resolved', agentReply: replyText }
                      : ticket
                )
            );

            showAlertMessage('Reply sent and ticket resolved successfully!', 'success');
            closeModal();
        } catch (error) {
            console.error('Error updating ticket:', error);
            showAlertMessage('Failed to update ticket. Check console for details.', 'danger');
        }
    };
    
    // --- Utility & Render Functions ---
    const calculateStats = () => {
        const openTickets = tickets.filter(t => t.status === 'open');
        const resolvedTickets = tickets.filter(t => t.status === 'resolved');
        const forwardedTickets = tickets.filter(t => t.posNotificationStatus === 'sent');
        return { 
            open: openTickets.length, 
            resolved: resolvedTickets.length, 
            forwarded: forwardedTickets.length,
            total: tickets.length 
        };
    };

    const stats = calculateStats();
    
    const renderPriorityBadge = (priority) => <span className={`priority-badge priority-${priority.toLowerCase()}`}>{priority}</span>;
    const renderStatusBadge = (status) => <span className={`status-badge status-${status.toLowerCase()}`}>{status}</span>;

    const renderTickets = () => {
        if (authLoading || loading) return <tr><td colSpan="7" style={{ textAlign: 'center', padding: '20px' }}><i className="fas fa-spinner fa-spin"></i> {authLoading ? 'Verifying access...' : 'Loading tickets...'}</td></tr>;
        if (!isAdmin) return <tr><td colSpan="7" style={{ textAlign: 'center', padding: '20px', color: 'var(--danger-color)' }}><i className="fas fa-lock"></i> Access Denied. Insufficient privileges.</td></tr>;
        if (tickets.length === 0) return <tr><td colSpan="7" style={{ textAlign: 'center', padding: '20px' }}>No tickets found.</td></tr>;

        return tickets.map(ticket => (
            <tr key={ticket.id} onClick={() => openModal(ticket.id)}>
                <td>#{ticket.id.substring(0, 8)}...</td>
                <td>{ticket.subject}</td>
                <td>{ticket.requester}</td>
                <td>{renderPriorityBadge(ticket.priority)}</td>
                <td>{renderStatusBadge(ticket.status)}</td>
                <td>{ticket.created}</td>
                <td>
                    <button className="action-btn" onClick={(e) => { e.stopPropagation(); openModal(ticket.id); }}>
                        <i className="fas fa-eye"></i> View
                    </button>
                </td>
            </tr>
        ));
    };

    // --- Main Render Structure ---
    return (
        <div className="support-tickets-full-width">
            <div className="theme-toggle">
                <button id="theme-btn" className="theme-btn" aria-label="Toggle theme" onClick={toggleTheme}>
                    <i className={theme === 'dark' ? 'fas fa-moon' : 'fas fa-sun'}></i>
                </button>
            </div>

            {showAlert && (
                <div className="custom-message-box" style={{ 
                    backgroundColor: alertType === 'success' ? 'var(--success-color)' : 
                                   alertType === 'info' ? 'var(--info-color)' : 'var(--danger-color)' 
                }}>
                    {alertMessage}
                </div>
            )}

            {/* Dashboards and Stats */}
            {(isAdmin && !authLoading) && (
                <div className="charts-section">
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
                            <div>Total: {stats.total}</div>
                            <div>Forwarded: {stats.forwarded}</div>
                        </div>
                    </div>

                    {/* Bulk Forward Button */}
                    <div className="chart-card">
                        <h3>External Systems</h3>
                        <div className="bulk-actions">
                            <button 
                                className="btn btn-primary" 
                                onClick={handleBulkForwardAll}
                                disabled={bulkForwardLoading || tickets.length === 0}
                            >
                                <i className={`fas ${bulkForwardLoading ? 'fa-spinner fa-spin' : 'fa-paper-plane'}`}></i>
                                {bulkForwardLoading ? ' Forwarding All...' : ' Forward All Tickets'}
                            </button>
                            <p style={{ fontSize: '0.8rem', marginTop: '10px', color: 'var(--text-secondary)' }}>
                                Forward all relevant tickets to external systems
                            </p>
                        </div>
                    </div>
                </div>
            )}

            <div className="content-card ticket-table-container">
                <div className="ticket-table-header">
                    <h3>All Support Tickets ({tickets.length})</h3>
                    {isAdmin && (
                        <div className="header-actions">
                            <button className="action-btn btn-secondary" onClick={fetchTickets} disabled={loading || authLoading}>
                                <i className={`fas ${loading ? 'fa-spinner fa-spin' : 'fa-sync'}`}></i> 
                                {loading ? ' Refreshing...' : ' Refresh'}
                            </button>
                        </div>
                    )}
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
                        <tbody>{renderTickets()}</tbody>
                    </table>
                </div>
            </div>

            {/* Ticket Detail/Reply Modal */}
            <div className={`modal ${modalOpen ? 'active' : ''}`}>
                <div className="modal-content">
                    <div className="modal-header">
                        <h3>Ticket #{selectedTicket?.id?.substring(0, 8)}...: {selectedTicket?.subject}</h3>
                        <button className="close-modal" onClick={closeModal}><i className="fas fa-times"></i></button>
                    </div>

                    {selectedTicket && (
                        <>
                            <div className="ticket-details">
                                <div className="detail-item">
                                    <span className="detail-label">Category</span>
                                    <span className="detail-value">{selectedTicket.categoryLabel}</span>
                                </div>
                                <div className="detail-item">
                                    <span className="detail-label">Status</span>
                                    <span className="detail-value">{renderStatusBadge(selectedTicket.status)}</span>
                                </div>
                                <div className="detail-item">
                                    <span className="detail-label">System Notification</span>
                                    <span className="detail-value">
                                        {selectedTicket.posNotificationStatus === 'sent' ? (
                                            <span style={{ color: 'var(--success-color)', fontWeight: 'bold' }}>
                                                <i className="fas fa-check-circle"></i> Sent
                                            </span>
                                        ) : selectedTicket.posNotificationStatus === 'failed' ? (
                                            <span style={{ color: 'var(--danger-color)', fontWeight: 'bold' }}>
                                                <i className="fas fa-exclamation-triangle"></i> Failed
                                            </span>
                                        ) : (
                                            <span style={{ color: 'var(--text-secondary)' }}>Not Sent</span>
                                        )}
                                    </span>
                                </div>
                            </div>

                            <div className="suggestions-section">
                                <h4>Ticket Description</h4>
                                <p style={{color: 'var(--text-primary)', marginBottom: '20px', lineHeight: '1.6'}}>
                                    {selectedTicket.description}
                                </p>
                            </div>

                            <div className="reply-section">
                                <label htmlFor="reply-textarea">Agent Reply</label>
                                <textarea 
                                    id="reply-textarea" 
                                    placeholder="Type your response..." 
                                    value={replyText} 
                                    onChange={(e) => setReplyText(e.target.value)}
                                ></textarea>
                            </div>

                            <div className="modal-actions">
                                <button className="btn btn-secondary" onClick={closeModal}>Cancel</button>
                                
                                {/* ACTION BUTTON FOR EXTERNAL NOTIFICATION - Always visible */}
                                <button 
                                    className="btn btn-tertiary" 
                                    onClick={(e) => { e.stopPropagation(); handleNotifySystem(selectedTicket); }}
                                    disabled={loading || selectedTicket.posNotificationStatus === 'sent'}
                                    style={{marginRight: '10px'}}
                                >
                                    <i className="fas fa-bullhorn"></i> 
                                    {loading ? 'Forwarding...' : selectedTicket.posNotificationStatus === 'sent' ? 'System Notified' : 'Forward to External System'}
                                </button>

                                <button className="btn btn-primary" onClick={submitReply} disabled={loading}>
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

export default SupportTickets;