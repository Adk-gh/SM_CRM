import React, { useState, useEffect, useMemo } from 'react';
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
  Briefcase,
  FileText,
  User,
  Calendar,
  Building2,
  Clock,
  TrendingUp,
  Timer,
  ChevronLeft,
  ChevronRight,
  BarChart3,
  CheckSquare,
  Search, // Added Search Icon
  Filter  // Added Filter Icon
} from 'lucide-react';

// =======================================
// CONFIGURATION & CONSTANTS
// =======================================

const EMAIL_FORWARD_SERVICE_ID = "service_vg58qh8"; 
const EMAIL_FORWARD_TEMPLATE_ID = "template_9lluwnr"; 
const EMAIL_FORWARD_PUBLIC_KEY = "6XU-uQ7Og0d4oAykV"; 

const EMAIL_RESOLVE_SERVICE_ID = "service_e6osrqk"; 
const EMAIL_RESOLVE_TEMPLATE_ID = "template_9f0b21p"; 
const EMAIL_RESOLVE_PUBLIC_KEY = "pdnrkVk1D1DXJmS5c"; 

const PRIORITIES = ['High', 'Medium', 'Low'];

const DEPARTMENTS = [
  'POS', 
  'Online Shopping', 
  'Payroll', 
  'HRMIS', 
  'Inventory', 
  'Warehouse'
];

const SLA_LIMITS = {
  High: 72,    // 3 Days
  Medium: 96,  // 4 Days
  Low: 168     // 7 Days
};

// =======================================
// SMART ROUTING MAP
// =======================================
const CATEGORY_DEPT_MAP = {
  'transaction': 'POS',
  'bug': 'POS', 
  'technical': 'POS',
  'billing': 'Online Shopping',
  'feature': 'Online Shopping',
  'order_status': 'Online Shopping',
  'website_error': 'Online Shopping',
  'stock_issue': 'Inventory',
  'fulfillment': 'Warehouse',
  'access': 'HRMIS',
  'general': 'HRMIS', 
  'payroll': 'Payroll' 
};

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
  { value: 'website_error', label: 'Website Error', icon: Globe, color: '#D946EF' },
  { value: 'payroll', label: 'Payroll Issue', icon: Banknote, color: '#059669' } 
];

