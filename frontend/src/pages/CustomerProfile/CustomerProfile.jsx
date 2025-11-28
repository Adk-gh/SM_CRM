import React, { useState, useEffect, useRef } from 'react';
import { Chart, registerables } from 'chart.js';
import './CustomerProfile.css';

// Register Chart.js components
Chart.register(...registerables);

const CustomerProfile = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [currentCustomer, setCurrentCustomer] = useState(null);
  const [filteredCustomers, setFilteredCustomers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // Search and filter states
  const [customerSearch, setCustomerSearch] = useState('');
  const [purchaseSearch, setPurchaseSearch] = useState('');
  const [purchaseBranchFilter, setPurchaseBranchFilter] = useState('all');
  const [purchaseStoreFilter, setPurchaseStoreFilter] = useState('all');
  const [feedbackSearch, setFeedbackSearch] = useState('');
  const [feedbackBranchFilter, setFeedbackBranchFilter] = useState('all');
  const [feedbackStoreFilter, setFeedbackStoreFilter] = useState('all');
  const [interactionSearch, setInteractionSearch] = useState('');
  const [interactionTypeFilter, setInteractionTypeFilter] = useState('all');

  // Chart refs
  const purchaseChartRef = useRef(null);
  const sentimentChartRef = useRef(null);
  const spendingChartRef = useRef(null);
  
  // Chart instances
  const [charts, setCharts] = useState({});

  // Fallback mock data in case API fails
  const mockCustomers = [
    {
      id: "cust_001",
      fullName: "Juan Dela Cruz",
      email: "juan@example.com",
      createdAt: "2022-01-15",
      avatar: "JD",
      purchases: [
        {
          id: "pur_001",
          date: "2023-05-15",
          branch: "SM Megamall",
          store: "TechWorld",
          product: "MacBook Pro 14-inch",
          amount: 89999,
          category: "Electronics"
        }
      ],
      feedback: [
        {
          id: "fb_001",
          date: "2023-05-20",
          branch: "SM Megamall",
          store: "TechWorld", 
          rating: 4,
          review: "Great product quality but delivery was a bit late. Staff was very helpful though.",
          sentiment: -0.3
        }
      ],
      interactions: [
        {
          id: "int_001",
          date: "2023-05-20",
          type: "support",
          details: "Inquired about product warranty",
          status: "resolved",
          assignedTo: "Maria Santos"
        }
      ],
      supportTickets: [
        {
          id: "ST001",
          subject: "Product Warranty Inquiry",
          status: "Resolved",
          date: "2023-05-20",
          assignedTo: "Maria Santos"
        }
      ]
    }
  ];

  // Fetch customer data from your local API endpoint
  const fetchCustomerData = async (email) => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('Fetching customer data for:', email);
      
      // Use your local API endpoint
      const apiUrl = `/api/customer?email=${encodeURIComponent(email)}`;
      console.log('API URL:', apiUrl);
      
      const response = await fetch(apiUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      console.log('Response status:', response.status);
      console.log('Response ok:', response.ok);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('API Error Response:', errorText);
        throw new Error(`API returned ${response.status}: ${response.statusText}`);
      }
      
      const customerData = await response.json();
      console.log('Customer data received:', customerData);
      
      return customerData;
    } catch (err) {
      console.error('Error fetching customer data:', err);
      setError(`Failed to load customer data: ${err.message}`);
      return null;
    } finally {
      setLoading(false);
    }
  };

  // Initialize component - use mock data initially
  useEffect(() => {
    setFilteredCustomers(mockCustomers);
    if (mockCustomers.length > 0) {
      setCurrentCustomer(mockCustomers[0]);
    }
  }, []);

  const loadCustomerByEmail = async (email) => {
    if (!email || email.trim() === '') {
      setError('Please enter an email address');
      return;
    }

    const customerData = await fetchCustomerData(email);
    
    if (customerData) {
      const transformedCustomer = transformCustomerData(customerData);
      setCurrentCustomer(transformedCustomer);
      setFilteredCustomers([transformedCustomer]);
      setError(null);
    } else {
      // Fallback to mock data
      console.log('Using mock data for demonstration');
      const mockCustomer = mockCustomers.find(cust => cust.email === email) || mockCustomers[0];
      setCurrentCustomer(mockCustomer);
      setFilteredCustomers([mockCustomer]);
      setError('Using demo data - API connection failed');
    }
  };

  // Transform API data to match your component structure
  const transformCustomerData = (apiData) => {
    // If API returns an array, take the first customer
    if (Array.isArray(apiData)) {
      if (apiData.length === 0) {
        throw new Error('No customer data found');
      }
      apiData = apiData[0];
    }

    // Map the API response to your component's expected structure
    return {
      id: apiData.customerId || apiData.id || `cust_${Date.now()}`,
      fullName: apiData.fullName || apiData.name || `${apiData.firstName || ''} ${apiData.lastName || ''}`.trim() || 'Unknown Customer',
      email: apiData.email || apiData.customerEmail || 'No email provided',
      createdAt: apiData.createdAt || apiData.registrationDate || apiData.joinDate || new Date().toISOString().split('T')[0],
      avatar: generateAvatar(apiData.fullName || apiData.name || apiData.email),
      purchases: apiData.purchases || apiData.transactions || apiData.orders || [],
      feedback: apiData.feedback || apiData.reviews || apiData.comments || [],
      interactions: apiData.interactions || apiData.customerInteractions || [],
      supportTickets: apiData.supportTickets || apiData.tickets || []
    };
  };

  // Generate avatar from name
  const generateAvatar = (name) => {
    if (!name) return 'CU';
    return name.split(' ').map(word => word[0]).join('').toUpperCase().slice(0, 2);
  };

  // Initialize charts when customer changes
  useEffect(() => {
    if (currentCustomer) {
      initializeCharts(currentCustomer);
    }
    
    return () => {
      Object.values(charts).forEach(chart => chart && chart.destroy);
    };
  }, [currentCustomer]);

  // Filter customers based on search criteria
  useEffect(() => {
    if (currentCustomer) {
      const matchesSearch = currentCustomer.fullName.toLowerCase().includes(customerSearch.toLowerCase()) || 
                           currentCustomer.email.toLowerCase().includes(customerSearch.toLowerCase());
      
      setFilteredCustomers(matchesSearch ? [currentCustomer] : []);
    }
  }, [customerSearch, currentCustomer]);

  // Helper functions
  const formatDate = (dateString) => {
    try {
      const options = { year: 'numeric', month: 'short', day: 'numeric' };
      return new Date(dateString).toLocaleDateString('en-US', options);
    } catch (e) {
      return 'Invalid date';
    }
  };

  // Filter functions
  const getFilteredPurchases = () => {
    if (!currentCustomer) return [];
    
    return (currentCustomer.purchases || []).filter(purchase => {
      const productName = purchase.product || purchase.name || '';
      const matchesSearch = productName.toLowerCase().includes(purchaseSearch.toLowerCase());
      const matchesBranch = purchaseBranchFilter === 'all' || purchase.branch === purchaseBranchFilter;
      const matchesStore = purchaseStoreFilter === 'all' || purchase.store === purchaseStoreFilter;
      
      return matchesSearch && matchesBranch && matchesStore;
    });
  };

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

  const getFilteredInteractions = () => {
    if (!currentCustomer) return [];
    
    return (currentCustomer.interactions || []).filter(interaction => {
      const interactionDetails = interaction.details || interaction.description || '';
      const matchesSearch = interactionDetails.toLowerCase().includes(interactionSearch.toLowerCase());
      const matchesType = interactionTypeFilter === 'all' || interaction.type === interactionTypeFilter;
      
      return matchesSearch && matchesType;
    });
  };

  // Chart initialization
  const initializeCharts = (customer) => {
    Object.values(charts).forEach(chart => chart && chart.destroy());
    
    const isDark = document.body.getAttribute('data-theme') === 'dark';
    const gridColor = isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)';
    const textColor = isDark ? '#A3CAE9' : '#395A7F';

    // Purchase Chart
    if (purchaseChartRef.current && customer.purchases && customer.purchases.length > 0) {
      const branchTotals = {};
      customer.purchases.forEach(purchase => {
        const branch = purchase.branch || 'Unknown Branch';
        if (!branchTotals[branch]) {
          branchTotals[branch] = 0;
        }
        branchTotals[branch] += purchase.amount || 0;
      });

      const purchaseChart = new Chart(purchaseChartRef.current, {
        type: 'bar',
        data: {
          labels: Object.keys(branchTotals),
          datasets: [{
            label: 'Purchase Amount (₱)',
            data: Object.values(branchTotals),
            backgroundColor: ['#395A7F', '#6E9FC1', '#A3CAE9', '#4F7DA8'],
            borderRadius: 8
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

      setCharts(prev => ({ ...prev, purchaseChart }));
    }

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
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
      const spendingData = months.map(() => Math.floor(Math.random() * 2000) + 500);
      
      if (customer.purchases) {
        customer.purchases.forEach(purchase => {
          try {
            const monthIndex = new Date(purchase.date).getMonth();
            if (monthIndex >= 0 && monthIndex < months.length) {
              spendingData[monthIndex] += purchase.amount || 0;
            }
          } catch (e) {
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

  // Handle customer search by email
  const handleCustomerSearch = async (searchEmail) => {
    if (searchEmail) {
      await loadCustomerByEmail(searchEmail);
    }
  };

  return (
    <>
      <div className="split-content">
        {/* Customer List Panel */}
        <div className="customer-list-panel">
          <div className="panel-header">
            <h3>Customers</h3>
            <div className="search-box">
              <i className="fas fa-search"></i>
              <input 
                type="text" 
                placeholder="Enter customer email..." 
                value={customerSearch}
                onChange={(e) => setCustomerSearch(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    handleCustomerSearch(e.target.value);
                  }
                }}
              />
            </div>
            <button 
              className="search-button"
              onClick={() => handleCustomerSearch(customerSearch)}
              disabled={loading}
            >
              {loading ? 'Loading...' : 'Search'}
            </button>
          </div>

          {loading && <div className="loading">Loading customer data...</div>}
          {error && (
            <div className={`error ${error.includes('demo') ? 'warning' : ''}`}>
              {error}
            </div>
          )}

          <div className="customer-list">
            {filteredCustomers.map((customer) => (
              <div 
                key={customer.id}
                className={`customer-item ${currentCustomer?.id === customer.id ? 'active' : ''}`}
                onClick={() => setCurrentCustomer(customer)}
              >
                <div className="customer-avatar-small">{customer.avatar}</div>
                <div className="customer-info-small">
                  <h4>{customer.fullName}</h4>
                  <p>{customer.email}</p>
                </div>
              </div>
            ))}
            {!loading && !error && filteredCustomers.length === 0 && (
              <div className="no-customers">Search for a customer by email</div>
            )}
          </div>
        </div>

        {/* Customer Details Panel */}
        <div className="customer-details-panel">
          {loading ? (
            <div className="loading">Loading customer details...</div>
          ) : error && !error.includes('demo') ? (
            <div className="error">Error loading customer details: {error}</div>
          ) : !currentCustomer ? (
            <div className="no-customer-selected">
              Please search for a customer by email to view their profile
            </div>
          ) : (
            <>
              <div className="tabs">
                <div className={`tab ${activeTab === 'overview' ? 'active' : ''}`} onClick={() => setActiveTab('overview')}>
                  Overview
                </div>
                <div className={`tab ${activeTab === 'interactions' ? 'active' : ''}`} onClick={() => setActiveTab('interactions')}>
                  Interactions
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
                        <span className="detail-value">{currentCustomer.fullName}</span>
                      </li>
                      <li className="detail-item">
                        <span className="detail-label">Email</span>
                        <span className="detail-value">{currentCustomer.email}</span>
                      </li>
                      <li className="detail-item">
                        <span className="detail-label">Member Since</span>
                        <span className="detail-value">{formatDate(currentCustomer.createdAt)}</span>
                      </li>
                    </ul>
                  </div>

                  <div className="detail-card">
                    <h3><i className="fas fa-shopping-cart"></i> Purchase History</h3>
                    <div className="search-controls">
                      <div className="search-control">
                        <input 
                          type="text" 
                          placeholder="Search products..."
                          value={purchaseSearch}
                          onChange={(e) => setPurchaseSearch(e.target.value)}
                        />
                      </div>
                      <div className="search-control">
                        <select 
                          value={purchaseBranchFilter}
                          onChange={(e) => setPurchaseBranchFilter(e.target.value)}
                        >
                          <option value="all">All Branches</option>
                          <option value="SM Megamall">SM Megamall</option>
                          <option value="SM Cebu">SM Cebu</option>
                          <option value="SM North EDSA">SM North EDSA</option>
                        </select>
                      </div>
                      <div className="search-control">
                        <select 
                          value={purchaseStoreFilter}
                          onChange={(e) => setPurchaseStoreFilter(e.target.value)}
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
                    <ul className="purchase-list">
                      {getFilteredPurchases().length === 0 ? (
                        <li className="purchase-item" style={{ textAlign: 'center', color: 'var(--text-light)' }}>
                          No purchases found
                        </li>
                      ) : (
                        getFilteredPurchases().map(purchase => (
                          <li key={purchase.id} className="purchase-item">
                            <div className="purchase-header">
                              <span className="purchase-branch">{purchase.branch}</span>
                              <span className="purchase-date">{formatDate(purchase.date)}</span>
                            </div>
                            <div className="purchase-store">{purchase.store}</div>
                            <div className="purchase-product">{purchase.product}</div>
                            <div className="purchase-amount">₱{(purchase.amount || 0).toLocaleString()}</div>
                          </li>
                        ))
                      )}
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
                          No feedback found
                        </li>
                      ) : (
                        getFilteredFeedback().map(feedback => {
                          const rating = feedback.rating || 0;
                          const stars = '★'.repeat(rating) + '☆'.repeat(5 - rating);
                          return (
                            <li key={feedback.id} className="feedback-item">
                              <div className="feedback-header">
                                <span className="feedback-branch">{feedback.branch}</span>
                                <span className="feedback-date">{formatDate(feedback.date)}</span>
                              </div>
                              <div className="feedback-store">{feedback.store}</div>
                              <div className="feedback-rating">
                                <span className="rating-stars">{stars}</span>
                                <span>{rating}/5</span>
                              </div>
                              <div className="feedback-review">"{feedback.review || feedback.comment}"</div>
                            </li>
                          );
                        })
                      )}
                    </ul>
                  </div>
                </div>
              )}

              {activeTab === 'interactions' && (
                <div className="tab-content active">
                  <div className="customer-details-grid">
                    <div className="detail-card">
                      <h3><i className="fas fa-history"></i> Interaction History</h3>
                      <div className="search-controls">
                        <div className="search-control">
                          <input 
                            type="text" 
                            placeholder="Search interactions..."
                            value={interactionSearch}
                            onChange={(e) => setInteractionSearch(e.target.value)}
                          />
                        </div>
                        <div className="search-control">
                          <select 
                            value={interactionTypeFilter}
                            onChange={(e) => setInteractionTypeFilter(e.target.value)}
                          >
                            <option value="all">All Types</option>
                            <option value="support">Support Ticket</option>
                            <option value="feedback">Feedback</option>
                            <option value="purchase">Purchase</option>
                          </select>
                        </div>
                      </div>
                      <ul className="interaction-list">
                        {getFilteredInteractions().length === 0 ? (
                          <li className="interaction-item" style={{ textAlign: 'center', color: 'var(--text-light)' }}>
                            No interactions found
                          </li>
                        ) : (
                          getFilteredInteractions().map(interaction => (
                            <li key={interaction.id} className="interaction-item">
                              <div className="interaction-header">
                                <span className="interaction-type">{interaction.type}</span>
                                <span className="interaction-date">{formatDate(interaction.date)}</span>
                              </div>
                              <div className="interaction-details">{interaction.details || interaction.description}</div>
                              <div className="interaction-status">
                                <span className={`status-badge status-${interaction.status}`}>
                                  {interaction.status}
                                </span>
                                {interaction.assignedTo && (
                                  <span className="assigned-to">Assigned to: {interaction.assignedTo}</span>
                                )}
                              </div>
                            </li>
                          ))
                        )}
                      </ul>
                    </div>

                    <div className="detail-card">
                      <h3><i className="fas fa-headset"></i> Support Tickets</h3>
                      <ul className="ticket-list">
                        {(currentCustomer.supportTickets || []).length === 0 ? (
                          <li className="ticket-item" style={{ textAlign: 'center', color: 'var(--text-light)' }}>
                            No support tickets
                          </li>
                        ) : (
                          (currentCustomer.supportTickets || []).map(ticket => (
                            <li key={ticket.id} className="ticket-item">
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

              {activeTab === 'analytics' && (
                <div className="tab-content active">
                  <div className="analytics-grid">
                    <div className="analytics-card">
                      <h3>Purchase Analytics</h3>
                      <div className="chart-container">
                        <canvas ref={purchaseChartRef}></canvas>
                      </div>
                    </div>

                    <div className="analytics-card">
                      <h3>Sentiment Analysis</h3>
                      <div className="chart-container">
                        <canvas ref={sentimentChartRef}></canvas>
                      </div>
                    </div>

                    <div className="analytics-card">
                      <h3>Spending Trends</h3>
                      <div className="chart-container">
                        <canvas ref={spendingChartRef}></canvas>
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