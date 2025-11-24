import React, { useEffect, useReducer, useCallback } from 'react';
import { collection, getDocs, doc, updateDoc } from 'firebase/firestore';
import { db } from '../../../firebase';
import './Settings.css';

// --- Utility Functions ---

// Generate avatar from user's full name
const generateAvatar = (fullName) => {
  if (!fullName) return '??';
  return fullName
    .split(' ')
    .map(part => part.charAt(0))
    .join('')
    .toUpperCase()
    .slice(0, 2);
};

// Format Firestore timestamp for display
const formatDate = (timestamp) => {
  if (!timestamp || !timestamp.toDate) return 'N/A';
  const date = timestamp.toDate();
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
};

 // --- Toast Notification Component ---

const Toast = ({ message, type, onClose }) => {
  useEffect(() => {
    if (!message) return;
    const timer = setTimeout(onClose, 4000); // Auto-dismiss after 4 seconds
    return () => clearTimeout(timer);
  }, [message, onClose]);

  if (!message) return null;
  const icon = type === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle';
  const toastClass = `toast-notification toast-${type}`;

  return (
    <div className={toastClass} onClick={onClose}>
      <i className={`fas ${icon}`}></i>
      <span>{message}</span>
    </div>
  );
};

// --- User Item Component ---

const UserItem = React.memo(({ user, onRoleUpdate, generateAvatar, formatDate, isUpdating }) => (
  <div className="user-item" data-role={user.role} data-updating={isUpdating(user.id)}>
    <div className="user-avatar">
      {generateAvatar(user.fullName)}
    </div>
    <div className="user-info">
      <div className="user-name">
        {user.fullName || 'Unnamed User'}
        {isUpdating(user.id) && <i className="fas fa-spinner fa-spin update-spinner"></i>}
      </div>
      <div className="user-email">
        {user.email || 'No email provided'}
      </div>
      <div className="user-details">
        {user.branch && <span className="user-branch">{user.branch}</span>}
        {user.department && <span className="user-department">{user.department}</span>}
        {user.position && <span className="user-position">{user.position}</span>}
      </div>
      <div className="user-meta">
        Joined: {formatDate(user.createdAt)}
        {user.profileCompleted && <span className="profile-complete">✓ Profile Complete</span>}
      </div>
    </div>
    <div className="user-role">
      <span className={`role-badge role-${user.role || 'support'}`}>
        {(user.role || 'support').charAt(0).toUpperCase() + (user.role || 'support').slice(1)}
      </span>
      <select 
        className="role-select" 
        value={user.role || 'support'}
        onChange={(e) => onRoleUpdate(user.id, e.target.value)}
        disabled={isUpdating(user.id)} // Disable while updating
      >
        <option value="admin">Admin</option>
        <option value="manager">Manager</option>
        <option value="analyst">Analyst</option>
        <option value="sales">Sales/Support</option>
      </select>
    </div>
  </div>
));

// --- Roles Management Section Component ---

