import React, { useEffect, useReducer, useCallback } from 'react';
import { collection, getDocs, doc, updateDoc, query, where, serverTimestamp } from 'firebase/firestore'; 
// NOTE: Assuming db is correctly initialized and exported from the local firebase config.
import { db } from '../../../firebase'; 
import './Settings.css';

// --- Utility Functions ---

/**
 * Generates avatar initials from a user's full name.
 * @param {string} fullName - The full name of the user.
 * @returns {string} - The first two initials or '??'.
 */
const generateAvatar = (fullName) => {
    if (!fullName) return '??';
    return fullName
        .split(' ')
        .map(part => part.charAt(0))
        .join('')
        .toUpperCase()
        .slice(0, 2);
};

/**
 * Formats a Firestore timestamp for display.
 * @param {object} timestamp - The Firestore Timestamp object.
 * @returns {string} - Formatted date string or 'N/A'.
 */
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

// --- Confirmation Modal Component (Replaces window.confirm) ---
const ConfirmationModal = ({ title, message, onConfirm, onCancel }) => (
    <div className="modal-backdrop">
        <div className="modal-content">
            <h4 className="modal-title">{title}</h4>
            <p className="modal-message">{message}</p>
            <div className="modal-actions">
                <button className="btn btn-secondary" onClick={onCancel}>Cancel</button>
                <button className="btn btn-danger" onClick={onConfirm}>Confirm Archive</button>
            </div>
        </div>
    </div>
);


// --- User Item Component ---

const UserItem = React.memo(({ user, onRoleChange, onArchiveUser, generateAvatar, formatDate, isUpdating }) => {
    
    return (
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
            <div className="user-actions">
                {/* Role Management Dropdown - ONLY ADMIN AND USER */}
                <select 
                    className="role-select" 
                    value={user.role || 'user'} // Default is 'user'
                    onChange={(e) => onRoleChange(user.id, e.target.value)}
                    disabled={isUpdating(user.id)} // Disable while updating
                >
                    <option value="admin">Admin</option>
                    <option value="user">User</option>
                </select>
                
                {/* Archive Button */}
                <button
                    className="btn-archive"
                    onClick={() => onArchiveUser(user)} // Pass the whole user object now
                    disabled={isUpdating(user.id)}
                    title="Archive user (removes from active list)"
                >
                    {isUpdating(user.id) ? (
                        <i className="fas fa-spinner fa-spin"></i>
                    ) : (
                        <i className="fas fa-archive"></i>
                    )}
                    {isUpdating(user.id) ? 'Updating...' : 'Archive'}
                </button>
            </div>
        </div>
    );
});

// --- Roles Management Section Component ---

