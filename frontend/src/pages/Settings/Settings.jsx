import React, { useEffect, useReducer, useCallback } from 'react';
import { collection, getDocs, doc, updateDoc } from 'firebase/firestore';
import { db } from '../../../firebase';

// --- ROLE CONFIGURATION ---
const ROLE_DEFINITIONS = {
  admin: { label: 'Admin', colorClass: 'bg-[var(--color-admin)]' },
  Payroll_Admin: { label: 'Payroll Admin', colorClass: 'bg-[var(--color-payroll)]' },
  HRMIS_Admin: { label: 'HRMIS Admin', colorClass: 'bg-[var(--color-hrmis)]' },
  Inventory_Manager: { label: 'Inventory Manager', colorClass: 'bg-[var(--color-inventory)]' },
  Warehouse_Operator: { label: 'Warehouse Operator', colorClass: 'bg-[var(--color-warehouse)]' },
  POS_Support: { label: 'POS Support', colorClass: 'bg-[var(--color-pos)]' },
  OnlineShopping_Support: { label: 'Online Support', colorClass: 'bg-[var(--color-online)]' },
  user: { label: 'User', colorClass: 'bg-[var(--color-user)]' },
  default: { label: 'User', colorClass: 'bg-[var(--color-user)]' }
};

// --- SETTINGS SPECIFIC CSS (Role Colors Only) ---
const SettingsStyles = () => (
  <style>{`
    :root {
      /* --- UNIQUE ROLE COLORS --- */
      --color-admin: #F56565;
      --color-payroll: #9F7AEA;
      --color-hrmis: #ED64A6;
      --color-inventory: #ED8936;
      --color-warehouse: #38B2AC;
      --color-pos: #4299E1;
      --color-online: #667EEA;
      --color-user: #718096;
    }

    [data-theme="dark"] {
      --color-admin: #FC8181;
      --color-payroll: #D6BCFA;
      --color-hrmis: #F687B3;
      --color-inventory: #F6AD55;
      --color-warehouse: #4FD1C5;
      --color-pos: #63B3ED;
      --color-online: #7F9CF5;
      --color-user: #A0AEC0;
    }

    @keyframes slideIn { from { right: -300px; opacity: 0; } to { right: 20px; opacity: 1; } }
    @keyframes fadeOut { 0% { opacity: 1; } 90% { opacity: 1; } 100% { opacity: 0; } }
    @keyframes modalFadeIn { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }
  `}</style>
);

// --- Utility Functions ---
const generateAvatar = (fullName) => {
  if (!fullName) return '??';
  return fullName.split(' ').map(part => part.charAt(0)).join('').toUpperCase().slice(0, 2);
};

const formatDate = (timestamp) => {
  if (!timestamp || !timestamp.toDate) return 'N/A';
  return timestamp.toDate().toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
};

// --- Components ---

const Toast = ({ message, type, onClose }) => {
  useEffect(() => {
    if (!message) return;
    const timer = setTimeout(onClose, 4000);
    return () => clearTimeout(timer);
  }, [message, onClose]);

  if (!message) return null;
  const icon = type === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle';
  const bgColor = type === 'success' ? 'bg-[var(--color-warehouse)]' : 'bg-[var(--color-admin)]';

  return (
    <div onClick={onClose} className={`fixed top-5 right-5 z-[10000] px-5 py-3 rounded-lg shadow-lg flex items-center gap-2.5 text-white font-semibold cursor-pointer transition-all duration-300 ${bgColor}`} style={{ animation: 'slideIn 0.5s ease-out, fadeOut 0.5s 3.5s forwards' }}>
      <i className={`fas ${icon}`}></i><span>{message}</span>
    </div>
  );
};

