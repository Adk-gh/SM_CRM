import React from 'react';
import { Link, useLocation } from 'react-router-dom';

const Sidebar = ({ navigation, userRole, notificationCount }) => {
  const location = useLocation();
  
  const SUPPORT_ONLY_ROLES = [
    'POS_Support',
    'OnlineShopping_Support',
    'Payroll_Admin',
    'HRMIS_Admin',
    'Inventory_Manager',
    'Warehouse_Operator'
  ];

  const getActiveNav = () => {
    const currentPath = location.pathname;
    const activeNavItem = navigation.find(nav => 
      currentPath === nav.href || currentPath.startsWith(nav.href)
    );
    return activeNavItem ? activeNavItem.name : '';
  };

  const activeNav = getActiveNav();

  const filteredNavigation = navigation.filter(nav => {
    if (SUPPORT_ONLY_ROLES.includes(userRole)) {
      return nav.name === 'Support' || nav.href === '/support';
    }
    if (!nav.role || nav.role.length === 0) return true;
    return nav.role.includes(userRole);
  });

  const brandGradientClass = "bg-gradient-to-br from-white to-cyan-300 bg-clip-text text-transparent";

  return (
    <div className="fixed z-[1000] bg-[#42668b] shadow-[0_-4px_15px_rgba(0,0,0,0.2)] md:shadow-[4px_0_15px_rgba(0,0,0,0.2)] bottom-0 left-0 w-full h-[70px] flex flex-row p-0 overflow-x-auto md:top-0 md:h-screen md:w-[80px] md:flex-col md:py-[30px] md:px-0 xl:w-[280px] xl:px-[20px] transition-all duration-300 ease-in-out">
      
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
      <div className="flex flex-1 w-full flex-row justify-around gap-0 md:flex-col md:justify-start md:gap-4">
        
        {filteredNavigation.map((nav) => {
          const isActive = activeNav === nav.name;
          
          // CHECK FOR NOTIFICATIONS
          const isSupportTab = nav.name === 'Support' || nav.href === '/support';
          const badgeCount = isSupportTab ? (notificationCount || 0) : 0;
          
          return (
            <Link
              key={nav.name}
              to={nav.href}
              className={`
                group relative flex items-center transition-all duration-250 ease-out no-underline
                flex-col justify-center flex-1 min-w-[60px] p-[8px_10px] rounded-none
                ${isActive ? 'text-cyan-300 -translate-y-[5px]' : 'text-white/75'}
                md:flex-row md:justify-center md:flex-none md:w-full md:p-[16px_10px] md:rounded-none
                md:translate-y-0
                xl:justify-start xl:p-[14px_20px] xl:rounded-[10px]
                ${isActive 
                  ? 'md:bg-teal-600 md:text-white md:shadow-[0_4px_10px_rgba(0,0,0,0.2)] xl:translate-x-[5px]' 
                  : 'md:hover:bg-white/15 md:hover:text-white'
                }
              `}
            >
              {/* Icon Container - Badge is now attached here */}
              <div className="relative inline-block">
                <i className={`
                  transition-colors duration-250
                  text-[20px] mb-1 mr-0
                  md:text-[22px] md:mb-0
                  xl:text-[18px] xl:w-[20px] xl:mr-[18px] xl:text-center
                  ${isActive ? 'text-cyan-300 md:text-white' : 'text-white/50 group-hover:text-white'}
                  ${nav.icon}
                `}></i>

                {/* --- UNIFIED NOTIFICATION BADGE --- */}
                {/* Red Circle + Number + Border to separate from icon */}
                {badgeCount > 0 && (
                  <span className="absolute -top-2 -right-3 flex items-center justify-center min-w-[20px] h-5 px-1 text-[10px] font-bold text-white bg-red-500 rounded-full border-2 border-[#42668b] shadow-sm z-10">
                    {badgeCount > 99 ? '99+' : badgeCount}
                  </span>
                )}
              </div>
              
              <span className={`
                font-medium tracking-wide
                text-[10px] uppercase block
                md:hidden
                xl:block xl:text-[15px] xl:font-semibold xl:normal-case xl:tracking-[0.2px]
                w-full text-center xl:text-left
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