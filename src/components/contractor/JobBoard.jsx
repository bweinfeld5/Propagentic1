import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { 
  ClipboardDocumentListIcon as ClipboardListIcon, 
  ClockIcon, 
  CheckCircleIcon, 
  ExclamationCircleIcon as ExclamationIcon, 
  ChevronRightIcon,
  FunnelIcon as FilterIcon,
  ArrowsUpDownIcon as SortAscendingIcon
} from '@heroicons/react/24/outline';

// Helper function to determine status styles
const getStatusStyles = (status) => {
  // Ensure status is a string
  const statusStr = typeof status === 'string' ? status.toLowerCase() : '';
  
  switch (statusStr) {
    case 'new':
    case 'assigned':
    case 'ready_to_dispatch':
      return { badge: 'bg-blue-100 text-blue-800', icon: ClipboardListIcon, text: 'New' };
    case 'accepted':
      return { badge: 'bg-yellow-100 text-yellow-800', icon: ClockIcon, text: 'Accepted' };
    case 'in_progress':
      return { badge: 'bg-indigo-100 text-indigo-800', icon: ClockIcon, text: 'In Progress' };
    case 'completed':
      return { badge: 'bg-green-100 text-green-800', icon: CheckCircleIcon, text: 'Completed' };
    case 'blocked':
      return { badge: 'bg-red-100 text-red-800', icon: ExclamationIcon, text: 'Blocked' };
    default:
      return { badge: 'bg-gray-100 text-gray-800', icon: ClipboardListIcon, text: status || 'New' };
  }
};

// Helper function for priority styles
const getPriorityStyles = (priority) => {
  // Ensure priority is a string
  const priorityStr = typeof priority === 'string' ? priority.toLowerCase() : '';
  
  switch (priorityStr) {
    case 'high':
      return { tag: 'border-red-500 text-red-600 bg-red-50', icon: ExclamationIcon, text: 'High' };
    case 'medium':
      return { tag: 'border-yellow-500 text-yellow-600 bg-yellow-50', icon: ExclamationIcon, text: 'Medium' };
    case 'low':
      return { tag: 'border-green-500 text-green-600 bg-green-50', icon: ExclamationIcon, text: 'Low' };
    default:
      return { tag: 'border-gray-400 text-gray-500', icon: null, text: 'Normal' };
  }
};

const JobItem = ({ job, onAccept, onUpdateStatus }) => {
  // Safely access job properties
  if (!job) {
    return null; // Don't render if job is undefined
  }
  
  // Get status and priority styles with safety checks
  const statusInfo = getStatusStyles(job.status);
  const priorityInfo = getPriorityStyles(job.urgency || job.priority);
  
  const navigate = useNavigate();
  
  // Safely format date
  let timeAgo = 'recently';
  try {
    if (job.assignedAt) {
      const date = job.assignedAt instanceof Date 
        ? job.assignedAt 
        : new Date(job.assignedAt);
      timeAgo = formatDistanceToNow(date, { addSuffix: true });
    } else if (job.createdAt) {
      const date = job.createdAt instanceof Date 
        ? job.createdAt 
        : new Date(job.createdAt);
      timeAgo = formatDistanceToNow(date, { addSuffix: true });
    }
  } catch (error) {
    console.error('Error formatting date:', error);
  }

  const handleViewDetails = () => {
    navigate(`/contractor/jobs/${job.id}`);
  };

  return (
    <div className="bg-white p-4 rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200">
      <div className="flex flex-wrap items-center gap-2 mb-3">
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusInfo.badge}`}> 
          <statusInfo.icon className="-ml-0.5 mr-1 h-4 w-4" aria-hidden="true" />
          {statusInfo.text}
        </span>
        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${priorityInfo.tag}`}>
          {priorityInfo.icon && <priorityInfo.icon className="mr-1 h-3 w-3" />}
          {priorityInfo.text}
        </span>
      </div>
      
      <h3 className="text-lg font-medium text-gray-900 mb-1">
        {job.title || job.issueTitle || 'Maintenance Request'}
      </h3>
      
      <p className="text-sm text-gray-500 mb-3 line-clamp-2">
        {job.description || 'No description provided.'}
      </p>
      
      <div className="grid grid-cols-2 gap-4 mb-4 text-sm text-gray-600">
        <div>
          <p className="font-medium text-xs text-gray-500">Location</p>
          <p>{job.property?.address || job.propertyAddress || 'Address not available'}</p>
          <p>Unit {job.unit || job.unitNumber || 'N/A'}</p>
        </div>
        <div>
          <p className="font-medium text-xs text-gray-500">Assigned</p>
          <p>{timeAgo}</p>
          <p>{job.landlordName || 'Landlord'}</p>
        </div>
      </div>
      
      <div className="flex flex-col sm:flex-row gap-2 mt-4">
        {/* Show accept button only for new or assigned jobs */}
        {(!job.status || 
          job.status === 'new' || 
          job.status === 'assigned' || 
          job.status === 'ready_to_dispatch') && (
          <button 
            onClick={() => onAccept(job.id)}
            className="flex justify-center items-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-teal-600 hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500"
          >
            Accept Job
          </button>
        )}
        
        {/* Status update button for jobs in progress */}
        {(job.status === 'accepted' || 
          job.status === 'in_progress' || 
          job.status === 'blocked') && (
          <button 
            onClick={() => onUpdateStatus(job.id)}
            className="flex justify-center items-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500"
          >
            Update Status
          </button>
        )}
        
        {/* View details button for all jobs */}
        <button 
          onClick={handleViewDetails}
          className="flex justify-center items-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500"
        >
          View Details <ChevronRightIcon className="ml-1 h-4 w-4" />
        </button>
      </div>
    </div>
  );
};

