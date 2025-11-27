import React, { useState, useEffect } from 'react';
import { 
 createUserWithEmailAndPassword, 
 updateProfile, 
 signInWithEmailAndPassword,
 sendPasswordResetEmail,
 sendEmailVerification,
 signOut 
} from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore'; 
import { auth, db } from '../../../firebase';
import logo from '../../assets/logo.jpg';
import './Login.css';

// --- INLINE SVG ICONS (Black & White Aesthetic) ---
const EyeIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
        <path d="M12 9a3.75 3.75 0 100 7.5A3.75 3.75 0 0012 9z" />
        <path fillRule="evenodd" d="M11.96 4.75c-.213.06-.431.11-.645.158A13.292 13.292 0 005.618 6.55.75.75 0 005 7.276v2.309c0 .762.483 1.487 1.282 1.758a11.137 11.137 0 0011.436-.001c.799-.271 1.282-.996 1.282-1.758V7.276c0-.342-.206-.653-.538-.727a13.29 13.29 0 00-5.697-1.644.75.75 0 00-.645 0c-.214.048-.432.098-.645.158zm.04 12.339A6.75 6.75 0 105.25 12a6.75 6.75 0 006.75 5.089z" clipRule="evenodd" />
    </svg>
);

const EyeSlashIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
        <path d="M12.004 5.928a.75.75 0 01.75-.75A13.294 13.294 0 006.545 7.15c-.342.074-.538.385-.538.727v2.309c0 .762.483 1.487 1.282 1.758a11.137 11.137 0 0011.436-.001c.799-.271 1.282-.996 1.282-1.758V7.877c0-.342-.206-.653-.538-.727a13.294 13.294 0 00-6.208-1.977.75.75 0 01-.75-.75z" />
        <path fillRule="evenodd" d="M12.004 17.589A6.75 6.75 0 0018.75 12c0-1.879-.785-3.593-2.05-4.821a.75.75 0 011.026-1.085A8.23 8.23 0 0120.25 12c0 4.556-3.79 8.25-8.496 8.25-2.227 0-4.275-.898-5.748-2.394a.75.75 0 011.026-1.085c1.265 1.228 2.978 2.012 4.852 2.012zM12 9a3.75 3.75 0 100 7.5A3.75 3.75 0 0012 9z" clipRule="evenodd" />
        <path fillRule="evenodd" d="M3.567 4.026c.213-.06.431-.11.645-.158A13.292 13.292 0 019.215.35c.241-.07.49-.105.74-.105.25 0 .5.035.741.105a13.292 13.292 0 015.003 1.518c.213.048.431.098.645.158a.75.75 0 01.696.883c-.046.331-.417.47-.696.398-1.57-.42-3.238-.682-4.98-.682-1.742 0-3.41.262-4.98.682-.279.073-.65-.067-.696-.398a.75.75 0 01.696-.883z" clipRule="evenodd" />
    </svg>
);
// -------------------------------------------------------------------


