import React, { useEffect, useReducer, useCallback } from 'react';
import { collection, getDocs, doc, updateDoc } from 'firebase/firestore';
import { db } from '../../../firebase';

// --- CSS Variable Definitions (Theme Engine) ---
// Defines custom colors so Tailwind can use them via var()
const ThemeStyles = () => (
  <style>{`
    :root {
      /* Light Theme */
      --bg-primary: #E9ECEE;
      --bg-secondary: #F4F4F4;
      --text-primary: #395A7F;
      --text-secondary: #6E9FC1;
      --text-light: #ACACAC;
      --accent-primary: #395A7F;
      --accent-secondary: #6E9FC1;
      --accent-light: #A3CAE9;
      --border-light: #ACACAC;
      --card-bg: #FFFFFF;
      --card-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
      
      /* Status Colors */
      --color-admin: #F56565;
      --color-manager: #ED8936;
      --color-analyst: #48BB78;
      --color-sales: #6E9FC1;
    }

    [data-theme="dark"] {
      /* Dark Theme - MATCHED TO SCREENSHOTS */
      --bg-primary: #1E2A38;      /* Deep Navy/Grey Background */
      --bg-secondary: #2C3E50;    /* Slightly lighter for inputs/secondary areas */
      --text-primary: #E9ECEE;    /* Light text */
      --text-secondary: #A3CAE9;  /* Muted blue text */
      --text-light: #94A3B8;      /* Grey text */
      --accent-primary: #68D391;  /* Green Accent */
      --accent-secondary: #63B3ED; /* Blue Accent */
      --accent-light: #4299E1;
      --border-light: #4A5568;    /* Dark border color */
      --card-bg: #2C3E50;         /* Card background matches secondary bg */
      --card-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
      
      /* Status Colors Dark */
      --color-admin: #E53E3E;
      --color-manager: #DD6B20;
      --color-analyst: #38A169;
      --color-sales: #4FC3F7;
    }

    /* Custom Animations */
    @keyframes slideIn {
      from { right: -300px; opacity: 0; }
      to { right: 20px; opacity: 1; }
    }
    @keyframes fadeOut {
      0% { opacity: 1; }
      90% { opacity: 1; }
      100% { opacity: 0; }
    }
  `}</style>
);

// --- Utility Functions ---

const generateAvatar = (fullName) => {
  if (!fullName) return '??';
  return fullName
    .split(' ')
    .map(part => part.charAt(0))
    .join('')
    .toUpperCase()
    .slice(0, 2);
};

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
    const timer = setTimeout(onClose, 4000);
    return () => clearTimeout(timer);
  }, [message, onClose]);

  if (!message) return null;

  const icon = type === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle';
  const bgColor = type === 'success' ? 'bg-[var(--color-analyst)]' : 'bg-[var(--color-admin)]';

  return (
    <div 
      onClick={onClose}
      className={`fixed top-5 right-5 z-[10000] px-5 py-3 rounded-lg shadow-lg flex items-center gap-2.5 text-white font-semibold cursor-pointer transition-all duration-300 ${bgColor}`}
      style={{ animation: 'slideIn 0.5s ease-out, fadeOut 0.5s 3.5s forwards' }}
    >
      <i className={`fas ${icon}`}></i>
      <span>{message}</span>
    </div>
  );
};

// --- User Item Component ---

