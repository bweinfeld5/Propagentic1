import React from 'react';
import { format } from 'date-fns';
import { ClockIcon, UserGroupIcon, WrenchScrewdriverIcon } from '@heroicons/react/24/outline';
import StatusPill from '../ui/StatusPill'; // Use the refactored StatusPill
import Button from '../ui/Button';

// Helper function to format timestamp
const formatTimeAgo = (timestamp) => {
  const now = new Date();
  const date = new Date(timestamp);
  const diffInHours = Math.floor((now - date) / (1000 * 60 * 60));
  
  if (diffInHours < 1) return 'Just now';
  if (diffInHours < 24) return `${diffInHours} ${diffInHours === 1 ? 'hour' : 'hours'} ago`;
  return format(date, 'MMM d, yyyy');
};

/**
 * TenantMaintenanceRequestCard Component
 * 
 * Displays a maintenance request card for the tenant view.
 * 
 * @param {object} request - The maintenance request object
 */
const TenantMaintenanceRequestCard = ({ request }) => {
  const { id, description, status, submittedDate, assignedTo } = request;

  return (
    <div className="bg-background dark:bg-background-darkSubtle rounded-lg shadow-sm border border-border dark:border-border-dark p-5 transition-all hover:shadow-md">
      {/* Top Row: Description and Status */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-start space-x-3">
          <WrenchScrewdriverIcon className="h-6 w-6 text-content-subtle dark:text-content-darkSubtle flex-shrink-0 mt-0.5" />
          <h3 className="text-md font-medium text-content dark:text-content-dark">{description}</h3>
        </div>
        <StatusPill status={status} />
      </div>
      
      {/* Bottom Row: Submitted Date and Assigned Contractor (if applicable) */}
      <div className="flex items-center justify-between mt-4 text-xs text-content-subtle dark:text-content-darkSubtle pl-9"> {/* Align with description */}
        <div className="flex items-center">
          <ClockIcon className="h-4 w-4 mr-1" />
          <span>Submitted: {formatTimeAgo(submittedDate)}</span>
        </div>
        
        {assignedTo && (
          <div className="flex items-center">
            <UserGroupIcon className="h-4 w-4 mr-1" />
            <span>Assigned: {assignedTo}</span>
          </div>
        )}
      </div>

      {/* Optional: Add details expansion or link */}
      <div className="mt-4 pt-3 border-t border-border dark:border-border-dark pl-9">
          <Button variant="outline" size="xs" onClick={() => alert(`View details for ${id}`)}>
              View Details
          </Button>
      </div>
    </div>
  );
};

export default TenantMaintenanceRequestCard; 