import React, { useState, useEffect, useRef } from 'react';
import { Chart, registerables } from 'chart.js';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../../../firebase'; 
import { 
  Smile, 
  Users, 
  Clock, 
  PieChart, 
  Star, 
  TrendingUp, 
  Activity 
} from 'lucide-react';

// Register Chart.js components
Chart.register(...registerables);

// --- CSS STYLES ---
// ... imports remain the same ...

// --- CSS STYLES ---
const styles = `
/* ===== Base Styles ===== */
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
  font-family: 'Segoe UI', system-ui, -apple-system, sans-serif;
}

:root {
  /* Light Theme Defaults */
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
  --chart-grid: rgba(0, 0, 0, 0.05);
  --chart-text: #395A7F;
}

[data-theme="dark"] {
  /* Dark Theme Overrides */
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
  --chart-grid: rgba(255, 255, 255, 0.1);
  --chart-text: #E9ECEE;
}

/* DELETED: body { ... } block removed to prevent conflict with Layout.js */

/* ===== Dashboard Layout ===== */
.dashboard-modern {
  /* Changed from min-height: 100vh to 100% to fit inside Layout container */
  height: 100%; 
  background: var(--bg-primary);
  padding: 30px;
}

.dashboard-tabs {
  display: flex;
  gap: 8px;
  margin-bottom: 32px;
  padding: 8px;
  background: var(--card-bg);
  border-radius: 12px;
  box-shadow: var(--card-shadow);
  max-width: max-content;
  overflow-x: auto;
  border: 1px solid var(--border-light);
}

.tab-button {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 20px;
  border: none;
  background: none;
  color: var(--text-secondary);
  font-size: 14px;
  font-weight: 500;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
  white-space: nowrap;
}

.tab-button:hover {
  background: var(--bg-secondary);
  color: var(--text-primary);
}

.tab-button.active {
  background: var(--accent-primary);
  color: #FFFFFF; 
}

.tab-button svg {
  width: 18px;
  height: 18px;
}

.dashboard-main {
  max-width: 1400px;
  margin: 0 auto;
}

.dashboard-content {
  width: 100%;
}

/* ===== KPI Cards ===== */
.kpi-grid-modern {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 25px;
  margin-bottom: 32px;
}

.kpi-card-modern {
  background: var(--card-bg);
  border-radius: 16px;
  padding: 30px;
  box-shadow: var(--card-shadow);
  border: 1px solid var(--border-light);
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
  display: flex;
  align-items: flex-start;
  gap: 16px;
}

.kpi-card-modern::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 4px;
  background: var(--accent-color, var(--accent-primary));
}

.kpi-card-modern:hover {
  transform: translateY(-5px);
  box-shadow: var(--card-hover);
}

.kpi-icon-wrapper {
    width: 48px;
    height: 48px;
    border-radius: 10px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--accent-color, var(--accent-primary));
    background: rgba(0,0,0,0.05); 
}

[data-theme="dark"] .kpi-icon-wrapper {
    background: rgba(255,255,255,0.05);
}

.kpi-content {
  flex: 1;
}

.kpi-content h3 {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-secondary);
  margin-bottom: 8px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.kpi-value {
  font-size: 32px;
  font-weight: 700;
  color: var(--text-primary);
  margin-bottom: 5px;
  line-height: 1;
}

.kpi-suffix {
  font-size: 16px;
  color: var(--text-light);
  margin-left: 4px;
  font-weight: 500;
}

/* ===== Charts ===== */
.charts-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
  gap: 25px;
}

.chart-card-modern {
  background: var(--card-bg);
  border-radius: 16px;
  padding: 25px;
  box-shadow: var(--card-shadow);
  border: 1px solid var(--border-light);
  transition: all 0.3s ease;
}

.chart-card-modern:hover {
  transform: translateY(-3px);
  box-shadow: var(--card-hover);
}

.chart-card-modern.full-width {
  grid-column: 1 / -1;
}

.chart-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.chart-header h3 {
  font-size: 18px;
  font-weight: 600;
  margin-bottom: 0;
  color: var(--text-primary);
  display: flex;
  align-items: center;
  gap: 10px;
}

.chart-container {
  height: 300px;
  width: 100%;
  position: relative;
}

/* ===== Responsive Design ===== */
@media (max-width: 1200px) {
  .dashboard-modern {
    padding: 20px;
  }
}

@media (max-width: 768px) {
  .dashboard-modern {
    padding: 15px;
  }
  .dashboard-tabs {
    width: 100%;
    margin-bottom: 20px;
  }
  .kpi-grid-modern, .charts-grid {
    grid-template-columns: 1fr;
  }
}
`;

