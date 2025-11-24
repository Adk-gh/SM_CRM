import React, { useState } from 'react';
import { ChartFactory } from '../../components/Charts';
import dashboardData from '../../data/dashboard-data.json';
import './Dashboard.css';

const Dashboard = () => {
  const [data] = useState(dashboardData);
  const [theme] = useState(data.theme.current);
  const [activeSection, setActiveSection] = useState('overview');

  // CRM-focused KPI Cards
  const kpiCards = [
    {
      title: 'Customer Satisfaction',
      icon: 'fas fa-smile',
      value: data.kpis.current.customerSatisfaction || '4.2',
      suffix: '/5.0',
      trend: '+2.1%',
      description: 'Overall satisfaction rating',
      color: '#10B981'
    },
    {
      title: 'Customer Retention',
      icon: 'fas fa-user-friends',
      value: data.kpis.current.customerRetention || '87',
      suffix: '%',
      trend: '+5.3%',
      description: 'Customers retained this month',
      color: '#3B82F6'
    },
    {
      title: 'Active Customers',
      icon: 'fas fa-users',
      value: '2,847',
      trend: '+12.4%',
      description: 'Active customer relationships',
      color: '#8B5CF6'
    },
    {
      title: 'Response Time',
      icon: 'fas fa-clock',
      value: data.kpis.current.responseTime || '2.4',
      suffix: 'hrs',
      trend: '-0.8hrs',
      description: 'Avg. response to inquiries',
      color: '#F59E0B'
    }
  ];

  // CRM-focused Navigation
  const navItems = [
    { id: 'overview', icon: 'fas fa-chart-pie', label: 'Overview' },
    { id: 'customers', icon: 'fas fa-users', label: 'Customers' },
    { id: 'engagement', icon: 'fas fa-comments', label: 'Engagement' },
    { id: 'satisfaction', icon: 'fas fa-star', label: 'Satisfaction' },
    { id: 'retention', icon: 'fas fa-chart-line', label: 'Retention' }
  ];

  // Fallback data for charts
  const getChartData = (chartType) => {
    if (data.charts && data.charts[chartType]) {
      return data.charts[chartType];
    }
    
    const fallbackData = {
      customerGrowth: {
        labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
        datasets: [
          {
            label: 'New Customers',
            data: [120, 150, 180, 200, 240, 280],
            borderColor: '#10B981',
            backgroundColor: 'rgba(16, 185, 129, 0.1)',
            fill: true
          },
          {
            label: 'Active Customers',
            data: [850, 920, 980, 1050, 1120, 1200],
            borderColor: '#3B82F6',
            backgroundColor: 'rgba(59, 130, 246, 0.1)',
            fill: true
          }
        ]
      },
      engagement: {
        labels: ['Email', 'Phone', 'Chat', 'Social', 'In-Person'],
        datasets: [
          {
            label: 'Engagement Channels',
            data: [35, 25, 20, 15, 5],
            backgroundColor: ['#10B981', '#3B82F6', '#8B5CF6', '#F59E0B', '#EF4444']
          }
        ]
      },
      satisfaction: {
        labels: ['Excellent', 'Good', 'Average', 'Poor', 'Critical'],
        datasets: [
          {
            label: 'Satisfaction Levels',
            data: [45, 35, 12, 5, 3],
            backgroundColor: ['#10B981', '#34D399', '#FBBF24', '#F87171', '#DC2626']
          }
        ]
      },
      customerBase: {
        labels: ['Loyal', 'Regular', 'New', 'At-Risk'],
        datasets: [
          {
            label: 'Customer Distribution',
            data: [40, 35, 15, 10],
            backgroundColor: ['#10B981', '#3B82F6', '#8B5CF6', '#F59E0B']
          }
        ]
      },
      retention: {
        labels: ['Q1', 'Q2', 'Q3', 'Q4'],
        datasets: [
          {
            label: 'Retention Rate',
            data: [82, 85, 87, 89],
            borderColor: '#10B981',
            backgroundColor: 'rgba(16, 185, 129, 0.1)',
            fill: true
          }
        ]
      }
    };

    return fallbackData[chartType] || fallbackData.customerGrowth;
  };

  const renderContent = () => {
    switch (activeSection) {
      case 'overview':
        return (
          <div className="dashboard-content">
            {/* KPI Grid */}
            <div className="kpi-grid-modern">
              {kpiCards.map((kpi, index) => (
                <div key={index} className="kpi-card-modern" style={{ '--accent-color': kpi.color }}>
                  <div className="kpi-icon">
                    <i className={kpi.icon}></i>
                  </div>
                  <div className="kpi-content">
                    <h3>{kpi.title}</h3>
                    <div className="kpi-value">
                      {kpi.value}
                      {kpi.suffix && <span className="kpi-suffix">{kpi.suffix}</span>}
                    </div>
                    <div className="kpi-trend">
                      <span className="trend-value">{kpi.trend}</span>
                      <span className="trend-label">vs last month</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Charts Grid */}
            <div className="charts-grid">
              <div className="chart-card-modern">
                <div className="chart-header">
                  <h3>Customer Growth Trend</h3>
                  <div className="chart-legend">
                    <div className="legend-item">
                      <div className="legend-color" style={{backgroundColor: '#10B981'}}></div>
                      <span>New Customers</span>
                    </div>
                    <div className="legend-item">
                      <div className="legend-color" style={{backgroundColor: '#3B82F6'}}></div>
                      <span>Active Customers</span>
                    </div>
                  </div>
                </div>
                <div className="chart-container">
                  <ChartFactory 
                    type="customerGrowth" 
                    data={getChartData('customerGrowth')} 
                    theme={theme} 
                  />
                </div>
              </div>

              <div className="chart-card-modern">
                <div className="chart-header">
                  <h3>Engagement Channels</h3>
                </div>
                <div className="chart-container">
                  <ChartFactory 
                    type="engagement" 
                    data={getChartData('engagement')} 
                    theme={theme} 
                  />
                </div>
              </div>

              <div className="chart-card-modern">
                <div className="chart-header">
                  <h3>Satisfaction Distribution</h3>
                </div>
                <div className="chart-container">
                  <ChartFactory 
                    type="satisfaction" 
                    data={getChartData('satisfaction')} 
                    theme={theme} 
                  />
                </div>
              </div>
            </div>
          </div>
        );

      case 'customers':
        return (
          <div className="dashboard-content">
            <div className="chart-card-modern full-width">
              <div className="chart-header">
                <h3>Customer Base Analysis</h3>
              </div>
              <ChartFactory 
                type="customerBase" 
                data={getChartData('customerBase')} 
                theme={theme} 
              />
            </div>
          </div>
        );

      case 'engagement':
        return (
          <div className="dashboard-content">
            <div className="chart-card-modern full-width">
              <div className="chart-header">
                <h3>Customer Engagement</h3>
              </div>
              <ChartFactory 
                type="engagement" 
                data={getChartData('engagement')} 
                theme={theme} 
              />
            </div>
          </div>
        );

      case 'satisfaction':
        return (
          <div className="dashboard-content">
            <div className="chart-card-modern full-width">
              <div className="chart-header">
                <h3>Customer Satisfaction</h3>
              </div>
              <ChartFactory 
                type="satisfaction" 
                data={getChartData('satisfaction')} 
                theme={theme} 
              />
            </div>
          </div>
        );

      case 'retention':
        return (
          <div className="dashboard-content">
            <div className="chart-card-modern full-width">
              <div className="chart-header">
                <h3>Customer Retention</h3>
              </div>
              <ChartFactory 
                type="retention" 
                data={getChartData('retention')} 
                theme={theme} 
              />
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="dashboard-modern">
      {/* Simple Tabs for Navigation */}
      <div className="dashboard-tabs">
        {navItems.map((item) => (
          <button
            key={item.id}
            className={`tab-button ${activeSection === item.id ? 'active' : ''}`}
            onClick={() => setActiveSection(item.id)}
          >
            <i className={item.icon}></i>
            <span>{item.label}</span>
          </button>
        ))}
      </div>

      {/* Main Content Area */}
      <div className="dashboard-main">
        {renderContent()}
      </div>
    </div>
  );
};

export default Dashboard;