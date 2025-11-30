  import React, { useState, useEffect, useRef, useCallback } from 'react';
  import { Chart, registerables } from 'chart.js';
  import { collection, getDocs, query, where } from 'firebase/firestore';
  import { db } from '../../../firebase'; 
  import { 
    Search, 
    RefreshCw, 
    User, 
    Star, 
    BarChart2, 
    Clock,
    CheckCircle,
    AlertCircle
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

  // --- CSS STYLES (Embedded) ---
  const styles = `
  /* Base Reset */
  * { margin: 0; padding: 0; box-sizing: border-box; font-family: 'Segoe UI', system-ui, sans-serif; }

  /* Variables */
  :root {
    /* Light Theme */
    --bg-primary: #E9ECEE;
    --bg-secondary: #F4F4F4;
    --text-primary: #395A7F;
    --text-secondary: #6E9FC1;
    --text-light: #ACACAC;
    --accent-primary: #395A7F;
    --accent-secondary: #6E9FC1;
    --accent-light: #A3CAE9;
    --border-light: #ACACAC;
    --card-bg: #FFFFFF;
    --card-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
    --card-hover: 0 10px 30px rgba(0, 0, 0, 0.12);
    
    /* Status Colors */
    --success-bg: rgba(72, 187, 120, 0.1);
    --success-text: #48BB78;
    --warning-bg: rgba(246, 173, 85, 0.1);
    --warning-text: #F6AD55;
    --danger-bg: rgba(239, 68, 68, 0.1);
    --danger-text: #EF4444;
    --info-bg: rgba(57, 90, 127, 0.1);
    --info-text: #395A7F;
  }

  [data-theme="dark"] {
    /* Dark Theme */
    --bg-primary: #1E2A38;
    --bg-secondary: #2C3E50;
    --text-primary: #E9ECEE;
    --text-secondary: #A3CAE9;
    --text-light: #94A3B8;
    --accent-primary: #68D391;
    --accent-secondary: #63B3ED;
    --accent-light: #4299E1;
    --border-light: #4A5568;
    --card-bg: #2C3E50;
    --card-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
    --card-hover: 0 10px 30px rgba(0, 0, 0, 0.4);

    /* Dark Status Colors */
    --success-bg: rgba(104, 211, 145, 0.2);
    --success-text: #68D391;
    --warning-bg: rgba(251, 211, 141, 0.2);
    --warning-text: #FBD38D;
    --info-bg: rgba(99, 179, 237, 0.2);
    --info-text: #63B3ED;
  }

  body {
    background: var(--bg-primary);
    color: var(--text-primary);
    transition: background-color 0.3s ease, color 0.3s ease;
  }

  /* Layout */
  .profile-wrapper {
    padding: 30px;
    width: 100%;
    min-height: 100vh;
    background: var(--bg-primary);
  }

  .profile-layout {
    display: flex;
    flex-direction: column;
    gap: 30px;
    height: calc(100vh - 150px);
  }

  @media (min-width: 1024px) {
    .profile-layout {
      flex-direction: row;
    }
  }

  /* --- CUSTOMER LIST PANEL --- */
  .list-panel {
    flex: 0 0 400px;
    background: var(--card-bg);
    border-radius: 16px;
    box-shadow: var(--card-shadow);
    border: 1px solid var(--border-light);
    display: flex;
    flex-direction: column;
    overflow: hidden;
  }

  .panel-header {
    padding: 25px;
    border-bottom: 1px solid var(--border-light);
  }

  .panel-header h3 {
    font-size: 20px;
    font-weight: 600;
    color: var(--text-primary);
    margin-bottom: 20px;
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
    left: 15px;
    top: 50%;
    transform: translateY(-50%);
    color: var(--text-light);
  }

  .search-input {
    width: 100%;
    padding: 12px 15px 12px 45px;
    border-radius: 12px;
    border: 1px solid var(--border-light);
    background: var(--bg-secondary);
    color: var(--text-primary);
    font-size: 14px;
    height: 46px;
    outline: none;
    transition: all 0.3s ease;
  }

  .search-input:focus {
    border-color: var(--accent-secondary);
    box-shadow: 0 0 0 3px rgba(110, 159, 193, 0.1);
  }

  .refresh-btn {
    width: 46px;
    height: 46px;
    flex-shrink: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 12px;
    border: 1px solid var(--border-light);
    background: var(--bg-secondary);
    color: var(--text-primary);
    cursor: pointer;
    transition: all 0.3s ease;
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
    padding: 20px 25px;
    border-bottom: 1px solid var(--border-light);
    cursor: pointer;
    transition: all 0.2s ease;
    height: 100px;
  }

  .customer-item:hover {
    background: var(--bg-secondary);
  }

  .customer-item.active {
    background: var(--info-bg);
    border-left: 4px solid var(--accent-primary);
    padding-left: 21px;
  }

  .avatar {
    width: 50px;
    height: 50px;
    border-radius: 50%;
    background: linear-gradient(135deg, var(--accent-primary), var(--accent-secondary));
    display: flex;
    align-items: center;
    justify-content: center;
    color: #fff;
    font-weight: 700;
    font-size: 18px;
    margin-right: 15px;
    flex-shrink: 0;
  }

  .info h4 {
    font-size: 16px;
    font-weight: 600;
    color: var(--text-primary);
    margin-bottom: 4px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .info p {
    font-size: 13px;
    color: var(--text-secondary);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  /* --- DETAILS PANEL --- */
  .details-panel {
    flex: 1;
    display: flex;
    flex-direction: column;
    overflow-y: auto;
    padding-right: 5px;
  }

  .empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 100%;
    color: var(--text-light);
    border: 2px dashed var(--border-light);
    border-radius: 16px;
    background: var(--bg-secondary);
  }

  .tabs {
    display: flex;
    border-bottom: 1px solid var(--border-light);
    margin-bottom: 25px;
  }

  .tab {
    padding: 12px 30px;
    cursor: pointer;
    font-weight: 600;
    color: var(--text-secondary);
    border-bottom: 3px solid transparent;
    transition: all 0.3s ease;
    font-size: 14px;
  }

  .tab:hover { color: var(--accent-primary); }
  .tab.active { color: var(--accent-primary); border-bottom-color: var(--accent-primary); }

  /* --- FIXED INFO CARD STYLING --- */
  .card {
    background: var(--card-bg);
    border-radius: 16px;
    padding: 25px;
    box-shadow: var(--card-shadow);
    border: 1px solid var(--border-light);
    margin-bottom: 25px;
    position: relative;
    overflow: hidden;
  }

  .card::before {
    content: '';
    position: absolute;
    top: 0; left: 0; right: 0; height: 4px;
    background: linear-gradient(90deg, var(--accent-primary), var(--accent-secondary));
  }

  .card h3 {
    font-size: 18px;
    font-weight: 600;
    color: var(--text-primary);
    margin-bottom: 25px;
    display: flex;
    align-items: center;
    gap: 10px;
  }

  .detail-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 16px 0;
    border-bottom: 1px solid var(--border-light);
    width: 100%;
  }

  .detail-row:last-child {
    border-bottom: none;
  }

  .detail-label {
    color: var(--text-secondary);
    font-weight: 700;
    font-size: 12px;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  .detail-value {
    color: var(--text-primary);
    font-weight: 600;
    font-size: 15px;
    text-align: right;
  }

  /* Reviews Specifics */
  .reviews-filters {
    display: flex;
    gap: 15px;
    margin-bottom: 20px;
  }

  .filter-input {
    flex: 1;
    padding: 10px 15px;
    border-radius: 8px;
    border: 1px solid var(--border-light);
    background: var(--bg-secondary);
    color: var(--text-primary);
    font-size: 13px;
    outline: none;
  }

  .review-item {
    padding: 15px;
    border-bottom: 1px solid var(--border-light);
    transition: background-color 0.2s;
  }
  .review-item:hover { background: var(--bg-secondary); }
  .review-item:last-child { border-bottom: none; }

  .review-header { display: flex; justify-content: space-between; margin-bottom: 5px; }
  .review-user { font-weight: 600; color: var(--text-primary); font-size: 14px; }
  .review-date { font-size: 12px; color: var(--text-light); }
  .review-rating { color: #F59E0B; font-size: 13px; margin-bottom: 5px; display: flex; align-items: center; gap: 5px; }
  .review-text { font-size: 13px; color: var(--text-primary); font-style: italic; }

  /* Analytics Grid */
  .analytics-grid {
    display: grid;
    grid-template-columns: 1fr;
    gap: 25px;
  }
  @media (min-width: 1024px) { .analytics-grid { grid-template-columns: 1fr 1fr; } }

  .chart-container { height: 250px; width: 100%; position: relative; }
  .no-data { height: 100%; display: flex; align-items: center; justify-content: center; color: var(--text-light); font-size: 13px; }

  /* Ticket List */
  .ticket-list { max-height: 300px; overflow-y: auto; }
  .ticket-item { padding: 15px 10px; border-bottom: 1px solid var(--border-light); transition: background 0.2s; }
  .ticket-item:hover { background: var(--bg-secondary); }

  .status-badge {
    padding: 2px 8px;
    border-radius: 4px;
    font-size: 11px;
    font-weight: 700;
    text-transform: uppercase;
  }
  .status-open { background: var(--warning-bg); color: var(--warning-text); }
  .status-resolved { background: var(--success-bg); color: var(--success-text); }
  .status-closed { background: var(--bg-secondary); color: var(--text-light); }

  /* Animation & Scrollbar */
  @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
  .animate-in { animation: fadeIn 0.4s ease-out forwards; }

  ::-webkit-scrollbar { width: 6px; }
  ::-webkit-scrollbar-track { background: var(--bg-secondary); }
  ::-webkit-scrollbar-thumb { background: var(--accent-light); border-radius: 3px; }
  `;

  const CustomerProfile = () => {
      const [activeTab, setActiveTab] = useState('overview');
      const [currentCustomer, setCurrentCustomer] = useState(null);
      const [customers, setCustomers] = useState([]);
      const [filteredCustomers, setFilteredCustomers] = useState([]);
      const [loading, setLoading] = useState(false);
      const [error, setError] = useState(null);
      const [isDark, setIsDark] = useState(false); // Theme state for charts
      
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
      const [charts, setCharts] = useState({});

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

      // --- DATA FETCHING ---
      const fetchCustomers = useCallback(async () => {
          try {
              setError(null);
              const customersCollection = collection(db, 'customers');
              const customersSnapshot = await getDocs(customersCollection);
              
              if (customersSnapshot.empty) {
                  setError('No customers found in database');
                  setCustomers([]);
                  setFilteredCustomers([]);
                  setCurrentCustomer(null);
                  return;
              }

              const customersList = customersSnapshot.docs.map(doc => ({
                  id: doc.id,
                  ...doc.data()
              }));
              
              setCustomers(customersList);
              setFilteredCustomers(customersList);
              
              if (customersList.length > 0) {
                  const currentCustomerExists = currentCustomer && customersList.some(c => c.id === currentCustomer.id);
                  if (!currentCustomerExists) {
                      setCurrentCustomer(customersList[0]);
                  }
              } else {
                  setCurrentCustomer(null);
              }
          } catch (err) {
              console.error('Error fetching customers:', err);
              setError('Failed to load customers');
          }
      }, [currentCustomer]);

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

      useEffect(() => {
          if (currentCustomer) fetchUserData(currentCustomer);
          else { setReviews([]); setCustomerTickets([]); }
      }, [currentCustomer, fetchUserData]);

      // --- RELOAD HANDLERS ---
      const handleReloadCustomers = async () => {
          setLoading(true);
          try {
              const controller = new AbortController();
              setTimeout(() => controller.abort(), 10000);
              await fetch("https://sm-crm-rho.vercel.app/api/customer", { method: 'GET', signal: controller.signal });
              await fetchCustomers();
          } catch (err) {
              console.error("Error reloading:", err);
          } finally {
              setLoading(false);
          }
      };

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

      // Initial Load
      useEffect(() => {
          const init = async () => {
              setLoading(true);
              await fetchCustomers();
              setLoading(false);
          };
          init();
      }, [fetchCustomers]);

      // Search Filtering
      useEffect(() => {
          if (customerSearch) {
              const filtered = customers.filter(c => 
                  c.fullName?.toLowerCase().includes(customerSearch.toLowerCase()) || 
                  c.email?.toLowerCase().includes(customerSearch.toLowerCase())
              );
              setFilteredCustomers(filtered);
              if (filtered.length > 0) {
                  if (!currentCustomer || !filtered.find(c => c.id === currentCustomer.id)) setCurrentCustomer(filtered[0]);
              } else setCurrentCustomer(null);
          } else {
              setFilteredCustomers(customers);
          }
      }, [customerSearch, customers]);

      // --- CHARTS ---
      useEffect(() => {
          if (activeTab === 'analytics' && currentCustomer) {
              setTimeout(() => initializeCharts(), 100);
          }
          return () => Object.values(charts).forEach(c => c && c.destroy());
      }, [activeTab, currentCustomer, reviews, isDark]);

      const getFilteredReviews = () => {
          return reviews.filter(r => {
              const matchesSearch = (r.comment || '').toLowerCase().includes(reviewSearch.toLowerCase()) ||
                                    (r.title || '').toLowerCase().includes(reviewSearch.toLowerCase());
              const matchesRating = reviewRatingFilter === 'all' || r.rating === parseInt(reviewRatingFilter);
              return matchesSearch && matchesRating;
          });
      };

      const initializeCharts = () => {
          Object.values(charts).forEach(c => c && c.destroy());
          const newCharts = {};
          const gridColor = isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)';
          const textColor = isDark ? '#E9ECEE' : '#395A7F';

          // Satisfaction Chart
          if (satisfactionChartRef.current && reviews.length > 0) {
              const ratingCounts = [0, 0, 0, 0, 0];
              reviews.forEach(r => {
                  const rate = Math.round(r.rating || 0);
                  if (rate >= 1 && rate <= 5) ratingCounts[rate - 1]++;
              });

              newCharts.satisfactionChart = new Chart(satisfactionChartRef.current, {
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
          setCharts(newCharts);
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
                                  <Search className="search-icon" size={18} />
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
                                  <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
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
                          <>
                              {/* TABS */}
                              <div className="tabs">
                                  {['overview', 'analytics'].map(tab => (
                                      <div 
                                          key={tab} 
                                          className={`tab ${activeTab === tab ? 'active' : ''}`}
                                          onClick={() => setActiveTab(tab)}
                                      >
                                          {tab.charAt(0).toUpperCase() + tab.slice(1)}
                                      </div>
                                  ))}
                              </div>

                              {/* OVERVIEW TAB */}
                              {activeTab === 'overview' && (
                                  <div className="animate-in">
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

                                      <div className="card">
                                          <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'20px'}}>
                                              <h3><Star size={18} /> Customer Reviews</h3>
                                              <button 
                                                  className="refresh-btn" 
                                                  style={{width:'36px', height:'36px'}}
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
                                  </div>
                              )}

                              {/* ANALYTICS TAB */}
                              {activeTab === 'analytics' && (
                                  <div className="animate-in">
                                      <div className="analytics-grid">
                                          {/* SATISFACTION CHART */}
                                          <div className="card">
                                              <h3><BarChart2 size={18} /> Satisfaction Distribution</h3>
                                              <div className="chart-container">
                                                  {reviews.length > 0 ? (
                                                      <canvas ref={satisfactionChartRef}></canvas>
                                                  ) : (
                                                      <div className="no-data">No review data available.</div>
                                                  )}
                                              </div>
                                          </div>

                                          {/* TICKET HISTORY LIST */}
                                          <div className="card">
                                              <h3><Clock size={18} /> Recent Ticket History</h3>
                                              <div className="ticket-list">
                                                  {customerTickets.length === 0 ? (
                                                      <div className="no-data" style={{height:'100px'}}>No ticket history available.</div>
                                                  ) : (
                                                      customerTickets.map((t, idx) => (
                                                          <div key={t.id || idx} className="ticket-item">
                                                              <div style={{display:'flex', justifyContent:'space-between', marginBottom:'5px'}}>
                                                                  <span style={{fontWeight:'600', color:'var(--text-primary)', fontSize:'14px'}}>
                                                                      {t.subject || "No Subject"}
                                                                  </span>
                                                                  <span className={`status-badge ${
                                                                      (t.status||'').toLowerCase().includes('resolved') ? 'status-resolved' :
                                                                      (t.status||'').toLowerCase().includes('open') ? 'status-open' : 'status-closed'
                                                                  }`}>
                                                                      {t.status || 'Unknown'}
                                                                  </span>
                                                              </div>
                                                              <div style={{display:'flex', justifyContent:'space-between', fontSize:'12px', color:'var(--text-light)'}}>
                                                                  <span>ID: #{t.id ? t.id.substring(0,6) : '---'}</span>
                                                                  <span>{formatDate(t.createdAt || t.date)}</span>
                                                              </div>
                                                              {t.issueDescription && (
                                                                  <p style={{fontSize:'13px', color:'var(--text-secondary)', marginTop:'5px', fontStyle:'italic'}}>
                                                                      {t.issueDescription.substring(0, 100)}...
                                                                  </p>
                                                              )}
                                                          </div>
                                                      ))
                                                  )}
                                              </div>
                                          </div>
                                      </div>
                                  </div>
                              )}
                          </>
                      )}
                  </div>
              </div>
          </div>
      );
  };

  export default CustomerProfile;