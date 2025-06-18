import React from 'react';

// Dispute status type - matches the dispute status values from the error
export type DisputeStatus = 'cancelled' | 'resolved' | 'open' | 'in_mediation' | 'awaiting_response' | 'escalated' | 'closed';

interface DisputeStatusPillProps {
  status: DisputeStatus;
  className?: string;
}

const DisputeStatusPill: React.FC<DisputeStatusPillProps> = ({ status, className = '' }) => {
  const getStatusStyles = (status: DisputeStatus): string => {
    switch (status) {
      case 'open':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'in_mediation':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'awaiting_response':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'escalated':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'resolved':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'closed':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'cancelled':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const formatStatus = (status: DisputeStatus): string => {
    switch (status) {
      case 'in_mediation':
        return 'In Mediation';
      case 'awaiting_response':
        return 'Awaiting Response';
      default:
        return status.charAt(0).toUpperCase() + status.slice(1);
    }
  };

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusStyles(status)} ${className}`}
    >
      {formatStatus(status)}
    </span>
  );
};

export default DisputeStatusPill; 