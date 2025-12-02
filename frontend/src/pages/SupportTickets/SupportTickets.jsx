import React, { useState, useEffect, useMemo } from 'react';
import { 
  collection, 
  getDocs, 
  getDoc, 
  doc, 
  updateDoc, 
  serverTimestamp, 
  query, 
  where 
} from 'firebase/firestore';
import { db, auth } from '../../../firebase'; 
import { onAuthStateChanged } from 'firebase/auth';
import emailjs from '@emailjs/browser'; 
import { 
  Loader2, RefreshCw, Eye, Send, CheckCircle, X, Laptop,
  CreditCard, Lock, Sparkles, Bug, HelpCircle, Banknote, Package, ShoppingBag,
  Globe, User, Calendar, Building2, Clock, TrendingUp,
  Timer, CheckSquare, Search, Filter, ShieldAlert, ChevronLeft, ChevronRight
} from 'lucide-react';

// =======================================
// 1. ROLE CONFIGURATION
// =======================================

const ROLE_TO_DEPT_MAP = {
  'admin': 'All',            
  'Admin': 'All',            
  'Super_Admin': 'All',      
  
  // Department Staff
  'POS_Support': 'POS',
  'OnlineShopping_Support': 'Online Shopping',
  'Payroll_Admin': 'Payroll',
  'HRMIS_Admin': 'HRMIS',
  'Inventory_Manager': 'Inventory',
  'Warehouse_Operator': 'Warehouse'
};

const EMAIL_FORWARD_SERVICE_ID = "service_vg58qh8"; 
const EMAIL_FORWARD_TEMPLATE_ID = "template_9lluwnr"; 
const EMAIL_FORWARD_PUBLIC_KEY = "6XU-uQ7Og0d4oAykV"; 

const EMAIL_RESOLVE_SERVICE_ID = "service_e6osrqk"; 
const EMAIL_RESOLVE_TEMPLATE_ID = "template_9f0b21p"; 
const EMAIL_RESOLVE_PUBLIC_KEY = "pdnrkVk1D1DXJmS5c"; 

const DEPARTMENTS = [
  'POS', 'Online Shopping', 'Payroll', 'HRMIS', 'Inventory', 'Warehouse'
];

const PRIORITIES = ['High', 'Medium', 'Low'];
const SLA_LIMITS = { High: 72, Medium: 96, Low: 168 };

const CATEGORY_DEPT_MAP = {
  'transaction': 'POS', 'bug': 'POS', 'technical': 'POS',
  'billing': 'Online Shopping', 'feature': 'Online Shopping',
  'order_status': 'Online Shopping', 'website_error': 'Online Shopping',
  'stock_issue': 'Inventory', 'fulfillment': 'Warehouse',
  'access': 'HRMIS', 'general': 'HRMIS', 'payroll': 'Payroll' 
};

const ISSUE_CATEGORIES = [
  { value: 'technical', label: 'Technical Issue', icon: Laptop },
  { value: 'billing', label: 'Billing & Payments', icon: CreditCard },
  { value: 'access', label: 'Account Access', icon: Lock },
  { value: 'feature', label: 'Feature Request', icon: Sparkles },
  { value: 'bug', label: 'Report a Bug', icon: Bug },
  { value: 'general', label: 'General Inquiry', icon: HelpCircle },
  { value: 'transaction', label: 'Transaction Error', icon: Banknote },
  { value: 'fulfillment', label: 'Fulfillment', icon: Package },
  { value: 'stock_issue', label: 'Stock Issue', icon: Package },
  { value: 'order_status', label: 'Order Status', icon: ShoppingBag },
  { value: 'website_error', label: 'Website Error', icon: Globe },
  { value: 'payroll', label: 'Payroll Issue', icon: Banknote } 
];