// =======================================
// CSS STYLES
// =======================================
const styles = `
  :root {
    --bg-primary: #E9ECEE;
    --bg-secondary: #F4F4F4;
    --text-primary: #395A7F;
    --text-secondary: #6E9FC1;
    --accent-primary: #395A7F;
    --accent-secondary: #6E9FC1;
    --card-bg: #FFFFFF;
    --danger-color: #EF4444;
    --warning-color: #F59E0B;
    --success-color: #10B981;
    --info-color: #3B82F6;
  }

  * { margin: 0; padding: 0; box-sizing: border-box; font-family: 'Inter', sans-serif; }

  .support-tickets-wrapper {
    background: var(--bg-primary); min-height: 100vh; padding: 30px;
    color: var(--text-primary);
  }

  /* TABS */
  .tabs-container { display: flex; gap: 20px; margin-bottom: 25px; border-bottom: 2px solid var(--text-secondary); padding-bottom: 0; }
  .tab-btn {
    background: none; border: none; font-size: 16px; font-weight: 600; 
    color: var(--text-secondary); cursor: pointer; padding: 10px 20px;
    position: relative; transition: all 0.3s;
  }
  .tab-btn.active { color: var(--accent-primary); }
  .tab-btn.active::after {
    content: ''; position: absolute; bottom: -2px; left: 0; width: 100%; height: 3px; background: var(--accent-primary);
  }
  .tab-count { font-size: 12px; background: var(--bg-secondary); padding: 2px 8px; border-radius: 10px; margin-left: 8px; }

  .content-card {
    background: var(--card-bg); border-radius: 16px; padding: 30px; box-shadow: 0 4px 15px rgba(0, 0, 0, 0.08);
  }

  .ticket-table { width: 100%; border-collapse: collapse; margin-top: 20px; }
  .ticket-table th { text-align: left; padding: 15px; background: var(--bg-secondary); color: var(--text-primary); }
  .ticket-table td { padding: 15px; border-bottom: 1px solid #ddd; }
  .ticket-table tr:hover { background: var(--bg-secondary); cursor: pointer; }

  .ticket-row-danger {
    box-shadow: inset 3px 0 0 var(--danger-color);
    background-color: rgba(239, 68, 68, 0.05);
  }

  .priority-badge { padding: 4px 10px; border-radius: 12px; font-size: 12px; font-weight: 600; }
  .priority-high { color: var(--danger-color); border: 1px solid var(--danger-color); background: rgba(239,68,68,0.1); }
  .priority-medium { color: var(--warning-color); border: 1px solid var(--warning-color); background: rgba(245,158,11,0.1); }
  .priority-low { color: var(--info-color); border: 1px solid var(--info-color); background: rgba(59,130,246,0.1); }
  .priority-na { color: var(--text-secondary); border: 1px solid var(--text-secondary); }

  .action-btn { background: var(--accent-primary); color: white; border: none; padding: 6px 14px; border-radius: 6px; cursor: pointer; display: flex; align-items: center; gap: 6px; font-size: 13px; }
  .action-btn:hover { opacity: 0.9; }

  /* Modal Styles */
  .modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.5); display: flex; justify-content: center; align-items: center; z-index: 1000; backdrop-filter: blur(4px); }
  .modal-content { background: var(--card-bg); padding: 30px; border-radius: 16px; width: 700px; max-width: 90%; max-height: 90vh; overflow-y: auto; animation: popIn 0.3s ease; }
  
  .form-group { margin-bottom: 20px; }
  .form-group label { display: block; margin-bottom: 8px; font-weight: 600; font-size: 14px; }
  .form-select { width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 8px; font-size: 14px; background: var(--bg-secondary); color: var(--text-primary); transition: border 0.3s; }
  .form-select:focus { outline: none; border-color: var(--accent-primary); }

  .ticket-summary-box { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 15px; margin-bottom: 25px; }
  .summary-row { display: flex; gap: 20px; margin-bottom: 10px; }
  .summary-col { flex: 1; }
  .summary-label { font-size: 11px; text-transform: uppercase; color: #64748b; font-weight: 700; margin-bottom: 4px; }
  .summary-val { font-size: 14px; color: #334155; font-weight: 500; }
  .description-box { background: white; padding: 10px; border: 1px solid #e2e8f0; border-radius: 6px; font-size: 13px; line-height: 1.5; max-height: 150px; overflow-y: auto; color: #475569; }

  .attachment-grid { display: flex; gap: 10px; margin-top: 10px; flex-wrap: wrap; }
  .attachment-img { width: 80px; height: 80px; object-fit: cover; border-radius: 8px; border: 1px solid #ddd; cursor: pointer; transition: transform 0.2s; }

  .status-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px; padding-bottom: 15px; border-bottom: 1px solid #e2e8f0; }
  
  /* ANALYTICS STYLES */
  .analytics-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; margin-bottom: 30px; }
  
  .stat-card { background: var(--card-bg); padding: 25px; border-radius: 16px; box-shadow: 0 4px 15px rgba(0,0,0,0.05); border: 1px solid #e2e8f0; height: 100%; display: flex; flex-direction: column; }
  .stat-title { font-size: 13px; color: #718096; font-weight: 700; text-transform: uppercase; margin-bottom: 20px; display: flex; align-items: center; gap: 8px; }

  /* CAROUSEL CARD */
  .carousel-card { 
    position: relative; 
    border-top: 4px solid var(--warning-color); 
    display: flex; 
    flex-direction: column; 
    justify-content: space-between;
  }
  .carousel-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 15px; }
  .carousel-label { font-size: 12px; color: #718096; font-weight: 700; text-transform: uppercase; }
  .carousel-dept-name { font-size: 14px; font-weight: 700; color: var(--text-primary); text-transform: uppercase; letter-spacing: 0.5px; }
  .carousel-body { display: flex; align-items: center; gap: 15px; margin-bottom: 5px; }
  .time-icon-wrapper { background: #fdf6e7; width: 50px; height: 50px; border-radius: 12px; display: flex; align-items: center; justify-content: center; color: var(--warning-color); flex-shrink: 0; }
  .carousel-value-lg { font-size: 36px; font-weight: 800; color: #2d3748; line-height: 1; }
  .carousel-unit { font-size: 16px; color: #a0aec0; font-weight: 500; margin-left: 2px; }
  .carousel-desc { font-size: 13px; color: #a0aec0; margin-top: 8px; }
  .carousel-nav { display: flex; justify-content: space-between; align-items: center; margin-top: 20px; }
  .nav-btn { background: transparent; border: 1px solid #e2e8f0; border-radius: 50%; width: 32px; height: 32px; display: flex; align-items: center; justify-content: center; cursor: pointer; color: var(--text-secondary); transition: all 0.2s; }
  .nav-btn:hover { background: var(--bg-secondary); color: var(--accent-primary); border-color: var(--accent-primary); }

  /* Chart Styles */
  .chart-row { display: flex; align-items: center; margin-bottom: 12px; font-size: 13px; }
  .chart-label { width: 110px; font-weight: 500; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; color: #4a5568; }
  .chart-bar-bg { flex: 1; height: 8px; background: #edf2f7; border-radius: 4px; overflow: hidden; margin: 0 12px; }
  .chart-bar-fill { height: 100%; border-radius: 4px; transition: width 0.5s ease; }
  .chart-value { width: 35px; text-align: right; font-weight: 600; color: #2d3748; }
  
  /* SLA PROGRESS BAR STYLE */
  .sla-container { width: 140px; }
  .sla-header { display: flex; justify-content: space-between; font-size: 11px; margin-bottom: 4px; font-weight: 600; }
  .sla-bar-bg { width: 100%; height: 6px; background: #e5e7eb; border-radius: 10px; overflow: hidden; }
  .sla-bar-fill { height: 100%; transition: width 1s linear; }
  .sla-footer { font-size: 10px; color: #9ca3af; margin-top: 2px; }
  .ticking-clock { font-variant-numeric: tabular-nums; }

  /* SEARCH & FILTER BAR */
  .toolbar { display: flex; justify-content: flex-end; align-items: center; gap: 10px; margin-bottom: 15px; }
  .search-wrapper { position: relative; }
  .search-input { padding: 8px 12px 8px 35px; border-radius: 8px; border: 1px solid #ddd; font-size: 13px; width: 250px; outline: none; transition: border-color 0.2s; color: var(--text-primary); }
  .search-input:focus { border-color: var(--accent-primary); }
  .search-icon { position: absolute; left: 10px; top: 50%; transform: translateY(-50%); color: #9ca3af; }
  
  .filter-wrapper { position: relative; }
  .filter-select { padding: 8px 12px 8px 35px; border-radius: 8px; border: 1px solid #ddd; font-size: 13px; outline: none; cursor: pointer; color: var(--text-primary); appearance: none; background: white; padding-right: 30px; }
  .filter-icon { position: absolute; left: 10px; top: 50%; transform: translateY(-50%); color: #9ca3af; }

  @media (max-width: 1024px) {
    .analytics-grid { grid-template-columns: 1fr; }
    .toolbar { flex-direction: column; align-items: stretch; }
    .search-input { width: 100%; }
  }

  .custom-alert { position: fixed; top: 20px; right: 20px; padding: 15px 25px; border-radius: 8px; color: white; font-weight: 500; animation: slideIn 0.3s; z-index: 2000; box-shadow: 0 4px 12px rgba(0,0,0,0.15); }
  @keyframes slideIn { from { transform: translateX(100%); } to { transform: translateX(0); } }
`;

