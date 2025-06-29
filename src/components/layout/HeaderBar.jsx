import React from 'react';
import { BellIcon } from '@heroicons/react/24/outline';
import UserMenu from './UserMenu';
import { useAuth } from '../../context/AuthContext';

const HeaderBar = () => {
  const { userProfile } = useAuth();
  const firstName = userProfile?.firstName || 'User';
  const userTypeDisplay = userProfile?.userType?.charAt(0).toUpperCase() + userProfile?.userType?.slice(1) || 'User';

  return (
    <div className="bg-gradient-to-r from-primary-dark to-primary shadow-lg">
      <div className="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between">
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-white flex items-center">
              Welcome back, {firstName} 👋
              <span className="hidden md:inline ml-2 bg-primary-dark/50 text-xs px-2 py-1 rounded-full text-primary-light">
                {userTypeDisplay}
              </span>
            </h1>
            <p className="mt-1 text-primary-light/80 font-light">
              Here's your property maintenance hub
            </p>
          </div>
          
          <div className="mt-4 md:mt-0 flex items-center space-x-4">
            <button
              className="relative p-2 text-white rounded-full hover:bg-primary-dark/80 focus:outline-none focus:ring-2 focus:ring-white"
              aria-label="Notifications"
            >
              <BellIcon className="w-6 h-6" />
              <span className="absolute top-0 right-0 block h-2.5 w-2.5 rounded-full bg-danger ring-2 ring-primary-dark"></span>
            </button>

            <UserMenu />
          </div>
        </div>
      </div>
    </div>
  );
};

export default HeaderBar; 