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
import { Timestamp } from 'firebase/firestore';

import { useAuth } from '../../context/AuthContext';
import useActionFeedback from '../../hooks/useActionFeedback';
import { maintenanceService } from '../../services/firestore/maintenanceService';
import { communicationService } from '../../services/firestore/communicationService';
import RequestStatusTracker from '../shared/RequestStatusTracker';
import Button from '../ui/Button';
import StatusPill from '../ui/StatusPill';
import LoadingSpinner from '../ui/LoadingSpinner';
import Modal from '../common/Modal';
import ErrorBoundary from '../error/ErrorBoundary';
import { MaintenanceRequest, MaintenanceStatus, MaintenancePriority, VerificationStatus } from '../../models';
import { CommunicationMessage } from '../../models';
import VerificationStatusPill from '../ui/VerificationStatusPill';

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

const ContractorJobBoard: React.FC<ContractorJobBoardProps> = ({ className = '' }) => {
  const { user } = useAuth();
  const { 
    showSuccess, 
    showError, 
    showLoading, 
    hideFeedback 
  } = useActionFeedback();
  
  // Core state
  const [availableJobs, setAvailableJobs] = useState<MaintenanceRequest[]>([]);
  const [myJobs, setMyJobs] = useState<MaintenanceRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [acceptingJob, setAcceptingJob] = useState<string | null>(null);
  const [decliningJobId, setDecliningJobId] = useState<string | null>(null);
  const [declineReason, setDeclineReason] = useState('');
  const [completingJobId, setCompletingJobId] = useState<string | null>(null);
  const [completionNotes, setCompletionNotes] = useState('');
  
  // UI state
  const [selectedJob, setSelectedJob] = useState<MaintenanceRequest | null>(null);
  
  // Photo upload state
  const [progressPhotos, setProgressPhotos] = useState<File[]>([]);
  const [uploadProgress, setUploadProgress] = useState(0);

  // Communication state
  const [messages, setMessages] = useState<CommunicationMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  
  // Filter state
  const [filterPriority, setFilterPriority] = useState<MaintenancePriority | 'all'>('all');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'date' | 'priority' | 'distance' | 'cost'>('date');
  
  // Real-time listener cleanup
  const [unsubscribe, setUnsubscribe] = useState<(() => void) | null>(null);

  // Initialize real-time listeners
  useEffect(() => {
    if (!user?.uid) return;

    const setupListeners = async () => {
      try {
        setLoading(true);
        
        const unsubscribeFn = await maintenanceService.subscribeToContractorJobs(
          user.uid,
          (assignedJobs: MaintenanceRequest[], availableJobs: MaintenanceRequest[]) => {
            setMyJobs(assignedJobs);
            setAvailableJobs(availableJobs);
          },
          (error: Error) => {
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
    };
  }, [user?.uid, showError]);

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

  // Handle job acceptance
  const handleAcceptJob = async (jobId: string) => {
    try {
      setAcceptingJob(jobId);
      
      await maintenanceService.acceptJob(jobId, user!.uid);
      showSuccess('Job accepted and moved to "My Jobs"');
      
      await communicationService.addMessage(jobId, {
        content: 'I have accepted this job.',
        senderId: user!.uid,
        senderRole: 'contractor',
        senderName: user!.displayName || 'Contractor',
      });
      
    } catch (error) {
      console.error('Error accepting job:', error);
      showError('Failed to accept job');
    } finally {
      setAcceptingJob(null);
    }
  };

  const handleDeclineJob = async (jobId: string) => {
    if (!declineReason) {
      showError('Please provide a reason for declining.');
      return;
    }
    try {
      await maintenanceService.declineJob(jobId, user!.uid, declineReason);
      showSuccess('Job declined');
      setDecliningJobId(null);
      setDeclineReason('');
      
      // Send notification message
      await communicationService.addMessage(jobId, {
        content: `Unable to accept this job. Reason: ${declineReason}`,
        senderId: user!.uid,
        senderRole: 'contractor',
        senderName: user!.displayName || 'Contractor',
      });
    } catch (error) {
      console.error('Error declining job:', error);
      showError('Failed to decline job');
    }
  };

  const handleStartJob = async (jobId: string) => {
    try {
      await maintenanceService.startJob(jobId, user!.uid);
      showSuccess('Job started');
    } catch (error) {
      console.error('Error starting job:', error);
      showError('Failed to start job');
    }
  };
  
  const handlePhotoUpload = async (jobId: string) => {
    if (progressPhotos.length === 0) return;
    try {
      const photoUrls = await maintenanceService.uploadProgressPhotos(
        jobId,
        progressPhotos,
        (progress: number) => setUploadProgress(progress)
      );
      showSuccess('Progress photos uploaded');
      setProgressPhotos([]);
      setUploadProgress(0);
    } catch (error) {
      console.error('Error uploading photos:', error);
      showError('Failed to upload photos');
    }
  };

  const handleCompleteJob = async (jobId: string) => {
    try {
      await maintenanceService.completeJob(jobId, user!.uid, completionNotes);
      showSuccess('Job marked as complete');
      setCompletingJobId(null);
      setCompletionNotes('');
    } catch (error) {
      console.error('Error completing job:', error);
      showError('Failed to complete job');
    }
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedJob) return;

    try {
      await communicationService.addMessage(selectedJob.id, {
        content: newMessage,
        senderId: user!.uid,
        senderRole: 'contractor',
        senderName: user!.displayName || 'Contractor',
      });
      setNewMessage('');
      loadCommunications(); // Refresh messages
    } catch (error) {
      console.error('Error sending message:', error);
      showError('Failed to send message');
    }
  };

  const filterAndSortJobs = (jobs: MaintenanceRequest[]) => {
    return jobs
      .filter(job => 
        (filterPriority === 'all' || job.priority === filterPriority) &&
        (filterCategory === 'all' || job.category === filterCategory)
      )
      .sort((a, b) => {
        switch(sortBy) {
          case 'priority':
            const priorityOrder = { 'high': 1, 'urgent': 1, 'medium': 2, 'low': 3 };
            return (priorityOrder[a.priority] || 4) - (priorityOrder[b.priority] || 4);
          case 'cost':
            return (b.estimatedCost || 0) - (a.estimatedCost || 0);
          default: // date
            return (b.createdAt as Timestamp).toMillis() - (a.createdAt as Timestamp).toMillis();
        }
      });
  };
  
  const documents = [
    { name: 'Liability Insurance', verificationStatus: 'approved' as VerificationStatus, date: '2023-01-15' },
    { name: 'W-9 Form', verificationStatus: 'pending' as VerificationStatus, date: '2023-01-15' },
    { name: 'Contractor License', verificationStatus: 'rejected' as VerificationStatus, date: '2023-01-15' },
  ];
  
  const getStatusIcon = (status: VerificationStatus) => {
    switch (status) {
      case 'approved':
        return <CheckCircleSolid className="h-5 w-5 text-green-500" />;
      case 'pending':
        return <ClockSolid className="h-5 w-5 text-yellow-500" />;
      case 'rejected':
        return <XCircleIcon className="h-5 w-5 text-red-500" />;
      case 'requires_review':
        return <ExclamationTriangleSolid className="h-5 w-5 text-blue-500" />;
      default:
        return null;
    }
  };


  return (
    <div className={`p-4 ${className}`}>
        {/* ... JSX ... */}
        {/* This is a placeholder for where the component would be used */}
        <div className="bg-white shadow overflow-hidden sm:rounded-lg mt-4">
            <div className="border-t border-gray-200 px-4 py-5 sm:p-0">
                <dl className="sm:divide-y sm:divide-gray-200">
                    {documents.map((document) => (
                        <div key={document.name} className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                            <dt className="text-sm font-medium text-gray-500">{document.name}</dt>
                            <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                                <div className="flex items-center justify-between">
                                    <span>{document.date}</span>
                                    <div className="flex items-center space-x-2">
                                        {getStatusIcon(document.verificationStatus)}
                                        <VerificationStatusPill status={document.verificationStatus} />
                                    </div>
                                </div>
                            </dd>
                        </div>
                    ))}
                </dl>
            </div>
        </div>
    </div>
  );
};

export default ContractorJobBoard;
