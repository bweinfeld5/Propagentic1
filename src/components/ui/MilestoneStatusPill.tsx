import React from 'react';

// Milestone status type - matches the milestone status values from the error
export type MilestoneStatus = 'disputed' | 'completed' | 'released' | 'pending' | 'approved';

interface MilestoneStatusPillProps {
  status: MilestoneStatus;
  className?: string;
}

const MilestoneStatusPill: React.FC<MilestoneStatusPillProps> = ({ status, className = '' }) => {
  const getStatusStyles = (status: MilestoneStatus): string => {
    switch (status) {
      case 'pending':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'approved':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'completed':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'released':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'disputed':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const formatStatus = (status: MilestoneStatus): string => {
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

export default MilestoneStatusPill; 