// --- CONFIRMATION MODAL COMPONENT ---
const ConfirmationModal = ({ isOpen, onClose, onConfirm, userName, newRole }) => {
  if (!isOpen) return null;

  const roleLabel = ROLE_DEFINITIONS[newRole]?.label || newRole;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm transition-opacity">
      <div 
        className="bg-[var(--card-bg)] p-6 rounded-2xl shadow-2xl border border-[var(--border-light)] w-[90%] max-w-[400px] flex flex-col items-center text-center"
        style={{ animation: 'modalFadeIn 0.2s ease-out' }}
      >
        <div className="w-12 h-12 rounded-full bg-[var(--accent-light)] flex items-center justify-center text-[var(--accent-primary)] mb-4 text-xl">
          <i className="fas fa-question"></i>
        </div>
        
        <h3 className="text-xl font-bold text-[var(--text-primary)] mb-2">Confirm Role Change</h3>
        
        <p className="text-[var(--text-light)] text-sm mb-6 leading-relaxed">
          Are you sure you want to change <strong>{userName}</strong>'s role to <strong className="text-[var(--accent-primary)]">{roleLabel}</strong>?
        </p>

        <div className="flex gap-3 w-full">
          <button 
            onClick={onClose}
            className="flex-1 py-2.5 rounded-lg border border-[var(--border-light)] text-[var(--text-light)] font-semibold hover:bg-[var(--bg-primary)] transition-colors"
          >
            Cancel
          </button>
          <button 
            onClick={onConfirm}
            className="flex-1 py-2.5 rounded-lg bg-[var(--accent-primary)] text-white font-semibold hover:opacity-90 transition-opacity shadow-md"
          >
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
};

// --- User Item Component ---
const UserItem = React.memo(({ user, onRoleUpdate, generateAvatar, formatDate, isUpdating }) => {
  const getRoleDef = (roleKey) => ROLE_DEFINITIONS[roleKey] || ROLE_DEFINITIONS.default;
  const currentRole = user.role || 'user';
  const roleDef = getRoleDef(currentRole);

  return (
    <div className={`group flex flex-col md:flex-row items-start md:items-center p-4 rounded-lg mb-2.5 bg-[var(--card-bg)] border border-[var(--border-light)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md ${isUpdating(user.id) ? 'opacity-70 pointer-events-none' : ''}`}>
      <div className="w-10 h-10 rounded-full bg-[var(--accent-primary)] flex items-center justify-center text-white font-semibold mr-0 md:mr-4 shrink-0 mb-3 md:mb-0">
        {generateAvatar(user.fullName)}
      </div>
      <div className="flex-1 w-full md:w-auto">
        <div className="font-semibold mb-1 text-[var(--text-primary)] flex items-center">
          {user.fullName || 'Unnamed User'}
          {isUpdating(user.id) && <i className="fas fa-spinner fa-spin ml-2 text-[var(--accent-primary)] text-sm"></i>}
        </div>
        <div className="text-xs text-[var(--text-light)] mb-1">{user.email || 'No email provided'}</div>
        <div className="flex gap-1.5 flex-wrap mt-1.5">
          {[user.branch, user.department, user.position].filter(Boolean).map((item, idx) => (
            <span key={idx} className="bg-[var(--accent-light)] text-[var(--accent-primary)] px-1.5 py-0.5 rounded text-[10px] font-medium opacity-80">{item}</span>
          ))}
        </div>
        <div className="text-xs text-[var(--text-light)] mt-2">
          Joined: {formatDate(user.createdAt)}
          {user.profileCompleted && <span className="bg-[var(--color-warehouse)] text-white px-1.5 py-0.5 rounded text-[9px] font-semibold ml-2 align-middle">✓ Profile Complete</span>}
        </div>
      </div>
      <div className="flex items-center justify-between w-full md:w-auto mt-4 md:mt-0 gap-2.5 shrink-0">
        <span className={`px-2.5 py-1 rounded-full text-[11px] font-semibold text-center w-auto min-w-[80px] text-white ${roleDef.colorClass} shadow-sm`}>
          {roleDef.label}
        </span>
        <select 
          className="w-[160px] p-2 rounded-md border border-[var(--border-light)] bg-[var(--bg-secondary)] text-[var(--text-primary)] text-xs cursor-pointer focus:border-[var(--accent-primary)] outline-none"
          value={currentRole}
          onChange={(e) => onRoleUpdate(user.id, e.target.value)}
          disabled={isUpdating(user.id)}
        >
          {Object.entries(ROLE_DEFINITIONS).filter(([key]) => key !== 'default').map(([key, def]) => (
            <option key={key} value={key}>{def.label}</option>
          ))}
        </select>
      </div>
    </div>
  );
});