// ... The rest of your React component logic (InternalChart, Dashboard) remains exactly the same ...

// --- HELPER CHART COMPONENT ---
const InternalChart = ({ type, data, isDark }) => {
  const canvasRef = useRef(null);
  const chartInstanceRef = useRef(null);

  useEffect(() => {
    if (canvasRef.current && data) {
      if (chartInstanceRef.current) {
        chartInstanceRef.current.destroy();
      }

      const ctx = canvasRef.current.getContext('2d');
      
      // Determine Chart Colors based on Theme
      const gridColor = isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)';
      const textColor = isDark ? '#E9ECEE' : '#395A7F';

      let chartType = 'line';
      let options = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { 
            display: type !== 'customerGrowth',
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
      };

      if (type === 'satisfaction') {
        chartType = 'doughnut';
        options = {
          responsive: true,
          maintainAspectRatio: false,
          cutout: '70%',
          plugins: {
            legend: { 
              position: 'right',
              labels: { color: textColor }
            }
          },
          scales: {} 
        };
      } else if (type === 'customerGrowth') {
        chartType = 'line';
      }

      chartInstanceRef.current = new Chart(ctx, {
        type: chartType,
        data: data,
        options: options
      });
    }

    return () => {
      if (chartInstanceRef.current) {
        chartInstanceRef.current.destroy();
      }
    };
  }, [type, data, isDark]); // Re-render when theme changes

  return <canvas ref={canvasRef} />;
};

