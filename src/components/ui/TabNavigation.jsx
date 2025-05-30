import React from 'react';

/**
 * Accessible tab navigation component
 * @param {Object} props - Component props
 * @param {Array<string>} props.tabs - Array of tab labels
 * @param {number} props.activeTab - Index of the active tab
 * @param {Function} props.onChange - Function called when tab changes
 * @param {string} props.className - Additional classes
 */
const TabNavigation = ({ tabs, activeTab, onChange, className = '' }) => {
  return (
    <div 
      role="tablist" 
      className={`flex justify-center mt-6 space-x-2 ${className}`}
      aria-label="Dashboard views"
    >
      {tabs.map((tab, index) => (
        <button
          key={tab}
          role="tab"
          id={`tab-${index}`}
          aria-selected={activeTab === index}
          aria-controls={`tabpanel-${index}`}
          tabIndex={activeTab === index ? 0 : -1}
          onClick={() => onChange(index)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              onChange(index);
            }
          }}
          className={`px-3 py-1 text-xs rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 ${
            activeTab === index
              ? 'bg-primary text-white'
              : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
          }`}
        >
          {tab}
        </button>
      ))}
    </div>
  );
};

export default TabNavigation; 