const JobBoard = ({ jobs = [], onAcceptJob, onUpdateJobStatus }) => {
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState('date'); // 'date', 'priority'
  
  // Guard against undefined inputs
  const safeJobs = Array.isArray(jobs) ? jobs : [];
  
  // Apply status filter
  const filteredJobs = safeJobs.filter(job => {
    if (statusFilter === 'all') return true;
    if (!job || !job.status) return false;
    
    const status = job.status.toLowerCase();
    if (statusFilter === 'new') return status === 'new' || status === 'assigned' || status === 'ready_to_dispatch';
    if (statusFilter === 'accepted') return status === 'accepted';
    if (statusFilter === 'in_progress') return status === 'in_progress';
    if (statusFilter === 'blocked') return status === 'blocked';
    
    return true;
  });
  
  // Sort jobs
  const sortedJobs = [...filteredJobs].sort((a, b) => {
    if (sortBy === 'priority') {
      // Sort by priority (high, medium, low)
      const priorityOrder = { 'high': 0, 'medium': 1, 'low': 2 };
      const priorityA = (a?.urgency || a?.priority || '').toLowerCase();
      const priorityB = (b?.urgency || b?.priority || '').toLowerCase();
      
      return (priorityOrder[priorityA] || 999) - (priorityOrder[priorityB] || 999);
    } else {
      // Default: sort by date (newest first)
      try {
        const dateA = a?.assignedAt || a?.createdAt || new Date(0);
        const dateB = b?.assignedAt || b?.createdAt || new Date(0);
        
        const timeA = dateA instanceof Date ? dateA.getTime() : new Date(dateA).getTime();
        const timeB = dateB instanceof Date ? dateB.getTime() : new Date(dateB).getTime();
        
        return timeB - timeA;
      } catch (error) {
        console.error('Error sorting jobs by date:', error);
        return 0;
      }
    }
  });

  if (sortedJobs.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-md p-6">
        <div className="text-center py-8">
          <ClipboardListIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-lg font-medium text-gray-900">No Jobs Found</h3>
          <p className="mt-1 text-gray-500">There are currently no maintenance jobs assigned to you.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-md overflow-hidden">
      <div className="p-4 border-b border-gray-200">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <h2 className="text-lg font-medium text-gray-900">Assigned Jobs</h2>
          
          <div className="flex flex-wrap gap-2">
            {/* Filter buttons */}
            <div className="relative inline-block text-left">
              <button
                type="button"
                className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500"
                onClick={() => {/* Toggle filter dropdown */}}
              >
                <FilterIcon className="-ml-0.5 mr-2 h-4 w-4" />
                Filter: {statusFilter.charAt(0).toUpperCase() + statusFilter.slice(1)}
              </button>
              
              <div className="absolute z-10 mt-1 w-56 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 focus:outline-none hidden">
                <div className="py-1" role="menu" aria-orientation="vertical">
                  <button
                    className={`block px-4 py-2 text-sm text-left w-full ${statusFilter === 'all' ? 'bg-gray-100 text-gray-900' : 'text-gray-700'} hover:bg-gray-100`}
                    onClick={() => setStatusFilter('all')}
                  >
                    All Jobs
                  </button>
                  <button
                    className={`block px-4 py-2 text-sm text-left w-full ${statusFilter === 'new' ? 'bg-gray-100 text-gray-900' : 'text-gray-700'} hover:bg-gray-100`}
                    onClick={() => setStatusFilter('new')}
                  >
                    New Jobs
                  </button>
                  <button
                    className={`block px-4 py-2 text-sm text-left w-full ${statusFilter === 'accepted' ? 'bg-gray-100 text-gray-900' : 'text-gray-700'} hover:bg-gray-100`}
                    onClick={() => setStatusFilter('accepted')}
                  >
                    Accepted Jobs
                  </button>
                  <button
                    className={`block px-4 py-2 text-sm text-left w-full ${statusFilter === 'in_progress' ? 'bg-gray-100 text-gray-900' : 'text-gray-700'} hover:bg-gray-100`}
                    onClick={() => setStatusFilter('in_progress')}
                  >
                    In Progress
                  </button>
                  <button
                    className={`block px-4 py-2 text-sm text-left w-full ${statusFilter === 'blocked' ? 'bg-gray-100 text-gray-900' : 'text-gray-700'} hover:bg-gray-100`}
                    onClick={() => setStatusFilter('blocked')}
                  >
                    Blocked Jobs
                  </button>
                </div>
              </div>
            </div>
            
            {/* Sort button */}
            <button
              type="button"
              className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500"
              onClick={() => setSortBy(sortBy === 'date' ? 'priority' : 'date')}
            >
              <SortAscendingIcon className="-ml-0.5 mr-2 h-4 w-4" />
              Sort by: {sortBy === 'date' ? 'Date' : 'Priority'}
            </button>
          </div>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
        {sortedJobs.map((job) => (
          <JobItem 
            key={job?.id || Math.random().toString(36).substring(7)} 
            job={job}
            onAccept={onAcceptJob}
            onUpdateStatus={onUpdateJobStatus}
          />
        ))}
      </div>
    </div>
  );
};

export default JobBoard; 