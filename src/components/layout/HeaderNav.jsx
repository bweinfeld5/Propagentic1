import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useConnection } from '../../context/ConnectionContext';
import { useDemoMode } from '../../context/DemoModeContext';
import { UserCircleIcon, WifiIcon, SignalSlashIcon, ExclamationTriangleIcon, BellIcon, ArrowLeftOnRectangleIcon } from '@heroicons/react/24/outline';
import NotificationBell from '../notifications/NotificationBell';
import NotificationPanel from './NotificationPanel';
import NotificationErrorBoundary from '../shared/NotificationErrorBoundary';
import { Link, useNavigate } from 'react-router-dom';

// HeaderNav component with sidebar toggle removed
const HeaderNav = () => {
  const { userProfile, logout } = useAuth();
  const { isOnline, isFirestoreAvailable, getOfflineStatus, getOfflineDurationText } = useConnection();
  const { isDemoMode, toggleDemoMode } = useDemoMode();
  const [notificationPanelOpen, setNotificationPanelOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const connectionStatus = getOfflineStatus();
  const navigate = useNavigate();
  const dropdownRef = useRef(null);

  // Close dropdown if clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsProfileOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Get dashboard title based on user type
  const getDashboardTitle = () => {
    if (!userProfile) return 'Dashboard';
    
    switch (userProfile.userType) {
      case 'landlord':
        return 'Landlord Dashboard';
      case 'tenant':
        return 'Tenant Dashboard';
      case 'contractor':
        return 'Contractor Dashboard';
      default:
        return 'Dashboard';
    }
  };

  const handleLogout = async () => {  
    setIsProfileOpen(false);
    try {
      await logout();
      navigate('/propagentic/new');
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  // Offline indicator styles based on connection status
  const getConnectionStatusIndicator = () => {
    if (connectionStatus === 'online') {
      return null; // Don't show indicator when online
    }
    
    if (connectionStatus === 'service-disruption') {
      return (
        <div className="flex items-center px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full mr-2">
          <ExclamationTriangleIcon className="h-4 w-4 mr-1" />
          <span className="text-xs font-medium">Service Disruption</span>
        </div>
      );
    }
    
    return (
      <div className="flex items-center px-3 py-1 bg-red-100 text-red-800 rounded-full mr-2">
        <SignalSlashIcon className="h-4 w-4 mr-1" />
        <span className="text-xs font-medium">Offline Mode</span>
      </div>
    );
  };

  return (
    <header className="flex justify-between items-center p-4 bg-white border-b border-slate-200 sticky top-0 z-10">
      {/* Left side: Page title */}
      <div className="flex items-center">
        <h1 className="text-lg font-semibold text-slate-800">{getDashboardTitle()}</h1>
      </div>

      {/* Right side: Connection status, Notifications and Profile Dropdown */}
      <div className="flex items-center space-x-4">
        {/* Connection status indicator */}
        {getConnectionStatusIndicator()}
        
        {/* Demo Mode Toggle */}
        <button
          onClick={toggleDemoMode}
          className={`px-3 py-1 text-xs font-medium rounded-full ${
            isDemoMode 
              ? 'bg-primary text-white hover:bg-primary-dark' 
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          {isDemoMode ? 'Demo Mode: ON' : 'Demo Mode: OFF'}
        </button>

        <NotificationErrorBoundary>
          <NotificationBell onClick={() => setNotificationPanelOpen(true)} />
        </NotificationErrorBoundary>

        {/* Profile Dropdown */}
        <div className="relative ml-3" ref={dropdownRef}>
          <div>
            <button
              type="button"
              className="bg-white rounded-full flex text-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
              id="user-menu-button"
              aria-expanded={isProfileOpen}
              aria-haspopup="true"
              onClick={() => setIsProfileOpen(!isProfileOpen)}
            >
              <span className="sr-only">Open user menu</span>
              <UserCircleIcon className="h-8 w-8 rounded-full text-gray-600" />
            </button>
          </div>

          {isProfileOpen && (
            <div
              className="origin-top-right absolute right-0 mt-2 w-48 rounded-md shadow-lg py-1 bg-white ring-1 ring-black ring-opacity-5 focus:outline-none z-50"
              role="menu"
              aria-orientation="vertical"
              aria-labelledby="user-menu-button"
              tabIndex="-1"
            >
              <Link
                to="/u/profile"
                className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                role="menuitem"
                tabIndex="-1"
                onClick={() => setIsProfileOpen(false)}
              >
                <UserCircleIcon className="w-4 h-4 mr-2" /> Your Profile
              </Link>
              <button
                onClick={handleLogout}
                className="flex items-center w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                role="menuitem"
                tabIndex="-1"
              >
                <ArrowLeftOnRectangleIcon className="w-4 h-4 mr-2" /> Sign out
              </button>
            </div>
          )}
        </div>

        {/* Notification Panel */}
        <NotificationErrorBoundary>
          <NotificationPanel 
            isOpen={notificationPanelOpen} 
            onClose={() => setNotificationPanelOpen(false)} 
          />
        </NotificationErrorBoundary>
      </div>
    </header>
  );
};

export default HeaderNav; 