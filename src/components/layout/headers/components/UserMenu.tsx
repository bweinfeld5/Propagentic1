import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  UserCircleIcon,
  CogIcon,
  ArrowRightOnRectangleIcon,
  ChevronDownIcon,
  UserIcon,
  BuildingOfficeIcon,
  ShieldCheckIcon,
  BellIcon
} from '@heroicons/react/24/outline';
import { useAuth } from '../../../../context/AuthContext';

// Type for Heroicons
type HeroIcon = React.ForwardRefExoticComponent<
  Omit<React.SVGProps<SVGSVGElement>, "ref"> & {
    title?: string | undefined;
    titleId?: string | undefined;
  } & React.RefAttributes<SVGSVGElement>
>;

interface RoleMenuItem {
  name: string;
  href: string;
  icon: HeroIcon;
}

interface UserMenuProps {
  userRole: 'landlord' | 'tenant' | 'contractor' | 'admin' | 'user';
  className?: string;
}

/**
 * UserMenu - Role-aware user dropdown menu
 * 
 * Features:
 * - Role-specific menu items
 * - Profile information display
 * - Quick actions based on user type
 * - Proper auth routing and logout handling
 */
const UserMenu: React.FC<UserMenuProps> = ({ userRole, className = '' }) => {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const { currentUser, userProfile, logout } = useAuth();
  const navigate = useNavigate();

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Handle logout
  const handleLogout = async () => {
    try {
      await logout();
      navigate('/propagentic/new');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  // Role-specific menu items
  const getRoleSpecificItems = (): RoleMenuItem[] => {
    const roleItems = {
      landlord: [
        { name: 'My Properties', href: '/properties', icon: BuildingOfficeIcon },
        { name: 'Analytics', href: '/analytics', icon: ShieldCheckIcon },
      ],
      tenant: [
        { name: 'My Lease', href: '/lease', icon: UserIcon },
        { name: 'Payment History', href: '/payments/history', icon: ShieldCheckIcon },
      ],
      contractor: [
        { name: 'My Jobs', href: '/jobs', icon: BuildingOfficeIcon },
        { name: 'Earnings', href: '/earnings', icon: ShieldCheckIcon },
      ],
      admin: [
        { name: 'User Management', href: '/admin/users', icon: UserIcon },
        { name: 'System Settings', href: '/admin/settings', icon: CogIcon },
      ],
      user: []
    };

    return roleItems[userRole] || [];
  };

  const roleSpecificItems = getRoleSpecificItems();

  // Get user display name and role label
  const getUserDisplayName = () => {
    if (userProfile?.displayName) return userProfile.displayName;
    if (userProfile?.firstName && userProfile?.lastName) {
      return `${userProfile.firstName} ${userProfile.lastName}`;
    }
    if (currentUser?.email) return currentUser.email.split('@')[0];
    return 'User';
  };

  const getRoleLabel = () => {
    const roleLabels = {
      landlord: 'Property Manager',
      tenant: 'Tenant',
      contractor: 'Contractor',
      admin: 'Administrator',
      user: 'User'
    };
    return roleLabels[userRole] || 'User';
  };

  const displayName = getUserDisplayName();
  const roleLabel = getRoleLabel();

  return (
    <div className={`relative ${className}`} ref={menuRef}>
      {/* User Menu Button */}
      <button
        type="button"
        className="flex items-center space-x-2 p-2 text-sm rounded-md text-gray-700 hover:text-gray-900 hover:bg-gray-100 dark:text-gray-300 dark:hover:text-white dark:hover:bg-gray-800 transition-colors duration-150"
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        {/* Avatar */}
        <div className="h-8 w-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
          <span className="text-white text-sm font-medium">
            {displayName.charAt(0).toUpperCase()}
          </span>
        </div>
        
        {/* User Info - Hidden on Mobile */}
        <div className="hidden md:block text-left">
          <p className="text-sm font-medium text-gray-900 dark:text-white">
            {displayName}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {roleLabel}
          </p>
        </div>
        
        <ChevronDownIcon 
          className={`h-4 w-4 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} 
        />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-56 rounded-md bg-white dark:bg-gray-800 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none z-50">
          <div className="py-1">
            {/* User Info Header */}
            <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
              <p className="text-sm font-medium text-gray-900 dark:text-white">
                {displayName}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {currentUser?.email}
              </p>
              <p className="text-xs text-blue-600 dark:text-blue-400 font-medium">
                {roleLabel}
              </p>
            </div>

            {/* Role-Specific Items */}
            {roleSpecificItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700 dark:hover:text-white transition-colors duration-150"
                  onClick={() => setIsOpen(false)}
                >
                  <Icon className="mr-3 h-4 w-4" />
                  {item.name}
                </Link>
              );
            })}

            {roleSpecificItems.length > 0 && (
              <div className="border-t border-gray-200 dark:border-gray-700" />
            )}

            {/* Standard Items */}
            <Link
              to="/u/profile"
              className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700 dark:hover:text-white transition-colors duration-150"
              onClick={() => setIsOpen(false)}
            >
              <UserCircleIcon className="mr-3 h-4 w-4" />
              Profile
            </Link>

            <Link
              to="/settings"
              className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700 dark:hover:text-white transition-colors duration-150"
              onClick={() => setIsOpen(false)}
            >
              <CogIcon className="mr-3 h-4 w-4" />
              Settings
            </Link>

            <Link
              to="/notifications"
              className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700 dark:hover:text-white transition-colors duration-150"
              onClick={() => setIsOpen(false)}
            >
              <BellIcon className="mr-3 h-4 w-4" />
              Notifications
            </Link>

            <div className="border-t border-gray-200 dark:border-gray-700" />

            {/* Logout */}
            <button
              onClick={() => {
                setIsOpen(false);
                handleLogout();
              }}
              className="flex items-center w-full px-4 py-2 text-sm text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/50 transition-colors duration-150"
            >
              <ArrowRightOnRectangleIcon className="mr-3 h-4 w-4" />
              Sign Out
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserMenu; 