const Login = () => {
 const [isRightPanelActive, setIsRightPanelActive] = useState(false);
 const [showProfileSetup, setShowProfileSetup] = useState(false);
 const [currentStep, setCurrentStep] = useState(1);
 const [formData, setFormData] = useState({
  loginEmail: '',
  loginPassword: '',
  signupEmail: '',
  signupPassword: '',
    // NEW STATE FOR CONFIRM PASSWORD
    signupConfirmPassword: '',
  signupFullName: '',
  signupUsername: ''
 });
 const [profileData, setProfileData] = useState({
  fullName: '',
  position: '',
  department: '',
  branch: '',
  email: '',
  phone: ''
 });
 const [loading, setLoading] = useState(false);
 const [error, setError] = useState('');
 const [successMessage, setSuccessMessage] = useState('');

 // NEW STATE FOR PASSWORD VISIBILITY
 const [showLoginPassword, setShowLoginPassword] = useState(false);
 const [showSignupPassword, setShowSignupPassword] = useState(false);
 const [showSignupConfirmPassword, setShowSignupConfirmPassword] = useState(false);
 // ------------------------------------------------------------------

 // 🔒 SECURITY STATE: Account Lockout/Brute-Force Protection
 const [failedAttempts, setFailedAttempts] = useState(0);
 const MAX_ATTEMPTS = 5;
 const LOCKOUT_DURATION_MS = 30000; 

 // Mock branches data
 const branches = ['SM Megamall', 'SM Mall of Asia', 'SM North EDSA', 'SM City Cebu', 'SM City Davao'];

    useEffect(() => {
        const user = auth.currentUser;
        if (showProfileSetup && user) {
            setProfileData(prev => ({
                ...prev,
                email: user.email,
                fullName: user.displayName || prev.fullName
            }));
        }
    }, [showProfileSetup]);


 const handleInputChange = (e) => {
  setFormData({
   ...formData,
   [e.target.name]: e.target.value
  });
    // Clear password match error when typing
    if (e.target.name === 'signupPassword' || e.target.name === 'signupConfirmPassword') {
        setError('');
    }
 };

 const handleProfileInputChange = (e) => {
  setProfileData({
   ...profileData,
   [e.target.name]: e.target.value
  });
 };
    
  // HANDLER FUNCTIONS FOR TOGGLING PASSWORD VISIBILITY
  const toggleLoginPasswordVisibility = () => {
    setShowLoginPassword(prev => !prev);
  };

  const toggleSignupPasswordVisibility = () => {
    setShowSignupPassword(prev => !prev);
  };

  const toggleSignupConfirmPasswordVisibility = () => {
    setShowSignupConfirmPassword(prev => !prev);
  };
  // ------------------------------------------------------------------

    // --- NEW VALIDATION FUNCTION ---
    const validateSignupForm = (password, confirmPassword) => {
        // 1. Password Match Check
        if (password !== confirmPassword) {
            setError('The password and confirm password fields must match.');
            return false;
        }

        // 2. Password Strength Check (Existing logic)
        const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
        if (!passwordRegex.test(password)) {
            setError(
                'Password must be at least 8 characters and include: one uppercase, one lowercase, one number, and one special character (@$!%*?&).'
            );
            return false;
        }

        return true;
    };
    // --------------------------------

 // --- 1. Sign-Up Handler: Creates user, sends verification email, and SIGNS OUT ---
 const handleSignUp = async (e) => {
  e.preventDefault();
  setLoading(true);
  setError('');
  setSuccessMessage('');

    const password = formData.signupPassword;
    const confirmPassword = formData.signupConfirmPassword;

    // Run new validation logic
    if (!validateSignupForm(password, confirmPassword)) {
        setLoading(false);
        return;
    }

  try {
   const userCredential = await createUserWithEmailAndPassword(
    auth, 
    formData.signupEmail, 
    password
   );
   
   const user = userCredential.user;

   await updateProfile(user, {
    displayName: formData.signupFullName
   });

   // Send email verification right after sign-up
   await sendEmailVerification(user);
   
   // Store basic user info 
   await setDoc(doc(db, 'users', user.uid), {
    fullName: formData.signupFullName,
    email: formData.signupEmail,
    username: formData.signupUsername,
    createdAt: new Date(),
    role: 'user',
    profileCompleted: false,
    emailVerified: false // Explicitly tracked in Firestore
   });

   console.log('User created successfully. Verification email sent. Signing out.');

   // Sign the user out immediately after creation
   await signOut(auth);

   // Clear sign up form
   setFormData({
    ...formData,
    signupFullName: '',
    signupEmail: '',
    signupUsername: '',
    signupPassword: '',
        signupConfirmPassword: '' // Clear new field
   });
   
   setSuccessMessage('✅ Account created! A verification email has been sent. Please **verify your email** first, and then log in to complete your profile.');
   setIsRightPanelActive(false); // Switch to sign-in view
   setShowProfileSetup(false); // Hide profile setup
   
  } catch (error) {
   console.error('Error signing up:', error);
   
   if (error.code === 'auth/email-already-in-use') {
    setError('This email is already registered. Please use a different email or sign in.');
   } else if (error.code === 'auth/invalid-email') {
    setError('Invalid email address format.');
   } else {
    setError(`Signup failed: ${error.message}`);
   }
  } finally {
   setLoading(false);
  }
 };

 // --- 2. Login Handler: Checks for verification status and then profile completion ---
 const handleLogin = async (e) => {
  e.preventDefault();
  
  // 🔒 SECURITY CHECK: Lockout enforcement
  if (failedAttempts >= MAX_ATTEMPTS) {
    setError(`Account locked due to too many failed attempts. Please wait ${LOCKOUT_DURATION_MS / 1000} seconds.`);
    return;
  }
  
  setLoading(true);
  setError('');
  setSuccessMessage('');

  try {
   const userCredential = await signInWithEmailAndPassword(
    auth,
    formData.loginEmail,
    formData.loginPassword
   );
   
   const user = userCredential.user;

   // 🔒 SECURITY SUCCESS: Reset failed attempts on successful login
   setFailedAttempts(0); 

   // Check if the user's email is verified 
   if (!user.emailVerified) {
    
    // Sign out the unverified user immediately
    await signOut(auth);
    
    // Re-send verification email for user convenience
    await sendEmailVerification(user);
    
    setError('❌ Your email address is not verified. A new verification link has been sent. Please check your inbox and follow the link to log in.');
    
    setFormData({ ...formData, loginPassword: '' }); // Clear password for security
    setLoading(false);
    return; // Stop the login process
   }

   console.log('User logged in successfully and email is verified.');

      // Check Firestore for profile completion status
      const userDocRef = doc(db, 'users', user.uid);
      const userDoc = await getDoc(userDocRef);

      if (userDoc.exists() && userDoc.data().profileCompleted === false) {
          console.log('Profile incomplete. Redirecting to setup.');
          
          // Clear password and form data for security before redirecting
          setFormData({
            ...formData,
            loginEmail: '',
            loginPassword: ''
          });

          // Redirect to profile setup view
          setShowProfileSetup(true);
          setIsRightPanelActive(false); // Ensure overlay is gone 
          setSuccessMessage('Welcome! Please complete your employee profile to access the dashboard.');

          // Stop login process here, Profile Setup component takes over
          setLoading(false);
          return;
      }
   
   // If email is verified and profile is completed, proceed to app
   setFormData({
    ...formData,
    loginEmail: '',
    loginPassword: ''
   });
   
   // App.jsx handles the redirect if successful and verified
   
  } catch (error) {
   console.error('Error logging in:', error);
   
   if (error.code === 'auth/invalid-credential') {
    
    // 🔒 SECURITY: Increment failed attempts
    const newAttempts = failedAttempts + 1;
    setFailedAttempts(newAttempts);
    
    if (newAttempts >= MAX_ATTEMPTS) {
      setError(`Too many failed login attempts. Locking account for ${LOCKOUT_DURATION_MS / 1000} seconds.`);
      setTimeout(() => {
        setFailedAttempts(0);
        setError('');
      }, LOCKOUT_DURATION_MS);
    } else {
      setError('Invalid email or password. Please try again.');
    }

   } else if (error.code === 'auth/user-not-found') {
    setError('No account found with this email. Please sign up first.');
   } else {
    setError(`Login failed: ${error.message}`);
   }
  } finally {
   setLoading(false);
  }
 };
 
 // --- 3. Handle Password Reset ---
 const handlePasswordReset = async () => {
  const email = formData.loginEmail;

  if (!email) {
   setError('Please enter your email address in the field above to reset your password.');
   setSuccessMessage('');
   return;
  }

  setLoading(true);
  setError('');
  setSuccessMessage('');

  try {
   await sendPasswordResetEmail(auth, email);
   setSuccessMessage(`Password reset link successfully sent to ${email}. Please check your inbox (and spam folder).`);
   
   setFormData({ ...formData, loginEmail: '' });
   
  } catch (error) {
   console.error('Error sending password reset email:', error);
   if (error.code === 'auth/user-not-found') {
    setError('No account found with that email address.');
   } else if (error.code === 'auth/invalid-email') {
    setError('Please enter a valid email address.');
   } else {
    setError(`Failed to send reset link: ${error.message}`);
   }
  } finally {
   setLoading(false);
  }
 };

 // --- 4. Handle Profile Setup ---
 const handleSaveProfile = async () => {
  setLoading(true);
  setError('');
    setSuccessMessage(''); // Clear setup success message

    // Final Validation Check
    if (!profileData.fullName || !profileData.position || !profileData.department || !profileData.branch || !profileData.phone) {
        setError('Please ensure all profile fields are filled out.');
        setLoading(false);
        return;
    }

  try {
   const user = auth.currentUser;

   if (user) {
    // Update Firestore document, setting profileCompleted to true
    await setDoc(doc(db, 'users', user.uid), {
     fullName: profileData.fullName,
     email: profileData.email,
     position: profileData.position,
     department: profileData.department,
     branch: profileData.branch,
     phone: profileData.phone,
     profileCompleted: true,
     emailVerified: user.emailVerified, 
     updatedAt: new Date()
    }, { merge: true }); // Use merge to retain initial fields

    console.log('Profile completed successfully - App.jsx will detect the change and redirect');
    
    setSuccessMessage('Profile completed successfully! Redirecting...');
    
   }
  } catch (error) {
   console.error('Error saving profile:', error);
   setError('Failed to save profile. Please try again.');
  } finally {
   setLoading(false);
  }
 };

 const nextStep = () => {
  setError('');
    setSuccessMessage('');

  // Basic validation before moving to the next step
  if (currentStep === 1) {
   if (!profileData.fullName || !profileData.position || !profileData.department) {
    setError('Please fill in all employee information fields before proceeding.');
    return;
   }
  } else if (currentStep === 2) {
   if (!profileData.branch || !profileData.phone || !profileData.email) {
    setError('Please fill in all contact information fields before proceeding.');
    return;
   }
  }
  setCurrentStep(prev => prev + 1);
 };

 const prevStep = () => {
  setCurrentStep(prev => prev - 1);
  setError('');
    setSuccessMessage('Welcome! Please complete your employee profile to access the dashboard.'); // Restore welcome message
 };

 const handleSignUpClick = () => {
  setIsRightPanelActive(true);
  setError('');
  setShowProfileSetup(false);
  setSuccessMessage('');
  setCurrentStep(1);
 };

 const handleSignInClick = () => {
  setIsRightPanelActive(false);
  setError('');
  setShowProfileSetup(false);
  setSuccessMessage('');
  // Ensure failed attempts error message is cleared when switching views
  if (failedAttempts >= MAX_ATTEMPTS) setFailedAttempts(0);
 };

 const backToLogin = () => {
  // Ensures the user is signed out if they navigate away from setup
  if (auth.currentUser) {
   auth.signOut();
  }
  setShowProfileSetup(false);
  setCurrentStep(1);
  setError('');
  setSuccessMessage('');
 };

 // Profile Setup Steps (omitted for brevity, as they were not changed)
 const renderProfileStep = () => {
  switch (currentStep) {
   case 1:
    return (
     <div className="profile-step active">
      <h2>Employee Information (1/3)</h2>
      
      <input type="text" id="fullName" name="fullName" value={profileData.fullName} onChange={handleProfileInputChange} placeholder="Full Name" required />
      <input type="text" id="position" name="position" value={profileData.position} onChange={handleProfileInputChange} placeholder="Position / Job Title" required />
      <input type="text" id="department" name="department" value={profileData.department} onChange={handleProfileInputChange} placeholder="Department" required />
     </div>
    );
   
   case 2:
    return (
     <div className="profile-step active">
      <h2>Contact Information (2/3)</h2>
      
      <select id="branch" name="branch" value={profileData.branch} onChange={handleProfileInputChange} required>
       <option value="" disabled>Select your Branch</option>
       {branches.map(branch => (
        <option key={branch} value={branch}>{branch}</option>
       ))}
      </select>
      
      <input type="email" id="email" name="email" value={profileData.email} onChange={handleProfileInputChange} placeholder="Email (Pre-filled)" required disabled />
      
      <input type="tel" id="phone" name="phone" value={profileData.phone} onChange={handleProfileInputChange} placeholder="Phone Number (e.g., 09XX-XXX-XXXX)" required />
     </div>
    );
   
   case 3:
    return (
     <div className="profile-step active">
      <h2>Review & Complete (3/3)</h2>
      <div className="profile-review">
                <h3>Please Verify Your Details</h3>
       <div className="review-item"><strong>Full Name:</strong> <span>{profileData.fullName}</span></div>
       <div className="review-item"><strong>Position:</strong> <span>{profileData.position}</span></div>
       <div className="review-item"><strong>Department:</strong> <span>{profileData.department}</span></div>
       <div className="review-item"><strong>Branch:</strong> <span>{profileData.branch || 'N/A'}</span></div>
       <div className="review-item"><strong>Email:</strong> <span>{profileData.email}</span></div>
       <div className="review-item"><strong>Phone:</strong> <span>{profileData.phone}</span></div>
      </div>
     </div>
    );
   
   default:
    return null;
  }
 };

 const isLockedOut = failedAttempts >= MAX_ATTEMPTS;

 return (
  <div className={`login-container ${isRightPanelActive ? 'right-panel-active' : ''} ${showProfileSetup ? 'profile-setup-active' : ''}`}>
   <div className={`container ${isRightPanelActive ? 'right-panel-active' : ''} ${showProfileSetup ? 'profile-setup-active' : ''}`} id="container">
    
    {/* Sign In Form */}
    {!showProfileSetup && (
     <div className="form-container sign-in-container">
      <form onSubmit={handleLogin}>
       <img src={logo} alt="Logo" className="logo" />
       <h1>Welcome Back</h1>
       <p>Sign in to your SM CRM dashboard</p>
       
       {/* Display error/success messages */}
       {error && !isRightPanelActive && <div className="error-message">{error}</div>}
       {successMessage && !isRightPanelActive && <div className="success-message">{successMessage}</div>}
       
       <input 
        type="email" 
        name="loginEmail"
        placeholder="Email" 
        required 
        value={formData.loginEmail}
        onChange={handleInputChange}
        disabled={isLockedOut} 
       />
                
              {/* Login Password Input with ICON Toggle */}
              <div className="password-input-wrapper">
        <input 
         type={showLoginPassword ? 'text' : 'password'} 
         name="loginPassword"
         placeholder="Password" 
         required 
         value={formData.loginPassword}
         onChange={handleInputChange}
         disabled={isLockedOut}
        />
                <span 
                  className="password-toggle icon-toggle"
                  onClick={toggleLoginPasswordVisibility}
                  aria-label={showLoginPassword ? 'Hide password' : 'Show password'}
                >
                  {/* Icon Swap using your chosen aesthetic */}
                  {showLoginPassword ? <EyeIcon /> : <EyeSlashIcon />} 
                </span>
              </div>
              {/* End Login Password Input with ICON Toggle */}
       
       <button 
        type="button" 
        onClick={handlePasswordReset} 
        className="ghost-text-button" 
        disabled={loading || isLockedOut} 
       >
        Forgot your password?
       </button>
       
       <button 
        type="submit" 
        disabled={loading || isLockedOut} 
       >
        {loading ? 'Logging in...' : isLockedOut ? 'Locked Out' : 'Login'}
       </button>
      </form>
     </div>
    )}

    {/* Sign Up Form (Updated) */}
    {!showProfileSetup && (
     <div className="form-container sign-up-container">
      <form onSubmit={handleSignUp}>
       <img src={logo} alt="Logo" className="logo" />
       <h1>Create Account</h1>
       <p>Join SM CRM and manage your customers effectively</p>
       
       {error && isRightPanelActive && <div className="error-message">{error}</div>}
       {successMessage && isRightPanelActive && <div className="success-message">{successMessage}</div>}
       
       <input type="text" name="signupFullName" placeholder="Full Name" required value={formData.signupFullName} onChange={handleInputChange} />
       <input type="email" name="signupEmail" placeholder="Email" required value={formData.signupEmail} onChange={handleInputChange} />
       <input type="text" name="signupUsername" placeholder="Username" required value={formData.signupUsername} onChange={handleInputChange} />

              {/* 1. Signup Password Input with ICON Toggle */}
              <div className="password-input-wrapper">
        <input 
         type={showSignupPassword ? 'text' : 'password'} 
         name="signupPassword"
         placeholder="Password (8+ chars, Uppercase, Lowercase, Number, Special Char)" 
         required 
         value={formData.signupPassword}
         onChange={handleInputChange}
        />
                <span 
                  className="password-toggle icon-toggle"
                  onClick={toggleSignupPasswordVisibility}
                  aria-label={showSignupPassword ? 'Hide password' : 'Show password'}
                >
                  {showSignupPassword ? <EyeIcon /> : <EyeSlashIcon />}
                </span>
              </div>
              {/* End 1. Signup Password Input with ICON Toggle */}

              {/* 2. Confirm Password Input with ICON Toggle (NEW) */}
              <div className="password-input-wrapper">
        <input 
         type={showSignupConfirmPassword ? 'text' : 'password'} 
         name="signupConfirmPassword"
         placeholder="Confirm Password" 
         required 
         value={formData.signupConfirmPassword}
         onChange={handleInputChange}
        />
                <span 
                  className="password-toggle icon-toggle"
                  onClick={toggleSignupConfirmPasswordVisibility}
                  aria-label={showSignupConfirmPassword ? 'Hide confirmation password' : 'Show confirmation password'}
                >
                  {showSignupConfirmPassword ? <EyeIcon /> : <EyeSlashIcon />}
                </span>
              </div>
              {/* End 2. Confirm Password Input with ICON Toggle */}

       <button type="submit" disabled={loading}>
        {loading ? 'Creating Account...' : 'Sign Up'}
       </button>
      </form>
     </div>
    )}


    {/* Profile Setup Form (omitted for brevity) */}
    {showProfileSetup && (
     <div className="form-container profile-setup-container">
      <form id="profileSetupForm">
       <img src={logo} alt="Logo" className="logo" />
       <h1>Complete Your Profile</h1>
       <p>Enter your employee information to finalize setup</p>
       
       {/* Step Indicator */}
       <div className="profile-setup-steps">
        <div className={`step ${currentStep >= 1 ? 'active' : ''}`}>1</div>
        <div className={`step ${currentStep >= 2 ? 'active' : ''}`}>2</div>
        <div className={`step ${currentStep >= 3 ? 'active' : ''}`}>3</div>
       </div>
       
       {/* Centralized Messaging for Profile Setup */}
       {error && <div className="error-message">{error}</div>}
       {successMessage && !loading && <div className="success-message">{successMessage}</div>}

       {renderProfileStep()}

       <div className="form-navigation">
        {/* Back to Login button always visible on step 1 */}
        {currentStep === 1 && (
          <button type="button" className="btn-back" onClick={backToLogin} disabled={loading}>
           Cancel & Back to Login
         </button>
        )}
        {/* Back button only visible on steps 2 and 3 */}
        {currentStep > 1 && currentStep < 4 && (
         <button type="button" className="btn-back" onClick={prevStep} disabled={loading}>
          Back
         </button>
        )}
        
        {currentStep < 3 ? (
         <button type="button" className="btn-next" onClick={nextStep} disabled={loading}>
          {loading ? 'Validating...' : 'Next'}
         </button>
        ) : (
         <button 
          type="button" 
          className="btn-complete" 
          onClick={handleSaveProfile}
          disabled={loading}
         >
          {loading ? 'Completing...' : 'Complete Setup'}
         </button>
        )}
      </div>
      
      <div style={{ height: '40px' }} /> {/* Placeholder for final margin/spacing */}
     </form>
     </div>
    )}


    {/* Overlay - Hide when profile setup is shown (omitted for brevity) */}
    {!showProfileSetup && (
     <div className="overlay-container">
      <div className="overlay">
       <div className="overlay-panel overlay-left">
        <h1>Welcome Back!</h1>
        <p>Already have an account? Sign in to continue.</p>
        <button className="ghost" onClick={handleSignInClick}>Login</button>
       </div>
       <div className="overlay-panel overlay-right">
        <h1>New Here?</h1>
        <p>Don't have an account? Create one to get started.</p>
        <button className="ghost" onClick={handleSignUpClick}>Sign Up</button>
       </div>
      </div>
     </div>
    )}
   </div>
  </div>
 );
};

export default Login;