const RolesSection = ({ state, dispatch, updateUserRole }) => {
  const { users, loading, error, searchTerm, roleFilter, rolesToUpdate } = state;

  const isUpdating = (userId) => rolesToUpdate.has(userId);

  // Filter users based on search and role filter
  const filteredUsers = users.filter(user => {
    const searchLower = searchTerm.toLowerCase();
    const role = user.role || 'sales';
    
    const matchesSearch = 
      user.fullName?.toLowerCase().includes(searchLower) || 
      user.email?.toLowerCase().includes(searchLower) ||
      user.branch?.toLowerCase().includes(searchLower) ||
      user.department?.toLowerCase().includes(searchLower) ||
      role.includes(searchLower);

    const matchesRole = roleFilter === 'all' || role === roleFilter;
    return matchesSearch && matchesRole;
  });

  return (
    <div className="content-card roles-container">
      <div className="card-header">
        <div className="card-icon"><i className="fas fa-user-shield"></i></div>
        <h3 className="card-title">User Roles & Permissions</h3>
      </div>
      
      {/* Search and Filter Controls */}
      <div className="search-filter-container">
        <div className="search-box">
          <i className="fas fa-search"></i>
          <input 
            type="text" 
            placeholder="Search users by name, email, branch, department, or role..."
            value={searchTerm}
            onChange={(e) => dispatch({ type: 'SET_SEARCH_TERM', payload: e.target.value })}
          />
        </div>
        <div className="filter-select">
          <select 
            value={roleFilter} 
            onChange={(e) => dispatch({ type: 'SET_ROLE_FILTER', payload: e.target.value })}
          >
            <option value="all">All Roles</option>
            <option value="admin">Admin</option>
            <option value="manager">Manager</option>
            <option value="analyst">Analyst</option>
            <option value="sales">Sales/Support</option>
          </select>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="error-message">
          <i className="fas fa-exclamation-triangle"></i>
          {error}
        </div>
      )}
      
      {/* Scrollable User List */}
      <div className="user-list-container">
        <div className="user-list-header">
          <h4>Manage User Assignments</h4>
          <span className="user-count">
            {loading ? 'Loading...' : `${filteredUsers.length} users`}
          </span>
        </div>
        
        <div className="user-list-scrollable">
          {loading ? (
            <div className="loading-state">
              <i className="fas fa-spinner fa-spin"></i>
              <span>Loading users...</span>
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="no-results">
              {searchTerm || roleFilter !== 'all' 
                ? 'No users found matching your criteria.' 
                : 'No users found in the database.'
              }
            </div>
          ) : (
            filteredUsers.map(user => (
              <UserItem 
                key={user.id} 
                user={user} 
                onRoleUpdate={updateUserRole}
                generateAvatar={generateAvatar}
                formatDate={formatDate}
                isUpdating={isUpdating}
              />
            ))
          )}
        </div>
      </div>
      
      {/* Informational Note */}
      <div className="note-info">
        <i className="fas fa-info-circle"></i>
        <span>To manage role permissions (e.g., what a 'Manager' can do), please refer to the system configuration documentation. This section only updates user-to-role assignments.</span>
      </div>
    </div>
  );
};


// --- Reducer and Initial State ---

const initialState = {
  activeSection: 'roles',
  searchTerm: '',
  roleFilter: 'all',
  users: [],
  loading: true,
  error: null,
  toast: { message: '', type: '' },
  rolesToUpdate: new Set(),
};

function settingsReducer(state, action) {
  switch (action.type) {
    case 'SET_ACTIVE_SECTION':
      return { ...state, activeSection: action.payload };
    case 'SET_SEARCH_TERM':
      return { ...state, searchTerm: action.payload };
    case 'SET_ROLE_FILTER':
      return { ...state, roleFilter: action.payload };
    case 'FETCH_START':
      return { ...state, loading: true, error: null };
    case 'FETCH_SUCCESS':
      return { ...state, loading: false, users: action.payload };
    case 'FETCH_FAILURE':
      return { ...state, loading: false, error: action.payload };
    case 'UPDATE_ROLE_START':
      return { ...state, rolesToUpdate: new Set(state.rolesToUpdate).add(action.payload) };
    case 'UPDATE_ROLE_SUCCESS': {
      // Remove the ID from rolesToUpdate set
      const newRolesToUpdateSuccess = new Set(state.rolesToUpdate);
      newRolesToUpdateSuccess.delete(action.payload.userId);
      return { 
        ...state, 
        users: state.users.map(user => 
          user.id === action.payload.userId ? { ...user, role: action.payload.newRole } : user
        ),
        rolesToUpdate: newRolesToUpdateSuccess,
        toast: { message: `Role updated for ${action.payload.userName}!`, type: 'success' },
      };
    }
    case 'UPDATE_ROLE_FAILURE': {
       // Remove the ID from rolesToUpdate set
      const newRolesToUpdateFailure = new Set(state.rolesToUpdate);
      newRolesToUpdateFailure.delete(action.payload.userId);
      return { 
        ...state, 
        rolesToUpdate: newRolesToUpdateFailure,
        toast: { message: action.payload.error, type: 'error' },
      };
    }
    case 'CLEAR_TOAST':
      return { ...state, toast: { message: '', type: '' } };
    default:
      return state;
  }
}

// --- Main Settings Component ---

