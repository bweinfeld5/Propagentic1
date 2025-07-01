import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { 
  UserCircleIcon, 
  CogIcon, 
  ArrowRightOnRectangleIcon as LogoutIcon,
  QuestionMarkCircleIcon
} from '@heroicons/react/24/outline';

const UserMenu = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { currentUser, userProfile, logout } = useAuth();
  const dropdownRef = useRef(null);
  const navigate = useNavigate();

  // Get user's initials for avatar
  const getInitials = () => {
    if (userProfile?.name) {
      return userProfile.name
        .split(' ')
        .map(name => name.charAt(0))
        .join('')
        .toUpperCase();
    }
    
    return currentUser?.email?.charAt(0).toUpperCase() || 'U';
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Handle logout
  const handleLogout = async () => {
    try {
      await logout();
      navigate('/propagentic/new');
    } catch (error) {
      console.error('Failed to log out', error);
    }
  };

  return (
    <div className="relative inline-block text-left" ref={dropdownRef}>
      {/* Avatar button - Updated styles */}
      <button
        type="button"
        // Use primary color for avatar bg
        className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-primary text-white hover:bg-primary-dark dark:bg-primary-light dark:text-primary-dark dark:hover:bg-primary focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-primary dark:focus:ring-offset-neutral-900 focus:ring-white dark:focus:ring-primary-light"
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        {userProfile?.photoURL ? (
          <img 
            src={userProfile.photoURL} 
            alt="Profile" 
            className="h-full w-full rounded-full object-cover"
          />
        ) : (
          <span className="text-sm font-medium">{getInitials()}</span>
        )}
      </button>

      {/* Dropdown menu - Updated styles */}
      {isOpen && (
        <div 
          // Use theme colors for background, border, text
          className="origin-top-right absolute right-0 mt-2 w-56 rounded-md shadow-lg bg-background dark:bg-background-darkSubtle ring-1 ring-black/5 dark:ring-white/10 divide-y divide-border dark:divide-border-dark focus:outline-none z-10"
          role="menu"
          aria-orientation="vertical"
          aria-labelledby="user-menu"
        >
          {/* User Info Section */}
          <div className="px-4 py-3" role="none">
            <p className="text-sm font-medium text-content dark:text-content-dark truncate" role="none">
              {userProfile?.name || currentUser?.email}
            </p>
            <p className="text-sm text-content-secondary dark:text-content-darkSecondary truncate" role="none">
              {currentUser?.email}
            </p>
            {/* Role Badge - Update colors if needed */}
            <span className="inline-flex items-center mt-1 px-2 py-0.5 rounded text-xs font-medium bg-primary/10 text-primary dark:bg-primary/20 dark:text-primary-light">
              {userProfile?.userType?.charAt(0).toUpperCase() + userProfile?.userType?.slice(1) || 'User'}
            </span>
          </div>
          
          {/* Menu Items Section */}
          <div className="py-1" role="none">
            <Link
              to="/u/profile"
              className="flex items-center px-4 py-2 text-sm text-content-secondary dark:text-content-darkSecondary hover:bg-neutral-100 dark:hover:bg-neutral-700/50 hover:text-content dark:hover:text-content-dark"
              role="menuitem"
              onClick={() => setIsOpen(false)}
            >
              <UserCircleIcon className="mr-3 h-5 w-5 text-neutral-400 dark:text-neutral-500" aria-hidden="true" />
              My Profile
            </Link>
            <Link
              to="/settings"
              className="flex items-center px-4 py-2 text-sm text-content-secondary dark:text-content-darkSecondary hover:bg-neutral-100 dark:hover:bg-neutral-700/50 hover:text-content dark:hover:text-content-dark"
              role="menuitem"
              onClick={() => setIsOpen(false)}
            >
              <CogIcon className="mr-3 h-5 w-5 text-neutral-400 dark:text-neutral-500" aria-hidden="true" />
              Settings
            </Link>
            <Link
              to="/support"
              className="flex items-center px-4 py-2 text-sm text-content-secondary dark:text-content-darkSecondary hover:bg-neutral-100 dark:hover:bg-neutral-700/50 hover:text-content dark:hover:text-content-dark"
              role="menuitem"
              onClick={() => setIsOpen(false)}
            >
              <QuestionMarkCircleIcon className="mr-3 h-5 w-5 text-neutral-400 dark:text-neutral-500" aria-hidden="true" />
              Support
            </Link>
          </div>
          
          {/* Logout Section */}
          <div className="py-1" role="none">
            <button
              className="flex w-full items-center px-4 py-2 text-sm text-content-secondary dark:text-content-darkSecondary hover:bg-neutral-100 dark:hover:bg-neutral-700/50 hover:text-content dark:hover:text-content-dark"
              role="menuitem"
              onClick={handleLogout}
            >
              <LogoutIcon className="mr-3 h-5 w-5 text-neutral-400 dark:text-neutral-500" aria-hidden="true" />
              Sign out
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserMenu; 