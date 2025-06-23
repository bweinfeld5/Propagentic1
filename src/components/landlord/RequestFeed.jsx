import React from 'react';
import { formatDistanceToNow } from 'date-fns';
import { ClipboardDocumentListIcon, ClockIcon, ExclamationTriangleIcon, CheckCircleIcon, ChevronRightIcon } from '@heroicons/react/24/outline';

// Helper function to determine status styles
const getStatusStyles = (status) => {
  // Ensure status is a string
  const statusStr = typeof status === 'string' ? status.toLowerCase() : '';
  
  switch (statusStr) {
    case 'new':
    case 'pending_classification':
    case 'ready_to_dispatch':
      return { badge: 'bg-blue-100 text-blue-800', icon: ClipboardDocumentListIcon, text: 'New' };
    case 'assigned':
      return { badge: 'bg-yellow-100 text-yellow-800', icon: ClockIcon, text: 'Assigned' };
    case 'in_progress':
      return { badge: 'bg-indigo-100 text-indigo-800', icon: ClockIcon, text: 'In Progress' };
    case 'completed':
      return { badge: 'bg-green-100 text-green-800', icon: CheckCircleIcon, text: 'Completed' };
    default:
      return { badge: 'bg-gray-100 text-gray-800', icon: ClipboardDocumentListIcon, text: status || 'New' };
  }
};

// Helper function for priority styles
const getPriorityStyles = (priority) => {
  // Ensure priority is a string
  const priorityStr = typeof priority === 'string' ? priority.toLowerCase() : '';
  
  switch (priorityStr) {
    case 'high':
      return { tag: 'border-red-500 text-red-600 bg-red-50', icon: ExclamationTriangleIcon, text: 'High' };
    case 'medium':
      return { tag: 'border-yellow-500 text-yellow-600 bg-yellow-50', icon: ExclamationTriangleIcon, text: 'Medium' };
    case 'low':
      return { tag: 'border-green-500 text-green-600 bg-green-50', icon: ExclamationTriangleIcon, text: 'Low' };
    default:
      return { tag: 'border-gray-400 text-gray-500', icon: null, text: 'Normal' };
  }
};

const RequestItem = ({ request, onAssign }) => {
  // Safely access request properties
  if (!request) {
    return null; // Don't render if request is undefined
  }
  
  // Get status and priority styles with safety checks
  const statusInfo = getStatusStyles(request.status);
  const priorityInfo = getPriorityStyles(request.urgency);
  
  // Safely format date
  let timeAgo = 'recently';
  try {
    if (request.createdAt) {
      const date = request.createdAt instanceof Date 
        ? request.createdAt 
        : new Date(request.createdAt);
      timeAgo = formatDistanceToNow(date, { addSuffix: true });
    }
  } catch (error) {
    console.error('Error formatting date:', error);
    // Fall back to default value
  }

  return (
    <li className="bg-white p-4 rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
      <div className="flex-1 min-w-0">
        <div className="flex flex-wrap items-center gap-2 mb-1">
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusInfo.badge}`}> 
            <statusInfo.icon className="-ml-0.5 mr-1 h-4 w-4" aria-hidden="true" />
            {statusInfo.text}
          </span>
          <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${priorityInfo.tag}`}>
            {priorityInfo.icon && <priorityInfo.icon className="mr-1 h-3 w-3" />}
            {priorityInfo.text}
          </span>
        </div>
        <p className="text-sm font-medium text-slate-900 truncate mb-1" title={request.title || request.issueTitle}>
          {request.title || request.issueTitle || 'Maintenance Request'}
        </p>
        <p className="text-xs text-slate-500">
          Unit {request.unit || request.unitNumber || 'N/A'} • Submitted {timeAgo}
        </p>
      </div>
      <div className="flex-shrink-0 flex flex-col sm:flex-row items-end sm:items-center gap-2 mt-2 sm:mt-0 w-full sm:w-auto">
        {/* Show assign button only if status is new or pending */}
        {(!request.status || 
          request.status === 'new' || 
          request.status === 'pending_classification' || 
          request.status === 'ready_to_dispatch') && (
          <button 
            onClick={() => onAssign(request.id)}
            className="text-xs font-medium text-white bg-teal-600 hover:bg-teal-700 px-3 py-1.5 rounded-md shadow-sm whitespace-nowrap w-full sm:w-auto"
          >
            Assign Contractor
          </button>
        )}
        <button className="text-xs font-medium text-slate-600 hover:text-slate-900 px-3 py-1.5 rounded-md border border-slate-300 bg-white shadow-sm whitespace-nowrap flex items-center justify-center w-full sm:w-auto">
          View Details <ChevronRightIcon className="ml-1 h-4 w-4" />
        </button>
      </div>
    </li>
  );
};

const RequestFeed = ({ requests = [], onAssignContractor }) => {
  // Guard against undefined inputs
  const safeRequests = Array.isArray(requests) ? requests : [];
  
  // Sort requests by date (newest first) and filter out completed ones for display
  const sortedRequests = [...safeRequests]
    .sort((a, b) => {
      try {
        const dateA = a?.createdAt instanceof Date ? a.createdAt : new Date(a?.createdAt || 0);
        const dateB = b?.createdAt instanceof Date ? b.createdAt : new Date(b?.createdAt || 0);
        return dateB - dateA;
      } catch (error) {
        console.error('Error sorting requests:', error);
        return 0; // Return equal sorting if dates can't be compared
      }
    })
    .filter(req => {
      // Filter out completed requests
      if (!req) return false;
      const status = typeof req.status === 'string' ? req.status.toLowerCase() : '';
      return status !== 'completed';
    })
    .slice(0, 5); // Limit to 5 most recent

  if (sortedRequests.length === 0) {
    return (
      <div className="text-center py-8">
        <ClipboardDocumentListIcon className="mx-auto h-10 w-10 text-gray-400" />
        <h3 className="mt-2 text-sm font-medium text-gray-900">No Maintenance Requests</h3>
        <p className="mt-1 text-sm text-gray-500">All maintenance requests have been completed.</p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden">
      <ul className="space-y-3 max-h-[400px] overflow-y-auto p-1">
        {sortedRequests.map((request) => (
          <RequestItem 
            key={request?.id || Math.random().toString(36).substr(2, 9)} 
            request={request} 
            onAssign={onAssignContractor} 
          />
        ))}
      </ul>
      {safeRequests.length > 5 && (
        <div className="pt-3 border-t border-gray-200 mt-3 text-center">
          <button className="text-sm text-teal-600 hover:text-teal-800 font-medium">
            View All Requests
          </button>
        </div>
      )}
    </div>
  );
};

export default RequestFeed; 