import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  collection, getDocs, getDoc, doc, updateDoc, serverTimestamp
} from 'firebase/firestore';
import { db, auth } from '../../../firebase';
import { onAuthStateChanged } from 'firebase/auth';
import emailjs from '@emailjs/browser';
import {
  Loader2, RefreshCw, Eye, Send, CheckCircle, X, Laptop,
  CreditCard, Lock, Sparkles, Bug, HelpCircle, Package,
  User, Building2, Clock, TrendingUp,
  Timer, CheckSquare, Search, ChevronLeft, ChevronRight,
  MapPin, Phone, FileText, Download, Image as ImageIcon, Trash2,
  QrCode, MoreHorizontal, ListFilter, Ban, AlertCircle
} from 'lucide-react';

// =======================================
// 1. CONFIGURATION
// =======================================

const ROLE_TO_DEPT_MAP = {
  'admin': 'All', 'Admin': 'All', 'Super_Admin': 'All',
  'POS_Support': 'POS', 'OnlineShopping_Support': 'Online Shopping',
  'Payroll_Admin': 'Payroll', 'HRMIS_Admin': 'HRMIS',
  'Inventory_Manager': 'Inventory', 'Warehouse_Operator': 'Warehouse'
};

// --- EMAIL CONFIGURATION ---
const EMAIL_FORWARD_SERVICE_ID = "service_olb5jz9";
const EMAIL_FORWARD_TEMPLATE_ID = "template_5kna9fs";
const EMAIL_FORWARD_PUBLIC_KEY = "gtZLgUOmCB4u9Rw66";

const EMAIL_RESOLVE_SERVICE_ID = "service_e6osrqk";
const EMAIL_RESOLVE_TEMPLATE_ID = "template_9f0b21p";
const EMAIL_RESOLVE_PUBLIC_KEY = "pdnrkVk1D1DXJmS5c";

const EMAIL_REJECT_SERVICE_ID = "service_e6osrqk";
const EMAIL_REJECT_TEMPLATE_ID = "template_3l0wfnf";
const EMAIL_REJECT_PUBLIC_KEY = "pdnrkVk1D1DXJmS5c";

const CLOUD_NAME = "dc7etbsfe";
const UPLOAD_PRESET = "image_upload";

const DEPARTMENTS = ['POS', 'Online Shopping', 'Payroll', 'HRMIS', 'Inventory', 'Warehouse'];
const PRIORITIES = ['High', 'Medium', 'Low'];
const SLA_LIMITS = { High: 72, Medium: 96, Low: 168 };

const CATEGORY_DEPT_MAP = {
  'technical': 'POS', 
  'billing': 'Online Shopping', 
  'access': 'HRMIS',
  'stock_issue': 'Inventory', 
  'feature': 'Online Shopping',
  'bug': 'POS',
  'general': 'HRMIS', 
  'others': 'N/A'
};

const ISSUE_CATEGORIES = [
  { value: 'technical', label: 'Technical Issue', icon: Laptop },
  { value: 'billing', label: 'Billing & Payments', icon: CreditCard },
  { value: 'access', label: 'Account Access', icon: Lock },
  { value: 'stock_issue', label: 'Inventory Stock Issue', icon: Package },
  { value: 'feature', label: 'Feature Request', icon: Sparkles },
  { value: 'bug', label: 'Report a Bug', icon: Bug },
  { value: 'general', label: 'General Inquiry', icon: HelpCircle },
  { value: 'others', label: 'Others / Unspecified', icon: MoreHorizontal }
];

