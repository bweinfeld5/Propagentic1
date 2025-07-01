import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { UserIcon } from '@heroicons/react/24/outline';
import { UserIcon as UserIconSolid } from '@heroicons/react/24/solid';

const ProfileNavigation = ({ className = "" }) => {
  const location = useLocation();
  const isProfilePage = location.pathname === '/u/profile';

  return (
    <Link
      to="/u/profile"
      className={`flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
        isProfilePage
          ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
          : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100 dark:text-gray-300 dark:hover:text-gray-100 dark:hover:bg-gray-700'
      } ${className}`}
    >
      {isProfilePage ? (
        <UserIconSolid className="h-5 w-5 mr-3" />
      ) : (
        <UserIcon className="h-5 w-5 mr-3" />
      )}
      Profile
    </Link>
  );
};

export default ProfileNavigation; 