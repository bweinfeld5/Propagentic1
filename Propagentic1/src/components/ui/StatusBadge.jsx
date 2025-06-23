import React from 'react';

/**
 * Status badge component with consistent styling for different statuses
 * @param {Object} props - Component props
 * @param {string} props.status - The status to display (new, available, assigned, in progress, completed)
 * @param {string} props.className - Additional classes
 */
const StatusBadge = ({ status, className = '' }) => {
  // Status badge styling with orange color system
  const getStatusStyles = () => {
    const statusLower = status?.toLowerCase() || '';
    
    switch (statusLower) {
      case 'new':
      case 'available':
        return 'bg-primary/10 text-primary';
      case 'assigned':
      case 'in progress':
        return 'bg-amber-100 text-amber-700';
      case 'completed':
        return 'bg-green-100 text-green-700';
      case 'urgent':
      case 'high':
        return 'bg-red-100 text-red-700';
      case 'medium':
        return 'bg-primary-100 text-primary-700';
      case 'low':
        return 'bg-blue-100 text-blue-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <span 
      className={`text-xs px-2 py-1 rounded-full font-medium ${getStatusStyles()} ${className}`}
      role="status"
    >
      {status}
    </span>
  );
};

export default StatusBadge; 