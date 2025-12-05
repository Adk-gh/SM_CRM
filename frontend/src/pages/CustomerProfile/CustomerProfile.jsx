import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Chart, registerables } from 'chart.js';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../../../firebase'; 
import { 
  Search, 
  RefreshCw, 
  User, 
  Star, 
  BarChart2
} from 'lucide-react';

// Register Chart.js components
Chart.register(...registerables);

// --- CONSTANTS ---
const COLORS_CONFIG = {
  chartColors: ['#EF4444', '#F59E0B', '#FCD34D', '#10B981', '#059669'], // Red to Green
};

// --- HELPER FUNCTIONS ---
const generateAvatar = (name) => {
  if (!name) return 'CU';
  return name.split(' ').map(word => word[0]).join('').toUpperCase().slice(0, 2);
};

const formatDate = (timestamp) => {
  if (!timestamp) return 'N/A';
  try {
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return date.toLocaleDateString('en-US', options);
  } catch {
    return 'Invalid date';
  }
};

// --- CSS STYLES ---
const styles = `
/* Variables */
:root {
  --bg-primary: #E9ECEE;
  --bg-secondary: #F4F4F4;
  --text-primary: #395A7F;
  --text-secondary: #6E9FC1;
  --text-light: #ACACAC;
  --accent-primary: #395A7F;
  --accent-secondary: #6E9FC1;
  --border-light: #ACACAC;
  --card-bg: #FFFFFF;
  --card-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  --info-bg: rgba(57, 90, 127, 0.1);
}

[data-theme="dark"] {
  --bg-primary: #1E2A38;
  --bg-secondary: #2C3E50;
  --text-primary: #E9ECEE;
  --text-secondary: #A3CAE9;
  --text-light: #94A3B8;
  --accent-primary: #68D391;
  --accent-secondary: #63B3ED;
  --border-light: #4A5568;
  --card-bg: #2C3E50;
  --card-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
  --info-bg: rgba(99, 179, 237, 0.2);
}

/* Layout */
.profile-wrapper {
  width: 100%;
  height: 100%; 
  background: var(--bg-primary);
  display: flex;
  flex-direction: column;
}

.profile-layout {
  display: flex;
  flex-direction: column;
  gap: 20px;
  flex: 1;
  min-height: 0; 
  padding: 0;
}

@media (min-width: 1024px) {
  .profile-layout {
    flex-direction: row;
  }
}

/* --- CUSTOMER LIST PANEL (LEFT) --- */
.list-panel {
  flex: 0 0 350px; /* Slightly narrower for better proportion */
  background: var(--card-bg);
  border-radius: 12px;
  box-shadow: var(--card-shadow);
  border: 1px solid var(--border-light);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  height: 100%; 
}

.panel-header {
  padding: 20px;
  border-bottom: 1px solid var(--border-light);
  background: var(--card-bg);
}

.panel-header h3 {
  font-size: 18px;
  font-weight: 700;
  color: var(--text-primary);
  margin-bottom: 15px;
}

.search-container {
  display: flex;
  gap: 10px;
  align-items: center;
}

.search-box-wrapper {
  position: relative;
  flex: 1;
}

.search-icon {
  position: absolute;
  left: 12px;
  top: 50%;
  transform: translateY(-50%);
  color: var(--text-light);
  width: 16px;
  height: 16px;
}

.search-input {
  width: 100%;
  padding: 10px 10px 10px 35px;
  border-radius: 8px;
  border: 1px solid var(--border-light);
  background: var(--bg-secondary);
  color: var(--text-primary);
  font-size: 13px;
  height: 40px;
  outline: none;
  transition: all 0.2s ease;
}

.search-input:focus {
  border-color: var(--accent-secondary);
}

.refresh-btn {
  width: 40px;
  height: 40px;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
  border: 1px solid var(--border-light);
  background: var(--bg-secondary);
  color: var(--text-primary);
  cursor: pointer;
  transition: all 0.2s ease;
}

.refresh-btn:hover:not(:disabled) {
  background: var(--bg-primary);
  color: var(--accent-secondary);
  border-color: var(--accent-secondary);
}

.list-content {
  flex: 1;
  overflow-y: auto;
}

.customer-item {
  display: flex;
  align-items: center;
  padding: 15px 20px;
  border-bottom: 1px solid var(--border-light);
  cursor: pointer;
  transition: all 0.2s ease;
  height: 80px;
}

.customer-item:hover {
  background: var(--bg-secondary);
}

.customer-item.active {
  background: var(--info-bg);
  border-left: 4px solid var(--accent-primary);
  padding-left: 16px;
}

.avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: linear-gradient(135deg, var(--accent-primary), var(--accent-secondary));
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  font-weight: 700;
  font-size: 14px;
  margin-right: 15px;
  flex-shrink: 0;
}

.info h4 {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 2px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.info p {
  font-size: 12px;
  color: var(--text-secondary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* --- DETAILS PANEL (RIGHT) --- */
.details-panel {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow-y: auto;
  padding-right: 5px;
  height: 100%;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: var(--text-light);
  border: 2px dashed var(--border-light);
  border-radius: 12px;
  background: var(--bg-secondary);
  opacity: 0.7;
}

/* --- CARDS & GRID LAYOUT --- */
.card {
  background: var(--card-bg);
  border-radius: 12px;
  padding: 25px;
  box-shadow: var(--card-shadow);
  border: 1px solid var(--border-light);
  margin-bottom: 20px;
  position: relative;
  overflow: hidden;
  /* Removed fixed height to let content dictate size */
}

.card::before {
  content: '';
  position: absolute;
  top: 0; left: 0; right: 0; height: 3px;
  background: linear-gradient(90deg, var(--accent-primary), var(--accent-secondary));
}

.card h3 {
  font-size: 16px;
  font-weight: 700;
  color: var(--text-primary);
  margin-bottom: 20px;
  display: flex;
  align-items: center;
  gap: 10px;
}

/* --- SPLIT DASHBOARD GRID --- */
.split-dashboard {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

@media (min-width: 1400px) {
  .split-dashboard {
    display: grid;
    /* Reviews takes 60%, Chart takes 40% */
    grid-template-columns: 3fr 2fr; 
    align-items: start; /* FIXED: Prevents stretching */
    gap: 20px;
  }
}

.detail-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 0;
  border-bottom: 1px solid var(--border-light);
}

.detail-row:last-child {
  border-bottom: none;
}

.detail-label {
  color: var(--text-secondary);
  font-weight: 700;
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.detail-value {
  color: var(--text-primary);
  font-weight: 600;
  font-size: 14px;
  text-align: right;
}

/* Reviews Specifics */
.reviews-filters {
  display: flex;
  gap: 10px;
  margin-bottom: 15px;
}

.filter-input {
  flex: 1;
  padding: 8px 12px;
  border-radius: 6px;
  border: 1px solid var(--border-light);
  background: var(--bg-secondary);
  color: var(--text-primary);
  font-size: 12px;
  outline: none;
}

/* Scrollable Ticket List with Max Height */
.ticket-list {
  max-height: 400px; /* Controls height of review list */
  overflow-y: auto;
  padding-right: 5px;
}

.review-item {
  padding: 15px;
  border-bottom: 1px solid var(--border-light);
  background: var(--bg-secondary);
  border-radius: 8px;
  margin-bottom: 10px;
  transition: background-color 0.2s;
}
.review-item:hover { background: var(--bg-primary); }
.review-item:last-child { margin-bottom: 0; }

.review-header { display: flex; justify-content: space-between; margin-bottom: 5px; }
.review-user { font-weight: 600; color: var(--text-primary); font-size: 13px; }
.review-date { font-size: 11px; color: var(--text-light); }
.review-rating { color: #F59E0B; font-size: 12px; margin-bottom: 5px; display: flex; align-items: center; gap: 5px; }
.review-text { font-size: 13px; color: var(--text-primary); font-style: italic; line-height: 1.4; }

.chart-container { height: 250px; width: 100%; position: relative; }
.no-data { height: 250px; display: flex; align-items: center; justify-content: center; color: var(--text-light); font-size: 13px; }

/* Animation & Scrollbar */
@keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
.animate-in { animation: fadeIn 0.4s ease-out forwards; }

::-webkit-scrollbar { width: 5px; }
::-webkit-scrollbar-track { background: transparent; }
::-webkit-scrollbar-thumb { background: var(--border-light); border-radius: 10px; }
::-webkit-scrollbar-thumb:hover { background: var(--accent-light); }
`;

