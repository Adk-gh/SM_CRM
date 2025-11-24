import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Chart, registerables } from 'chart.js';
import './Campaign.css';

// Register Chart.js components
Chart.register(...registerables);

const Campaign = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [filters, setFilters] = useState({
    branch: 'all',
    status: 'all',
    time: 'month',
    type: 'all'
  });

  // Chart refs
  const performanceChartRef = useRef(null);
  const channelChartRef = useRef(null);
  const engagementChartRef = useRef(null);
  const roiChartRef = useRef(null);
  const audienceChartRef = useRef(null);
  const budgetChartRef = useRef(null);

  // Chart instances
  const chartInstances = useRef({});

  // Sample data
  const campaignMetrics = [
    { label: 'Active Campaigns', value: '12' },
    { label: 'Total Reach', value: '245K' },
    { label: 'Engagement Rate', value: '4.2%' },
    { label: 'Conversion Rate', value: '2.8%' }
  ];

  const roiMetrics = [
    { label: 'Total Budget', value: '₱850K' },
    { label: 'Spent', value: '₱623K' },
    { label: 'Revenue Generated', value: '₱2.1M' },
    { label: 'ROI', value: '+247%', trend: 'positive' }
  ];

  const activeCampaigns = [
    {
      name: 'Holiday Mega Sale',
      type: 'Promotion',
      branch: 'All Branches',
      status: 'active',
      budget: '₱250K',
      results: '₱1.2M',
      endDate: 'Dec 31, 2024'
    },
    {
      name: 'Back to School Email',
      type: 'Email',
      branch: 'Megamall',
      status: 'active',
      budget: '₱45K',
      results: '₱320K',
      endDate: 'Aug 30, 2024'
    },
    {
      name: 'Summer Social Blast',
      type: 'Social Media',
      branch: 'Cebu',
      status: 'pending',
      budget: '₱75K',
      results: '-',
      endDate: 'Jun 15, 2024'
    },
    {
      name: 'Member Appreciation',
      type: 'SMS',
      branch: 'North EDSA',
      status: 'active',
      budget: '₱30K',
      results: '₱180K',
      endDate: 'May 31, 2024'
    },
    {
      name: 'Tech Week Event',
      type: 'In-Store',
      branch: 'Megamall',
      status: 'completed',
      budget: '₱120K',
      results: '₱890K',
      endDate: 'Apr 15, 2024'
    },
    {
      name: 'Fashion Showcase',
      type: 'Social Media',
      branch: 'Davao',
      status: 'draft',
      budget: '₱65K',
      results: '-',
      endDate: 'Jul 20, 2024'
    },
    {
      name: 'Clearance SMS Alert',
      type: 'SMS',
      branch: 'Baguio',
      status: 'active',
      budget: '₱25K',
      results: '₱95K',
      endDate: 'Jun 10, 2024'
    }
  ];

  const analyticsData = [
    {
      campaign: 'Holiday Mega Sale',
      impressions: '1,250,000',
      clicks: '45,238',
      conversions: '1,267',
      ctr: '3.62%',
      costConversion: '₱197.24',
      roi: '247%'
    },
    {
      campaign: 'Back to School Email',
      impressions: '850,000',
      clicks: '32,150',
      conversions: '890',
      ctr: '3.78%',
      costConversion: '₱50.56',
      roi: '189%'
    },
    {
      campaign: 'Member Appreciation',
      impressions: '650,000',
      clicks: '28,450',
      conversions: '720',
      ctr: '4.38%',
      costConversion: '₱41.67',
      roi: '210%'
    }
  ];

  useEffect(() => {
    updateCharts();
    
    // Cleanup charts on unmount
    return () => {
      Object.values(chartInstances.current).forEach(chart => {
        if (chart) chart.destroy();
      });
    };
  }, [activeTab, filters]);

  const handleFilterChange = (filterType, value) => {
    setFilters(prev => ({
      ...prev,
      [filterType]: value
    }));
  };

  const updateCharts = useCallback(() => {
    // Destroy existing charts
    Object.values(chartInstances.current).forEach(chart => {
      if (chart) chart.destroy();
    });

    const isDark = document.body.classList.contains('dark-mode');
    const textColor = isDark ? '#A3CAE9' : '#395A7F';
    const gridColor = isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)';

    // Sample chart data
    const sampleData = {
      performance: [247, 189, 156, 210, 285],
      channelDistribution: [25, 35, 15, 20, 5],
      engagementTrend: [3.2, 4.1, 3.8, 4.5],
      roiAnalysis: [247, 189, 210, 285, 156],
      audienceDistribution: [35, 40, 15, 10],
      budgetTrend: [120, 150, 180, 220, 250, 280],
      revenueTrend: [350, 420, 510, 680, 720, 850]
    };

    // Performance Chart
    if (performanceChartRef.current) {
      chartInstances.current.performance = new Chart(performanceChartRef.current, {
        type: 'bar',
        data: {
          labels: ['Holiday Sale', 'Back to School', 'Summer Blast', 'Member SMS', 'Tech Week'],
          datasets: [{
            label: 'ROI (%)',
            data: sampleData.performance,
            backgroundColor: '#395A7F',
            borderRadius: 4
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

    // Channel Distribution Chart
    if (channelChartRef.current) {
      chartInstances.current.channel = new Chart(channelChartRef.current, {
        type: 'doughnut',
        data: {
          labels: ['Email', 'Social Media', 'SMS', 'In-Store', 'Promotions'],
          datasets: [{
            data: sampleData.channelDistribution,
            backgroundColor: ['#395A7F', '#6E9FC1', '#A3CAE9', '#E9ECEE', '#ACACAC']
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

    // Engagement Trend Chart
    if (engagementChartRef.current) {
      chartInstances.current.engagement = new Chart(engagementChartRef.current, {
        type: 'line',
        data: {
          labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4'],
          datasets: [{
            label: 'Engagement Rate',
            data: sampleData.engagementTrend,
            borderColor: '#395A7F',
            backgroundColor: 'rgba(57, 90, 127, 0.1)',
            fill: true,
            tension: 0.4
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

    // ROI Chart for Analytics Tab
    if (roiChartRef.current) {
      chartInstances.current.roi = new Chart(roiChartRef.current, {
        type: 'bar',
        data: {
          labels: ['Holiday Sale', 'Back to School', 'Member SMS', 'Tech Week', 'Summer Blast'],
          datasets: [{
            label: 'ROI (%)',
            data: sampleData.roiAnalysis,
            backgroundColor: '#395A7F',
            borderRadius: 4
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

    // Audience Chart for Analytics Tab
    if (audienceChartRef.current) {
      chartInstances.current.audience = new Chart(audienceChartRef.current, {
        type: 'doughnut',
        data: {
          labels: ['New Customers', 'Loyalty Members', 'High-Value', 'Inactive'],
          datasets: [{
            data: sampleData.audienceDistribution,
            backgroundColor: ['#395A7F', '#6E9FC1', '#A3CAE9', '#E9ECEE']
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

    // Budget Chart for Analytics Tab
    if (budgetChartRef.current) {
      chartInstances.current.budget = new Chart(budgetChartRef.current, {
        type: 'line',
        data: {
          labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
          datasets: [
            {
              label: 'Budget (₱ thousands)',
              data: sampleData.budgetTrend,
              borderColor: '#395A7F',
              backgroundColor: 'rgba(57, 90, 127, 0.1)',
              fill: true,
              tension: 0.4
            },
            {
              label: 'Revenue (₱ thousands)',
              data: sampleData.revenueTrend,
              borderColor: '#6E9FC1',
              backgroundColor: 'rgba(110, 159, 193, 0.1)',
              fill: true,
              tension: 0.4
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
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

  }, [activeTab, filters]);

  const getStatusBadge = (status) => {
    const statusClasses = {
      active: 'status-active',
      pending: 'status-pending',
      completed: 'status-completed',
      draft: 'status-draft'
    };
    
    return `status-badge ${statusClasses[status] || ''}`;
  };

  return (
    <div className="campaign-container">
    

      {/* Tabs */}
      <div className="tab-container">
        {['overview', 'analytics'].map(tab => (
          <div
            key={tab}
            className={`tab ${activeTab === tab ? 'active' : ''}`}
            onClick={() => setActiveTab(tab)}
          >
            {tab === 'overview' ? 'Campaign Overview' : 'Analytics'}
          </div>
        ))}
      </div>

      {/* Tab Contents */}
      
      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div className="tab-content active">
          {/* Compact Controls */}
          <div className="compact-controls">
            <div className="control-group">
              <h3><i className="fas fa-map-marker-alt"></i> Select Branch</h3>
              <select 
                value={filters.branch}
                onChange={(e) => handleFilterChange('branch', e.target.value)}
              >
                <option value="all">All Branches</option>
                <option value="megamall">SM Megamall</option>
                <option value="north_edsa">SM North EDSA</option>
                <option value="cebu">SM Cebu</option>
                <option value="davao">SM Davao</option>
                <option value="baguio">SM Baguio</option>
              </select>
            </div>

            <div className="control-group">
              <h3><i className="fas fa-filter"></i> Campaign Status</h3>
              <select 
                value={filters.status}
                onChange={(e) => handleFilterChange('status', e.target.value)}
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="pending">Pending</option>
                <option value="completed">Completed</option>
                <option value="draft">Draft</option>
              </select>
            </div>

            <div className="control-group">
              <h3><i className="fas fa-calendar"></i> Time Period</h3>
              <select 
                value={filters.time}
                onChange={(e) => handleFilterChange('time', e.target.value)}
              >
                <option value="today">Today</option>
                <option value="week">This Week</option>
                <option value="month">This Month</option>
                <option value="quarter">This Quarter</option>
              </select>
            </div>

            <div className="control-group">
              <h3><i className="fas fa-chart-line"></i> Campaign Type</h3>
              <select 
                value={filters.type}
                onChange={(e) => handleFilterChange('type', e.target.value)}
              >
                <option value="all">All Types</option>
                <option value="email">Email Marketing</option>
                <option value="social">Social Media</option>
                <option value="sms">SMS Campaign</option>
                <option value="event">In-Store Events</option>
                <option value="promo">Promotions</option>
              </select>
            </div>
          </div>

          {/* Campaign Overview */}
          <div className="campaign-overview">
            <div className="campaign-card">
              <h3><i className="fas fa-chart-line"></i> Campaign Performance</h3>
              {campaignMetrics.map((metric, index) => (
                <div key={index} className="metric">
                  <span className="metric-label">{metric.label}</span>
                  <span className="metric-value">{metric.value}</span>
                </div>
              ))}
            </div>

            <div className="campaign-card">
              <h3><i className="fas fa-money-bill-wave"></i> ROI & Budget</h3>
              {roiMetrics.map((metric, index) => (
                <div key={index} className="metric">
                  <span className="metric-label">{metric.label}</span>
                  {metric.trend ? (
                    <span className={`metric-trend ${metric.trend === 'positive' ? '' : 'negative'}`}>
                      {metric.value}
                    </span>
                  ) : (
                    <span className="metric-value">{metric.value}</span>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Campaign Charts */}
          <div className="campaign-charts">
            <div className="chart-container">
              <h3><i className="fas fa-chart-bar"></i> Campaign Performance</h3>
              <canvas ref={performanceChartRef}></canvas>
            </div>
            <div className="chart-container">
              <h3><i className="fas fa-chart-pie"></i> Channel Distribution</h3>
              <canvas ref={channelChartRef}></canvas>
            </div>
            <div className="chart-container">
              <h3><i className="fas fa-chart-line"></i> Engagement Trend</h3>
              <canvas ref={engagementChartRef}></canvas>
            </div>
          </div>

          {/* Campaign Table */}
          <div className="campaign-table">
            <div className="table-header">
              <h3><i className="fas fa-list"></i> Active Campaigns</h3>
              <select style={{width: 'auto', background: 'rgba(255,255,255,0.2)', color: 'white', border: 'none'}}>
                <option>Sort by: Performance</option>
                <option>Sort by: Budget</option>
                <option>Sort by: End Date</option>
              </select>
            </div>
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Campaign Name</th>
                    <th>Type</th>
                    <th>Branch</th>
                    <th>Status</th>
                    <th>Budget</th>
                    <th>Results</th>
                    <th>End Date</th>
                  </tr>
                </thead>
                <tbody>
                  {activeCampaigns.map((campaign, index) => (
                    <tr key={index}>
                      <td>{campaign.name}</td>
                      <td>{campaign.type}</td>
                      <td>{campaign.branch}</td>
                      <td>
                        <span className={getStatusBadge(campaign.status)}>
                          {campaign.status.charAt(0).toUpperCase() + campaign.status.slice(1)}
                        </span>
                      </td>
                      <td>{campaign.budget}</td>
                      <td>{campaign.results}</td>
                      <td>{campaign.endDate}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Analytics Tab */}
      {activeTab === 'analytics' && (
        <div className="tab-content active">
          <div className="campaign-card">
            <h3><i className="fas fa-chart-bar"></i> Campaign Analytics</h3>
            <p>Detailed performance metrics and insights for your campaigns.</p>
            
            <div className="campaign-charts">
              <div className="chart-container">
                <h3><i className="fas fa-chart-line"></i> ROI by Campaign</h3>
                <canvas ref={roiChartRef}></canvas>
              </div>
              <div className="chart-container">
                <h3><i className="fas fa-users"></i> Audience Engagement</h3>
                <canvas ref={audienceChartRef}></canvas>
              </div>
              <div className="chart-container">
                <h3><i className="fas fa-money-bill-wave"></i> Budget vs Results</h3>
                <canvas ref={budgetChartRef}></canvas>
              </div>
            </div>
            
            <div className="campaign-table">
              <div className="table-header">
                <h3><i className="fas fa-table"></i> Detailed Performance Metrics</h3>
              </div>
              <div className="table-container">
                <table>
                  <thead>
                    <tr>
                      <th>Campaign</th>
                      <th>Impressions</th>
                      <th>Clicks</th>
                      <th>Conversions</th>
                      <th>CTR</th>
                      <th>Cost/Conversion</th>
                      <th>ROI</th>
                    </tr>
                  </thead>
                  <tbody>
                    {analyticsData.map((data, index) => (
                      <tr key={index}>
                        <td>{data.campaign}</td>
                        <td>{data.impressions}</td>
                        <td>{data.clicks}</td>
                        <td>{data.conversions}</td>
                        <td>{data.ctr}</td>
                        <td>{data.costConversion}</td>
                        <td>{data.roi}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Campaign;