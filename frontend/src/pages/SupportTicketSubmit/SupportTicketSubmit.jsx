import React, { useState, useRef, useEffect } from 'react';
import { 
  Ticket, User, Mail, Phone, MapPin, 
  AlertCircle, FileText, Paperclip, Send, 
  CheckCircle, Loader2, X, AlertTriangle,
  Moon, Sun, MoreHorizontal
} from 'lucide-react';

// NOTE: We removed 'addDoc' and 'db' imports because we are now writing via the Vercel API
import ReCAPTCHA from "react-google-recaptcha";

const SM_BRANCHES = [
  { value: 'sm-san-pablo', label: 'SM City San Pablo' }
];

const ISSUE_CATEGORIES = [
  { value: 'technical', label: 'Technical Issue', icon: '💻' },
  { value: 'billing', label: 'Billing & Payments', icon: '💳' },
  { value: 'access', label: 'Account Access', icon: '🔐' },
  { value: 'stock_issue', label: 'Inventory Stock Issue', icon: '📦' },
  { value: 'feature', label: 'Feature Request', icon: '✨' },
  { value: 'bug', label: 'Report a Bug', icon: '🐛' },
  { value: 'general', label: 'General Inquiry', icon: '❓' },
  // ADDED: Others Category
  { value: 'others', label: 'Others / Unspecified', icon: '🔹' }
];

