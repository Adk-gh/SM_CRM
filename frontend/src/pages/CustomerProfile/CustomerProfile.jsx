import React, { useState, useEffect, useRef } from 'react';
import { Chart, registerables } from 'chart.js';
import './CustomerProfile.css';

// Register Chart.js components
Chart.register(...registerables);

const CustomerProfile = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [currentCustomer, setCurrentCustomer] = useState(null);
  const [filteredCustomers, setFilteredCustomers] = useState([]);
  
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

  // Customer data
  const customers = [
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
        },
        {
          id: "pur_002", 
          date: "2023-06-22",
          branch: "SM Cebu",
          store: "Café Bliss",
          product: "Premium Coffee Set",
          amount: 1200,
          category: "Food & Beverage"
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
    },
    {
      id: "cust_002",
      fullName: "Maria Santos",
      email: "maria@example.com",
      createdAt: "2022-03-20",
      avatar: "MS",
      purchases: [
        {
          id: "pur_004",
          date: "2023-06-10",
          branch: "SM Megamall",
          store: "Fashion Hub",
          product: "Designer Handbag",
          amount: 4500,
          category: "Fashion"
        }
      ],
      feedback: [
        {
          id: "fb_004",
          date: "2023-06-12",
          branch: "SM Megamall",
          store: "Fashion Hub",
          rating: 5,
          review: "Love the new collection! Quality is excellent.",
          sentiment: 0.8
        }
      ],
      interactions: [
        {
          id: "int_004",
          date: "2023-06-12",
          type: "feedback",
          details: "Submitted positive review",
          status: "processed"
        }
      ],
      supportTickets: []
    }
  ];

  // Initialize component
  useEffect(() => {
    setFilteredCustomers(customers);
    if (customers.length > 0) {
      setCurrentCustomer(customers[0]);
    }
  }, []);

  // Initialize charts when customer changes
  useEffect(() => {
    if (currentCustomer) {
      initializeCharts(currentCustomer);
    }
    
    return () => {
      // Clean up charts on unmount
      Object.values(charts).forEach(chart => chart.destroy());
    };
  }, [currentCustomer]);

  // Filter customers based on search criteria
  useEffect(() => {
    const filtered = customers.filter(customer => {
      const matchesSearch = customer.fullName.toLowerCase().includes(customerSearch.toLowerCase()) || 
                           customer.email.toLowerCase().includes(customerSearch.toLowerCase());
      
      return matchesSearch;
    });
    
    setFilteredCustomers(filtered);
  }, [customerSearch]);

  // Helper functions
  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString('en-US', options);
  };

  // Filter functions
  const getFilteredPurchases = () => {
    if (!currentCustomer) return [];
    
    return currentCustomer.purchases.filter(purchase => {
      const matchesSearch = purchase.product.toLowerCase().includes(purchaseSearch.toLowerCase());
      const matchesBranch = purchaseBranchFilter === 'all' || purchase.branch === purchaseBranchFilter;
      const matchesStore = purchaseStoreFilter === 'all' || purchase.store === purchaseStoreFilter;
      
      return matchesSearch && matchesBranch && matchesStore;
    });
  };

  const getFilteredFeedback = () => {
    if (!currentCustomer) return [];
    
    return currentCustomer.feedback.filter(feedback => {
      const matchesSearch = feedback.review.toLowerCase().includes(feedbackSearch.toLowerCase());
      const matchesBranch = feedbackBranchFilter === 'all' || feedback.branch === feedbackBranchFilter;
      const matchesStore = feedbackStoreFilter === 'all' || feedback.store === feedbackStoreFilter;
      
      return matchesSearch && matchesBranch && matchesStore;
    });
  };

  const getFilteredInteractions = () => {
    if (!currentCustomer) return [];
    
    return currentCustomer.interactions.filter(interaction => {
      const matchesSearch = interaction.details.toLowerCase().includes(interactionSearch.toLowerCase());
      const matchesType = interactionTypeFilter === 'all' || interaction.type === interactionTypeFilter;
      
      return matchesSearch && matchesType;
    });
  };

  // Chart initialization
  const initializeCharts = (customer) => {
    // Clear existing charts
    Object.values(charts).forEach(chart => chart.destroy());
    
    const isDark = document.body.getAttribute('data-theme') === 'dark';
    const gridColor = isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)';
    const textColor = isDark ? '#A3CAE9' : '#395A7F';

    // Purchase Chart
    if (purchaseChartRef.current) {
      const branchTotals = {};
      customer.purchases.forEach(purchase => {
        if (!branchTotals[purchase.branch]) {
          branchTotals[purchase.branch] = 0;
        }
        branchTotals[purchase.branch] += purchase.amount;
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
    if (sentimentChartRef.current) {
      const positiveCount = customer.feedback.filter(fb => fb.sentiment > 0).length;
      const negativeCount = customer.feedback.filter(fb => fb.sentiment < 0).length;
      const neutralCount = customer.feedback.filter(fb => fb.sentiment === 0).length;

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
      
      customer.purchases.forEach(purchase => {
        const monthIndex = new Date(purchase.date).getMonth();
        if (monthIndex >= 0 && monthIndex < months.length) {
          spendingData[monthIndex] += purchase.amount;
        }
      });

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
      {/* Split Content */}
      <div className="split-content">
        {/* Customer List Panel */}
        <div className="customer-list-panel">
          <div className="panel-header">
            <h3>Customers</h3>
            <div className="search-box">
              <i className="fas fa-search"></i>
              <input 
                type="text" 
                placeholder="Search customers..." 
                value={customerSearch}
                onChange={(e) => setCustomerSearch(e.target.value)}
              />
            </div>
          </div>
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
          </div>
        </div>

        {/* Customer Details Panel */}
        <div className="customer-details-panel">
          {/* Tabs for different sections */}
          <div className="tabs">
            <div 
              className={`tab ${activeTab === 'overview' ? 'active' : ''}`}
              onClick={() => setActiveTab('overview')}
            >
              Overview
            </div>
            <div 
              className={`tab ${activeTab === 'interactions' ? 'active' : ''}`}
              onClick={() => setActiveTab('interactions')}
            >
              Interactions
            </div>
            <div 
              className={`tab ${activeTab === 'analytics' ? 'active' : ''}`}
              onClick={() => setActiveTab('analytics')}
            >
              Analytics
            </div>
          </div>

          {/* Overview Tab Content */}
          {activeTab === 'overview' && (
            <div className="tab-content active">
              {/* Customer Information Card - View only */}
              {currentCustomer && (
                <div className="detail-card">
                  <h3><i className="fas fa-user"></i> Customer Information</h3>
                  {/* Edit icon removed */}
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
              )}

              {/* Purchase History Card */}
              {currentCustomer && (
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
                          <div className="purchase-amount">₱{purchase.amount.toLocaleString()}</div>
                        </li>
                      ))
                    )}
                  </ul>
                </div>
              )}

              {/* Feedback & Reviews Card */}
              {currentCustomer && (
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
                        const stars = '★'.repeat(feedback.rating) + '☆'.repeat(5 - feedback.rating);
                        return (
                          <li key={feedback.id} className="feedback-item">
                            <div className="feedback-header">
                              <span className="feedback-branch">{feedback.branch}</span>
                              <span className="feedback-date">{formatDate(feedback.date)}</span>
                            </div>
                            <div className="feedback-store">{feedback.store}</div>
                            <div className="feedback-rating">
                              <span className="rating-stars">{stars}</span>
                              <span>{feedback.rating}/5</span>
                            </div>
                            <div className="feedback-review">"{feedback.review}"</div>
                          </li>
                        );
                      })
                    )}
                  </ul>
                </div>
              )}
            </div>
          )}

          {/* Interactions Tab Content */}
          {activeTab === 'interactions' && (
            <div className="tab-content active">
              <div className="customer-details-grid">
                {/* Interaction History Card */}
                {currentCustomer && (
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
                            <div className="interaction-details">{interaction.details}</div>
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
                )}

                {/* Support Tickets Card */}
                {currentCustomer && (
                  <div className="detail-card">
                    <h3><i className="fas fa-headset"></i> Support Tickets</h3>
                    <ul className="ticket-list">
                      {currentCustomer.supportTickets.length === 0 ? (
                        <li className="ticket-item" style={{ textAlign: 'center', color: 'var(--text-light)' }}>
                          No support tickets
                        </li>
                      ) : (
                        currentCustomer.supportTickets.map(ticket => (
                          <li key={ticket.id} className="ticket-item">
                            <div className="ticket-header">
                              <span className="ticket-subject">{ticket.subject}</span>
                              <span className={`ticket-status status-${ticket.status.toLowerCase()}`}>
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
                )}
              </div>
            </div>
          )}

          {/* Analytics Tab Content */}
          {activeTab === 'analytics' && (
            <div className="tab-content active">
              <div className="analytics-grid">
                {/* Purchase Analytics */}
                {currentCustomer && (
                  <div className="analytics-card">
                    <h3>Purchase Analytics</h3>
                    <div className="chart-container">
                      <canvas ref={purchaseChartRef}></canvas>
                    </div>
                  </div>
                )}

                {/* Sentiment Analysis */}
                {currentCustomer && (
                  <div className="analytics-card">
                    <h3>Sentiment Analysis</h3>
                    <div className="chart-container">
                      <canvas ref={sentimentChartRef}></canvas>
                    </div>
                  </div>
                )}

                {/* Spending Trends */}
                {currentCustomer && (
                  <div className="analytics-card">
                    <h3>Spending Trends</h3>
                    <div className="chart-container">
                      <canvas ref={spendingChartRef}></canvas>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default CustomerProfile;