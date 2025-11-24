import React, { useRef, useEffect } from 'react';
import { 
  Chart, 
  CategoryScale, 
  LinearScale, 
  LineElement, 
  PointElement, 
  Title, 
  Tooltip, 
  Legend,
  registerables 
} from 'chart.js';

// Register all required components
Chart.register(...registerables);

const StaffUtilizationChart = ({ data, theme }) => {
  const chartRef = useRef(null);
  const chartInstance = useRef(null);

  useEffect(() => {
    if (chartRef.current) {
      if (chartInstance.current) {
        chartInstance.current.destroy();
      }

      chartInstance.current = new Chart(chartRef.current, {
        type: 'line',
        data: {
          labels: data.labels,
          datasets: [{
            label: 'Staff Utilization (%)',
            data: data.datasets[0].data,
            borderColor: theme === 'dark' ? '#4FC3F7' : data.datasets[0].borderColor,
            backgroundColor: theme === 'dark' ? 'rgba(79, 195, 247, 0.1)' : data.datasets[0].backgroundColor,
            fill: true,
            tension: 0.4
          }]
        },
        options: {
          responsive: true,
          plugins: {
            legend: {
              position: 'bottom',
              labels: {
                color: theme === 'dark' ? '#E0E0E0' : '#395A7F'
              }
            }
          },
          scales: {
            y: {
              min: 60,
              max: 100,
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
  }, [data, theme]);

  return <canvas ref={chartRef} />;
};

export default StaffUtilizationChart;