// =======================================
// REAL-TIME SLA COUNTDOWN COMPONENT
// =======================================
const SLACountdown = ({ ticket }) => {
    const [timeLeft, setTimeLeft] = useState({ 
        percent: 0, 
        text: '--', 
        color: '#10B981', 
        isOverdue: false 
    });

    useEffect(() => {
        if (!ticket.forwardedAt) return;

        const interval = setInterval(() => {
            const start = ticket.forwardedAt.toDate ? ticket.forwardedAt.toDate() : new Date(ticket.forwardedAt);
            const limitHours = SLA_LIMITS[ticket.priority] || 168; // Default 7 days
            const limitMs = limitHours * 60 * 60 * 1000;
            const deadline = new Date(start.getTime() + limitMs);
            const now = new Date();
            
            const remainingMs = deadline - now;
            const elapsedMs = now - start;
            
            // Calculate Percentage Used
            let percent = (elapsedMs / limitMs) * 100;
            percent = Math.min(Math.max(percent, 0), 100); // Clamp between 0-100

            // Formatting Text (HH:mm:ss)
            const absMs = Math.abs(remainingMs);
            const h = Math.floor(absMs / (1000 * 60 * 60));
            const m = Math.floor((absMs % (1000 * 60 * 60)) / (1000 * 60));
            const s = Math.floor((absMs % (1000 * 60)) / 1000);
            
            const timeString = `${h}h ${m}m ${s}s`;
            const isOverdue = remainingMs < 0;

            // Determine Color
            let color = '#10B981'; // Green
            if (isOverdue) color = '#EF4444'; // Red
            else if (percent > 75) color = '#F59E0B'; // Orange

            setTimeLeft({
                percent: isOverdue ? 100 : percent,
                text: timeString,
                color: color,
                isOverdue: isOverdue
            });

        }, 1000);

        return () => clearInterval(interval);
    }, [ticket]);

    if (!ticket.forwardedAt) return <span style={{color:'#ccc'}}>--</span>;

    return (
        <div className="sla-container">
            <div className="sla-header" style={{color: timeLeft.color}}>
                <span>{timeLeft.isOverdue ? 'Overdue' : 'Remaining'}</span>
                <span className="ticking-clock">{timeLeft.text}</span>
            </div>
            <div className="sla-bar-bg">
                <div 
                    className="sla-bar-fill" 
                    style={{
                        width: `${timeLeft.percent}%`, 
                        background: timeLeft.color
                    }}
                ></div>
            </div>
            <div className="sla-footer">Limit: {SLA_LIMITS[ticket.priority] || 168}h</div>
        </div>
    );
};

