import React, { useState } from 'react';
import { createUserWithEmailAndPassword, updateProfile, signInWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { auth, db } from '../../../firebase';
import logo from '../../assets/logo.jpg';
import './Login.css';

const Login = () => {
  const [isRightPanelActive, setIsRightPanelActive] = useState(false);
  const [showProfileSetup, setShowProfileSetup] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    loginEmail: '',
    loginPassword: '',
    signupEmail: '',
    signupPassword: '',
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


  // Mock branches data
  const branches = ['SM Megamall', 'SM Mall of Asia', 'SM North EDSA', 'SM City Cebu', 'SM City Davao'];

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleProfileInputChange = (e) => {
    setProfileData({
      ...profileData,
      [e.target.name]: e.target.value
    });
  };

  const handleSignUp = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (formData.signupPassword.length < 6) {
      setError('Password must be at least 6 characters');
      setLoading(false);
      return;
    }

    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth, 
        formData.signupEmail, 
        formData.signupPassword
      );
      
      const user = userCredential.user;

      await updateProfile(user, {
        displayName: formData.signupFullName
      });

      // Store basic user info with profileCompleted: false
      await setDoc(doc(db, 'users', user.uid), {
        fullName: formData.signupFullName,
        email: formData.signupEmail,
        username: formData.signupUsername,
        createdAt: new Date(),
        role: 'user',
        profileCompleted: false
      });

      console.log('User created successfully:', user);
      
      // Initialize profile data with signup information
      setProfileData({
        fullName: formData.signupFullName,
        position: '',
        department: '',
        branch: branches[0],
        email: formData.signupEmail,
        phone: ''
      });

      // Clear the signup form
      setFormData({
        ...formData,
        signupFullName: '',
        signupEmail: '',
        signupUsername: '',
        signupPassword: ''
      });

      // Show profile setup instead of redirecting
      setShowProfileSetup(true);
      setCurrentStep(1);
      
    } catch (error) {
      console.error('Error signing up:', error);
      
      if (error.code === 'auth/email-already-in-use') {
        setError('This email is already registered. Please use a different email or sign in.');
      } else if (error.code === 'auth/invalid-email') {
        setError('Invalid email address format.');
      } else if (error.code === 'auth/weak-password') {
        setError('Password is too weak. Please use a stronger password.');
      } else {
        setError(`Signup failed: ${error.message}`);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const userCredential = await signInWithEmailAndPassword(
        auth,
        formData.loginEmail,
        formData.loginPassword
      );
      
      const user = userCredential.user;
      console.log('User logged in successfully:', user);
      
      setFormData({
        ...formData,
        loginEmail: '',
        loginPassword: ''
      });
      
      // Let App.jsx handle the redirect based on profile completion status
      console.log('Login successful - waiting for App.jsx to redirect based on profile completion');
      
    } catch (error) {
      console.error('Error logging in:', error);
      
      if (error.code === 'auth/invalid-credential') {
        setError('Invalid email or password. Please try again.');
      } else if (error.code === 'auth/user-not-found') {
        setError('No account found with this email. Please sign up first.');
      } else if (error.code === 'auth/wrong-password') {
        setError('Incorrect password. Please try again.');
      } else {
        setError(`Login failed: ${error.message}`);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProfile = async () => {
    setLoading(true);
    try {
      const user = auth.currentUser;
      if (user) {
        // Use setDoc to ensure all fields are properly set
        await setDoc(doc(db, 'users', user.uid), {
          fullName: profileData.fullName,
          email: profileData.email,
          position: profileData.position,
          department: profileData.department,
          branch: profileData.branch,
          phone: profileData.phone,
          profileCompleted: true,
          createdAt: new Date(),
          updatedAt: new Date()
        });

        console.log('Profile completed successfully - App.jsx will detect the change and redirect');
        
        // Show success message
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
    setCurrentStep(prev => prev + 1);
  };

  const prevStep = () => {
    setCurrentStep(prev => prev - 1);
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
  };

  const backToSignupForm = () => {
    setShowProfileSetup(false);
    setCurrentStep(1);
  };

  // Profile Setup Steps
  const renderProfileStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="profile-step active">
            <h2>Employee Information</h2>
            
            <div className="form-group">
              <label htmlFor="fullName">Full Name</label>
              <input 
                type="text" 
                id="fullName" 
                name="fullName"
                value={profileData.fullName}
                onChange={handleProfileInputChange}
                placeholder="Enter your full name"
                required
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="position">Position</label>
              <input 
                type="text" 
                id="position" 
                name="position"
                value={profileData.position}
                onChange={handleProfileInputChange}
                placeholder="Enter your position"
                required
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="department">Department</label>
              <input 
                type="text" 
                id="department" 
                name="department"
                value={profileData.department}
                onChange={handleProfileInputChange}
                placeholder="Enter your department"
                required
              />
            </div>
          </div>
        );
      
      case 2:
        return (
          <div className="profile-step active">
            <h2>Contact Information</h2>
            
            <div className="form-group">
              <label htmlFor="branch">Branch</label>
              <select 
                id="branch" 
                name="branch"
                value={profileData.branch}
                onChange={handleProfileInputChange}
                required
              >
                <option value="" disabled>Select your branch</option>
                {branches.map(branch => (
                  <option key={branch} value={branch}>{branch}</option>
                ))}
              </select>
            </div>
            
            <div className="form-group">
              <label htmlFor="email">Email</label>
              <input 
                type="email" 
                id="email" 
                name="email"
                value={profileData.email}
                onChange={handleProfileInputChange}
                placeholder="Enter your email"
                required
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="phone">Phone</label>
              <input 
                type="tel" 
                id="phone" 
                name="phone"
                value={profileData.phone}
                onChange={handleProfileInputChange}
                placeholder="Enter your phone number"
                required
              />
            </div>
            
            
          </div>
        );
      
      case 3:
        return (
          <div className="profile-step active">
            <h2>Review & Complete</h2>
            <div className="profile-review">
              <div className="review-item">
                <strong>Full Name:</strong> {profileData.fullName}
              </div>
              <div className="review-item">
                <strong>Position:</strong> {profileData.position}
              </div>
              <div className="review-item">
                <strong>Department:</strong> {profileData.department}
              </div>
              <div className="review-item">
                <strong>Branch:</strong> {profileData.branch}
              </div>
              <div className="review-item">
                <strong>Email:</strong> {profileData.email}
              </div>
              <div className="review-item">
                <strong>Phone:</strong> {profileData.phone}
              </div>
            </div>
            <p className="review-note">
              You can update this information later from your profile settings.
            </p>
          </div>
        );
      
      default:
        return null;
    }
  };

  return (
    <div className={`login-container ${isRightPanelActive ? 'right-panel-active' : ''} ${showProfileSetup ? 'profile-setup-active' : ''}`}>
      <div className={`container ${isRightPanelActive ? 'right-panel-active' : ''} ${showProfileSetup ? 'profile-setup-active' : ''}`} id="container">
        {/* Sign In Form */}
        <div className="form-container sign-in-container">
          <form onSubmit={handleLogin}>
            <img src={logo} alt="Logo" className="logo" />
            <h1>Welcome Back</h1>
            <p>Sign in to your SM CRM dashboard</p>
            
            {error && !isRightPanelActive && !showProfileSetup && <div className="error-message">{error}</div>}
            {successMessage && !isRightPanelActive && <div className="success-message">{successMessage}</div>}
            
            <input 
              type="email" 
              name="loginEmail"
              placeholder="Email" 
              required 
              value={formData.loginEmail}
              onChange={handleInputChange}
            />
            <input 
              type="password" 
              name="loginPassword"
              placeholder="Password" 
              required 
              value={formData.loginPassword}
              onChange={handleInputChange}
            />
            <button type="submit" disabled={loading}>
              {loading ? 'Logging in...' : 'Login'}
            </button>
          </form>
        </div>

        {/* Sign Up Form */}
        <div className="form-container sign-up-container">
          <form onSubmit={handleSignUp}>
            <img src={logo} alt="Logo" className="logo" />
            <h1>Create Account</h1>
            <p>Join SM CRM and manage your customers effectively</p>
            
            {error && isRightPanelActive && !showProfileSetup && <div className="error-message">{error}</div>}
            {successMessage && isRightPanelActive && <div className="success-message">{successMessage}</div>}
            
            <input 
              type="text" 
              name="signupFullName"
              placeholder="Full Name" 
              required 
              value={formData.signupFullName}
              onChange={handleInputChange}
            />
            <input 
              type="email" 
              name="signupEmail"
              placeholder="Email" 
              required 
              value={formData.signupEmail}
              onChange={handleInputChange}
            />
            <input 
              type="text" 
              name="signupUsername"
              placeholder="Username" 
              required 
              value={formData.signupUsername}
              onChange={handleInputChange}
            />
            <input 
              type="password" 
              name="signupPassword"
              placeholder="Password" 
              required 
              value={formData.signupPassword}
              onChange={handleInputChange}
            />
            <button type="submit" disabled={loading}>
              {loading ? 'Creating Account...' : 'Sign Up'}
            </button>
          </form>
        </div>

        {/* Profile Setup Form - Separate Container */}
        <div className="form-container profile-setup-container">
          <form id="profileSetupForm">
            <img src={logo} alt="Logo" className="logo" />
            <h1>Complete Your Profile</h1>
            <p>Enter your employee information</p>
            
            {/* Step Indicator */}
            <div className="profile-setup-steps">
              <div className={`step ${currentStep >= 1 ? 'active' : ''}`}>1</div>
              <div className={`step ${currentStep >= 2 ? 'active' : ''}`}>2</div>
              <div className={`step ${currentStep >= 3 ? 'active' : ''}`}>3</div>
            </div>
            
            {error && <div className="error-message">{error}</div>}
            {successMessage && <div className="success-message">{successMessage}</div>}

            {renderProfileStep()}

            <div className="form-navigation">
              {currentStep > 1 ? (
                <button type="button" className="btn-back" onClick={prevStep}>
                  Back
                </button>
              ) : (
                <button type="button" className="btn-back" onClick={backToSignupForm}>
                  Back to Sign Up
                </button>
              )}
              
              {currentStep < 3 ? (
                <button type="button" className="btn-next" onClick={nextStep}>
                  Next
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
          </form>
        </div>

        {/* Overlay - Hide when profile setup is shown */}
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