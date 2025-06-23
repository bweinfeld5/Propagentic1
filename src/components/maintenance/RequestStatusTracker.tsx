import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  doc, 
  onSnapshot, 
  collection, 
  query, 
  where, 
  orderBy, 
  Timestamp,
  Unsubscribe 
} from 'firebase/firestore';
import { db } from '../../firebase/config';
import { useAuth } from '../../context/AuthContext';
import { 
  MaintenanceRequest, 
  MaintenanceStatus, 
  MaintenancePriority,
  UserRole,
  StatusChange 
} from '../../types/maintenance';
import { maintenanceRequestConverter } from '../../models/converters';
import StatusPill from '../ui/StatusPill';
import ActionFeedback from '../ui/ActionFeedback';
import {
  ClockIcon,
  UserIcon,
  WrenchScrewdriverIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  BellIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline';
import { CheckCircleIcon as CheckCircleSolid } from '@heroicons/react/24/solid';

interface RequestStatusTrackerProps {
  requestId?: string;
  request?: MaintenanceRequest;
  showNotifications?: boolean;
  showTimeline?: boolean;
  showProgress?: boolean;
  compact?: boolean;
  className?: string;
  onStatusChange?: (status: MaintenanceStatus, request: MaintenanceRequest) => void;
  onError?: (error: Error) => void;
}

interface NotificationState {
  isOpen: boolean;
  type: 'success' | 'error' | 'info' | 'loading' | 'progress';
  title: string;
  message: string;
  progress?: number;
}

const RequestStatusTracker: React.FC<RequestStatusTrackerProps> = ({
  requestId,
  request: initialRequest,
  showNotifications = true,
  showTimeline = true,
  showProgress = true,
  compact = false,
  className = '',
  onStatusChange,
  onError
}) => {
  // State management
  const [request, setRequest] = useState<MaintenanceRequest | null>(initialRequest || null);
  const [loading, setLoading] = useState(!initialRequest);
  const [error, setError] = useState<string | null>(null);
  const [notification, setNotification] = useState<NotificationState>({
    isOpen: false,
    type: 'info',
    title: '',
    message: ''
  });
  const [lastStatusUpdate, setLastStatusUpdate] = useState<Date | null>(null);
  const [isRealtimeConnected, setIsRealtimeConnected] = useState(true);

  // Refs for cleanup
  const unsubscribeRef = useRef<Unsubscribe | null>(null);
  const statusChangeUnsubscribeRef = useRef<Unsubscribe | null>(null);
  const previousStatusRef = useRef<MaintenanceStatus | null>(null);

  // Auth context
  const { userProfile, isLandlord, isTenant, isContractor } = useAuth();

  // Get user role for role-based display
  const getUserRole = useCallback((): UserRole => {
    if (isLandlord()) return 'landlord';
    if (isTenant()) return 'tenant';
    if (isContractor()) return 'contractor';
    return 'tenant'; // Default fallback
  }, [isLandlord, isTenant, isContractor]);

  // Status color mapping
  const getStatusColor = useCallback((status: MaintenanceStatus, priority: MaintenancePriority): string => {
    // Emergency always shows red regardless of status
    if (priority === 'urgent') {
      return 'text-red-600 bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800 dark:text-red-400';
    }

    switch (status) {
      case 'submitted':
        return 'text-blue-600 bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-800 dark:text-blue-400';
      case 'assigned':
        return 'text-amber-600 bg-amber-50 border-amber-200 dark:bg-amber-900/20 dark:border-amber-800 dark:text-amber-400';
      case 'in-progress':
        return 'text-orange-600 bg-orange-50 border-orange-200 dark:bg-orange-900/20 dark:border-orange-800 dark:text-orange-400';
      case 'completed':
        return 'text-green-600 bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800 dark:text-green-400';
      case 'cancelled':
        return 'text-gray-600 bg-gray-50 border-gray-200 dark:bg-gray-900/20 dark:border-gray-800 dark:text-gray-400';
      case 'scheduled':
        return 'text-purple-600 bg-purple-50 border-purple-200 dark:bg-purple-900/20 dark:border-purple-800 dark:text-purple-400';
      case 'on_hold':
        return 'text-yellow-600 bg-yellow-50 border-yellow-200 dark:bg-yellow-900/20 dark:border-yellow-800 dark:text-yellow-400';
      case 'requires_parts':
        return 'text-indigo-600 bg-indigo-50 border-indigo-200 dark:bg-indigo-900/20 dark:border-indigo-800 dark:text-indigo-400';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200 dark:bg-gray-900/20 dark:border-gray-800 dark:text-gray-400';
    }
  }, []);

  // Progress calculation
  const calculateProgress = useCallback((status: MaintenanceStatus): number => {
    const progressMap: Record<MaintenanceStatus, number> = {
      'submitted': 10,
      'assigned': 30,
      'scheduled': 40,
      'in-progress': 70,
      'requires_parts': 60,
      'on_hold': 50,
      'pending_approval': 80,
      'completed': 100,
      'cancelled': 0
    };
    return progressMap[status] || 0;
  }, []);

  // Show notification
  const showNotification = useCallback((
    type: NotificationState['type'],
    title: string,
    message: string,
    progress?: number
  ) => {
    if (!showNotifications) return;
    
    setNotification({
      isOpen: true,
      type,
      title,
      message,
      progress
    });
  }, [showNotifications]);

  // Handle status change
  const handleStatusChange = useCallback((newRequest: MaintenanceRequest) => {
    const oldStatus = previousStatusRef.current;
    const newStatus = newRequest.status;

    if (oldStatus && oldStatus !== newStatus) {
      setLastStatusUpdate(new Date());
      
      // Show notification for status change
      const userRole = getUserRole();
      let notificationTitle = '';
      let notificationMessage = '';

      switch (newStatus) {
        case 'assigned':
          notificationTitle = 'Request Assigned';
          notificationMessage = userRole === 'tenant' 
            ? 'A contractor has been assigned to your request'
            : `Request assigned to ${newRequest.contractorName || 'contractor'}`;
          showNotification('success', notificationTitle, notificationMessage);
          break;
        case 'in-progress':
          notificationTitle = 'Work Started';
          notificationMessage = userRole === 'tenant'
            ? 'Work has begun on your maintenance request'
            : 'Contractor has started working on the request';
          showNotification('info', notificationTitle, notificationMessage);
          break;
        case 'completed':
          notificationTitle = 'Request Completed';
          notificationMessage = userRole === 'tenant'
            ? 'Your maintenance request has been completed'
            : 'Request has been marked as completed';
          showNotification('success', notificationTitle, notificationMessage);
          break;
        case 'on_hold':
          notificationTitle = 'Request On Hold';
          notificationMessage = 'The request has been temporarily paused';
          showNotification('info', notificationTitle, notificationMessage);
          break;
        case 'cancelled':
          notificationTitle = 'Request Cancelled';
          notificationMessage = 'The maintenance request has been cancelled';
          showNotification('error', notificationTitle, notificationMessage);
          break;
      }

      // Call external callback
      onStatusChange?.(newStatus, newRequest);
    }

    previousStatusRef.current = newStatus;
    setRequest(newRequest);
  }, [getUserRole, showNotification, onStatusChange]);

  // Set up real-time listener for maintenance request
  const setupRequestListener = useCallback(() => {
    if (!requestId) return;

    setLoading(true);
    setError(null);

    const requestRef = doc(db, 'maintenanceRequests', requestId).withConverter(maintenanceRequestConverter);

    const unsubscribe = onSnapshot(
      requestRef,
      (snapshot) => {
        setIsRealtimeConnected(true);
        
        if (snapshot.exists()) {
          const requestData = snapshot.data();
          handleStatusChange(requestData);
          setLoading(false);
        } else {
          setError('Request not found');
          setLoading(false);
        }
      },
      (err) => {
        console.error('Error in request listener:', err);
        setIsRealtimeConnected(false);
        setError('Failed to load request status');
        setLoading(false);
        onError?.(err instanceof Error ? err : new Error(String(err)));
      }
    );

    unsubscribeRef.current = unsubscribe;
  }, [requestId, handleStatusChange, onError]);

  // Set up status history listener for timeline
  const setupStatusHistoryListener = useCallback(() => {
    if (!requestId || !showTimeline) return;

    const statusHistoryRef = collection(db, 'maintenanceRequests', requestId, 'statusHistory');
    const statusHistoryQuery = query(statusHistoryRef, orderBy('timestamp', 'desc'));

    const unsubscribe = onSnapshot(
      statusHistoryQuery,
      (snapshot) => {
        // Status history updates are handled within the main request document
        // This listener ensures we get real-time updates for the timeline
        console.log('Status history updated');
      },
      (err) => {
        console.error('Error in status history listener:', err);
      }
    );

    statusChangeUnsubscribeRef.current = unsubscribe;
  }, [requestId, showTimeline]);

  // Setup listeners on mount
  useEffect(() => {
    if (initialRequest) {
      previousStatusRef.current = initialRequest.status;
      setRequest(initialRequest);
      setLoading(false);
    }

    if (requestId) {
      setupRequestListener();
      setupStatusHistoryListener();
    }

    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
      }
      if (statusChangeUnsubscribeRef.current) {
        statusChangeUnsubscribeRef.current();
      }
    };
  }, [requestId, initialRequest, setupRequestListener, setupStatusHistoryListener]);

  // Get status icon
  const getStatusIcon = useCallback((status: MaintenanceStatus) => {
    const iconClass = "w-5 h-5";
    
    switch (status) {
      case 'submitted':
        return <InformationCircleIcon className={iconClass} />;
      case 'assigned':
        return <UserIcon className={iconClass} />;
      case 'in-progress':
        return <WrenchScrewdriverIcon className={iconClass} />;
      case 'completed':
        return <CheckCircleSolid className={iconClass} />;
      case 'cancelled':
        return <ExclamationTriangleIcon className={iconClass} />;
      case 'scheduled':
        return <ClockIcon className={iconClass} />;
      default:
        return <InformationCircleIcon className={iconClass} />;
    }
  }, []);

  // Format status for display
  const formatStatus = useCallback((status: MaintenanceStatus): string => {
    return status.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  }, []);

  // Get role-specific information
  const getRoleSpecificInfo = useCallback((): React.ReactNode => {
    if (!request) return null;
    
    const userRole = getUserRole();

    switch (userRole) {
      case 'tenant':
        return (
          <div className="text-sm text-gray-600 dark:text-gray-400">
            {request.contractorName && (
              <p>Assigned to: {request.contractorName}</p>
            )}
            {request.scheduledDate && (
              <p>Scheduled: {request.scheduledDate.toDate().toLocaleDateString()}</p>
            )}
          </div>
        );
      
      case 'contractor':
        return (
          <div className="text-sm text-gray-600 dark:text-gray-400">
            <p>Property: {request.propertyName}</p>
            <p>Unit: {request.unitNumber || 'N/A'}</p>
            <p>Tenant: {request.tenantName}</p>
            {request.estimatedCost && (
              <p>Est. Cost: ${request.estimatedCost}</p>
            )}
          </div>
        );
      
      case 'landlord':
        return (
          <div className="text-sm text-gray-600 dark:text-gray-400">
            <p>Property: {request.propertyName}</p>
            <p>Tenant: {request.tenantName}</p>
            {request.contractorName && (
              <p>Contractor: {request.contractorName}</p>
            )}
            {request.estimatedCost && (
              <p>Est. Cost: ${request.estimatedCost}</p>
            )}
            {request.actualCost && (
              <p>Actual Cost: ${request.actualCost}</p>
            )}
          </div>
        );
      
      default:
        return null;
    }
  }, [request, getUserRole]);

  // Render loading state
  if (loading) {
    return (
      <div className={`p-4 bg-white dark:bg-gray-800 rounded-lg shadow ${className}`}>
        <div className="animate-pulse">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
            <div className="flex-1">
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-2"></div>
              <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Render error state
  if (error || !request) {
    return (
      <div className={`p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg ${className}`}>
        <div className="flex items-center space-x-2 text-red-600 dark:text-red-400">
          <ExclamationTriangleIcon className="w-5 h-5" />
          <span className="text-sm font-medium">{error || 'Request not found'}</span>
        </div>
      </div>
    );
  }

  const progress = calculateProgress(request.status);
  const statusColor = getStatusColor(request.status, request.priority);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`bg-white dark:bg-gray-800 rounded-lg shadow border ${statusColor} ${className}`}
    >
      {/* Connection status indicator */}
      {!isRealtimeConnected && (
        <div className="px-4 py-2 bg-yellow-50 dark:bg-yellow-900/20 border-b border-yellow-200 dark:border-yellow-800">
          <div className="flex items-center space-x-2 text-yellow-600 dark:text-yellow-400">
            <ArrowPathIcon className="w-4 h-4 animate-spin" />
            <span className="text-xs">Reconnecting...</span>
          </div>
        </div>
      )}

      <div className="p-4">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className={`p-2 rounded-full ${statusColor}`}>
              {getStatusIcon(request.status)}
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                {request.title}
              </h3>
              <div className="flex items-center space-x-2 mt-1">
                <StatusPill status={formatStatus(request.status)} className="" />
                {request.priority === 'urgent' && (
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400">
                    <ExclamationTriangleIcon className="w-3 h-3 mr-1" />
                    Urgent
                  </span>
                )}
                {lastStatusUpdate && (
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    Updated {lastStatusUpdate.toLocaleTimeString()}
                  </span>
                )}
              </div>
            </div>
          </div>
          
          {/* Real-time indicator */}
          <div className="flex items-center space-x-2">
            {isRealtimeConnected && (
              <div className="flex items-center space-x-1 text-green-600 dark:text-green-400">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-xs">Live</span>
              </div>
            )}
          </div>
        </div>

        {/* Progress bar */}
        {showProgress && (
          <div className="mb-4">
            <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400 mb-1">
              <span>Progress</span>
              <span>{progress}%</span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <motion.div
                className={`h-2 rounded-full ${
                  request.status === 'completed' 
                    ? 'bg-green-500' 
                    : request.priority === 'urgent'
                    ? 'bg-red-500'
                    : 'bg-blue-500'
                }`}
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.5, ease: 'easeOut' }}
              />
            </div>
          </div>
        )}

        {/* Role-specific information */}
        {getRoleSpecificInfo()}

        {/* Timeline (if enabled and not compact) */}
        {showTimeline && !compact && request.statusHistory && request.statusHistory.length > 0 && (
          <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
            <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-3">Status History</h4>
            <div className="space-y-2">
              {request.statusHistory.slice(0, 3).map((statusChange, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="flex items-center space-x-3 text-sm"
                >
                  <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                  <span className="text-gray-600 dark:text-gray-400">
                    {formatStatus(statusChange.status)}
                  </span>
                  <span className="text-gray-500 dark:text-gray-500 text-xs">
                    {statusChange.timestamp.toDate().toLocaleString()}
                  </span>
                </motion.div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Notification system */}
      <ActionFeedback
        isOpen={notification.isOpen}
        type={notification.type}
        title={notification.title}
        message={notification.message}
        progress={notification.progress}
        onClose={() => setNotification(prev => ({ ...prev, isOpen: false }))}
        onUndo={undefined}
        onRetry={undefined}
        position="bottom"
      />
    </motion.div>
  );
};

export default RequestStatusTracker; 