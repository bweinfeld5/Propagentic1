import React from 'react';
// Import your logo
import logo from '../../assets/images/logo.svg';

/**
 * Dashboard navigation sidebar component
 * @param {Object} props - Component props
 * @param {Array} props.tabs - Array of tab objects with id, label, and icon
 * @param {string} props.activeTab - ID of the active tab
 * @param {Function} props.onTabChange - Function called when tab changes
 * @param {string} props.role - User role (Landlord, Tenant, Contractor)
 */
const NavigationSidebar = ({ tabs, activeTab, onTabChange, role }) => {
  return (
    <div className="w-full h-full bg-gray-50 border-r border-gray-200 flex flex-col">
      {/* Logo/Brand */}
      <div className="p-3 border-b border-gray-200">
        <div className="flex items-center space-x-2">
          {/* Your custom PropAgentic logo */}
          <img 
            src={logo} 
            alt="PropAgentic Logo" 
            className="h-5 w-auto object-contain flex-shrink-0"
          />
          <div className="min-w-0 flex-1">
            <div className="text-xs text-gray-500 truncate">{role}</div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-2 space-y-1" aria-label="Dashboard navigation">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            aria-current={activeTab === tab.id ? 'page' : undefined}
            className={`w-full flex items-center px-2 py-2 text-xs font-medium rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-1 ${
              activeTab === tab.id
                ? 'bg-primary text-white'
                : 'text-gray-700 hover:bg-gray-200'
            }`}
          >
            <svg className="w-4 h-4 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={tab.icon} />
            </svg>
            <span className="truncate">{tab.label}</span>
          </button>
        ))}
      </nav>
    </div>
  );
};

export default NavigationSidebar; 