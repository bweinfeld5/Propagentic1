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
  StatusChange,
  UserRole
} from '../../models';
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

  // Progress calculation
  const calculateProgress = useCallback((status: MaintenanceStatus): number => {
    const progressMap: Record<MaintenanceStatus, number> = {
      'submitted': 10,
      'pending': 20,
      'assigned': 30,
      'scheduled': 40,
      'in-progress': 70,
      'requires_parts': 60,
      'on-hold': 50,
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
        case 'on-hold':
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

    // This part is for listening to a subcollection for status changes, if you have one.
    // If status history is an array on the main request, this is not needed.
    // Assuming statusHistory is an array on MaintenanceRequest for this example.
  }, [requestId, showTimeline]);

  // Effects
  useEffect(() => {
    if (requestId) {
      setupRequestListener();
    } else if (initialRequest) {
      setRequest(initialRequest);
      setLoading(false);
    }

    return () => {
      unsubscribeRef.current?.();
      statusChangeUnsubscribeRef.current?.();
    };
  }, [requestId, initialRequest, setupRequestListener]);


  // Helper function to format date
  const formatDate = (date: Date | Timestamp | undefined): string => {
    if (!date) return 'N/A';
    const d = date instanceof Timestamp ? date.toDate() : date;
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    }).format(d);
  };

  // UI Components
  const ProgressBar = () => {
    if (!showProgress || !request) return null;
    const progress = calculateProgress(request.status);

    return (
      <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700 my-4">
        <motion.div
          className="bg-blue-600 h-2.5 rounded-full"
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.5, ease: 'easeInOut' }}
        />
      </div>
    );
  };
  
  const TimelineEvent = ({ statusChange, isLast }: { statusChange: StatusChange, isLast: boolean }) => (
    <li className={`relative flex items-baseline gap-6 pb-5 ${isLast ? '' : 'before:absolute before:left-[5.5px] before:top-[1.2rem] before:h-full before:w-[1px] before:bg-gray-300 dark:before:bg-gray-600'}`}>
      <div className="relative z-10">
        <div className="h-3 w-3 rounded-full bg-blue-500 ring-4 ring-white dark:ring-gray-900"></div>
      </div>
      <div className="flex-grow">
        <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">{statusChange.status}</p>
        <p className="text-xs text-gray-500 dark:text-gray-400">
          by {statusChange.updatedBy} on {formatDate(statusChange.timestamp)}
        </p>
        {statusChange.notes && (
          <p className="mt-1 text-xs text-gray-600 dark:text-gray-300 italic">"{statusChange.notes}"</p>
        )}
      </div>
    </li>
  );

  const Timeline = () => {
    if (!showTimeline || !request || !request.statusHistory || request.statusHistory.length === 0) return null;
    
    // Create a mutable copy and sort it
    const sortedHistory = [...request.statusHistory].sort((a, b) => {
        const dateA = a.timestamp instanceof Date ? a.timestamp.getTime() : new Date(a.timestamp).getTime();
        const dateB = b.timestamp instanceof Date ? b.timestamp.getTime() : new Date(b.timestamp).getTime();
        return dateB - dateA; // Sort descending
    });

    return (
      <div className="mt-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Request History</h3>
        <ul>
          {sortedHistory.map((change, index) => (
            <TimelineEvent key={index} statusChange={change} isLast={index === sortedHistory.length - 1} />
          ))}
        </ul>
      </div>
    );
  };

  if (loading) return (
    <div className={`p-4 rounded-lg bg-white dark:bg-gray-800 shadow-md ${className}`}>
      <div className="flex items-center justify-center">
        <ArrowPathIcon className="h-6 w-6 animate-spin text-blue-500" />
        <span className="ml-2 text-gray-600 dark:text-gray-300">Loading status...</span>
      </div>
    </div>
  );
  if (error) return (
    <div className={`p-4 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 ${className}`}>
      <div className="flex items-center text-red-600 dark:text-red-400">
        <ExclamationTriangleIcon className="h-6 w-6" />
        <span className="ml-2 font-semibold">{error}</span>
      </div>
      { !isRealtimeConnected && (
        <button onClick={setupRequestListener} className="mt-2 text-sm text-blue-600 dark:text-blue-400 hover:underline">
          Attempt to reconnect
        </button>
      )}
    </div>
  );
  if (!request) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0 }}
        className={`p-4 rounded-lg bg-white dark:bg-gray-800 shadow-md ${className}`}
      >
        {/* Header */}
        <div className="flex justify-between items-start">
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">{request.title}</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">#{request.id.slice(0, 6)}</p>
          </div>
          <StatusPill 
            status={request.status} 
          />
        </div>

        {/* Progress Bar */}
        <ProgressBar />

        {/* Core Details */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4 text-sm">
          <div className="flex items-center text-gray-600 dark:text-gray-300">
            <InformationCircleIcon className="h-5 w-5 mr-2 text-gray-400" />
            <span>Category: <span className="font-semibold">{request.category}</span></span>
          </div>
          <div className="flex items-center text-gray-600 dark:text-gray-300">
            <ExclamationTriangleIcon className="h-5 w-5 mr-2 text-gray-400" />
            <span>Priority: <span className="font-semibold">{request.priority}</span></span>
          </div>
          <div className="flex items-center text-gray-600 dark:text-gray-300">
            <UserIcon className="h-5 w-5 mr-2 text-gray-400" />
            <span>Submitted by: <span className="font-semibold">{request.tenantName}</span></span>
          </div>
          {request.contractorName && (
            <div className="flex items-center text-gray-600 dark:text-gray-300">
              <WrenchScrewdriverIcon className="h-5 w-5 mr-2 text-gray-400" />
              <span>Assigned to: <span className="font-semibold">{request.contractorName}</span></span>
            </div>
          )}
          <div className="flex items-center text-gray-600 dark:text-gray-300">
            <ClockIcon className="h-5 w-5 mr-2 text-gray-400" />
            <span>Last Updated: <span className="font-semibold">{formatDate(lastStatusUpdate || request.updatedAt)}</span></span>
          </div>
        </div>
        
        {/* Timeline */}
        <Timeline />

        {/* Action Feedback Notification */}
        <AnimatePresence>
          {notification.isOpen && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <ActionFeedback
                isOpen={notification.isOpen}
                type={notification.type}
                title={notification.title}
                message={notification.message}
                progress={notification.progress}
                onUndo={() => {}}
                onRetry={() => {}}
                onClose={() => setNotification(prev => ({ ...prev, isOpen: false }))}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </AnimatePresence>
  );
};

export default RequestStatusTracker; 