// =======================================
// STYLES
// =======================================
const styles = `
  :root { --bg-primary: #E9ECEE; --bg-secondary: #F4F4F4; --text-primary: #395A7F; --text-secondary: #6E9FC1; --accent-primary: #395A7F; --card-bg: #FFFFFF; --danger-color: #EF4444; --warning-color: #F59E0B; --success-color: #10B981; }
  * { margin: 0; padding: 0; box-sizing: border-box; font-family: 'Inter', sans-serif; }
  .support-tickets-wrapper { background: var(--bg-primary); min-height: 100vh; padding: 30px; color: var(--text-primary); }
  .tabs-container { display: flex; gap: 20px; margin-bottom: 25px; border-bottom: 2px solid var(--text-secondary); padding-bottom: 0; }
  .tab-btn { background: none; border: none; font-size: 16px; font-weight: 600; color: var(--text-secondary); cursor: pointer; padding: 10px 20px; position: relative; }
  .tab-btn.active { color: var(--accent-primary); }
  .tab-btn.active::after { content: ''; position: absolute; bottom: -2px; left: 0; width: 100%; height: 3px; background: var(--accent-primary); }
  .tab-count { font-size: 12px; background: var(--bg-secondary); padding: 2px 8px; border-radius: 10px; margin-left: 8px; }
  .content-card { background: var(--card-bg); border-radius: 16px; padding: 30px; box-shadow: 0 4px 15px rgba(0, 0, 0, 0.08); }
  .ticket-table { width: 100%; border-collapse: collapse; margin-top: 20px; }
  .ticket-table th { text-align: left; padding: 15px; background: var(--bg-secondary); color: var(--text-primary); }
  .ticket-table td { padding: 15px; border-bottom: 1px solid #ddd; }
  .ticket-table tr:hover { background: var(--bg-secondary); cursor: pointer; }
  .priority-badge { padding: 4px 10px; border-radius: 12px; font-size: 12px; font-weight: 600; }
  .priority-high { color: var(--danger-color); border: 1px solid var(--danger-color); background: rgba(239,68,68,0.1); }
  .priority-medium { color: var(--warning-color); border: 1px solid var(--warning-color); background: rgba(245,158,11,0.1); }
  .priority-low { color: var(--info-color); border: 1px solid var(--info-color); background: rgba(59,130,246,0.1); }
  .action-btn { background: var(--accent-primary); color: white; border: none; padding: 6px 14px; border-radius: 6px; cursor: pointer; display: flex; align-items: center; gap: 6px; font-size: 13px; }
  .modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.5); display: flex; justify-content: center; align-items: center; z-index: 1000; backdrop-filter: blur(4px); }
  .modal-content { background: var(--card-bg); padding: 30px; border-radius: 16px; width: 700px; max-width: 90%; max-height: 90vh; overflow-y: auto; }
  .form-select { width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 8px; background: var(--bg-secondary); }
  .toolbar { display: flex; justify-content: flex-end; align-items: center; gap: 10px; margin-bottom: 15px; }
  .search-input { padding: 8px 12px 8px 35px; border-radius: 8px; border: 1px solid #ddd; width: 250px; }
  .filter-select { padding: 8px 12px 8px 35px; border-radius: 8px; border: 1px solid #ddd; background: white; appearance: none; }
  .ticket-row-danger { background-color: rgba(239, 68, 68, 0.05); box-shadow: inset 3px 0 0 var(--danger-color); }
  .custom-alert { position: fixed; top: 20px; right: 20px; padding: 15px 25px; border-radius: 8px; color: white; font-weight: 500; z-index: 2000; }
  
  /* ANALYTICS STYLES */
  .analytics-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; margin-bottom: 30px; }
  .stat-card { background: var(--card-bg); padding: 25px; border-radius: 16px; box-shadow: 0 4px 15px rgba(0,0,0,0.05); border: 1px solid #e2e8f0; height: 100%; display: flex; flex-direction: column; }
  .stat-title { font-size: 13px; color: #718096; font-weight: 700; text-transform: uppercase; margin-bottom: 20px; display: flex; align-items: center; gap: 8px; }
  
  /* CAROUSEL */
  .carousel-card { position: relative; border-top: 4px solid var(--warning-color); display: flex; flex-direction: column; justify-content: space-between; }
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

  /* CHART BARS */
  .chart-row { display: flex; align-items: center; margin-bottom: 12px; font-size: 13px; }
  .chart-label { width: 110px; font-weight: 500; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; color: #4a5568; }
  .chart-bar-bg { flex: 1; height: 8px; background: #edf2f7; border-radius: 4px; overflow: hidden; margin: 0 12px; }
  .chart-bar-fill { height: 100%; border-radius: 4px; transition: width 0.5s ease; }
  .chart-value { width: 35px; text-align: right; font-weight: 600; color: #2d3748; }

  /* SLA BAR */
  .sla-container { width: 140px; }
  .sla-bar-bg { width: 100%; height: 6px; background: #e5e7eb; border-radius: 10px; overflow: hidden; }
  .sla-bar-fill { height: 100%; transition: width 1s linear; }

  @media (max-width: 1024px) {
    .analytics-grid { grid-template-columns: 1fr; }
    .toolbar { flex-direction: column; align-items: stretch; }
    .search-input { width: 100%; }
  }
`;