const Settings = () => {
  const [state, dispatch] = useReducer(settingsReducer, initialState);
  const { activeSection, users, toast } = state;

  // Fetch users from Firestore
  useEffect(() => {
    const fetchUsers = async () => {
      dispatch({ type: 'FETCH_START' });
      try {
        const usersCollection = collection(db, 'users');
        const usersSnapshot = await getDocs(usersCollection);
        const usersList = usersSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        dispatch({ type: 'FETCH_SUCCESS', payload: usersList });
      } catch (err) {
        console.error('Error fetching users:', err);
        dispatch({ type: 'FETCH_FAILURE', payload: 'Failed to load users. Please refresh.' });
      }
    };

    fetchUsers();
  }, []);

  // Update user role in Firestore
  const updateUserRole = useCallback(async (userId, newRole) => {
    const userToUpdate = users.find(u => u.id === userId);
    if (!userToUpdate) return;
    
    dispatch({ type: 'UPDATE_ROLE_START', payload: userId });

    try {
      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, {
        role: newRole,
        updatedAt: new Date()
      });
      
      dispatch({ 
        type: 'UPDATE_ROLE_SUCCESS', 
        payload: { userId, newRole, userName: userToUpdate.fullName || userToUpdate.email } 
      });
      
    } catch (err) {
      console.error('Error updating user role:', err);
      dispatch({ 
        type: 'UPDATE_ROLE_FAILURE', 
        payload: { userId, error: `Failed to update ${userToUpdate.fullName || 'user'}'s role.` } 
      });
    }
  }, [users]); 

  // --- Section Definitions (Simplified for Admin Focus) ---
  const sections = {
    roles: {
      icon: 'fa-user-shield',
      title: 'User Roles & Permissions',
      component: <RolesSection state={state} dispatch={dispatch} updateUserRole={updateUserRole} />
    },
    integration: {
        icon: 'fa-plug',
        title: 'System Integration',
        component: (
            <div className="content-card">
              <div className="card-header"><div className="card-icon"><i className="fas fa-plug"></i></div><h3 className="card-title">System Integration</h3></div>
              <div className="form-group"><label className="form-label">POS API Key</label><input type="text" placeholder="Enter POS API key" /></div>
              <div className="form-group"><label className="form-label">HRMIS API Key</label><input type="text" placeholder="Enter HRMIS API key" /></div>
              <div className="form-group"><label className="form-label">Inventory URL</label><input type="text" placeholder="https://inventory.example.com" /></div>
              <button className="btn btn-block">Save Integration</button>
            </div>
        )
    },
    security: {
        icon: 'fa-shield-alt',
        title: 'Security Settings',
        component: (
            <div className="content-card">
              <div className="card-header"><div className="card-icon"><i className="fas fa-shield-alt"></i></div><h3 className="card-title">Security Settings</h3></div>
              <div className="form-group"><label className="form-label">Minimum Password Length</label><input type="number" placeholder="8" /></div>
              <div className="form-group"><label className="form-label">Session Timeout (minutes)</label><input type="number" placeholder="30" /></div>
              <div className="form-group">
                <label className="form-label">Two-Factor Authentication (System Wide)</label>
                <select><option>Mandatory</option><option>Optional</option><option>Disabled</option></select>
              </div>
              <button className="btn btn-block btn-warning">Update Security</button>
            </div>
        )
    },
    system: {
      icon: 'fa-tools',
      title: 'System Configuration',
      component: (
        <div className="content-card">
          <div className="card-header"><div className="card-icon"><i className="fas fa-tools"></i></div><h3 className="card-title">System Configuration</h3></div>
          <div className="form-group">
            <label className="form-label">Data Retention Period</label>
            <select><option>30 days</option><option>90 days</option><option>1 year</option><option>Indefinite</option></select>
          </div>
          <div className="form-group">
            <label className="form-label">Backup Frequency</label>
            <select><option>Daily</option><option>Weekly</option><option>Monthly</option></select>
          </div>
          <button className="btn btn-block btn-success">Save Configuration</button>
        </div>
      )
    },
  };

  const sectionTitles = Object.keys(sections).map(key => ({
    id: key,
    label: sections[key].title
  }));


  return (
    <div className="settings-wrapper">
      <Toast 
        message={toast.message} 
        type={toast.type} 
        onClose={() => dispatch({ type: 'CLEAR_TOAST' })}
      />
      <div className="content-main">
        {/* Left panel: Navigation */}
        <div className="left-panel">
          <h3>Admin Settings</h3>
          <ul>
            {sectionTitles.map((section) => (
              <li 
                key={section.id}
                className={activeSection === section.id ? 'active' : ''} 
                onClick={() => dispatch({ type: 'SET_ACTIVE_SECTION', payload: section.id })}
              >
                 <i className={`fas ${sections[section.id].icon}`}></i>
                {section.label}
              </li>
            ))}
          </ul>
        </div>

        {/* Right panel: Section details */}
        <div className="right-panel">
          <h2 className="section-title">Settings</h2>
          {sections[activeSection]?.component || sections.roles.component}
        </div>
      </div>
    </div>
  );
};

export default Settings;