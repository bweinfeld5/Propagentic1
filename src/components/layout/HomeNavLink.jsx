import React from 'react';
import { NavLink as RouterNavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { HomeIcon } from '@heroicons/react/24/outline';

const HomeNavLink = ({ className, showOnAuth = false }) => {
  const { currentUser } = useAuth();
  
  // Don't show on authenticated pages unless specifically requested
  if (currentUser && !showOnAuth) return null;
  
  const baseClasses = "inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium";
  const activeClasses = "border-propagentic-teal text-propagentic-slate-dark";
  const inactiveClasses = "border-transparent text-propagentic-slate hover:border-gray-300 hover:text-propagentic-slate-dark";

  return (
    <RouterNavLink
      to="/propagentic/new"
      className={({ isActive }) => 
        `${baseClasses} ${isActive ? activeClasses : inactiveClasses} ${className}`
      }
    >
      <HomeIcon className="mr-1 h-5 w-5" />
      Back to Home
    </RouterNavLink>
  );
};

export default HomeNavLink; 