const RolesSection = ({ state, dispatch, updateUserStatus }) => {
    const { users, loading, error, searchTerm, roleFilter, rolesToUpdate, confirmationModal } = state;

    const isUpdating = (userId) => rolesToUpdate.has(userId);

    // Handler for role change - calls the main update function
    const handleRoleChange = (userId, newRole) => {
        updateUserStatus(userId, { role: newRole });
    };

    // Handler to initiate the archive confirmation modal
    const handleArchiveUser = (user) => {
        dispatch({ type: 'SHOW_CONFIRMATION', payload: user });
    };

    // Handler to execute the archive
    const confirmArchive = () => {
        if (confirmationModal.user) {
            const userId = confirmationModal.user.id;
            // The actual logic to archive the user
            updateUserStatus(userId, { isArchived: true });
        }
        dispatch({ type: 'HIDE_CONFIRMATION' });
    };
    
    // Filter users based on search and role filter
    const filteredUsers = users.filter(user => {
        const searchLower = searchTerm.toLowerCase();
        const role = user.role || 'user'; // Use 'user' as default for filtering

        const matchesSearch = 
            user.fullName?.toLowerCase().includes(searchLower) || 
            user.email?.toLowerCase().includes(searchLower) ||
            user.branch?.toLowerCase().includes(searchLower) ||
            user.department?.toLowerCase().includes(searchLower) ||
            user.position?.toLowerCase().includes(searchLower) ||
            role.toLowerCase().includes(searchLower);

        const matchesRole = roleFilter === 'all' || role === roleFilter;
        return matchesSearch && matchesRole;
    });

    return (
        <div className="content-card roles-container">
            {/* Confirmation Modal */}
            {confirmationModal.isVisible && (
                <ConfirmationModal
                    title="Confirm Archive"
                    message={`Are you sure you want to archive ${confirmationModal.user.fullName || 'this user'}? They will be removed from the active user list and require an Admin to restore.`}
                    onConfirm={confirmArchive}
                    onCancel={() => dispatch({ type: 'HIDE_CONFIRMATION' })}
                />
            )}

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
                        <option value="user">User</option>
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
                        {loading ? 'Loading...' : `${filteredUsers.length} active users`}
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
                            ? 'No active users found matching your criteria.' 
                            : 'No active users found in the database.'
                            }
                        </div>
                    ) : (
                        filteredUsers.map(user => (
                            <UserItem 
                                key={user.id} 
                                user={user} 
                                onRoleChange={handleRoleChange}
                                onArchiveUser={handleArchiveUser}
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
                <span>Archived users are only deactivated and hidden from this list; their data is retained for history.</span>
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
    confirmationModal: { isVisible: false, user: null },
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
        case 'ARCHIVE_USER_START':
            return { ...state, rolesToUpdate: new Set(state.rolesToUpdate).add(action.payload) };

        case 'UPDATE_ROLE_SUCCESS': {
            // Update the role in state
            const newRolesToUpdateSuccess = new Set(state.rolesToUpdate);
            newRolesToUpdateSuccess.delete(action.payload.userId);
            return { 
                ...state, 
                users: state.users.map(user => 
                    user.id === action.payload.userId ? { ...user, role: action.payload.updates.role } : user
                ),
                rolesToUpdate: newRolesToUpdateSuccess,
                toast: { message: `Role updated for ${action.payload.userName}!`, type: 'success' },
            };
        }

        case 'ARCHIVE_USER_SUCCESS': {
            // Remove the user from the active 'users' list
            const newRolesToUpdateSuccess = new Set(state.rolesToUpdate);
            newRolesToUpdateSuccess.delete(action.payload.userId);
            return { 
                ...state, 
                users: state.users.filter(user => user.id !== action.payload.userId),
                rolesToUpdate: newRolesToUpdateSuccess,
                toast: { message: `User ${action.payload.userName} archived successfully!`, type: 'success' },
            };
        }

        case 'UPDATE_ROLE_FAILURE': 
        case 'ARCHIVE_USER_FAILURE': {
            // Remove the ID from rolesToUpdate set
            const newRolesToUpdateFailure = new Set(state.rolesToUpdate);
            newRolesToUpdateFailure.delete(action.payload.userId);
            return { 
                ...state, 
                rolesToUpdate: newRolesToUpdateFailure,
                // Now includes the specific error message for better user feedback
                toast: { message: action.payload.error, type: 'error' },
            };
        }
        case 'SHOW_CONFIRMATION':
            return { ...state, confirmationModal: { isVisible: true, user: action.payload } };
        case 'HIDE_CONFIRMATION':
            return { ...state, confirmationModal: { isVisible: false, user: null } };
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

    /**
     * Fetches active users from Firestore.
     */
    const fetchUsers = useCallback(async () => {
        dispatch({ type: 'FETCH_START' });
        try {
            // Uses the 'users' collection
            const usersCollectionRef = collection(db, 'users'); 

            // Query for active users (where 'isArchived' is explicitly false)
            const q = query(usersCollectionRef, where('isArchived', '==', false)); 

            const usersSnapshot = await getDocs(q);
            const usersList = usersSnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            dispatch({ type: 'FETCH_SUCCESS', payload: usersList });
        } catch (err) {
            console.error('Error fetching users:', err);
            dispatch({ type: 'FETCH_FAILURE', payload: 'Failed to load users. Please refresh.' });
        }
    }, []);

    // Run the fetch on component mount
    useEffect(() => {
        fetchUsers();
    }, [fetchUsers]);

    /**
     * Updates user role or archives the user by writing to Firestore.
     * This is the core function handling the database update.
     */
    const updateUserStatus = useCallback(async (userId, updates) => {
        const userToUpdate = users.find(u => u.id === userId);
        if (!userToUpdate) return;

        // Determine the action type based on the content of the updates object
        const isArchiveAction = updates.hasOwnProperty('isArchived');
        const startAction = isArchiveAction ? 'ARCHIVE_USER_START' : 'UPDATE_ROLE_START';
        const successAction = isArchiveAction ? 'ARCHIVE_USER_SUCCESS' : 'UPDATE_ROLE_SUCCESS';
        const failureAction = isArchiveAction ? 'ARCHIVE_USER_FAILURE' : 'UPDATE_ROLE_FAILURE';

        dispatch({ type: startAction, payload: userId });

        try {
            const userRef = doc(db, 'users', userId);
            
            // Writes the new data (e.g., { role: 'admin' } or { isArchived: true }) to the user document
            await updateDoc(userRef, {
                ...updates,
                updatedAt: serverTimestamp() 
            });

            console.log(`[UPDATE SUCCESS] User ID: ${userId} successfully updated.`);

            dispatch({ 
                type: successAction, 
                payload: { userId, updates, userName: userToUpdate.fullName || userToUpdate.email } 
            });

        } catch (err) {
            console.error(`[UPDATE FAILED] User ID: ${userId} | Error:`, err);
            
            // Provide the error message to the toast for better clarity
            dispatch({ 
                type: failureAction, 
                payload: { userId, error: `Failed to update ${userToUpdate.fullName || 'user'}'s status. (Reason: ${err.code || 'error'})` } 
            });
        }
    }, [users]); 

    // --- Section Definitions (Simplified for Admin Focus) ---
    const sections = {
        roles: {
            icon: 'fa-user-shield',
            title: 'User Roles & Permissions',
            component: <RolesSection state={state} dispatch={dispatch} updateUserStatus={updateUserStatus} />
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