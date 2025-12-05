import React, { useState, useRef, useEffect } from 'react';
import { 
  Ticket, User, Mail, Phone, MapPin, 
  AlertCircle, FileText, Paperclip, Send, 
  CheckCircle, Loader2, X, AlertTriangle,
  Moon, Sun
} from 'lucide-react';
import ReCAPTCHA from "react-google-recaptcha";

// --- CONFIGURATION ---
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
  { value: 'others', label: 'Others / Unspecified', icon: '🔹' }
];

const SupportTicketSubmit = () => {
  const fileInputRef = useRef(null);
  const captchaRef = useRef(null);

  // --- THEME STATE ---
  const [theme, setTheme] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('sm-theme') || 'light';
    }
    return 'light';
  });

  // --- THEME EFFECT ---
  useEffect(() => {
    localStorage.setItem('sm-theme', theme);
    document.body.setAttribute('data-theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => (prev === 'light' ? 'dark' : 'light'));
  };

  // --- STYLE CONSTANTS (The Fix) ---
  // We define the colors here based on the theme variable
  const styles = {
    background: theme === 'dark' ? 'linear-gradient(to bottom right, #1E2A38, #2C3E50)' : 'linear-gradient(to bottom right, #F4F4F4, #A3CAE9)',
    cardBg: theme === 'dark' ? '#1E2A38' : '#FFFFFF',
    textMain: theme === 'dark' ? '#E9ECEE' : '#395A7F',
    textMuted: theme === 'dark' ? '#A3CAE9' : '#57789B',
    inputBg: theme === 'dark' ? '#1E2A38' : '#FFFFFF',
    inputBorder: theme === 'dark' ? '#4A5568' : '#D1D5DB',
    inputColor: theme === 'dark' ? '#E9ECEE' : '#395A7F',
    borderColor: theme === 'dark' ? '#4A5568' : '#D1D5DB',
    headerBg: theme === 'dark' ? 'linear-gradient(135deg, #68D391 0%, #63B3ED 100%)' : 'linear-gradient(135deg, #6E9FC1 0%, #395A7F 100%)'
  };

  // --- FORM STATE ---
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

  // --- HANDLERS ---
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (name === 'userPhone') {
      const numericValue = value.replace(/\D/g, ''); 
      const truncatedValue = numericValue.slice(0, 11); 
      setFormData(prev => ({ ...prev, [name]: truncatedValue }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const newFiles = Array.from(e.target.files);
      setFormData(prev => ({ ...prev, files: [...prev.files, ...newFiles] }));
    }
  };

  const removeFile = (index) => {
    setFormData(prev => ({ ...prev, files: prev.files.filter((_, i) => i !== index) }));
  };

  const handleDrag = (e) => {
    e.preventDefault(); e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") setUiState(prev => ({ ...prev, dragActive: true }));
    else if (e.type === "dragleave") setUiState(prev => ({ ...prev, dragActive: false }));
  };

  const handleDrop = (e) => {
    e.preventDefault(); e.stopPropagation();
    setUiState(prev => ({ ...prev, dragActive: false }));
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const newFiles = Array.from(e.dataTransfer.files);
      setFormData(prev => ({ ...prev, files: [...prev.files, ...newFiles] }));
    }
  };

  const onCaptchaChange = (token) => {
    setCaptchaToken(token);
  };

  const uploadFileToCloudinary = async (file) => {
    const cloudName = "dc7etbsfe";
    const uploadPreset = "image_upload";
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', uploadPreset);
    try {
      const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, { method: 'POST', body: formData });
      if (!response.ok) throw new Error('Cloudinary upload failed');
      const data = await response.json();
      return { name: file.name, size: file.size, type: file.type, fileUrl: data.secure_url, uploadedAt: new Date().toISOString() };
    } catch (error) {
      console.error("Upload Error:", error);
      throw error;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!captchaToken) {
      setUiState(prev => ({ ...prev, message: { type: 'error', text: 'Please complete the reCAPTCHA check.' } }));
      return;
    }
    setUiState(prev => ({ ...prev, loading: true, message: null }));
    try {
      let uploadedAttachments = [];
      if (formData.files.length > 0) {
        uploadedAttachments = await Promise.all(formData.files.map(file => uploadFileToCloudinary(file)));
      }
      const ticketPayload = {
        userName: formData.userName,       
        userEmail: formData.userEmail,     
        userPhone: formData.userPhone,     
        smBranch: formData.smBranch,       
        branchLabel: SM_BRANCHES.find(b => b.value === formData.smBranch)?.label || 'SM City San Pablo',
        issueTitle: formData.issueTitle,            
        issueDescription: formData.issueDescription,
        issueCategory: formData.issueCategory, 
        categoryLabel: ISSUE_CATEGORIES.find(cat => cat.value === formData.issueCategory)?.label || 'N/A',
        status: 'open',
        priority: 'Unassigned',
        agentReply: '',            
        rejectionReason: '',       
        createdAt: new Date().toISOString(),
        attachments: uploadedAttachments,
        captchaToken: captchaToken
      };
      const response = await fetch('https://sm-crm-rho.vercel.app/api/submitTicket', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(ticketPayload)
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message || 'Server validation failed');
      setUiState({ loading: false, submitted: true, ticketId: result.id, dragActive: false, message: { type: 'success', text: `Ticket ${result.id} submitted successfully! We'll get back to you soon.` } });
    } catch (error) {
      console.error('Error submitting ticket:', error);
      let errorMessage = 'Failed to submit ticket. Please try again.';
      if (error.message.includes('Cloudinary')) errorMessage = 'Image upload failed. Please try a smaller image.';
      else if (error.message) errorMessage = error.message;
      setUiState(prev => ({ ...prev, loading: false, message: { type: 'error', text: errorMessage } }));
    }
  };

  const resetForm = () => {
    setFormData({ userName: '', userEmail: '', userPhone: '', smBranch: 'sm-san-pablo', issueCategory: '', issueTitle: '', issueDescription: '', files: [] });
    setUiState({ loading: false, submitted: false, ticketId: '', dragActive: false, message: null });
    setCaptchaToken(null);
    if (captchaRef.current) captchaRef.current.reset();
  };

  const MessageNotification = ({ message, onDismiss }) => {
    if (!message) return null;
    return (
      <div className={`fixed top-5 right-5 z-50 p-5 pr-12 rounded-xl shadow-xl flex items-start gap-3 animate-[slideIn_0.3s_ease-out] max-w-sm sm:max-w-md ${message.type === 'success' ? 'bg-[#48BB78] text-white' : 'bg-[#F56565] text-white'}`}>
        {message.type === 'success' ? <CheckCircle className="w-5 h-5 mt-0.5" /> : <AlertTriangle className="w-5 h-5 mt-0.5" />}
        <span className="font-medium flex-grow">{message.text}</span>
        <button onClick={onDismiss} className="absolute top-2.5 right-2.5 opacity-70 hover:opacity-100"><X className="w-4 h-4" /></button>
      </div>
    );
  };

  useEffect(() => {
    const styleSheet = document.createElement("style");
    styleSheet.innerText = `@keyframes slideIn { from { transform: translateX(100%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }`;
    document.head.appendChild(styleSheet);
    return () => document.head.removeChild(styleSheet);
  }, []);

  // Use this style object for all inputs to force colors
  const inputStyle = {
    backgroundColor: styles.inputBg,
    borderColor: styles.inputBorder,
    color: styles.inputColor
  };

  // Common Layout Classes (Tailwind for layout only)
  const inputClasses = "w-full px-4 py-3 border rounded-xl text-base focus:outline-none focus:ring-[3px] focus:ring-[#395A7F]/10 focus:border-[#395A7F] transition-all shadow-sm placeholder-gray-500";
  const labelClasses = "text-sm font-semibold mb-2 tracking-wide block";
  const sectionTitleClasses = "text-[1.4rem] font-bold mb-6 flex items-center gap-3 pb-3 border-b-2";

  return (
    <div style={{ width: '100%', minHeight: '100vh', background: styles.background }}>
      <div className="min-h-screen flex flex-col items-center justify-center p-5 font-sans">
        
        {/* Theme Toggle */}
        <div className="absolute top-5 right-5 z-40">
          <button 
            onClick={toggleTheme} 
            className="p-3 rounded-full shadow-md hover:shadow-lg transition-all border"
            style={{ backgroundColor: styles.cardBg, color: styles.textMain, borderColor: styles.borderColor }}
            type="button"
          >
            {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
          </button>
        </div>

        <MessageNotification message={uiState.message} onDismiss={() => setUiState(prev => ({ ...prev, message: null }))} />

        {/* Card Container - FORCED STYLES */}
        <div 
          className="w-full max-w-[800px] flex flex-col max-h-[90vh] rounded-2xl shadow-2xl overflow-hidden border"
          style={{ backgroundColor: styles.cardBg, borderColor: styles.borderColor }}
        >
          
          {/* Header */}
          <div className="flex-shrink-0 p-8 sm:p-10 text-center text-white" style={{ background: styles.headerBg }}>
            {uiState.submitted ? (
              <>
                <h1 className="text-2xl sm:text-[2rem] font-extrabold mb-3 flex items-center justify-center gap-3 text-white"><CheckCircle className="w-8 h-8" /> Ticket Submitted Successfully</h1>
                <p className="text-lg opacity-100 font-normal m-0 text-white">We have received your support request and will get back to you shortly.</p>
              </>
            ) : (
              <>
                <h1 className="text-2xl sm:text-[2rem] font-extrabold mb-3 flex items-center justify-center gap-3 text-white"><Ticket className="w-8 h-8" /> Support Ticket Submission</h1>
                <p className="text-lg opacity-100 font-normal m-0 text-white">Report an issue or request assistance from our support team</p>
              </>
            )}
          </div>

          <div className="flex-grow overflow-y-auto p-6 sm:p-10" style={{ backgroundColor: theme === 'dark' ? '#2C3E50' : '#F4F4F4' }}>
            {uiState.submitted ? (
              <div className="flex flex-col items-center justify-center text-center max-w-xl mx-auto py-10">
                <div className="mb-6 flex justify-center w-full"><CheckCircle className="w-20 h-20 text-[#48BB78]" /></div>
                <h2 className="text-[1.75rem] font-bold mb-3" style={{ color: styles.textMain }}>Submission Confirmed!</h2>
                <p className="text-lg mb-8 leading-relaxed max-w-[80%]" style={{ color: '#7A7A7A' }}>A confirmation email has been sent to <strong>{formData.userEmail}</strong>.</p>
                <div className="px-6 py-4 rounded-xl mb-8 font-bold text-lg border shadow-sm inline-block break-all max-w-full" style={{ backgroundColor: '#A3CAE9', color: '#395A7F', borderColor: '#395A7F' }}>Ticket ID: {uiState.ticketId}</div>
                <button onClick={resetForm} className="w-full max-w-[300px] rounded-xl border-none bg-gradient-to-br from-[#48BB78] to-[#389E62] text-white text-base font-semibold px-8 py-4 shadow-[0_4px_12px_rgba(72,187,120,0.2)] hover:shadow-[0_6px_20px_rgba(72,187,120,0.3)] hover:-translate-y-0.5 transition-all duration-300 cursor-pointer">Submit Another Ticket</button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="flex flex-col gap-0">
                
                {/* Contact Section */}
                <div className="mb-10 pb-8 border-b" style={{ borderColor: styles.borderColor }}>
                  <h3 className={sectionTitleClasses} style={{ color: styles.textMain, borderColor: styles.borderColor }}>
                    <User className="w-6 h-6" style={{ color: theme === 'dark' ? '#63B3ED' : '#395A7F' }} /> Contact Information
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div className="flex flex-col">
                      <label className={labelClasses} style={{ color: styles.textMuted }}>Full Name *</label>
                      <input type="text" id="userName" name="userName" value={formData.userName} onChange={handleInputChange} placeholder="Enter your full name" required className={inputClasses} style={inputStyle} />
                    </div>

                    <div className="flex flex-col">
                      <label className={labelClasses} style={{ color: styles.textMuted }}>Email Address *</label>
                      <input type="email" id="userEmail" name="userEmail" value={formData.userEmail} onChange={handleInputChange} placeholder="Enter your email" required className={inputClasses} style={inputStyle} />
                    </div>

                    <div className="flex flex-col">
                      <label className={labelClasses} style={{ color: styles.textMuted }}>Phone Number</label>
                      <input type="tel" id="userPhone" name="userPhone" value={formData.userPhone} onChange={handleInputChange} placeholder="09123456789" maxLength={11} className={inputClasses} style={inputStyle} />
                    </div>

                    <div className="flex flex-col">
                      <label className={labelClasses} style={{ color: styles.textMuted }}>Branch Location *</label>
                      <div className="relative">
                        <select id="smBranch" name="smBranch" value={formData.smBranch} onChange={handleInputChange} required className={`${inputClasses} appearance-none cursor-pointer`} style={inputStyle}>
                          {SM_BRANCHES.map(branch => <option key={branch.value} value={branch.value}>{branch.label}</option>)}
                        </select>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Issue Details Section */}
                <div className="mb-0">
                  <h3 className={sectionTitleClasses} style={{ color: styles.textMain, borderColor: styles.borderColor }}>
                    <AlertCircle className="w-6 h-6" style={{ color: theme === 'dark' ? '#63B3ED' : '#395A7F' }} /> Issue Details
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div className="col-span-1 md:col-span-2 flex flex-col">
                      <label className={labelClasses} style={{ color: styles.textMuted }}>Category *</label>
                      <div className="relative">
                        <select id="issueCategory" name="issueCategory" value={formData.issueCategory} onChange={handleInputChange} required className={`${inputClasses} appearance-none cursor-pointer`} style={inputStyle}>
                          <option value="">Select Category</option>
                          {ISSUE_CATEGORIES.map(cat => <option key={cat.value} value={cat.value}>{cat.icon} {cat.label}</option>)}
                        </select>
                      </div>
                    </div>

                    <div className="col-span-1 md:col-span-2 flex flex-col">
                      <label className={labelClasses} style={{ color: styles.textMuted }}>Subject *</label>
                      <input type="text" id="issueTitle" name="issueTitle" value={formData.issueTitle} onChange={handleInputChange} placeholder="Brief summary of the issue" required className={inputClasses} style={inputStyle} />
                    </div>

                    <div className="col-span-1 md:col-span-2 flex flex-col">
                      <label className={labelClasses} style={{ color: styles.textMuted }}>Description *</label>
                      <textarea id="issueDescription" name="issueDescription" value={formData.issueDescription} onChange={handleInputChange} placeholder="Please describe the issue in detail..." required rows="6" className={`${inputClasses} min-h-[120px] resize-y leading-relaxed`} style={inputStyle} />
                    </div>
                  </div>

                  {/* Attachments Section */}
                  <div className="mt-5 col-span-1 md:col-span-2 flex flex-col">
                    <label className={labelClasses} style={{ color: styles.textMuted }}>Attachments (Optional)</label>
                    <div 
                      className="border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all duration-300 mb-4"
                      style={{ 
                        backgroundColor: uiState.dragActive ? (theme === 'dark' ? '#2C5282' : '#A3CAE9') : styles.inputBg,
                        borderColor: styles.borderColor
                      }}
                      onDragEnter={handleDrag} onDragLeave={handleDrag} onDragOver={handleDrag} onDrop={handleDrop} onClick={() => fileInputRef.current?.click()}
                    >
                      <input ref={fileInputRef} type="file" multiple onChange={handleFileChange} className="hidden" />
                      <div className="mb-3 flex justify-center"><Paperclip className="w-12 h-12" style={{ color: styles.textMain }} /></div>
                      <p className="text-base font-medium mb-2" style={{ color: styles.textMuted }}>Click to upload or drag files here</p>
                    </div>

                    {formData.files.length > 0 && (
                      <div className="flex flex-col gap-2">
                        {formData.files.map((file, idx) => (
                          <div key={idx} className="flex justify-between items-center p-4 border rounded-xl" style={{ backgroundColor: styles.inputBg, borderColor: styles.borderColor }}>
                            <div className="flex items-center gap-3 font-medium">
                              <FileText className="w-5 h-5" style={{ color: styles.textMuted }} /><span className="text-sm sm:text-base" style={{ color: styles.textMuted }}>{file.name}</span>
                            </div>
                            <button type="button" onClick={() => removeFile(idx)} className="bg-transparent border-none text-[#F56565] cursor-pointer"><X className="w-4 h-4" /></button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div className="mt-8 flex justify-center w-full">
                  <ReCAPTCHA
                    ref={captchaRef}
                    sitekey="6Lckzh8sAAAAAEiYWwLi8UJyLG8jOqQ3tPWi5-nQ"
                    onChange={onCaptchaChange}
                    theme={theme === 'dark' ? 'dark' : 'light'}
                  />
                </div>

                <button 
                  type="submit" 
                  disabled={!captchaToken || uiState.loading}
                  className={`mt-6 w-full flex items-center justify-center gap-2.5 rounded-xl border-none text-white text-base font-semibold px-8 py-4 tracking-wide cursor-pointer transition-all duration-300 shadow-md ${!captchaToken || uiState.loading ? 'opacity-60 cursor-not-allowed' : 'hover:-translate-y-0.5'}`}
                  style={{ background: styles.headerBg }}
                >
                  {uiState.loading ? <><Loader2 className="animate-spin w-5 h-5" /> Uploading & Submitting...</> : <><Send className="w-5 h-5" /> Submit Ticket</>}
                </button>
              </form>
            )}
          </div>

          <div className="text-center p-6 border-t flex-shrink-0" style={{ backgroundColor: styles.cardBg, borderColor: styles.borderColor, color: styles.textMuted }}>
            <p className="text-sm sm:text-base font-medium m-0">{uiState.submitted ? "Need immediate assistance? Contact our support team directly." : "For urgent matters, please contact our support hotline directly."}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SupportTicketSubmit;