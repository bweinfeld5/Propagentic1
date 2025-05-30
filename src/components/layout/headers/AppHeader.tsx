import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  Bars3Icon, 
  XMarkIcon,
  MagnifyingGlassIcon,
  BellIcon,
  PlusIcon,
  HomeIcon,
  BuildingOfficeIcon,
  WrenchScrewdriverIcon,
  UsersIcon,
  BriefcaseIcon,
  CalendarDaysIcon,
  CreditCardIcon,
  CogIcon
} from '@heroicons/react/24/outline';
import Logo from '../../../assets/images/logo.svg';
import UserMenu from './components/UserMenu';
import NotificationCenter from './components/NotificationCenter';

// Type for Heroicons
type HeroIcon = React.ForwardRefExoticComponent<
  Omit<React.SVGProps<SVGSVGElement>, "ref"> & {
    title?: string | undefined;
    titleId?: string | undefined;
  } & React.RefAttributes<SVGSVGElement>
>;

interface NavItem {
  name: string;
  href: string;
  icon: HeroIcon;
}

interface ActionItem {
  name: string;
  icon: HeroIcon;
  href?: string;
  action?: () => void;
}

interface AppHeaderProps {
  userRole: 'landlord' | 'tenant' | 'contractor' | 'admin' | 'user';
  currentSection: string;
  className?: string;
}

/**
 * AppHeader - Progressive disclosure header for authenticated users
 * 
 * Features:
 * - Role-based navigation (3 levels of disclosure)
 * - Contextual actions based on current section
 * - Mobile-first responsive design
 * - Command palette integration
 * - Real-time notifications
 */
