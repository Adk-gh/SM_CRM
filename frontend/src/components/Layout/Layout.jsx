// src/components/Layout/Layout.jsx
import React, { useState, useEffect } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { signOut } from 'firebase/auth';
import { auth, db } from '../../../firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import Sidebar from '../Sidebar/Sidebar';
import './Layout.css';

const Layout = ({ navigation, userRole}) => {
  const [theme, setTheme] = useState(localStorage.getItem('sm-theme') || 'light');
  const [user, setUser] = useState(null);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showUserDrawer, setShowUserDrawer] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [editForm, setEditForm] = useState({});
  const [loading, setLoading] = useState(true);
  
  const navigate = useNavigate();
  const location = useLocation();

  // Fetch user data from Firestore
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        if (auth.currentUser) {
          const userDoc = await getDoc(doc(db, 'users', auth.currentUser.uid));
          if (userDoc.exists()) {
            const userData = userDoc.data();
            setUser({
              id: auth.currentUser.uid,
              name: userData.fullName || userData.name || 'User',
              position: userData.position || 'Not specified',
              department: userData.department || 'Not specified',
              branch: userData.branch || 'Not specified',
              email: userData.email || auth.currentUser.email,
              phone: userData.phone || 'Not specified',
              hireDate: userData.hireDate || 'Not specified',
              role: userData.role || userRole || 'support',
              avatar: userData.avatar || (userData.fullName?.split(' ').map(n => n[0]).join('').toUpperCase() || '??'),
              lastLogin: userData.lastLogin || 'Today',
              reportsGenerated: userData.reportsGenerated || '0',
              campaignsManaged: userData.campaignsManaged || '0',
              profileCompleted: userData.profileCompleted || false,
              createdAt: userData.createdAt,
              updatedAt: userData.updatedAt
            });
          }
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [userRole]);

  useEffect(() => {
    document.body.setAttribute('data-theme', theme);
    localStorage.setItem('sm-theme', theme);
  }, [theme]);

  // Logout function
  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate('/login');
    } catch (error) {
      console.error('Error signing out:', error);
      alert('Error signing out. Please try again.');
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
        phone: user.phone
      });
      setShowEditForm(true);
    }
  };

  const handleSaveProfile = async () => {
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

        // Update local state
        setUser(prev => ({
          ...prev,
          ...editForm,
          updatedAt: new Date()
        }));
        
        setShowEditForm(false);
        alert('Profile updated successfully!');
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      alert('Error updating profile. Please try again.');
    }
  };

  // Get current page title based on route
  const getPageTitle = () => {
    const path = location.pathname;
    if (path === '/dashboard') return 'Overview';
    if (path === '/customer-profile') return 'Customer Profile';
    if (path === '/settings') return 'Settings';
    if (path === '/segmentation') return 'Segmentation';
    if (path === '/support') return 'Support Tickets';
    if (path === '/reports') return 'Reports';
    return 'Dashboard';
  };

  // Use provided navigation or fallback to default navigation
  const sidebarNavigation = navigation || [
    {
      name: 'Dashboard',
      href: '/dashboard',
      icon: 'fas fa-chart-line',
      role: ['admin', 'marketing', 'analyst', 'support']
    },
    {
      name: 'Customer Profile',
      href: '/customer-profile',
      icon: 'fas fa-users',
      role: ['admin', 'marketing', 'analyst', 'support']
    },
    {
      name: 'Support',
      href: '/support',
      icon: 'fas fa-life-ring',
      role: ['admin', 'support']
    },
    {
      name: 'Settings',
      href: '/settings',
      icon: 'fas fa-cog',
      role: ['admin']
    }
  ];

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="loading-spinner">
          <i className="fas fa-spinner fa-spin"></i>
          <span>Loading user data...</span>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="loading-screen">
        <div className="error-message">
          <i className="fas fa-exclamation-triangle"></i>
          <span>Unable to load user data</span>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-container" data-theme={theme}>
      {/* Theme Toggle */}
      <div className="theme-toggle">
        <button className="theme-btn" onClick={toggleTheme}>
          <i className={theme === 'light' ? 'fas fa-moon' : 'fas fa-sun'}></i>
        </button>
      </div>

      {/* User Drawer */}
      <div className={`user-drawer ${showUserDrawer ? 'active' : ''}`}>
        <div className="drawer-header">
          <h2>Personal Information</h2>
          <button className="close-drawer" onClick={() => setShowUserDrawer(false)}>
            <i className="fas fa-times"></i>
          </button>
        </div>
        
        <div className="user-details">
          <h3>Profile Details</h3>
          <button className="edit-toggle" onClick={handleEditProfile}>
            <i className="fas fa-edit"></i> Edit Profile
          </button>
          
          <div className="detail-item">
            <span className="detail-label">Full Name:</span>
            <span className="detail-value">{user.name}</span>
          </div>
          <div className="detail-item">
            <span className="detail-label">Employee ID:</span>
            <span className="detail-value">{user.id}</span>
          </div>
          <div className="detail-item">
            <span className="detail-label">Position:</span>
            <span className="detail-value">{user.position}</span>
          </div>
          <div className="detail-item">
            <span className="detail-label">Department:</span>
            <span className="detail-value">{user.department}</span>
          </div>
          <div className="detail-item">
            <span className="detail-label">Branch:</span>
            <span className="detail-value">{user.branch}</span>
          </div>
          <div className="detail-item">
            <span className="detail-label">Email:</span>
            <span className="detail-value">{user.email}</span>
          </div>
          <div className="detail-item">
            <span className="detail-label">Phone:</span>
            <span className="detail-value">{user.phone}</span>
          </div>
          <div className="detail-item">
            <span className="detail-label">Hire Date:</span>
            <span className="detail-value">{user.hireDate}</span>
          </div>
          <div className="detail-item">
            <span className="detail-label">Role:</span>
            <span className="detail-value role-badge">{user.role}</span>
          </div>
          <div className="detail-item">
            <span className="detail-label">Profile Status:</span>
            <span className="detail-value">
              {user.profileCompleted ? (
                <span className="status-complete">✓ Complete</span>
              ) : (
                <span className="status-incomplete">✗ Incomplete</span>
              )}
            </span>
          </div>
        </div>
        
        {/* Edit Profile Form */}
        {showEditForm && (
          <div className="edit-profile-form active">
            <h3>Edit Profile</h3>
            <div className="form-group">
              <label htmlFor="editName">Full Name</label>
              <input 
                type="text" 
                id="editName" 
                value={editForm.name}
                onChange={(e) => setEditForm(prev => ({ ...prev, name: e.target.value }))}
              />
            </div>
            <div className="form-group">
              <label htmlFor="editPosition">Position</label>
              <input 
                type="text" 
                id="editPosition" 
                value={editForm.position}
                onChange={(e) => setEditForm(prev => ({ ...prev, position: e.target.value }))}
              />
            </div>
            <div className="form-group">
              <label htmlFor="editDepartment">Department</label>
              <input 
                type="text" 
                id="editDepartment" 
                value={editForm.department}
                onChange={(e) => setEditForm(prev => ({ ...prev, department: e.target.value }))}
              />
            </div>
            <div className="form-group">
              <label htmlFor="editBranch">Branch</label>
              <input 
                type="text" 
                id="editBranch" 
                value={editForm.branch}
                onChange={(e) => setEditForm(prev => ({ ...prev, branch: e.target.value }))}
                placeholder="e.g., SM Megamall"
              />
            </div>
            <div className="form-group">
              <label htmlFor="editEmail">Email</label>
              <input 
                type="email" 
                id="editEmail" 
                value={editForm.email}
                onChange={(e) => setEditForm(prev => ({ ...prev, email: e.target.value }))}
              />
            </div>
            <div className="form-group">
              <label htmlFor="editPhone">Phone</label>
              <input 
                type="tel" 
                id="editPhone" 
                value={editForm.phone}
                onChange={(e) => setEditForm(prev => ({ ...prev, phone: e.target.value }))}
                placeholder="+63 XXX XXX XXXX"
              />
            </div>
            <div className="form-actions">
              <button className="btn btn-primary" onClick={handleSaveProfile}>
                <i className="fas fa-save"></i> Save Changes
              </button>
              <button className="btn btn-secondary" onClick={() => setShowEditForm(false)}>
                <i className="fas fa-times"></i> Cancel
              </button>
            </div>
          </div>
        )}
        
      
       
      </div>

      <div className="dashboard">
        <Sidebar 
          navigation={sidebarNavigation} 
          userRole={user?.role}
        />

        <div className="content">
          <div className="dashboard-header">
            <h2>{getPageTitle()}</h2>
            <div className="user-profile">
              <div 
                className="profile-trigger" 
                onClick={() => setShowProfileMenu(!showProfileMenu)}
              >
                <div className="user-avatar">{user.avatar}</div>
                <div className="user-info">
                  <h4>{user.name}</h4>
                  <p>{user.position} • {user.branch}</p>
                  <span className="user-role-badge">{user.role}</span>
                </div>
                <i className="fas fa-chevron-down"></i>
              </div>
              {showProfileMenu && (
                <div className="profile-menu active">
                  <button 
                    className="profile-menu-item"
                    onClick={() => {
                      setShowUserDrawer(true);
                      setShowProfileMenu(false);
                    }}
                  >
                    <i className="fas fa-user"></i>
                    <span>View Profile</span>
                  </button>
                  <button 
                    className="profile-menu-item"
                    onClick={() => {
                      handleLogout();
                      setShowProfileMenu(false);
                    }}
                  >
                    <i className="fas fa-sign-out-alt"></i>
                    <span>Logout</span>
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* This is where page content will be injected */}
          <Outlet />
        </div>
      </div>
    </div>
  );
};

export default Layout;