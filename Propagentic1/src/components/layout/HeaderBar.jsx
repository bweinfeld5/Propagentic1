import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import UserMenu from './UserMenu';
import ThemeToggle from '../ui/ThemeToggle';
import Button from '../ui/Button';
import { useAuth } from '../../context/AuthContext';
import { BellIcon } from '@heroicons/react/24/outline';

const HeaderBar = ({ filter, setFilter }) => {
  const { currentUser, userProfile } = useAuth();
  const navigate = useNavigate();

  // Get user's first name
  const firstName = userProfile?.name?.split(' ')[0] || currentUser?.email?.split('@')[0] || 'User';
  
  // Get capitalized user type
  const userTypeDisplay = userProfile?.userType 
    ? userProfile.userType.charAt(0).toUpperCase() + userProfile.userType.slice(1) 
    : 'User';

  // Status filters for maintenance requests
  const filters = [
    { id: 'all', name: 'All Requests' },
    { id: 'pending_classification', name: 'Pending' },
    { id: 'ready_to_dispatch', name: 'Ready' },
    { id: 'assigned', name: 'Assigned' },
    { id: 'completed', name: 'Completed' }
  ];

  return (
    <div className="bg-gradient-to-r from-primary-dark to-primary shadow-lg dark:from-neutral-800 dark:to-neutral-900">
      <div className="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between">
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-white dark:text-content-dark flex items-center">
              Welcome back, {firstName} 👋
              <span className="hidden md:inline ml-2 bg-primary-dark/50 dark:bg-neutral-700 text-xs px-2 py-1 rounded-full text-primary-light dark:text-neutral-300">
                {userTypeDisplay}
              </span>
            </h1>
            <p className="mt-1 text-primary-light/80 dark:text-content-darkSecondary font-light">
              Here's your property maintenance hub
            </p>
          </div>
          
          <div className="mt-4 md:mt-0 flex items-center space-x-4">
            <button
              className="relative p-2 text-white dark:text-content-darkSecondary rounded-full hover:bg-primary-dark/80 dark:hover:bg-neutral-700 focus:outline-none focus:ring-2 focus:ring-white dark:focus:ring-primary-light"
              aria-label="Notifications"
            >
              <BellIcon className="w-6 h-6" />
              <span className="absolute top-0 right-0 block h-2.5 w-2.5 rounded-full bg-danger dark:bg-red-500 ring-2 ring-primary-dark dark:ring-neutral-900"></span>
            </button>

            <ThemeToggle />

            <UserMenu />
          </div>
        </div>

        <div className="flex overflow-x-auto space-x-2 mt-4 pb-1 md:justify-center">
          {filters.map(filterOption => (
            <Button
              key={filterOption.id}
              onClick={() => setFilter(filterOption.id)}
              variant={filter === filterOption.id ? 'filter-active' : 'filter-inactive'}
              size="sm"
              className="whitespace-nowrap"
            >
              {filterOption.name}
            </Button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default HeaderBar; 