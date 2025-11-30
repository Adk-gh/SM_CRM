import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Chart, registerables } from 'chart.js';
import { collection, getDocs, query, where } from 'firebase/firestore';
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
 
 // Reviews state
 const [reviews, setReviews] = useState([]);
 const [loadingReviews, setLoadingReviews] = useState(false);
 
 // Search and filter states
 const [customerSearch, setCustomerSearch] = useState('');
 const [reviewSearch, setReviewSearch] = useState('');
 const [reviewRatingFilter, setReviewRatingFilter] = useState('all');
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
   setError(null);
   
   console.log('Fetching customers from CRM Firestore...');
   
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
    id: doc.id, // 🔑 IMPORTANT: Reading the document ID (which is the userId after sync)
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
   throw err;
  }
 }, [currentCustomer]);

 // Fetch reviews for current customer
 const fetchReviews = useCallback(async (userId) => {
  if (!userId) {
   setReviews([]);
   return;
  }

  setLoadingReviews(true);
  try {
   // 🔑 IMPORTANT: We use the userId (currentCustomer.id) to query the reviews collection.
   console.log('Fetching reviews for user ID:', userId); 
   
   const reviewsCollection = collection(db, 'reviews');
   // This relies on the 'userId' field in the 'reviews' document matching the customer's document ID.
   const reviewsQuery = query(reviewsCollection, where('userId', '==', userId));
   const reviewsSnapshot = await getDocs(reviewsQuery);
   
   const reviewsList = reviewsSnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
   }));

   console.log(`Found ${reviewsList.length} reviews for user ID ${userId}`);
   setReviews(reviewsList);
   
  } catch (err) {
   console.error('Error fetching reviews:', err);
   setReviews([]);
  } finally {
   setLoadingReviews(false);
  }
 }, []);

 // Fetch reviews when current customer changes
 useEffect(() => {
  // Use currentCustomer.id which holds the unique Firebase User ID
  if (currentCustomer?.id) { 
   fetchReviews(currentCustomer.id);
  } else {
   setReviews([]);
  }
 }, [currentCustomer, fetchReviews]);

 const handleReloadCustomers = async () => {
  setLoading(true);
  setError(null);
  const apiUri = "https://sm-crm-rho.vercel.app/api/customer"; 
  
  try {
   console.log(`Triggering external data sync via: ${apiUri}`);
   
   const controller = new AbortController();
   const timeoutId = setTimeout(() => controller.abort(), 10000);

   const res = await fetch(apiUri, { 
    method: 'GET',
    signal: controller.signal
   });
   clearTimeout(timeoutId);

   if (!res.ok) {
    console.warn(`External API trigger failed with status: ${res.status}. Proceeding with Firebase refresh.`);
   } else {
    console.log("External data sync trigger successful.");
   }

   await fetchCustomers();

  } catch (err) {
   if (err.name === 'AbortError') {
     console.error("API request timed out.");
     setError("Data synchronization request timed out.");
   } else {
     console.error("Network/CORS Error during API trigger or customer reload:", err);
     setError(`Failed to trigger data update or reload customers. Check network or CORS configuration: ${err.message}`);
   }
  } finally {
   setLoading(false);
  }
 };

 const handleReloadReviews = async () => {
  setLoadingReviews(true);
  const reviewsApiUri = "https://sm-crm-rho.vercel.app/api/reviews"; 
  
  try {
   console.log(`Triggering reviews data sync via: ${reviewsApiUri}`);
   
   const controller = new AbortController();
   const timeoutId = setTimeout(() => controller.abort(), 10000);

   const res = await fetch(reviewsApiUri, { 
    method: 'GET',
    signal: controller.signal
   });
   clearTimeout(timeoutId);

   if (!res.ok) {
    console.warn(`Reviews API trigger failed with status: ${res.status}. Proceeding with Firebase refresh.`);
   } else {
    console.log("Reviews data sync trigger successful.");
   }

   // Refresh reviews from Firebase after API sync
   if (currentCustomer?.id) {
    await fetchReviews(currentCustomer.id);
   }

  } catch (err) {
   if (err.name === 'AbortError') {
    console.error("Reviews API request timed out.");
   } else {
    console.error("Network/CORS Error during reviews API trigger:", err);
   }
  } finally {
   setLoadingReviews(false);
  }
 };

 // Initialize component - load customers from Firestore
 useEffect(() => {
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
 }, [currentCustomer, reviews, charts]);

 // Helper function to get filtered reviews
 const getFilteredReviews = () => {
  return reviews.filter(review => {
   const matchesSearch = (review.comment || '').toLowerCase().includes(reviewSearch.toLowerCase()) ||
             (review.title || '').toLowerCase().includes(reviewSearch.toLowerCase());
   const matchesRating = reviewRatingFilter === 'all' || review.rating === parseInt(reviewRatingFilter);
   
   return matchesSearch && matchesRating;
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

  // Sentiment Chart - based on reviews
  if (sentimentChartRef.current && reviews.length > 0) {
   const positiveCount = reviews.filter(review => (review.rating || 0) >= 4).length;
   const neutralCount = reviews.filter(review => (review.rating || 0) === 3).length;
   const negativeCount = reviews.filter(review => (review.rating || 0) <= 2).length;

   const sentimentChart = new Chart(sentimentChartRef.current, {
    type: 'doughnut',
    data: {
     labels: ['Positive (4-5★)', 'Neutral (3★)', 'Negative (1-2★)'],
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
         Support
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
           <li className="detail-item">
            <span className="detail-label">Total Reviews</span>
            <span className="detail-value">{reviews.length}</span>
           </li>
          </ul>
         </div>

         <div className="detail-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
           <h3><i className="fas fa-star"></i> Customer Reviews</h3>
           <button
            className="reload-button"
            onClick={handleReloadReviews} 
            disabled={loadingReviews}
            title="Reload reviews from API"
           >
            <i className={`fas fa-sync-alt ${loadingReviews ? 'fa-spin' : ''}`}></i>
           </button>
          </div>
          <div className="search-controls">
           <div className="search-control">
            <input 
             type="text" 
             placeholder="Search reviews..."
             value={reviewSearch}
             onChange={(e) => setReviewSearch(e.target.value)}
            />
           </div>
           <div className="search-control">
            <select 
             value={reviewRatingFilter}
             onChange={(e) => setReviewRatingFilter(e.target.value)}
            >
             <option value="all">All Ratings</option>
             <option value="5">5 Stars</option>
             <option value="4">4 Stars</option>
             <option value="3">3 Stars</option>
             <option value="2">2 Stars</option>
             <option value="1">1 Star</option>
            </select>
           </div>
          </div>
          
          {loadingReviews ? (
           <div className="loading">Loading reviews...</div>
          ) : (
           <ul className="feedback-list">
            {getFilteredReviews().length === 0 ? (
             <li className="feedback-item" style={{ textAlign: 'center', color: 'var(--text-light)' }}>
              {reviews.length > 0 
               ? 'No reviews match your filters' 
               : 'No reviews found for this customer'}
             </li>
            ) : (
             getFilteredReviews().map((review) => {
              const rating = review.rating || 0;
              const stars = '★'.repeat(rating) + '☆'.repeat(5 - rating);
              return (
               <li key={review.id} className="feedback-item">
                <div className="feedback-header">
                 <span className="feedback-branch">{review.userName || currentCustomer.fullName}</span>
                 <span className="feedback-date">{formatDate(review.timestamp)}</span>
                </div>
                <div className="feedback-store">{review.title || 'Review'}</div>
                <div className="feedback-rating">
                 <span className="rating-stars">{stars}</span>
                 <span>{rating}/5</span>
                </div>
                <div className="feedback-review">"{review.comment}"</div>
               </li>
              );
             })
            )}
           </ul>
          )}
         </div>
        </div>
       )}

       {/* Support Tab */}
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
           <h3>Review Sentiment Analysis</h3>
           <div className="chart-container">
            {reviews.length > 0 ? (
              <canvas ref={sentimentChartRef}></canvas>
            ) : (
             <div className="no-data-chart">No review data available to chart sentiment.</div>
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