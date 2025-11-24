import React, { useRef, useEffect } from 'react';
import { 
  Chart, 
  CategoryScale, 
  LinearScale, 
  BarElement, 
  Title, 
  Tooltip, 
  Legend,
  registerables 
} from 'chart.js';

// Register all required components
Chart.register(...registerables);

const SalesChart = ({ data, theme }) => {
  const chartRef = useRef(null);
  const chartInstance = useRef(null);

  useEffect(() => {
    if (chartRef.current) {
      // Destroy existing chart
      if (chartInstance.current) {
        chartInstance.current.destroy();
      }

      // Create new chart
      chartInstance.current = new Chart(chartRef.current, {
        type: 'bar',
        data: {
          labels: data.labels,
          datasets: [{
            label: 'Predicted Monthly Sales (₱)',
            data: data.datasets[0].data,
            backgroundColor: theme === 'dark' ? '#4FC3F7' : data.datasets[0].backgroundColor
          }]
        },
        options: {
          responsive: true,
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
          },
          elements: {
            bar: {
              borderRadius: 6
            }
          }
        }
      });
    }

    // Cleanup
    return () => {
      if (chartInstance.current) {
        chartInstance.current.destroy();
      }
    };
  }, [data, theme]);

  return <canvas ref={chartRef} />;
};

export default SalesChart;