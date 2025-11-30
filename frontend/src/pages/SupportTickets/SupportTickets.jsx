import React, { useState, useEffect, useMemo, useCallback } from 'react';
import ReactDOM from 'react-dom';
import { collection, getDocs, doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../../firebase'; 
import emailjs from '@emailjs/browser'; 
import { 
  Loader2, 
  RefreshCw, 
  Eye, 
  Send, 
  CheckCircle, 
  AlertTriangle, 
  X, 
  Laptop,
  CreditCard,
  Lock,
  Sparkles,
  Bug,
  HelpCircle,
  Banknote,
  Package,
  ShoppingBag,
  Globe,
  BarChart3,
  AlertCircle 
} from 'lucide-react';

// =======================================
// API CONSTANTS
// =======================================
const FORWARD_ALL_API_URL = 'https://sm-crm-rho.vercel.app/api/forward-all';

// =======================================
// EMAILJS CONFIGURATION
// =======================================
const EMAIL_SERVICE_ID = "service_vg58qh8"; 
const EMAIL_TEMPLATE_ID = "template_9lluwnr"; 
const EMAIL_PUBLIC_KEY = "6XU-uQ7Og0d4oAykV"; 

// =======================================
// SYSTEM & CATEGORY MAPPING
// =======================================
const ISSUE_CATEGORIES = [
    { value: 'technical', label: 'Technical Issue', icon: Laptop, color: '#3B82F6' },
    { value: 'billing', label: 'Billing & Payments', icon: CreditCard, color: '#10B981' },
    { value: 'access', label: 'Account Access', icon: Lock, color: '#F59E0B' },
    { value: 'feature', label: 'Feature Request', icon: Sparkles, color: '#8B5CF6' },
    { value: 'bug', label: 'Report a Bug', icon: Bug, color: '#EF4444' },
    { value: 'general', label: 'General Inquiry', icon: HelpCircle, color: '#6B7280' },
    { value: 'transaction', label: 'Transaction Error', icon: Banknote, color: '#EC4899' },
    { value: 'fulfillment', label: 'Fulfillment', icon: Package, color: '#F97316' },
    { value: 'stock_issue', label: 'Stock Issue', icon: Package, color: '#14B8A6' },
    { value: 'order_status', label: 'Order Status', icon: ShoppingBag, color: '#6366F1' },
    { value: 'website_error', label: 'Website Error', icon: Globe, color: '#D946EF' }
];

// =======================================
// PRIORITY ANALYSIS SCRIPT
// =======================================
const analyzePriority = (subject, description) => {
    const text = `${subject || ''} ${description || ''}`.toLowerCase();
    const criticalKeywords = [
        'emergency', 'critical', 'scam', 'fraud', 'lawsuit', 'stolen', 'critical', 'manager', 
        'demand', 'resolve immediately', 'refund', 'urgent', 'impossible'
    ];
    if (criticalKeywords.some(word => text.includes(word))) { return 'High'; }

    let score = 0;
    const highImpact = ['broken', 'failed', 'crash', 'dead', 'unusable', 'malfunction', 'corrupted', 'angry', 'furious'];
    const mediumImpact = ['terrible', 'horrible', 'slow', 'buggy', 'unreliable', 'rude', 'incompetent', 'expensive'];
    const lowImpact = ['sucks', 'annoying', 'meh', 'weird', 'confusing', 'sluggish'];

    highImpact.forEach(w => { if (text.includes(w)) score += 3; });
    mediumImpact.forEach(w => { if (text.includes(w)) score += 2; });
    lowImpact.forEach(w => { if (text.includes(w)) score += 1; });

    if (score >= 5) return 'High';
    if (score >= 2) return 'Medium';
    return 'Low';
};

// =======================================
// CSS STYLES (Embedded)
// =======================================
const styles = `
:root {
  --bg-primary: #E9ECEE;
  --bg-secondary: #F4F4F4;
  --bg-sidebar: linear-gradient(135deg, #395A7F, #6E9FC1);
  --text-primary: #395A7F;
  --text-secondary: #6E9FC1;
  --text-light: #7A7A7A;
  --accent-primary: #395A7F;
  --accent-secondary: #6E9FC1;
  --accent-light: #A3CAE9;
  --border-light: #D1D5DB;
  --card-bg: #FFFFFF;
  --card-shadow: 0 4px 15px rgba(0, 0, 0, 0.08);
  --card-hover: 0 10px 25px rgba(0, 0, 0, 0.12);
  --success-color: #48BB78;
  --warning-color: #F6AD55;
  --danger-color: #F56565;
  --info-color: #4299E1;
}

[data-theme="dark"] {
  --bg-primary: #1E2A38;
  --bg-secondary: #2C3E50;
  --bg-sidebar: linear-gradient(135deg, #395A7F, #6E9FC1);
  --text-primary: #E9ECEE;
  --text-secondary: #A3CAE9;
  --text-light: #B0B0B0;
  --accent-primary: #68D391;
  --accent-secondary: #63B3ED;
  --accent-light: #4299E1;
  --border-light: #4A5568;
  --card-bg: #2C3E50;
  --card-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
  --card-hover: 0 10px 30px rgba(0, 0, 0, 0.4);
  --success-color: #68D391;
  --warning-color: #FBD38D;
  --danger-color: #FC8181;
  --info-color: #63B3ED;
}

* { margin: 0; padding: 0; box-sizing: border-box; font-family: 'Inter', system-ui, -apple-system, sans-serif; }

.support-tickets-wrapper {
  background: var(--bg-primary); color: var(--text-primary); min-height: 100vh; line-height: 1.6;
  transition: all 0.3s ease; padding: 30px; width: 100%;
}

.content-card {
  background: var(--card-bg); border-radius: 16px; padding: 30px; box-shadow: var(--card-shadow);
  border: 1px solid var(--border-light); transition: all 0.3s ease; position: relative; overflow: hidden; margin-bottom: 30px; width: 100%;
}
.content-card::before {
  content: ''; position: absolute; top: 0; left: 0; right: 0; height: 4px;
  background: linear-gradient(90deg, var(--accent-primary), var(--accent-secondary));
}

.ticket-table-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
.header-actions { display: flex; gap: 10px; }
.ticket-table { width: 100%; border-collapse: collapse; margin-top: 20px; }
.ticket-table th { background: var(--bg-secondary); color: var(--text-primary); font-weight: 600; padding: 15px; text-align: left; border-bottom: 2px solid var(--border-light); }
.ticket-table td { padding: 15px; border-bottom: 1px solid var(--border-light); color: var(--text-primary); }
.ticket-table tr { transition: all 0.3s ease; cursor: pointer; }
.ticket-table tr:hover { background: var(--bg-secondary); }

.priority-badge, .status-badge { padding: 6px 12px; border-radius: 20px; font-size: 12px; font-weight: 600; display: inline-block; text-align: center; min-width: 80px; }
.priority-high { background: rgba(245, 101, 101, 0.2); color: var(--danger-color); border: 1px solid var(--danger-color); }
.priority-medium { background: rgba(246, 173, 85, 0.2); color: var(--warning-color); border: 1px solid var(--warning-color); }
.priority-low { background: rgba(66, 153, 225, 0.2); color: var(--info-color); border: 1px solid var(--info-color); }
.status-open { background: rgba(246, 173, 85, 0.2); color: var(--warning-color); border: 1px solid var(--warning-color); }
.status-resolved { background: rgba(72, 187, 120, 0.2); color: var(--success-color); border: 1px solid var(--success-color); }

.action-btn { background: var(--accent-primary); color: white; border: none; padding: 6px 14px; font-size: 13px; border-radius: 8px; cursor: pointer; font-weight: 600; transition: all 0.3s ease; display: inline-flex; align-items: center; gap: 8px; white-space: nowrap; }
.action-btn:hover { background: var(--accent-secondary); transform: translateY(-2px); }
.action-btn:disabled { background: var(--text-light); cursor: not-allowed; transform: none; }
.btn-secondary { background: var(--bg-secondary); color: var(--text-primary); border: 1px solid var(--border-light); }
.btn-secondary:hover { background: var(--border-light); }

.charts-section { display: grid; grid-template-columns: repeat(auto-fit, minmax(350px, 1fr)); gap: 30px; margin-top: 30px; margin-bottom: 30px; width: 100%; }
.chart-card { background: var(--card-bg); border-radius: 16px; padding: 25px; box-shadow: var(--card-shadow); border: 1px solid var(--border-light); height: 350px; display: flex; flex-direction: column; }
.chart-card h3 { font-size: 18px; font-weight: 600; margin-bottom: 20px; color: var(--text-primary); display: flex; align-items: center; gap: 10px; }
.chart-container { flex: 1; position: relative; display: flex; align-items: flex-end; gap: 10px; padding-bottom: 10px; }

.bar { width: 15%; border-radius: 4px 4px 0 0; background: var(--accent-secondary); transition: height 0.5s ease; position: relative; }
.bar-label { position: absolute; bottom: -25px; left: 50%; transform: translateX(-50%); font-size: 12px; color: var(--text-light); white-space: nowrap; }

.category-list { display: flex; flex-direction: column; gap: 12px; overflow-y: auto; height: 100%; padding-right: 10px; }
.category-row { display: flex; align-items: center; gap: 15px; }
.category-icon { width: 32px; height: 32px; border-radius: 8px; display: flex; align-items: center; justify-content: center; background: var(--bg-secondary); color: var(--text-primary); }
.category-info { flex: 1; }
.category-header { display: flex; justify-content: space-between; margin-bottom: 4px; font-size: 13px; font-weight: 600; color: var(--text-primary); }
.progress-track { width: 100%; height: 6px; background: var(--bg-secondary); border-radius: 10px; overflow: hidden; }
.progress-fill { height: 100%; border-radius: 10px; transition: width 0.5s ease; }

.modal-overlay { position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; background-color: rgba(0,0,0,0.5); backdrop-filter: blur(5px); -webkit-backdrop-filter: blur(5px); display: flex; align-items: center; justify-content: center; z-index: 99999; padding: 20px; }
.modal-content { background: var(--card-bg); padding: 35px; border-radius: 20px; width: 100%; max-width: 600px; max-height: 90vh; overflow-y: auto; box-shadow: var(--card-hover); border: 1px solid var(--border-light); position: relative; animation: modalPop 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275); }
@keyframes modalPop { from { transform: scale(0.9); opacity: 0; } to { transform: scale(1); opacity: 1; } }
.modal-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; padding-bottom: 15px; border-bottom: 1px solid var(--border-light); }
.close-modal { background: none; border: none; color: var(--text-light); cursor: pointer; transition: all 0.3s ease; width: 40px; height: 40px; display: flex; align-items: center; justify-content: center; border-radius: 50%; flex-shrink: 0; }
.close-modal:hover { color: var(--accent-primary); background-color: var(--bg-secondary); transform: rotate(90deg); }

.ticket-details { display: flex; flex-direction: column; gap: 12px; margin-bottom: 25px; }
.detail-item { display: flex; flex-direction: row; justify-content: space-between; align-items: center; background: var(--bg-secondary); padding: 15px 20px; border-radius: 8px; }
.detail-label { font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px; color: var(--text-secondary); font-weight: 700; }
.detail-value { font-size: 14px; color: var(--text-primary); font-weight: 500; }
.status-value-wrapper { display: flex; align-items: center; gap: 8px; font-weight: 600; }
.reply-section label { display: block; font-size: 16px; font-weight: 600; color: var(--text-primary); margin-bottom: 10px; }
textarea { width: 100%; height: 120px; padding: 15px; border-radius: 8px; border: 1px solid var(--border-light); background: var(--bg-secondary); color: var(--text-primary); font-size: 14px; resize: none; transition: all 0.3s ease; }
textarea:focus { outline: none; border-color: var(--accent-primary); box-shadow: 0 0 0 3px rgba(57, 90, 127, 0.1); }
.modal-actions { display: flex; justify-content: flex-end; gap: 15px; }
.btn { padding: 12px 25px; border-radius: 8px; font-weight: 600; cursor: pointer; transition: all 0.3s ease; border: none; font-size: 16px; }
.btn-primary { background: var(--accent-primary); color: white; }
.btn-primary:hover { background: var(--accent-secondary); }
.btn-secondary { background: var(--bg-secondary); color: var(--text-primary); border: 1px solid var(--border-light); }
.btn-secondary:hover { background: var(--border-light); }

.custom-message-box { padding: 12px 20px; border-radius: 8px; color: white; margin-bottom: 20px; font-weight: 500; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); animation: slideIn 0.3s ease-out; }
@keyframes slideIn { from { transform: translateY(-10px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
@media (max-width: 768px) { .support-tickets-wrapper { padding: 20px; } .ticket-table { display: block; overflow-x: auto; } .header-actions { width: 100%; justify-content: space-between; } .ticket-table-header { flex-direction: column; align-items: flex-start; gap: 15px; } .charts-section { grid-template-columns: 1fr; } }
`;

// =======================================
// MOCK AUTH HOOK
// =======================================
const useMockAuth = () => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    const getIdToken = async () => 'mock-firebase-id-token-12345';

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
    return { user, loading, isAdmin };
};

