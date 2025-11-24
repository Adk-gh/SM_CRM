import React, { useRef, useEffect, useState } from 'react';
import { 
  Chart, 
  CategoryScale, 
  LinearScale, 
  BarElement, 
  LineElement, 
  PointElement,
  Title, 
  Tooltip, 
  Legend,
  registerables 
} from 'chart.js';

// Register all required components
Chart.register(...registerables);

const BranchChart = ({ data, theme }) => {
  const chartRef = useRef(null);
  const chartInstance = useRef(null);
  const [currentType, setCurrentType] = useState('bar');

  useEffect(() => {
    if (chartRef.current) {
      if (chartInstance.current) {
        chartInstance.current.destroy();
      }

      chartInstance.current = new Chart(chartRef.current, {
        type: currentType,
        data: {
          labels: data.categories,
          datasets: [{
            label: 'Sales (₱)',
            data: data.sales,
            backgroundColor: data.color,
            borderColor: data.color,
            fill: currentType === 'line'
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
                color: theme === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'
              },
              ticks: {
                color: theme === 'dark' ? '#E0E0E0' : '#395A7F'
              }
            },
            x: {
              grid: {
                display: false
              },
              ticks: {
                color: theme === 'dark' ? '#E0E0E0' : '#395A7F'
              }
            }
          }
        }
      });
    }

    return () => {
      if (chartInstance.current) {
        chartInstance.current.destroy();
      }
    };
  }, [data, theme, currentType]);

  const toggleChartType = () => {
    setCurrentType(currentType === 'bar' ? 'line' : 'bar');
  };

  return (
    <div className="compact-chart-container">
      <div className="compact-chart-wrapper">
        <canvas ref={chartRef} />
      </div>
      <button className="chart-switch" onClick={toggleChartType}>
        Switch to {currentType === 'bar' ? 'Line' : 'Bar'} Chart
      </button>
    </div>
  );
};

export default BranchChart;