const UserItem = React.memo(({ user, onRoleUpdate, generateAvatar, formatDate, isUpdating }) => {
  const getRoleBadgeColor = (role) => {
    const r = role || 'support';
    switch(r) {
      case 'admin': return 'bg-[var(--color-admin)]';
      case 'manager': return 'bg-[var(--color-manager)]';
      case 'analyst': return 'bg-[var(--color-analyst)]';
      case 'sales': 
      case 'support': return 'bg-[var(--color-sales)]';
      default: return 'bg-[var(--color-sales)]';
    }
  };

  return (
    <div 
      className={`group flex flex-col md:flex-row items-start md:items-center p-4 rounded-lg mb-2.5 bg-[var(--card-bg)] border border-[var(--border-light)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md ${isUpdating(user.id) ? 'opacity-70 pointer-events-none' : ''}`}
    >
      {/* Avatar */}
      <div className="w-10 h-10 rounded-full bg-[var(--accent-primary)] flex items-center justify-center text-white font-semibold mr-0 md:mr-4 shrink-0 mb-3 md:mb-0">
        {generateAvatar(user.fullName)}
      </div>

      {/* Info Section */}
      <div className="flex-1 w-full md:w-auto">
        <div className="font-semibold mb-1 text-[var(--text-primary)] flex items-center">
          {user.fullName || 'Unnamed User'}
          {isUpdating(user.id) && <i className="fas fa-spinner fa-spin ml-2 text-[var(--accent-primary)] text-sm"></i>}
        </div>
        <div className="text-xs text-[var(--text-light)] mb-1">
          {user.email || 'No email provided'}
        </div>
        
        {/* Chips */}
        <div className="flex gap-1.5 flex-wrap mt-1.5">
          {[user.branch, user.department, user.position].filter(Boolean).map((item, idx) => (
            <span key={idx} className="bg-[var(--accent-light)] text-[var(--accent-primary)] px-1.5 py-0.5 rounded text-[10px] font-medium opacity-80">
              {item}
            </span>
          ))}
        </div>
        
        {/* Meta */}
        <div className="text-xs text-[var(--text-light)] mt-2">
          Joined: {formatDate(user.createdAt)}
          {user.profileCompleted && (
            <span className="bg-[var(--color-analyst)] text-white px-1.5 py-0.5 rounded text-[9px] font-semibold ml-2 align-middle">
              ✓ Profile Complete
            </span>
          )}
        </div>
      </div>

      {/* Role Action Section */}
      <div className="flex items-center justify-between w-full md:w-auto mt-4 md:mt-0 gap-2.5 shrink-0">
        <span className={`px-2.5 py-1 rounded-full text-[11px] font-semibold text-center w-20 text-white ${getRoleBadgeColor(user.role)}`}>
          {(user.role || 'support').charAt(0).toUpperCase() + (user.role || 'support').slice(1)}
        </span>
        <select 
          className="w-[120px] p-2 rounded-md border border-[var(--border-light)] bg-[var(--bg-secondary)] text-[var(--text-primary)] text-xs cursor-pointer focus:border-[var(--accent-primary)] outline-none"
          value={user.role || 'support'}
          onChange={(e) => onRoleUpdate(user.id, e.target.value)}
          disabled={isUpdating(user.id)}
        >
          <option value="admin">Admin</option>
          <option value="manager">Manager</option>
          <option value="analyst">Analyst</option>
          <option value="sales">Sales/Support</option>
        </select>
      </div>
    </div>
  );
});

// --- Roles Management Section Component ---

