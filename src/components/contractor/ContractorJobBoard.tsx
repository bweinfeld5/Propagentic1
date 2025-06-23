import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  BriefcaseIcon,
  ClockIcon,
  MapPinIcon,
  PhotoIcon,
  DocumentTextIcon,
  PlayIcon,
  PauseIcon,
  CheckCircleIcon,
  XCircleIcon,
  ArrowRightIcon,
  CalendarIcon,
  CurrencyDollarIcon,
  WrenchScrewdriverIcon,
  UserIcon,
  PhoneIcon,
  ChatBubbleLeftRightIcon,
  MapIcon,
  TruckIcon,
  PlusIcon,
  DocumentArrowUpIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import {
  CheckCircleIcon as CheckCircleSolid,
  ClockIcon as ClockSolid,
  ExclamationTriangleIcon as ExclamationTriangleSolid
} from '@heroicons/react/24/solid';

import { useAuth } from '../../context/AuthContext';
import { useActionFeedback } from '../../hooks/useActionFeedback';
import { maintenanceService } from '../../services/firestore/maintenanceService';
import { communicationService } from '../../services/firestore/communicationService';
import RequestStatusTracker from '../shared/RequestStatusTracker';
import Button from '../ui/Button';
import StatusPill from '../ui/StatusPill';
import LoadingSpinner from '../ui/LoadingSpinner';
import Modal from '../common/Modal';
import ErrorBoundary from '../error/ErrorBoundary';
import { MaintenanceRequest, MaintenanceStatus, MaintenancePriority } from '../../models/MaintenanceRequest';
import { CommunicationMessage } from '../../models/Communication';

interface TimeEntry {
  id: string;
  startTime: Date;
  endTime?: Date;
  description: string;
  breakTime?: number; // minutes
}

interface CostBreakdown {
  labor: number;
  materials: number;
  other: number;
  notes: string;
}

interface ContractorJobBoardProps {
  className?: string;
}

interface JobCard {
  id: string;
  title: string;
  description: string;
  priority: MaintenancePriority;
  category: string;
  address: string;
  estimatedDuration: number; // hours
  estimatedCost: number;
  photos: string[];
  contactInfo: {
    tenantName: string;
    tenantPhone: string;
    propertyManagerPhone: string;
  };
  createdAt: Date;
  isEmergency: boolean;
  distance?: number; // miles from contractor
}