// =======================================
// MOCK AUTH
// =======================================
const useMockAuth = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    setTimeout(() => {
      setUser({ uid: 'admin123', email: 'admin@example.com', role: 'admin' });
      setLoading(false);
    }, 500);
  }, []);
  return { user, loading, isAdmin: user?.role === 'admin' };
};

const SupportTickets = () => {
  const { isAdmin } = useMockAuth();
  
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('New'); 
  
  // State for Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [deptFilter, setDeptFilter] = useState('All');

  // Modals
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [forwardModalOpen, setForwardModalOpen] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState(null);
  
  const [targetDept, setTargetDept] = useState('');
  const [targetPriority, setTargetPriority] = useState('');
  const [isForwarding, setIsForwarding] = useState(false);

  // Carousel State
  const [carouselIndex, setCarouselIndex] = useState(0);

  const [replyText, setReplyText] = useState('');
  const [alert, setAlert] = useState(null);

  useEffect(() => {
    fetchTickets();
  }, [isAdmin]);

  const showAlert = (msg, type = 'success') => {
    setAlert({ msg, type });
    setTimeout(() => setAlert(null), 4000);
  };

  const fetchTickets = async () => {
    if (!isAdmin) return;
    setLoading(true);
    try {
      const querySnapshot = await getDocs(collection(db, 'supportTickets'));
      const ticketsData = [];
      
      querySnapshot.forEach((docSnap) => {
        const data = docSnap.data();
        const attachments = (data.attachments || []).map(att => ({
            ...att,
            attachmentURL: att.type.startsWith('image/') 
                ? `https://via.placeholder.com/150?text=${att.fileName || 'Img'}`
                : null, 
        }));

        const autoDepartment = data.department || CATEGORY_DEPT_MAP[data.issueCategory] || 'Online Shopping';
        const catObj = ISSUE_CATEGORIES.find(c => c.value === data.issueCategory);
        const categoryLabel = catObj ? catObj.label : 'General';

        ticketsData.push({
          id: docSnap.id,
          ...data,
          attachments,
          userEmail: data.userEmail || data.email,
          created: data.createdAt?.toDate?.().toLocaleString() || 'Unknown',
          subject: data.issueTitle || 'No Subject',
          requester: data.userName || 'Unknown',
          priority: data.priority || 'N/A', 
          status: data.status || 'open', 
          department: autoDepartment, 
          forwardedAt: data.forwardedAt ? data.forwardedAt.toDate() : null,
          resolvedAt: data.resolvedAt ? data.resolvedAt.toDate() : null,
          description: data.issueDescription || '',
          issueCategory: data.issueCategory || 'general',
          categoryLabel: categoryLabel
        });
      });

      ticketsData.sort((a, b) => new Date(b.created) - new Date(a.created));
      setTickets(ticketsData);
    } catch (error) {
      console.error(error);
      showAlert('Failed to fetch tickets', 'danger');
    } finally {
      setLoading(false);
    }
  };

  const checkSLAStatus = (ticket) => {
    if (ticket.status !== 'pending' || !ticket.forwardedAt || ticket.priority === 'N/A') return 'ok';
    const now = new Date();
    const diffHours = (now - ticket.forwardedAt) / (1000 * 60 * 60); 
    const limit = SLA_LIMITS[ticket.priority] || 48; 
    return diffHours > limit ? 'overdue' : 'ok';
  };

  const openForwardModal = (ticket) => {
    setSelectedTicket(ticket);
    const autoDept = CATEGORY_DEPT_MAP[ticket.issueCategory] || 'Online Shopping';
    setTargetDept(autoDept);
    setTargetPriority('Medium');
    setForwardModalOpen(true);
  };

  // =======================================
  // ANALYTICS CALCULATIONS
  // =======================================
  const analyticsData = useMemo(() => {
    if (tickets.length === 0) return null;

    // 1. RESOLVED Volume by Department
    const deptResolved = {};
    DEPARTMENTS.forEach(d => deptResolved[d] = 0);
    tickets.forEach(t => {
      if(t.department && t.status === 'resolved') {
        deptResolved[t.department] = (deptResolved[t.department] || 0) + 1;
      }
    });

    // 2. Average Resolution Time
    const deptTime = {};
    DEPARTMENTS.forEach(d => deptTime[d] = { totalHours: 0, count: 0 });
    
    tickets.forEach(t => {
      if (t.status === 'resolved' && t.department && t.resolvedAt && t.forwardedAt) {
        const hours = (t.resolvedAt - t.forwardedAt) / (1000 * 60 * 60);
        if (deptTime[t.department]) {
          deptTime[t.department].totalHours += hours;
          deptTime[t.department].count += 1;
        }
      }
    });

    const avgResolutionTime = {};
    Object.keys(deptTime).forEach(dept => {
      const data = deptTime[dept];
      avgResolutionTime[dept] = data.count > 0 ? (data.totalHours / data.count).toFixed(1) : 0;
    });

    // 3. Most Common Categories
    const categoryCounts = {};
    tickets.forEach(t => {
      categoryCounts[t.categoryLabel] = (categoryCounts[t.categoryLabel] || 0) + 1;
    });
    const topCategories = Object.entries(categoryCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);

    return { deptResolved, avgResolutionTime, topCategories, totalTickets: tickets.length };
  }, [tickets]);

  // Carousel Navigation Helpers
  const nextDept = () => setCarouselIndex((prev) => (prev + 1) % DEPARTMENTS.length);
  const prevDept = () => setCarouselIndex((prev) => (prev - 1 + DEPARTMENTS.length) % DEPARTMENTS.length);

  const confirmForward = async () => {
    if (!targetPriority || !targetDept) return showAlert('Please select department and priority', 'warning');
    setIsForwarding(true);
    try {
      const ticketRef = doc(db, 'supportTickets', selectedTicket.id);
      const templateParams = {
        userEmail: selectedTicket.userEmail,
        userName: selectedTicket.requester,
        issueTitle: selectedTicket.subject,
        department: targetDept
      };
      await emailjs.send(EMAIL_FORWARD_SERVICE_ID, EMAIL_FORWARD_TEMPLATE_ID, templateParams, EMAIL_FORWARD_PUBLIC_KEY);
      await updateDoc(ticketRef, {
        status: 'pending',
        department: targetDept, 
        priority: targetPriority,
        forwardedAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      setTickets(prev => prev.map(t => 
        t.id === selectedTicket.id 
          ? { ...t, status: 'pending', department: targetDept, priority: targetPriority, forwardedAt: new Date() }
          : t
      ));
      showAlert(`Forwarded to ${targetDept}`, 'success');
      setForwardModalOpen(false);
      setSelectedTicket(null);
    } catch (error) {
      console.error('Forward error:', error);
      showAlert('Failed to forward ticket', 'danger');
    } finally {
      setIsForwarding(false);
    }
  };

  const handleResolve = async () => {
    if (!replyText) return showAlert('Please enter a resolution note', 'warning');
    try {
      const templateParams = {
        userEmail: selectedTicket.userEmail,
        userName: selectedTicket.requester,
        issueTitle: selectedTicket.subject,
        department: selectedTicket.department,
        agentReply: replyText
      };
      await emailjs.send(EMAIL_RESOLVE_SERVICE_ID, EMAIL_RESOLVE_TEMPLATE_ID, templateParams, EMAIL_RESOLVE_PUBLIC_KEY);
      const ticketRef = doc(db, 'supportTickets', selectedTicket.id);
      await updateDoc(ticketRef, {
        status: 'resolved',
        agentReply: replyText,
        resolvedAt: serverTimestamp()
      });
      setTickets(prev => prev.map(t => 
        t.id === selectedTicket.id ? { ...t, status: 'resolved', agentReply: replyText } : t
      ));
      showAlert('Ticket resolved successfully', 'success');
      setDetailsModalOpen(false);
      setReplyText('');
    } catch (e) {
      console.error(e);
      showAlert('Error resolving ticket', 'danger');
    }
  };

  // =======================================
  // FILTERING LOGIC (Tab -> Dept -> Search)
  // =======================================
  const filteredTickets = useMemo(() => {
    let result = [];

    // 1. Tab Filter
    if (activeTab === 'New') {
        result = tickets.filter(t => t.status === 'open' || (t.status === 'pending' && t.priority === 'N/A'));
    } else if (activeTab === 'Pending') {
        result = tickets.filter(t => t.status === 'pending' && t.priority !== 'N/A');
    } else if (activeTab === 'Resolved') {
        result = tickets.filter(t => t.status === 'resolved');
    }

    // 2. Department Filter
    if (deptFilter !== 'All') {
        result = result.filter(t => t.department === deptFilter);
    }

    // 3. Search Filter
    if (searchQuery.trim() !== '') {
        const query = searchQuery.toLowerCase();
        result = result.filter(t => 
            t.subject.toLowerCase().includes(query) || 
            t.requester.toLowerCase().includes(query) || 
            t.id.toLowerCase().includes(query)
        );
    }

    return result;
  }, [tickets, activeTab, deptFilter, searchQuery]);

  const renderPriority = (p) => (
    <span className={`priority-badge priority-${p.toLowerCase().replace('/','')}`}>
      {p}
    </span>
  );

  const TicketSummaryBox = ({ ticket }) => (
    <div className="ticket-summary-box">
        <div style={{marginBottom:'10px', display:'flex', alignItems:'center', gap:'10px', flexWrap:'wrap'}}>
            <h4 style={{margin:0}}>{ticket.subject}</h4>
            <span style={{fontSize:'12px', background:'#e2e8f0', padding:'2px 8px', borderRadius:'10px', color:'#475569'}}>
                {ticket.categoryLabel}
            </span>
        </div>
        <div className="summary-row">
            <div className="summary-col">
                <div className="summary-label"><User size={10} style={{marginRight:4}}/> Requester</div>
                <div className="summary-val">{ticket.requester}</div>
                <div style={{fontSize:'12px', color:'#999'}}>{ticket.userEmail}</div>
            </div>
            <div className="summary-col">
                <div className="summary-label"><Calendar size={10} style={{marginRight:4}}/> Created</div>
                <div className="summary-val">{ticket.created}</div>
            </div>
        </div>
        <div className="summary-label"><FileText size={10} style={{marginRight:4}}/> Description</div>
        <div className="description-box">{ticket.description}</div>
        {ticket.attachments && ticket.attachments.length > 0 && (
            <div style={{marginTop:'10px'}}>
                <div className="summary-label">Attachments</div>
                <div className="attachment-grid">
                    {ticket.attachments.map((att, i) => (
                        att.attachmentURL && (
                            <img key={i} src={att.attachmentURL} className="attachment-img" onClick={() => window.open(att.attachmentURL, '_blank')} />
                        )
                    ))}
                </div>
            </div>
        )}
    </div>
  );

  // Helper for Carousel Data
  const getCarouselData = () => {
    if (!analyticsData) return { name: '', time: 0 };
    const deptName = DEPARTMENTS[carouselIndex];
    const timeVal = analyticsData.avgResolutionTime[deptName] || 0;
    return { name: deptName, time: timeVal };
  };

  const currentCarouselData = getCarouselData();

  return (
    <div className="support-tickets-wrapper">
      <style>{styles}</style>
      {alert && <div className="custom-alert" style={{ backgroundColor: alert.type === 'success' ? 'var(--success-color)' : 'var(--danger-color)' }}>{alert.msg}</div>}


      {/* ANALYTICS DASHBOARD */}
      {analyticsData && (
        <div className="analytics-grid">
            <div className="stat-card">
                <div className="stat-title"><CheckSquare size={16}/> Resolved by Department</div>
                {Object.entries(analyticsData.deptResolved).map(([dept, count]) => (
                        <div key={dept} className="chart-row">
                        <div className="chart-label">{dept}</div>
                        <div className="chart-bar-bg">
                            <div className="chart-bar-fill" style={{width: `${(count / Math.max(...Object.values(analyticsData.deptResolved), 1)) * 100}%`, background: 'var(--success-color)'}}></div>
                        </div>
                        <div className="chart-value">{count}</div>
                        </div>
                ))}
            </div>

            <div className="stat-card carousel-card">
                 <div className="carousel-header">
                     <span className="carousel-label"><Clock size={12} style={{display:'inline', marginRight:4}}/> Response Time</span>
                     <span className="carousel-dept-name">{currentCarouselData.name}</span>
                 </div>
                 
                 <div style={{flex:1, display:'flex', flexDirection:'column', justifyContent:'center'}}>
                     <div className="carousel-body">
                         <div className="time-icon-wrapper">
                             <Timer size={24} />
                         </div>
                         <div>
                             <span className="carousel-value-lg">{currentCarouselData.time}</span>
                             <span className="carousel-unit">hrs</span>
                         </div>
                     </div>
                     <div className="carousel-desc">Avg time to resolve tickets</div>
                 </div>

                 <div className="carousel-nav">
                     <button className="nav-btn" onClick={prevDept}><ChevronLeft size={16}/></button>
                     <div style={{fontSize:'12px', color:'#a0aec0', fontWeight:'600'}}>{carouselIndex + 1} / {DEPARTMENTS.length}</div>
                     <button className="nav-btn" onClick={nextDept}><ChevronRight size={16}/></button>
                 </div>
            </div>

            <div className="stat-card">
                <div className="stat-title"><TrendingUp size={16}/> Top Issue Categories</div>
                {analyticsData.topCategories.map(([cat, count]) => (
                        <div key={cat} className="chart-row">
                        <div className="chart-label" style={{width:'140px'}}>{cat}</div>
                        <div className="chart-bar-bg">
                            <div className="chart-bar-fill" style={{width: `${(count / analyticsData.totalTickets) * 100}%`, background: 'var(--warning-color)'}}></div>
                        </div>
                        <div className="chart-value">{count}</div>
                        </div>
                ))}
            </div>
        </div>
      )}

      <div className="tabs-container">
        <button className={`tab-btn ${activeTab === 'New' ? 'active' : ''}`} onClick={() => setActiveTab('New')}>
          New Requests <span className="tab-count">{tickets.filter(t => t.status === 'open').length}</span>
        </button>
        <button className={`tab-btn ${activeTab === 'Pending' ? 'active' : ''}`} onClick={() => setActiveTab('Pending')}>
          Pending <span className="tab-count">{tickets.filter(t => t.status === 'pending' && t.priority !== 'N/A').length}</span>
        </button>
        <button className={`tab-btn ${activeTab === 'Resolved' ? 'active' : ''}`} onClick={() => setActiveTab('Resolved')}>
          Resolved <span className="tab-count">{tickets.filter(t => t.status === 'resolved').length}</span>
        </button>
      </div>

      <div className="content-card">
        {/* TOOLBAR: Search + Filter + Refresh */}
        <div className="toolbar">
            <div className="search-wrapper">
                <Search size={16} className="search-icon"/>
                <input 
                    type="text" 
                    className="search-input" 
                    placeholder="Search by ID, Subject, or Requester..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                />
            </div>

            <div className="filter-wrapper">
                <Filter size={16} className="filter-icon"/>
                <select 
                    className="filter-select"
                    value={deptFilter}
                    onChange={(e) => setDeptFilter(e.target.value)}
                >
                    <option value="All">All Departments</option>
                    {DEPARTMENTS.map(dept => <option key={dept} value={dept}>{dept}</option>)}
                </select>
            </div>

            <button className="action-btn" onClick={fetchTickets}>
                {loading ? <Loader2 className="animate-spin" size={14}/> : <RefreshCw size={14}/>} Refresh
            </button>
        </div>

        <div style={{overflowX: 'auto'}}>
          <table className="ticket-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Subject</th>
                <th>Category</th>
                <th>Requester</th>
                {activeTab !== 'New' && <th>Priority</th>}
                {activeTab !== 'New' && <th>Department</th>}
                {activeTab === 'New' && <th>Created</th>}
                {activeTab === 'Pending' && <th>Time Remaining</th>}
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="9" style={{textAlign:'center', padding:'30px'}}>Loading tickets...</td></tr>
              ) : filteredTickets.length === 0 ? (
                <tr><td colSpan="9" style={{textAlign:'center', padding:'30px', color:'#999'}}>No tickets found.</td></tr>
              ) : (
                filteredTickets.map(ticket => {
                  const slaStatus = checkSLAStatus(ticket);
                  const isOverdue = slaStatus === 'overdue';
                  return (
                    <tr 
                      key={ticket.id} 
                      onClick={() => { setSelectedTicket(ticket); setDetailsModalOpen(true); }}
                      className={isOverdue ? 'ticket-row-danger' : ''}
                    >
                      <td>#{ticket.id.substring(0,6)}</td>
                      <td>{ticket.subject}</td>
                      <td><span style={{fontSize:'12px', background:'#eee', padding:'2px 8px', borderRadius:'6px'}}>{ticket.categoryLabel}</span></td>
                      <td>{ticket.requester}</td>
                      {activeTab !== 'New' && <td>{renderPriority(ticket.priority)}</td>}
                      {activeTab !== 'New' && <td style={{fontWeight:'500'}}>{ticket.department}</td>}
                      {activeTab === 'New' && <td>{ticket.created.split(',')[0]}</td>}
                      {activeTab === 'Pending' && (<td><SLACountdown ticket={ticket} /></td>)}
                      <td>
                        {activeTab === 'New' && (
                          <button className="action-btn" onClick={(e) => { e.stopPropagation(); openForwardModal(ticket); }}><Send size={14}/> Review & Forward</button>
                        )}
                        {activeTab !== 'New' && (
                          <button className="action-btn" style={{backgroundColor:'var(--bg-secondary)', color:'var(--text-primary)'}}><Eye size={14}/> View</button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ======================= */}
      {/* FORWARDING MODAL        */}
      {/* ======================= */}
      {forwardModalOpen && selectedTicket && (
        <div className="modal-overlay" onClick={() => setForwardModalOpen(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div style={{display:'flex', justifyContent:'space-between', marginBottom:'10px'}}>
              <h3>Review & Forward Ticket</h3>
              <button onClick={() => setForwardModalOpen(false)} style={{background:'none', border:'none', cursor:'pointer'}}><X/></button>
            </div>
            <TicketSummaryBox ticket={selectedTicket} />
            <div style={{borderTop:'2px dashed #eee', margin:'20px 0'}}></div>
            <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'20px'}}>
                <div className="form-group">
                <label style={{color:'var(--text-primary)'}}>Assigned Department</label>
                <select className="form-select" value={targetDept} onChange={(e) => setTargetDept(e.target.value)}>
                    {DEPARTMENTS.map(dept => <option key={dept} value={dept}>{dept}</option>)}
                </select>
                <div style={{fontSize:'10px', color:'#999', marginTop:'4px'}}>Auto-detected from: {selectedTicket.issueCategory}</div>
                </div>
                <div className="form-group">
                <label style={{color:'var(--text-primary)'}}>Assign Priority Level</label>
                <select className="form-select" value={targetPriority} onChange={(e) => setTargetPriority(e.target.value)} style={{borderColor: 'var(--accent-primary)', borderWidth:'2px'}}>
                    <option value="" disabled>Select Priority...</option>
                    {PRIORITIES.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
                </div>
            </div>
            <div style={{display:'flex', justifyContent:'flex-end', gap:'10px', marginTop:'20px'}}>
              <button className="action-btn" style={{background:'#ccc'}} onClick={() => setForwardModalOpen(false)}>Cancel</button>
              <button className="action-btn" onClick={confirmForward} disabled={isForwarding}>
                {isForwarding ? <Loader2 className="animate-spin" size={16}/> : <Send size={16}/>} {isForwarding ? ' Processing...' : ' Confirm & Forward'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================= */}
      {/* DETAILS / RESOLVE MODAL */}
      {/* ======================= */}
      {detailsModalOpen && selectedTicket && (
        <div className="modal-overlay" onClick={() => setDetailsModalOpen(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div style={{display:'flex', justifyContent:'space-between', marginBottom:'15px'}}>
              <h3 style={{display:'flex', alignItems:'center', gap:'10px'}}>Ticket Details #{selectedTicket.id.substring(0,6)}</h3>
              <button onClick={() => setDetailsModalOpen(false)} style={{background:'none', border:'none', cursor:'pointer'}}><X/></button>
            </div>
            <div className="status-header">
                <div style={{display:'flex', gap:'20px'}}>
                    <div><div style={{fontSize:'11px', color:'#888', textTransform:'uppercase', fontWeight:'700'}}>Priority</div><div style={{marginTop:'5px'}}>{renderPriority(selectedTicket.priority)}</div></div>
                    <div><div style={{fontSize:'11px', color:'#888', textTransform:'uppercase', fontWeight:'700'}}>Department</div><div style={{marginTop:'5px', display:'flex', alignItems:'center', gap:'5px', fontWeight:'500'}}><Building2 size={16} color="var(--accent-primary)"/> {selectedTicket.department || 'Not Assigned'}</div></div>
                    {selectedTicket.forwardedAt && (<div><div style={{fontSize:'11px', color:'#888', textTransform:'uppercase', fontWeight:'700'}}>Forwarded</div><div style={{marginTop:'5px', display:'flex', alignItems:'center', gap:'5px', fontSize:'13px'}}><Clock size={16} color="#888"/> {selectedTicket.forwardedAt.toLocaleString()}</div></div>)}
                </div>
            </div>
            <TicketSummaryBox ticket={selectedTicket} />
            {selectedTicket.status !== 'resolved' && activeTab === 'Pending' && (
              <div style={{borderTop:'2px solid var(--accent-primary)', paddingTop:'20px', background:'#f0f9ff', padding:'20px', borderRadius:'8px', marginTop:'20px'}}>
                <label style={{display:'block', marginBottom:'10px', fontWeight:'600', color:'var(--accent-primary)'}}><CheckCircle size={16} style={{display:'inline', marginRight:'5px'}}/> Agent Resolution / Note</label>
                <textarea style={{width:'100%', height:'100px', padding:'10px', borderRadius:'8px', border:'1px solid #90cdf4', marginBottom:'15px', background:'white'}} placeholder="Type the solution details here to resolve the ticket..." value={replyText} onChange={(e) => setReplyText(e.target.value)}/>
                <div style={{display:'flex', justifyContent:'flex-end'}}>
                   <button className="action-btn" style={{backgroundColor:'var(--success-color)'}} onClick={handleResolve}><CheckCircle size={16}/> Submit & Resolve</button>
                </div>
              </div>
            )}
            {selectedTicket.status === 'resolved' && (
              <div style={{background:'#f0fdf4', padding:'15px', borderRadius:'8px', border:'1px solid var(--success-color)', marginTop:'20px'}}>
                <h4 style={{color:'var(--success-color)', fontSize:'14px', marginBottom:'5px', display:'flex', alignItems:'center', gap:'5px'}}><CheckCircle size={16}/> Ticket Resolved</h4>
                <p style={{fontSize:'14px', color:'#333'}}><strong>Agent Note:</strong> {selectedTicket.agentReply}</p>
                <div style={{fontSize:'12px', color:'#666', marginTop:'10px'}}>Resolved on: {selectedTicket.resolvedAt?.toDate ? selectedTicket.resolvedAt.toDate().toLocaleString() : 'Just now'}</div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default SupportTickets;