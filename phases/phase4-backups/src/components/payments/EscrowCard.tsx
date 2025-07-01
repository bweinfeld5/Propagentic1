import React from 'react';
import {
  BanknotesIcon,
  ClockIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  CalendarIcon,
  UserIcon,
  ArrowRightIcon
} from '@heroicons/react/24/outline';
import StatusPill from '../ui/StatusPill';
import EscrowStatusPill from '../ui/EscrowStatusPill';
import Button from '../ui/Button';
import { EscrowAccount as ServiceEscrowAccount } from '../../services/firestore/escrowService';

interface EscrowAccount extends ServiceEscrowAccount {
  // Add any additional fields if needed
}

interface EscrowCardProps {
  escrow: EscrowAccount;
  userRole: 'landlord' | 'contractor';
  onViewDetails: (escrow: EscrowAccount) => void;
  onRequestRelease?: (escrow: EscrowAccount) => void;
  onApproveRelease?: (escrow: EscrowAccount) => void;
  className?: string;
}

const EscrowCard: React.FC<EscrowCardProps> = ({
  escrow,
  userRole,
  onViewDetails,
  onRequestRelease,
  onApproveRelease,
  className = ''
}) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'created': return 'gray';
      case 'funded': return 'blue';
      case 'released': return 'green';
      case 'disputed': return 'red';
      case 'cancelled': return 'red';
      default: return 'gray';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'created':
        return <ClockIcon className="w-4 h-4" />;
      case 'funded':
        return <BanknotesIcon className="w-4 h-4" />;
      case 'released':
        return <CheckCircleIcon className="w-4 h-4" />;
      case 'disputed':
        return <ExclamationTriangleIcon className="w-4 h-4" />;
      case 'cancelled':
        return <ExclamationTriangleIcon className="w-4 h-4" />;
      default:
        return <ClockIcon className="w-4 h-4" />;
    }
  };

  const getTimeUntilAutoRelease = () => {
    if (!escrow.releaseConditions.autoReleaseAfterDays) return null;
    
    const now = new Date();
    const autoReleaseDate = new Date(escrow.holdStartDate.getTime() + (escrow.releaseConditions.autoReleaseAfterDays * 24 * 60 * 60 * 1000));
    const timeDiff = autoReleaseDate.getTime() - now.getTime();
    
    if (timeDiff <= 0) return 'Auto-release available';
    
    const days = Math.floor(timeDiff / (24 * 60 * 60 * 1000));
    const hours = Math.floor((timeDiff % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000));
    
    if (days > 0) {
      return `${days} day${days !== 1 ? 's' : ''} remaining`;
    } else {
      return `${hours} hour${hours !== 1 ? 's' : ''} remaining`;
    }
  };

  const getMilestoneProgress = () => {
    if (!escrow.milestones || escrow.milestones.length === 0) return null;
    
    const completed = escrow.milestones.filter(m => m.status === 'completed' || m.status === 'released').length;
    const total = escrow.milestones.length;
    return { completed, total };
  };

  const canRequestRelease = () => {
    return userRole === 'contractor' && 
           escrow.status === 'funded' && 
           onRequestRelease;
  };

  const canApproveRelease = () => {
    return userRole === 'landlord' && 
           escrow.status === 'funded' && 
           escrow.releaseConditions.requiresLandlordApproval &&
           onApproveRelease;
  };

  const otherPartyName = userRole === 'landlord' ? escrow.contractorName : escrow.landlordName;
  const milestoneProgress = getMilestoneProgress();
  const autoReleaseInfo = getTimeUntilAutoRelease();

  const getStatusStyles = (status: string) => {
    switch (status) {
      case 'created':
        return 'bg-gray-100 text-gray-800';
      case 'funded':
        return 'bg-blue-100 text-blue-800';
      case 'released':
        return 'bg-green-100 text-green-800';
      case 'disputed':
        return 'bg-red-100 text-red-800';
      case 'cancelled':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className={`bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow ${className}`}>
      <div className="p-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <h3 className="text-lg font-semibold text-gray-900 truncate">
                {escrow.jobTitle}
              </h3>
              <EscrowStatusPill
                status={escrow.status}
                className={getStatusStyles(escrow.status)}
              />
            </div>
            <p className="text-sm text-gray-600 mb-1">{escrow.propertyAddress}</p>
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <UserIcon className="w-4 h-4" />
              <span>with {otherPartyName}</span>
            </div>
          </div>
          
          <div className="text-right">
            <div className="text-2xl font-bold text-gray-900">
              ${escrow.amount.toLocaleString()}
            </div>
            <div className="text-sm text-gray-500">Escrow Amount</div>
          </div>
        </div>

        {/* Milestone Progress */}
        {milestoneProgress && (
          <div className="mb-4 p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">Milestone Progress</span>
              <span className="text-sm text-gray-600">
                {milestoneProgress.completed}/{milestoneProgress.total} completed
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${(milestoneProgress.completed / milestoneProgress.total) * 100}%` }}
              />
            </div>
          </div>
        )}

        {/* Auto Release Info */}
        {autoReleaseInfo && escrow.status === 'funded' && (
          <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex items-center gap-2">
              <CalendarIcon className="w-4 h-4 text-yellow-600" />
              <span className="text-sm text-yellow-700">{autoReleaseInfo}</span>
            </div>
          </div>
        )}

        {/* Last Activity */}
        {escrow.updatedAt && (
          <div className="mb-4 p-3 bg-blue-50 rounded-lg">
            <div className="flex items-start gap-2">
              <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
              <div>
                <p className="text-sm text-blue-700">Last updated</p>
                <p className="text-xs text-blue-600 mt-1">
                  {escrow.updatedAt.toLocaleDateString()} at{' '}
                  {escrow.updatedAt.toLocaleTimeString([], { 
                    hour: '2-digit', 
                    minute: '2-digit' 
                  })}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Key Details */}
        <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
          <div>
            <span className="text-gray-500">Hold Started:</span>
            <p className="font-medium text-gray-900">
              {escrow.holdStartDate.toLocaleDateString()}
            </p>
          </div>
          <div>
            <span className="text-gray-500">Approval Required:</span>
            <p className="font-medium text-gray-900">
              {escrow.releaseConditions.requiresLandlordApproval ? 'Yes' : 'No'}
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between pt-4 border-t border-gray-100">
          <Button
            variant="outline"
            onClick={() => onViewDetails(escrow)}
            className="flex items-center gap-2"
          >
            View Details
            <ArrowRightIcon className="w-4 h-4" />
          </Button>

          <div className="flex gap-2">
            {canRequestRelease() && (
              <Button
                variant="primary"
                size="sm"
                onClick={() => onRequestRelease!(escrow)}
              >
                Request Release
              </Button>
            )}
            
            {canApproveRelease() && (
              <Button
                variant="primary"
                size="sm"
                onClick={() => onApproveRelease!(escrow)}
              >
                Approve Release
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default EscrowCard; 