const RolesSection = ({ state, dispatch, updateUserRole }) => {
  const { users, loading, error, searchTerm, roleFilter, rolesToUpdate } = state;
  const isUpdating = (userId) => rolesToUpdate.has(userId);

  // Filter users
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

  const arrowSvg = "data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%236E9FC1%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.5-12.8z%22%2F%3E%3C%2Fsvg%3E";

  return (
    <div className="rounded-2xl border border-[var(--border-light)] p-6 mb-6 transition-all duration-300 relative overflow-hidden bg-[var(--card-bg)] shadow-[var(--card-shadow)]">
      
      {/* Search and Filter Controls Row */}
      <div className="flex flex-col md:flex-row gap-4 mb-5 flex-wrap">
        <div className="flex-1 min-w-[250px] relative flex items-center">
          <i className="fas fa-search absolute left-3 text-[var(--text-light)]"></i>
          <input 
            type="text" 
            className="w-full pl-10 pr-4 py-3 rounded-lg border border-[var(--border-light)] text-sm bg-[var(--bg-secondary)] text-[var(--text-primary)] transition-all focus:border-[var(--accent-primary)] outline-none"
            placeholder="Search users by name, email, branch..." 
            value={searchTerm}
            onChange={(e) => dispatch({ type: 'SET_SEARCH_TERM', payload: e.target.value })}
          />
        </div>
        
        <div className="w-full md:w-auto">
          <select 
            className="w-full md:w-[180px] h-[45px] bg-[var(--bg-secondary)] border border-[var(--border-light)] rounded-lg text-[var(--text-primary)] appearance-none outline-none text-sm pl-4 pr-10 cursor-pointer focus:border-[var(--accent-primary)] focus:ring-2 focus:ring-[rgba(57,90,127,0.1)]"
            value={roleFilter} 
            onChange={(e) => dispatch({ type: 'SET_ROLE_FILTER', payload: e.target.value })}
            style={{
              backgroundImage: `url('${arrowSvg}')`,
              backgroundRepeat: 'no-repeat',
              backgroundPosition: 'right 15px center',
              backgroundSize: '10px'
            }}
          >
            <option value="all">All Roles</option>
            <option value="admin">Admin</option>
            <option value="manager">Manager</option>
            <option value="analyst">Analyst</option>
            <option value="sales">Sales/Support</option>
          </select>
        </div>
      </div>

      {/* Header for User List Section */}
      <div className="flex justify-between items-center mb-4">
         <h4 className="text-[var(--text-primary)] font-semibold text-lg">Manage User Assignments</h4>
         <span className="bg-[var(--accent-primary)] text-white px-3.5 py-1.5 rounded-full font-bold text-[13px] shadow-sm border border-[var(--accent-primary)] inline-flex items-center justify-center">
           {loading ? '...' : `${filteredUsers.length} users`}
         </span>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-[var(--color-admin)] text-white px-4 py-3 rounded-lg mb-5 flex items-center gap-2.5 text-sm">
          <i className="fas fa-exclamation-triangle"></i>
          {error}
        </div>
      )}
      
      {/* Scrollable User List */}
      <div className="max-h-[400px] overflow-y-auto border border-[var(--border-light)] rounded-lg p-2.5 bg-[var(--bg-secondary)] scrollbar-thin scrollbar-thumb-[var(--border-light)]">
          {loading ? (
            <div className="flex items-center justify-center gap-2.5 p-10 text-[var(--text-secondary)]">
              <i className="fas fa-spinner fa-spin"></i>
              <span>Loading users...</span>
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="text-center p-8 text-[var(--text-light)] italic text-sm">
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

  // --- Section Content Definitions ---
  
  // Reusable Card Header
  const CardHeader = ({ icon, title }) => (
    <div className="flex items-center mb-5 pb-4 border-b border-[var(--border-light)]">
      <div className="w-10 h-10 rounded-[10px] bg-[var(--accent-primary)] flex items-center justify-center text-white mr-4 text-base">
        <i className={`fas ${icon}`}></i>
      </div>
      <h3 className="text-[20px] font-bold text-[var(--text-primary)]">{title}</h3>
    </div>
  );

  const sections = {
    roles: {
      icon: 'fa-user-shield',
      title: 'User Roles & Permissions',
      component: <RolesSection state={state} dispatch={dispatch} updateUserRole={updateUserRole} />
    },

    security: {
        icon: 'fa-shield-alt',
        title: 'Security Settings',
        component: (
            <div className="rounded-2xl border border-[var(--border-light)] p-6 mb-6 bg-[var(--card-bg)] shadow-[var(--card-shadow)]">
              <CardHeader icon="fa-shield-alt" title="Security Settings" />
              <div className="mb-5">
                <label className="block text-sm font-semibold mb-2 text-[var(--text-secondary)]">Minimum Password Length</label>
                <input type="number" placeholder="8" className="w-full p-3 rounded-lg border border-[var(--border-light)] text-sm bg-[var(--bg-secondary)] text-[var(--text-primary)] focus:border-[var(--accent-primary)] outline-none" />
              </div>
              <div className="mb-5">
                <label className="block text-sm font-semibold mb-2 text-[var(--text-secondary)]">Session Timeout (minutes)</label>
                <input type="number" placeholder="30" className="w-full p-3 rounded-lg border border-[var(--border-light)] text-sm bg-[var(--bg-secondary)] text-[var(--text-primary)] focus:border-[var(--accent-primary)] outline-none" />
              </div>
              <div className="mb-5">
                <label className="block text-sm font-semibold mb-2 text-[var(--text-secondary)]">Two-Factor Authentication (System Wide)</label>
                <select className="w-full p-3 rounded-lg border border-[var(--border-light)] text-sm bg-[var(--bg-secondary)] text-[var(--text-primary)] focus:border-[var(--accent-primary)] outline-none">
                    <option>Mandatory</option>
                    <option>Optional</option>
                    <option>Disabled</option>
                </select>
              </div>
              <button className="w-full py-3 px-6 border-none rounded-lg font-semibold cursor-pointer flex items-center justify-center gap-2 text-white bg-[var(--color-manager)] text-sm transition-all hover:opacity-90">
                  Update Security
              </button>
            </div>
        )
    },
    system: {
      icon: 'fa-tools',
      title: 'System Configuration',
      component: (
        <div className="rounded-2xl border border-[var(--border-light)] p-6 mb-6 bg-[var(--card-bg)] shadow-[var(--card-shadow)]">
          <CardHeader icon="fa-tools" title="System Configuration" />
          <div className="mb-5">
            <label className="block text-sm font-semibold mb-2 text-[var(--text-secondary)]">Data Retention Period</label>
            <select className="w-full p-3 rounded-lg border border-[var(--border-light)] text-sm bg-[var(--bg-secondary)] text-[var(--text-primary)] focus:border-[var(--accent-primary)] outline-none">
                <option>30 days</option>
                <option>90 days</option>
                <option>1 year</option>
                <option>Indefinite</option>
            </select>
          </div>
          <div className="mb-5">
            <label className="block text-sm font-semibold mb-2 text-[var(--text-secondary)]">Backup Frequency</label>
            <select className="w-full p-3 rounded-lg border border-[var(--border-light)] text-sm bg-[var(--bg-secondary)] text-[var(--text-primary)] focus:border-[var(--accent-primary)] outline-none">
                <option>Daily</option>
                <option>Weekly</option>
                <option>Monthly</option>
            </select>
          </div>
          <button className="w-full py-3 px-6 border-none rounded-lg font-semibold cursor-pointer flex items-center justify-center gap-2 text-white bg-[var(--color-analyst)] text-sm transition-all hover:opacity-90">
            Save Configuration
          </button>
        </div>
      )
    },
  };

  const sectionTitles = Object.keys(sections).map(key => ({
    id: key,
    label: sections[key].title
  }));

  return (
    <div className="relative font-[Segoe_UI,sans-serif] bg-[var(--bg-primary)] min-h-screen text-[var(--text-primary)] overflow-x-hidden">
      <ThemeStyles />
      
      <Toast 
        message={toast.message} 
        type={toast.type} 
        onClose={() => dispatch({ type: 'CLEAR_TOAST' })}
      />
      
      {/* LAYOUT FIX:
        ml-0 md:ml-[280px]: Pushes content right to clear the fixed sidebar on desktop.
        p-[20px]: Matches Dashboard padding (tighter gap).
      */}
      <div className="ml-0 md:ml-[0x] p-[20px] transition-all duration-300">
        
        {/* Container constrained to 1400px to match Dashboard width, margin set to 0 to align left */}
        <div className="max-w-[1400px] flex flex-col lg:flex-row gap-[30px] m-0">
          
          {/* Left panel: Navigation */}
          <div className="w-full lg:w-[350px] bg-[var(--card-bg)] rounded-2xl shadow-[var(--card-shadow)] border border-[var(--border-light)] p-6 shrink-0 h-fit lg:sticky lg:top-10">
            <h3 className="mb-5 text-[20px] font-semibold text-[var(--text-primary)]">Admin Settings</h3>
            <ul className="list-none flex flex-row lg:flex-col flex-wrap gap-2">
              {sectionTitles.map((section) => (
                <li 
                  key={section.id}
                  className={`flex-grow lg:flex-grow-0 p-4 rounded-xl cursor-pointer text-[var(--text-secondary)] mb-0 lg:mb-2 transition-all duration-300 border border-transparent font-medium flex items-center justify-center lg:justify-start ${
                      activeSection === section.id 
                      ? 'bg-[var(--accent-light)] text-[var(--accent-primary)] border-[var(--accent-primary)] transform lg:translate-x-[5px]' 
                      : 'hover:bg-[var(--accent-light)] hover:text-[var(--accent-primary)] hover:border-[var(--accent-primary)] lg:hover:translate-x-[5px]'
                  }`}
                  onClick={() => dispatch({ type: 'SET_ACTIVE_SECTION', payload: section.id })}
                >
                   <i className={`fas ${sections[section.id].icon} mr-2.5 w-5 text-center`}></i>
                  {section.label}
                </li>
              ))}
            </ul>
          </div>

          {/* Right panel: Section details */}
          <div className="flex-1 w-full lg:max-w-[1000px] bg-[var(--card-bg)] rounded-2xl shadow-[var(--card-shadow)] border border-[var(--border-light)] p-[30px] h-fit">
            <h2 className="text-[32px] font-bold mb-[30px] text-[var(--text-primary)] relative after:content-[''] after:absolute after:bottom-[-10px] after:left-0 after:w-[60px] after:h-[4px] after:bg-gradient-to-r after:from-[var(--accent-primary)] after:to-[var(--accent-secondary)] after:rounded-sm">
              Settings
            </h2>
            {sections[activeSection]?.component || sections.roles.component}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;