// =======================================
// SLA COMPONENT
// =======================================
const SLACountdown = ({ ticket }) => {
  const [percent, setPercent] = useState(0);
  const [color, setColor] = useState('#10B981');

  useEffect(() => {
    if (!ticket.forwardedAt) return;
    const interval = setInterval(() => {
      const start = ticket.forwardedAt.toDate ? ticket.forwardedAt.toDate() : new Date(ticket.forwardedAt);
      const limitHours = SLA_LIMITS[ticket.priority] || 168; 
      const limitMs = limitHours * 60 * 60 * 1000;
      const now = new Date();
      const elapsed = now - start;
      let p = (elapsed / limitMs) * 100;
      if (p > 100) { p = 100; setColor('#EF4444'); }
      else if (p > 75) setColor('#F59E0B');
      else setColor('#10B981');
      setPercent(p);
    }, 1000);
    return () => clearInterval(interval);
  }, [ticket]);

  if (!ticket.forwardedAt) return <span style={{color:'#ccc'}}>--</span>;

  return (
    <div className="sla-container">
      <div style={{fontSize:'10px', marginBottom:'4px', display:'flex', justifyContent:'space-between'}}>
        <span style={{color}}>Status</span>
        <span>{Math.round(percent)}%</span>
      </div>
      <div className="sla-bar-bg">
        <div className="sla-bar-fill" style={{ width: `${percent}%`, background: color }}></div>
      </div>
    </div>
  );
};

