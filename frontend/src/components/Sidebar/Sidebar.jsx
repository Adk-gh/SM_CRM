// src/components/Sidebar/Sidebar.jsx
import React from 'react';
import { Link, useLocation } from 'react-router-dom';

const Sidebar = ({ navigation, userRole }) => {
  const location = useLocation();
  
  // Helper to determine active state
  const getActiveNav = () => {
    const currentPath = location.pathname;
    const activeNavItem = navigation.find(nav => 
      currentPath === nav.href || currentPath.startsWith(nav.href)
    );
    return activeNavItem ? activeNavItem.name : '';
  };

  const activeNav = getActiveNav();

  // Filter navigation based on user role
  const filteredNavigation = navigation.filter(nav => {
    if (!nav.role || nav.role.length === 0) return true;
    return nav.role.includes(userRole);
  });

  // Reusable gradient class for branding
  const brandGradientClass = "bg-gradient-to-br from-white to-cyan-300 bg-clip-text text-transparent";

  // Error/Empty State
  if (filteredNavigation.length === 0) {
    return (
      <div className="fixed z-[1000] bg-[#42668b] shadow-xl 
        bottom-0 w-full h-[70px] flex flex-row items-center justify-center
        md:top-0 md:h-screen md:w-[80px] md:flex-col md:justify-start md:pt-[30px]
        xl:w-[280px] xl:px-[20px]">
        <div className="hidden md:flex md:w-full md:justify-center md:pb-5 md:mb-5 md:border-b md:border-white/10 xl:justify-start xl:mb-[20px]">
          <h1 className="flex items-center m-0 text-white font-extrabold text-[26px] tracking-wide">
             <i className="fas fa-chart-line text-[28px] text-cyan-300 xl:mr-3"></i>
             <span className={`hidden xl:block ${brandGradientClass}`}>SM Analytics</span>
          </h1>
        </div>
        <div className="flex flex-col items-center justify-center w-full h-full text-white/50 gap-2">
            <i className="fas fa-exclamation-triangle text-2xl"></i>
            <span className="text-sm font-semibold">No Access</span>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed z-[1000] bg-[#42668b] shadow-[0_-4px_15px_rgba(0,0,0,0.2)] md:shadow-[4px_0_15px_rgba(0,0,0,0.2)]
      /* Mobile: Bottom Bar */
      bottom-0 left-0 w-full h-[70px] flex flex-row p-0 overflow-x-auto
      /* Tablet (md): Icon Sidebar */
      md:top-0 md:h-screen md:w-[80px] md:flex-col md:py-[30px] md:px-0
      /* Desktop (xl): Full Sidebar */
      xl:w-[280px] xl:px-[20px] transition-all duration-300 ease-in-out">
      
      {/* Header Section */}
      <div className="hidden md:block md:w-full md:mb-[15px] md:pb-[20px] md:border-b md:border-white/10 xl:mb-[20px] xl:pb-[30px]">
        <h1 className="flex items-center m-0 font-extrabold text-[26px] tracking-wide md:justify-center xl:justify-start">
          <i className="fas fa-chart-line text-cyan-300 text-[26px] xl:text-[28px] xl:mr-3"></i>
          <span className={`hidden xl:block ${brandGradientClass}`}>
            SM Analytics
          </span>
        </h1>
      </div>

      {/* Navigation Section */}
      {/* FIX APPLIED HERE: Added 'md:justify-start' to prevent spreading */}
      <div className="flex flex-1 w-full
        /* Mobile: Horizontal Row */
        flex-row justify-around gap-0
        /* Tablet+: Vertical Column */
        md:flex-col md:justify-start md:gap-4">
        
        {filteredNavigation.map((nav) => {
          const isActive = activeNav === nav.name;
          
          return (
            <Link
              key={nav.name}
              to={nav.href}
              className={`
                group relative flex items-center transition-all duration-250 ease-out no-underline
                
                /* --- Mobile Styles (< 768px) --- */
                flex-col justify-center flex-1 min-w-[60px] p-[8px_10px] rounded-none
                ${isActive ? 'text-cyan-300 -translate-y-[5px]' : 'text-white/75'}
                
                /* --- Tablet Styles (md: >= 768px) --- */
                md:flex-row md:justify-center md:flex-none md:w-full md:p-[16px_10px] md:rounded-none
                md:translate-y-0
                
                /* --- Desktop Styles (xl: >= 1280px) --- */
                xl:justify-start xl:p-[14px_20px] xl:rounded-[10px]
                
                /* --- Active State (Tablet/Desktop) --- */
                ${isActive 
                  ? 'md:bg-teal-600 md:text-white md:shadow-[0_4px_10px_rgba(0,0,0,0.2)] xl:translate-x-[5px]' 
                  : 'md:hover:bg-white/15 md:hover:text-white'
                }
              `}
            >
              <i className={`
                transition-colors duration-250
                /* Mobile Icon */
                text-[20px] mb-1 mr-0
                /* Tablet Icon */
                md:text-[22px] md:mb-0
                /* Desktop Icon */
                xl:text-[18px] xl:w-[20px] xl:mr-[18px] xl:text-center
                
                ${isActive ? 'text-cyan-300 md:text-white' : 'text-white/50 group-hover:text-white'}
                ${nav.icon}
              `}></i>
              
              <span className={`
                font-medium tracking-wide
                /* Mobile Text */
                text-[10px] uppercase block
                /* Tablet Text (Hidden) */
                md:hidden
                /* Desktop Text (Visible) */
                xl:block xl:text-[15px] xl:font-semibold xl:normal-case xl:tracking-[0.2px]
              `}>
                {nav.name}
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
};

export default Sidebar;