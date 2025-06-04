import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
// Comment out the problematic import and use regular React components instead 
// import { SafeMotion, AnimatePresence } from '../shared/SafeMotion';
import { UIComponentErrorBoundary } from '../shared/ErrorBoundary';
import { useAuth } from '../../context/AuthContext';
import { useDemoMode } from '../../context/DemoModeContext';
import { useConnection } from '../../context/ConnectionContext';
import { ThemeToggle } from '../../design-system/dark-mode';
import NotificationBell from '../notifications/NotificationBell';
import NotificationPanel from './NotificationPanel';
import NotificationErrorBoundary from '../shared/NotificationErrorBoundary';
import { UserCircleIcon, WifiIcon, SignalSlashIcon, ExclamationTriangleIcon, ArrowLeftOnRectangleIcon } from '@heroicons/react/24/outline';
import Logo from '../../assets/images/logo.svg';
import './GlassyHeader.css';

/**
 * Universal GlassyHeader - A modern, responsive header that adapts based on user authentication status
 * 
 * Features:
 * - Transparency that changes on scroll for public pages
 * - Glassy/frosted glass effect
 * - Dashboard header functionality for authenticated users
 * - Responsive design with mobile support
 * - Dynamic height measurement to prevent content overlap
 * - Notification system integration
 * - User profile dropdown
 */
