import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Chart, registerables } from 'chart.js';
import './segmentation.css';

// Register Chart.js components
Chart.register(...registerables);

const Segmentation = () => {
  const [segments, setSegments] = useState([]);
  const [ruleAttribute, setRuleAttribute] = useState('loyalty');
  const [ruleCondition, setRuleCondition] = useState('equals');
  const [ruleValue, setRuleValue] = useState('');
  const [ruleLogic, setRuleLogic] = useState('and');
  const [mlAlgorithm, setMlAlgorithm] = useState('kmeans');
  const [mlClusters, setMlClusters] = useState(3);
  const [mlFeatures, setMlFeatures] = useState({
    age: true,
    avgPurchase: true,
    loyalty: false
  });

  const pieChartRef = useRef(null);
  const barChartRef = useRef(null);
  const pieChartInstance = useRef(null);
  const barChartInstance = useRef(null);

  // Sample SM Mall customer data
  const customers = [
    { name: 'Juan Dela Cruz', age: 32, branch: 'SM North EDSA', loyalty: 'Gold', avgPurchase: 6000, type: 'Frequent Shopper' },
    { name: 'Maria Santos', age: 28, branch: 'SM Megamall', loyalty: 'Silver', avgPurchase: 3500, type: 'Promo Shopper' },
    { name: 'Pedro Reyes', age: 45, branch: 'SM Mall of Asia', loyalty: 'Gold', avgPurchase: 7500, type: 'High Spender' },
    { name: 'Ana Lim', age: 30, branch: 'SM City Cebu', loyalty: 'Bronze', avgPurchase: 2000, type: 'Food Court Regular' },
    { name: 'Josefa Cruz', age: 40, branch: 'SM Aura Premier', loyalty: 'Silver', avgPurchase: 4000, type: 'Seasonal Shopper' },
    { name: 'Carlos Tan', age: 35, branch: 'SM North EDSA', loyalty: 'Gold', avgPurchase: 5500, type: 'Frequent Shopper' },
    { name: 'Luisa Mendoza', age: 26, branch: 'SM Megamall', loyalty: 'Bronze', avgPurchase: 1800, type: 'Promo Shopper' },
    { name: 'Ramon Garcia', age: 50, branch: 'SM Mall of Asia', loyalty: 'Gold', avgPurchase: 8200, type: 'High Spender' },
    { name: 'Patricia Lopez', age: 31, branch: 'SM City Cebu', loyalty: 'Silver', avgPurchase: 3200, type: 'Food Court Regular' },
    { name: 'Michael Ong', age: 38, branch: 'SM Aura Premier', loyalty: 'Gold', avgPurchase: 7000, type: 'Seasonal Shopper' },
  ];

  useEffect(() => {
    // Initialize segments with customers
    setSegments([...customers]);
    
    // Cleanup charts on unmount
    return () => {
      if (pieChartInstance.current) {
        pieChartInstance.current.destroy();
      }
      if (barChartInstance.current) {
        barChartInstance.current.destroy();
      }
    };
  }, []);

  useEffect(() => {
    if (segments.length > 0) {
      updateCharts();
    }
  }, [segments]);

  const handleMlFeatureChange = (feature) => {
    setMlFeatures(prev => ({
      ...prev,
      [feature]: !prev[feature]
    }));
  };

  const applyRule = () => {
    const newSegments = customers.map(c => {
      let match = false;
      const val = c[ruleAttribute];
      
      if (ruleCondition === 'equals') match = val.toString().toLowerCase() === ruleValue.toLowerCase();
      if (ruleCondition === 'greater') match = Number(val) > Number(ruleValue);
      if (ruleCondition === 'less') match = Number(val) < Number(ruleValue);
      if (ruleCondition === 'contains') match = val.toString().toLowerCase().includes(ruleValue.toLowerCase());
      
      return { ...c, segment: match ? 'Selected' : 'Other' };
    });

    setSegments(newSegments);
  };

  const applyML = () => {
    const newSegments = customers.map(c => ({
      ...c, 
      segment: 'Cluster ' + (Math.floor(Math.random() * mlClusters) + 1)
    }));
    setSegments(newSegments);
  };

  const updateCharts = useCallback(() => {
    const segmentCounts = {};
    const segmentAvg = {};

    segments.forEach(c => {
      segmentCounts[c.segment] = (segmentCounts[c.segment] || 0) + 1;
      segmentAvg[c.segment] = (segmentAvg[c.segment] || []).concat(c.avgPurchase);
    });

    const pieLabels = Object.keys(segmentCounts);
    const pieData = Object.values(segmentCounts);
    const barLabels = Object.keys(segmentAvg);
    const barData = Object.values(segmentAvg).map(arr => arr.reduce((a, b) => a + b, 0) / arr.length);

    // Destroy existing charts
    if (pieChartInstance.current) {
      pieChartInstance.current.destroy();
    }
    if (barChartInstance.current) {
      barChartInstance.current.destroy();
    }

    // Create pie chart
    if (pieChartRef.current) {
      const isDark = document.body.getAttribute('data-theme') === 'dark';
      const textColor = isDark ? '#A3CAE9' : '#395A7F';

      pieChartInstance.current = new Chart(pieChartRef.current, {
        type: 'pie',
        data: {
          labels: pieLabels,
          datasets: [{
            data: pieData,
            backgroundColor: ['#395A7F', '#6E9FC1', '#A3CAE9', '#4F7DA8', '#2C5282', '#1A365D'],
            borderWidth: 0
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
          }
        }
      });
    }

    // Create bar chart
    if (barChartRef.current) {
      const isDark = document.body.getAttribute('data-theme') === 'dark';
      const gridColor = isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)';
      const textColor = isDark ? '#A3CAE9' : '#395A7F';

      barChartInstance.current = new Chart(barChartRef.current, {
        type: 'bar',
        data: {
          labels: barLabels,
          datasets: [{
            label: 'Average Purchase',
            data: barData,
            backgroundColor: '#395A7F',
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
                color: textColor,
                callback: function (value) {
                  return '₱' + value.toLocaleString();
                }
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
    }
  }, [segments]);

  const getLoyaltyBadgeClass = (loyalty) => {
    return `loyalty-badge loyalty-${loyalty.toLowerCase()}`;
  };

  return (
    <div className="segmentation-content">
    

      {/* Segmentation Panels */}
      <div className="segmentation-panel">
        {/* Rule-Based Segmentation */}
        <div className="content-card panel">
          <h3><i className="fas fa-filter"></i> Rule-Based Segmentation</h3>
          <div className="form-group">
            <label>Customer Attribute:</label>
            <select 
              id="rule-attribute" 
              value={ruleAttribute}
              onChange={(e) => setRuleAttribute(e.target.value)}
            >
              <option value="loyalty">Loyalty Level</option>
              <option value="avgPurchase">Average Purchase</option>
              <option value="age">Age</option>
              <option value="branch">Branch</option>
              <option value="type">Order Type</option>
            </select>
          </div>

          <div className="form-group">
            <label>Condition:</label>
            <select 
              id="rule-condition" 
              value={ruleCondition}
              onChange={(e) => setRuleCondition(e.target.value)}
            >
              <option value="equals">Equals</option>
              <option value="greater">Greater Than</option>
              <option value="less">Less Than</option>
              <option value="contains">Contains</option>
            </select>
          </div>

          <div className="form-group">
            <label>Value:</label>
            <input 
              type="text" 
              id="rule-value" 
              placeholder="Enter value"
              value={ruleValue}
              onChange={(e) => setRuleValue(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label>Logic:</label>
            <select 
              id="rule-logic" 
              value={ruleLogic}
              onChange={(e) => setRuleLogic(e.target.value)}
            >
              <option value="and">AND</option>
              <option value="or">OR</option>
            </select>
          </div>

          <button className="action-btn" onClick={applyRule}>
            <i className="fas fa-play"></i> Apply Rule
          </button>
        </div>

        {/* ML-Based Segmentation */}
        <div className="content-card panel">
          <h3><i className="fas fa-robot"></i> ML-Based Segmentation</h3>
          <div className="form-group">
            <label>Clustering Algorithm:</label>
            <select 
              id="ml-algo" 
              value={mlAlgorithm}
              onChange={(e) => setMlAlgorithm(e.target.value)}
            >
              <option value="kmeans">K-Means</option>
              <option value="dbscan">DBSCAN</option>
              <option value="hierarchical">Hierarchical</option>
            </select>
          </div>

          <div className="form-group">
            <label>Number of Clusters:</label>
            <input 
              type="number" 
              id="ml-clusters" 
              value={mlClusters}
              onChange={(e) => setMlClusters(Number(e.target.value))}
              min="2" 
              max="10" 
            />
          </div>

          <div className="form-group">
            <label>Features to Include:</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginTop: '10px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                <input 
                  type="checkbox" 
                  name="ml-features" 
                  value="age" 
                  checked={mlFeatures.age}
                  onChange={() => handleMlFeatureChange('age')}
                /> 
                Age
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                <input 
                  type="checkbox" 
                  name="ml-features" 
                  value="avgPurchase" 
                  checked={mlFeatures.avgPurchase}
                  onChange={() => handleMlFeatureChange('avgPurchase')}
                /> 
                Avg Purchase
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                <input 
                  type="checkbox" 
                  name="ml-features" 
                  value="loyalty" 
                  checked={mlFeatures.loyalty}
                  onChange={() => handleMlFeatureChange('loyalty')}
                /> 
                Loyalty
              </label>
            </div>
          </div>

          <button className="action-btn" onClick={applyML}>
            <i className="fas fa-cogs"></i> Run Clustering
          </button>
        </div>
      </div>

      {/* Segment Preview Table */}
      <div className="content-card">
        <h3><i className="fas fa-table"></i> Segment Preview</h3>
        <div className="table-container">
          <table className="data-table" id="segment-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Segment/Cluster</th>
                <th>Age</th>
                <th>Location</th>
                <th>Loyalty</th>
                <th>Average Purchase</th>
                <th>Order Type</th>
              </tr>
            </thead>
            <tbody>
              {segments.map((customer, index) => (
                <tr key={index}>
                  <td>{customer.name}</td>
                  <td>
                    <span className="segment-badge">
                      {customer.segment || '-'}
                    </span>
                  </td>
                  <td>{customer.age}</td>
                  <td>{customer.branch}</td>
                  <td>
                    <span className={getLoyaltyBadgeClass(customer.loyalty)}>
                      {customer.loyalty}
                    </span>
                  </td>
                  <td>₱{customer.avgPurchase.toLocaleString()}</td>
                  <td>{customer.type}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Analytics Charts */}
      <div className="charts-section">
        <div className="chart-card">
          <h3>Segment Distribution</h3>
          <div className="chart-container">
            <canvas ref={pieChartRef} id="pieChart"></canvas>
          </div>
        </div>
        <div className="chart-card">
          <h3>Average Purchase per Segment</h3>
          <div className="chart-container">
            <canvas ref={barChartRef} id="barChart"></canvas>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Segmentation;