// =======================================
// EMAIL HELPER FUNCTION
// =======================================
const sendResolutionEmail = async (ticket, replyText) => {
    // FIX: Using the corrected field 'email' or 'userEmail' for the recipient's address.
    const recipientEmail = ticket.email || ticket.userEmail; 

    if (!recipientEmail || !recipientEmail.includes('@')) {
        console.error("Email not found on ticket object. Cannot send resolution email.");
        return;
    }

    const templateParams = {
        to_email: recipientEmail,
        to_name: ticket.requester || 'Customer',
        ticket_subject: ticket.subject,
        agent_reply: replyText,
        ticket_id: ticket.id ? ticket.id.substring(0, 8) : 'N/A'
    };

    try {
        await emailjs.send(EMAIL_SERVICE_ID, EMAIL_TEMPLATE_ID, templateParams, EMAIL_PUBLIC_KEY);
        console.log('Resolution email sent successfully via EmailJS.');
    } catch (error) {
        console.error('EmailJS failed to send resolution:', error);
    }
};

const SupportTickets = () => {
    const { user, loading: authLoading, isAdmin } = useMockAuth(); 
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
            if (user) showAlertMessage('Access Denied: Insufficient privileges.', 'danger');
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
                
                // AUTOMATIC PRIORITY CALCULATION
                const calculatedPriority = analyzePriority(data.issueTitle, data.issueDescription);

                ticketsData.push({
                    id: doc.id,
                    ...data,
                    created: data.createdAt?.toDate?.().toLocaleString() || 'Unknown date',
                    subject: data.issueTitle || 'No Subject',
                    requester: data.userName || 'Unknown User',
                    priority: calculatedPriority, 
                    status: data.status || 'open',
                    description: data.issueDescription || 'No description provided',
                    categoryLabel: categoryMatch?.label || 'General Inquiry',
                    posNotificationStatus: data.posNotificationStatus || null,
                    issueCategory: data.issueCategory || 'general'
                });
            });

            ticketsData.sort((a, b) => new Date(b.createdAt?.toDate?.()) - new Date(a.createdAt?.toDate?.()));
            setTickets(ticketsData);
        } catch (error) {
            console.error('Error fetching tickets:', error);
            showAlertMessage('Failed to load tickets.', 'danger');
        } finally {
            setLoading(false);
        }
    };

    // --- Stats Calculations ---
    const stats = useMemo(() => {
        return {
            open: tickets.filter(t => t.status === 'open').length,
            resolved: tickets.filter(t => t.status === 'resolved').length,
            forwarded: tickets.filter(t => t.posNotificationStatus === 'sent').length,
            total: tickets.length
        };
    }, [tickets]);

    // Top Categories
    const categoryStats = useMemo(() => {
        const counts = {};
        tickets.forEach(t => {
            const cat = t.issueCategory;
            counts[cat] = (counts[cat] || 0) + 1;
        });

        return ISSUE_CATEGORIES
            .map(cat => ({
                ...cat,
                count: counts[cat.value] || 0,
                percentage: tickets.length ? Math.round(((counts[cat.value] || 0) / tickets.length) * 100) : 0
            }))
            .sort((a, b) => b.count - a.count)
            .filter(cat => cat.count > 0); 
    }, [tickets]);

    // Priority Breakdown
    const priorityStats = useMemo(() => {
        const counts = { High: 0, Medium: 0, Low: 0 };
        tickets.forEach(t => {
            const p = t.priority || 'Low';
            if (counts[p] !== undefined) counts[p]++;
        });
        const total = tickets.length || 1;
        return [
            { label: 'High', count: counts.High, percentage: Math.round((counts.High / total) * 100), color: '#EF4444' }, // Red
            { label: 'Medium', count: counts.Medium, percentage: Math.round((counts.Medium / total) * 100), color: '#F59E0B' }, // Orange
            { label: 'Low', count: counts.Low, percentage: Math.round((counts.Low / total) * 100), color: '#3B82F6' } // Blue
        ];
    }, [tickets]);

    // --- Modal Actions ---
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
        setTimeout(() => setShowAlert(false), 5000);
    };

    // --- Bulk Forward ---
    const handleBulkForwardAll = async () => {
        if (!isAdmin || !user) return showAlertMessage('Permission denied.', 'danger');
        try {
            setBulkForwardLoading(true);
            showAlertMessage('Bulk forwarding tickets...', 'info');
            const response = await fetch(FORWARD_ALL_API_URL, {
                method: 'GET',
                headers: { 'Content-Type': 'application/json' }
            });
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            const result = await response.json();
            
            if (result.forwarded && result.forwarded.length > 0) {
                showAlertMessage(`Successfully forwarded ${result.forwarded.length} tickets!`, 'success');
                const updatedTickets = tickets.map(ticket => {
                    const ticketResult = result.forwarded.find(item => item.ticketid === ticket.id || item.ticketId === ticket.id);
                    if (ticketResult) {
                        const isSuccess = ticketResult.status.toLowerCase().includes('forwarded') || ticketResult.status.toLowerCase().includes('success');
                        const isSkipped = ticketResult.status.toLowerCase().includes('already forwarded') || ticketResult.status.toLowerCase().includes('skipped');
                        if (isSuccess) return { ...ticket, posNotificationStatus: 'sent', posNotificationLog: new Date() };
                        else if (!isSkipped) return { ...ticket, posNotificationStatus: 'failed', posNotificationLog: new Date(), posNotificationError: ticketResult.status };
                    }
                    return ticket;
                });
                setTickets(updatedTickets);
                await updateFirestoreTickets(result.forwarded);
            } else {
                showAlertMessage('No tickets were forwarded.', 'info');
            }
        } catch (error) {
            console.error('Bulk forward failed:', error);
            showAlertMessage(`Bulk forward failed: ${error.message}`, 'danger');
        } finally {
            setBulkForwardLoading(false);
        }
    };

    const updateFirestoreTickets = async (forwardedResults) => {
        try {
            for (const result of forwardedResults) {
                const ticketId = result.ticketid || result.ticketId;
                const ticketRef = doc(db, 'supportTickets', ticketId);
                const statusLower = result.status.toLowerCase();
                if (statusLower.includes('forwarded') || statusLower.includes('success')) {
                    await updateDoc(ticketRef, { posNotificationStatus: 'sent', posNotificationLog: serverTimestamp(), updatedAt: serverTimestamp() });
                } else if (!statusLower.includes('already forwarded') && !statusLower.includes('skipped')) {
                    await updateDoc(ticketRef, { posNotificationStatus: 'failed', posNotificationLog: serverTimestamp(), posNotificationError: result.status, updatedAt: serverTimestamp() });
                }
            }
        } catch (error) { console.error('Error updating Firestore:', error); }
    };

    const submitReply = async () => {
        if (replyText.trim() === '') return showAlertMessage('Please enter a response.', 'danger');
        if (!isAdmin) return showAlertMessage('Permission denied.', 'danger');
        
        try {
            const ticketRef = doc(db, 'supportTickets', selectedTicket.id);
            
            // 1. Update Firestore Status
            await updateDoc(ticketRef, { 
                status: 'resolved', 
                agentReply: replyText, 
                resolvedAt: serverTimestamp(), 
                updatedAt: serverTimestamp() 
            });

            // 2. Send Resolution Email to Customer (Using email or userEmail field)
            await sendResolutionEmail(selectedTicket, replyText);

            // 3. Update Local State & Close Modal
            setTickets(prev => prev.map(t => t.id === selectedTicket.id ? { ...t, status: 'resolved', agentReply: replyText } : t));
            showAlertMessage('Reply sent & ticket resolved! (Email sent to customer)', 'success');
            closeModal();

        } catch (error) {
            console.error('Error updating ticket:', error);
            showAlertMessage('Failed to update ticket. Check console for details.', 'danger');
        }
    };
    
    // --- Render Helpers ---
    const renderPriorityBadge = (p) => <span className={`priority-badge priority-${p.toLowerCase()}`}>{p}</span>;
    const renderStatusBadge = (s) => <span className={`status-badge status-${s.toLowerCase()}`}>{s}</span>;

    // --- Main JSX ---
    return (
        <div className="support-tickets-wrapper">
            {/* INJECTED STYLES */}
            <style>{styles}</style>
            
            {/* Alert Box */}
            {showAlert && (
                <div className="custom-message-box" style={{ 
                    backgroundColor: alertType === 'success' ? 'var(--success-color)' : 
                                   alertType === 'info' ? 'var(--info-color)' : 'var(--danger-color)' 
                }}>
                    {alertMessage}
                </div>
            )}

            {(isAdmin && !authLoading) && (
                <div className="charts-section">
                    
                    {/* CHART 1: OVERVIEW */}
                    <div className="chart-card">
                        <h3><BarChart3 size={20} className="text-accent-primary"/> Ticket Overview</h3>
                        <div className="chart-container">
                            <div className="bar" style={{height: `${(stats.open / Math.max(stats.total, 1)) * 100}%`, background: 'var(--accent-secondary)'}}>
                                <span className="bar-label">Open ({stats.open})</span>
                            </div>
                            <div className="bar" style={{height: `${(stats.resolved / Math.max(stats.total, 1)) * 100}%`, background: 'var(--success-color)'}}>
                                <span className="bar-label">Resolved ({stats.resolved})</span>
                            </div>
                        </div>
                    </div>

                    {/* CHART 2: CATEGORIES */}
                    <div className="chart-card">
                        <h3><Laptop size={20} className="text-accent-primary"/> Issues by Category</h3>
                        <div className="category-list">
                            {categoryStats.length === 0 ? (
                                <div style={{height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-light)'}}>
                                    No ticket data available
                                </div>
                            ) : (
                                categoryStats.map((cat, index) => (
                                    <div key={index} className="category-row">
                                        <div className="category-icon">
                                            <cat.icon size={16} color={cat.color} />
                                        </div>
                                        <div className="category-info">
                                            <div className="category-header">
                                                <span>{cat.label}</span>
                                                <span>{cat.count}</span>
                                            </div>
                                            <div className="progress-track">
                                                <div 
                                                    className="progress-fill" 
                                                    style={{ width: `${cat.percentage}%`, background: cat.color }}
                                                ></div>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                    {/* CHART 3: PRIORITY BREAKDOWN */}
                    <div className="chart-card">
                        <h3><AlertCircle size={20} className="text-accent-primary"/> Priority Breakdown</h3>
                        <div className="category-list">
                            {tickets.length === 0 ? (
                                <div style={{height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-light)'}}>
                                    No ticket data available
                                </div>
                            ) : (
                                priorityStats.map((p, index) => (
                                    <div key={index} className="category-row">
                                        <div className="category-icon" style={{color: p.color, background: `${p.color}20`}}>
                                            <AlertTriangle size={16} />
                                        </div>
                                        <div className="category-info">
                                            <div className="category-header">
                                                <span>{p.label} Priority</span>
                                                <span>{p.count}</span>
                                            </div>
                                            <div className="progress-track">
                                                <div 
                                                    className="progress-fill" 
                                                    style={{ width: `${p.percentage}%`, background: p.color }}
                                                ></div>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                </div>
            )}

            <div className="content-card">
                <div className="ticket-table-header">
                    <h3>All Support Tickets ({tickets.length})</h3>
                    {isAdmin && (
                        <div className="header-actions">
                            <button 
                                className="action-btn" 
                                style={{ backgroundColor: 'var(--accent-primary)', color: 'white' }}
                                onClick={handleBulkForwardAll}
                                disabled={bulkForwardLoading || tickets.length === 0}
                            >
                                {bulkForwardLoading ? <Loader2 className="animate-spin" size={16} /> : <Send size={16} />}
                                {bulkForwardLoading ? ' Forwarding...' : ' Forward All'}
                            </button>

                            <button className="action-btn btn-secondary" onClick={fetchTickets} disabled={loading || authLoading}>
                                {loading ? <Loader2 className="animate-spin" size={16} /> : <RefreshCw size={16} />}
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
                        <tbody>
                            {loading || authLoading ? (
                                <tr><td colSpan="7" style={{textAlign:'center', padding:'20px'}}>Loading...</td></tr>
                            ) : tickets.length === 0 ? (
                                <tr><td colSpan="7" style={{textAlign:'center', padding:'20px'}}>No tickets found.</td></tr>
                            ) : (
                                tickets.map(ticket => (
                                    <tr key={ticket.id} onClick={() => openModal(ticket.id)}>
                                        <td>#{ticket.id.substring(0, 8)}...</td>
                                        <td>{ticket.subject}</td>
                                        <td>{ticket.requester}</td>
                                        <td>{renderPriorityBadge(ticket.priority)}</td>
                                        <td>{renderStatusBadge(ticket.status)}</td>
                                        <td>{ticket.created}</td>
                                        <td>
                                            <button className="action-btn" onClick={(e) => { e.stopPropagation(); openModal(ticket.id); }}>
                                                <Eye size={16} /> View
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* --- MODAL PORTAL --- */}
            {modalOpen && selectedTicket && ReactDOM.createPortal(
                <div className="modal-overlay" onClick={closeModal}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3 style={{ fontSize: '20px', fontWeight: '600', color: 'var(--text-primary)' }}>Ticket details</h3>
                            <button className="close-modal" onClick={closeModal}>
                                <X size={24} />
                            </button>
                        </div>

                        <div className="ticket-details">
                            <h3 style={{marginBottom: '10px', fontSize:'1.2rem', color: 'var(--text-primary)'}}>
                                #{selectedTicket.id.substring(0, 8)}...: {selectedTicket.subject}
                            </h3>
                            
                            <div className="detail-item">
                                <span className="detail-label">Category</span>
                                <span className="detail-value">{selectedTicket.categoryLabel}</span>
                            </div>
                            <div className="detail-item">
                                <span className="detail-label">Status</span>
                                <span className="detail-value">{renderStatusBadge(selectedTicket.status)}</span>
                            </div>
                            <div className="detail-item">
                                <span className="detail-label">Priority</span>
                                <span className="detail-value">{renderPriorityBadge(selectedTicket.priority)}</span>
                            </div>
                            <div className="detail-item">
                                <span className="detail-label">System Notification</span>
                                <span className="detail-value">
                                    {selectedTicket.posNotificationStatus === 'sent' ? (
                                        <div className="status-value-wrapper" style={{ color: 'var(--success-color)' }}>
                                            <CheckCircle size={18} />
                                            <span>Sent</span>
                                        </div>
                                    ) : selectedTicket.posNotificationStatus === 'failed' ? (
                                        <div className="status-value-wrapper" style={{ color: 'var(--danger-color)' }}>
                                            <AlertTriangle size={18} />
                                            <span>Failed</span>
                                        </div>
                                    ) : (
                                        <span style={{ color: 'var(--text-secondary)' }}>Not Sent</span>
                                    )}
                                </span>
                            </div>
                            {selectedTicket.posNotificationError && selectedTicket.posNotificationStatus === 'failed' && (
                                <div style={{ fontSize: '0.8rem', color: 'var(--danger-color)', marginTop: '-8px', marginBottom: '10px', textAlign: 'right' }}>
                                    Error: {selectedTicket.posNotificationError}
                                </div>
                            )}
                        </div>

                        <div className="suggestions-section">
                            <h4 style={{fontSize: '16px', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '10px'}}>Ticket Description</h4>
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
                            <button className="btn btn-primary" onClick={submitReply} disabled={loading}>
                                {selectedTicket.status === 'resolved' ? 'Update Reply' : 'Send Reply & Resolve'}
                            </button>
                        </div>
                    </div>
                </div>,
                document.body
            )}
        </div>
    );
};

export default SupportTickets;