// =======================================
// STYLES
// =======================================
const styles = `
  :root { 
    --bg-primary: #E9ECEE; 
    --bg-secondary: #F4F4F4; 
    --text-primary: #395A7F; 
    --text-secondary: #6E9FC1; 
    --text-muted: #94a3b8;
    --accent-primary: #395A7F; 
    --card-bg: #FFFFFF; 
    --border-light: #e2e8f0;
    --table-header-bg: #f8fafc;
    --table-row-hover: #f8fafc;
    --danger-color: #EF4444; 
    --warning-color: #F59E0B; 
    --success-color: #10B981; 
    --info-color: #3b82f6;
  }

  [data-theme="dark"] {
    --bg-primary: #1E2A38;
    --bg-secondary: #2C3E50;
    --text-primary: #E9ECEE;
    --text-secondary: #A3CAE9;
    --text-muted: #94A3B8;
    --accent-primary: #68D391;
    --card-bg: #2C3E50;
    --border-light: #4A5568;
    --table-header-bg: #1f2937;
    --table-row-hover: #374151;
    --danger-color: #EF4444; 
    --warning-color: #F59E0B; 
    --success-color: #10B981;
    --info-color: #63B3ED;
  }

  * { 
    margin: 0; padding: 0; box-sizing: border-box; font-family: 'Inter', sans-serif; 
    scrollbar-width: thin;
    scrollbar-color: var(--border-light) transparent;
  }
  
  /* MAIN LAYOUT WRAPPER */
  .support-tickets-wrapper { 
      background: var(--bg-primary); 
      color: var(--text-primary);
      display: flex;
      flex-direction: column;
      width: 100%;
      height: 100vh; 
      padding: 15px; 
      overflow-y: auto; 
      transition: background-color 0.3s ease, color 0.3s ease;
  }
  
  @media (min-width: 1024px) {
    .support-tickets-wrapper {
        padding: 30px;
    }
  }

  /* UTILS */
  .text-muted { color: var(--text-muted); }
  .text-dark { color: var(--text-primary); }
  .text-sm { font-size: 13px; }
  .font-bold { font-weight: 600; }

  /* TABS */
  .tabs-container { 
      display: flex; gap: 20px; margin-bottom: 20px; 
      border-bottom: 2px solid var(--border-light); padding-bottom: 0; 
      flex-shrink: 0; 
      overflow-x: auto;
      white-space: nowrap;
  }
  .tab-btn { background: none; border: none; font-size: 16px; font-weight: 600; color: var(--text-muted); cursor: pointer; padding: 10px 20px; position: relative; }
  .tab-btn:hover { color: var(--text-primary); }
  .tab-btn.active { color: var(--accent-primary); }
  .tab-btn.active::after { content: ''; position: absolute; bottom: -2px; left: 0; width: 100%; height: 3px; background: var(--accent-primary); }
  .tab-count { font-size: 12px; background: var(--bg-secondary); padding: 2px 8px; border-radius: 10px; margin-left: 8px; color: var(--text-primary); }
  
  /* CONTENT CARD */
  .content-card { 
      background: var(--card-bg); 
      border-radius: 16px; 
      padding: 20px; 
      box-shadow: 0 4px 15px rgba(0, 0, 0, 0.08); 
      border: 1px solid var(--border-light);
      display: flex;
      flex-direction: column;
      min-height: 600px; 
      flex: 1; 
      margin-bottom: 20px;
  }

  @media (min-width: 1024px) {
    .content-card {
        padding: 20px 30px;
    }
  }

  /* TABLE CONTAINER */
  .table-scroll-container {
      margin-top: 15px;
      width: 100%;
      flex: 1; 
      overflow-x: auto;
      overflow-y: auto;
      padding-right: 5px; 
      min-height: 400px; 
  }

  .table-scroll-container::-webkit-scrollbar { width: 6px; height: 6px; }
  .table-scroll-container::-webkit-scrollbar-track { background: transparent; }
  .table-scroll-container::-webkit-scrollbar-thumb { background-color: var(--border-light); border-radius: 10px; }
  .table-scroll-container::-webkit-scrollbar-thumb:hover { background-color: var(--text-muted); }

  /* TABLE STYLING */
  .ticket-table { width: 100%; border-collapse: separate; border-spacing: 0; min-width: 800px; }
  .ticket-table th { 
      position: sticky; top: 0; z-index: 10; 
      text-align: left; 
      padding: 16px; 
      background: var(--table-header-bg); 
      color: var(--text-muted); 
      font-weight: 600; 
      font-size: 12px; 
      text-transform: uppercase; 
      letter-spacing: 0.05em;
      border-bottom: 1px solid var(--border-light);
      white-space: nowrap; 
      box-shadow: 0 1px 2px rgba(0,0,0,0.05);
  }
  .ticket-table td { 
      padding: 16px; 
      border-bottom: 1px solid var(--border-light); 
      vertical-align: middle; 
      color: var(--text-primary); 
      font-size: 14px; 
  }
  .ticket-table tr:last-child td { border-bottom: none; }
  .ticket-table tr:hover { background: var(--table-row-hover); cursor: pointer; transition: background 0.15s; }
  .ticket-row-danger { background-color: rgba(239,68,68,0.05) !important; }
  .ticket-row-danger:hover { background-color: rgba(239,68,68,0.1) !important; }

  .table-actions { display: flex; align-items: center; gap: 8px; }

  /* BADGES & BUTTONS */
  .priority-badge { padding: 4px 10px; border-radius: 12px; font-size: 12px; font-weight: 600; }
  .priority-high { color: var(--danger-color); border: 1px solid var(--danger-color); background: rgba(239,68,68,0.1); }
  .priority-medium { color: var(--warning-color); border: 1px solid var(--warning-color); background: rgba(245,158,11,0.1); }
  .priority-low { color: var(--info-color); border: 1px solid var(--info-color); background: rgba(59,130,246,0.1); }
  
  .action-btn { 
      background: var(--accent-primary); 
      color: white; 
      border: none; 
      padding: 8px 14px; 
      border-radius: 6px; 
      cursor: pointer; 
      display: flex; 
      align-items: center; 
      gap: 6px; 
      font-size: 13px; 
      font-weight: 500;
      transition: all 0.2s; 
      white-space: nowrap;
  }
  .action-btn:hover { opacity: 0.9; transform: translateY(-1px); }
  .action-btn:disabled { opacity: 0.6; cursor: not-allowed; transform: none; }

  /* FILTERS & TOOLBAR */
  .toolbar { 
      display: flex; 
      flex-wrap: wrap; 
      justify-content: flex-end; 
      align-items: center; 
      gap: 10px; 
      margin-bottom: 15px; 
      flex-shrink: 0; 
  }
  .filter-wrapper { position: relative; }
  .filter-menu-container { 
      position: absolute; top: 40px; right: 0; width: 280px; 
      background: var(--card-bg); border: 1px solid var(--border-light); 
      border-radius: 12px; padding: 16px; 
      box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04); 
      z-index: 50; animation: fadeIn 0.15s ease-out; 
  }
  .filter-group { margin-bottom: 15px; }
  .filter-group:last-child { margin-bottom: 0; }
  .filter-label { font-size: 11px; font-weight: 700; color: var(--text-muted); margin-bottom: 6px; text-transform: uppercase; display: block; }
  @keyframes fadeIn { from { opacity: 0; transform: translateY(-10px); } to { opacity: 1; transform: translateY(0); } }

  /* MODALS */
  .modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.5); display: flex; justify-content: center; align-items: center; z-index: 1000; backdrop-filter: blur(4px); }
  .modal-content { background: var(--card-bg); color: var(--text-primary); padding: 30px; border-radius: 12px; width: 800px; max-width: 90%; max-height: 90vh; overflow-y: auto; box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25); border: 1px solid var(--border-light); }
  .form-select { width: 100%; padding: 10px; border: 1px solid var(--border-light); border-radius: 8px; background: var(--bg-secondary); color: var(--text-primary); outline: none; }

  /* DETAIL LAYOUT */
  .detail-header-meta { font-size: 13px; font-weight: 700; color: var(--text-muted); margin-bottom: 5px; text-transform: uppercase; letter-spacing: 0.5px; }
  .detail-subject { font-size: 22px; font-weight: 600; color: var(--text-primary); margin-bottom: 30px; }
  .contact-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px 40px; margin-bottom: 30px; }
  .contact-item { display: flex; flex-direction: column; }
  .contact-label { font-size: 11px; font-weight: 700; color: var(--text-muted); text-transform: uppercase; margin-bottom: 6px; }
  .contact-value { font-size: 14px; color: var(--text-primary); display: flex; align-items: center; gap: 8px; }
  .status-summary-box { background: var(--bg-secondary); border-radius: 8px; padding: 20px; display: grid; grid-template-columns: repeat(2, 1fr); gap: 20px; margin-bottom: 30px; border: 1px solid var(--border-light); }
  .desc-box { background: var(--bg-secondary); border: 1px solid var(--border-light); border-radius: 8px; padding: 20px; color: var(--text-primary); font-size: 14px; line-height: 1.5; min-height: 80px; }

  /* CAROUSEL */
  .carousel-container { position: relative; border: 1px solid var(--border-light); border-radius: 8px; overflow: hidden; background: var(--card-bg); margin-bottom: 10px; height: 350px; display: flex; align-items: center; justify-content: center; }
  .carousel-slide { width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; padding: 20px; position: relative; }
  .carousel-image { max-width: 100%; max-height: 100%; object-fit: contain; border-radius: 4px; }
  .carousel-file-card { display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 15px; color: var(--text-muted); }
  .carousel-nav-btn { position: absolute; top: 50%; transform: translateY(-50%); background: var(--card-bg); border: 1px solid var(--border-light); width: 36px; height: 36px; border-radius: 50%; display: flex; align-items: center; justify-content: center; cursor: pointer; color: var(--text-primary); transition: all 0.2s; z-index: 2; box-shadow: 0 4px 6px rgba(0,0,0,0.05); }
  .carousel-nav-btn:hover { background: var(--bg-secondary); color: var(--accent-primary); transform: translateY(-50%) scale(1.1); }
  .carousel-nav-btn.left { left: 10px; }
  .carousel-nav-btn.right { right: 10px; }
  .carousel-footer { padding: 10px 15px; background: var(--bg-secondary); border: 1px solid var(--border-light); border-radius: 0 0 8px 8px; border-top: none; display: flex; justify-content: space-between; align-items: center; }
  .carousel-indicators { display: flex; gap: 6px; align-items: center; }
  .carousel-dot { width: 8px; height: 8px; border-radius: 50%; background: var(--border-light); cursor: pointer; transition: all 0.2s; }
  .carousel-dot.active { background: var(--accent-primary); transform: scale(1.2); }

  /* RESOLUTION UPLOAD */
  .resolution-upload-container { margin-top: 15px; display: flex; align-items: center; gap: 15px; }
  .upload-btn-wrapper { position: relative; overflow: hidden; display: inline-block; }
  .upload-btn { border: 1px solid var(--border-light); color: var(--text-muted); background-color: var(--card-bg); padding: 8px 12px; border-radius: 8px; font-size: 13px; font-weight: 600; cursor: pointer; display: flex; align-items: center; gap: 6px; transition: all 0.2s; }
  .upload-btn:hover { background-color: var(--bg-secondary); border-color: var(--text-muted); }
  .upload-btn-wrapper input[type=file] { font-size: 100px; position: absolute; left: 0; top: 0; opacity: 0; cursor: pointer; }
  .preview-container { position: relative; width: 60px; height: 60px; border-radius: 8px; overflow: hidden; border: 1px solid var(--border-light); }
  .preview-image { width: 100%; height: 100%; object-fit: cover; }
  .remove-preview { position: absolute; top: 2px; right: 2px; background: rgba(0,0,0,0.5); color: white; border-radius: 50%; padding: 2px; cursor: pointer; }

  /* ANALYTICS & GRID */
  .analytics-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; margin-bottom: 30px; flex-shrink: 0; }
  .stat-card { background: var(--card-bg); padding: 25px; border-radius: 16px; box-shadow: 0 4px 15px rgba(0,0,0,0.05); border: 1px solid var(--border-light); height: 100%; display: flex; flex-direction: column; }
  .stat-title { font-size: 13px; color: var(--text-muted); font-weight: 700; text-transform: uppercase; margin-bottom: 20px; display: flex; align-items: center; gap: 8px; }
  .search-input { padding: 8px 12px 8px 35px; border-radius: 8px; border: 1px solid var(--border-light); width: 200px; background: var(--card-bg); color: var(--text-primary); outline: none; }
  .filter-select { padding: 8px 12px; border-radius: 8px; border: 1px solid var(--border-light); background: var(--bg-secondary); color: var(--text-primary); appearance: none; width: 100%; cursor: pointer; outline: none; }
  .custom-alert { position: fixed; top: 20px; right: 20px; padding: 15px 25px; border-radius: 8px; color: white; font-weight: 500; z-index: 2000; }

  /* CAROUSEL DASHBOARD WIDGET */
  .carousel-card { position: relative; border-top: 4px solid var(--warning-color); display: flex; flex-direction: column; justify-content: space-between; }
  .carousel-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 15px; }
  .carousel-label { font-size: 12px; color: var(--text-muted); font-weight: 700; text-transform: uppercase; }
  .carousel-dept-name { font-size: 14px; font-weight: 700; color: var(--text-primary); text-transform: uppercase; letter-spacing: 0.5px; }
  .carousel-body { display: flex; align-items: center; gap: 15px; margin-bottom: 5px; }
  .time-icon-wrapper { background: rgba(245, 158, 11, 0.1); width: 50px; height: 50px; border-radius: 12px; display: flex; align-items: center; justify-content: center; color: var(--warning-color); flex-shrink: 0; }
  .carousel-value-lg { font-size: 36px; font-weight: 800; color: var(--text-primary); line-height: 1; }
  .carousel-unit { font-size: 16px; color: var(--text-muted); font-weight: 500; margin-left: 2px; }
  .carousel-desc { font-size: 13px; color: var(--text-muted); margin-top: 8px; }
  .carousel-nav { display: flex; justify-content: space-between; align-items: center; margin-top: 20px; }
  .nav-btn { background: transparent; border: 1px solid var(--border-light); border-radius: 50%; width: 32px; height: 32px; display: flex; align-items: center; justify-content: center; cursor: pointer; color: var(--text-muted); transition: all 0.2s; }
  .nav-btn:hover { background: var(--bg-secondary); color: var(--accent-primary); border-color: var(--accent-primary); }

  /* CHART BARS */
  .chart-row { display: flex; align-items: center; margin-bottom: 12px; font-size: 13px; }
  .chart-label { width: 110px; font-weight: 500; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; color: var(--text-primary); }
  .chart-bar-bg { flex: 1; height: 8px; background: var(--bg-secondary); border-radius: 4px; overflow: hidden; margin: 0 12px; }
  .chart-bar-fill { height: 100%; border-radius: 4px; transition: width 0.5s ease; }
  .chart-value { width: 35px; text-align: right; font-weight: 600; color: var(--text-primary); }

  /* SLA BAR */
  .sla-container { width: 140px; }
  .sla-bar-bg { width: 100%; height: 6px; background: var(--border-light); border-radius: 10px; overflow: hidden; }
  .sla-bar-fill { height: 100%; transition: width 1s linear; }

  @media (max-width: 1024px) {
    .analytics-grid { grid-template-columns: 1fr; }
    .contact-grid { grid-template-columns: 1fr; }
    .status-summary-box { grid-template-columns: 1fr; }
    .content-card { min-height: auto; } /* Let it flow on mobile */
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

  if (!ticket.forwardedAt) return <span style={{color:'var(--text-muted)'}}>--</span>;

  return (
    <div className="sla-container">
      <div style={{fontSize:'10px', marginBottom:'4px', display:'flex', justifyContent:'space-between'}}>
        <span style={{color}}>Status</span>
        <span style={{color: 'var(--text-primary)'}}>{Math.round(percent)}%</span>
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
  const fileInputRef = useRef(null);
  const [userProfile, setUserProfile] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);

  // DATA STATE
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('New');
  const [searchQuery, setSearchQuery] = useState('');
  const [deptFilter, setDeptFilter] = useState('All');

  // FILTERS STATE
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [priorityFilter, setPriorityFilter] = useState('All');
  const [filterMenuOpen, setFilterMenuOpen] = useState(false);

  // ANALYTICS & CAROUSEL STATE
  const [carouselIndex, setCarouselIndex] = useState(0);

  // MODALS & CAROUSEL STATE
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [forwardModalOpen, setForwardModalOpen] = useState(false);
  const [rejectModalOpen, setRejectModalOpen] = useState(false); 
  
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [attachmentIndex, setAttachmentIndex] = useState(0);

  // QR MODAL STATE
  const [qrModalOpen, setQrModalOpen] = useState(false);

  // ACTION STATES
  const [targetDept, setTargetDept] = useState('');
  const [targetPriority, setTargetPriority] = useState('');
  const [isForwarding, setIsForwarding] = useState(false);
  const [replyText, setReplyText] = useState('');

  // REJECTION STATES
  const [rejectionReason, setRejectionReason] = useState(''); 
  const [isRejecting, setIsRejecting] = useState(false); 

  // RESOLUTION IMAGE STATES
  const [resolutionFile, setResolutionFile] = useState(null);
  const [isUploadingResolution, setIsUploadingResolution] = useState(false);

  const [alert, setAlert] = useState(null);

  // AUTH & TAB LOGIC
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

            if (assignedDept !== 'All') {
              setActiveTab('Pending');
            }
          } else {
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

  // FETCH TICKETS
  const fetchTickets = async () => {
    if (!userProfile || !userProfile.department) return;
    setLoading(true);
    try {
      const ticketsRef = collection(db, 'supportTickets');
      const q = ticketsRef;

      const querySnapshot = await getDocs(q);
      const ticketsData = [];

      querySnapshot.forEach((docSnap) => {
        const data = docSnap.data();

        const attachments = (data.attachments || []).map(att => ({
            ...att,
            attachmentURL: att.fileUrl || att.downloadURL || att.url || (att.type?.startsWith('image/')
                ? `https://via.placeholder.com/150?text=${att.name || 'Img'}`
                : null),
        }));

        const autoDepartment = data.department || CATEGORY_DEPT_MAP[data.issueCategory] || 'Online Shopping';
        const catObj = ISSUE_CATEGORIES.find(c => c.value === data.issueCategory);

        ticketsData.push({
          id: docSnap.id,
          subject: data.issueTitle || 'No Subject',
          issueDescription: data.issueDescription || '',
          branchLabel: data.branchLabel || 'N/A',
          smBranch: data.smBranch || '',
          userPhone: data.userPhone || 'N/A',
          userEmail: data.userEmail || data.email,
          requester: data.userName || 'Unknown',
          categoryLabel: data.categoryLabel || (catObj ? catObj.label : 'General'),
          priority: data.priority || 'Unassigned',
          status: data.status || 'open',
          department: autoDepartment,
          created: data.createdAt?.toDate?.().toLocaleString() || 'Unknown',
          forwardedAt: data.forwardedAt || null,
          resolvedAt: data.resolvedAt || null,
          rejectedAt: data.rejectedAt || null, 
          attachments: attachments,
          agentReply: data.agentReply || '',
          resolutionImageURL: data.resolutionImageURL || null,
          rejectionReason: data.rejectionReason || '' 
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

  // ANALYTICS LOGIC (UPDATED to include Rejected)
  const analyticsData = useMemo(() => {
    if (tickets.length === 0) return null;

    // 1. RESOLVED Volume by Department & Rejected Count
    const deptResolved = {};
    let rejectedCount = 0; 

    DEPARTMENTS.forEach(d => deptResolved[d] = 0);
    
    tickets.forEach(t => {
      // Resolved Logic
      if(t.department && t.status === 'resolved') {
        deptResolved[t.department] = (deptResolved[t.department] || 0) + 1;
      }
      // NEW: Rejected Logic
      if (t.status === 'rejected') {
        rejectedCount++;
      }
    });

    // 2. Average Resolution Time
    const deptTime = {};
    DEPARTMENTS.forEach(d => deptTime[d] = { totalHours: 0, count: 0 });

    tickets.forEach(t => {
      if (t.status === 'resolved' && t.department && t.resolvedAt && t.forwardedAt) {
        const resolved = t.resolvedAt.toDate ? t.resolvedAt.toDate() : new Date(t.resolvedAt);
        const forwarded = t.forwardedAt.toDate ? t.forwardedAt.toDate() : new Date(t.forwardedAt);

        const diffMs = resolved - forwarded;

        if (diffMs > 0 && deptTime[t.department]) {
            const hours = diffMs / (1000 * 60 * 60);
            deptTime[t.department].totalHours += hours;
            deptTime[t.department].count += 1;
        }
      }
    });

    // Calculate Average for each department
    const avgResolutionTime = {};
    Object.keys(deptTime).forEach(dept => {
      const data = deptTime[dept];
      avgResolutionTime[dept] = data.count > 0 ? (data.totalHours / data.count).toFixed(1) : 0;
    });

    // 3. Top Categories
    const categoryCounts = {};
    tickets.forEach(t => {
      categoryCounts[t.categoryLabel] = (categoryCounts[t.categoryLabel] || 0) + 1;
    });
    const topCategories = Object.entries(categoryCounts).sort((a, b) => b[1] - a[1]).slice(0, 5);

    // Calculate Max Value for Chart Scaling (including rejected)
    const maxChartValue = Math.max(...Object.values(deptResolved), rejectedCount, 1);

    return { deptResolved, rejectedCount, maxChartValue, avgResolutionTime, topCategories, totalTickets: tickets.length };
  }, [tickets]);

  // Carousel Navigation Helpers
  const nextDept = () => setCarouselIndex((prev) => (prev + 1) % DEPARTMENTS.length);
  const prevDept = () => setCarouselIndex((prev) => (prev - 1 + DEPARTMENTS.length) % DEPARTMENTS.length);

  // Derived Carousel Data
  const currentDeptName = DEPARTMENTS[carouselIndex];
  const currentCarouselData = analyticsData ? {
      name: currentDeptName,
      time: analyticsData.avgResolutionTime[currentDeptName] || 0
  } : { name: '', time: 0 };

  // FRONTEND FILTERING & SORTING
  const filteredTickets = useMemo(() => {
    let result = [...tickets]; 

    // 1. Department Filter (User Role)
    if (userProfile && userProfile.department !== 'All') {
      result = result.filter(t => t.department === userProfile.department);
    }

    // 2. Tab Filter
    if (activeTab === 'New') {
      result = result.filter(t => t.status === 'open' || (t.status === 'pending' && t.priority === 'Unassigned'));
    } else if (activeTab === 'Pending') {
      result = result.filter(t => t.status === 'pending' && t.priority !== 'Unassigned');
    } else if (activeTab === 'Resolved') {
      result = result.filter(t => t.status === 'resolved');
    } else if (activeTab === 'Rejected') {
      // NEW: Rejected Tab Filter
      result = result.filter(t => t.status === 'rejected');
    }

    // 3. Department Dropdown Filter
    if (deptFilter !== 'All') {
      result = result.filter(t => t.department === deptFilter);
    }

    // 4. Category Filter
    if (categoryFilter !== 'All') {
      const targetCat = ISSUE_CATEGORIES.find(c => c.value === categoryFilter);
      if (targetCat) {
        result = result.filter(t => t.categoryLabel === targetCat.label);
      }
    }

    // 5. Priority Filter (Only applied if NOT on 'New' tab)
    if (activeTab !== 'New' && priorityFilter !== 'All') {
      result = result.filter(t => t.priority === priorityFilter);
    }

    // 6. Global Search Query (Updated to search multiple fields)
    if (searchQuery.trim() !== '') {
      const query = searchQuery.toLowerCase();
      result = result.filter(t =>
        t.subject.toLowerCase().includes(query) ||
        t.requester.toLowerCase().includes(query) ||
        t.id.toLowerCase().includes(query) ||
        t.branchLabel.toLowerCase().includes(query) ||
        (t.categoryLabel && t.categoryLabel.toLowerCase().includes(query)) ||
        (t.priority && t.priority.toLowerCase().includes(query)) ||
        (t.department && t.department.toLowerCase().includes(query)) ||
        (t.status && t.status.toLowerCase().includes(query))
      );
    }

    // 7. Sorting Logic
    if (activeTab === 'Resolved') {
      result.sort((a, b) => {
        const dateA = a.resolvedAt && a.resolvedAt.toDate ? a.resolvedAt.toDate() : new Date(a.resolvedAt || 0);
        const dateB = b.resolvedAt && b.resolvedAt.toDate ? b.resolvedAt.toDate() : new Date(b.resolvedAt || 0);
        return dateB - dateA;
      });
    } else if (activeTab === 'Rejected') {
        // NEW: Sort by Rejected Date
        result.sort((a, b) => {
            const dateA = a.rejectedAt && a.rejectedAt.toDate ? a.rejectedAt.toDate() : new Date(a.rejectedAt || 0);
            const dateB = b.rejectedAt && b.rejectedAt.toDate ? b.rejectedAt.toDate() : new Date(b.rejectedAt || 0);
            return dateB - dateA;
        });
    } else {
      result.sort((a, b) => new Date(b.created) - new Date(a.created));
    }

    return result;
  }, [tickets, activeTab, deptFilter, searchQuery, userProfile, categoryFilter, priorityFilter]);

  const renderPriority = (p) => (
    <span className={`priority-badge priority-${p.toLowerCase()}`}>{p}</span>
  );

  // ACTIONS
  const openDetailsModal = (ticket) => {
    setSelectedTicket(ticket);
    setAttachmentIndex(0);
    setReplyText('');
    setResolutionFile(null);
    setDetailsModalOpen(true);
  };

  const openForwardModal = (ticket) => {
    setSelectedTicket(ticket);
    const autoDept = CATEGORY_DEPT_MAP[ticket.issueCategory] || 'Online Shopping';
    setTargetDept(autoDept);
    setTargetPriority('Medium');
    setForwardModalOpen(true);
  };

  // NEW: Reject Modal Opener
  const openRejectModal = (ticket) => {
    setSelectedTicket(ticket);
    setRejectionReason('');
    setRejectModalOpen(true);
  };

  // Handle file selection for resolution
  const handleResolutionFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
        setResolutionFile(e.target.files[0]);
    }
  };

  // Upload resolution image to Cloudinary
  const uploadResolutionImage = async (file) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', UPLOAD_PRESET);

    const response = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`, {
        method: 'POST', body: formData
    });
    if (!response.ok) throw new Error('Upload failed');
    const data = await response.json();
    return data.secure_url;
  };

  const confirmForward = async () => {
    if (!targetPriority || !targetDept) return showAlert('Please select dept/priority', 'warning');
    setIsForwarding(true);
    try {
      const ticketRef = doc(db, 'supportTickets', selectedTicket.id);
      
      // 1. Validate Email
      if (!selectedTicket.userEmail) {
          throw new Error('Cannot forward: Ticket has no valid email address.');
      }

      const templateParams = {
        to_email: selectedTicket.userEmail,   // Send to user
        user_email: selectedTicket.userEmail, // Fallback
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
      console.error("Forward Error:", error);
      showAlert(error.message || 'Failed to forward ticket', 'danger');
    } finally {
      setIsForwarding(false);
    }
  };

  // NEW: Reject Handler
  const confirmReject = async () => {
    if (!rejectionReason) return showAlert('Please provide a rejection reason', 'warning');
    
    if (!selectedTicket.userEmail) {
        return showAlert('Error: User email is missing from this ticket.', 'danger');
    }

    setIsRejecting(true);
    
    try {
      const ticketRef = doc(db, 'supportTickets', selectedTicket.id);
      
      const templateParams = {
        to_email: selectedTicket.userEmail,
        user_email: selectedTicket.userEmail, // Fallback
        to_name: selectedTicket.requester,  
        subject: selectedTicket.subject,    
        rejection_reason: rejectionReason   
      };
      
      await emailjs.send(EMAIL_REJECT_SERVICE_ID, EMAIL_REJECT_TEMPLATE_ID, templateParams, EMAIL_REJECT_PUBLIC_KEY);
      
      await updateDoc(ticketRef, {
        status: 'rejected',
        rejectionReason: rejectionReason,
        rejectedAt: serverTimestamp(),
      });
      
      setTickets(prev => prev.map(t => t.id === selectedTicket.id ? { ...t, status: 'rejected', rejectionReason: rejectionReason, rejectedAt: new Date() } : t));
      
      showAlert(`Ticket Rejected`, 'success');
      setRejectModalOpen(false);
    } catch (error) {
      console.error("Reject Error:", error);
      showAlert('Failed to reject ticket', 'danger');
    } finally {
      setIsRejecting(false);
    }
  };

  const handleResolve = async () => {
    if (!replyText) return showAlert('Enter a note', 'warning');
    
    if (!selectedTicket.userEmail) {
        return showAlert('Error: User email is missing. Cannot notify.', 'danger');
    }

    setIsUploadingResolution(true);

    try {
      let uploadedImageUrl = null;
      if (resolutionFile) {
         uploadedImageUrl = await uploadResolutionImage(resolutionFile);
      }

      const templateParams = {
        to_email: selectedTicket.userEmail,
        user_email: selectedTicket.userEmail, // Fallback
        userName: selectedTicket.requester,
        issueTitle: selectedTicket.subject,
        department: selectedTicket.department,
        agentReply: replyText,
        resolution_image: uploadedImageUrl ? `<br/><img src="${uploadedImageUrl}" alt="Resolution Proof" style="max-width:100%; border-radius:8px; margin-top:10px;" /><br/>` : ''
      };

      await emailjs.send(EMAIL_RESOLVE_SERVICE_ID, EMAIL_RESOLVE_TEMPLATE_ID, templateParams, EMAIL_RESOLVE_PUBLIC_KEY);

      await updateDoc(doc(db, 'supportTickets', selectedTicket.id), {
        status: 'resolved',
        agentReply: replyText,
        resolvedAt: serverTimestamp(),
        resolutionImageURL: uploadedImageUrl || null
      });

      setTickets(prev => prev.map(t => t.id === selectedTicket.id ? {
          ...t, status: 'resolved', agentReply: replyText, resolvedAt: new Date(), resolutionImageURL: uploadedImageUrl
      } : t));

      showAlert('Ticket resolved', 'success');
      setDetailsModalOpen(false);
      setReplyText('');
      setResolutionFile(null);
    } catch (e) {
      console.error(e);
      showAlert('Error resolving ticket', 'danger');
    } finally {
      setIsUploadingResolution(false);
    }
  };

  // CAROUSEL NAVIGATION (ATTACHMENTS)
  const handleNext = () => {
    if (!selectedTicket || !selectedTicket.attachments) return;
    setAttachmentIndex((prev) => (prev + 1) % selectedTicket.attachments.length);
  };

  const handlePrev = () => {
    if (!selectedTicket || !selectedTicket.attachments) return;
    setAttachmentIndex((prev) => (prev - 1 + selectedTicket.attachments.length) % selectedTicket.attachments.length);
  };

  if (authLoading) return <div style={{display:'flex',justifyContent:'center',alignItems:'center',height:'100vh',color:'var(--text-primary)'}}><Loader2 className="animate-spin" /> Loading User Profile...</div>;
  if (!userProfile) return <div style={{padding:50, textAlign:'center', color:'var(--text-primary)'}}>Access Required</div>;

  return (
    <div className="support-tickets-wrapper">
      <style>{styles}</style>
      {alert && <div className="custom-alert" style={{ backgroundColor: alert.type === 'success' ? '#10B981' : '#EF4444' }}>{alert.msg}</div>}

      {/* ANALYTICS DASHBOARD - GLOBAL STATS */}
      {analyticsData && (
        <div className="analytics-grid">
            <div className="stat-card">
                <div className="stat-title"><CheckSquare size={16}/> Ticket Status by Dept</div>
                
                {/* 1. Render Resolved Rows */}
                {Object.entries(analyticsData.deptResolved).map(([dept, count]) => (
                        <div key={dept} className="chart-row">
                        <div className="chart-label">{dept}</div>
                        <div className="chart-bar-bg"><div className="chart-bar-fill" style={{width: `${(count / analyticsData.maxChartValue) * 100}%`, background: 'var(--success-color)'}}></div></div>
                        <div className="chart-value">{count}</div>
                        </div>
                ))}

                {/* 2. Render Rejected Row (Added at the bottom) */}
                <div className="chart-row" style={{marginTop:'8px', borderTop:'1px dashed var(--border-light)', paddingTop:'8px'}}>
                    <div className="chart-label" style={{color:'var(--danger-color)', fontWeight:'700'}}>Rejected</div>
                    <div className="chart-bar-bg">
                        <div className="chart-bar-fill" style={{width: `${(analyticsData.rejectedCount / analyticsData.maxChartValue) * 100}%`, background: 'var(--danger-color)'}}></div>
                    </div>
                    <div className="chart-value" style={{color:'var(--danger-color)'}}>{analyticsData.rejectedCount}</div>
                </div>
            </div>

            {/* CAROUSEL CARD - RESPONSE TIME PER DEPT */}
            <div className="stat-card carousel-card">
                 <div className="carousel-header">
                     <span className="carousel-label"><Clock size={12} style={{display:'inline', marginRight:4}}/> Response Time</span>
                     <span className="carousel-dept-name">{currentCarouselData.name}</span>
                 </div>
                 <div style={{flex:1, display:'flex', flexDirection:'column', justifyContent:'center'}}>
                     <div className="carousel-body">
                         <div className="time-icon-wrapper"><Timer size={24} /></div>
                         <div>
                             <span className="carousel-value-lg">{currentCarouselData.time}</span>
                             <span className="carousel-unit">hrs</span>
                         </div>
                     </div>
                     <div className="carousel-desc">Global average for this dept</div>
                 </div>
                 <div className="carousel-nav">
                     <button className="nav-btn" onClick={prevDept}><ChevronLeft size={16}/></button>
                     <div style={{fontSize:'12px', color:'var(--text-muted)', fontWeight:'600'}}>{carouselIndex + 1} / {DEPARTMENTS.length}</div>
                     <button className="nav-btn" onClick={nextDept}><ChevronRight size={16}/></button>
                 </div>
            </div>

            <div className="stat-card">
                <div className="stat-title"><TrendingUp size={16}/> Top Categories</div>
                {analyticsData.topCategories.map(([cat, count]) => (
                        <div key={cat} className="chart-row">
                        <div className="chart-label" style={{width:'140px'}}>{cat}</div>
                        <div className="chart-bar-bg"><div className="chart-bar-fill" style={{width: `${(count / analyticsData.totalTickets) * 100}%`, background: 'var(--warning-color)'}}></div></div>
                        <div className="chart-value">{count}</div>
                        </div>
                ))}
            </div>
        </div>
      )}

      {/* TABS & TOOLBAR - RESTRICTED VIEW */}
      <div className="tabs-container">
        {userProfile.department === 'All' && (
          <button 
            className={`tab-btn ${activeTab === 'New' ? 'active' : ''}`} 
            onClick={() => setActiveTab('New')}
          >
            New 
            <span className="tab-count">
              {tickets.filter(t => t.status === 'open' || (t.status === 'pending' && t.priority === 'Unassigned')).length}
            </span>
          </button>
        )}

        <button 
          className={`tab-btn ${activeTab === 'Pending' ? 'active' : ''}`} 
          onClick={() => setActiveTab('Pending')}
        >
          Pending 
          <span className="tab-count">
            {tickets.filter(t => t.status === 'pending' && t.priority !== 'Unassigned').length}
          </span>
        </button>

        <button 
          className={`tab-btn ${activeTab === 'Resolved' ? 'active' : ''}`} 
          onClick={() => setActiveTab('Resolved')}
        >
          Resolved 
          <span className="tab-count">
            {tickets.filter(t => t.status === 'resolved').length}
          </span>
        </button>

        {/* NEW: REJECTED TAB */}
        <button 
          className={`tab-btn ${activeTab === 'Rejected' ? 'active' : ''}`} 
          onClick={() => setActiveTab('Rejected')}
        >
          Rejected 
          <span className="tab-count">
            {tickets.filter(t => t.status === 'rejected').length}
          </span>
        </button>
      </div>

      <div className="content-card">
        <div className="toolbar">
            {/* Search Input */}
            <div style={{position:'relative'}}>
              <Search size={16} style={{position:'absolute', left:10, top:'50%', transform:'translateY(-50%)', color:'var(--text-muted)'}}/>
              <input type="text" className="search-input" placeholder="Search..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
            </div>

            {/* === NEW: Merged Filter Dropdown === */}
            <div className="filter-wrapper">
              <button 
                className="action-btn" 
                style={{backgroundColor: 'var(--card-bg)', color: 'var(--text-primary)', border: '1px solid var(--border-light)', height: '35px'}}
                onClick={() => setFilterMenuOpen(!filterMenuOpen)}
              >
                <ListFilter size={14}/> Filters
              </button>

              {filterMenuOpen && (
                <div className="filter-menu-container">
                  {/* Category Filter */}
                  <div className="filter-group">
                    <span className="filter-label">By Category</span>
                    <select className="filter-select" value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}>
                      <option value="All">All Categories</option>
                      {ISSUE_CATEGORIES.map(cat => (
                        <option key={cat.value} value={cat.value}>{cat.label}</option>
                      ))}
                    </select>
                  </div>

                  {/* Priority Filter (Hidden on New Tab) */}
                  {activeTab !== 'New' && (
                    <div className="filter-group">
                      <span className="filter-label">By Priority</span>
                      <select className="filter-select" value={priorityFilter} onChange={(e) => setPriorityFilter(e.target.value)}>
                        <option value="All">All Priorities</option>
                        {PRIORITIES.map(p => (
                          <option key={p} value={p}>{p}</option>
                        ))}
                      </select>
                    </div>
                  )}

                  {/* Department Filter (Admin Only) */}
                  {userProfile.department === 'All' && (
                    <div className="filter-group">
                      <span className="filter-label">By Department</span>
                      <select className="filter-select" value={deptFilter} onChange={(e) => setDeptFilter(e.target.value)}>
                        <option value="All">All Departments</option>
                        {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
                      </select>
                    </div>
                  )}
                </div>
              )}
            </div>

            <button 
                className="action-btn" 
                style={{backgroundColor: 'var(--card-bg)', color: 'var(--text-primary)', border: '1px solid var(--border-light)'}} 
                onClick={() => setQrModalOpen(true)}
            >
                <QrCode size={14}/> Ticket Portal
            </button>

            <button className="action-btn" onClick={fetchTickets}>
              {loading ? <Loader2 className="animate-spin" size={14}/> : <RefreshCw size={14}/>} Refresh
            </button>
        </div>

        <div className="table-scroll-container">
          <table className="ticket-table">
            <thead>
              <tr><th>ID</th><th>Subject</th><th>Category</th><th>Requester</th>{activeTab !== 'New' && <th>Priority</th>}{activeTab !== 'New' && <th>Department</th>}{activeTab === 'New' && <th>Created</th>}{activeTab === 'Pending' && <th>SLA</th>}<th>Action</th></tr>
            </thead>
            <tbody>
              {filteredTickets.length === 0 ? <tr><td colSpan="9" style={{textAlign:'center', padding:'30px', color:'var(--text-muted)'}}>No tickets found.</td></tr> : (
                filteredTickets.map(ticket => (
                    <tr key={ticket.id} onClick={() => openDetailsModal(ticket)} className={ticket.priority === 'High' ? 'ticket-row-danger' : ''}>
                      <td>{ticket.id.substring(0,6)}</td>
                      <td>{ticket.subject}</td>
                      <td>
                        <span style={{fontSize:'11px', background:'var(--bg-secondary)', padding:'4px 8px', borderRadius:'6px', fontWeight:'600', color:'var(--text-primary)'}}>
                          {ticket.categoryLabel}
                        </span>
                      </td>
                      <td>{ticket.requester}</td>
                      {activeTab !== 'New' && <td>{renderPriority(ticket.priority)}</td>}{activeTab !== 'New' && <td>{ticket.department}</td>}{activeTab === 'New' && <td>{ticket.created.split(',')[0]}</td>}{activeTab === 'Pending' && <td><SLACountdown ticket={ticket} /></td>}
                      
                      {/* ACTION BUTTONS */}
                      <td>
                        {activeTab === 'New' ? (
                          <div className="table-actions">
                             <button className="action-btn" onClick={(e) => { e.stopPropagation(); openForwardModal(ticket); }}>
                               <Send size={14}/> Forward
                             </button>
                             {/* NEW: REJECT BUTTON */}
                             <button className="action-btn" style={{backgroundColor: 'var(--danger-color)'}} onClick={(e) => { e.stopPropagation(); openRejectModal(ticket); }}>
                               <Ban size={14}/> Reject
                             </button>
                          </div>
                        ) : (
                          <button className="action-btn" style={{backgroundColor:'var(--bg-secondary)', color:'var(--text-primary)'}}>
                            <Eye size={14}/> View
                          </button>
                        )}
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
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{width:'500px'}}>
            <div style={{display:'flex', justifyContent:'space-between', marginBottom:'20px'}}><h3>Forward Ticket</h3><X onClick={() => setForwardModalOpen(false)} style={{cursor:'pointer'}}/></div>
            <div style={{padding:'15px', background:'var(--bg-secondary)', borderRadius:'8px', marginBottom:'20px'}}><strong>{selectedTicket.subject}</strong><div style={{fontSize:'12px', color:'var(--text-muted)'}}>From: {selectedTicket.requester}</div></div>
            <div className="form-group" style={{marginBottom:'15px'}}><label style={{display:'block', marginBottom:'5px', fontSize:'12px', fontWeight:'600'}}>Department</label><select className="form-select" value={targetDept} onChange={e => setTargetDept(e.target.value)}>{DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}</select></div>
            <div className="form-group"><label style={{display:'block', marginBottom:'5px', fontSize:'12px', fontWeight:'600'}}>Priority</label><select className="form-select" value={targetPriority} onChange={e => setTargetPriority(e.target.value)}><option value="" disabled>Select...</option>{PRIORITIES.map(p => <option key={p} value={p}>{p}</option>)}</select></div>
            <div style={{display:'flex',justifyContent:'flex-end', gap:'10px', marginTop:'20px'}}><button className="action-btn" onClick={confirmForward} disabled={isForwarding}>{isForwarding ? 'Sending...' : 'Confirm'}</button></div>
          </div>
        </div>
      )}

      {/* NEW: REJECT MODAL */}
      {rejectModalOpen && selectedTicket && (
        <div className="modal-overlay" onClick={() => setRejectModalOpen(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{width:'500px'}}>
            <div style={{display:'flex', justifyContent:'space-between', marginBottom:'20px'}}>
              <h3 style={{color: 'var(--danger-color)', display:'flex', alignItems:'center', gap:'8px'}}><Ban size={20}/> Reject Ticket</h3>
              <X onClick={() => setRejectModalOpen(false)} style={{cursor:'pointer'}}/>
            </div>
            
            <div style={{padding:'15px', background:'rgba(239, 68, 68, 0.1)', border:'1px solid var(--danger-color)', borderRadius:'8px', marginBottom:'20px'}}>
              <div style={{fontSize:'13px', color:'var(--danger-color)', marginBottom:'4px'}}>You are about to reject the following ticket:</div>
              <strong style={{color:'var(--danger-color)'}}>{selectedTicket.subject}</strong>
              <div style={{fontSize:'12px', color:'var(--danger-color)'}}>From: {selectedTicket.requester}</div>
            </div>

            <div className="form-group">
              <label style={{display:'block', marginBottom:'5px', fontSize:'12px', fontWeight:'600'}}>Reason for Rejection (Will be emailed to customer)</label>
              <textarea 
                className="form-select" 
                style={{height:'100px', resize:'none'}}
                placeholder="e.g. This is a duplicate request or invalid inquiry..."
                value={rejectionReason} 
                onChange={e => setRejectionReason(e.target.value)}
              />
            </div>

            <div style={{display:'flex',justifyContent:'flex-end', gap:'10px', marginTop:'20px'}}>
              <button className="action-btn" style={{backgroundColor:'var(--text-muted)'}} onClick={() => setRejectModalOpen(false)}>Cancel</button>
              <button className="action-btn" style={{backgroundColor:'var(--danger-color)'}} onClick={confirmReject} disabled={isRejecting}>
                {isRejecting ? <Loader2 className="animate-spin" size={14}/> : <Ban size={14}/>} 
                {isRejecting ? 'Rejecting...' : 'Confirm Reject'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* === DETAIL MODAL === */}
      {detailsModalOpen && selectedTicket && (
         <div className="modal-overlay" onClick={() => setDetailsModalOpen(false)}>
            <div className="modal-content" onClick={e => e.stopPropagation()}>
              <div style={{display:'flex', justifyContent:'space-between', alignItems:'flex-start'}}>
                 <div className="detail-header-meta">#{selectedTicket.id} • {selectedTicket.created}</div>
                 <X size={24} style={{cursor:'pointer', color:'var(--text-muted)'}} onClick={() => setDetailsModalOpen(false)}/>
              </div>
              <div className="detail-subject">{selectedTicket.subject}</div>

              {/* CONTACT GRID */}
              <div className="contact-grid">
                  <div className="contact-item">
                      <span className="contact-label">Requester</span>
                      <span className="contact-value"><User size={14}/> {selectedTicket.requester}</span>
                  </div>
                  <div className="contact-item">
                      <span className="contact-label">Contact Email</span>
                      <span className="contact-value" style={{color:'var(--accent-primary)'}}>{selectedTicket.userEmail}</span>
                  </div>
                  <div className="contact-item">
                      <span className="contact-label">Branch Location</span>
                      <span className="contact-value"><MapPin size={14}/> {selectedTicket.branchLabel}</span>
                  </div>
                  <div className="contact-item">
                      <span className="contact-label">Phone Number</span>
                      <span className="contact-value"><Phone size={14}/> {selectedTicket.userPhone}</span>
                  </div>
              </div>

              {/* STATUS BAR */}
              <div className="status-summary-box">
                  <div className="contact-item">
                      <span className="contact-label">Status</span>
                      <span className="contact-value" style={{textTransform:'capitalize'}}>
                        {selectedTicket.status === 'resolved' ? <CheckCircle size={14} color="var(--success-color)"/> : selectedTicket.status === 'rejected' ? <Ban size={14} color="var(--danger-color)"/> : <Clock size={14}/>}
                        {selectedTicket.status}
                      </span>
                  </div>
                  <div className="contact-item">
                      <span className="contact-label">Department</span>
                      <span className="contact-value"><Building2 size={14}/> {selectedTicket.department}</span>
                  </div>
                  <div className="contact-item">
                      <span className="contact-label">Priority</span>
                      <span className="contact-value">
                        {selectedTicket.priority && selectedTicket.priority !== 'N/A' && selectedTicket.priority !== 'Unassigned' ? (
                            <span style={{color: selectedTicket.priority === 'High' ? '#EF4444' : '#F59E0B', fontWeight:600}}>{selectedTicket.priority}</span>
                        ) : 'Unassigned'}
                      </span>
                  </div>
              </div>

              {/* DESCRIPTION */}
              <div style={{marginBottom:'25px'}}>
                  <div className="contact-label">Issue Description</div>
                  <div className="desc-box">{selectedTicket.issueDescription}</div>
              </div>

              {/* ATTACHMENTS CAROUSEL */}
              {selectedTicket.attachments && selectedTicket.attachments.length > 0 && (
                  <div style={{marginBottom:'25px'}}>
                      <div className="contact-label">Attachments ({selectedTicket.attachments.length})</div>

                      {/* CAROUSEL WRAPPER */}
                      <div className="carousel-container">
                          {selectedTicket.attachments.length > 1 && (
                              <button className="carousel-nav-btn left" onClick={handlePrev}><ChevronLeft size={20}/></button>
                          )}

                          <div className="carousel-slide">
                              {(() => {
                                  const att = selectedTicket.attachments[attachmentIndex];
                                  if (att.type?.startsWith('image') && att.attachmentURL) {
                                      return (
                                          <a href={att.attachmentURL} target="_blank" rel="noreferrer" style={{width:'100%', height:'100%', display:'flex', justifyContent:'center'}}>
                                              <img src={att.attachmentURL} alt={att.name} className="carousel-image"/>
                                          </a>
                                      );
                                  } else {
                                      return (
                                          <div className="carousel-file-card">
                                              <FileText size={48} color="var(--text-muted)"/>
                                              <div style={{fontWeight:600}}>{att.name}</div>
                                              <a href={att.attachmentURL} target="_blank" rel="noreferrer" className="action-btn"><Download size={14}/> Download File</a>
                                          </div>
                                      );
                                  }
                              })()}
                          </div>

                          {selectedTicket.attachments.length > 1 && (
                              <button className="carousel-nav-btn right" onClick={handleNext}><ChevronRight size={20}/></button>
                          )}
                      </div>

                      {/* META FOOTER FOR CAROUSEL */}
                      <div className="carousel-footer">
                          <div style={{fontSize:'12px', color:'var(--text-muted)'}}>
                              {selectedTicket.attachments[attachmentIndex].name}
                              <span style={{marginLeft:'8px', opacity:0.7}}>({Math.round(selectedTicket.attachments[attachmentIndex].size / 1024)} KB)</span>
                          </div>
                          {selectedTicket.attachments.length > 1 && (
                              <div className="carousel-indicators">
                                  {selectedTicket.attachments.map((_, idx) => (
                                      <div key={idx} className={`carousel-dot ${idx === attachmentIndex ? 'active' : ''}`} onClick={() => setAttachmentIndex(idx)}/>
                                  ))}
                              </div>
                          )}
                      </div>
                  </div>
              )}

              <div style={{borderBottom:'1px dashed var(--border-light)', margin:'20px 0'}}></div>

              {/* --- ACTION AREAS --- */}

              {/* 1. RESOLVED STATE */}
              {selectedTicket.status === 'resolved' && (
                  <div style={{background:'rgba(16, 185, 129, 0.1)', border:'1px solid var(--success-color)', borderRadius:'8px', padding:'20px'}}>
                      <div style={{display:'flex', alignItems:'center', gap:'8px', color:'var(--success-color)', fontWeight:'600', marginBottom:'15px', fontSize:'15px'}}>
                          <CheckCircle size={20}/> Issue Resolved
                      </div>

                      <div className="contact-label" style={{color:'var(--success-color)'}}>Agent Resolution Note</div>
                      <div style={{fontSize:'14px', color:'var(--text-primary)', margin:'5px 0 15px 0', whiteSpace:'pre-wrap'}}>{selectedTicket.agentReply}</div>

                      {/* DISPLAY RESOLUTION IMAGE IF EXISTS */}
                      {selectedTicket.resolutionImageURL && (
                        <div style={{marginBottom:'15px'}}>
                          <div className="contact-label" style={{color:'var(--success-color)', marginBottom:'5px'}}>Proof of Resolution</div>
                          <a href={selectedTicket.resolutionImageURL} target="_blank" rel="noreferrer">
                            <img src={selectedTicket.resolutionImageURL} alt="Resolution Proof" style={{maxWidth:'100%', maxHeight:'200px', borderRadius:'8px', border:'1px solid var(--success-color)'}} />
                          </a>
                        </div>
                      )}

                      <div style={{textAlign:'right', fontSize:'12px', color:'var(--success-color)'}}>
                        Resolved on: {selectedTicket.resolvedAt?.toDate?.().toLocaleString()}
                      </div>
                  </div>
              )}

              {/* 2. REJECTED STATE (New) */}
              {selectedTicket.status === 'rejected' && (
                  <div style={{background:'rgba(239, 68, 68, 0.08)', border:'1px solid var(--danger-color)', borderRadius:'8px', padding:'20px'}}>
                      <div style={{display:'flex', alignItems:'center', gap:'8px', color:'var(--danger-color)', fontWeight:'600', marginBottom:'15px', fontSize:'15px'}}>
                          <Ban size={20}/> Ticket Rejected
                      </div>

                      <div className="contact-label" style={{color:'var(--danger-color)'}}>Rejection Reason</div>
                      <div style={{fontSize:'14px', color:'var(--text-primary)', margin:'5px 0 15px 0', whiteSpace:'pre-wrap'}}>{selectedTicket.rejectionReason}</div>

                      <div style={{textAlign:'right', fontSize:'12px', color:'var(--danger-color)'}}>
                        Rejected on: {selectedTicket.rejectedAt?.toDate?.().toLocaleString()}
                      </div>
                  </div>
              )}

              {/* 3. PENDING STATE (Input Area) */}
              {activeTab === 'Pending' && selectedTicket.status !== 'resolved' && selectedTicket.status !== 'rejected' && (
                  <div>
                      <div className="contact-label">Resolution Action</div>
                      <textarea
                        className="desc-box"
                        style={{width:'100%', marginBottom:'10px'}}
                        placeholder="Type the resolution note here to send to the user..."
                        value={replyText}
                        onChange={(e) => setReplyText(e.target.value)}
                      />

                      {/* RESOLUTION IMAGE UPLOAD */}
                      <div className="resolution-upload-container" style={{marginBottom:'20px'}}>
                          <div className="upload-btn-wrapper">
                            <button className="upload-btn">
                              <ImageIcon size={16}/> Attach Proof (Optional)
                            </button>
                            <input
                              type="file"
                              accept="image/png, image/jpeg, image/jpg"
                              onChange={handleResolutionFileChange}
                              ref={fileInputRef}
                            />
                          </div>

                          {resolutionFile && (
                            <div className="preview-container">
                              <img src={URL.createObjectURL(resolutionFile)} alt="Preview" className="preview-image" />
                              <div className="remove-preview" onClick={() => { setResolutionFile(null); fileInputRef.current.value = null; }}>
                                <Trash2 size={12}/>
                              </div>
                            </div>
                          )}
                      </div>

                      <div style={{display:'flex', justifyContent:'flex-end'}}>
                          <button className="action-btn" style={{background:'var(--success-color)', padding:'10px 20px'}} onClick={handleResolve} disabled={isUploadingResolution}>
                              {isUploadingResolution ? <Loader2 className="animate-spin" size={16}/> : <CheckCircle size={16}/>}
                              {isUploadingResolution ? ' Uploading & Resolving...' : ' Mark as Resolved & Notify User'}
                          </button>
                      </div>
                  </div>
              )}

            </div>
         </div>
      )}

      {/* === UPDATED: QR CODE MODAL === */}
      {qrModalOpen && (
        <div className="modal-overlay" onClick={() => setQrModalOpen(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{width:'400px', textAlign:'center'}}>

            <div style={{display:'flex', justifyContent:'space-between', marginBottom:'20px'}}>
              <h3>Ticket Submission Portal</h3>
              <X onClick={() => setQrModalOpen(false)} style={{cursor:'pointer'}}/>
            </div>

            <div style={{
              background: '#fff',
              padding: '20px',
              border: '2px dashed #cbd5e1',
              borderRadius: '12px',
              marginBottom: '20px',
              display: 'flex',
              justifyContent: 'center'
            }}>
              {/* Displaying the actual image from public folder */}
              <img 
                src="/qrcode.png" 
                alt="Ticket Portal QR Code" 
                style={{maxWidth: '200px', height: 'auto', borderRadius: '8px'}}
              />
            </div>

            <div style={{color: 'var(--text-muted)', fontSize: '14px', marginBottom: '25px', lineHeight: '1.5'}}>
              Scan this QR code to access the Support Ticket Portal on your mobile device.
            </div>

            {/* Download Button */}
            <a 
              href="/qrcode.png" 
              download="SM_CRM_Portal_QR.png"
              className="action-btn"
              style={{
                width: '100%', 
                justifyContent: 'center',
                padding: '12px',
                fontSize: '14px'
              }}
            >
              <Download size={16}/> Save QR Image
            </a>

          </div>
        </div>
      )}

    </div>
  );
};

export default SupportTickets;