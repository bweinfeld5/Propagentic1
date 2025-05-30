import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import LaptopFrame from '../ui/LaptopFrame';
import DashboardContent from '../dashboard/DashboardContent';
import { getRoleData } from '../../utils/dashboardData';

/**
 * Enhanced dashboard demo component with realistic computer bezels and responsive design
 * @param {Object} props - Component props
 * @param {string} props.role - User role (Landlord, Tenant, Contractor)
 * @param {string} props.className - Additional classes for the container
 * @param {Function} props.onLoad - Callback fired when component finishes loading
 */
const EnhancedDashboardDemo = React.memo(({ role = 'Landlord', className = '', onLoad }) => {
  // Component state with proper initialization
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isLoaded, setIsLoaded] = useState(false);
  const loadTimeoutRef = useRef(null);
  
  // Memoize expensive data calculations
  const data = useMemo(() => getRoleData(role), [role]);
  
  // Use callbacks for event handlers
  const handleTabChange = useCallback((tabId) => {
    setActiveTab(tabId);
  }, []);

  // Handle component load completion
  const handleLoadComplete = useCallback(() => {
    if (!isLoaded) {
      setIsLoaded(true);
      onLoad?.();
    }
  }, [isLoaded, onLoad]);
  
  // Reset active tab when role changes
  useEffect(() => {
    setActiveTab('dashboard');
  }, [role]);

  // Simulate realistic loading time and call onLoad
  useEffect(() => {
    // Clear any existing timeout
    if (loadTimeoutRef.current) {
      clearTimeout(loadTimeoutRef.current);
    }

    // Set loading state
    setIsLoaded(false);
    
    // Simulate component load time (realistic for dashboard rendering)
    loadTimeoutRef.current = setTimeout(() => {
      handleLoadComplete();
    }, 300); // 300ms feels natural for dashboard loading

    // Cleanup on unmount
    return () => {
      if (loadTimeoutRef.current) {
        clearTimeout(loadTimeoutRef.current);
      }
    };
  }, [role, handleLoadComplete]);
  
  return (
    <div className={`w-full max-w-4xl mx-auto ${className}`}>
      <LaptopFrame>
        <DashboardContent 
          data={data}
          activeTab={activeTab}
          onTabChange={handleTabChange}
        />
      </LaptopFrame>
    </div>
  );
});

// Add display name for better debugging
EnhancedDashboardDemo.displayName = 'EnhancedDashboardDemo';

export default EnhancedDashboardDemo; 