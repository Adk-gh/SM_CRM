import React, { useState, useEffect, useRef } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { 
  signOut, 
  updateEmail, 
  updatePassword, 
  onAuthStateChanged // <--- IMPORTED THIS
} from 'firebase/auth'; 
import { auth, db } from '../../../firebase'; 
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import Sidebar from '../Sidebar/Sidebar'; 
import { 
  Moon, Sun, User, LogOut, X, Edit, Save, 
  ChevronDown, AlertTriangle, Loader2, 
  LayoutDashboard, Users, LifeBuoy, Settings,
  Lock, Mail, Briefcase, Phone
} from 'lucide-react';

// --- CSS STYLES ---
const styles = `
/* Variables */
:root {
  --bg-primary: #E9ECEE;
  --bg-secondary: #F4F4F4;
  --text-primary: #395A7F;
  --text-secondary: #6E9FC1;
  --text-light: #ACACAC;
  --accent-primary: #395A7F;
  --accent-secondary: #6E9FC1;
  --accent-light: #A3CAE9;
  --border-light: #D1D5DB;
  --card-bg: #FFFFFF;
  --card-shadow: 0 4px 15px rgba(0, 0, 0, 0.08);
  --card-hover: 0 10px 25px rgba(0, 0, 0, 0.12);
  --success: #48BB78;
  --warning: #F59E0B;
  --danger: #EF4444;
}

[data-theme="dark"] {
  --bg-primary: #1E2A38;
  --bg-secondary: #2C3E50;
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
}

body {
  background: var(--bg-primary);
  color: var(--text-primary);
  transition: background-color 0.3s ease, color 0.3s ease;
  margin: 0;
  font-family: 'Segoe UI', sans-serif;
  overflow: hidden; 
  height: 100vh;
}

/* Main Layout Structure */
.dashboard-container {
  height: 100vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.dashboard {
  display: flex;
  height: 100%;
  overflow: hidden;
}

.content {
  flex: 1;
  margin-left: 280px; 
  padding: 40px 30px;
  background: var(--bg-primary);
  display: flex;
  flex-direction: column;
  height: 100vh;
  overflow-y: auto;
  transition: margin-left 0.3s ease;
  overflow-x: hidden;
}

/* Header */
.dashboard-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30px;
  padding-bottom: 20px;
  border-bottom: 1px solid var(--border-light);
}

.dashboard-header h2 {
  font-size: 32px;
  font-weight: 700;
  color: var(--text-primary);
  margin: 0;
}

/* Theme Toggle */
.theme-btn {
  background: var(--bg-secondary);
  color: var(--text-primary);
  border: 1px solid var(--border-light);
  border-radius: 50%;
  width: 40px;
  height: 40px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  transition: all 0.3s ease;
}

.theme-btn:hover {
  background: var(--accent-primary);
  color: white;
  transform: rotate(15deg);
}

/* User Profile Dropdown */
.user-profile {
  position: relative;
}

.profile-trigger {
  display: flex;
  align-items: center;
  gap: 15px;
  background: var(--card-bg);
  padding: 10px 20px;
  border-radius: 12px;
  box-shadow: var(--card-shadow);
  border: 1px solid var(--border-light);
  cursor: pointer;
  transition: all 0.3s ease;
}

.profile-trigger:hover {
  box-shadow: var(--card-hover);
  transform: translateY(-2px);
}

.user-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: linear-gradient(135deg, var(--accent-primary), var(--accent-secondary));
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-weight: 700;
  font-size: 16px;
}

.user-info h4 {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0 0 2px 0;
}

.user-info p {
  font-size: 12px;
  color: var(--text-secondary);
  margin: 0;
}

.profile-menu {
  position: absolute;
  top: 120%;
  right: 0;
  background: var(--card-bg);
  border-radius: 12px;
  box-shadow: 0 10px 30px rgba(0,0,0,0.15);
  border: 1px solid var(--border-light);
  min-width: 220px;
  padding: 10px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  z-index: 100;
  animation: fadeIn 0.2s ease-out;
}

.profile-menu-item {
  display: flex;
  align-items: center;
  padding: 12px 15px;
  text-decoration: none;
  color: var(--text-primary);
  transition: all 0.2s ease;
  border: 1px solid var(--border-light);
  border-radius: 8px;
  background: var(--bg-secondary);
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  gap: 10px;
}

.profile-menu-item:hover {
  background: var(--accent-primary);
  color: white;
  border-color: var(--accent-primary);
}

/* USER DRAWER - DARK SIDEBAR THEME */
.user-drawer {
  position: fixed;
  top: 0;
  right: -550px;
  width: 500px;
  height: 100vh;
  background: #395A7F; 
  color: white;
  box-shadow: -5px 0 25px rgba(0, 0, 0, 0.3);
  z-index: 1500;
  transition: right 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  overflow-y: auto;
  display: flex;
  flex-direction: column;
}

.user-drawer.active {
  right: 0;
}

.drawer-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 25px;
  background: transparent;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  color: white;
}

.drawer-header h2 {
  margin: 0;
  font-size: 20px;
  color: white;
}

.close-drawer {
  background: rgba(255,255,255,0.1);
  border: none;
  color: white;
  width: 32px;
  height: 32px;
  border-radius: 8px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: 0.2s;
}
.close-drawer:hover { background: rgba(255,255,255,0.25); }

.user-details {
  padding: 25px;
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.details-card {
  background: transparent;
  border: none;
  box-shadow: none;
  padding: 0;
}

.details-header-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.details-header-row h3 {
  margin: 0;
  font-size: 16px;
  color: white; 
}

.edit-icon-btn {
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  color: white;
  width: 35px;
  height: 35px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: 0.2s;
}

.edit-icon-btn:hover {
  background: white;
  color: #395A7F;
}

/* View Mode Detail Items - Dark Glass Style */
.detail-item {
  display: grid;
  grid-template-columns: 135px minmax(0, 1fr); 
  gap: 10px;
  align-items: center; 
  margin-bottom: 12px; 
  background-color: rgba(0, 0, 0, 0.2); 
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  padding: 12px 15px;
  width: 100%;
  box-sizing: border-box; 
}

.detail-label {
  font-size: 13px;
  font-weight: 700;
  color: #A3CAE9; 
  text-transform: uppercase;
}

.detail-value {
  font-size: 14px;
  font-weight: 500;
  color: white; 
  text-align: left;
  background-color: transparent; 
  border: none;
  padding: 0;
  width: 100%; 
  white-space: nowrap; 
  overflow-x: auto; 
  scrollbar-width: none; 
}

.detail-value::-webkit-scrollbar { display: none; }

/* Edit Form */
.edit-profile-form {
  background: transparent;
  padding: 0;
  border: none;
  margin: 20px 0;
  animation: fadeIn 0.3s;
}

.form-section-title {
    font-size: 12px;
    text-transform: uppercase;
    color: #A3CAE9; 
    font-weight: 700;
    margin-bottom: 10px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.2);
    padding-bottom: 5px;
}

.form-group { margin-bottom: 15px; }
.form-group label { 
    display: block; 
    margin-bottom: 6px; 
    font-size: 13px; 
    font-weight: 600; 
    color: #E9ECEE; 
}
.form-group input {
  width: 100%; padding: 10px; border-radius: 8px;
  border: 1px solid transparent;
  background: #FFFFFF; 
  color: #395A7F;
  outline: none;
}
.form-group input:focus { 
    border-color: #A3CAE9; 
    box-shadow: 0 0 0 3px rgba(163, 202, 233, 0.3);
}

.password-group {
    border: 1px solid rgba(255, 255, 255, 0.1);
    padding: 15px;
    border-radius: 8px;
    background: rgba(0, 0, 0, 0.2);
    margin-bottom: 15px;
}

.form-actions { display: flex; gap: 10px; margin-top: 20px; }

.btn { 
    flex: 1; padding: 10px; border-radius: 8px; border: none; cursor: pointer; font-weight: 600; display: flex; align-items: center; justify-content: center; gap: 8px; 
}
.btn-primary { 
    background: #48BB78; 
    color: white; 
}
.btn-primary:hover {
    background: #38A169;
}

.btn-secondary { 
    background: transparent; 
    color: white; 
    border: 1px solid rgba(255, 255, 255, 0.3); 
}
.btn-secondary:hover {
    background: rgba(255, 255, 255, 0.1);
    border-color: white;
}

.status-message {
    padding: 10px;
    border-radius: 8px;
    font-size: 13px;
    margin-bottom: 15px;
    display: flex;
    align-items: center;
    gap: 8px;
}
.status-error { background: rgba(239, 68, 68, 0.2); color: #FECACA; border: 1px solid #EF4444; }
.status-success { background: rgba(72, 187, 120, 0.2); color: #C6F6D5; border: 1px solid #48BB78; }

/* LOADING SCREEN */
.loading-screen {
  position: fixed;
  top: 0; left: 0; width: 100%; height: 100%;
  background: var(--bg-primary);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 3000;
}

.loading-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 15px;
}

.spinner-icon {
  color: var(--accent-primary);
  animation: spin 1s linear infinite;
}

.loading-text {
  color: var(--text-primary);
  font-size: 16px;
  font-weight: 500;
  letter-spacing: 0.5px;
}

@keyframes spin { 100% { transform: rotate(360deg); } }
@keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }

/* Logout Modal */
.modal-backdrop {
  position: fixed; top: 0; left: 0; width: 100%; height: 100%;
  background: rgba(0,0,0,0.6); z-index: 2500;
  display: flex; justify-content: center; align-items: center;
  backdrop-filter: blur(4px);
}
.logout-modal {
  background: var(--card-bg); padding: 30px; border-radius: 16px;
  width: 90%; max-width: 400px; text-align: center;
  box-shadow: 0 20px 50px rgba(0,0,0,0.2);
  border: 1px solid var(--border-light);
  animation: fadeIn 0.3s ease-out;
}
.logout-modal h3 { margin-top: 0; color: var(--text-primary); }
.logout-modal p { color: var(--text-secondary); margin-bottom: 25px; }

/* Responsive */
@media (max-width: 768px) {
  .content { 
    margin-left: 0; 
    padding: 20px; 
  }
  .dashboard-header { flex-direction: column-reverse; align-items: flex-start; gap: 15px; }
  .user-profile { align-self: flex-end; }
  .user-drawer { width: 100%; right: -100%; }
}
`;