const GlassyHeader = () => {
  // Routing
  const location = useLocation();
  const navigate = useNavigate();
  
  // Authentication and user state
  const { currentUser, userProfile, logout, isLandlord, isTenant, isContractor } = useAuth();
  const { isDemoMode, toggleDemoMode } = useDemoMode();
  const { getOfflineStatus } = useConnection ? useConnection() : { getOfflineStatus: () => 'online' };
  
  // UI state
  const [isScrolled, setIsScrolled] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [notificationPanelOpen, setNotificationPanelOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [headerHeight, setHeaderHeight] = useState(0);
  
  // References
  const headerRef = useRef(null);
  const dropdownRef = useRef(null);
  
  // Determine if we're in a dashboard view
  const isDashboardView = location.pathname.includes('/dashboard') || 
                        location.pathname.includes('/profile') ||
                        location.pathname.includes('/landlord/') ||
                        location.pathname.includes('/tenant/') ||
                        location.pathname.includes('/contractor/') ||
                        location.pathname.includes('/maintenance/') ||
                        location.pathname.includes('/settings') ||
                        location.pathname.includes('/notifications');
  
  // Get connection status
  const connectionStatus = getOfflineStatus ? getOfflineStatus() : 'online';

  // Handle scroll effect for transparency
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY >= 0);
    };
    
    // Check initial scroll position
    handleScroll();
    
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Measure header height for spacer
  useEffect(() => {
    const updateHeaderHeight = () => {
      if (headerRef.current) {
        const height = headerRef.current.offsetHeight;
        setHeaderHeight(height);
      }
    };

    updateHeaderHeight();
    window.addEventListener('resize', updateHeaderHeight);
    
    return () => window.removeEventListener('resize', updateHeaderHeight);
  }, [mobileMenuOpen, notificationPanelOpen, isProfileOpen]);

  // Close profile dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsProfileOpen(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Handle logout
  const handleLogout = async () => {
    setIsProfileOpen(false);
    try {
      await logout();
      navigate('/propagentic/new');
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  // Get dashboard title based on user type
  const getDashboardTitle = () => {
    if (!userProfile) return 'Dashboard';
    
    if (isLandlord && isLandlord()) {
      return 'Landlord Dashboard';
    } else if (isTenant && isTenant()) {
      return 'Tenant Dashboard';
    } else if (isContractor && isContractor()) {
      return 'Contractor Dashboard';
    }
    
    return 'Dashboard';
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

  // Render different header based on route
  const renderHeader = () => {
    if (isDashboardView && currentUser) {
      // Dashboard header for authenticated users
      return (
        <header
          ref={headerRef}
          className="flex justify-between items-center p-4 bg-white dark:bg-gray-900 border-b border-slate-200 dark:border-gray-700 sticky top-0 z-10"
        >
          {/* Left side: Page title */}
          <div className="flex items-center">
            <h1 className="text-lg font-semibold text-slate-800 dark:text-gray-100">{getDashboardTitle()}</h1>
          </div>

          {/* Right side: Connection status, Demo mode toggle, Notifications and Profile Dropdown */}
          <div className="flex items-center space-x-4">
            {/* Connection status indicator */}
            {getConnectionStatusIndicator()}
            
            {/* Demo Mode Toggle */}
            {isDemoMode !== undefined && (
              <button
                onClick={toggleDemoMode}
                className={`px-3 py-1 text-xs font-medium rounded-full ${
                  isDemoMode 
                    ? 'bg-primary text-white hover:bg-primary-dark' 
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                }`}
              >
                {isDemoMode ? 'Demo Mode: ON' : 'Demo Mode: OFF'}
              </button>
            )}

            {/* Theme Toggle */}
            <ThemeToggle />

            {/* Notification Bell */}
            <NotificationErrorBoundary>
              <NotificationBell onClick={() => setNotificationPanelOpen(true)} />
            </NotificationErrorBoundary>

            {/* Profile Dropdown */}
            <div className="relative ml-3" ref={dropdownRef}>
              <div>
                <button
                  type="button"
                  className="bg-white dark:bg-gray-800 rounded-full flex text-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary dark:focus:ring-offset-gray-900"
                  id="user-menu-button"
                  aria-expanded={isProfileOpen}
                  aria-haspopup="true"
                  onClick={() => setIsProfileOpen(!isProfileOpen)}
                >
                  <span className="sr-only">Open user menu</span>
                  <UserCircleIcon className="h-8 w-8 rounded-full text-gray-600 dark:text-gray-400" />
                </button>
              </div>

              {isProfileOpen && (
                <div
                  className="origin-top-right absolute right-0 mt-2 w-48 rounded-md shadow-lg py-1 bg-white dark:bg-gray-800 ring-1 ring-black ring-opacity-5 dark:ring-gray-700 focus:outline-none z-50"
                  role="menu"
                  aria-orientation="vertical"
                  aria-labelledby="user-menu-button"
                  tabIndex="-1"
                >
                  <Link
                    to="/profile"
                    className="flex items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                    role="menuitem"
                    onClick={() => setIsProfileOpen(false)}
                  >
                    <UserCircleIcon className="w-4 h-4 mr-2" /> Your Profile
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="flex items-center w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                    role="menuitem"
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
    } else {
      // Public glassy header with transparency effects
      return (
        <header
          ref={headerRef}
          className={`transparent-header ${isScrolled ? 'header-scrolled' : ''}`}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            zIndex: 40,
            transition: 'all 0.3s ease',
          }}
        >
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-4">
              {/* Logo and Brand */}
              <Link to="/propagentic/new" className="flex items-center space-x-3">
                <img src={Logo} alt="Propagentic Logo" className="h-8 w-auto" />
                <span className="text-xl font-bold text-white">Propagentic</span>
              </Link>
              
              {/* Desktop Navigation */}
              <nav className="hidden md:flex items-center space-x-8">
                <NavLink to="/propagentic/new">Home</NavLink>
                <NavLink to="/pricing">Pricing</NavLink>
                <NavLink to="/about">About</NavLink>
                <NavLink to="/demo">Demo</NavLink>
                <div className="ml-4 flex items-center space-x-3">
                  {/* Theme Toggle for public pages */}
                  <div className="bg-white/10 backdrop-blur-sm rounded-lg">
                    <ThemeToggle />
                  </div>
                  {currentUser ? (
                    <Link 
                      to="/dashboard" 
                      className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                        isScrolled
                          ? 'bg-primary text-white hover:bg-primary-dark shadow-md' 
                          : 'bg-white/10 hover:bg-white/20 text-white backdrop-blur-sm'
                      }`}
                    >
                      Dashboard
                    </Link>
                  ) : (
                    <>
                      <Link 
                        to="/login" 
                        className="text-white text-sm font-medium hover:text-white/80 transition-colors"
                      >
                        Log In
                      </Link>
                      <Link 
                        to="/signup" 
                        className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                          isScrolled
                            ? 'bg-primary text-white hover:bg-primary-dark shadow-md' 
                            : 'bg-white/10 hover:bg-white/20 text-white backdrop-blur-sm'
                        }`}
                      >
                        Sign Up
                      </Link>
                    </>
                  )}
                </div>
              </nav>
              
              {/* Mobile Menu Button */}
              <div className="md:hidden">
                <button
                  onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                  className="text-white p-2 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
                >
                  <span className="sr-only">Open menu</span>
                  {mobileMenuOpen ? (
                    <svg className="h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  ) : (
                    <svg className="h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                    </svg>
                  )}
                </button>
              </div>
            </div>
          </div>
          
          {/* Mobile Menu - Animated */}
          {mobileMenuOpen && (
            <div className="md:hidden bg-primary-700/95 backdrop-blur-lg border-b border-primary-600/50">
              <div className="px-4 pt-2 pb-4 space-y-1 sm:px-6">
                <MobileNavLink to="/propagentic/new" onClick={() => setMobileMenuOpen(false)}>Home</MobileNavLink>
                <MobileNavLink to="/pricing" onClick={() => setMobileMenuOpen(false)}>Pricing</MobileNavLink>
                <MobileNavLink to="/about" onClick={() => setMobileMenuOpen(false)}>About</MobileNavLink>
                <MobileNavLink to="/demo" onClick={() => setMobileMenuOpen(false)}>Demo</MobileNavLink>
                <div className="pt-4 flex flex-col space-y-3">
                  {/* Theme Toggle for mobile */}
                  <div className="bg-white/10 backdrop-blur-sm rounded-lg p-2">
                    <ThemeToggle showLabel />
                  </div>
                  {currentUser ? (
                    <Link 
                      to="/dashboard" 
                      className="text-center bg-primary text-white py-2 px-4 rounded-lg text-sm font-medium hover:bg-primary-dark transition-colors"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      Dashboard
                    </Link>
                  ) : (
                    <>
                      <Link 
                        to="/login" 
                        className="text-center text-white py-2 text-sm font-medium hover:bg-primary-600/50 rounded-lg transition-colors"
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        Log In
                      </Link>
                      <Link 
                        to="/signup" 
                        className="text-center bg-primary text-white py-2 px-4 rounded-lg text-sm font-medium hover:bg-primary-dark transition-colors"
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        Sign Up
                      </Link>
                    </>
                  )}
                </div>
              </div>
            </div>
          )}
        </header>
      );
    }
  };

  return (
    <UIComponentErrorBoundary componentName="GlassyHeader">
      {renderHeader()}
      
      {/* Spacer to prevent content from hiding under the fixed header */}
      <div style={{ height: `${headerHeight}px` }}></div>
    </UIComponentErrorBoundary>
  );
};

// Desktop navigation link for public header
const NavLink = ({ to, children }) => (
  <Link
    to={to}
    className="text-white text-sm font-medium hover:text-white/80 transition-colors"
  >
    {children}
  </Link>
);

// Mobile navigation link for public header
const MobileNavLink = ({ to, children, onClick }) => (
  <Link
    to={to}
    className="block text-white py-2 text-base font-medium hover:bg-indigo-800/50 rounded-lg px-3 transition-colors"
    onClick={onClick}
  >
    {children}
  </Link>
);

export default GlassyHeader; 