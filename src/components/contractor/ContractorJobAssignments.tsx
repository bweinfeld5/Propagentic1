import React, { useState, useEffect } from 'react';
import { 
  ClipboardDocumentListIcon,
  MapPinIcon,
  ClockIcon,
  CurrencyDollarIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  XCircleIcon,
  InformationCircleIcon,
  PlayIcon,
  PauseIcon,
  StopIcon,
  ArrowRightIcon
} from '@heroicons/react/24/outline';
import { useAuth } from '../../context/AuthContext';
import { maintenanceService } from '../../services/firestore/maintenanceService';
import { MaintenanceRequest } from '../../models/MaintenanceRequest';
import { httpsCallable } from 'firebase/functions';
import { functions } from '../../firebase/config';

interface ContractorJobAssignmentsProps {
  className?: string;
}

const ContractorJobAssignments: React.FC<ContractorJobAssignmentsProps> = ({ className = '' }) => {
  const { currentUser, userProfile } = useAuth();
  const [assignedJobs, setAssignedJobs] = useState<MaintenanceRequest[]>([]);
  const [availableJobs, setAvailableJobs] = useState<MaintenanceRequest[]>([]);
  const [jobsByStatus, setJobsByStatus] = useState<{
    pending: MaintenanceRequest[];
    ongoing: MaintenanceRequest[];
    finished: MaintenanceRequest[];
  }>({
    pending: [],
    ongoing: [],
    finished: []
  });
  const [loading, setLoading] = useState(true);
  const [processingJobs, setProcessingJobs] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);
  const [expandedJob, setExpandedJob] = useState<string | null>(null);
  const [activeStatusTab, setActiveStatusTab] = useState<'pending' | 'ongoing' | 'finished'>('pending');

  // Cloud function for updating job status
  const updateContractorJobStatus = httpsCallable(functions, 'updateContractorJobStatus');

  useEffect(() => {
    if (!currentUser?.uid) {
      setLoading(false);
      return;
    }

    // Safety check for maintenanceService
    if (!maintenanceService || typeof maintenanceService.subscribeToContractorJobs !== 'function') {
      console.error('Maintenance service not available');
      setError('Service temporarily unavailable. Please refresh the page.');
      setLoading(false);
      return;
    }

    const contractorId = currentUser.uid;
    console.log('🔍 ContractorJobAssignments - Current user UID:', contractorId);
    let unsubscribe: (() => void) | null = null;

    try {
      // Subscribe to contractor jobs by status using the new service method
      unsubscribe = maintenanceService.subscribeToContractorJobsByStatus(
        contractorId,
        (jobsByStatus, available) => {
          try {
            console.log('🔍 ContractorJobAssignments - Received categorized data:', {
              contractorId,
              pending: jobsByStatus.pending?.length || 0,
              ongoing: jobsByStatus.ongoing?.length || 0,
              finished: jobsByStatus.finished?.length || 0,
              availableJobs: available?.length || 0,
              jobsByStatus,
              available: available?.map(j => ({ id: j.id, status: j.status, contractorId: j.contractorId }))
            });
            
            // Set the jobs categorized by status directly from service
            setJobsByStatus(jobsByStatus);
            
            // Set legacy assigned jobs for backward compatibility
            const allAssignedJobs = [...(jobsByStatus.pending || []), ...(jobsByStatus.ongoing || []), ...(jobsByStatus.finished || [])];
            setAssignedJobs(allAssignedJobs);
            setAvailableJobs(available || []);
            
            setLoading(false);
            setError(null);
          } catch (error) {
            console.error('Error processing job data:', error);
            setError('Failed to process job data. Please try again.');
            setLoading(false);
          }
        },
        (error) => {
          console.error('Error loading contractor jobs:', error);
          setError('Failed to load job assignments. Please try again.');
          setLoading(false);
        }
      );
    } catch (error) {
      console.error('Error setting up job subscription:', error);
      setError('Failed to initialize job assignments. Please try again.');
      setLoading(false);
    }

    return () => {
      try {
        if (unsubscribe) {
          unsubscribe();
        }
      } catch (error) {
        console.error('Error during cleanup:', error);
      }
    };
  }, [currentUser?.uid]);

  const handleJobStatusTransition = async (
    requestId: string, 
    fromStatus: 'pending' | 'ongoing' | 'finished',
    toStatus: 'pending' | 'ongoing' | 'finished'
  ) => {
    if (!currentUser?.uid || processingJobs.has(requestId)) return;

    setProcessingJobs(prev => new Set([...prev, requestId]));
    try {
      await updateContractorJobStatus({
        requestId,
        fromStatus,
        toStatus,
        contractorId: currentUser.uid
      });
      
      console.log(`Successfully moved job ${requestId} from ${fromStatus} to ${toStatus}`);
      // The real-time listener will update the UI automatically
    } catch (error) {
      console.error('Error updating job status:', error);
      setError(`Failed to update job status. Please try again.`);
    } finally {
      setProcessingJobs(prev => {
        const newSet = new Set(prev);
        newSet.delete(requestId);
        return newSet;
      });
    }
  };

  const handleAcceptJob = async (requestId: string) => {
    if (!currentUser?.uid || processingJobs.has(requestId)) return;

    // Safety checks
    if (!requestId || typeof requestId !== 'string') {
      setError('Invalid job request. Please try again.');
      return;
    }

    if (!maintenanceService || typeof maintenanceService.acceptJob !== 'function') {
      setError('Service temporarily unavailable. Please refresh the page.');
      return;
    }

    setProcessingJobs(prev => new Set([...prev, requestId]));
    try {
      await maintenanceService.acceptJob(requestId, currentUser.uid);
      // The real-time listener will update the UI automatically
    } catch (error) {
      console.error('Error accepting job:', error);
      setError('Failed to accept job. Please try again.');
    } finally {
      setProcessingJobs(prev => {
        const newSet = new Set(prev);
        newSet.delete(requestId);
        return newSet;
      });
    }
  };

  const handleAcceptAvailableJob = async (requestId: string) => {
    if (!currentUser?.uid || processingJobs.has(requestId)) return;

    // Safety checks
    if (!requestId || typeof requestId !== 'string') {
      setError('Invalid job request. Please try again.');
      return;
    }

    setProcessingJobs(prev => new Set([...prev, requestId]));
    try {
      // Use the Cloud Function to properly assign the contractor and update contractorProfile
      const assignContractorFunction = httpsCallable(functions, 'assignContractorToRequest');
      
      await assignContractorFunction({ 
        requestId, 
        contractorId: currentUser.uid 
      });
      
      console.log(`Contractor ${currentUser.uid} accepted available job ${requestId}`);
      // The real-time listener will update the UI automatically
    } catch (error) {
      console.error('Error accepting available job:', error);
      setError('Failed to accept job. Please try again.');
    } finally {
      setProcessingJobs(prev => {
        const newSet = new Set(prev);
        newSet.delete(requestId);
        return newSet;
      });
    }
  };

  const handleDeclineJob = async (requestId: string, reason: string) => {
    if (!currentUser?.uid || processingJobs.has(requestId)) return;

    // Safety checks
    if (!requestId || typeof requestId !== 'string') {
      setError('Invalid job request. Please try again.');
      return;
    }

    if (!maintenanceService || typeof maintenanceService.declineJob !== 'function') {
      setError('Service temporarily unavailable. Please refresh the page.');
      return;
    }

    setProcessingJobs(prev => new Set([...prev, requestId]));
    try {
      await maintenanceService.declineJob(requestId, currentUser.uid, reason || 'Not available at this time');
      // The real-time listener will update the UI automatically
    } catch (error) {
      console.error('Error declining job:', error);
      setError('Failed to decline job. Please try again.');
    } finally {
      setProcessingJobs(prev => {
        const newSet = new Set(prev);
        newSet.delete(requestId);
        return newSet;
      });
    }
  };

  const getPriorityColor = (priority: string | undefined) => {
    if (!priority || typeof priority !== 'string') {
      return 'text-gray-600 bg-gray-100';
    }
    
    switch (priority.toLowerCase()) {
      case 'urgent': return 'text-red-600 bg-red-100';
      case 'high': return 'text-orange-600 bg-orange-100';
      case 'medium': return 'text-yellow-600 bg-yellow-100';
      case 'low': return 'text-green-600 bg-green-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusColor = (status: string | undefined) => {
    if (!status || typeof status !== 'string') {
      return 'text-gray-600 bg-gray-100';
    }
    
    switch (status.toLowerCase()) {
      case 'assigned': return 'text-blue-600 bg-blue-100';
      case 'in-progress': return 'text-purple-600 bg-purple-100';
      case 'scheduled': return 'text-indigo-600 bg-indigo-100';
      case 'pending': return 'text-orange-600 bg-orange-100';
      case 'completed': return 'text-green-600 bg-green-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const formatDate = (date: any) => {
    if (!date) return 'Date unavailable';
    
    try {
      // Handle Firebase Timestamp objects
      const dateObj = date.toDate ? date.toDate() : new Date(date);
      if (isNaN(dateObj.getTime())) {
        console.warn('Invalid date object:', date);
        return 'Invalid Date';
      }
      
      const formattedDate = dateObj.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
      
      // Debug log for timestamp verification
      if (date && typeof date === 'object') {
        console.log('🕐 Date formatting:', {
          original: date,
          isTimestamp: !!date.toDate,
          converted: dateObj,
          formatted: formattedDate
        });
      }
      
      return formattedDate;
    } catch (error) {
      console.warn('Error formatting date:', error, date);
      return 'Date formatting error';
    }
  };

  // Status tabs configuration
  const statusTabs = [
    { 
      id: 'pending' as const, 
      label: 'Pending', 
      count: jobsByStatus.pending.length,
      color: 'text-orange-600 bg-orange-100',
      icon: ClockIcon
    },
    { 
      id: 'ongoing' as const, 
      label: 'Ongoing', 
      count: jobsByStatus.ongoing.length,
      color: 'text-purple-600 bg-purple-100',
      icon: PlayIcon
    },
    { 
      id: 'finished' as const, 
      label: 'Finished', 
      count: jobsByStatus.finished.length,
      color: 'text-green-600 bg-green-100',
      icon: CheckCircleIcon
    }
  ];

  const JobCard: React.FC<{ 
    job: MaintenanceRequest; 
    showActions?: boolean; 
    currentStatus?: 'pending' | 'ongoing' | 'finished';
  }> = ({ job, showActions = false, currentStatus }) => {
    const isExpanded = expandedJob === job.id;
    const isProcessing = processingJobs.has(job.id);

    // Debug log to see raw job data structure
    console.log('🔍 JobCard - Raw job data:', {
      id: job.id,
      title: job.title,
      createdAt: job.createdAt,
      timestamp: (job as any).timestamp,
      updatedAt: job.updatedAt,
      allFields: Object.keys(job)
    });

    // Safe data access with defaults
    const safeJob = {
      id: job?.id || '',
      title: job?.title || job?.propertyAddress || job?.propertyName || job?.description || 'Maintenance Request',
      propertyName: job?.propertyName || 'Unknown Property',
      propertyAddress: job?.propertyAddress || '',
      unitNumber: job?.unitNumber || '',
      description: job?.description || 'No description available',
      priority: job?.priority || 'medium',
      status: job?.status || 'pending',
      category: job?.category || 'other',
      tenantName: job?.tenantName || 'Unknown Tenant',
      tenantEmail: job?.tenantEmail || '',
      tenantPhone: job?.tenantPhone || '',
      estimatedCost: job?.estimatedCost || 0,
      isEmergency: job?.isEmergency || false,
      createdAt: job?.createdAt || (job as any)?.timestamp || null,
      specificLocation: job?.specificLocation || '',
      accessInstructions: job?.accessInstructions || '',
      emergencyContact: job?.emergencyContact || null
    };

    return (
      <div className="bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow">
        <div className="p-4">
          {/* Header */}
          <div className="flex items-start justify-between mb-3">
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-gray-900 mb-1">{safeJob.title}</h3>
              <div className="flex items-center text-sm text-gray-500 mb-2">
                <MapPinIcon className="w-4 h-4 mr-1" />
                <span>{safeJob.propertyAddress || safeJob.propertyName}</span>
                {safeJob.unitNumber && <span className="ml-2">• Unit {safeJob.unitNumber}</span>}
              </div>
            </div>
            <div className="flex flex-col items-end space-y-2">
              <span className={`px-2 py-1 text-xs font-medium rounded-full ${getPriorityColor(safeJob.priority)}`}>
                {safeJob.priority.toUpperCase()}
              </span>
              <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(safeJob.status)}`}>
                {safeJob.status.replace('-', ' ').toUpperCase()}
              </span>
              {safeJob.isEmergency && (
                <div className="flex items-center text-red-600">
                  <ExclamationTriangleIcon className="w-4 h-4 mr-1" />
                  <span className="text-xs font-medium">EMERGENCY</span>
                </div>
              )}
            </div>
          </div>

          {/* Description */}
          <p className="text-gray-700 mb-3">{safeJob.description}</p>

          {/* Quick Info */}
          <div className="flex items-center justify-between text-sm text-gray-500 mb-3">
            <div className="flex items-center">
              <ClockIcon className="w-4 h-4 mr-1" />
              <span>Created: {formatDate(safeJob.createdAt)}</span>
            </div>
            {safeJob.estimatedCost > 0 && (
              <div className="flex items-center">
                <CurrencyDollarIcon className="w-4 h-4 mr-1" />
                <span>Est. ${safeJob.estimatedCost}</span>
              </div>
            )}
          </div>

          {/* Expand/Collapse Button */}
          <button
            onClick={() => setExpandedJob(isExpanded ? null : safeJob.id)}
            className="flex items-center text-blue-600 hover:text-blue-800 text-sm font-medium mb-3"
          >
            <InformationCircleIcon className="w-4 h-4 mr-1" />
            {isExpanded ? 'Hide Details' : 'Show Details'}
          </button>

          {/* Expanded Details */}
          {isExpanded && (
            <div className="border-t border-gray-200 pt-3 mb-3 space-y-2">
              <div>
                <span className="font-medium text-gray-700">Category:</span>
                <span className="ml-2 text-gray-600">{safeJob.category}</span>
              </div>
              <div>
                <span className="font-medium text-gray-700">Tenant:</span>
                <span className="ml-2 text-gray-600">{safeJob.tenantName}</span>
              </div>
              <div>
                <span className="font-medium text-gray-700">Contact:</span>
                <span className="ml-2 text-gray-600">{safeJob.tenantEmail || 'No email provided'}</span>
                {safeJob.tenantPhone && <span className="ml-2 text-gray-600">• {safeJob.tenantPhone}</span>}
              </div>
              {safeJob.specificLocation && (
                <div>
                  <span className="font-medium text-gray-700">Location:</span>
                  <span className="ml-2 text-gray-600">{safeJob.specificLocation}</span>
                </div>
              )}
              {safeJob.accessInstructions && (
                <div>
                  <span className="font-medium text-gray-700">Access Instructions:</span>
                  <span className="ml-2 text-gray-600">{safeJob.accessInstructions}</span>
                </div>
              )}
              {safeJob.emergencyContact && (
                <div>
                  <span className="font-medium text-gray-700">Emergency Contact:</span>
                  <span className="ml-2 text-gray-600">
                    {safeJob.emergencyContact.name} ({safeJob.emergencyContact.phone})
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Status Transition Actions */}
          {currentStatus && (
            <div className="border-t border-gray-200 pt-3">
              <div className="flex flex-wrap gap-2">
                {/* Pending → Ongoing */}
                {currentStatus === 'pending' && (
                  <button
                    onClick={() => handleJobStatusTransition(safeJob.id, 'pending', 'ongoing')}
                    disabled={isProcessing}
                    className="flex items-center px-3 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm"
                  >
                    <PlayIcon className="w-4 h-4 mr-1" />
                    Start Work
                  </button>
                )}
                
                {/* Ongoing → Finished */}
                {currentStatus === 'ongoing' && (
                  <button
                    onClick={() => handleJobStatusTransition(safeJob.id, 'ongoing', 'finished')}
                    disabled={isProcessing}
                    className="flex items-center px-3 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm"
                  >
                    <CheckCircleIcon className="w-4 h-4 mr-1" />
                    Complete Job
                  </button>
                )}
                
                {/* Ongoing → Pending (pause) */}
                {currentStatus === 'ongoing' && (
                  <button
                    onClick={() => handleJobStatusTransition(safeJob.id, 'ongoing', 'pending')}
                    disabled={isProcessing}
                    className="flex items-center px-3 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm"
                  >
                    <PauseIcon className="w-4 h-4 mr-1" />
                    Pause
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Legacy Action Buttons */}
          {/* For assigned jobs - show Accept/Reject */}
          {showActions && safeJob.status === 'assigned' && (
            <div className="flex space-x-3">
              <button
                onClick={() => handleAcceptJob(safeJob.id)}
                disabled={isProcessing}
                className="flex-1 flex items-center justify-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <CheckCircleIcon className="w-4 h-4 mr-2" />
                {isProcessing ? 'Processing...' : 'Accept Job'}
              </button>
              <button
                onClick={() => handleDeclineJob(safeJob.id, 'Not available at this time')}
                disabled={isProcessing}
                className="flex-1 flex items-center justify-center px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <XCircleIcon className="w-4 h-4 mr-2" />
                {isProcessing ? 'Processing...' : 'Decline Job'}
              </button>
            </div>
          )}
          
          {/* For available jobs - show Accept button */}
          {!showActions && safeJob.status === 'pending' && (
            <div className="flex space-x-3">
              <button
                onClick={() => handleAcceptAvailableJob(safeJob.id)}
                disabled={isProcessing}
                className="flex-1 flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <CheckCircleIcon className="w-4 h-4 mr-2" />
                {isProcessing ? 'Processing...' : 'Accept Available Job'}
              </button>
            </div>
          )}
          
          {/* For in-progress jobs - show status only */}
          {showActions && safeJob.status === 'in-progress' && (
            <div className="bg-purple-50 border border-purple-200 rounded-md p-3">
              <div className="flex items-center text-purple-700">
                <ClockIcon className="w-4 h-4 mr-2" />
                <span className="text-sm font-medium">Job in progress</span>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className={`${className} bg-white rounded-lg shadow-sm border border-gray-200 p-6`}>
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500 mx-auto"></div>
          <p className="text-gray-500 mt-2">Loading job assignments...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`${className} bg-white rounded-lg shadow-sm border border-gray-200 p-6`}>
        <div className="text-center py-8">
          <ExclamationTriangleIcon className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <p className="text-red-600 font-medium">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-2 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`${className} space-y-6`}>
      {/* Job Status Management Section */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900 flex items-center">
            <ClipboardDocumentListIcon className="w-6 h-6 mr-2 text-orange-500" />
            Job Status Management
          </h2>
        </div>

        {/* Status Tabs */}
        <div className="border-b border-gray-200 mb-6">
          <nav className="flex space-x-8">
            {statusTabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveStatusTab(tab.id)}
                className={`flex items-center px-1 py-4 text-sm font-medium border-b-2 transition-colors ${
                  activeStatusTab === tab.id
                    ? 'border-orange-500 text-orange-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <tab.icon className="w-5 h-5 mr-2" />
                {tab.label}
                <span className={`ml-2 px-2 py-1 text-xs font-medium rounded-full ${
                  activeStatusTab === tab.id ? tab.color : 'text-gray-500 bg-gray-100'
                }`}>
                  {tab.count}
                </span>
              </button>
            ))}
          </nav>
        </div>

        {/* Job Cards by Status */}
        <div className="space-y-4">
          {jobsByStatus[activeStatusTab].length === 0 ? (
            <div className="text-center py-8">
              {activeStatusTab === 'pending' && <ClockIcon className="w-12 h-12 text-gray-300 mx-auto mb-4" />}
              {activeStatusTab === 'ongoing' && <PlayIcon className="w-12 h-12 text-gray-300 mx-auto mb-4" />}
              {activeStatusTab === 'finished' && <CheckCircleIcon className="w-12 h-12 text-gray-300 mx-auto mb-4" />}
              <p className="text-gray-500">No {activeStatusTab} jobs</p>
              <p className="text-sm text-gray-400 mt-2">
                {activeStatusTab === 'pending' && 'Jobs assigned to you will appear here'}
                {activeStatusTab === 'ongoing' && 'Jobs you start will appear here'}
                {activeStatusTab === 'finished' && 'Completed jobs will appear here'}
              </p>
            </div>
          ) : (
            jobsByStatus[activeStatusTab]
              .filter(job => job && job.id)
              .map(job => (
                <JobCard 
                  key={job.id} 
                  job={job} 
                  currentStatus={activeStatusTab}
                />
              ))
          )}
        </div>
      </div>

      {/* Available Jobs Section */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900 flex items-center">
            <ClipboardDocumentListIcon className="w-6 h-6 mr-2 text-blue-500" />
            Available Jobs ({Array.isArray(availableJobs) ? availableJobs.filter(Boolean).length : 0})
          </h2>
        </div>
        
        {!Array.isArray(availableJobs) || availableJobs.filter(Boolean).length === 0 ? (
          <div className="text-center py-8">
            <ClipboardDocumentListIcon className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">No available jobs at the moment</p>
            <p className="text-sm text-gray-400 mt-2">New job opportunities will appear here</p>
          </div>
        ) : (
          <div className="space-y-4">
            {availableJobs
              .filter(job => job && job.id) // Filter out null/undefined jobs
              .map(job => {
                try {
                  return <JobCard key={job.id} job={job} showActions={false} />;
                } catch (error) {
                  console.error('Error rendering available job card:', error, job);
                  return (
                    <div key={job?.id || Math.random()} className="p-4 bg-red-50 border border-red-200 rounded-lg">
                      <p className="text-red-600 text-sm">Error displaying job: {job?.title || 'Unknown'}</p>
                    </div>
                  );
                }
              })}
          </div>
        )}
      </div>
    </div>
  );
};

export default ContractorJobAssignments; 