// =======================================
// MAIN COMPONENT
// =======================================
const SupportTickets = () => {
  
  const [userProfile, setUserProfile] = useState(null); 
  const [authLoading, setAuthLoading] = useState(true);

  // DATA STATE
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('New'); 
  const [searchQuery, setSearchQuery] = useState('');
  const [deptFilter, setDeptFilter] = useState('All');
  
  // ANALYTICS & CAROUSEL STATE
  const [carouselIndex, setCarouselIndex] = useState(0);

  // MODALS
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [forwardModalOpen, setForwardModalOpen] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [targetDept, setTargetDept] = useState('');
  const [targetPriority, setTargetPriority] = useState('');
  const [isForwarding, setIsForwarding] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [alert, setAlert] = useState(null);

  // =======================================
  // 2. AUTHENTICATION & TAB LOGIC
  // =======================================
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setAuthLoading(true);
      if (currentUser) {
        try {
          const userDocRef = doc(db, 'users', currentUser.uid);
          const userDocSnap = await getDoc(userDocRef);

          if (userDocSnap.exists()) {
            const userData = userDocSnap.data();
            const dbRole = userData.role; 
            const assignedDept = ROLE_TO_DEPT_MAP[dbRole] || null;

            setUserProfile({
              uid: currentUser.uid,
              email: currentUser.email,
              name: userData.name || currentUser.displayName || 'Staff Member',
              role: dbRole,
              department: assignedDept 
            });

            // Force non-admin to 'Pending' tab
            if (assignedDept !== 'All') {
              setActiveTab('Pending');
            }

          } else {
            console.error("User logged in, but no profile found.");
            showAlert("Access Denied: User profile not found.", "danger");
          }
        } catch (error) {
          console.error("Error fetching user profile:", error);
        }
      } else {
        setUserProfile(null);
        setTickets([]);
      }
      setAuthLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // =======================================
  // 3. FETCH TICKETS
  // =======================================
  const fetchTickets = async () => {
    if (!userProfile || !userProfile.department) return;
    
    setLoading(true);
    try {
      const ticketsRef = collection(db, 'supportTickets');
      let q;

      if (userProfile.department === 'All') {
        q = ticketsRef;
      } else {
        // Staff filter
        q = query(ticketsRef, where('department', '==', userProfile.department));
      }

      const querySnapshot = await getDocs(q);
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
          categoryLabel: catObj ? catObj.label : 'General'
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

  useEffect(() => {
    if (userProfile) fetchTickets();
  }, [userProfile]);

  const showAlert = (msg, type = 'success') => {
    setAlert({ msg, type });
    setTimeout(() => setAlert(null), 4000);
  };

  // =======================================
  // 4. ANALYTICS LOGIC (Restored)
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

  // Carousel Helpers
  const nextDept = () => setCarouselIndex((prev) => (prev + 1) % DEPARTMENTS.length);
  const prevDept = () => setCarouselIndex((prev) => (prev - 1 + DEPARTMENTS.length) % DEPARTMENTS.length);
  
  const getCarouselData = () => {
    if (!analyticsData) return { name: '', time: 0 };
    const deptName = DEPARTMENTS[carouselIndex];
    const timeVal = analyticsData.avgResolutionTime[deptName] || 0;
    return { name: deptName, time: timeVal };
  };

  const currentCarouselData = getCarouselData();

  // =======================================
  // 5. FRONTEND FILTERING
  // =======================================
  const filteredTickets = useMemo(() => {
    let result = [];

    // Tab Filter
    if (activeTab === 'New') {
        result = tickets.filter(t => t.status === 'open' || (t.status === 'pending' && t.priority === 'N/A'));
    } else if (activeTab === 'Pending') {
        result = tickets.filter(t => t.status === 'pending' && t.priority !== 'N/A');
    } else if (activeTab === 'Resolved') {
        result = tickets.filter(t => t.status === 'resolved');
    }

    // Explicit Department Filter (Dropdown)
    if (deptFilter !== 'All') {
        result = result.filter(t => t.department === deptFilter);
    }

    // Search Filter
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
    <span className={`priority-badge priority-${p.toLowerCase()}`}>{p}</span>
  );

  // Actions
  const openForwardModal = (ticket) => {
    setSelectedTicket(ticket);
    const autoDept = CATEGORY_DEPT_MAP[ticket.issueCategory] || 'Online Shopping';
    setTargetDept(autoDept);
    setTargetPriority('Medium');
    setForwardModalOpen(true);
  };

  const confirmForward = async () => {
    if (!targetPriority || !targetDept) return showAlert('Please select dept/priority', 'warning');
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
      });
      setTickets(prev => prev.map(t => t.id === selectedTicket.id ? { ...t, status: 'pending', department: targetDept, priority: targetPriority, forwardedAt: new Date() } : t));
      showAlert(`Forwarded to ${targetDept}`, 'success');
      setForwardModalOpen(false);
    } catch (error) {
      console.error(error);
      showAlert('Failed to forward', 'danger');
    } finally {
      setIsForwarding(false);
    }
  };

  const handleResolve = async () => {
    if (!replyText) return showAlert('Enter a note', 'warning');
    try {
      const templateParams = {
        userEmail: selectedTicket.userEmail,
        userName: selectedTicket.requester,
        issueTitle: selectedTicket.subject,
        department: selectedTicket.department,
        agentReply: replyText
      };
      await emailjs.send(EMAIL_RESOLVE_SERVICE_ID, EMAIL_RESOLVE_TEMPLATE_ID, templateParams, EMAIL_RESOLVE_PUBLIC_KEY);
      await updateDoc(doc(db, 'supportTickets', selectedTicket.id), {
        status: 'resolved',
        agentReply: replyText,
        resolvedAt: serverTimestamp()
      });
      setTickets(prev => prev.map(t => t.id === selectedTicket.id ? { ...t, status: 'resolved', agentReply: replyText } : t));
      showAlert('Ticket resolved', 'success');
      setDetailsModalOpen(false);
      setReplyText('');
    } catch (e) {
      console.error(e);
      showAlert('Error resolving', 'danger');
    }
  };

  // =======================================
  // UI RENDER
  // =======================================
  if (authLoading) return <div style={{display:'flex',justifyContent:'center',alignItems:'center',height:'100vh'}}><Loader2 className="animate-spin" /> Loading User Profile...</div>;
  
  if (!userProfile) return (
    <div style={{display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', height:'100vh', gap:'15px', background:'#f8fafc'}}>
      <ShieldAlert size={48} color="#e11d48"/>
      <h3>Access Required</h3>
      <p style={{color:'#64748b'}}>Please log in to access the Support Dashboard.</p>
    </div>
  );

  if (!userProfile.department) return (
    <div style={{display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', height:'100vh', gap:'15px', background:'#fef2f2'}}>
      <ShieldAlert size={48} color="#dc2626"/>
      <h3 style={{color:'#991b1b'}}>Account Configuration Error</h3>
      <p style={{color:'#7f1d1d'}}>Your account role (<strong>{userProfile.role}</strong>) is not assigned to a department.</p>
      <p style={{fontSize:'12px', color:'#9ca3af'}}>Please contact your system administrator.</p>
    </div>
  );

  return (
    <div className="support-tickets-wrapper">
      <style>{styles}</style>
      {alert && <div className="custom-alert" style={{ backgroundColor: alert.type === 'success' ? '#10B981' : '#EF4444' }}>{alert.msg}</div>}

      {/* ANALYTICS DASHBOARD (RESTORED) */}
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

      <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'20px'}}>
        <div className="tabs-container" style={{marginBottom:0, borderBottom:'none'}}>
          
          {/* TAB VISIBILITY LOGIC */}
          {/* ONLY ADMIN (All) can see 'New Requests' */}
          {userProfile.department === 'All' && (
            <button className={`tab-btn ${activeTab === 'New' ? 'active' : ''}`} onClick={() => setActiveTab('New')}>
              New <span className="tab-count">{tickets.filter(t => t.status === 'open').length}</span>
            </button>
          )}

          <button className={`tab-btn ${activeTab === 'Pending' ? 'active' : ''}`} onClick={() => setActiveTab('Pending')}>
            Pending <span className="tab-count">{tickets.filter(t => t.status === 'pending').length}</span>
          </button>
          <button className={`tab-btn ${activeTab === 'Resolved' ? 'active' : ''}`} onClick={() => setActiveTab('Resolved')}>
            Resolved <span className="tab-count">{tickets.filter(t => t.status === 'resolved').length}</span>
          </button>
        </div>
        
        {/* USER INFO REMOVED */}
      </div>

      <div style={{width:'100%', height:'2px', background:'var(--text-secondary)', marginBottom:'25px'}}></div>

      <div className="content-card">
        <div className="toolbar">
            <div style={{position:'relative'}}>
                <Search size={16} style={{position:'absolute', left:10, top:'50%', transform:'translateY(-50%)', color:'#999'}}/>
                <input type="text" className="search-input" placeholder="Search..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
            </div>

            {/* ADMIN FILTER DROPDOWN */}
            {userProfile.department === 'All' ? (
              <div style={{position:'relative'}}>
                  <Filter size={16} style={{position:'absolute', left:10, top:'50%', transform:'translateY(-50%)', color:'#999'}}/>
                  <select className="filter-select" value={deptFilter} onChange={(e) => setDeptFilter(e.target.value)}>
                      <option value="All">All Departments</option>
                      {DEPARTMENTS.map(dept => <option key={dept} value={dept}>{dept}</option>)}
                  </select>
              </div>
            ) : (
              <div style={{padding:'8px 15px', background:'#f1f5f9', borderRadius:'8px', fontSize:'13px', fontWeight:'600', color:'#475569', display:'flex', alignItems:'center', gap:'6px'}}>
                  <Building2 size={14}/> {userProfile.department} View Only
              </div>
            )}

            <button className="action-btn" onClick={fetchTickets}>
                {loading ? <Loader2 className="animate-spin" size={14}/> : <RefreshCw size={14}/>} Refresh
            </button>
        </div>

        <div style={{overflowX: 'auto'}}>
          <table className="ticket-table">
            <thead>
              <tr>
                <th>ID</th><th>Subject</th><th>Category</th><th>Requester</th>
                {activeTab !== 'New' && <th>Priority</th>}
                {activeTab !== 'New' && <th>Department</th>}
                {activeTab === 'New' && <th>Created</th>}
                {activeTab === 'Pending' && <th>SLA</th>}
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="9" style={{textAlign:'center', padding:'30px'}}>Loading tickets from database...</td></tr>
              ) : filteredTickets.length === 0 ? (
                <tr><td colSpan="9" style={{textAlign:'center', padding:'30px', color:'#999'}}>No tickets found in this tab.</td></tr>
              ) : (
                filteredTickets.map(ticket => (
                    <tr key={ticket.id} onClick={() => { setSelectedTicket(ticket); setDetailsModalOpen(true); }} className={ticket.priority === 'High' ? 'ticket-row-danger' : ''}>
                      <td>#{ticket.id.substring(0,6)}</td>
                      <td>{ticket.subject}</td>
                      <td><span style={{fontSize:'12px', background:'#eee', padding:'2px 8px', borderRadius:'6px'}}>{ticket.categoryLabel}</span></td>
                      <td>{ticket.requester}</td>
                      {activeTab !== 'New' && <td>{renderPriority(ticket.priority)}</td>}
                      {activeTab !== 'New' && <td>{ticket.department}</td>}
                      {activeTab === 'New' && <td>{ticket.created.split(',')[0]}</td>}
                      {activeTab === 'Pending' && <td><SLACountdown ticket={ticket} /></td>}
                      <td>
                        {activeTab === 'New' && <button className="action-btn" onClick={(e) => { e.stopPropagation(); openForwardModal(ticket); }}><Send size={14}/> Forward</button>}
                        {activeTab !== 'New' && <button className="action-btn" style={{backgroundColor:'var(--bg-secondary)', color:'var(--text-primary)'}}><Eye size={14}/> View</button>}
                      </td>
                    </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* FORWARD MODAL */}
      {forwardModalOpen && selectedTicket && (
        <div className="modal-overlay" onClick={() => setForwardModalOpen(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <h3>Forward Ticket</h3>
            <div className="form-group" style={{marginTop:'20px'}}>
               <label>Department</label>
               <select className="form-select" value={targetDept} onChange={e => setTargetDept(e.target.value)}>
                 {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
               </select>
            </div>
            <div className="form-group">
               <label>Priority</label>
               <select className="form-select" value={targetPriority} onChange={e => setTargetPriority(e.target.value)}>
                 <option value="" disabled>Select...</option>
                 {PRIORITIES.map(p => <option key={p} value={p}>{p}</option>)}
               </select>
            </div>
            <div style={{display:'flex',justifyContent:'flex-end', gap:'10px', marginTop:'20px'}}>
              <button className="action-btn" style={{background:'#999'}} onClick={() => setForwardModalOpen(false)}>Cancel</button>
              <button className="action-btn" onClick={confirmForward} disabled={isForwarding}>{isForwarding ? 'Sending...' : 'Confirm'}</button>
            </div>
          </div>
        </div>
      )}

      {/* DETAILS MODAL */}
      {detailsModalOpen && selectedTicket && (
         <div className="modal-overlay" onClick={() => setDetailsModalOpen(false)}>
            <div className="modal-content" onClick={e => e.stopPropagation()}>
              <div style={{display:'flex', justifyContent:'space-between'}}><h3>Ticket Details</h3><X onClick={() => setDetailsModalOpen(false)} style={{cursor:'pointer'}}/></div>
              <div style={{background:'#f8fafc', padding:'15px', borderRadius:'8px', margin:'15px 0'}}>
                 <h4>{selectedTicket.subject}</h4>
                 <p style={{marginTop:'10px', fontSize:'14px', color:'#555'}}>{selectedTicket.description}</p>
                 {selectedTicket.attachments && selectedTicket.attachments.length > 0 && selectedTicket.attachments[0].attachmentURL && (
                   <img src={selectedTicket.attachments[0].attachmentURL} style={{width:'100px', height:'100px', objectFit:'cover', marginTop:'10px', borderRadius:'8px'}} />
                 )}
              </div>
              
              {selectedTicket.status !== 'resolved' && activeTab === 'Pending' && (
                 <div>
                    <textarea placeholder="Resolution note..." style={{width:'100%', padding:'10px', borderRadius:'8px', border:'1px solid #ddd'}} value={replyText} onChange={e => setReplyText(e.target.value)} />
                    <button className="action-btn" style={{marginTop:'10px', background:'var(--success-color)'}} onClick={handleResolve}>Resolve Ticket</button>
                 </div>
              )}
            </div>
         </div>
      )}
    </div>
  );
};

export default SupportTickets;