import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login/Login';
import Dashboard from './pages/Dashboard/Dashboard';
import CustomerProfile from './pages/CustomerProfile/CustomerProfile';
import Campaigns from './pages/Campaigns/Campaigns';
import Settings from './pages/Settings/Settings';
import Segmentation from './pages/Segmentation/Segmentation';
import SupportTickets from './pages/SupportTickets/SupportTickets';
import Reports from './pages/Reports/Reports';
import SupportTicketSubmit from './pages/SupportTicketSubmit/SupportTicketSubmit'; // Public page
import Layout from './components/Layout/Layout';

import { auth, db } from '../firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, onSnapshot } from 'firebase/firestore';

import { useState, useEffect } from 'react';
import './App.css';

function App() {
  const [user, setUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let unsubscribeProfile = null;

    const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
      console.log('Auth state changed - User:', user);

      if (user) {
        try {
          console.log('Fetching user profile for UID:', user.uid);
          const userDoc = await getDoc(doc(db, 'users', user.uid));

          if (userDoc.exists()) {
            const profileData = userDoc.data();
            setUserProfile(profileData);
          } else {
            console.log('No user profile found');
            setUserProfile({ profileCompleted: false });
          }

          // Real-time listener for profile
          unsubscribeProfile = onSnapshot(doc(db, 'users', user.uid), (docSnap) => {
            if (docSnap.exists()) {
              setUserProfile(docSnap.data());
            }
          });

        } catch (error) {
          console.error('Error fetching user profile:', error);
          setUserProfile({ profileCompleted: false });
        }
      } else {
        console.log('No user signed in');
        setUserProfile(null);
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

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="loading-spinner">Loading...</div>
      </div>
    );
  }

  return (
    <Router>
      <Routes>

        {/* ✅ Public QR route (no authentication required) */}
        <Route 
          path="/submit-ticket"
          element={<SupportTicketSubmit />}
        />

        {/* Login Route */}
        <Route
          path="/login"
          element={
            !user ? (
              <Login />
            ) : userProfile?.profileCompleted ? (
              <Navigate to="/dashboard" replace />
            ) : (
              <Login />
            )
          }
        />

        {/* PROTECTED ROUTES WRAPPED BY LAYOUT */}
        <Route
          path="/"
          element={
            user && userProfile?.profileCompleted ? (
              <Layout />
            ) : user ? (
              <Navigate to="/login" replace />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        >

          {/* All protected pages MUST be direct <Route> children */}
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="customer-profile" element={<CustomerProfile />} />
          <Route path="campaigns" element={<Campaigns />} />
          <Route path="segmentation" element={<Segmentation />} />
          <Route path="settings" element={<Settings />} />
          <Route path="support" element={<SupportTickets />} />
          

          {/* Default */}
          <Route index element={<Navigate to="/dashboard" replace />} />

        </Route>

        {/* Catch-all redirect */}
        <Route
          path="*"
          element={
            <Navigate
              to={user && userProfile?.profileCompleted ? "/dashboard" : "/login"}
              replace
            />
          }
        />

      </Routes>
    </Router>
  );
}

export default App;