const ContractorJobBoard: React.FC<ContractorJobBoardProps> = ({ className = '' }) => {
  const { user } = useAuth();
  const { showSuccess, showError, showInfo } = useActionFeedback();
  
  // Core state
  const [availableJobs, setAvailableJobs] = useState<MaintenanceRequest[]>([]);
  const [myJobs, setMyJobs] = useState<MaintenanceRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [acceptingJob, setAcceptingJob] = useState<string | null>(null);
  const [rejectingJob, setRejectingJob] = useState<string | null>(null);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [optimisticRemovedJobs, setOptimisticRemovedJobs] = useState<string[]>([]);
  
  // UI state
  const [selectedJob, setSelectedJob] = useState<MaintenanceRequest | null>(null);
  const [showJobDetails, setShowJobDetails] = useState(false);
  const [showTimeTracker, setShowTimeTracker] = useState(false);
  const [showCostEstimator, setShowCostEstimator] = useState(false);
  const [showPhotoUpload, setShowPhotoUpload] = useState(false);
  const [showMapView, setShowMapView] = useState(false);
  const [activeTab, setActiveTab] = useState<'available' | 'assigned' | 'completed'>('available');
  
  // Time tracking state
  const [activeTimer, setActiveTimer] = useState<string | null>(null);
  const [timeEntries, setTimeEntries] = useState<{ [jobId: string]: TimeEntry[] }>({});
  const [currentEntry, setCurrentEntry] = useState<TimeEntry | null>(null);
  const [timerStartTime, setTimerStartTime] = useState<Date | null>(null);
  const [elapsedTime, setElapsedTime] = useState(0);
  
  // Cost estimation state
  const [costBreakdown, setCostBreakdown] = useState<CostBreakdown>({
    labor: 0,
    materials: 0,
    other: 0,
    notes: ''
  });
  
  // Photo upload state
  const [uploadingPhotos, setUploadingPhotos] = useState(false);
  const [progressPhotos, setProgressPhotos] = useState<File[]>([]);
  const [photoDescription, setPhotoDescription] = useState('');
  const [photoCategory, setPhotoCategory] = useState<'before' | 'during' | 'after' | 'materials'>('during');
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Communication state
  const [messages, setMessages] = useState<CommunicationMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [sendingMessage, setSendingMessage] = useState(false);
  
  // Filter state
  const [filterPriority, setFilterPriority] = useState<MaintenancePriority | 'all'>('all');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'date' | 'priority' | 'distance' | 'cost'>('date');
  
  // Real-time listener cleanup
  const [unsubscribe, setUnsubscribe] = useState<(() => void) | null>(null);

  // Timer interval
  const timerInterval = useRef<NodeJS.Timeout | null>(null);

  // Initialize real-time listeners
  useEffect(() => {
    if (!user?.uid) return;

    const setupListeners = async () => {
      try {
        setLoading(true);
        
        // Set up real-time listener for contractor's jobs
        const unsubscribeFn = await maintenanceService.subscribeToContractorJobs(
          user.uid,
          (assignedJobs, availableJobs) => {
            setMyJobs(assignedJobs);
            setAvailableJobs(availableJobs);
          },
          (error) => {
            console.error('Error in contractor jobs listener:', error);
            showError('Failed to sync job listings');
          }
        );
        
        setUnsubscribe(() => unsubscribeFn);
        
      } catch (error) {
        console.error('Error setting up contractor job board:', error);
        showError('Failed to load job board');
      } finally {
        setLoading(false);
      }
    };

    setupListeners();

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
      if (timerInterval.current) {
        clearInterval(timerInterval.current);
      }
    };
  }, [user?.uid, showError]);

  // Timer effect for elapsed time
  useEffect(() => {
    if (activeTimer && timerStartTime) {
      timerInterval.current = setInterval(() => {
        const now = new Date();
        const elapsed = Math.floor((now.getTime() - timerStartTime.getTime()) / 1000);
        setElapsedTime(elapsed);
      }, 1000);
    } else {
      if (timerInterval.current) {
        clearInterval(timerInterval.current);
        timerInterval.current = null;
      }
    }

    return () => {
      if (timerInterval.current) {
        clearInterval(timerInterval.current);
      }
    };
  }, [activeTimer, timerStartTime]);

  // Load communications for selected job
  useEffect(() => {
    if (selectedJob) {
      loadCommunications();
    }
  }, [selectedJob]);

  const loadCommunications = async () => {
    if (!selectedJob) return;
    
    try {
      const communications = await communicationService.getRequestCommunications(selectedJob.id);
      setMessages(communications);
    } catch (error) {
      console.error('Error loading communications:', error);
      showError('Failed to load messages');
    }
  };

  // Optimistic Accept
  const handleAcceptJob = async (jobId: string) => {
    try {
      setAcceptingJob(jobId);
      setOptimisticRemovedJobs(prev => [...prev, jobId]);
      await maintenanceService.assignContractor(jobId, user!.uid);
      showSuccess('Job accepted successfully!');
      await communicationService.addMessage(jobId, {
        content: 'I have accepted this job and will begin work shortly.',
        senderId: user!.uid,
        senderRole: 'contractor',
        attachments: []
      });
    } catch (error) {
      setOptimisticRemovedJobs(prev => prev.filter(id => id !== jobId));
      console.error('Error accepting job:', error);
      showError('Failed to accept job');
    } finally {
      setAcceptingJob(null);
    }
  };

  // Optimistic Reject
  const handleRejectJob = async (jobId: string, reason: string) => {
    try {
      setRejectingJob(jobId);
      setOptimisticRemovedJobs(prev => [...prev, jobId]);
      await maintenanceService.declineJob(jobId, user!.uid, reason);
      showSuccess('Job declined');
      await communicationService.addMessage(jobId, {
        content: `Unable to accept this job. Reason: ${reason}`,
        senderId: user!.uid,
        senderRole: 'contractor',
        attachments: []
      });
    } catch (error) {
      setOptimisticRemovedJobs(prev => prev.filter(id => id !== jobId));
      console.error('Error declining job:', error);
      showError('Failed to decline job');
    } finally {
      setRejectingJob(null);
      setShowRejectModal(false);
      setRejectReason('');
    }
  };

  // Start time tracking
  const startTimer = (jobId: string) => {
    const now = new Date();
    const newEntry: TimeEntry = {
      id: `${jobId}-${now.getTime()}`,
      startTime: now,
      description: 'Work session'
    };
    
    setCurrentEntry(newEntry);
    setActiveTimer(jobId);
    setTimerStartTime(now);
    setElapsedTime(0);
    
    showInfo('Timer started');
  };

  // Stop time tracking
  const stopTimer = () => {
    if (!currentEntry || !activeTimer) return;
    
    const now = new Date();
    const completedEntry = {
      ...currentEntry,
      endTime: now
    };
    
    setTimeEntries(prev => ({
      ...prev,
      [activeTimer]: [...(prev[activeTimer] || []), completedEntry]
    }));
    
    setCurrentEntry(null);
    setActiveTimer(null);
    setTimerStartTime(null);
    setElapsedTime(0);
    
    showSuccess('Time entry saved');
  };

  // Handle photo upload
  const handlePhotoUpload = async () => {
    if (!selectedJob || progressPhotos.length === 0) return;
    
    try {
      setUploadingPhotos(true);
      
      const photoUrls = await maintenanceService.uploadProgressPhotos(
        selectedJob.id,
        progressPhotos,
        photoCategory,
        photoDescription
      );
      
      // Add communication message about photos
      await communicationService.addMessage(selectedJob.id, {
        content: `Progress photos uploaded: ${photoDescription}`,
        senderId: user!.uid,
        senderRole: 'contractor',
        attachments: photoUrls
      });
      
      setProgressPhotos([]);
      setPhotoDescription('');
      setShowPhotoUpload(false);
      showSuccess('Photos uploaded successfully');
      
    } catch (error) {
      console.error('Error uploading photos:', error);
      showError('Failed to upload photos');
    } finally {
      setUploadingPhotos(false);
    }
  };

  // Handle job completion
  const handleCompleteJob = async (jobId: string) => {
    try {
      const totalTime = timeEntries[jobId]?.reduce((total, entry) => {
        if (entry.endTime) {
          const duration = entry.endTime.getTime() - entry.startTime.getTime();
          return total + duration;
        }
        return total;
      }, 0) || 0;
      
      const totalHours = totalTime / (1000 * 60 * 60);
      const totalCost = costBreakdown.labor + costBreakdown.materials + costBreakdown.other;
      
      await maintenanceService.completeJob(jobId, {
        timeSpent: totalHours,
        finalCost: totalCost,
        costBreakdown,
        contractorId: user!.uid
      });
      
      // Send completion message
      await communicationService.addMessage(jobId, {
        content: `Job completed. Total time: ${totalHours.toFixed(1)} hours. Total cost: $${totalCost.toFixed(2)}`,
        senderId: user!.uid,
        senderRole: 'contractor',
        attachments: []
      });
      
      showSuccess('Job marked as completed!');
      
    } catch (error) {
      console.error('Error completing job:', error);
      showError('Failed to complete job');
    }
  };

  // Handle sending message
  const handleSendMessage = async () => {
    if (!selectedJob || !newMessage.trim()) return;
    
    try {
      setSendingMessage(true);
      
      await communicationService.addMessage(selectedJob.id, {
        content: newMessage.trim(),
        senderId: user!.uid,
        senderRole: 'contractor',
        attachments: []
      });
      
      setNewMessage('');
      await loadCommunications();
      
    } catch (error) {
      console.error('Error sending message:', error);
      showError('Failed to send message');
    } finally {
      setSendingMessage(false);
    }
  };

  // Get priority icon and color
  const getPriorityIcon = (priority: MaintenancePriority, isEmergency: boolean = false) => {
    if (isEmergency) {
      return <ExclamationTriangleSolid className="w-5 h-5 text-red-600" />;
    }
    
    switch (priority) {
      case 'high':
        return <ExclamationTriangleSolid className="w-5 h-5 text-orange-500" />;
      case 'medium':
        return <ClockSolid className="w-5 h-5 text-yellow-500" />;
      case 'low':
        return <CheckCircleSolid className="w-5 h-5 text-green-500" />;
      default:
        return <ClockIcon className="w-5 h-5 text-gray-500" />;
    }
  };

  // Get priority color class
  const getPriorityColor = (priority: MaintenancePriority, isEmergency: boolean = false) => {
    if (isEmergency) return 'bg-red-100 text-red-800 border-red-200';
    
    switch (priority) {
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  // Format time display
  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  // Filter and sort jobs
  const filterAndSortJobs = (jobs: MaintenanceRequest[]) => {
    let filtered = jobs.filter(job => {
      if (filterPriority !== 'all' && job.priority !== filterPriority) return false;
      if (filterCategory !== 'all' && job.category !== filterCategory) return false;
      return true;
    });

    return filtered.sort((a, b) => {
      switch (sortBy) {
        case 'priority':
          const priorityOrder = { high: 3, medium: 2, low: 1 };
          return priorityOrder[b.priority] - priorityOrder[a.priority];
        case 'date':
          return b.createdAt.toDate().getTime() - a.createdAt.getTime();
        case 'cost':
          return (b.estimatedCost || 0) - (a.estimatedCost || 0);
        case 'distance':
          // This would use actual distance calculation in a real app
          return 0;
        default:
          return 0;
      }
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
        <span className="ml-3 text-gray-600">Loading job board...</span>
      </div>
    );
  }

  const filteredAvailableJobs = filterAndSortJobs(availableJobs).filter(job => !optimisticRemovedJobs.includes(job.id));
  const filteredMyJobs = filterAndSortJobs(myJobs);
  const completedJobs = myJobs.filter(job => job.status === 'completed');

  return (
    <ErrorBoundary>
      <div className={`space-y-6 ${className}`}>
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Job Board
            </h1>
            <p className="mt-2 text-gray-600 dark:text-gray-400">
              Find and manage your maintenance jobs
            </p>
          </div>
          
          <div className="mt-4 sm:mt-0 flex flex-wrap gap-2">
            {activeTimer && (
              <div className="flex items-center px-3 py-2 bg-blue-100 dark:bg-blue-900/20 text-blue-800 dark:text-blue-200 rounded-lg border border-blue-200 dark:border-blue-800">
                <ClockIcon className="w-4 h-4 mr-2" />
                <span className="font-mono text-sm">{formatTime(elapsedTime)}</span>
                <button
                  onClick={stopTimer}
                  className="ml-2 p-1 hover:bg-blue-200 dark:hover:bg-blue-800 rounded"
                >
                  <PauseIcon className="w-4 h-4" />
                </button>
              </div>
            )}
            
            <Button
              variant="outline"
              onClick={() => setShowMapView(true)}
              className="flex items-center"
            >
              <MapIcon className="w-4 h-4 mr-2" />
              Map View
            </Button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="border-b border-gray-200 dark:border-gray-700">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('available')}
              className={`whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'available'
                  ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 hover:border-gray-300'
              }`}
            >
              Available Jobs ({filteredAvailableJobs.length})
            </button>
            <button
              onClick={() => setActiveTab('assigned')}
              className={`whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'assigned'
                  ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 hover:border-gray-300'
              }`}
            >
              My Jobs ({filteredMyJobs.filter(job => job.status !== 'completed').length})
            </button>
            <button
              onClick={() => setActiveTab('completed')}
              className={`whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'completed'
                  ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 hover:border-gray-300'
              }`}
            >
              Completed ({completedJobs.length})
            </button>
          </nav>
        </div>

        {/* Filters */}
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow border border-gray-200 dark:border-gray-700">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <select
              value={filterPriority}
              onChange={(e) => setFilterPriority(e.target.value as any)}
              className="rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm"
            >
              <option value="all">All Priorities</option>
              <option value="high">High Priority</option>
              <option value="medium">Medium Priority</option>
              <option value="low">Low Priority</option>
            </select>

            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm"
            >
              <option value="all">All Categories</option>
              <option value="plumbing">Plumbing</option>
              <option value="electrical">Electrical</option>
              <option value="hvac">HVAC</option>
              <option value="general">General</option>
            </select>

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm"
            >
              <option value="date">Sort by Date</option>
              <option value="priority">Sort by Priority</option>
              <option value="cost">Sort by Cost</option>
              <option value="distance">Sort by Distance</option>
            </select>

            <div className="text-sm text-gray-600 dark:text-gray-400 flex items-center">
              Showing {
                activeTab === 'available' 
                  ? filteredAvailableJobs.length 
                  : activeTab === 'assigned'
                  ? filteredMyJobs.filter(job => job.status !== 'completed').length
                  : completedJobs.length
              } jobs
            </div>
          </div>
        </div>

        {/* Job Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {(activeTab === 'available' 
            ? filteredAvailableJobs 
            : activeTab === 'assigned'
            ? filteredMyJobs.filter(job => job.status !== 'completed')
            : completedJobs
          ).map((job) => (
            <div
              key={job.id}
              className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700 overflow-hidden hover:shadow-lg transition-shadow"
            >
              {/* Card Header */}
              <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-start justify-between mb-2">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white line-clamp-1">
                    {job.title}
                  </h3>
                  <div className="flex items-center space-x-2">
                    {getPriorityIcon(job.priority, job.isEmergency)}
                    {job.isEmergency && (
                      <span className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded-full">
                        EMERGENCY
                      </span>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400">
                  <span className="flex items-center">
                    <WrenchScrewdriverIcon className="w-4 h-4 mr-1" />
                    {job.category}
                  </span>
                  <span className="flex items-center">
                    <ClockIcon className="w-4 h-4 mr-1" />
                    {job.createdAt.toDate().toLocaleDateString()}
                  </span>
                </div>
              </div>

              {/* Card Body */}
              <div className="p-4">
                <p className="text-gray-600 dark:text-gray-400 text-sm mb-4 line-clamp-2">
                  {job.description}
                </p>
                
                <div className="space-y-2 text-sm">
                  <div className="flex items-center text-gray-600 dark:text-gray-400">
                    <MapPinIcon className="w-4 h-4 mr-2" />
                    <span>{job.propertyAddress || 'Property Address'}</span>
                  </div>
                  
                  {job.estimatedCost && (
                    <div className="flex items-center text-gray-600 dark:text-gray-400">
                      <CurrencyDollarIcon className="w-4 h-4 mr-2" />
                      <span>Est. ${job.estimatedCost.toLocaleString()}</span>
                    </div>
                  )}
                  
                  <div className="flex items-center justify-between pt-2">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getPriorityColor(job.priority, job.isEmergency)}`}>
                      {job.priority}
                    </span>
                    <StatusPill status={job.status} />
                  </div>
                </div>

                {/* Photos Preview */}
                {job.photos && job.photos.length > 0 && (
                  <div className="mt-3 flex space-x-2">
                    {job.photos.slice(0, 3).map((photo, index) => (
                      <img
                        key={index}
                        src={photo}
                        alt={`Job photo ${index + 1}`}
                        className="w-12 h-12 object-cover rounded border"
                      />
                    ))}
                    {job.photos.length > 3 && (
                      <div className="w-12 h-12 bg-gray-100 dark:bg-gray-700 rounded border flex items-center justify-center text-xs text-gray-500">
                        +{job.photos.length - 3}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Card Actions */}
              <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
                {activeTab === 'available' ? (
                  <div className="flex space-x-2">
                    <Button
                      onClick={() => handleAcceptJob(job.id)}
                      disabled={acceptingJob === job.id || rejectingJob === job.id}
                      className="flex-1 flex items-center justify-center"
                      size="sm"
                    >
                      {acceptingJob === job.id ? (
                        <LoadingSpinner size="sm" />
                      ) : (
                        <>
                          <CheckCircleIcon className="w-4 h-4 mr-1" />
                          Accept
                        </>
                      )}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setSelectedJob(job);
                        setShowRejectModal(true);
                      }}
                      disabled={acceptingJob === job.id || rejectingJob === job.id}
                      size="sm"
                      className="flex-1 flex items-center justify-center"
                    >
                      {rejectingJob === job.id ? (
                        <LoadingSpinner size="sm" />
                      ) : (
                        <>
                          <XCircleIcon className="w-4 h-4 mr-1 text-red-500" />
                          Reject
                        </>
                      )}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setSelectedJob(job);
                        setShowJobDetails(true);
                      }}
                      size="sm"
                      className="flex items-center"
                    >
                      <DocumentTextIcon className="w-4 h-4 mr-1" />
                      Details
                    </Button>
                  </div>
                ) : activeTab === 'assigned' ? (
                  <div className="space-y-2">
                    <div className="flex space-x-2">
                      {activeTimer === job.id ? (
                        <Button
                          onClick={stopTimer}
                          size="sm"
                          variant="outline"
                          className="flex items-center"
                        >
                          <PauseIcon className="w-4 h-4 mr-1" />
                          Stop Timer
                        </Button>
                      ) : (
                        <Button
                          onClick={() => startTimer(job.id)}
                          size="sm"
                          className="flex items-center"
                        >
                          <PlayIcon className="w-4 h-4 mr-1" />
                          Start Work
                        </Button>
                      )}
                      
                      <Button
                        variant="outline"
                        onClick={() => {
                          setSelectedJob(job);
                          setShowPhotoUpload(true);
                        }}
                        size="sm"
                        className="flex items-center"
                      >
                        <PhotoIcon className="w-4 h-4 mr-1" />
                        Photos
                      </Button>
                    </div>
                    
                    <div className="flex space-x-2">
                      <Button
                        variant="outline"
                        onClick={() => {
                          setSelectedJob(job);
                          setShowJobDetails(true);
                        }}
                        size="sm"
                        className="flex-1 flex items-center justify-center"
                      >
                        <ChatBubbleLeftRightIcon className="w-4 h-4 mr-1" />
                        Messages
                      </Button>
                      
                      {job.status === 'in_progress' && (
                        <Button
                          onClick={() => handleCompleteJob(job.id)}
                          size="sm"
                          className="flex items-center"
                        >
                          <CheckCircleIcon className="w-4 h-4 mr-1" />
                          Complete
                        </Button>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      Completed {job.completedAt?.toDate().toLocaleDateString()}
                    </span>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setSelectedJob(job);
                        setShowJobDetails(true);
                      }}
                      size="sm"
                    >
                      View Details
                    </Button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Empty State */}
        {(activeTab === 'available' ? filteredAvailableJobs : activeTab === 'assigned' ? filteredMyJobs.filter(job => job.status !== 'completed') : completedJobs).length === 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700 p-8">
            <div className="text-center">
              <BriefcaseIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                {activeTab === 'available' 
                  ? 'No available jobs found'
                  : activeTab === 'assigned'
                  ? 'No assigned jobs'
                  : 'No completed jobs'
                }
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                {activeTab === 'available' 
                  ? 'Check back later for new maintenance requests in your area.'
                  : activeTab === 'assigned'
                  ? 'Accept some jobs from the available tab to get started.'
                  : 'Complete some jobs to see them here.'
                }
              </p>
            </div>
          </div>
        )}

        {/* Job Details Modal */}
        <Modal
          isOpen={showJobDetails}
          onClose={() => setShowJobDetails(false)}
          title={selectedJob?.title || 'Job Details'}
          size="lg"
        >
          {selectedJob && (
            <div className="space-y-6">
              {/* Job Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium text-gray-900 dark:text-white mb-2">Job Information</h4>
                  <div className="space-y-2 text-sm">
                    <div>Category: {selectedJob.category}</div>
                    <div>Priority: {selectedJob.priority}</div>
                    <div>Created: {selectedJob.createdAt.toDate().toLocaleDateString()}</div>
                    {selectedJob.estimatedCost && (
                      <div>Estimated Cost: ${selectedJob.estimatedCost.toLocaleString()}</div>
                    )}
                  </div>
                </div>
                
                <div>
                  <h4 className="font-medium text-gray-900 dark:text-white mb-2">Contact Information</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center">
                      <UserIcon className="w-4 h-4 mr-2" />
                      Tenant: {selectedJob.tenantName || 'N/A'}
                    </div>
                    <div className="flex items-center">
                      <PhoneIcon className="w-4 h-4 mr-2" />
                      Phone: {selectedJob.tenantPhone || 'N/A'}
                    </div>
                    <div className="flex items-center">
                      <MapPinIcon className="w-4 h-4 mr-2" />
                      Address: {selectedJob.propertyAddress || 'N/A'}
                    </div>
                  </div>
                </div>
              </div>

              {/* Description */}
              <div>
                <h4 className="font-medium text-gray-900 dark:text-white mb-2">Description</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {selectedJob.description}
                </p>
              </div>

              {/* Photos */}
              {selectedJob.photos && selectedJob.photos.length > 0 && (
                <div>
                  <h4 className="font-medium text-gray-900 dark:text-white mb-2">Photos</h4>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    {selectedJob.photos.map((photo, index) => (
                      <img
                        key={index}
                        src={photo}
                        alt={`Job photo ${index + 1}`}
                        className="w-full h-24 object-cover rounded border"
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Messages */}
              <div>
                <h4 className="font-medium text-gray-900 dark:text-white mb-2">Messages</h4>
                <div className="max-h-32 overflow-y-auto space-y-2 border rounded p-3">
                  {messages.length === 0 ? (
                    <p className="text-gray-500 text-sm">No messages yet</p>
                  ) : (
                    messages.map((message) => (
                      <div
                        key={message.id}
                        className={`text-sm ${
                          message.senderRole === 'contractor' ? 'text-right' : 'text-left'
                        }`}
                      >
                        <div
                          className={`inline-block p-2 rounded max-w-xs ${
                            message.senderRole === 'contractor'
                              ? 'bg-blue-600 text-white'
                              : 'bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white'
                          }`}
                        >
                          {message.content}
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          {message.createdAt.toDate().toLocaleString()}
                        </div>
                      </div>
                    ))
                  )}
                </div>
                
                {/* Message Input */}
                <div className="flex space-x-2 mt-3">
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Type your message..."
                    className="flex-1 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm"
                    onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                  />
                  <Button
                    onClick={handleSendMessage}
                    disabled={!newMessage.trim() || sendingMessage}
                    size="sm"
                  >
                    {sendingMessage ? <LoadingSpinner size="sm" /> : 'Send'}
                  </Button>
                </div>
              </div>

              {/* Status Tracker */}
              <div>
                <h4 className="font-medium text-gray-900 dark:text-white mb-2">Progress</h4>
                <RequestStatusTracker
                  requestId={selectedJob.id}
                  currentStatus={selectedJob.status}
                />
              </div>
            </div>
          )}
        </Modal>

        {/* Photo Upload Modal */}
        <Modal
          isOpen={showPhotoUpload}
          onClose={() => setShowPhotoUpload(false)}
          title="Upload Progress Photos"
          size="md"
        >
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Photo Category
              </label>
              <select
                value={photoCategory}
                onChange={(e) => setPhotoCategory(e.target.value as any)}
                className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm"
              >
                <option value="before">Before Work</option>
                <option value="during">Work in Progress</option>
                <option value="after">After Completion</option>
                <option value="materials">Materials/Parts</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Description
              </label>
              <input
                type="text"
                value={photoDescription}
                onChange={(e) => setPhotoDescription(e.target.value)}
                placeholder="Describe what this photo shows..."
                className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Photos
              </label>
              <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 text-center">
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={(e) => {
                    const files = Array.from(e.target.files || []);
                    setProgressPhotos(files.slice(0, 5));
                  }}
                  className="hidden"
                />
                <PhotoIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <Button
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  className="mb-2"
                >
                  Choose Photos
                </Button>
                <p className="text-sm text-gray-500">Up to 5 photos, 10MB each</p>
              </div>

              {/* Photo Previews */}
              {progressPhotos.length > 0 && (
                <div className="grid grid-cols-2 gap-2 mt-3">
                  {progressPhotos.map((file, index) => (
                    <div key={index} className="relative">
                      <img
                        src={URL.createObjectURL(file)}
                        alt={`Preview ${index + 1}`}
                        className="w-full h-24 object-cover rounded border"
                      />
                      <button
                        onClick={() => setProgressPhotos(prev => prev.filter((_, i) => i !== index))}
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex justify-end space-x-3">
              <Button
                variant="outline"
                onClick={() => setShowPhotoUpload(false)}
                disabled={uploadingPhotos}
              >
                Cancel
              </Button>
              <Button
                onClick={handlePhotoUpload}
                disabled={progressPhotos.length === 0 || uploadingPhotos}
              >
                {uploadingPhotos ? <LoadingSpinner size="sm" /> : 'Upload Photos'}
              </Button>
            </div>
          </div>
        </Modal>

        {/* Map View Modal */}
        <Modal
          isOpen={showMapView}
          onClose={() => setShowMapView(false)}
          title="Job Locations"
          size="xl"
        >
          <div className="h-96 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center">
            <div className="text-center">
              <MapIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                Map Integration
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Google Maps integration will be implemented here to show job locations and optimize routes
              </p>
            </div>
          </div>
        </Modal>

        {/* Reject Modal */}
        <Modal
          isOpen={showRejectModal}
          onClose={() => {
            setShowRejectModal(false);
            setRejectReason('');
          }}
          title={selectedJob ? `Reject Job: ${selectedJob.title}` : 'Reject Job'}
          size="md"
        >
          <div className="space-y-4">
            <div className="flex items-center text-red-600">
              <ExclamationTriangleIcon className="w-6 h-6 mr-2" />
              <span>Are you sure you want to reject this job?</span>
            </div>
            <textarea
              className="w-full border border-gray-300 rounded p-2"
              rows={3}
              placeholder="Enter reason for rejection (required)"
              value={rejectReason}
              onChange={e => setRejectReason(e.target.value)}
            />
            <div className="flex justify-end space-x-2">
              <Button
                variant="outline"
                onClick={() => {
                  setShowRejectModal(false);
                  setRejectReason('');
                }}
              >
                Cancel
              </Button>
              <Button
                variant="danger"
                disabled={!rejectReason.trim() || rejectingJob}
                onClick={() => {
                  if (selectedJob) {
                    handleRejectJob(selectedJob.id, rejectReason.trim());
                  }
                }}
              >
                {rejectingJob ? <LoadingSpinner size="sm" /> : 'Reject Job'}
              </Button>
            </div>
          </div>
        </Modal>
      </div>
    </ErrorBoundary>
  );
};

export default ContractorJobBoard; 