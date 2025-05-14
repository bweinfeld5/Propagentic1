import React, { useState, useMemo } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { 
  HomeIcon,
  ClipboardDocumentCheckIcon as ClipboardCheckIcon, 
  QuestionMarkCircleIcon,
  Cog6ToothIcon as CogIcon,
  Bars3Icon as MenuIcon,
  XMarkIcon as XIcon,
  UserCircleIcon,
  ArrowRightOnRectangleIcon as LogoutIcon,
  ClockIcon,
  DocumentTextIcon,
  BuildingOfficeIcon as OfficeBuildingIcon,
  EnvelopeIcon as MailIcon,
  UsersIcon,
  Cog8ToothIcon
} from '@heroicons/react/24/outline';
import Button from '../ui/Button';

const SidebarNav = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { currentUser, userProfile, logout } = useAuth();

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  // Define navigation items based on user type
  const navigation = useMemo(() => {
    const userType = userProfile?.userType || userProfile?.role;
    console.log('SidebarNav - User type/role for navigation:', userType);
    
    // Common navigation items for all authenticated users (except profile, handled by role)
    const commonBottomItems = [
      { name: 'Support', href: '/support', icon: QuestionMarkCircleIcon },
      { name: 'Settings', href: '/settings', icon: Cog8ToothIcon },
    ];
    
    // Tenant-specific navigation
    if (userType === 'tenant') {
      return {
        top: [
          { name: 'Dashboard', href: '/tenant/dashboard', icon: HomeIcon },
          { name: 'Maintenance', href: '/maintenance/my-requests', icon: ClipboardCheckIcon },
          { name: 'Profile', href: '/profile', icon: UserCircleIcon }, 
        ],
        bottom: commonBottomItems
      };
    }
    
    // Landlord-specific navigation
    else if (userType === 'landlord') {
      return {
          top: [
            { name: 'Dashboard', href: '/landlord/dashboard', icon: HomeIcon },
            { name: 'Properties', href: '/landlord/properties', icon: OfficeBuildingIcon },
            { name: 'Tenants', href: '/landlord/tenants', icon: UsersIcon },
            { name: 'Maintenance', href: '/landlord/maintenance', icon: ClipboardCheckIcon },
            { name: 'Profile', href: '/profile', icon: UserCircleIcon },
          ],
          bottom: commonBottomItems
      };
    }
    
    // Contractor-specific navigation
    else if (userType === 'contractor') {
       return {
           top: [
            { name: 'Dashboard', href: '/contractor/dashboard', icon: HomeIcon },
            { name: 'Job History', href: '/contractor/history', icon: ClockIcon },
            { name: 'Profile', href: '/contractor/profile', icon: UserCircleIcon },
           ],
           bottom: commonBottomItems
       };
    }
    
    // Default navigation for unknown/other roles
    return {
        top: [
          { name: 'Dashboard', href: '/dashboard', icon: HomeIcon },
          { name: 'Profile', href: '/profile', icon: UserCircleIcon },
        ],
        bottom: commonBottomItems
    };
  }, [userProfile]);

  // Check if the current path matches the nav item or is a child route
  const isActive = (path) => {
    // Exact match for root dashboard paths or specific pages like /profile, /settings, /support
    if (location.pathname === path) {
        return true;
    }
    // Handle parent paths like /landlord/ when on /landlord/properties etc.
    // Exclude matching the root path '/' itself unless it's the exact path.
    if (path !== '/' && location.pathname.startsWith(path + '/')) {
        return true;
    }
    // Removed the special case for /landlord/dashboard and /landlord/properties
    
    return false;
  };

  // Get classes for nav item based on active state using NEW theme colors
  const getNavItemClasses = (path) => {
    const baseClasses = "group flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors duration-150 relative";
    const active = isActive(path);
    
    if (active) {
      return `${baseClasses} bg-primary/10 dark:bg-primary/10 text-primary dark:text-primary-light font-semibold`;
    }
    return `${baseClasses} text-content-secondary dark:text-content-darkSecondary hover:bg-neutral-100 dark:hover:bg-neutral-700/50 hover:text-primary dark:hover:text-primary-light`;
  };

  const userDisplayName = useMemo(() => {
    if (userProfile?.firstName && userProfile?.lastName) {
      return `${userProfile.firstName} ${userProfile.lastName}`;
    }
    return userProfile?.email || currentUser?.email || 'User';
  }, [userProfile, currentUser]);

  const renderNavItems = (items, isMobile = false) => (
    <>
      {items.map((item) => {
        const active = isActive(item.href);
        return (
          <Link
            key={item.name}
            to={item.href}
            className={getNavItemClasses(item.href)}
            onClick={isMobile ? () => setIsMobileMenuOpen(false) : undefined}
          >
            {active && (
               <span className="absolute left-0 top-0 bottom-0 w-1 bg-primary rounded-r-md"></span>
            )}
            <item.icon 
              className={`mr-3 flex-shrink-0 h-${isMobile ? 6: 5} w-${isMobile ? 6: 5} ${active ? 'text-primary dark:text-primary-light' : 'text-neutral-400 dark:text-neutral-500 group-hover:text-primary dark:group-hover:text-primary-light'}`}
              aria-hidden="true" 
            />
            {item.name}
          </Link>
        );
      })}
    </>
  );

  const renderLogoutButton = (isMobile = false) => (
    <button
      onClick={handleLogout}
      className={`w-full group flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors duration-150 
                  text-content-secondary dark:text-content-darkSecondary hover:bg-neutral-100 dark:hover:bg-neutral-700/50 hover:text-danger dark:hover:text-red-400`}
    >
      <LogoutIcon className={`mr-3 flex-shrink-0 h-${isMobile ? 6: 5} w-${isMobile ? 6: 5} text-neutral-400 dark:text-neutral-500 group-hover:text-danger dark:group-hover:text-red-400`} aria-hidden="true" />
      Logout
    </button>
  );

  return (
    <>
      {/* Mobile menu button */}
      <div className="md:hidden fixed top-4 left-4 z-20">
        <button
          type="button"
          className="p-2 rounded-md bg-background dark:bg-background-darkSubtle text-content dark:text-content-dark shadow-md border border-border dark:border-border-dark hover:bg-neutral-100 dark:hover:bg-neutral-700 focus:outline-none focus:ring-2 focus:ring-primary"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        >
          <span className="sr-only">Open sidebar</span>
          {isMobileMenuOpen ? (
            <XIcon className="h-6 w-6" aria-hidden="true" />
          ) : (
            <MenuIcon className="h-6 w-6" aria-hidden="true" />
          )}
        </button>
      </div>

      {/* Mobile sidebar */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 flex z-40 md:hidden">
          <div 
            className="fixed inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setIsMobileMenuOpen(false)}
          />
          <div className="relative flex-1 flex flex-col max-w-xs w-full bg-background dark:bg-background-darkSubtle border-r border-border dark:border-border-dark">
            <div className="px-4 pt-5 pb-4 sm:px-6 border-b border-border dark:border-border-dark">
              <h2 className="text-lg font-medium text-content dark:text-content-dark">Propagentic</h2>
            </div>
            <div className="px-4 py-3 border-b border-border dark:border-border-dark">
              <div className="text-sm font-semibold text-content dark:text-content-dark">{userDisplayName}</div>
              <div className="text-xs text-content-secondary dark:text-content-darkSecondary capitalize">{userProfile?.userType || userProfile?.role || 'User'}</div>
            </div>
            <div className="mt-5 flex-1 h-0 overflow-y-auto">
              <nav className="px-2 space-y-1">
                {renderNavItems(navigation.top, true)}
                <hr className="my-4 border-border dark:border-border-dark"/>
                {renderNavItems(navigation.bottom, true)}
                {renderLogoutButton(true)}
              </nav>
            </div>
          </div>
        </div>
      )}

      {/* Desktop sidebar */}
      <div className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0">
        <div className="flex-1 flex flex-col min-h-0 bg-background-subtle dark:bg-background-dark border-r border-border dark:border-border-dark">
          <div className="flex-1 flex flex-col pt-5 pb-4 overflow-y-auto">
            <div className="flex items-center flex-shrink-0 px-4">
              <h2 className="text-xl font-bold text-content dark:text-content-dark">Propagentic</h2>
            </div>
            <div className="px-4 py-4 mt-2 border-b border-border dark:border-border-dark">
              <div className="text-sm font-semibold text-content dark:text-content-dark">{userDisplayName}</div>
              <div className="text-xs text-content-secondary dark:text-content-darkSecondary capitalize">{userProfile?.userType || userProfile?.role || 'User'}</div>
            </div>
            <nav className="mt-6 flex-1 px-4 space-y-1">
              {renderNavItems(navigation.top, false)}
              <hr className="my-4 border-border dark:border-border-dark"/>
              {renderNavItems(navigation.bottom, false)}
            </nav>
            <div className="px-4 py-4 border-t border-border dark:border-border-dark mt-auto">
              {renderLogoutButton(false)}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default SidebarNav; 