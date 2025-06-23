import React from 'react';

/**
 * StatusPill - A reusable component for displaying status indicators
 * @param {Object} props - Component props
 * @param {string} props.status - The status text to display
 * @param {string} props.className - Additional CSS classes to apply
 */
const StatusPill = ({ status, className = '' }) => {
  // Function to determine color classes based on status
  const getStatusStyles = () => {
    // Standardize status input
    const normalizedStatus = status?.toLowerCase() || 'default';

    switch (normalizedStatus) {
      // Use primary (Orange) for new/submitted/active PropAgentic statuses
      case 'new':
      case 'submitted':
      case 'active':
      case 'featured':
        return 'bg-primary/10 text-primary dark:bg-primary/20 dark:text-primary-light';
      
      // Use warning (Amber) for in progress/assigned
      case 'assigned':
      case 'in progress':
      case 'scheduled': // Added scheduled based on mock data
        return 'bg-warning-subtle text-amber-700 dark:bg-warning-darkSubtle dark:text-amber-300'; // Example: using specific shades
      
      // Use success (Green) for completed/resolved
      case 'completed':
      case 'resolved':
        return 'bg-success-subtle text-success dark:bg-success-darkSubtle dark:text-emerald-300';
      
      // Use danger (Red) for canceled/rejected
      case 'canceled':
      case 'rejected':
        return 'bg-danger-subtle text-danger dark:bg-danger-darkSubtle dark:text-red-300';
      
      // Use info (Blue) or secondary (Purple) for pending/waiting?
      case 'pending':
      case 'waiting':
        return 'bg-info-subtle text-info dark:bg-info-darkSubtle dark:text-blue-300';
      
      // Orange priority variant for high-priority items
      case 'urgent':
      case 'priority':
      case 'hot':
        return 'bg-primary-100 text-primary-800 dark:bg-primary-900/50 dark:text-primary-200';
      
      // Default neutral style
      default:
        return 'bg-neutral-100 text-neutral-700 dark:bg-neutral-700 dark:text-neutral-200';
    }
  };
  
  // Base classes + dynamic styles + passed className
  const classes = `
    inline-block px-3 py-1 rounded-full text-xs font-semibold tracking-wide 
    ${getStatusStyles()}
    ${className}
  `.trim();
  
  return (
    <span className={classes}>
      {status} 
    </span>
  );
};

export default StatusPill; 