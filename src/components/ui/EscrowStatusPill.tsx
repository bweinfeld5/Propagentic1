import React from 'react';

// Escrow status type - matches the escrow status values from the error
export type EscrowStatus = 'cancelled' | 'released' | 'disputed' | 'created' | 'funded' | 'pending_release' | 'refunded';

interface EscrowStatusPillProps {
  status: EscrowStatus;
  className?: string;
}

const EscrowStatusPill: React.FC<EscrowStatusPillProps> = ({ status, className = '' }) => {
  const getStatusStyles = (status: EscrowStatus): string => {
    switch (status) {
      case 'created':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'funded':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'pending_release':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'released':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'disputed':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'refunded':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'cancelled':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const formatStatus = (status: EscrowStatus): string => {
    switch (status) {
      case 'pending_release':
        return 'Pending Release';
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

export default EscrowStatusPill; 