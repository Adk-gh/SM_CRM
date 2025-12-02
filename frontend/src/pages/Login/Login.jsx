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
import emailjs from '@emailjs/browser';
import { auth, db } from '../../../firebase';
import logo from '../../assets/logo.jpg';

// --- CSS STYLES ---
const styles = `
:root {
  --dark-blue: #395A7F;
  --mid-blue: #6E9FC1;
  --pale-blue: #A3CAE9;
  --light-gray: #E9ECEE;
  --white: #ffffff;
  --muted: #ACACAC;
  --success: #2e7d32;
  --danger: #d32f2f;
  --shadow-lift: 0 14px 28px rgba(0,0,0,0.1), 0 10px 10px rgba(0,0,0,0.08);
  --radius: 12px;
  --transition: all 0.4s ease-in-out;
}

* { margin: 0; padding: 0; box-sizing: border-box; font-family: "Inter", system-ui, sans-serif; }

.login-page-wrapper {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100vh;
  width: 100vw;
  background: linear-gradient(135deg, var(--light-gray) 0%, var(--pale-blue) 100%);
  overflow: hidden;
  padding: 20px; /* Add padding around the main container on smaller screens */
}

.container {
  background-color: var(--white);
  border-radius: var(--radius);
  box-shadow: var(--shadow-lift);
  position: relative;
  overflow: hidden;
  /* Increased width and min-height for more space */
  width: 1000px; 
  max-width: 95%;
  min-height: 550px; 
  display: flex;
  transition: var(--transition);
}

.form-container {
  position: absolute;
  top: 0;
  height: 100%;
  transition: var(--transition);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  /* Increased padding for better internal spacing */
  padding: 40px 50px; 
  text-align: center;
}

.sign-in-container { left: 0; width: 50%; z-index: 2; }
.sign-up-container { left: 0; width: 50%; opacity: 0; z-index: 1; }

.container.right-panel-active .sign-in-container { transform: translateX(100%); opacity: 0; }
.container.right-panel-active .sign-up-container { transform: translateX(100%); opacity: 1; z-index: 5; }

.profile-setup-container {
  left: 0; width: 100%; height: 100%; z-index: 10; opacity: 0; pointer-events: none;
  background: var(--white); display: flex; flex-direction: column; align-items: center; justify-content: center;
  /* Increased padding for profile setup as well */
  padding: 40px 50px; 
}
.container.profile-setup-active .profile-setup-container { opacity: 1; pointer-events: all; z-index: 200; }

form {
  background-color: var(--white);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-direction: column;
  height: 100%;
  width: 100%;
  /* Ensure form takes up space and has gaps */
  gap: 15px; 
}

.logo { 
  width: 90px; /* Slightly bigger logo */
  height: 90px; 
  border-radius: 50%; 
  object-fit: cover; 
  margin-bottom: 25px; /* Increased space below logo */
  box-shadow: 0 4px 10px rgba(0,0,0,0.1); 
}
h1 { font-weight: 700; color: var(--dark-blue); margin-bottom: 10px; font-size: 28px; }
p { color: var(--dark-blue); font-size: 15px; margin-bottom: 30px; opacity: 0.8; }

input, select {
  background-color: #f4f8fb; border: 1px solid #e1e5e9; padding: 14px 18px; margin: 10px 0; /* More padding and margin */
  width: 100%; max-width: 340px; /* Slightly wider inputs */
  border-radius: 8px; font-size: 15px; color: var(--dark-blue); transition: var(--transition);
}
input:focus, select:focus { outline: none; border-color: var(--mid-blue); background-color: #fff; box-shadow: 0 0 0 3px rgba(110, 159, 193, 0.15); }

.password-input-wrapper { position: relative; width: 100%; max-width: 340px; margin: 10px 0; }
.password-input-wrapper input { width: 100%; max-width: 100%; margin: 0; padding-right: 45px; }
.password-toggle { position: absolute; right: 15px; top: 50%; transform: translateY(-50%); cursor: pointer; color: var(--muted); display: flex; }
.password-toggle:hover { color: var(--dark-blue); }

button {
  border-radius: 30px; border: none; background-color: var(--dark-blue); color: #ffffff;
  font-size: 14px; font-weight: 600; padding: 14px 50px; letter-spacing: 1px; text-transform: uppercase;
  transition: transform 80ms ease-in; margin-top: 30px; /* Increased margin top */
  cursor: pointer; box-shadow: 0 4px 10px rgba(57, 90, 127, 0.2);
}
button:active { transform: scale(0.95); }
button:focus { outline: none; }
button:disabled { opacity: 0.6; cursor: not-allowed; }

.ghost-text-button {
  background: none; color: var(--danger); padding: 8px; margin: 10px 0; font-size: 13px;
  text-transform: none; letter-spacing: 0; box-shadow: none; width: auto; display: inline-block;
}
.ghost-text-button:hover { text-decoration: underline; }

.overlay-container { position: absolute; top: 0; left: 50%; width: 50%; height: 100%; overflow: hidden; transition: transform 0.6s ease-in-out; z-index: 100; }
.container.right-panel-active .overlay-container { transform: translateX(-100%); }
.overlay {
  background: linear-gradient(to right, var(--dark-blue), var(--mid-blue)); color: #ffffff;
  position: relative; left: -100%; height: 100%; width: 200%; transform: translateX(0); transition: transform 0.6s ease-in-out;
}
.container.right-panel-active .overlay { transform: translateX(50%); }
.overlay-panel {
  position: absolute; display: flex; align-items: center; justify-content: center; flex-direction: column;
  /* Increased padding in overlay */
  padding: 0 60px; 
  text-align: center; top: 0; height: 100%; width: 50%; transform: translateX(0); transition: transform 0.6s ease-in-out;
}
.overlay-left { transform: translateX(-20%); }
.container.right-panel-active .overlay-left { transform: translateX(0); }
.overlay-right { right: 0; transform: translateX(0); }
.container.right-panel-active .overlay-right { transform: translateX(20%); }

button.ghost { background-color: transparent; border-color: #ffffff; border-width: 2px; margin-top: 25px; }

.profile-setup-container form { display: flex; flex-direction: column; justify-content: center; align-items: center; gap: 20px; }
.profile-setup-steps { display: flex; gap: 50px; position: relative; margin-bottom: 40px; }
.profile-setup-steps::before { content: ''; position: absolute; top: 50%; left: 0; right: 0; height: 2px; background: #e0e0e0; z-index: 0; }
.step {
  width: 45px; height: 45px; border-radius: 50%; background: white; border: 2px solid #e0e0e0; color: #ACACAC; font-weight: bold; font-size: 16px;
  display: flex; align-items: center; justify-content: center; z-index: 1; position: relative; transition: var(--transition);
}
.step.active { border-color: var(--dark-blue); background: var(--dark-blue); color: white; }

.profile-input-group { width: 100%; max-width: 420px; display: flex; flex-direction: column; gap: 15px; margin-bottom: 30px; }
.profile-input-group input, .profile-input-group select { max-width: 100%; margin: 0; }

.profile-review {
  background: #f8f9fa; border: 1px solid #e1e5e9; border-radius: 8px; padding: 25px; width: 100%; max-width: 420px; margin-bottom: 30px; font-size: 14px; text-align: left;
}
.review-item { display: flex; justify-content: space-between; margin-bottom: 12px; border-bottom: 1px dashed #e0e0e0; padding-bottom: 8px; }
.review-item strong { color: var(--dark-blue); font-weight: 600; }
.review-item span { color: #555; text-align: right; }

.form-navigation { display: flex; gap: 20px; width: 100%; max-width: 420px; justify-content: center; margin-top: 10px; }
.form-navigation button { width: 100%; margin: 0; padding: 14px 0; }
.btn-back { background-color: #90a4ae; }
.btn-back:hover { background-color: #78909c; }
.btn-complete { background-color: var(--success); }

.error-message { color: var(--danger); font-size: 13px; margin-bottom: 15px; background: #ffebee; padding: 12px; border-radius: 6px; width: 100%; max-width: 340px; }
.success-message { color: var(--success); font-size: 13px; margin-bottom: 15px; background: #e8f5e9; padding: 12px; border-radius: 6px; width: 100%; max-width: 340px; }

@media (max-width: 768px) {
  .container { min-height: 650px; width: 100%; border-radius: var(--radius); }
  .form-container { padding: 40px 30px; }
  .overlay-container { display: none; }
  .sign-in-container, .sign-up-container { width: 100%; position: absolute; }
  .sign-in-container { z-index: 5; opacity: 1; }
  .container.right-panel-active .sign-in-container { opacity: 0; z-index: 1; }
  .container.right-panel-active .sign-up-container { opacity: 1; z-index: 5; transform: none; }
  .mobile-toggle { display: block; margin-top: 25px; color: var(--mid-blue); font-size: 14px; cursor: pointer; text-decoration: underline; }
}
@media (min-width: 769px) { .mobile-toggle { display: none; } }
`;

