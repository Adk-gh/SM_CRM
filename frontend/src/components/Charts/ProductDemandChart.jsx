import React, { useRef, useEffect } from 'react';
import { 
  Chart, 
  ArcElement, 
  Tooltip, 
  Legend,
  registerables 
} from 'chart.js';

// Register all required components
Chart.register(...registerables);

const ProductDemandChart = ({ data, theme }) => {
  const chartRef = useRef(null);
  const chartInstance = useRef(null);

  useEffect(() => {
    if (chartRef.current) {
      if (chartInstance.current) {
        chartInstance.current.destroy();
      }

      chartInstance.current = new Chart(chartRef.current, {
        type: 'pie',
        data: {
          labels: data.labels,
          datasets: [{
            data: data.datasets[0].data,
            backgroundColor: data.datasets[0].backgroundColor
          }]
        },
        options: {
          responsive: true,
          plugins: {
            legend: {
              position: 'bottom',
              labels: {
                color: theme === 'dark' ? '#E0E0E0' : '#395A7F',
                font: {
                  size: 11
                }
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

export default ProductDemandChart;