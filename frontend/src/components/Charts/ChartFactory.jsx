import React from 'react';
import SalesChart from './SalesChart';
import StaffUtilizationChart from './StaffUtilizationChart';
import ProductDemandChart from './ProductDemandChart';
import BranchChart from './BranchChart';

const ChartFactory = ({ type, data, theme, ...props }) => {
  switch (type) {
    case 'sales':
      return <SalesChart data={data} theme={theme} {...props} />;
    case 'staff':
      return <StaffUtilizationChart data={data} theme={theme} {...props} />;
    case 'products':
      return <ProductDemandChart data={data} theme={theme} {...props} />;
    case 'branch':
      return <BranchChart data={data} theme={theme} {...props} />;
    default:
      return <div>Unknown chart type: {type}</div>;
  }
};

export default ChartFactory;