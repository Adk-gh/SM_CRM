// src/components/Sidebar/Sidebar.jsx
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import './Sidebar.css';

const Sidebar = ({ navigation, userRole }) => {
  const location = useLocation();
  
  console.log('=== SIDEBAR DEBUG ===');
  console.log('User Role:', userRole);
  console.log('Navigation:', navigation);

  const getActiveNav = () => {
    const currentPath = location.pathname;
    const activeNavItem = navigation.find(nav => 
      currentPath === nav.href || currentPath.startsWith(nav.href)
    );
    return activeNavItem ? activeNavItem.name : '';
  };

  const activeNav = getActiveNav();

  // FIXED: Changed from nav.roles to nav.role
  const filteredNavigation = navigation.filter(nav => {
    // If no role specified, show to everyone
    if (!nav.role || nav.role.length === 0) {
      console.log(`Nav item "${nav.name}": No role specified - SHOWING`);
      return true;
    }
    
    // Check if user's role is included in allowed role
    const hasAccess = nav.role.includes(userRole);
    console.log(`Nav item "${nav.name}": role=${JSON.stringify(nav.role)}, userRole=${userRole}, hasAccess=${hasAccess}`);
    return hasAccess;
  });

  console.log('Filtered Navigation:', filteredNavigation);

  if (filteredNavigation.length === 0) {
    return (
      <div className="sidebar">
        <div className="sidebar-header">
          <h1><i className="fas fa-chart-line"></i> SM Analytics</h1>
        </div>
        <div className="sidebar-nav">
          <div className="nav-item error">
            <i className="fas fa-exclamation-triangle"></i>
            <span>No Access</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="sidebar">
      <div className="sidebar-header">
        <h1><i className="fas fa-chart-line"></i> SM Analytics</h1>
      </div>
      <div className="sidebar-nav">
        {filteredNavigation.map((nav) => (
          <Link
            key={nav.name}
            to={nav.href}
            className={`nav-item ${activeNav === nav.name ? 'active' : ''}`}
          >
            <i className={nav.icon}></i>
            <span>{nav.name}</span>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default Sidebar;