// --- Roles Management Section ---
const RolesSection = ({ state, dispatch, onInitiateUpdate }) => {
  const { users, loading, error, searchTerm, roleFilter, rolesToUpdate } = state;
  const isUpdating = (userId) => rolesToUpdate.has(userId);

  const filteredUsers = users.filter(user => {
    const searchLower = searchTerm.toLowerCase();
    const role = user.role || 'user';
    const matchesRole = roleFilter === 'all' || role === roleFilter;
    const matchesSearch = user.fullName?.toLowerCase().includes(searchLower) || user.email?.toLowerCase().includes(searchLower) || ROLE_DEFINITIONS[role]?.label.toLowerCase().includes(searchLower);
    return matchesSearch && matchesRole;
  });

  const arrowSvg = "data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%236E9FC1%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.5-12.8z%22%2F%3E%3C%2Fsvg%3E";

  return (
    <div className="rounded-2xl border border-[var(--border-light)] p-6 mb-0 transition-all duration-300 relative overflow-hidden bg-[var(--card-bg)] shadow-[var(--card-shadow)] h-full flex flex-col">
      <div className="flex flex-col md:flex-row gap-4 mb-5 flex-wrap shrink-0">
        <div className="flex-1 min-w-[250px] relative flex items-center">
          <i className="fas fa-search absolute left-3 text-[var(--text-light)]"></i>
          <input type="text" className="w-full pl-10 pr-4 py-3 rounded-lg border border-[var(--border-light)] text-sm bg-[var(--bg-secondary)] text-[var(--text-primary)] transition-all focus:border-[var(--accent-primary)] outline-none" placeholder="Search users by name, email..." value={searchTerm} onChange={(e) => dispatch({ type: 'SET_SEARCH_TERM', payload: e.target.value })} />
        </div>
        <div className="w-full md:w-auto">
          <select className="w-full md:w-[220px] h-[45px] bg-[var(--bg-secondary)] border border-[var(--border-light)] rounded-lg text-[var(--text-primary)] appearance-none outline-none text-sm pl-4 pr-10 cursor-pointer focus:border-[var(--accent-primary)] focus:ring-2 focus:ring-[rgba(57,90,127,0.1)]" value={roleFilter} onChange={(e) => dispatch({ type: 'SET_ROLE_FILTER', payload: e.target.value })} style={{ backgroundImage: `url('${arrowSvg}')`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 15px center', backgroundSize: '10px' }}>
            <option value="all">Filter by Role (All)</option>
            {Object.entries(ROLE_DEFINITIONS).filter(([key]) => key !== 'default').map(([key, def]) => (
              <option key={key} value={key}>{def.label}</option>
            ))}
          </select>
        </div>
      </div>
      <div className="flex justify-between items-center mb-4 shrink-0">
         <h4 className="text-[var(--text-primary)] font-semibold text-lg">Manage User Assignments</h4>
         <span className="bg-[var(--accent-primary)] text-white px-3.5 py-1.5 rounded-full font-bold text-[13px] shadow-sm border border-[var(--accent-primary)] inline-flex items-center justify-center">{loading ? '...' : `${filteredUsers.length} users`}</span>
      </div>
      {error && <div className="bg-[var(--color-admin)] text-white px-4 py-3 rounded-lg mb-5 flex items-center gap-2.5 text-sm shrink-0"><i className="fas fa-exclamation-triangle"></i>{error}</div>}
      
      {/* FIXED SCROLL CONTAINER */}
      <div className="flex-1 overflow-y-auto min-h-0 border border-[var(--border-light)] rounded-lg p-2.5 bg-[var(--bg-secondary)] scrollbar-thin scrollbar-thumb-[var(--border-light)]">
          {loading ? (
            <div className="flex items-center justify-center gap-2.5 p-10 text-[var(--text-secondary)]"><i className="fas fa-spinner fa-spin"></i><span>Loading users...</span></div>
          ) : filteredUsers.length === 0 ? (
            <div className="text-center p-8 text-[var(--text-light)] italic text-sm">{searchTerm || roleFilter !== 'all' ? 'No users found matching your criteria.' : 'No users found in the database.'}</div>
          ) : (
            filteredUsers.map(user => (
              <UserItem key={user.id} user={user} onRoleUpdate={onInitiateUpdate} generateAvatar={generateAvatar} formatDate={formatDate} isUpdating={isUpdating} />
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
  modal: { isOpen: false, userId: null, newRole: null, userName: null }
};

function settingsReducer(state, action) {
  switch (action.type) {
    case 'SET_ACTIVE_SECTION': return { ...state, activeSection: action.payload };
    case 'SET_SEARCH_TERM': return { ...state, searchTerm: action.payload };
    case 'SET_ROLE_FILTER': return { ...state, roleFilter: action.payload };
    case 'FETCH_START': return { ...state, loading: true, error: null };
    case 'FETCH_SUCCESS': return { ...state, loading: false, users: action.payload };
    case 'FETCH_FAILURE': return { ...state, loading: false, error: action.payload };
    case 'UPDATE_ROLE_START': return { ...state, rolesToUpdate: new Set(state.rolesToUpdate).add(action.payload) };
    case 'UPDATE_ROLE_SUCCESS': {
      const newRolesToUpdateSuccess = new Set(state.rolesToUpdate);
      newRolesToUpdateSuccess.delete(action.payload.userId);
      return { 
        ...state, 
        users: state.users.map(user => user.id === action.payload.userId ? { ...user, role: action.payload.newRole } : user),
        rolesToUpdate: newRolesToUpdateSuccess,
        toast: { message: `Role updated for ${action.payload.userName}!`, type: 'success' },
      };
    }
    case 'UPDATE_ROLE_FAILURE': {
      const newRolesToUpdateFailure = new Set(state.rolesToUpdate);
      newRolesToUpdateFailure.delete(action.payload.userId);
      return { ...state, rolesToUpdate: newRolesToUpdateFailure, toast: { message: action.payload.error, type: 'error' } };
    }
    case 'CLEAR_TOAST': return { ...state, toast: { message: '', type: '' } };
    case 'OPEN_MODAL': return { ...state, modal: { isOpen: true, ...action.payload } };
    case 'CLOSE_MODAL': return { ...state, modal: { isOpen: false, userId: null, newRole: null, userName: null } };
    default: return state;
  }
}

// --- Main Settings Component ---
const Settings = () => {
  const [state, dispatch] = useReducer(settingsReducer, initialState);
  const { activeSection, users, toast, modal } = state;

  useEffect(() => {
    const fetchUsers = async () => {
      dispatch({ type: 'FETCH_START' });
      try {
        const usersCollection = collection(db, 'users');
        const usersSnapshot = await getDocs(usersCollection);
        const usersList = usersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        dispatch({ type: 'FETCH_SUCCESS', payload: usersList });
      } catch (err) {
        console.error('Error fetching users:', err);
        dispatch({ type: 'FETCH_FAILURE', payload: 'Failed to load users. Please refresh.' });
      }
    };
    fetchUsers();
  }, []);

  const initiateRoleUpdate = useCallback((userId, newRole) => {
    const userToUpdate = users.find(u => u.id === userId);
    if (!userToUpdate) return;
    dispatch({ 
      type: 'OPEN_MODAL', 
      payload: { userId, newRole, userName: userToUpdate.fullName || userToUpdate.email } 
    });
  }, [users]);

  const confirmRoleUpdate = useCallback(async () => {
    const { userId, newRole, userName } = modal;
    dispatch({ type: 'CLOSE_MODAL' }); 
    dispatch({ type: 'UPDATE_ROLE_START', payload: userId });

    try {
      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, { role: newRole, updatedAt: new Date() });
      dispatch({ type: 'UPDATE_ROLE_SUCCESS', payload: { userId, newRole, userName } });
    } catch (err) {
      console.error('Error updating user role:', err);
      dispatch({ type: 'UPDATE_ROLE_FAILURE', payload: { userId, error: `Failed to update ${userName}'s role.` } });
    }
  }, [modal]);

  const sections = {
    roles: {
      component: <RolesSection state={state} dispatch={dispatch} onInitiateUpdate={initiateRoleUpdate} />
    }
  };

  return (
    <div className="relative font-[Segoe_UI,sans-serif] w-full text-[var(--text-primary)] h-full flex flex-col overflow-hidden">
      <SettingsStyles />
      <Toast message={toast.message} type={toast.type} onClose={() => dispatch({ type: 'CLEAR_TOAST' })} />
      
      <ConfirmationModal 
        isOpen={modal.isOpen} 
        onClose={() => dispatch({ type: 'CLOSE_MODAL' })} 
        onConfirm={confirmRoleUpdate}
        userName={modal.userName}
        newRole={modal.newRole}
      />

      {/* Main Content Area - No extra wrapper cards */}
      <div className="flex-1 flex flex-col min-h-0">
          {/* Header Area - Fixed */}
          <div className="flex items-center justify-between mb-0 pb-6 shrink-0">
             <div className="flex items-center gap-3">
               {/* Optional: Add an icon back if desired, currently plain text as per image */}
             </div>
          </div>
          
          {/* Render Content Directly */}
          <div className="flex-1 min-h-0">
             {sections[activeSection]?.component || sections.roles.component}
          </div>
      </div>
    </div>
  );
};
export default Settings;