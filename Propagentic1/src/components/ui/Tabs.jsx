/**
 * Tabs Component - PropAgentic Design System
 * 
 * Accessible tabs component with keyboard navigation
 */

import React, { useState, createContext, useContext } from 'react';
import PropTypes from 'prop-types';
import { cx } from '../../design-system';

// Tabs Context
const TabsContext = createContext();

// Main Tabs Container
export const Tabs = ({ 
  children, 
  selectedIndex = 0, 
  onChange, 
  className = '' 
}) => {
  const [activeTab, setActiveTab] = useState(selectedIndex);

  const handleTabChange = (index) => {
    setActiveTab(index);
    if (onChange) {
      onChange(index);
    }
  };

  const contextValue = {
    activeTab,
    setActiveTab: handleTabChange
  };

  return (
    <TabsContext.Provider value={contextValue}>
      <div className={cx('w-full', className)}>
        {children}
      </div>
    </TabsContext.Provider>
  );
};

// Tab List Container
export const TabList = ({ children, className = '' }) => {
  return (
    <div 
      role="tablist"
      className={cx(
        'flex border-b border-gray-200 dark:border-gray-700',
        className
      )}
    >
      {React.Children.map(children, (child, index) => 
        React.cloneElement(child, { index })
      )}
    </div>
  );
};

// Individual Tab
export const Tab = ({ 
  children, 
  index, 
  disabled = false,
  className = '' 
}) => {
  const { activeTab, setActiveTab } = useContext(TabsContext);
  const isActive = activeTab === index;

  const handleClick = () => {
    if (!disabled) {
      setActiveTab(index);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleClick();
    }
  };

  return (
    <button
      role="tab"
      aria-selected={isActive}
      aria-controls={`tabpanel-${index}`}
      id={`tab-${index}`}
      tabIndex={isActive ? 0 : -1}
      disabled={disabled}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      className={cx(
        'px-4 py-2 text-sm font-medium transition-colors duration-200',
        'border-b-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2',
        isActive
          ? 'border-blue-500 text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20'
          : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600',
        disabled && 'opacity-50 cursor-not-allowed',
        className
      )}
    >
      {children}
    </button>
  );
};

// Tab Panels Container
export const TabPanels = ({ children, className = '' }) => {
  const { activeTab } = useContext(TabsContext);

  return (
    <div className={cx('mt-4', className)}>
      {React.Children.map(children, (child, index) => 
        React.cloneElement(child, { 
          index, 
          isActive: activeTab === index 
        })
      )}
    </div>
  );
};

// Individual Tab Panel
export const TabPanel = ({ 
  children, 
  index, 
  isActive = false,
  className = '' 
}) => {
  if (!isActive) return null;

  return (
    <div
      role="tabpanel"
      id={`tabpanel-${index}`}
      aria-labelledby={`tab-${index}`}
      className={cx('focus:outline-none', className)}
      tabIndex={0}
    >
      {children}
    </div>
  );
};

// PropTypes
Tabs.propTypes = {
  children: PropTypes.node.isRequired,
  selectedIndex: PropTypes.number,
  onChange: PropTypes.func,
  className: PropTypes.string
};

TabList.propTypes = {
  children: PropTypes.node.isRequired,
  className: PropTypes.string
};

Tab.propTypes = {
  children: PropTypes.node.isRequired,
  index: PropTypes.number,
  disabled: PropTypes.bool,
  className: PropTypes.string
};

TabPanels.propTypes = {
  children: PropTypes.node.isRequired,
  className: PropTypes.string
};

TabPanel.propTypes = {
  children: PropTypes.node.isRequired,
  index: PropTypes.number,
  isActive: PropTypes.bool,
  className: PropTypes.string
};

// Default export for convenience
export default Tabs; 