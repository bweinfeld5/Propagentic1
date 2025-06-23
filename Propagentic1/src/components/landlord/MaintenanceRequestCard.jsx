import React, { useState, useRef, useEffect } from 'react';
import { format } from 'date-fns';
import { 
  WrenchIcon, 
  CheckIcon, 
  ClockIcon, 
  ClipboardDocumentCheckIcon,
  UserIcon,
  ChevronDownIcon
} from '@heroicons/react/24/outline';

/**
 * Status options for maintenance requests
 */
const STATUS_OPTIONS = [
  { id: 'new', label: 'New' },
  { id: 'assigned', label: 'Assigned' },
  { id: 'in_progress', label: 'In Progress' },
  { id: 'completed', label: 'Completed' },
];

/**
 * Format a timestamp to show time ago
 */
const formatTimeAgo = (timestamp) => {
  const now = new Date();
  const diffInHours = Math.floor((now - new Date(timestamp)) / (1000 * 60 * 60));
  
  if (diffInHours < 1) {
    return 'Just now';
  } else if (diffInHours < 24) {
    return `${diffInHours} ${diffInHours === 1 ? 'hour' : 'hours'} ago`;
  } else {
    return format(new Date(timestamp), 'MMM d, yyyy');
  }
};

// Helper to get status styles using Tailwind theme colors
const getStatusPillStyles = (status) => {
  const normalizedStatus = status?.toLowerCase() || 'default';
  switch (normalizedStatus) {
    case 'new':
    case 'submitted':
      return 'bg-primary/10 text-primary dark:bg-primary/20 dark:text-primary-light';
    case 'assigned':
    case 'in_progress': // Use 'in_progress' from mock data
    case 'scheduled': 
      return 'bg-warning-subtle text-amber-700 dark:bg-warning-darkSubtle dark:text-amber-300';
    case 'completed':
    case 'resolved':
      return 'bg-success-subtle text-success dark:bg-success-darkSubtle dark:text-emerald-300';
    case 'canceled':
    case 'rejected':
      return 'bg-danger-subtle text-danger dark:bg-danger-darkSubtle dark:text-red-300';
    case 'pending':
    case 'waiting':
      return 'bg-info-subtle text-info dark:bg-info-darkSubtle dark:text-blue-300';
    default:
      return 'bg-neutral-100 text-neutral-700 dark:bg-neutral-700 dark:text-neutral-200';
  }
};

/**
 * MaintenanceRequestCard Component
 * 
 * Displays a maintenance request with editable status
 * 
 * @param {object} request - The maintenance request object
 * @param {function} onStatusChange - Callback when status is changed
 */
const MaintenanceRequestCard = ({ request, onStatusChange }) => {
  const [isStatusOpen, setIsStatusOpen] = useState(false);
  const { id, description, location, status, timestamp, assignedTo } = request;
  const dropdownRef = useRef(null); // Ref for dropdown

  const currentStatusLabel = STATUS_OPTIONS.find(s => s.id === status)?.label || status;

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsStatusOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleStatusChange = (newStatus) => {
    onStatusChange(id, newStatus);
    setIsStatusOpen(false);
  };

  return (
    <div className="bg-background dark:bg-background-darkSubtle rounded-lg shadow-sm border border-border dark:border-border-dark p-5 transition-all hover:shadow-md">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-start space-x-3">
          <WrenchIcon className="h-6 w-6 text-content-subtle dark:text-content-darkSubtle flex-shrink-0 mt-0.5" />
          <h3 className="text-md font-medium text-content dark:text-content-dark">{description}</h3>
        </div>
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setIsStatusOpen(!isStatusOpen)}
            className={`rounded-full px-3 py-1 text-xs font-medium flex items-center transition-colors duration-150 hover:opacity-80 ${getStatusPillStyles(status)}`}
            aria-haspopup="listbox"
            aria-expanded={isStatusOpen}
          >
            {currentStatusLabel}
            <ChevronDownIcon className="ml-1 h-3 w-3" />
          </button>
          
          {isStatusOpen && (
            <div 
              className="absolute right-0 mt-1 w-48 bg-background dark:bg-background-darkSubtle rounded-md shadow-lg ring-1 ring-black/5 dark:ring-white/10 z-10 py-1 focus:outline-none"
              role="listbox"
            >
              {STATUS_OPTIONS.map((option) => (
                <button
                  key={option.id}
                  onClick={() => handleStatusChange(option.id)}
                  role="option"
                  aria-selected={option.id === status}
                  className={`block w-full text-left px-4 py-2 text-sm transition-colors duration-100 
                    ${option.id === status 
                      ? 'font-medium bg-neutral-100 dark:bg-neutral-700 text-primary dark:text-primary-light' 
                      : 'text-content dark:text-content-dark hover:bg-neutral-50 dark:hover:bg-neutral-700/60'
                    }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
      
      <p className="text-sm text-content-secondary dark:text-content-darkSecondary mb-3 pl-9">{location}</p>
      
      <div className="flex items-center justify-between mt-4 text-xs text-content-subtle dark:text-content-darkSubtle pl-9">
        <div className="flex items-center">
          <ClockIcon className="h-4 w-4 mr-1" />
          <span>{formatTimeAgo(timestamp)}</span>
        </div>
        
        {assignedTo ? (
          <div className="flex items-center">
            <UserIcon className="h-4 w-4 mr-1" />
            <span>{assignedTo}</span>
          </div>
        ) : (
          <div className="flex items-center text-warning dark:text-amber-400 font-medium">
            <ClipboardDocumentCheckIcon className="h-4 w-4 mr-1" />
            <span>Needs Assignment</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default MaintenanceRequestCard; 