const CustomerProfile = () => {
  // --- STATE MANAGEMENT ---
  const [currentCustomer, setCurrentCustomer] = useState(null);
  const [customers, setCustomers] = useState([]);
  const [filteredCustomers, setFilteredCustomers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isDark, setIsDark] = useState(false); 
  
  // Data States
  const [reviews, setReviews] = useState([]);
  const [customerTickets, setCustomerTickets] = useState([]); 
  const [loadingReviews, setLoadingReviews] = useState(false);
  
  // Filters
  const [customerSearch, setCustomerSearch] = useState('');
  const [reviewSearch, setReviewSearch] = useState('');
  const [reviewRatingFilter, setReviewRatingFilter] = useState('all');

  // Chart Refs
  const satisfactionChartRef = useRef(null);
  const chartInstance = useRef(null);

  // --- THEME LISTENER ---
  useEffect(() => {
    const checkTheme = () => {
      const theme = document.documentElement.getAttribute('data-theme');
      setIsDark(theme === 'dark');
    };
    checkTheme();
    const observer = new MutationObserver(checkTheme);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
    return () => observer.disconnect();
  }, []);

  // --- DATA FETCHING (FIXED) ---
  // Removed `currentCustomer` from dependencies so this doesn't run on selection
  const fetchCustomers = useCallback(async () => {
    try {
      // 1. Try fetching from Vercel API
      const response = await fetch("https://sm-crm-rho.vercel.app/api/customer");
      
      if (!response.ok) {
        throw new Error(`API Error: ${response.status}`);
      }

      const data = await response.json();
      const customersList = data.customers || [];
      
      setCustomers(customersList);
      setFilteredCustomers(customersList);
      
      // Select first customer if none selected (using functional update to avoid dependency)
      if (customersList.length > 0) {
        setCurrentCustomer(prev => prev || customersList[0]);
      }
    } catch (err) {
      console.warn('API Failed, switching to Firebase direct fetch:', err);
      
      // 2. FALLBACK: Fetch directly from Firebase Firestore
      try {
         const customersCollection = collection(db, 'customers');
         const customersSnapshot = await getDocs(customersCollection);
         
         const fallbackList = customersSnapshot.docs.map(doc => ({
           id: doc.id,
           ...doc.data()
         }));
         
         setCustomers(fallbackList);
         setFilteredCustomers(fallbackList);
         
         if (fallbackList.length > 0) {
           setCurrentCustomer(prev => prev || fallbackList[0]);
         }
      } catch (fbErr) {
        console.error("Firestore fallback also failed:", fbErr);
      }
    }
  }, []); // Empty dependency array ensures this is stable

  // --- FETCH REVIEWS & TICKETS ---
  const fetchUserData = useCallback(async (user) => {
    if (!user) {
      setReviews([]);
      setCustomerTickets([]);
      return;
    }
    
    const uniqueId = user.userId || user.id;
    const userEmail = user.email;

    setLoadingReviews(true);
    
    try {
      // 1. Reviews
      const reviewsQuery = query(collection(db, 'reviews'), where('userId', '==', uniqueId));
      const reviewsSnapshot = await getDocs(reviewsQuery);
      const reviewsList = reviewsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setReviews(reviewsList);

      // 2. Support Tickets
      let ticketsList = [];
      if (userEmail) {
        const requesterQuery = query(collection(db, 'supportTickets'), where('requester', '==', userEmail)); 
        let ticketsSnapshot = await getDocs(requesterQuery);
        
        if (ticketsSnapshot.empty) {
          const emailQuery = query(collection(db, 'supportTickets'), where('email', '==', userEmail));
          ticketsSnapshot = await getDocs(emailQuery);
        }
        
        ticketsList = ticketsSnapshot.docs.map(doc => ({ 
          id: doc.id, 
          ...doc.data(),
          status: doc.data().status ? doc.data().status.toLowerCase() : 'open' 
        }));
      }
      setCustomerTickets(ticketsList);

    } catch (err) {
      console.error('Error fetching user data:', err);
    } finally {
      setLoadingReviews(false);
    }
  }, []);

  // --- EFFECT HOOKS ---
  // This hook handles updating reviews when user selection changes
  useEffect(() => {
    if (currentCustomer) fetchUserData(currentCustomer);
    else { setReviews([]); setCustomerTickets([]); }
  }, [currentCustomer, fetchUserData]);

  const handleReloadReviews = async () => {
    setLoadingReviews(true);
    try {
      const controller = new AbortController();
      setTimeout(() => controller.abort(), 10000);
      await fetch("https://sm-crm-rho.vercel.app/api/reviews", { method: 'GET', signal: controller.signal });
      if (currentCustomer) await fetchUserData(currentCustomer);
    } catch (err) {
      console.error("Error reloading reviews:", err);
    } finally {
      setLoadingReviews(false);
    }
  };

  // This hook fetches the customer list ONLY once on mount
  useEffect(() => {
    const init = async () => {
      setLoading(true);
      await fetchCustomers();
      setLoading(false);
    };
    init();
  }, [fetchCustomers]);

  useEffect(() => {
    if (customerSearch) {
      const filtered = customers.filter(c => 
        c.fullName?.toLowerCase().includes(customerSearch.toLowerCase()) || 
        c.email?.toLowerCase().includes(customerSearch.toLowerCase())
      );
      setFilteredCustomers(filtered);
      if (filtered.length > 0) {
        // Only change selection if the current one isn't in the new list
        if (!currentCustomer || !filtered.find(c => c.id === currentCustomer.id)) setCurrentCustomer(filtered[0]);
      } else setCurrentCustomer(null);
    } else {
      setFilteredCustomers(customers);
    }
  }, [customerSearch, customers]);

  // --- CHART INITIALIZATION ---
  useEffect(() => {
    if (satisfactionChartRef.current && reviews.length > 0) {
      if (chartInstance.current) {
        chartInstance.current.destroy();
      }

      const ctx = satisfactionChartRef.current.getContext('2d');
      const gridColor = isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)';
      const textColor = isDark ? '#E9ECEE' : '#395A7F';

      const ratingCounts = [0, 0, 0, 0, 0];
      reviews.forEach(r => {
        const rate = Math.round(r.rating || 0);
        if (rate >= 1 && rate <= 5) ratingCounts[rate - 1]++;
      });

      chartInstance.current = new Chart(ctx, {
        type: 'bar',
        data: {
          labels: ['1 Star', '2 Stars', '3 Stars', '4 Stars', '5 Stars'],
          datasets: [{
            label: 'Reviews',
            data: ratingCounts,
            backgroundColor: COLORS_CONFIG.chartColors,
            borderRadius: 4
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { display: false } },
          scales: {
            y: { 
              beginAtZero: true, 
              grid: { color: gridColor },
              ticks: { color: textColor, precision: 0 }
            },
            x: { 
              grid: { display: false },
              ticks: { color: textColor }
            }
          }
        }
      });
    }

    return () => {
      if (chartInstance.current) {
        chartInstance.current.destroy();
      }
    };
  }, [reviews, isDark]);

  const getFilteredReviews = () => {
    return reviews.filter(r => {
      const matchesSearch = (r.comment || '').toLowerCase().includes(reviewSearch.toLowerCase()) ||
                            (r.title || '').toLowerCase().includes(reviewSearch.toLowerCase());
      const matchesRating = reviewRatingFilter === 'all' || r.rating === parseInt(reviewRatingFilter);
      return matchesSearch && matchesRating;
    });
  };

  return (
    <div className="profile-wrapper">
      <style>{styles}</style>
      
      <div className="profile-layout">
        {/* --- LEFT: LIST PANEL --- */}
        <div className="list-panel">
          <div className="panel-header">
            <h3>Customers</h3>
            <div className="search-container">
              <div className="search-box-wrapper">
                <Search className="search-icon" size={16} />
                <input 
                  type="text" 
                  placeholder="Search..." 
                  className="search-input"
                  value={customerSearch}
                  onChange={(e) => setCustomerSearch(e.target.value)}
                />
              </div>
              <button 
                className="refresh-btn" 
                onClick={async () => { setLoading(true); await fetchCustomers(); setLoading(false); }}
                disabled={loading}
              >
                <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
              </button>
            </div>
          </div>

          <div className="list-content">
            {loading ? (
              <div style={{padding:'20px', textAlign:'center', color:'var(--text-secondary)'}}>Loading...</div>
            ) : filteredCustomers.length === 0 ? (
              <div style={{padding:'20px', textAlign:'center', color:'var(--text-light)'}}>No customers found.</div>
            ) : (
              filteredCustomers.map(c => (
                <div 
                  key={c.id} 
                  className={`customer-item ${currentCustomer?.id === c.id ? 'active' : ''}`}
                  onClick={() => setCurrentCustomer(c)}
                >
                  <div className="avatar">{generateAvatar(c.fullName)}</div>
                  <div className="info">
                    <h4>{c.fullName || 'Unknown'}</h4>
                    <p>{c.email}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* --- RIGHT: DETAILS PANEL --- */}
        <div className="details-panel">
          {!currentCustomer ? (
            <div className="empty-state">
              <User size={48} style={{marginBottom:'15px', opacity:0.5}} />
              <p>Select a customer to view profile</p>
            </div>
          ) : (
            <div className="animate-in">
              {/* 1. CUSTOMER INFORMATION CARD */}
              <div className="card">
                <h3><User size={18} /> Customer Information</h3>
                <div>
                  {[
                    { label: 'FULL NAME', value: currentCustomer.fullName },
                    { label: 'EMAIL', value: currentCustomer.email },
                    { label: 'MEMBER SINCE', value: formatDate(currentCustomer.createdAt) },
                    { label: 'TOTAL REVIEWS', value: reviews.length },
                    { label: 'SUPPORT TICKETS', value: customerTickets.length },
                  ].map((item, i) => (
                    <div key={i} className="detail-row">
                      <span className="detail-label">{item.label}</span>
                      <span className="detail-value">
                        {(item.value !== undefined && item.value !== null) ? item.value : 'N/A'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* 2. SPLIT LAYOUT: REVIEWS & GRAPH */}
              <div className="split-dashboard">
                {/* LEFT: REVIEWS (Scrollable) */}
                <div className="card">
                  <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'20px'}}>
                    <h3><Star size={18} /> Customer Reviews</h3>
                    <button 
                      className="refresh-btn" 
                      style={{width:'32px', height:'32px'}}
                      onClick={handleReloadReviews}
                      disabled={loadingReviews}
                    >
                      <RefreshCw size={14} className={loadingReviews?'animate-spin':''} />
                    </button>
                  </div>

                  <div className="reviews-filters">
                    <input 
                      type="text" 
                      placeholder="Search review content..." 
                      className="filter-input"
                      value={reviewSearch}
                      onChange={e => setReviewSearch(e.target.value)}
                    />
                    <select 
                      className="filter-input" 
                      value={reviewRatingFilter} 
                      onChange={e => setReviewRatingFilter(e.target.value)}
                    >
                      <option value="all">All Ratings</option>
                      {[5,4,3,2,1].map(r => <option key={r} value={r}>{r} Stars</option>)}
                    </select>
                  </div>

                  <div className="ticket-list">
                    {getFilteredReviews().length === 0 ? (
                      <div style={{textAlign:'center', padding:'20px', color:'var(--text-light)'}}>No reviews found.</div>
                    ) : (
                      getFilteredReviews().map(r => (
                        <div key={r.id} className="review-item">
                          <div className="review-header">
                            <span className="review-user">{r.title || 'Review'}</span>
                            <span className="review-date">{formatDate(r.timestamp)}</span>
                          </div>
                          <div className="review-rating">
                            {'★'.repeat(r.rating)}{'☆'.repeat(5-(r.rating||0))}
                            <span style={{color:'var(--text-primary)', marginLeft:'5px'}}>{r.rating}/5</span>
                          </div>
                          <p className="review-text">"{r.comment}"</p>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* RIGHT: SATISFACTION CHART (Sticky height) */}
                <div className="card" style={{height:'fit-content'}}>
                  <h3><BarChart2 size={18} /> Satisfaction</h3>
                  <div className="chart-container">
                    {reviews.length > 0 ? (
                      <canvas ref={satisfactionChartRef}></canvas>
                    ) : (
                      <div className="no-data">No review data available.</div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CustomerProfile;