const AppHeader: React.FC<AppHeaderProps> = ({ 
  userRole, 
  currentSection, 
  className = '' 
}) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const location = useLocation();

  // Role-based primary navigation (Level 1: Always Visible)
  const getPrimaryNavigation = (): NavItem[] => {
    const roleNavigation = {
      landlord: [
        { name: 'Dashboard', href: '/dashboard', icon: HomeIcon },
        { name: 'Properties', href: '/properties', icon: BuildingOfficeIcon },
        { name: 'Maintenance', href: '/maintenance', icon: WrenchScrewdriverIcon },
      ],
      tenant: [
        { name: 'Dashboard', href: '/dashboard', icon: HomeIcon },
        { name: 'Maintenance', href: '/maintenance', icon: WrenchScrewdriverIcon },
        { name: 'Payments', href: '/payments', icon: CreditCardIcon },
      ],
      contractor: [
        { name: 'Dashboard', href: '/dashboard', icon: HomeIcon },
        { name: 'Jobs', href: '/jobs', icon: BriefcaseIcon },
        { name: 'Schedule', href: '/schedule', icon: CalendarDaysIcon },
      ],
      admin: [
        { name: 'Dashboard', href: '/dashboard', icon: HomeIcon },
        { name: 'Users', href: '/users', icon: UsersIcon },
        { name: 'Settings', href: '/settings', icon: CogIcon },
      ],
      user: [
        { name: 'Dashboard', href: '/dashboard', icon: HomeIcon },
      ]
    };

    return roleNavigation[userRole] || roleNavigation.user;
  };

  // Contextual actions based on current section (Level 2: Page-Based)
  const getContextualActions = (): ActionItem[] => {
    const contextualActions = {
      dashboard: [
        { name: 'Quick Add', icon: PlusIcon, action: () => setIsSearchOpen(true) }
      ],
      maintenance: [
        { name: 'New Request', href: '/maintenance/new', icon: PlusIcon },
        { name: 'Filters', action: () => console.log('filters'), icon: MagnifyingGlassIcon }
      ],
      properties: [
        { name: 'Add Property', href: '/properties/new', icon: PlusIcon },
        { name: 'Reports', href: '/properties/reports', icon: MagnifyingGlassIcon }
      ],
      jobs: [
        { name: 'Find Jobs', href: '/jobs/search', icon: MagnifyingGlassIcon },
        { name: 'My Bids', href: '/jobs/bids', icon: BriefcaseIcon }
      ],
      payments: [
        { name: 'Pay Rent', href: '/payments/new', icon: CreditCardIcon }
      ]
    };

    return contextualActions[currentSection as keyof typeof contextualActions] || [];
  };

  const primaryNav = getPrimaryNavigation();
  const contextualActions = getContextualActions();

  const isCurrentPage = (href: string) => {
    return location.pathname === href || location.pathname.startsWith(href + '/');
  };

  return (
    <header className={`sticky top-0 z-50 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 ${className}`}>
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 justify-between items-center">
          {/* Left Section: Logo + Primary Navigation */}
          <div className="flex items-center">
            {/* Mobile Menu Button */}
            <button
              type="button"
              className="md:hidden -ml-2 mr-2 p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              <span className="sr-only">Open main menu</span>
              {isMobileMenuOpen ? (
                <XMarkIcon className="h-6 w-6" />
              ) : (
                <Bars3Icon className="h-6 w-6" />
              )}
            </button>

            {/* Logo */}
            <Link to="/dashboard" className="flex items-center">
              <img src={Logo} alt="PropAgentic" className="h-8 w-auto" />
            </Link>

            {/* Primary Navigation - Desktop */}
            <nav className="hidden md:flex md:ml-8 md:space-x-1">
              {primaryNav.map((item) => {
                const Icon = item.icon;
                const current = isCurrentPage(item.href);
                
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    className={`inline-flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors duration-150 ${
                      current
                        ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50 dark:text-gray-300 dark:hover:text-white dark:hover:bg-gray-800'
                    }`}
                  >
                    <Icon className="mr-2 h-4 w-4" />
                    {item.name}
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* Center Section: Contextual Actions */}
          <div className="hidden lg:flex lg:items-center lg:space-x-3">
            {contextualActions.map((action, index) => {
              const Icon = action.icon;
              
              if (action.href) {
                return (
                  <Link
                    key={action.name}
                    to={action.href}
                    className="inline-flex items-center px-3 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-md transition-colors duration-150 dark:text-gray-300 dark:hover:text-white dark:hover:bg-gray-800"
                  >
                    <Icon className="mr-2 h-4 w-4" />
                    {action.name}
                  </Link>
                );
              }

              return (
                <button
                  key={action.name}
                  onClick={action.action}
                  className="inline-flex items-center px-3 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-md transition-colors duration-150 dark:text-gray-300 dark:hover:text-white dark:hover:bg-gray-800"
                >
                  <Icon className="mr-2 h-4 w-4" />
                  {action.name}
                </button>
              );
            })}
          </div>

          {/* Right Section: Search, Notifications, User Menu */}
          <div className="flex items-center space-x-3">
            {/* Search Button */}
            <button
              type="button"
              onClick={() => setIsSearchOpen(true)}
              className="p-2 text-gray-400 hover:text-gray-500 hover:bg-gray-100 rounded-md dark:hover:bg-gray-800"
              aria-label="Search"
            >
              <MagnifyingGlassIcon className="h-5 w-5" />
            </button>

            {/* Notifications */}
            <NotificationCenter />

            {/* User Menu */}
            <UserMenu userRole={userRole} />
          </div>
        </div>

        {/* Mobile Navigation Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden border-t border-gray-200 dark:border-gray-700">
            <div className="px-2 py-3 space-y-1">
              {/* Primary Navigation */}
              {primaryNav.map((item) => {
                const Icon = item.icon;
                const current = isCurrentPage(item.href);
                
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    className={`flex items-center px-3 py-2 text-base font-medium rounded-md transition-colors duration-150 ${
                      current
                        ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50 dark:text-gray-300 dark:hover:text-white dark:hover:bg-gray-800'
                    }`}
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <Icon className="mr-3 h-5 w-5" />
                    {item.name}
                  </Link>
                );
              })}

              {/* Contextual Actions - Mobile */}
              {contextualActions.length > 0 && (
                <>
                  <div className="border-t border-gray-200 dark:border-gray-700 my-2" />
                  {contextualActions.map((action) => {
                    const Icon = action.icon;
                    
                    if (action.href) {
                      return (
                        <Link
                          key={action.name}
                          to={action.href}
                          className="flex items-center px-3 py-2 text-base font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-md dark:text-gray-300 dark:hover:text-white dark:hover:bg-gray-800"
                          onClick={() => setIsMobileMenuOpen(false)}
                        >
                          <Icon className="mr-3 h-5 w-5" />
                          {action.name}
                        </Link>
                      );
                    }

                    return (
                      <button
                        key={action.name}
                        onClick={() => {
                          action.action?.();
                          setIsMobileMenuOpen(false);
                        }}
                        className="flex items-center w-full px-3 py-2 text-base font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-md dark:text-gray-300 dark:hover:text-white dark:hover:bg-gray-800"
                      >
                        <Icon className="mr-3 h-5 w-5" />
                        {action.name}
                      </button>
                    );
                  })}
                </>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Command Palette (Search Modal) */}
      {isSearchOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-screen items-start justify-center px-4 pt-16">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" 
                 onClick={() => setIsSearchOpen(false)} />
            <div className="relative bg-white dark:bg-gray-800 rounded-lg shadow-lg w-full max-w-lg">
              <div className="p-4">
                <div className="flex items-center">
                  <MagnifyingGlassIcon className="h-5 w-5 text-gray-400 mr-3" />
                  <input
                    type="text"
                    placeholder="Search or type a command..."
                    className="flex-1 bg-transparent border-none focus:ring-0 text-gray-900 dark:text-white placeholder-gray-500"
                    autoFocus
                  />
                  <kbd className="hidden sm:inline-flex items-center px-2 py-1 border border-gray-200 rounded text-xs text-gray-400">
                    ⌘K
                  </kbd>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};

export default AppHeader; 