const SupportTicketSubmit = () => {
  const fileInputRef = useRef(null);
  const captchaRef = useRef(null);

  const [theme, setTheme] = useState(localStorage.getItem('sm-theme') || 'light');

  useEffect(() => {
    document.body.setAttribute('data-theme', theme);
    localStorage.setItem('sm-theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(theme === 'light' ? 'dark' : 'light');
  };

  const [formData, setFormData] = useState({
    userName: '',
    userEmail: '',
    userPhone: '',
    smBranch: 'sm-san-pablo',
    issueCategory: '',
    issueTitle: '',
    issueDescription: '',
    files: []
  });

  const [uiState, setUiState] = useState({
    loading: false,
    submitted: false,
    ticketId: '',
    dragActive: false,
    message: null
  });

  const [captchaToken, setCaptchaToken] = useState(null);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const newFiles = Array.from(e.target.files);
      setFormData(prev => ({ ...prev, files: [...prev.files, ...newFiles] }));
    }
  };

  const removeFile = (index) => {
    setFormData(prev => ({
      ...prev,
      files: prev.files.filter((_, i) => i !== index)
    }));
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setUiState(prev => ({ ...prev, dragActive: true }));
    } else if (e.type === "dragleave") {
      setUiState(prev => ({ ...prev, dragActive: false }));
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setUiState(prev => ({ ...prev, dragActive: false }));
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const newFiles = Array.from(e.dataTransfer.files);
      setFormData(prev => ({ ...prev, files: [...prev.files, ...newFiles] }));
    }
  };

  const onCaptchaChange = (token) => {
    setCaptchaToken(token);
  };

  // --- CLOUDINARY UPLOAD FUNCTION ---
  const uploadFileToCloudinary = async (file) => {
    const cloudName = "dc7etbsfe";
    const uploadPreset = "image_upload";

    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', uploadPreset);

    try {
      const response = await fetch(
        `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
        {
          method: 'POST',
          body: formData,
        }
      );

      if (!response.ok) {
        throw new Error('Cloudinary upload failed');
      }

      const data = await response.json();

      return {
        name: file.name,
        size: file.size,
        type: file.type,
        fileUrl: data.secure_url, 
        uploadedAt: new Date().toISOString()
      };

    } catch (error) {
      console.error("Upload Error:", error);
      throw error;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // 1. Check if Captcha is solved on Client Side
    if (!captchaToken) {
        setUiState(prev => ({
            ...prev,
            message: { type: 'error', text: 'Please complete the reCAPTCHA check.' }
        }));
        return;
    }

    setUiState(prev => ({ ...prev, loading: true, message: null }));

    try {
      // 2. Upload Attachments (Client Side)
      let uploadedAttachments = [];
      if (formData.files.length > 0) {
        uploadedAttachments = await Promise.all(
          formData.files.map(file => uploadFileToCloudinary(file))
        );
      }

      // 3. Prepare Payload
      // Note: We are sending 'captchaToken' to the server for verification
      const ticketPayload = {
        userName: formData.userName,
        userEmail: formData.userEmail,
        userPhone: formData.userPhone,
        smBranch: formData.smBranch,
        branchLabel: SM_BRANCHES.find(b => b.value === formData.smBranch)?.label || 'SM City San Pablo',
        issueCategory: formData.issueCategory,
        issueTitle: formData.issueTitle,
        issueDescription: formData.issueDescription,
        categoryLabel: ISSUE_CATEGORIES.find(cat => cat.value === formData.issueCategory)?.label || 'N/A',
        attachments: uploadedAttachments,

        // IMPORTANT: Send the token to Vercel
        captchaToken: captchaToken
      };

      // 4. Send to Vercel API Route
      // ✅ FIXED: Changed URL from 'submit-ticket' to 'submitTicket' to match backend filename
      const response = await fetch('https://sm-crm-rho.vercel.app/api/submitTicket', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(ticketPayload)
      });

      const result = await response.json();

      if (!response.ok) {
        // This handles if the Server says "Captcha Invalid"
        throw new Error(result.message || 'Server validation failed');
      }

      // 5. Success
      setUiState({
        loading: false,
        submitted: true,
        ticketId: result.id, // The ID returned by Vercel
        dragActive: false,
        message: { 
          type: 'success', 
          text: `Ticket ${result.id} submitted successfully! We'll get back to you soon.`
        }
      });

    } catch (error) {
      console.error('Error submitting ticket:', error);
      
      let errorMessage = 'Failed to submit ticket. Please try again.';
      
      if (error.message.includes('Cloudinary')) {
        errorMessage = 'Image upload failed. Please try a smaller image.';
      } else if (error.message) {
        // Use the error message from the server (e.g. "Captcha verification failed")
        errorMessage = error.message;
      }
      
      setUiState(prev => ({
        ...prev,
        loading: false,
        message: { 
          type: 'error', 
          text: errorMessage
        }
      }));
    }
  };

  const resetForm = () => {
    setFormData({
      userName: '',
      userEmail: '',
      userPhone: '',
      smBranch: 'sm-san-pablo',
      issueCategory: '',
      issueTitle: '',
      issueDescription: '',
      files: []
    });
    setUiState({
      loading: false,
      submitted: false,
      ticketId: '',
      dragActive: false,
      message: null
    });
    setCaptchaToken(null);
    if (captchaRef.current) {
        captchaRef.current.reset();
    }
  };

  const MessageNotification = ({ message, onDismiss }) => {
    if (!message) return null;

    return (
      <div className={`fixed top-5 right-5 z-50 p-5 pr-12 rounded-xl shadow-xl flex items-start gap-3 animate-[slideIn_0.3s_ease-out] max-w-sm sm:max-w-md ${
        message.type === 'success' ? 'bg-[#48BB78] text-white' : 'bg-[#F56565] text-white'
      }`}>
        {message.type === 'success' ? (
          <CheckCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
        ) : (
          <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" />
        )}
        <span className="font-medium flex-grow">{message.text}</span>
        <button 
          onClick={onDismiss} 
          className="absolute top-2.5 right-2.5 bg-black/10 hover:bg-black/20 text-inherit border-none cursor-pointer opacity-70 hover:opacity-100 flex items-center justify-center p-1 rounded-full w-6 h-6 transition-all"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    );
  };

  useEffect(() => {
    const styleSheet = document.createElement("style");
    styleSheet.innerText = `
      @keyframes slideIn {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
      }
    `;
    document.head.appendChild(styleSheet);
    return () => document.head.removeChild(styleSheet);
  }, []);

  // Common Styles
  const inputClasses = "w-full px-4 py-3 border border-[#D1D5DB] dark:border-[#4A5568] rounded-xl text-base bg-white dark:bg-[#1E2A38] text-[#395A7F] dark:text-[#E9ECEE] placeholder-gray-500 dark:placeholder-gray-500 focus:outline-none focus:ring-[3px] focus:ring-[#395A7F]/10 focus:border-[#395A7F] dark:focus:border-[#63B3ED] hover:border-[#A0AEC0] transition-all shadow-sm";
  const labelClasses = "text-sm font-semibold text-[#57789B] dark:text-[#A3CAE9] mb-2 tracking-wide block";
  const sectionTitleClasses = "text-[1.4rem] font-bold text-[#395A7F] dark:text-[#E9ECEE] mb-6 flex items-center gap-3 pb-3 border-b-2 border-[#A3CAE9] dark:border-[#4299E1]";

  return (
    <div className={theme === 'dark' ? 'dark' : ''}>
      <div className="min-h-screen flex flex-col items-center justify-center p-5 font-sans bg-gradient-to-br from-[#F4F4F4] to-[#A3CAE9] dark:from-[#1E2A38] dark:to-[#2C3E50] text-[#395A7F] dark:text-[#E9ECEE] transition-colors duration-300">
        
        {/* Theme Toggle */}
        <div className="absolute top-5 right-5 z-40">
          <button 
            onClick={toggleTheme}
            className="p-3 rounded-full bg-white dark:bg-[#2C3E50] shadow-md hover:shadow-lg transition-all text-[#395A7F] dark:text-[#E9ECEE] border border-[#D1D5DB] dark:border-[#4A5568]"
          >
            {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
          </button>
        </div>

        <MessageNotification message={uiState.message} onDismiss={() => setUiState(prev => ({ ...prev, message: null }))} />

        {/* Card Container */}
        <div className="w-full max-w-[800px] flex flex-col max-h-[90vh] bg-white dark:bg-[#1E2A38] rounded-2xl shadow-2xl dark:shadow-[0_20px_40px_rgba(0,0,0,0.4)] overflow-hidden border border-[#D1D5DB] dark:border-[#4A5568]">
          
          {/* Header */}
          <div className="flex-shrink-0 p-8 sm:p-10 text-center text-white bg-gradient-to-br from-[#6E9FC1] to-[#395A7F] dark:from-[#68D391] dark:to-[#63B3ED]">
            {uiState.submitted ? (
              <>
                 <h1 className="text-2xl sm:text-[2rem] font-extrabold mb-3 flex items-center justify-center gap-3 text-white">
                  <CheckCircle className="w-8 h-8" /> Ticket Submitted Successfully
                </h1>
                <p className="text-lg opacity-100 font-normal m-0 text-white">
                  We have received your support request and will get back to you shortly.
                </p>
              </>
            ) : (
              <>
                <h1 className="text-2xl sm:text-[2rem] font-extrabold mb-3 flex items-center justify-center gap-3 text-white">
                  <Ticket className="w-8 h-8" /> Support Ticket Submission
                </h1>
                <p className="text-lg opacity-100 font-normal m-0 text-white">
                  Report an issue or request assistance from our support team
                </p>
              </>
            )}
          </div>

          {/* Content Area */}
          <div className="flex-grow overflow-y-auto p-6 sm:p-10 bg-[#F4F4F4] dark:bg-[#2C3E50]">
            
            {uiState.submitted ? (
              // SUCCESS VIEW
              <div className="flex flex-col items-center justify-center text-center max-w-xl mx-auto py-10">
                <div className="mb-6 flex justify-center w-full">
                  <CheckCircle className="w-20 h-20 text-[#48BB78] dark:text-[#68D391]" />
                </div>
                <h2 className="text-[1.75rem] font-bold mb-3 text-[#395A7F] dark:text-[#E9ECEE]">Submission Confirmed!</h2>
                <p className="text-lg mb-8 leading-relaxed max-w-[80%] text-[#7A7A7A] dark:text-[#B0B0B0]">
                  A confirmation email has been sent to <strong>{formData.userEmail}</strong>.
                </p>

                <div className="bg-[#A3CAE9] text-[#395A7F] px-6 py-4 rounded-xl mb-8 font-bold text-lg border border-[#395A7F] shadow-sm inline-block break-all max-w-full">
                  Ticket ID: {uiState.ticketId}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 w-full p-6 bg-[#F4F4F4] dark:bg-[#1E2A38] rounded-xl mb-8">
                  <div className="col-span-1 md:col-span-2 w-full pb-5 mb-2.5 border-b border-[#D1D5DB] dark:border-[#4A5568] flex flex-col items-center gap-1.5">
                    <span className="text-xs font-semibold uppercase tracking-wider text-[#7A7A7A] dark:text-[#A3CAE9]">Status:</span>
                    <span className="text-lg font-bold text-[#48BB78] bg-[#48BB78]/10 px-3 py-1 rounded-full inline-block">Open</span>
                  </div>
                  <div className="flex flex-col items-center gap-1.5 w-full">
                    <span className="text-xs font-semibold uppercase tracking-wider text-[#7A7A7A] dark:text-[#A3CAE9]">Branch:</span>
                    <span className="text-lg font-bold text-[#395A7F] dark:text-[#E9ECEE] text-center">
                      {SM_BRANCHES.find(b => b.value === formData.smBranch)?.label || 'SM City San Pablo'}
                    </span>
                  </div>
                  <div className="flex flex-col items-center gap-1.5 w-full">
                    <span className="text-xs font-semibold uppercase tracking-wider text-[#7A7A7A] dark:text-[#A3CAE9]">Category:</span>
                    <span className="text-lg font-bold text-[#395A7F] dark:text-[#E9ECEE] text-center">
                      {ISSUE_CATEGORIES.find(cat => cat.value === formData.issueCategory)?.label || 'N/A'}
                    </span>
                  </div>
                </div>

                <button
                  onClick={resetForm}
                  className="w-full max-w-[300px] rounded-xl border-none bg-gradient-to-br from-[#48BB78] to-[#389E62] dark:from-[#68D391] dark:to-[#68D391] text-white text-base font-semibold px-8 py-4 shadow-[0_4px_12px_rgba(72,187,120,0.2)] hover:shadow-[0_6px_20px_rgba(72,187,120,0.3)] hover:-translate-y-0.5 transition-all duration-300 cursor-pointer"
                >
                  Submit Another Ticket
                </button>
              </div>
            ) : (
              // FORM VIEW
              <form onSubmit={handleSubmit} className="flex flex-col gap-0 bg-[#F4F4F4] dark:bg-[#2C3E50]">
                
                {/* Contact Section */}
                <div className="mb-10 pb-8 border-b border-[#D1D5DB] dark:border-[#4A5568]">
                  <h3 className={sectionTitleClasses}>
                    <User className="w-6 h-6 text-[#395A7F] dark:text-[#63B3ED]" /> Contact Information
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div className="flex flex-col">
                      <label htmlFor="userName" className={labelClasses}>Full Name *</label>
                      <input
                        type="text"
                        id="userName"
                        name="userName"
                        value={formData.userName}
                        onChange={handleInputChange}
                        placeholder="Enter your full name"
                        required
                        className={inputClasses}
                      />
                    </div>

                    <div className="flex flex-col">
                      <label htmlFor="userEmail" className={labelClasses}>Email Address *</label>
                      <input
                        type="email"
                        id="userEmail"
                        name="userEmail"
                        value={formData.userEmail}
                        onChange={handleInputChange}
                        placeholder="Enter your email"
                        required
                        className={inputClasses}
                      />
                    </div>

                    <div className="flex flex-col">
                      <label htmlFor="userPhone" className={labelClasses}>Phone Number</label>
                      <input
                        type="tel"
                        id="userPhone"
                        name="userPhone"
                        value={formData.userPhone}
                        onChange={handleInputChange}
                        placeholder="Enter your phone number"
                        className={inputClasses}
                      />
                    </div>

                    <div className="flex flex-col">
                      <label htmlFor="smBranch" className={labelClasses}>Branch Location *</label>
                      <div className="relative">
                        <select
                          id="smBranch"
                          name="smBranch"
                          value={formData.smBranch}
                          onChange={handleInputChange}
                          required
                          className={`${inputClasses} appearance-none cursor-pointer`}
                        >
                          {SM_BRANCHES.map(branch => (
                            <option key={branch.value} value={branch.value}>{branch.label}</option>
                          ))}
                        </select>
                        <div className="absolute inset-y-0 right-0 flex items-center px-4 pointer-events-none text-gray-500">
                           <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Issue Details Section */}
                <div className="mb-0">
                  <h3 className={sectionTitleClasses}>
                    <AlertCircle className="w-6 h-6 text-[#395A7F] dark:text-[#63B3ED]" /> Issue Details
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div className="col-span-1 md:col-span-2 flex flex-col">
                      <label htmlFor="issueCategory" className={labelClasses}>Category *</label>
                      <div className="relative">
                        <select
                          id="issueCategory"
                          name="issueCategory"
                          value={formData.issueCategory}
                          onChange={handleInputChange}
                          required
                          className={`${inputClasses} appearance-none cursor-pointer`}
                        >
                          <option value="">Select Category</option>
                          {ISSUE_CATEGORIES.map(cat => (
                            <option key={cat.value} value={cat.value}>
                              {cat.icon} {cat.label}
                            </option>
                          ))}
                        </select>
                          <div className="absolute inset-y-0 right-0 flex items-center px-4 pointer-events-none text-gray-500">
                           <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                        </div>
                      </div>
                    </div>

                    <div className="col-span-1 md:col-span-2 flex flex-col">
                      <label htmlFor="issueTitle" className={labelClasses}>Subject *</label>
                      <input
                        type="text"
                        id="issueTitle"
                        name="issueTitle"
                        value={formData.issueTitle}
                        onChange={handleInputChange}
                        placeholder="Brief summary of the issue"
                        required
                        className={inputClasses}
                      />
                    </div>

                    <div className="col-span-1 md:col-span-2 flex flex-col">
                      <label htmlFor="issueDescription" className={labelClasses}>Description *</label>
                      <textarea
                        id="issueDescription"
                        name="issueDescription"
                        value={formData.issueDescription}
                        onChange={handleInputChange}
                        placeholder="Please describe the issue in detail..."
                        required
                        rows="6"
                        className={`${inputClasses} min-h-[120px] resize-y leading-relaxed`}
                      />
                    </div>
                  </div>

                  {/* Attachments Section */}
                  <div className="mt-5 col-span-1 md:col-span-2 flex flex-col">
                    <label className={labelClasses}>Attachments (Optional)</label>
                    <div 
                      className={`
                        border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all duration-300 mb-4 bg-white dark:bg-[#1E2A38]
                        ${uiState.dragActive 
                          ? 'border-[#395A7F] dark:border-[#63B3ED] bg-[#A3CAE9] dark:bg-[#4299E1] -translate-y-[1px] shadow-md' 
                          : 'border-[#D1D5DB] dark:border-[#4A5568] hover:border-[#395A7F] dark:hover:border-[#63B3ED] hover:bg-[#A3CAE9] dark:hover:bg-[#4299E1]/20 hover:-translate-y-[1px] hover:shadow-sm'
                        }
                      `}
                      onDragEnter={handleDrag}
                      onDragLeave={handleDrag}
                      onDragOver={handleDrag}
                      onDrop={handleDrop}
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <input
                        ref={fileInputRef}
                        type="file"
                        multiple
                        onChange={handleFileChange}
                        className="hidden"
                      />
                      <div className="mb-3 text-[#395A7F] dark:text-[#63B3ED] flex justify-center">
                        <Paperclip className="w-12 h-12" />
                      </div>
                      <p className="text-base text-[#57789B] dark:text-[#A3CAE9] font-medium mb-2">
                        <span className="text-[#395A7F] dark:text-[#63B3ED] font-semibold">Click to upload</span> or drag files here
                      </p>
                      <span className="text-sm text-[#7A7A7A] dark:text-[#B0B0B0] font-normal">Maximum file size: 10MB (Images, PDF, Documents)</span>
                    </div>

                    {formData.files.length > 0 && (
                      <div className="flex flex-col gap-2">
                        {formData.files.map((file, idx) => (
                          <div key={idx} className="flex justify-between items-center p-4 bg-white dark:bg-[#1E2A38] border border-[#D1D5DB] dark:border-[#4A5568] rounded-xl transition-all duration-200 shadow-sm hover:border-[#6E9FC1] dark:hover:border-[#68D391] hover:-translate-y-[1px] hover:shadow-md">
                            <div className="flex items-center gap-3 font-medium">
                              <FileText className="w-5 h-5 text-[#7A7A7A] dark:text-[#B0B0B0]" />
                              <span className="text-sm sm:text-base text-[#57789B] dark:text-[#A3CAE9]">{file.name}</span>
                            </div>
                            <button 
                              type="button" 
                              onClick={() => removeFile(idx)}
                              className="bg-transparent border-none text-[#F56565] cursor-pointer flex items-center p-1 rounded-md transition-all duration-200 hover:bg-[#F56565]/10 hover:scale-110"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* reCAPTCHA Section */}
                <div className="mt-8 flex justify-center w-full">
                    <ReCAPTCHA
                        ref={captchaRef}
                        // =========================================================
                        // TODO: REPLACE THIS PLACEHOLDER WITH YOUR NEW SITE KEY
                        // =========================================================
                        sitekey="6Lckzh8sAAAAAEiYWwLi8UJyLG8jOqQ3tPWi5-nQ"
                        onChange={onCaptchaChange}
                        theme={theme === 'dark' ? 'dark' : 'light'}
                    />
                </div>

                {/* Submit Button */}
                <button 
                  type="submit" 
                  // Disable if no captcha token OR if loading
                  disabled={!captchaToken || uiState.loading}
                  className={`
                    mt-6 w-full flex items-center justify-center gap-2.5 rounded-xl border-none 
                    bg-gradient-to-br from-[#395A7F] to-[#2F4D69] dark:from-[#63B3ED] dark:to-[#4299E1]
                    text-white text-base font-semibold px-8 py-4 tracking-wide cursor-pointer transition-all duration-300
                    shadow-[0_4px_12px_rgba(57,90,127,0.2)]
                    ${(!captchaToken || uiState.loading)
                        ? 'opacity-60 cursor-not-allowed grayscale'
                        : 'hover:-translate-y-0.5 hover:shadow-[0_6px_20px_rgba(57,90,127,0.3)] hover:bg-gradient-to-br hover:from-[#6E9FC1] hover:to-[#395A7F] dark:hover:from-[#68D391] dark:hover:to-[#63B3ED]'}
                  `}
                >
                  {uiState.loading ? (
                    <>
                      <Loader2 className="animate-spin w-5 h-5" />
                      Uploading & Submitting...
                    </>
                  ) : (
                    <>
                      <Send className="w-5 h-5" />
                      Submit Ticket
                    </>
                  )}
                </button>
              </form>
            )}
          </div>

          {/* Footer */}
          <div className="text-center p-6 text-[#7A7A7A] dark:text-[#B0B0B0] bg-white dark:bg-[#1E2A38] border-t border-[#D1D5DB] dark:border-[#4A5568] flex-shrink-0">
            <p className="text-sm sm:text-base font-medium m-0">
              {uiState.submitted 
                ? "Need immediate assistance? Contact our support team directly."
                : "For urgent matters, please contact our support hotline directly."
              }
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SupportTicketSubmit;