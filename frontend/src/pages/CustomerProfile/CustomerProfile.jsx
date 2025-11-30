import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Chart, registerables } from 'chart.js';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../../../firebase'; // Adjust path to your firebase config
import './CustomerProfile.css';

// Register Chart.js components
Chart.register(...registerables);

// Generate avatar from name
const generateAvatar = (name) => {
  if (!name) return 'CU';
  return name.split(' ').map(word => word[0]).join('').toUpperCase().slice(0, 2);
};

// Format Firestore timestamp for display
const formatDate = (timestamp) => {
  if (!timestamp) return 'N/A';
  
  try {
    // Handle both Firestore Timestamp and string dates
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return date.toLocaleDateString('en-US', options);
  } catch {
    return 'Invalid date';
  }
};

const CustomerProfile = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [currentCustomer, setCurrentCustomer] = useState(null);
  const [customers, setCustomers] = useState([]);
  const [filteredCustomers, setFilteredCustomers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // Search and filter states
  const [customerSearch, setCustomerSearch] = useState('');

  const [feedbackSearch, setFeedbackSearch] = useState('');
  const [feedbackBranchFilter, setFeedbackBranchFilter] = useState('all');
  const [feedbackStoreFilter, setFeedbackStoreFilter] = useState('all');
  const [supportSearch, setsupportSearch] = useState('');
  const [supportTypeFilter, setsupportTypeFilter] = useState('all');

  // Chart refs
 
  const sentimentChartRef = useRef(null);
  const spendingChartRef = useRef(null);
  
  // Chart instances
  const [charts, setCharts] = useState({});

  // Fetch customers from Firebase Firestore (Reusable function)
  const fetchCustomers = useCallback(async () => {
    try {
      // NOTE: Loading state is managed by the caller (handleReloadCustomers or useEffect)
      setError(null);
      
      console.log('Fetching customers from Firestore...');
      
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

      console.log(`Found ${customersList.length} customers:`, customersList);
      
      setCustomers(customersList);
      setFilteredCustomers(customersList);
      
      // Attempt to keep the current customer selected, otherwise select the first one.
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
      setError('Failed to load customers from database');
      setCustomers([]);
      setFilteredCustomers([]);
      setCurrentCustomer(null);
      throw err; // Re-throw the error so the caller can catch it and reset loading
    }
  }, [currentCustomer]);

  // FIX: Function to invoke external API (to update DB) and then refresh local state (from Firebase)
// ... (in CustomerProfile.jsx)

  const handleReloadCustomers = async () => {
    setLoading(true);
    setError(null);
    const apiUri = "https://sm-crm-rho.vercel.app/api/customer"; 
    
    try {
      console.log(`Triggering external data sync via: ${apiUri}`);
      
      // Step 1: Execute the API call to trigger the backend update
      // Add a 10-second timeout for robustness
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 seconds timeout

      const res = await fetch(apiUri, { 
        method: 'GET',
        signal: controller.signal // Apply the abort signal
      });
      clearTimeout(timeoutId); // Clear the timeout if fetch completes

      if (!res.ok) {
        // Log API status if response received but status is bad (e.g., 404, 500)
        console.warn(`External API trigger failed with status: ${res.status}. Proceeding with Firebase refresh.`);
      } else {
        console.log("External data sync trigger successful.");
      }

      // Step 2: Refresh the local customer list from Firebase
      await fetchCustomers();

    } catch (err) {
      if (err.name === 'AbortError') {
          console.error("API request timed out.");
          setError("Data synchronization request timed out.");
      } else {
          // This block is where the "TypeError: Failed to fetch" is caught
          console.error("Network/CORS Error during API trigger or customer reload:", err);
          setError(`Failed to trigger data update or reload customers. Check network or CORS configuration: ${err.message}`);
      }
    } finally {
      setLoading(false);
    }
  };

// ...

  // Initialize component - load customers from Firestore
  useEffect(() => {
    // Initial load uses fetchCustomers directly
    const initialLoad = async () => {
      setLoading(true);
      try {
        await fetchCustomers();
      } catch {
        // Error already set in fetchCustomers
      } finally {
        setLoading(false);
      }
    };
    initialLoad();
  }, [fetchCustomers]);

  // Filter customers based on search criteria
  useEffect(() => {
    if (customerSearch) {
      const filtered = customers.filter(customer => 
        customer.fullName?.toLowerCase().includes(customerSearch.toLowerCase()) || 
        customer.email?.toLowerCase().includes(customerSearch.toLowerCase())
      );
      setFilteredCustomers(filtered);
      if (filtered.length > 0) {
        const currentCustomerExists = currentCustomer && filtered.some(c => c.id === currentCustomer.id);
        if (!currentCustomerExists) {
             setCurrentCustomer(filtered[0]);
        }
      } else if (filtered.length === 0) {
          setCurrentCustomer(null);
      }
    } else {
      setFilteredCustomers(customers);
    }
  }, [customerSearch, customers, currentCustomer]);

  // Initialize charts when customer changes
  useEffect(() => {
    if (currentCustomer) {
      initializeCharts(currentCustomer);
    }
    
    return () => {
      Object.values(charts).forEach(chart => chart && chart.destroy());
    };
  }, [currentCustomer, charts]);


  
  
  // Helper function to get filtered feedback
  const getFilteredFeedback = () => {
    if (!currentCustomer) return [];
    
    return (currentCustomer.feedback || []).filter(feedback => {
      const reviewText = feedback.review || feedback.comment || '';
      const matchesSearch = reviewText.toLowerCase().includes(feedbackSearch.toLowerCase());
      const matchesBranch = feedbackBranchFilter === 'all' || feedback.branch === feedbackBranchFilter;
      const matchesStore = feedbackStoreFilter === 'all' || feedback.store === feedbackStoreFilter;
      
      return matchesSearch && matchesBranch && matchesStore;
    });
  };

  // Helper function to get filtered supports
  const getFilteredsupports = () => {
    if (!currentCustomer) return [];
    
    return (currentCustomer.supports || []).filter(support => {
      const supportDetails = support.details || support.description || '';
      const matchesSearch = supportDetails.toLowerCase().includes(supportSearch.toLowerCase());
      const matchesType = supportTypeFilter === 'all' || support.type === supportTypeFilter;
      
      return matchesSearch && matchesType;
    });
  };

  // Chart initialization
  const initializeCharts = (customer) => {
    // Clear existing charts
    Object.values(charts).forEach(chart => chart && chart.destroy());
    
    const isDark = document.body.getAttribute('data-theme') === 'dark';
    const gridColor = isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)';
    const textColor = isDark ? '#A3CAE9' : '#395A7F';

   

      

    // Sentiment Chart
    if (sentimentChartRef.current && customer.feedback && customer.feedback.length > 0) {
      const positiveCount = customer.feedback.filter(fb => (fb.sentiment || 0) > 0).length;
      const negativeCount = customer.feedback.filter(fb => (fb.sentiment || 0) < 0).length;
      const neutralCount = customer.feedback.filter(fb => (fb.sentiment || 0) === 0).length;

      const sentimentChart = new Chart(sentimentChartRef.current, {
        type: 'doughnut',
        data: {
          labels: ['Positive', 'Neutral', 'Negative'],
          datasets: [{
            data: [positiveCount, neutralCount, negativeCount],
            backgroundColor: ['#48BB78', '#A3CAE9', '#F56565'],
            borderWidth: 0,
            hoverOffset: 10
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              position: 'bottom',
              labels: {
                color: textColor
              }
            }
          },
          cutout: '70%'
        }
      });

      setCharts(prev => ({ ...prev, sentimentChart }));
    }

    // Spending Chart
    if (spendingChartRef.current) {
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const spendingData = months.map(() => 0); 
      
      if (customer.purchases) {
        customer.purchases.forEach(purchase => {
          try {
            const date = purchase.date?.toDate ? purchase.date.toDate() : new Date(purchase.date);
            const monthIndex = date.getMonth(); 
            
            if (monthIndex >= 0 && monthIndex < months.length) {
              spendingData[monthIndex] += purchase.amount || 0;
            }
          } catch {
            console.warn('Invalid purchase date:', purchase.date);
          }
        });
      }

      const spendingChart = new Chart(spendingChartRef.current, {
        type: 'line',
        data: {
          labels: months,
          datasets: [{
            label: 'Spending Trend (₱)',
            data: spendingData,
            borderColor: '#395A7F',
            backgroundColor: 'rgba(57, 90, 127, 0.1)',
            borderWidth: 3,
            fill: true,
            tension: 0.4,
            pointBackgroundColor: '#395A7F',
            pointBorderColor: '#ffffff',
            pointBorderWidth: 2,
            pointRadius: 5
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              display: false
            }
          },
          scales: {
            y: {
              beginAtZero: true,
              grid: {
                color: gridColor
              },
              ticks: {
                color: textColor
              }
            },
            x: {
              grid: {
                display: false
              },
              ticks: {
                color: textColor
              }
            }
          }
        }
      });

      setCharts(prev => ({ ...prev, spendingChart }));
    }
  };


  return (
    <>
      <div className="split-content">
        {/* Customer List Panel */}
        <div className="customer-list-panel">
          <div className="panel-header">
            <h3>Customers</h3>
            <div className="search-controls">
              <div className="search-box">
                <i className="fas fa-search"></i>
                <input 
                  type="text" 
                  placeholder="Search by name or email..." 
                  value={customerSearch}
                  onChange={(e) => setCustomerSearch(e.target.value)}
                />
              </div>
              <button
              className="reload-button"
              onClick={handleReloadCustomers} 
              disabled={loading}
              title="Reload customers from database (Triggers API sync)"
            >
              <i className={`fas fa-sync-alt ${loading ? 'fa-spin' : ''}`}></i>
            </button>

            </div>
          </div>

          {loading && <div className="loading">Loading customers from database...</div>}
          {error && (
            <div className="error">
              {error}
            </div>
          )}

          <div className="customer-list">
            {!loading && filteredCustomers.length === 0 && (
              <div className="no-customers">
                {customerSearch ? 'No customers found matching your search' : 'No customers found in database'}
              </div>
            )}
            
            {filteredCustomers.map((customer) => (
              <div 
                key={customer.id}
                className={`customer-item ${currentCustomer?.id === customer.id ? 'active' : ''}`}
                onClick={() => setCurrentCustomer(customer)}
              >
                <div className="customer-avatar-small">
                  {generateAvatar(customer.fullName)}
                </div>
                <div className="customer-info-small">
                  <h4>{customer.fullName || 'Unknown Customer'}</h4>
                  <p>{customer.email || 'No email provided'}</p>
                  <small className="customer-meta">
                    Member since {formatDate(customer.createdAt)}
                    {customer.purchases && customer.purchases.length > 0 && (
                      <span> • {customer.purchases.length} purchases</span>
                    )}
                  </small>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Customer Details Panel */}
        <div className="customer-details-panel">
          {loading ? (
            <div className="loading">Loading customer details...</div>
          ) : error ? (
            <div className="error">Error loading customer details: {error}</div>
          ) : !currentCustomer ? (
            <div className="no-customer-selected">
              {filteredCustomers.length === 0 
                ? 'No customers found in database' 
                : 'Select a customer from the list to view their profile'
              }
            </div>
          ) : (
            <>
              
              <div className="tabs">
                <div className={`tab ${activeTab === 'overview' ? 'active' : ''}`} onClick={() => setActiveTab('overview')}>
                  Overview
                </div>
                <div className={`tab ${activeTab === 'supports' ? 'active' : ''}`} onClick={() => setActiveTab('supports')}>
                  supports
                </div>
                <div className={`tab ${activeTab === 'analytics' ? 'active' : ''}`} onClick={() => setActiveTab('analytics')}>
                  Analytics
                </div>
              </div>

              {activeTab === 'overview' && (
                <div className="tab-content active">
                  <div className="detail-card">
                    <h3><i className="fas fa-user"></i> Customer Information</h3>
                    <ul className="detail-list">
                      <li className="detail-item">
                        <span className="detail-label">Full Name</span>
                        <span className="detail-value">{currentCustomer.fullName || 'Unknown Customer'}</span>
                      </li>
                      <li className="detail-item">
                        <span className="detail-label">Email</span>
                        <span className="detail-value">{currentCustomer.email || 'No email provided'}</span>
                      </li>
                      <li className="detail-item">
                        <span className="detail-label">Member Since</span>
                        <span className="detail-value">{formatDate(currentCustomer.createdAt)}</span>
                      </li>
                    </ul>
                  </div>

                  

                  <div className="detail-card">
                    <h3><i className="fas fa-comment-dots"></i> Feedback & Reviews</h3>
                    <div className="search-controls">
                      <div className="search-control">
                        <input 
                          type="text" 
                          placeholder="Search reviews..."
                          value={feedbackSearch}
                          onChange={(e) => setFeedbackSearch(e.target.value)}
                        />
                      </div>
                      <div className="search-control">
                        <select 
                          value={feedbackBranchFilter}
                          onChange={(e) => setFeedbackBranchFilter(e.target.value)}
                        >
                          <option value="all">All Branches</option>
                          <option value="SM Megamall">SM Megamall</option>
                          <option value="SM Cebu">SM Cebu</option>
                          <option value="SM North EDSA">SM North EDSA</option>
                        </select>
                      </div>
                      <div className="search-control">
                        <select 
                          value={feedbackStoreFilter}
                          onChange={(e) => setFeedbackStoreFilter(e.target.value)}
                        >
                          <option value="all">All Stores</option>
                          <option value="TechWorld">TechWorld</option>
                          <option value="Café Bliss">Café Bliss</option>
                          <option value="Fashion Hub">Fashion Hub</option>
                          <option value="Beauty Store">Beauty Store</option>
                          <option value="Electronics Plus">Electronics Plus</option>
                        </select>
                      </div>
                    </div>
                    <ul className="feedback-list">
  {getFilteredFeedback().length === 0 ? (
    <li className="feedback-item" style={{ textAlign: 'center', color: 'var(--text-light)' }}>
      {currentCustomer.feedback && currentCustomer.feedback.length > 0 
        ? 'No feedback matches your filters' 
        : 'No feedback found for this customer'}
    </li>
  ) : (
    getFilteredFeedback().map((feedback, index) => {
      const rating = feedback.rating || 0;
      const stars = '★'.repeat(rating) + '☆'.repeat(5 - rating);
      return (
        <li key={feedback.id || index} className="feedback-item">
          <div className="feedback-header">
            <span className="feedback-branch">{feedback.branch || 'N/A'}</span>
            <span className="feedback-date">{formatDate(feedback.timestamp)}</span>
          </div>
          <div className="feedback-store">{feedback.store || feedback.title}</div>
          <div className="feedback-rating">
            <span className="rating-stars">{stars}</span>
            <span>{rating}/5</span>
          </div>
          <div className="feedback-review">"{feedback.comment}"</div>
        </li>
      );
    })
  )}
</ul>

                  </div>
                </div>
              )}

              {/* supports Tab */}
              {activeTab === 'supports' && (
                <div className="tab-content active">
                  <div className="customer-details-grid">
                    

                    <div className="detail-card">
                      <h3><i className="fas fa-headset"></i> Support Tickets</h3>
                      <ul className="ticket-list">
                        {(currentCustomer.supportTickets || []).length === 0 ? (
                          <li className="ticket-item" style={{ textAlign: 'center', color: 'var(--text-light)' }}>
                            No support tickets
                          </li>
                        ) : (
                          (currentCustomer.supportTickets || []).map((ticket, index) => (
                            <li key={ticket.id || index} className="ticket-item">
                              <div className="ticket-header">
                                <span className="ticket-subject">{ticket.subject}</span>
                                <span className={`ticket-status status-${(ticket.status || '').toLowerCase()}`}>
                                  {ticket.status}
                                </span>
                              </div>
                              <div className="ticket-date">{formatDate(ticket.date)}</div>
                              <div className="ticket-assigned">Assigned to: {ticket.assignedTo}</div>
                            </li>
                          ))
                        )}
                      </ul>
                    </div>
                  </div>
                </div>
              )}

              {/* Analytics Tab */}
              {activeTab === 'analytics' && (
                <div className="tab-content active">
                  <div className="analytics-grid">
                    

                    <div className="analytics-card">
                      <h3>Sentiment Analysis</h3>
                      <div className="chart-container">
                        {currentCustomer.feedback && currentCustomer.feedback.length > 0 ? (
                            <canvas ref={sentimentChartRef}></canvas>
                        ) : (
                           <div className="no-data-chart">No feedback data available to chart sentiment.</div>
                        )}
                      </div>
                    </div>

                    <div className="analytics-card">
                      <h3>Spending Trends</h3>
                      <div className="chart-container">
                        {currentCustomer.purchases && currentCustomer.purchases.length > 0 ? (
                            <canvas ref={spendingChartRef}></canvas>
                        ) : (
                            <div className="no-data-chart">No spending data available for trends.</div>
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
    </>
  );
};

export default CustomerProfile;