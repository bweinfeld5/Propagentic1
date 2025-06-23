import React from 'react';

// Priority status type - matches the priority values from the error
export type PriorityStatus = 'low' | 'normal' | 'high' | 'urgent';

interface PriorityStatusPillProps {
  status: PriorityStatus;
  className?: string;
}

const PriorityStatusPill: React.FC<PriorityStatusPillProps> = ({ status, className = '' }) => {
  const getStatusStyles = (status: PriorityStatus): string => {
    switch (status) {
      case 'low':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'normal':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'high':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'urgent':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const formatStatus = (status: PriorityStatus): string => {
    return status.charAt(0).toUpperCase() + status.slice(1);
  };

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusStyles(status)} ${className}`}
    >
      {formatStatus(status)}
    </span>
  );
};

export default PriorityStatusPill; 