// --- MAIN DASHBOARD COMPONENT ---
const Dashboard = () => {
  const [activeSection, setActiveSection] = useState('overview');
  const [loading, setLoading] = useState(true);
  const [isDark, setIsDark] = useState(false);

  // Real Data State
  const [kpiData, setKpiData] = useState({
    satisfaction: 0,
    activeCustomers: 0,
    responseTime: 0
  });

  const [chartData, setChartData] = useState({
    growth: null,
    satisfaction: null
  });

  // Theme Listener
  useEffect(() => {
    const checkTheme = () => {
        const theme = document.documentElement.getAttribute('data-theme');
        setIsDark(theme === 'dark');
    };
    // Check initially
    checkTheme();
    // Observer to watch for attribute changes on <html>
    const observer = new MutationObserver(checkTheme);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });

    return () => observer.disconnect();
  }, []);

  // Fetch Data from Firebase
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        const [customersSnap, reviewsSnap, ticketsSnap] = await Promise.all([
          getDocs(collection(db, 'customers')),
          getDocs(collection(db, 'reviews')),
          getDocs(collection(db, 'supportTickets'))
        ]);

        const customers = customersSnap.docs.map(doc => doc.data());
        const reviews = reviewsSnap.docs.map(doc => doc.data());
        const tickets = ticketsSnap.docs.map(doc => doc.data());

        // Calculation 1: Satisfaction
        let totalRating = 0;
        let ratingDistribution = [0, 0, 0, 0, 0];
        reviews.forEach(r => {
          const rating = Number(r.rating) || 0;
          if (rating > 0 && rating <= 5) {
            totalRating += rating;
            ratingDistribution[rating - 1]++;
          }
        });
        const avgSatisfaction = reviews.length ? (totalRating / reviews.length).toFixed(1) : 0;

        // Calculation 2: Active Customers
        const activeCount = customers.length;

        // Calculation 3: Response Time
        let totalResponseTimeHours = 0;
        let validTicketCount = 0;
        tickets.forEach(t => {
          if (t.createdAt && t.updatedAt) {
            const start = t.createdAt.toDate ? t.createdAt.toDate() : new Date(t.createdAt);
            const end = t.updatedAt.toDate ? t.updatedAt.toDate() : new Date(t.updatedAt);
            const diffMs = end - start;
            if (diffMs > 0) {
              totalResponseTimeHours += (diffMs / (1000 * 60 * 60));
              validTicketCount++;
            }
          }
        });
        const avgResponseTime = validTicketCount ? (totalResponseTimeHours / validTicketCount).toFixed(1) : 0;

        // Calculation 4: Growth
        const monthCounts = new Array(12).fill(0);
        customers.forEach(c => {
          if (c.createdAt) {
            const date = c.createdAt.toDate ? c.createdAt.toDate() : new Date(c.createdAt);
            monthCounts[date.getMonth()]++;
          }
        });

        setKpiData({
          satisfaction: avgSatisfaction,
          activeCustomers: activeCount,
          responseTime: avgResponseTime
        });

        setChartData({
          growth: {
            labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
            datasets: [{
              label: 'New Customers',
              data: monthCounts,
              borderColor: '#10B981',
              backgroundColor: 'rgba(16, 185, 129, 0.1)',
              fill: true,
              tension: 0.4
            }]
          },
          satisfaction: {
            labels: ['1 Star', '2 Stars', '3 Stars', '4 Stars', '5 Stars'],
            datasets: [{
              label: 'Reviews',
              data: ratingDistribution,
              backgroundColor: ['#DC2626', '#F87171', '#FBBF24', '#34D399', '#10B981'],
              borderWidth: 0
            }]
          }
        });

      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const kpiCards = [
    {
      title: 'Customer Satisfaction',
      Icon: Smile,
      value: kpiData.satisfaction,
      suffix: '/5.0',
      description: 'Based on average review ratings',
      color: '#10B981'
    },
    {
      title: 'Active Customers',
      Icon: Users,
      value: kpiData.activeCustomers,
      description: 'Total registered customers',
      color: '#3B82F6'
    },
    {
      title: 'Response Time',
      Icon: Clock,
      value: kpiData.responseTime,
      suffix: 'hrs',
      description: 'Avg time to resolve tickets',
      color: '#F59E0B'
    }
  ];

  

  const renderContent = () => {
    if (loading) return <div style={{padding:'20px', textAlign:'center', color:'var(--text-secondary)'}}>Loading Dashboard Data...</div>;

    switch (activeSection) {
      case 'overview':
        return (
          <div className="dashboard-content">
            {/* KPI Grid */}
            <div className="kpi-grid-modern">
              {kpiCards.map((kpi, index) => (
                <div key={index} className="kpi-card-modern" style={{ '--accent-color': kpi.color }}>
                  <div className="kpi-icon-wrapper">
                    <kpi.Icon size={24} />
                  </div>
                  <div className="kpi-content">
                    <h3>{kpi.title}</h3>
                    <div className="kpi-value">
                      {kpi.value}
                      {kpi.suffix && <span className="kpi-suffix">{kpi.suffix}</span>}
                    </div>
                    <p style={{fontSize:'12px', color:'var(--text-light)', marginTop:'5px'}}>{kpi.description}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Charts Grid */}
            <div className="charts-grid">
              <div className="chart-card-modern">
                <div className="chart-header">
                  <h3>Customer Growth Trend</h3>
                </div>
                <div className="chart-container">
                  {chartData.growth && <InternalChart type="customerGrowth" data={chartData.growth} isDark={isDark} />}
                </div>
              </div>

              <div className="chart-card-modern">
                <div className="chart-header">
                  <h3>Satisfaction Distribution</h3>
                </div>
                <div className="chart-container">
                  {chartData.satisfaction && <InternalChart type="satisfaction" data={chartData.satisfaction} isDark={isDark} />}
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
                <h3>Customer Growth Analysis (New Signups per Month)</h3>
              </div>
              <div className="chart-container" style={{height: '400px'}}>
                {chartData.growth && <InternalChart type="customerGrowth" data={chartData.growth} isDark={isDark} />}
              </div>
            </div>
          </div>
        );

      case 'satisfaction':
        return (
          <div className="dashboard-content">
            <div className="chart-card-modern full-width">
              <div className="chart-header">
                <h3>Customer Satisfaction Analysis (Star Rating Distribution)</h3>
              </div>
              <div className="chart-container" style={{height: '400px'}}>
                {chartData.satisfaction && <InternalChart type="satisfaction" data={chartData.satisfaction} isDark={isDark} />}
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="dashboard-modern">
      <style>{styles}</style>
      
      

      <div className="dashboard-main">
        {renderContent()}
      </div>
    </div>
  );
};

export default Dashboard;