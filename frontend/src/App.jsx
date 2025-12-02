import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login/Login';
import Dashboard from './pages/Dashboard/Dashboard';
import CustomerProfile from './pages/CustomerProfile/CustomerProfile';
import Settings from './pages/Settings/Settings';
import SupportTickets from './pages/SupportTickets/SupportTickets';
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
// 🔑 Tracks if the user is authenticated but MUST stay on the login screen for 2FA.
const [is2FANeeded, setIs2FANeeded] = useState(false); 

useEffect(() => {
 let unsubscribeProfile = null;

 const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
 console.log('Auth state changed - User:', user);
 
 // Reset 2FA needed state before processing
 setIs2FANeeded(false); 

 if (user) {
  try {
  console.log('Fetching user profile for UID:', user.uid);
  const userDocRef = doc(db, 'users', user.uid);
  const userDoc = await getDoc(userDocRef);

  if (userDoc.exists()) {
   const profileData = userDoc.data();
   setUserProfile(profileData);
   
   // ⭐ CRITICAL CHECK: Check if the user is signed in but pending 2FA completion
   if (profileData.is2FAPending === true) {
   console.log('User found but 2FA is pending. Blocking dashboard access.');
   setIs2FANeeded(true);
   }

  } else {
   console.log('No user profile found');
   setUserProfile({ profileCompleted: false });
  }

  // Real-time listener for profile changes (including profileCompleted/is2FAPending)
  unsubscribeProfile = onSnapshot(userDocRef, (docSnap) => {
   if (docSnap.exists()) {
   const updatedProfile = docSnap.data();
   setUserProfile(updatedProfile);
   
   // If profile changes in real-time, check 2FA status
   if (updatedProfile.is2FAPending === true) {
    setIs2FANeeded(true);
   } else {
    setIs2FANeeded(false);
   }
   }
  });

  } catch (error) {
  console.error('Error fetching user profile:', error);
  setUserProfile({ profileCompleted: false });
  }
 } else {
  console.log('No user signed in');
  setUserProfile(null);
  setIs2FANeeded(false); // No user, no 2FA needed
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
  <div className="loading-spinner"></div>
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

  {/* Login Route - Block Dashboard redirection if 2FA is needed or profile incomplete */}
  <Route
  path="/login"
  element={
   !user || is2FANeeded || !userProfile?.profileCompleted ? (
   <Login />
   ) : (
   <Navigate to="/dashboard" replace />
   )
  }
  />

  {/* PROTECTED ROUTES WRAPPED BY LAYOUT - Deny access if 2FA is needed or profile incomplete */}
  <Route
  path="/"
  element={
   user && userProfile?.profileCompleted && !is2FANeeded ? (
   <Layout />
   ) : (
   <Navigate to="/login" replace />
   )
  }
  >

  {/* All protected pages MUST be direct <Route> children */}
  <Route path="dashboard" element={<Dashboard />} />
  <Route path="customer-profile" element={<CustomerProfile />} />
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
   to={user && userProfile?.profileCompleted && !is2FANeeded ? "/dashboard" : "/login"}
   replace
   />
  }
  />

 </Routes>
 </Router>
);
}

export default App;