// --- ICONS ---
const EyeIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
);
const EyeSlashIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M1 1l22 22"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/></svg>
);

const Login = () => {
  const [isRightPanelActive, setIsRightPanelActive] = useState(false);
  const [showProfileSetup, setShowProfileSetup] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    loginEmail: '', loginPassword: '', signupEmail: '', signupPassword: '', signupConfirmPassword: '', signupFullName: '', signupUsername: ''
  });
  const [profileData, setProfileData] = useState({
    fullName: '', position: '', department: '', branch: '', email: '', phone: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // 🔒 Security & 2FA State
  const [failedAttempts, setFailedAttempts] = useState(0);
  const MAX_ATTEMPTS = 5;
  const [is2FAEnabled, setIs2FAEnabled] = useState(false);
  const [twoFACode, setTwoFACode] = useState('');
  const [expected2FACode, setExpected2FACode] = useState('');
  const [twoFATimer, setTwoFATimer] = useState(0);

  // UI State
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [showSignupPassword, setShowSignupPassword] = useState(false);
  const [showSignupConfirmPassword, setShowSignupConfirmPassword] = useState(false);

  const branches = ['SM Megamall', 'SM Mall of Asia', 'SM North EDSA', 'SM City Cebu', 'SM City Davao'];

  useEffect(() => {
    const user = auth.currentUser;
    if (showProfileSetup && user) {
      setProfileData(prev => ({ ...prev, email: user.email, fullName: user.displayName || prev.fullName }));
    }
  }, [showProfileSetup]);

  useEffect(() => {
    let timerInterval;
    if (is2FAEnabled && twoFATimer > 0) {
      timerInterval = setInterval(() => setTwoFATimer(prev => prev - 1), 1000);
    } else if (twoFATimer === 0 && is2FAEnabled) {
      setError('Verification code expired. Please log in again.');
      setIs2FAEnabled(false);
      if (auth.currentUser) {
        setDoc(doc(db, 'users', auth.currentUser.uid), { is2FAPending: false }, { merge: true });
        signOut(auth);
      }
    }
    return () => clearInterval(timerInterval);
  }, [is2FAEnabled, twoFATimer]);

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError('');
  };

  const handleProfileInputChange = (e) => {
    setProfileData({ ...profileData, [e.target.name]: e.target.value });
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    if (failedAttempts >= MAX_ATTEMPTS) {
      setError(`Account locked. Please wait 30 seconds.`);
      return;
    }
    setLoading(true);
    setError('');
    
    try {
      const cred = await signInWithEmailAndPassword(auth, formData.loginEmail, formData.loginPassword);
      const user = cred.user;

      if (!user.emailVerified) {
        await signOut(auth);
        setError('Please verify your email address first.');
        setLoading(false);
        return;
      }

      // Start 2FA
      const code = Math.floor(100000 + Math.random() * 900000).toString();
      const templateParams = { to_email: user.email, to_name: user.displayName || "User", code: code };
      
      // Replace with your actual service ID and Template ID
      await emailjs.send("service_vg58qh8", "template_av0qj19", templateParams, "6XU-uQ7Og0d4oAykV");

      await setDoc(doc(db, 'users', user.uid), { is2FAPending: true }, { merge: true });
      setExpected2FACode(code);
      setIs2FAEnabled(true);
      setTwoFATimer(120);
      setSuccessMessage(`Code sent to ${user.email}`);
      setFormData(prev => ({ ...prev, loginPassword: '' }));

    } catch (err) {
      console.error(err);
      if (err.code === 'auth/invalid-credential') {
        setFailedAttempts(prev => prev + 1);
        setError('Invalid credentials.');
      } else {
        setError('Login failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleVerify2FACode = async (e) => {
    e.preventDefault();
    setLoading(true);
    const user = auth.currentUser;

    if (twoFACode === expected2FACode && user) {
      await setDoc(doc(db, 'users', user.uid), { is2FAPending: false }, { merge: true });
      
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      if (userDoc.exists() && !userDoc.data().profileCompleted) {
        setShowProfileSetup(true);
        setIs2FAEnabled(false);
      } else {
        setSuccessMessage('Login successful!');
        setIs2FAEnabled(false);
      }
    } else {
      setError('Invalid code.');
    }
    setLoading(false);
  };

  const handleSignUp = async (e) => {
    e.preventDefault();
    setLoading(true);
    if (formData.signupPassword !== formData.signupConfirmPassword) {
      setError("Passwords don't match."); setLoading(false); return;
    }
    try {
      const cred = await createUserWithEmailAndPassword(auth, formData.signupEmail, formData.signupPassword);
      await updateProfile(cred.user, { displayName: formData.signupFullName });
      await sendEmailVerification(cred.user);
      await setDoc(doc(db, 'users', cred.user.uid), {
        fullName: formData.signupFullName, email: formData.signupEmail, username: formData.signupUsername,
        createdAt: new Date(), role: 'user', profileCompleted: false, emailVerified: false, is2FAPending: false
      });
      await signOut(auth);
      setSuccessMessage('Account created! Please verify your email.');
      setIsRightPanelActive(false);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordReset = async () => {
    const email = formData.loginEmail;
    if (!email) {
      setError('Please enter your email address in the field above to reset your password.');
      setSuccessMessage('');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await sendPasswordResetEmail(auth, email);
      setSuccessMessage(`Password reset link successfully sent to ${email}.`);
      setFormData({ ...formData, loginEmail: '' });
    } catch (error) {
      if (error.code === 'auth/user-not-found') setError('No account found with that email address.');
      else if (error.code === 'auth/invalid-email') setError('Please enter a valid email address.');
      else setError(`Failed to send reset link: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProfile = async () => {
    setLoading(true);
    try {
      const user = auth.currentUser;
      await setDoc(doc(db, 'users', user.uid), { ...profileData, profileCompleted: true, is2FAPending: false }, { merge: true });
      setSuccessMessage('Profile saved! Redirecting...');
    } catch (error) {
      console.error(error);
      setError('Failed to save profile.');
    } finally {
      setLoading(false);
    }
  };

  // Profile Steps Render
  const renderProfileStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="profile-input-group">
            <h2 style={{fontSize: '20px', marginBottom: '20px', color: 'var(--dark-blue)', fontWeight: '700'}}>Employee Info (1/3)</h2>
            <input type="text" name="fullName" value={profileData.fullName} onChange={handleProfileInputChange} placeholder="Full Name" required />
            <input type="text" name="position" value={profileData.position} onChange={handleProfileInputChange} placeholder="Position / Job Title" required />
            <input type="text" name="department" value={profileData.department} onChange={handleProfileInputChange} placeholder="Department" required />
          </div>
        );
      case 2:
        return (
          <div className="profile-input-group">
            <h2 style={{fontSize: '20px', marginBottom: '20px', color: 'var(--dark-blue)', fontWeight: '700'}}>Contact Info (2/3)</h2>
            <select name="branch" value={profileData.branch} onChange={handleProfileInputChange} required>
              <option value="" disabled>Select Branch</option>
              {branches.map(b => <option key={b} value={b}>{b}</option>)}
            </select>
            <input type="email" name="email" value={profileData.email} disabled />
            <input type="tel" name="phone" value={profileData.phone} onChange={handleProfileInputChange} placeholder="Phone Number" required />
          </div>
        );
      case 3:
        return (
          <div className="profile-input-group">
            <h2 style={{fontSize: '20px', marginBottom: '20px', color: 'var(--dark-blue)', fontWeight: '700'}}>Review Details (3/3)</h2>
            <div className="profile-review">
              <div className="review-item"><strong>Name:</strong> <span>{profileData.fullName}</span></div>
              <div className="review-item"><strong>Pos:</strong> <span>{profileData.position}</span></div>
              <div className="review-item"><strong>Dept:</strong> <span>{profileData.department}</span></div>
              <div className="review-item"><strong>Branch:</strong> <span>{profileData.branch}</span></div>
              <div className="review-item"><strong>Phone:</strong> <span>{profileData.phone}</span></div>
            </div>
          </div>
        );
      default: return null;
    }
  };

  return (
    <div className="login-page-wrapper">
      <style>{styles}</style>
      <div className={`container ${isRightPanelActive ? 'right-panel-active' : ''} ${showProfileSetup ? 'profile-setup-active' : ''}`}>
        
        {/* --- SIGN IN FORM --- */}
        {!showProfileSetup && (
          <div className="form-container sign-in-container">
            <form onSubmit={is2FAEnabled ? handleVerify2FACode : handleLogin}>
              <img src={logo} alt="Logo" className="logo" />
              <h1>{is2FAEnabled ? 'Verify' : 'Welcome Back'}</h1>
              <p>{is2FAEnabled ? 'Enter code sent to email' : 'Sign in to your dashboard'}</p>
              
              {error && <div className="error-message">{error}</div>}
              {successMessage && <div className="success-message">{successMessage}</div>}

              {!is2FAEnabled ? (
                <>
                  <input type="email" name="loginEmail" placeholder="Email" value={formData.loginEmail} onChange={handleInputChange} required />
                  <div className="password-input-wrapper">
                    <input type={showLoginPassword ? "text" : "password"} name="loginPassword" placeholder="Password" value={formData.loginPassword} onChange={handleInputChange} required />
                    <span className="password-toggle" onClick={() => setShowLoginPassword(!showLoginPassword)}>{showLoginPassword ? <EyeIcon/> : <EyeSlashIcon/>}</span>
                  </div>
                  <button type="button" onClick={handlePasswordReset} className="ghost-text-button">Forgot Password?</button>
                  <button type="submit" disabled={loading}>{loading ? 'Loading...' : 'Login'}</button>
                  <span className="mobile-toggle" onClick={() => setIsRightPanelActive(true)}>Create Account</span>
                </>
              ) : (
                <>
                  <input type="text" value={twoFACode} onChange={(e) => setTwoFACode(e.target.value)} placeholder="6-Digit Code" maxLength="6" required />
                  <button type="submit" disabled={loading}>Verify</button>
                  <button type="button" className="ghost-text-button" onClick={() => setIs2FAEnabled(false)}>Cancel</button>
                </>
              )}
            </form>
          </div>
        )}

        {/* --- SIGN UP FORM --- */}
        {!showProfileSetup && (
          <div className="form-container sign-up-container">
            <form onSubmit={handleSignUp}>
              <h1>Create Account</h1>
              <p>Join SM CRM today</p>
              {error && isRightPanelActive && <div className="error-message">{error}</div>}
              
              <input type="text" name="signupFullName" placeholder="Full Name" value={formData.signupFullName} onChange={handleInputChange} required />
              <input type="email" name="signupEmail" placeholder="Email" value={formData.signupEmail} onChange={handleInputChange} required />
              <input type="text" name="signupUsername" placeholder="Username" value={formData.signupUsername} onChange={handleInputChange} required />
              
              <div className="password-input-wrapper">
                <input type={showSignupPassword ? "text" : "password"} name="signupPassword" placeholder="Password" value={formData.signupPassword} onChange={handleInputChange} required />
                <span className="password-toggle" onClick={() => setShowSignupPassword(!showSignupPassword)}>{showSignupPassword ? <EyeIcon/> : <EyeSlashIcon/>}</span>
              </div>
              <div className="password-input-wrapper">
                <input type={showSignupConfirmPassword ? "text" : "password"} name="signupConfirmPassword" placeholder="Confirm Password" value={formData.signupConfirmPassword} onChange={handleInputChange} required />
                <span className="password-toggle" onClick={() => setShowSignupConfirmPassword(!showSignupConfirmPassword)}>{showSignupConfirmPassword ? <EyeIcon/> : <EyeSlashIcon/>}</span>
              </div>

              <button type="submit" disabled={loading}>{loading ? 'Creating...' : 'Sign Up'}</button>
              <span className="mobile-toggle" onClick={() => setIsRightPanelActive(false)}>Login Instead</span>
            </form>
          </div>
        )}

        {/* --- PROFILE SETUP FORM --- */}
        <div className="profile-setup-container">
          <form>
            <img src={logo} alt="Logo" className="logo" style={{width:'70px', height:'70px', marginBottom:'15px'}} />
            <h1 style={{fontSize:'24px', marginBottom:'15px'}}>Setup Profile</h1>
            <div className="profile-setup-steps">
              <div className={`step ${currentStep >= 1 ? 'active' : ''}`}>1</div>
              <div className={`step ${currentStep >= 2 ? 'active' : ''}`}>2</div>
              <div className={`step ${currentStep >= 3 ? 'active' : ''}`}>3</div>
            </div>

            {error && <div className="error-message">{error}</div>}
            
            {renderProfileStep()}

            <div className="form-navigation">
              {currentStep === 1 && <button type="button" className="btn-back" onClick={() => {auth.signOut(); setShowProfileSetup(false);}}>Log Out</button>}
              {currentStep > 1 && <button type="button" className="btn-back" onClick={() => setCurrentStep(prev => prev - 1)}>Back</button>}
              
              {currentStep < 3 ? (
                <button type="button" onClick={() => setCurrentStep(prev => prev + 1)}>Next</button>
              ) : (
                <button type="button" className="btn-complete" onClick={handleSaveProfile} disabled={loading}>{loading ? 'Saving...' : 'Complete'}</button>
              )}
            </div>
          </form>
        </div>

        {/* --- OVERLAY --- */}
        {!showProfileSetup && (
          <div className="overlay-container">
            <div className="overlay">
              <div className="overlay-panel overlay-left">
                <h1>Welcome Back!</h1>
                <p>To keep connected with us please login with your personal info</p>
                <button className="ghost" onClick={() => setIsRightPanelActive(false)}>Sign In</button>
              </div>
              <div className="overlay-panel overlay-right">
                <h1>Hello, Friend!</h1>
                <p>Enter your personal details and start journey with us</p>
                <button className="ghost" onClick={() => setIsRightPanelActive(true)}>Sign Up</button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default Login;