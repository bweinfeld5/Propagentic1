import React from 'react';
import { 
  ClockIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon 
} from '@heroicons/react/24/outline';
import { MaintenanceRequest, MaintenanceStatus } from '../../models';

interface RequestStatusTrackerProps {
  request?: MaintenanceRequest;
  requestId?: string;
  currentStatus?: MaintenanceStatus;
  compact?: boolean;
  className?: string;
}

/**
 * A basic request status tracker component
 */
const RequestStatusTracker: React.FC<RequestStatusTrackerProps> = ({ 
  request,
  requestId,
  currentStatus,
  compact = false,
  className = '' 
}) => {
  // Normalize into a request-like object
  const normalizedRequest = request || {
    id: requestId,
    status: currentStatus,
    title: `Request ${requestId}`,
    createdAt: null,
    description: '',
    priority: 'low'
  };

  if (!normalizedRequest) {
    return (
      <div className={`p-4 bg-gray-50 rounded-lg ${className}`}>
        <div className="text-gray-500 text-sm">No request data available</div>
      </div>
    );
  }

  const getStatusIcon = (status: MaintenanceStatus | undefined) => {
    switch (status?.toLowerCase()) {
      case 'completed':
        return <CheckCircleIcon className="w-5 h-5 text-green-500" />;
      case 'urgent':
      case 'high':
        return <ExclamationTriangleIcon className="w-5 h-5 text-red-500" />;
      default:
        return <ClockIcon className="w-5 h-5 text-blue-500" />;
    }
  };

  const getStatusColor = (status: MaintenanceStatus | undefined) => {
    switch (status?.toLowerCase()) {
      case 'completed':
        return 'border-green-200 bg-green-50';
      case 'urgent':
      case 'high':
        return 'border-red-200 bg-red-50';
      default:
        return 'border-blue-200 bg-blue-50';
    }
  };

  return (
    <div className={`p-4 border rounded-lg ${getStatusColor(normalizedRequest.status)} ${className}`}>
      <div className="flex items-start space-x-3">
        <div className="flex-shrink-0">
          {getStatusIcon(normalizedRequest.status)}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-medium text-gray-900">
            {normalizedRequest.title || 'Maintenance Request'}
          </h3>
          {!compact && (
            <>
              {normalizedRequest.description && (
                <p className="text-sm text-gray-600 mt-1">
                  {normalizedRequest.description}
                </p>
              )}
              <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                <span>Status: {normalizedRequest.status || 'Unknown'}</span>
                {normalizedRequest.priority && <span>Priority: {normalizedRequest.priority}</span>}
                {normalizedRequest.createdAt && (
                  <span>Created: {normalizedRequest.createdAt.toDate().toLocaleDateString()}</span>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default RequestStatusTracker; 