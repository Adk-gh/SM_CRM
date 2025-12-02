import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login/Login';
import Dashboard from './pages/Dashboard/Dashboard';
import CustomerProfile from './pages/CustomerProfile/CustomerProfile';
import Settings from './pages/Settings/Settings';
import SupportTickets from './pages/SupportTickets/SupportTickets';
import SupportTicketSubmit from './pages/SupportTicketSubmit/SupportTicketSubmit'; 
import Layout from './components/Layout/Layout';

import { auth, db } from '../firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, onSnapshot, collection, query, where } from 'firebase/firestore';

import { useState, useEffect } from 'react';
import './App.css';

const SUPPORT_ONLY_ROLES = [
  'POS_Support', 'OnlineShopping_Support', 'Payroll_Admin',
  'HRMIS_Admin', 'Inventory_Manager', 'Warehouse_Operator'
];

const ROLE_TO_DEPT_MAP = {
  'admin': 'All', 'Admin': 'All', 'Super_Admin': 'All',
  'POS_Support': 'POS',
  'OnlineShopping_Support': 'Online Shopping',
  'Payroll_Admin': 'Payroll',
  'HRMIS_Admin': 'HRMIS',
  'Inventory_Manager': 'Inventory',
  'Warehouse_Operator': 'Warehouse'
};

function App() {
  const [user, setUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [is2FANeeded, setIs2FANeeded] = useState(false); 
  
  // STATE: Holds the number for the Red Dot
  const [supportNotificationCount, setSupportNotificationCount] = useState(0);

  const getHomeRoute = (profile) => {
    if (profile && SUPPORT_ONLY_ROLES.includes(profile.role)) {
      return "/support";
    }
    return "/dashboard";
  };

  // 1. AUTH & PROFILE LISTENER
  useEffect(() => {
    let unsubscribeProfile = null;

    const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
      setIs2FANeeded(false); 

      if (user) {
        try {
          const userDocRef = doc(db, 'users', user.uid);
          const userDoc = await getDoc(userDocRef);

          if (userDoc.exists()) {
            const profileData = userDoc.data();
            setUserProfile(profileData);
            if (profileData.is2FAPending === true) setIs2FANeeded(true);
          } else {
            setUserProfile({ profileCompleted: false });
          }

          unsubscribeProfile = onSnapshot(userDocRef, (docSnap) => {
            if (docSnap.exists()) {
              const updatedProfile = docSnap.data();
              setUserProfile(updatedProfile);
              if (updatedProfile.is2FAPending === true) setIs2FANeeded(true);
              else setIs2FANeeded(false);
            }
          });

        } catch (error) {
          console.error('Error fetching user profile:', error);
          setUserProfile({ profileCompleted: false });
        }
      } else {
        setUserProfile(null);
        setIs2FANeeded(false); 
        if (unsubscribeProfile) unsubscribeProfile();
      }

      setUser(user);
      setLoading(false);
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeProfile) unsubscribeProfile();
    };
  }, []);

  // 2. NOTIFICATION LOGIC (Dispatcher Workflow)
  useEffect(() => {
    // Safety check: ensure user profile and role exist
    if (!userProfile || !userProfile.role) {
      setSupportNotificationCount(0);
      return;
    }

    const assignedDept = ROLE_TO_DEPT_MAP[userProfile.role];
    if (!assignedDept) return; // User has no department access

    const ticketsRef = collection(db, 'supportTickets');
    let q;

    // --- SCENARIO A: MAIN ADMIN ---
    // Rule: Show count of NEW ('open') tickets waiting to be triaged.
    if (assignedDept === 'All') {
      q = query(ticketsRef, where('status', '==', 'open'));
    } 
    
    // --- SCENARIO B: DEPT ADMINS ---
    // Rule: Show count of FORWARDED ('pending') tickets assigned to their dept.
    else {
      q = query(
        ticketsRef, 
        where('department', '==', assignedDept), 
        where('status', '==', 'pending')
      );
    }

    // Real-time listener: Updates badge instantly when DB changes
    const unsubscribeTickets = onSnapshot(q, (snapshot) => {
      setSupportNotificationCount(snapshot.size);
    }, (error) => {
      console.error("Error listening to notifications:", error);
    });

    return () => unsubscribeTickets();

  }, [userProfile]);

  if (loading) {
    return <div className="loading-screen"><div className="loading-spinner"></div></div>;
  }

  return (
    <Router>
      <Routes>
        <Route path="/submit-ticket" element={<SupportTicketSubmit />} />

        <Route
          path="/login"
          element={
            !user || is2FANeeded || !userProfile?.profileCompleted ? (
              <Login />
            ) : (
              <Navigate to={getHomeRoute(userProfile)} replace />
            )
          }
        />

        <Route
          path="/"
          element={
            user && userProfile?.profileCompleted && !is2FANeeded ? (
              <Layout 
                userProfile={userProfile} 
                // PASSING THE COUNT DOWN TO LAYOUT
                notificationCount={supportNotificationCount} 
              />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        >
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="customer-profile" element={<CustomerProfile />} />
          <Route path="settings" element={<Settings />} />
          <Route path="support" element={<SupportTickets />} />
          <Route index element={<Navigate to={getHomeRoute(userProfile)} replace />} />
        </Route>

        <Route
          path="*"
          element={
            <Navigate
              to={user && userProfile?.profileCompleted && !is2FANeeded ? getHomeRoute(userProfile) : "/login"}
              replace
            />
          }
        />
      </Routes>
    </Router>
  );
}

export default App;