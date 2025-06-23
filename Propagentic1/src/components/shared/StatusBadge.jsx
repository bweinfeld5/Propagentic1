import React from 'react';
import PropTypes from 'prop-types';
import '../styles/colors.css';

/**
 * StatusBadge Component
 * Displays a status indicator with appropriate styling based on the status value
 */
const StatusBadge = ({ status, size = 'default', showIcon = false }) => {
  // Normalize status to lowercase for case-insensitive matching
  const normalizedStatus = status?.toLowerCase() || 'unknown';
  
  // Get the appropriate styling for the status
  const getStatusStyles = () => {
    switch (normalizedStatus) {
      case 'new':
        return { 
          background: 'var(--badge-new-bg)',
          text: 'var(--badge-new-text)',
          icon: NewIcon
        };
      case 'in progress':
      case 'in-progress':
      case 'inprogress':
        return { 
          background: 'var(--badge-in-progress-bg)',
          text: 'var(--badge-in-progress-text)',
          icon: InProgressIcon
        };
      case 'completed':
      case 'done':
      case 'resolved':
        return { 
          background: 'var(--badge-completed-bg)',
          text: 'var(--badge-completed-text)',
          icon: CompletedIcon
        };
      case 'cancelled':
      case 'canceled':
        return { 
          background: 'var(--badge-cancelled-bg)',
          text: 'var(--badge-cancelled-text)',
          icon: CancelledIcon
        };
      case 'urgent':
      case 'high':
      case 'critical':
        return { 
          background: 'var(--badge-urgent-bg)',
          text: 'var(--badge-urgent-text)',
          icon: UrgentIcon
        };
      default:
        return { 
          background: 'var(--badge-cancelled-bg)',
          text: 'var(--badge-cancelled-text)',
          icon: DefaultIcon
        };
    }
  };
  
  const styles = getStatusStyles();
  const StatusIcon = styles.icon;
  
  // Determine size class
  const sizeClasses = {
    small: 'px-1.5 py-0.5 text-xs',
    default: 'px-2.5 py-1 text-xs',
    large: 'px-3 py-1.5 text-sm'
  };
  
  const sizeClass = sizeClasses[size] || sizeClasses.default;
  
  return (
    <span 
      className={`inline-flex items-center rounded-full font-medium ${sizeClass}`}
      style={{ 
        backgroundColor: styles.background,
        color: styles.text
      }}
    >
      {showIcon && (
        <StatusIcon className="w-3.5 h-3.5 mr-1" />
      )}
      <span className="capitalize">{status}</span>
    </span>
  );
};

// PropTypes for component
StatusBadge.propTypes = {
  /** The status to display */
  status: PropTypes.string.isRequired,
  /** The size of the badge */
  size: PropTypes.oneOf(['small', 'default', 'large']),
  /** Whether to show an icon */
  showIcon: PropTypes.bool
};

// Icon components for various statuses
const NewIcon = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" {...props}>
    <path d="M3.5 2.75a.75.75 0 00-1.5 0v14.5a.75.75 0 001.5 0v-4.392l1.657-.348a6.449 6.449 0 014.271.572 7.948 7.948 0 005.965.524l2.078-.64A.75.75 0 0018 12.25v-8.5a.75.75 0 00-.904-.734l-2.38.501a7.25 7.25 0 01-4.186-.363l-.502-.2a8.75 8.75 0 00-5.053-.439l-1.475.31V2.75z" />
  </svg>
);

const InProgressIcon = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" {...props}>
    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm.75-13a.75.75 0 00-1.5 0v5c0 .414.336.75.75.75h4a.75.75 0 000-1.5h-3.25V5z" clipRule="evenodd" />
  </svg>
);

const CompletedIcon = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" {...props}>
    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" />
  </svg>
);

const CancelledIcon = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" {...props}>
    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z" clipRule="evenodd" />
  </svg>
);

const UrgentIcon = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" {...props}>
    <path fillRule="evenodd" d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 5zm0 9a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
  </svg>
);

const DefaultIcon = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" {...props}>
    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-5a.75.75 0 01.75.75v4.5a.75.75 0 01-1.5 0v-4.5A.75.75 0 0110 5zm0 10a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
  </svg>
);

export default StatusBadge; 