const Layout = ({ navigation, userRole, notificationCount }) => {
  const [theme, setTheme] = useState(localStorage.getItem('sm-theme') || 'light');
  const [user, setUser] = useState(null);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showUserDrawer, setShowUserDrawer] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  
  // Expanded Edit Form State
  const [editForm, setEditForm] = useState({
    name: '',
    position: '',
    department: '',
    branch: '',
    email: '',
    phone: '',
    newPassword: '',
    confirmPassword: ''
  });

  const [formStatus, setFormStatus] = useState({ type: '', message: '' });
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [showLogoutConfirmation, setShowLogoutConfirmation] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();
  const profileMenuRef = useRef(null);
  const userDrawerRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target)) {
        setShowProfileMenu(false);
      }
    };
    if (showProfileMenu) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showProfileMenu]);

  useEffect(() => {
    const handleClickOutsideDrawer = (event) => {
      const isClickOnProfileTrigger = profileMenuRef.current && profileMenuRef.current.contains(event.target);
      if (showUserDrawer && userDrawerRef.current && !userDrawerRef.current.contains(event.target) && !isClickOnProfileTrigger) {
        setShowUserDrawer(false);
        setShowEditForm(false);
        setFormStatus({ type: '', message: '' });
      }
    };
    if (showUserDrawer) document.addEventListener('mousedown', handleClickOutsideDrawer);
    return () => document.removeEventListener('mousedown', handleClickOutsideDrawer);
  }, [showUserDrawer]);

  // --- FIXED DATA FETCHING LOGIC ---
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setLoading(true);
      if (currentUser) {
        try {
          const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
          if (userDoc.exists()) {
            const userData = userDoc.data();
            setUser({
              id: currentUser.uid,
              name: userData.fullName || userData.name || 'User',
              position: userData.position || 'Not specified',
              department: userData.department || 'Not specified',
              branch: userData.branch || 'Not specified',
              email: currentUser.email || userData.email, 
              phone: userData.phone || 'Not specified',
              hireDate: userData.hireDate || 'Not specified',
              role: userData.role || userRole || 'support',
              avatar: (userData.fullName || 'U').split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2),
              profileCompleted: userData.profileCompleted || false,
            });
          }
        } catch (error) {
          console.error('Error fetching user data:', error);
        }
      } else {
        // Redirect to login if not authenticated
        navigate('/login');
      }
      setLoading(false);
    });

    // Cleanup subscription
    return () => unsubscribe();
  }, [userRole, navigate]);

  useEffect(() => {
    document.body.setAttribute('data-theme', theme);
    localStorage.setItem('sm-theme', theme);
  }, [theme]);

  const confirmLogout = async () => {
    try {
      if (auth.currentUser) {
        const userRef = doc(db, 'users', auth.currentUser.uid);
        await updateDoc(userRef, { is2FAPending: true });
      }
      await signOut(auth);
      navigate('/login');
    } catch (error) {
      console.error('Error signing out:', error);
      await signOut(auth);
      navigate('/login');
    } finally {
      setShowLogoutConfirmation(false);
    }
  };

  const toggleTheme = () => {
    setTheme(theme === 'light' ? 'dark' : 'light');
  };

  const handleEditProfile = () => {
    if (user) {
      setEditForm({
        name: user.name,
        position: user.position,
        department: user.department,
        branch: user.branch,
        email: user.email,
        phone: user.phone,
        newPassword: '',
        confirmPassword: ''
      });
      setFormStatus({ type: '', message: '' });
      setShowEditForm(true);
    }
  };

  const handleSaveProfile = async () => {
    setFormStatus({ type: '', message: '' });
    setIsSaving(true);
    
    if (editForm.newPassword && editForm.newPassword !== editForm.confirmPassword) {
      setFormStatus({ type: 'error', message: 'Passwords do not match.' });
      setIsSaving(false);
      return;
    }

    if (editForm.newPassword && editForm.newPassword.length < 6) {
        setFormStatus({ type: 'error', message: 'Password must be at least 6 characters.' });
        setIsSaving(false);
        return;
    }

    try {
      if (auth.currentUser) {
        const userRef = doc(db, 'users', auth.currentUser.uid);
        await updateDoc(userRef, {
          fullName: editForm.name,
          position: editForm.position,
          department: editForm.department,
          branch: editForm.branch,
          email: editForm.email,
          phone: editForm.phone,
          updatedAt: new Date()
        });

        if (editForm.email !== user.email) {
            await updateEmail(auth.currentUser, editForm.email);
        }

        if (editForm.newPassword) {
            await updatePassword(auth.currentUser, editForm.newPassword);
        }

        setUser(prev => ({ 
            ...prev, 
            name: editForm.name,
            position: editForm.position,
            department: editForm.department,
            branch: editForm.branch,
            email: editForm.email,
            phone: editForm.phone
        }));

        setFormStatus({ type: 'success', message: 'Profile updated successfully!' });
        
        setTimeout(() => {
            setShowEditForm(false);
            setFormStatus({ type: '', message: '' });
        }, 1500);
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      let errorMsg = 'Failed to update profile.';
      
      if (error.code === 'auth/requires-recent-login') {
          errorMsg = 'For security, please logout and login again to change sensitive info.';
      } else if (error.code === 'auth/email-already-in-use') {
          errorMsg = 'This email is already in use by another account.';
      }

      setFormStatus({ type: 'error', message: errorMsg });
    } finally {
        setIsSaving(false);
    }
  };

  const getPageTitle = () => {
    const path = location.pathname;
    if (path.includes('dashboard')) return 'Overview';
    if (path.includes('customer')) return 'Customer Profile';
    if (path.includes('settings')) return 'Team';
    if (path.includes('support')) return 'Support Tickets';
    return 'Dashboard';
  };

  const sidebarNavigation = navigation || [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard, role: ['admin', 'user'] },
    { name: 'Customer Profile', href: '/customer-profile', icon: Users, role: ['admin'] },
    { name: 'Support', href: '/support', icon: LifeBuoy, role: ['admin'] },
    { name: 'Team', href: '/settings', icon: Settings, role: ['admin'] }
  ];

  if (loading) {
    return (
      <>
        <style>{styles}</style>
        <div className="loading-screen">
          <div className="loading-content">
            <Loader2 className="spinner-icon" size={48} />
            <span className="loading-text">Loading user data...</span>
          </div>
        </div>
      </>
    );
  }

  return (
    <div className="dashboard-container">
      <style>{styles}</style>

      {/* LOGOUT MODAL */}
      {showLogoutConfirmation && (
        <div className="modal-backdrop">
          <div className="logout-modal">
            <div style={{marginBottom:'15px', color:'var(--warning)'}}>
                <AlertTriangle size={40} />
            </div>
            <h3>Confirm Logout</h3>
            <p>Are you sure you want to end your session?</p>
            <div className="form-actions">
              <button className="btn btn-logout" onClick={confirmLogout} style={{background:'#EF4444', color:'white'}}>
                <LogOut size={16} /> Yes, Logout
              </button>
              <button className="btn btn-secondary" onClick={() => setShowLogoutConfirmation(false)} style={{color:'var(--text-primary)', border:'1px solid var(--border-light)'}}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="dashboard">
        {/* Pass navigation to sidebar */}
        <Sidebar 
            navigation={sidebarNavigation} 
            userRole={user?.role} 
            notificationCount={notificationCount} 
        />

        {/* MAIN CONTENT */}
        <div className="content">
          <div className="dashboard-header">
            <h2>{getPageTitle()}</h2>
            
            <div style={{display:'flex', gap:'15px', alignItems:'center'}}>
                <button className="theme-btn" onClick={toggleTheme}>
                    {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
                </button>

                <div className="user-profile" ref={profileMenuRef}>
                    <div className="profile-trigger" onClick={() => setShowProfileMenu(!showProfileMenu)}>
                        <div className="user-avatar">{user?.avatar}</div>
                        <div className="user-info">
                            <h4>{user?.name}</h4>
                            <p>{user?.role}</p>
                        </div>
                        <ChevronDown size={16} color="var(--text-secondary)" />
                    </div>
                    
                    {showProfileMenu && (
                        <div className="profile-menu active">
                            <button className="profile-menu-item" onClick={() => { setShowUserDrawer(true); setShowProfileMenu(false); }}>
                                <User size={16} /> View Profile
                            </button>
                            <button className="profile-menu-item" onClick={() => { setShowLogoutConfirmation(true); setShowProfileMenu(false); }}>
                                <LogOut size={16} /> Logout
                            </button>
                        </div>
                    )}
                </div>
            </div>
          </div>
          
          <Outlet />
        </div>
      </div>

      {/* USER DRAWER */}
      <div className={`user-drawer ${showUserDrawer ? 'active' : ''}`} ref={userDrawerRef}>
        <div className="drawer-header">
          <h2>My Profile</h2>
          <button className="close-drawer" onClick={() => setShowUserDrawer(false)}>
            <X size={20} />
          </button>
        </div>

        <div className="user-details">
          {!showEditForm ? (
              <div className="details-card">
                {/* HEADER: Title Left, Edit Button Right */}
                <div className="details-header-row">
                    <h3>Personal Info</h3>
                    <button className="edit-icon-btn" onClick={handleEditProfile} title="Edit Profile">
                        <Edit size={18} />
                    </button>
                </div>
                
                {[
                  { l: 'Full Name', v: user?.name },
                  { l: 'Position', v: user?.position },
                  { l: 'Department', v: user?.department },
                  { l: 'Branch', v: user?.branch },
                  { l: 'Email', v: user?.email },
                  { l: 'Phone', v: user?.phone },
                ].map((item, i) => (
                  <div className="detail-item" key={i}>
                    <span className="detail-label">{item.l}</span>
                    <span className="detail-value">{item.v}</span>
                  </div>
                ))}
              </div>
          ) : (
             /* EDIT FORM */
            <div className="edit-profile-form">
                <h3>Edit Information</h3>
                
                {formStatus.message && (
                    <div className={`status-message ${formStatus.type === 'error' ? 'status-error' : 'status-success'}`}>
                        {formStatus.type === 'error' ? <AlertTriangle size={16} /> : <Save size={16}/>}
                        {formStatus.message}
                    </div>
                )}

                <div className="form-section-title">General</div>
                <div className="form-group">
                    <label>Full Name</label>
                    <input type="text" value={editForm.name} onChange={e => setEditForm({...editForm, name:e.target.value})} />
                </div>
                
                <div className="form-group">
                    <label>Email Address</label>
                    <div style={{position:'relative'}}>
                        <input type="email" value={editForm.email} onChange={e => setEditForm({...editForm, email:e.target.value})} style={{paddingLeft:'35px'}} />
                        <Mail size={16} style={{position:'absolute', left:'10px', top:'12px', color:'var(--text-light)'}} />
                    </div>
                </div>

                <div className="form-group">
                    <label>Phone Number</label>
                    <div style={{position:'relative'}}>
                        <input type="text" value={editForm.phone} onChange={e => setEditForm({...editForm, phone:e.target.value})} style={{paddingLeft:'35px'}} />
                        <Phone size={16} style={{position:'absolute', left:'10px', top:'12px', color:'var(--text-light)'}} />
                    </div>
                </div>

                <div className="form-section-title" style={{marginTop:'20px'}}>Job Details</div>
                <div className="form-group">
                    <label>Position</label>
                    <div style={{position:'relative'}}>
                        <input type="text" value={editForm.position} onChange={e => setEditForm({...editForm, position:e.target.value})} style={{paddingLeft:'35px'}} />
                        <Briefcase size={16} style={{position:'absolute', left:'10px', top:'12px', color:'var(--text-light)'}} />
                    </div>
                </div>

                <div className="form-group">
                    <label>Department</label>
                    <input type="text" value={editForm.department} onChange={e => setEditForm({...editForm, department:e.target.value})} />
                </div>
                
                <div className="form-group">
                    <label>Branch</label>
                    <input type="text" value={editForm.branch} onChange={e => setEditForm({...editForm, branch:e.target.value})} />
                </div>

                <div className="form-section-title" style={{marginTop:'20px'}}>Security</div>
                <div className="password-group">
                    <div className="form-group">
                        <label>New Password (Optional)</label>
                        <div style={{position:'relative'}}>
                            <input 
                                type="password" 
                                placeholder="Leave empty to keep current"
                                value={editForm.newPassword} 
                                onChange={e => setEditForm({...editForm, newPassword:e.target.value})} 
                                style={{paddingLeft:'35px'}}
                            />
                            <Lock size={16} style={{position:'absolute', left:'10px', top:'12px', color:'var(--text-light)'}} />
                        </div>
                    </div>
                    {editForm.newPassword && (
                        <div className="form-group">
                            <label>Confirm Password</label>
                            <input 
                                type="password" 
                                placeholder="Confirm new password"
                                value={editForm.confirmPassword} 
                                onChange={e => setEditForm({...editForm, confirmPassword:e.target.value})} 
                            />
                        </div>
                    )}
                </div>

                <div className="form-actions">
                    <button className="btn btn-primary" onClick={handleSaveProfile} disabled={isSaving}>
                        {isSaving ? <Loader2 className="spinner-icon" size={16}/> : <Save size={16}/>} 
                        {isSaving ? 'Saving...' : 'Save Changes'}
                    </button>
                    <button className="btn btn-secondary" onClick={() => setShowEditForm(false)} disabled={isSaving}>Cancel</button>
                </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Layout;