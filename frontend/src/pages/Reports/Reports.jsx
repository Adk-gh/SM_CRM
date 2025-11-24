import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Chart, registerables } from 'chart.js';
import './Reports.css';

// Register Chart.js components
Chart.register(...registerables);

const Reports = ({ theme = 'light' }) => {
  const [activeTab, setActiveTab] = useState('overview');
  const [filters, setFilters] = useState({
    date: 'last30',
    product: 'all',
    department: 'all'
  });

  // Chart refs
  const revenueChartRef = useRef(null);
  const segmentChartRef = useRef(null);
  const campaignChartRef = useRef(null);
  const productCategoryChartRef = useRef(null);
  const productGrowthChartRef = useRef(null);
  const productProfitabilityChartRef = useRef(null);
  const storePerformanceChartRef = useRef(null);
  const storeRevenueChartRef = useRef(null);
  const hrCorrelationChartRef = useRef(null);
  const employeeSatisfactionChartRef = useRef(null);
  const trainingSatisfactionChartRef = useRef(null);

  // Chart instances
  const chartInstances = useRef({});

  // Sample data
  const kpiData = [
    { value: '₱1.2M', label: 'Total Revenue' },
    { value: '4,850', label: 'Total Orders' },
    { value: '12.5%', label: 'Conversion Rate' },
    { value: '4.7/5', label: 'Avg. Satisfaction' }
  ];

  const topCustomers = [
    {
      name: 'Juan Dela Cruz',
      email: 'juan@example.com',
      phone: '+63 912 345 6789',
      segment: 'High Value',
      loyalty: 'Gold',
      spend: '₱92,699'
    },
    {
      name: 'Maria Santos',
      email: 'maria@example.com',
      phone: '+63 912 987 6543',
      segment: 'Medium Value',
      loyalty: 'Silver',
      spend: '₱5,300'
    },
    {
      name: 'Carlos Reyes',
      email: 'carlos@example.com',
      phone: '+63 912 112 3344',
      segment: 'Low Value',
      loyalty: 'Bronze',
      spend: '₱2,500'
    }
  ];

  const productRankings = [
    { rank: 1, name: 'MacBook Pro 14-inch', sales: '₱899,990' },
    { rank: 2, name: 'Designer Dress Collection', sales: '₱245,500' },
    { rank: 3, name: 'Premium Coffee Set', sales: '₱98,700' },
    { rank: 4, name: 'Skincare Set', sales: '₱76,400' },
    { rank: 5, name: 'Wireless Headphones', sales: '₱52,300' },
    { rank: 6, name: 'Summer Collection Shirt', sales: '₱45,200' },
    { rank: 7, name: 'Smartphone Case', sales: '₱38,700' },
    { rank: 8, name: 'Gaming Mouse', sales: '₱32,100' }
  ];

  const storeEfficiency = [
    { store: 'TechWorld', branch: 'SM Megamall', revenue: '₱950,000', transactions: 320, avgTransaction: '₱2,969', efficiency: '92%', level: 'high' },
    { store: 'Fashion Hub', branch: 'SM North EDSA', revenue: '₱420,000', transactions: 580, avgTransaction: '₱724', efficiency: '78%', level: 'medium' },
    { store: 'Café Bliss', branch: 'SM Cebu', revenue: '₱185,000', transactions: 1250, avgTransaction: '₱148', efficiency: '82%', level: 'medium' },
    { store: 'Beauty Store', branch: 'SM Megamall', revenue: '₱320,000', transactions: 410, avgTransaction: '₱780', efficiency: '88%', level: 'high' },
    { store: 'Electronics Plus', branch: 'SM Cebu', revenue: '₱275,000', transactions: 190, avgTransaction: '₱1,447', efficiency: '65%', level: 'low' }
  ];

  const employeePerformance = [
    { name: 'Maria Santos', department: 'Customer Support', responseTime: '2.5', satisfaction: '4.2/5', correlation: '0.85' },
    { name: 'John Reyes', department: 'Customer Support', responseTime: '1.2', satisfaction: '4.8/5', correlation: '0.92' },
    { name: 'Anna Lopez', department: 'Customer Support', responseTime: '3.1', satisfaction: '4.5/5', correlation: '0.78' },
    { name: 'Robert Lim', department: 'Sales', responseTime: 'N/A', satisfaction: '4.6/5', correlation: '0.81' },
    { name: 'Sarah Tan', department: 'Customer Support', responseTime: '2.1', satisfaction: '4.7/5', correlation: '0.89' },
    { name: 'Michael Chen', department: 'Sales', responseTime: 'N/A', satisfaction: '4.4/5', correlation: '0.76' }
  ];

  const productMetrics = [
    { value: '87%', label: 'Avg. Customer Rating' },
    { value: '24%', label: 'Return Rate' },
    { value: '₱245K', label: 'Avg. Monthly Sales' },
    { value: '18%', label: 'Growth Rate' }
  ];

  const hrMetrics = [
    { value: '4.6/5', label: 'Avg. Employee Rating' },
    { value: '87%', label: 'Retention Rate' },
    { value: '24h', label: 'Avg. Training' },
    { value: '0.82', label: 'Correlation Score' }
  ];

  useEffect(() => {
    updateCharts();
    
    // Cleanup charts on unmount
    return () => {
      Object.values(chartInstances.current).forEach(chart => {
        if (chart) chart.destroy();
      });
    };
  }, [activeTab, filters, theme]);

  const handleFilterChange = (filterType, value) => {
    setFilters(prev => ({
      ...prev,
      [filterType]: value
    }));
  };

  const exportCSV = () => {
    alert('CSV export started. This would download a CSV file in a real application.');
  };

  const exportPDF = () => {
    alert('PDF export started. This would download a PDF file in a real application.');
  };

  const updateCharts = useCallback(() => {
    // Destroy existing charts
    Object.values(chartInstances.current).forEach(chart => {
      if (chart) chart.destroy();
    });

    const isDark = theme === 'dark';
    const textColor = isDark ? '#E9ECEE' : '#395A7F';
    const gridColor = isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)';

    // Revenue Chart
    if (revenueChartRef.current) {
      chartInstances.current.revenue = new Chart(revenueChartRef.current, {
        type: 'line',
        data: {
          labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
          datasets: [{
            label: 'Revenue (₱)',
            data: [1200000, 1500000, 1400000, 1700000, 1800000, 1600000, 1900000, 2100000, 1950000, 2200000, 2300000, 2500000],
            borderColor: '#395A7F',
            backgroundColor: 'rgba(57, 90, 127, 0.1)',
            tension: 0.4,
            fill: true,
            pointBackgroundColor: '#395A7F',
            pointBorderColor: '#fff',
            pointBorderWidth: 2,
            pointRadius: 4
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
              grid: { color: gridColor },
              ticks: { color: textColor }
            },
            x: {
              grid: { display: false },
              ticks: { color: textColor }
            }
          }
        }
      });
    }

    // Segment Chart
    if (segmentChartRef.current) {
      chartInstances.current.segment = new Chart(segmentChartRef.current, {
        type: 'doughnut',
        data: {
          labels: ['High Value', 'Medium Value', 'Low Value'],
          datasets: [{
            label: 'Customer Segment',
            data: [45, 35, 20],
            backgroundColor: ['#FFD700', '#C0C0C0', '#CD7F32'],
            borderWidth: 0
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              position: 'bottom',
              labels: { color: textColor }
            }
          }
        }
      });
    }

    // Campaign Chart
    if (campaignChartRef.current) {
      chartInstances.current.campaign = new Chart(campaignChartRef.current, {
        type: 'bar',
        data: {
          labels: ['Summer Sale', 'Tech Week', 'Back to School', 'Holiday Promo'],
          datasets: [{
            label: 'Conversions',
            data: [120, 90, 150, 200],
            backgroundColor: '#6E9FC1',
            borderRadius: 5
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
              grid: { color: gridColor },
              ticks: { color: textColor }
            },
            x: {
              grid: { display: false },
              ticks: { color: textColor }
            }
          }
        }
      });
    }

    // Product Category Chart
    if (productCategoryChartRef.current) {
      chartInstances.current.productCategory = new Chart(productCategoryChartRef.current, {
        type: 'bar',
        data: {
          labels: ['Electronics', 'Apparel', 'Food & Beverage', 'Beauty', 'Home'],
          datasets: [{
            label: 'Sales (₱)',
            data: [1200000, 650000, 320000, 280000, 190000],
            backgroundColor: ['#395A7F', '#6E9FC1', '#A3CAE9', '#4F7DA8', '#2C3E50'],
            borderRadius: 5
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
              grid: { color: gridColor },
              ticks: { color: textColor }
            },
            x: {
              grid: { display: false },
              ticks: { color: textColor }
            }
          }
        }
      });
    }

    // Product Growth Chart
    if (productGrowthChartRef.current) {
      chartInstances.current.productGrowth = new Chart(productGrowthChartRef.current, {
        type: 'line',
        data: {
          labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
          datasets: [
            {
              label: 'Electronics',
              data: [120, 150, 180, 210, 240, 280],
              borderColor: '#395A7F',
              backgroundColor: 'rgba(57, 90, 127, 0.1)',
              tension: 0.4,
              pointBackgroundColor: '#395A7F',
              pointBorderColor: '#fff',
              pointBorderWidth: 2,
              pointRadius: 4
            },
            {
              label: 'Apparel',
              data: [80, 95, 110, 130, 150, 170],
              borderColor: '#6E9FC1',
              backgroundColor: 'rgba(110, 159, 193, 0.1)',
              tension: 0.4,
              pointBackgroundColor: '#6E9FC1',
              pointBorderColor: '#fff',
              pointBorderWidth: 2,
              pointRadius: 4
            },
            {
              label: 'Food & Beverage',
              data: [60, 70, 85, 95, 110, 125],
              borderColor: '#A3CAE9',
              backgroundColor: 'rgba(163, 202, 233, 0.1)',
              tension: 0.4,
              pointBackgroundColor: '#A3CAE9',
              pointBorderColor: '#fff',
              pointBorderWidth: 2,
              pointRadius: 4
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              position: 'bottom',
              labels: { color: textColor }
            }
          },
          scales: {
            y: {
              beginAtZero: true,
              grid: { color: gridColor },
              ticks: { color: textColor }
            },
            x: {
              grid: { display: false },
              ticks: { color: textColor }
            }
          }
        }
      });
    }

    // Product Profitability Chart
    if (productProfitabilityChartRef.current) {
      chartInstances.current.productProfitability = new Chart(productProfitabilityChartRef.current, {
        type: 'radar',
        data: {
          labels: ['Profit Margin', 'Sales Volume', 'Customer Satisfaction', 'Market Share', 'Growth Rate'],
          datasets: [
            {
              label: 'Electronics',
              data: [85, 90, 80, 75, 95],
              borderColor: '#395A7F',
              backgroundColor: 'rgba(57, 90, 127, 0.2)',
              pointBackgroundColor: '#395A7F',
              pointBorderColor: '#fff',
              pointBorderWidth: 2
            },
            {
              label: 'Apparel',
              data: [70, 85, 90, 80, 75],
              borderColor: '#6E9FC1',
              backgroundColor: 'rgba(110, 159, 193, 0.2)',
              pointBackgroundColor: '#6E9FC1',
              pointBorderColor: '#fff',
              pointBorderWidth: 2
            },
            {
              label: 'Food & Beverage',
              data: [90, 75, 85, 70, 80],
              borderColor: '#A3CAE9',
              backgroundColor: 'rgba(163, 202, 233, 0.2)',
              pointBackgroundColor: '#A3CAE9',
              pointBorderColor: '#fff',
              pointBorderWidth: 2
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              position: 'bottom',
              labels: { color: textColor }
            }
          }
        }
      });
    }

    // Store Performance Chart
    if (storePerformanceChartRef.current) {
      chartInstances.current.storePerformance = new Chart(storePerformanceChartRef.current, {
        type: 'bar',
        data: {
          labels: ['TechWorld', 'Fashion Hub', 'Café Bliss', 'Beauty Store', 'Electronics Plus'],
          datasets: [
            {
              label: 'Revenue (₱ thousands)',
              data: [950, 420, 185, 320, 275],
              backgroundColor: '#395A7F',
              borderRadius: 5,
              yAxisID: 'y'
            },
            {
              label: 'Efficiency Score',
              data: [92, 78, 82, 88, 65],
              backgroundColor: '#6E9FC1',
              borderRadius: 5,
              yAxisID: 'y1'
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          scales: {
            y: {
              type: 'linear',
              display: true,
              position: 'left',
              title: {
                display: true,
                text: 'Revenue (₱ thousands)'
              },
              grid: { color: gridColor },
              ticks: { color: textColor }
            },
            y1: {
              type: 'linear',
              display: true,
              position: 'right',
              title: {
                display: true,
                text: 'Efficiency Score (%)'
              },
              min: 0,
              max: 100,
              grid: {
                drawOnChartArea: false
              },
              ticks: { color: textColor }
            },
            x: {
              grid: { display: false },
              ticks: { color: textColor }
            }
          }
        }
      });
    }

    // Store Revenue Chart
    if (storeRevenueChartRef.current) {
      chartInstances.current.storeRevenue = new Chart(storeRevenueChartRef.current, {
        type: 'pie',
        data: {
          labels: ['SM Megamall', 'SM North EDSA', 'SM Cebu', 'SM Aura', 'SM Mall of Asia'],
          datasets: [{
            label: 'Revenue Distribution',
            data: [45, 25, 15, 10, 5],
            backgroundColor: ['#395A7F', '#6E9FC1', '#A3CAE9', '#4F7DA8', '#2C3E50'],
            borderWidth: 0
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              position: 'bottom',
              labels: { color: textColor }
            }
          }
        }
      });
    }

    // HR Correlation Chart
    if (hrCorrelationChartRef.current) {
      chartInstances.current.hrCorrelation = new Chart(hrCorrelationChartRef.current, {
        type: 'scatter',
        data: {
          datasets: [{
            label: 'Response Time vs Satisfaction',
            data: [
              { x: 2.5, y: 4.2 },
              { x: 1.2, y: 4.8 },
              { x: 3.1, y: 4.5 },
              { x: 4.2, y: 3.9 },
              { x: 0.8, y: 4.9 },
              { x: 2.8, y: 4.3 },
              { x: 1.5, y: 4.7 }
            ],
            backgroundColor: '#395A7F',
            pointRadius: 8,
            pointHoverRadius: 10
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            tooltip: {
              callbacks: {
                label: function(context) {
                  return `Response: ${context.parsed.x}h, Satisfaction: ${context.parsed.y}/5`;
                }
              }
            },
            legend: {
              labels: { color: textColor }
            }
          },
          scales: {
            x: {
              title: {
                display: true,
                text: 'Response Time (hours)'
              },
              grid: { color: gridColor },
              ticks: { color: textColor }
            },
            y: {
              title: {
                display: true,
                text: 'Customer Satisfaction (1-5)'
              },
              min: 3,
              max: 5,
              grid: { color: gridColor },
              ticks: { color: textColor }
            }
          }
        }
      });
    }

    // Employee Satisfaction Chart
    if (employeeSatisfactionChartRef.current) {
      chartInstances.current.employeeSatisfaction = new Chart(employeeSatisfactionChartRef.current, {
        type: 'bar',
        data: {
          labels: ['Q1', 'Q2', 'Q3', 'Q4'],
          datasets: [
            {
              label: 'Employee Satisfaction',
              data: [3.8, 4.2, 4.5, 4.7],
              backgroundColor: '#395A7F',
              borderRadius: 5,
              yAxisID: 'y'
            },
            {
              label: 'Customer Satisfaction',
              data: [4.1, 4.3, 4.6, 4.8],
              backgroundColor: '#6E9FC1',
              borderRadius: 5,
              yAxisID: 'y1'
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              labels: { color: textColor }
            }
          },
          scales: {
            y: {
              type: 'linear',
              display: true,
              position: 'left',
              title: {
                display: true,
                text: 'Employee Satisfaction'
              },
              min: 3,
              max: 5,
              grid: { color: gridColor },
              ticks: { color: textColor }
            },
            y1: {
              type: 'linear',
              display: true,
              position: 'right',
              title: {
                display: true,
                text: 'Customer Satisfaction'
              },
              min: 3,
              max: 5,
              grid: {
                drawOnChartArea: false
              },
              ticks: { color: textColor }
            },
            x: {
              grid: { display: false },
              ticks: { color: textColor }
            }
          }
        }
      });
    }

    // Training Satisfaction Chart
    if (trainingSatisfactionChartRef.current) {
      chartInstances.current.trainingSatisfaction = new Chart(trainingSatisfactionChartRef.current, {
        type: 'line',
        data: {
          labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
          datasets: [
            {
              label: 'Training Hours',
              data: [120, 140, 160, 180, 200, 220, 240, 260, 280, 300, 320, 340],
              borderColor: '#395A7F',
              backgroundColor: 'rgba(57, 90, 127, 0.1)',
              yAxisID: 'y',
              pointBackgroundColor: '#395A7F',
              pointBorderColor: '#fff',
              pointBorderWidth: 2,
              pointRadius: 4
            },
            {
              label: 'Customer Satisfaction',
              data: [4.1, 4.2, 4.3, 4.4, 4.5, 4.5, 4.6, 4.6, 4.7, 4.7, 4.8, 4.8],
              borderColor: '#6E9FC1',
              backgroundColor: 'rgba(110, 159, 193, 0.1)',
              yAxisID: 'y1',
              pointBackgroundColor: '#6E9FC1',
              pointBorderColor: '#fff',
              pointBorderWidth: 2,
              pointRadius: 4
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              labels: { color: textColor }
            }
          },
          scales: {
            y: {
              type: 'linear',
              display: true,
              position: 'left',
              title: {
                display: true,
                text: 'Training Hours'
              },
              grid: { color: gridColor },
              ticks: { color: textColor }
            },
            y1: {
              type: 'linear',
              display: true,
              position: 'right',
              title: {
                display: true,
                text: 'Customer Satisfaction'
              },
              min: 3,
              max: 5,
              grid: {
                drawOnChartArea: false
              },
              ticks: { color: textColor }
            },
            x: {
              grid: { display: false },
              ticks: { color: textColor }
            }
          }
        }
      });
    }
  }, [activeTab, filters, theme]);

  const getLoyaltyBadgeClass = (loyalty) => {
    return `loyalty-badge loyalty-${loyalty.toLowerCase()}`;
  };

  const getEfficiencyClass = (level) => {
    return `efficiency-score efficiency-${level}`;
  };

  return (
    <div className="reports-container" data-theme={theme}>
     
      {/* Filter Controls */}
      <div className="compact-controls">
        <div className="control-group">
          <h3><i className="fas fa-calendar"></i> Date Range</h3>
          <select 
            value={filters.date}
            onChange={(e) => handleFilterChange('date', e.target.value)}
          >
            <option value="last7">Last 7 Days</option>
            <option value="last30">Last 30 Days</option>
            <option value="last90">Last 90 Days</option>
            <option value="lastYear">Last Year</option>
            <option value="custom">Custom Range</option>
          </select>
        </div>

        <div className="control-group">
          <h3><i className="fas fa-box"></i> Product</h3>
          <select 
            value={filters.product}
            onChange={(e) => handleFilterChange('product', e.target.value)}
          >
            <option value="all">All Products</option>
            <option value="electronics">Electronics</option>
            <option value="apparel">Apparel</option>
            <option value="food">Food & Beverage</option>
            <option value="beauty">Beauty</option>
          </select>
        </div>

        <div className="control-group">
          <h3><i className="fas fa-building"></i> Department</h3>
          <select 
            value={filters.department}
            onChange={(e) => handleFilterChange('department', e.target.value)}
          >
            <option value="all">All Departments</option>
            <option value="sales">Sales</option>
            <option value="marketing">Marketing</option>
            <option value="support">Customer Support</option>
          </select>
        </div>

        <div className="control-group">
          <h3><i className="fas fa-download"></i> Export Options</h3>
          <div className="export-buttons">
            <button className="export-btn" onClick={exportCSV}>
              <i className="fas fa-file-csv"></i> CSV
            </button>
            <button className="export-btn" onClick={exportPDF}>
              <i className="fas fa-file-pdf"></i> PDF
            </button>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="kpi-overview">
        {kpiData.map((kpi, index) => (
          <div key={index} className="kpi-card">
            <div className="kpi-value">{kpi.value}</div>
            <div className="kpi-label">{kpi.label}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="tab-container">
        <div 
          className={`tab ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          Overview
        </div>
        <div 
          className={`tab ${activeTab === 'products' ? 'active' : ''}`}
          onClick={() => setActiveTab('products')}
        >
          Product Performance
        </div>
        <div 
          className={`tab ${activeTab === 'stores' ? 'active' : ''}`}
          onClick={() => setActiveTab('stores')}
        >
          Store Efficiency
        </div>
        <div 
          className={`tab ${activeTab === 'hr' ? 'active' : ''}`}
          onClick={() => setActiveTab('hr')}
        >
          HR-Customer Correlation
        </div>
      </div>

      {/* Tab Contents */}
      
      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div className="tab-content active">
          {/* Charts Section */}
          <div className="campaign-charts">
            <div className="chart-container">
              <h3><i className="fas fa-chart-line"></i> Monthly Revenue</h3>
              <canvas ref={revenueChartRef}></canvas>
            </div>
            <div className="chart-container">
              <h3><i className="fas fa-chart-pie"></i> Customer Segmentation</h3>
              <canvas ref={segmentChartRef}></canvas>
            </div>
            <div className="chart-container">
              <h3><i className="fas fa-bullhorn"></i> Campaign Performance</h3>
              <canvas ref={campaignChartRef}></canvas>
            </div>
          </div>

          {/* Top Customers Table */}
          <div className="campaign-table">
            <div className="table-header">
              <h3><i className="fas fa-users"></i> Top Customers</h3>
              <select style={{width: 'auto', background: 'rgba(255,255,255,0.2)', color: 'white', border: 'none'}}>
                <option>Sort by: Total Spend</option>
                <option>Sort by: Loyalty Level</option>
                <option>Sort by: Recent Activity</option>
              </select>
            </div>
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Customer</th>
                    <th>Email</th>
                    <th>Phone</th>
                    <th>Segment</th>
                    <th>Loyalty</th>
                    <th>Total Spend</th>
                  </tr>
                </thead>
                <tbody>
                  {topCustomers.map((customer, index) => (
                    <tr key={index}>
                      <td>{customer.name}</td>
                      <td>{customer.email}</td>
                      <td>{customer.phone}</td>
                      <td><span className="segment-badge">{customer.segment}</span></td>
                      <td><span className={getLoyaltyBadgeClass(customer.loyalty)}>{customer.loyalty}</span></td>
                      <td>{customer.spend}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Product Performance Tab */}
      {activeTab === 'products' && (
        <div className="tab-content active">
          <div className="campaign-overview">
            <div className="campaign-card">
              <h3><i className="fas fa-trophy"></i> Product Performance Rankings</h3>
              <div className="product-rankings">
                {productRankings.map((product, index) => (
                  <div key={index} className="product-item">
                    <div className="product-info">
                      <span className="product-rank">{product.rank}</span>
                      <span className="product-name">{product.name}</span>
                    </div>
                    <span className="product-sales">{product.sales}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="campaign-card">
              <h3><i className="fas fa-chart-bar"></i> Product Performance Metrics</h3>
              {productMetrics.map((metric, index) => (
                <div key={index} className="metric">
                  <span className="metric-label">{metric.label}</span>
                  <span className="metric-value">{metric.value}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="campaign-charts">
            <div className="chart-container">
              <h3><i className="fas fa-chart-bar"></i> Product Performance by Category</h3>
              <canvas ref={productCategoryChartRef}></canvas>
            </div>
            <div className="chart-container">
              <h3><i className="fas fa-chart-line"></i> Product Growth Trends</h3>
              <canvas ref={productGrowthChartRef}></canvas>
            </div>
            <div className="chart-container">
              <h3><i className="fas fa-radar-chart"></i> Product Profitability</h3>
              <canvas ref={productProfitabilityChartRef}></canvas>
            </div>
          </div>
        </div>
      )}

      {/* Store Efficiency Tab */}
      {activeTab === 'stores' && (
        <div className="tab-content active">
          <div className="campaign-table">
            <div className="table-header">
              <h3><i className="fas fa-store"></i> Store Efficiency Comparisons</h3>
              <select style={{width: 'auto', background: 'rgba(255,255,255,0.2)', color: 'white', border: 'none'}}>
                <option>Sort by: Efficiency Score</option>
                <option>Sort by: Revenue</option>
                <option>Sort by: Transactions</option>
              </select>
            </div>
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Store</th>
                    <th>Branch</th>
                    <th>Revenue</th>
                    <th>Transactions</th>
                    <th>Avg. Transaction</th>
                    <th>Efficiency Score</th>
                  </tr>
                </thead>
                <tbody>
                  {storeEfficiency.map((store, index) => (
                    <tr key={index}>
                      <td>{store.store}</td>
                      <td>{store.branch}</td>
                      <td>{store.revenue}</td>
                      <td>{store.transactions}</td>
                      <td>{store.avgTransaction}</td>
                      <td><span className={getEfficiencyClass(store.level)}>{store.efficiency}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="campaign-charts">
            <div className="chart-container">
              <h3><i className="fas fa-chart-bar"></i> Store Performance Metrics</h3>
              <canvas ref={storePerformanceChartRef}></canvas>
            </div>
            <div className="chart-container">
              <h3><i className="fas fa-chart-pie"></i> Revenue by Store Location</h3>
              <canvas ref={storeRevenueChartRef}></canvas>
            </div>
          </div>
        </div>
      )}

      {/* HR-Customer Correlation Tab */}
      {activeTab === 'hr' && (
        <div className="tab-content active">
          <div className="campaign-charts">
            <div className="chart-container">
              <h3><i className="fas fa-scatter-chart"></i> HR-Customer Correlation</h3>
              <canvas ref={hrCorrelationChartRef}></canvas>
            </div>
            <div className="chart-container">
              <h3><i className="fas fa-chart-bar"></i> Employee vs Customer Satisfaction</h3>
              <canvas ref={employeeSatisfactionChartRef}></canvas>
            </div>
            <div className="chart-container">
              <h3><i className="fas fa-chart-line"></i> Training vs Customer Satisfaction</h3>
              <canvas ref={trainingSatisfactionChartRef}></canvas>
            </div>
          </div>

          <div className="campaign-overview">
            <div className="campaign-card">
              <h3><i className="fas fa-chart-line"></i> HR Performance Metrics</h3>
              {hrMetrics.map((metric, index) => (
                <div key={index} className="metric">
                  <span className="metric-label">{metric.label}</span>
                  <span className="metric-value">{metric.value}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="campaign-table">
            <div className="table-header">
              <h3><i className="fas fa-user-tie"></i> Employee Performance vs Customer Satisfaction</h3>
            </div>
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Employee</th>
                    <th>Department</th>
                    <th>Response Time (hrs)</th>
                    <th>Customer Satisfaction</th>
                    <th>Correlation Score</th>
                  </tr>
                </thead>
                <tbody>
                  {employeePerformance.map((employee, index) => (
                    <tr key={index}>
                      <td>{employee.name}</td>
                      <td>{employee.department}</td>
                      <td>{employee.responseTime}</td>
                      <td>{employee.satisfaction}</td>
                      <td><span className="correlation-score">{employee.correlation}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Reports;