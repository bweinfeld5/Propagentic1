import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  PlusIcon,
  PhotoIcon,
  ChatBubbleLeftRightIcon,
  ClockIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  StarIcon,
  PaperClipIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  CameraIcon,
  DocumentArrowUpIcon
} from '@heroicons/react/24/outline';
import {
  StarIcon as StarSolid,
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

interface RequestSubmissionData {
  title: string;
  description: string;
  category: string;
  priority: MaintenancePriority;
  photos: File[];
  isEmergency: boolean;
}

interface TenantRequestHistoryProps {
  className?: string;
  propertyId?: string;
}

const MAINTENANCE_CATEGORIES = [
  { id: 'plumbing', label: 'Plumbing', icon: '🔧' },
  { id: 'electrical', label: 'Electrical', icon: '⚡' },
  { id: 'hvac', label: 'HVAC', icon: '❄️' },
  { id: 'appliances', label: 'Appliances', icon: '🏠' },
  { id: 'general', label: 'General Maintenance', icon: '🔨' },
  { id: 'emergency', label: 'Emergency', icon: '🚨' }
];

const REQUEST_TEMPLATES = {
  plumbing: [
    'Leaky faucet in bathroom',
    'Clogged drain in kitchen sink',
    'Running toilet',
    'Low water pressure'
  ],
  electrical: [
    'Light switch not working',
    'Outlet not functioning',
    'Flickering lights',
    'Circuit breaker keeps tripping'
  ],
  hvac: [
    'Heating not working',
    'Air conditioning not cooling',
    'Strange noises from HVAC unit',
    'Thermostat not responding'
  ],
  appliances: [
    'Refrigerator not cooling',
    'Washer not draining',
    'Dryer not heating',
    'Dishwasher not cleaning dishes'
  ],
  general: [
    'Door handle loose',
    'Window not opening/closing',
    'Cabinet door not closing',
    'Squeaky floor'
  ],
  emergency: [
    'Water leak causing damage',
    'No electricity in unit',
    'Broken door/window security',
    'Gas smell detected'
  ]
};

const TenantRequestHistory: React.FC<TenantRequestHistoryProps> = ({ 
  className = '', 
  propertyId 
}) => {
  const { user } = useAuth();
  const { showSuccess, showError, showInfo } = useActionFeedback();
  
  // Core state
  const [requests, setRequests] = useState<MaintenanceRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  
  // UI state
  const [showSubmissionForm, setShowSubmissionForm] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<MaintenanceRequest | null>(null);
  const [showPhotoModal, setShowPhotoModal] = useState(false);
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [viewMode, setViewMode] = useState<'timeline' | 'grid'>('timeline');
  
  // Filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<MaintenanceStatus | 'all'>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  
  // Form state
  const [formData, setFormData] = useState<RequestSubmissionData>({
    title: '',
    description: '',
    category: '',
    priority: 'medium',
    photos: [],
    isEmergency: false
  });
  
  // Photo state
  const [selectedPhotos, setSelectedPhotos] = useState<string[]>([]);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Communication state
  const [messages, setMessages] = useState<CommunicationMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [sendingMessage, setSendingMessage] = useState(false);
  
  // Rating state
  const [rating, setRating] = useState(0);
  const [ratingComment, setRatingComment] = useState('');
  const [submittingRating, setSubmittingRating] = useState(false);
  
  // Real-time listener cleanup
  const [unsubscribe, setUnsubscribe] = useState<(() => void) | null>(null);

  // Initialize real-time listeners
  useEffect(() => {
    if (!user?.uid) return;

    const setupListeners = async () => {
      try {
        setLoading(true);
        
        // Set up real-time listener for tenant's requests
        const unsubscribeFn = await maintenanceService.subscribeToTenantRequests(
          user.uid,
          (updatedRequests) => {
            setRequests(updatedRequests);
          },
          (error) => {
            console.error('Error in tenant requests listener:', error);
            showError('Failed to sync maintenance requests');
          }
        );
        
        setUnsubscribe(() => unsubscribeFn);
        
      } catch (error) {
        console.error('Error setting up tenant request history:', error);
        showError('Failed to load request history');
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

  // Load communications for selected request
  useEffect(() => {
    if (selectedRequest) {
      loadCommunications();
    }
  }, [selectedRequest]);

  const loadCommunications = async () => {
    if (!selectedRequest) return;
    
    try {
      const communications = await communicationService.getRequestCommunications(selectedRequest.id);
      setMessages(communications);
    } catch (error) {
      console.error('Error loading communications:', error);
      showError('Failed to load messages');
    }
  };

  // Filter requests
  const filteredRequests = requests.filter(request => {
    if (statusFilter !== 'all' && request.status !== statusFilter) return false;
    if (categoryFilter !== 'all' && request.category !== categoryFilter) return false;
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      return (
        request.title.toLowerCase().includes(searchLower) ||
        request.description.toLowerCase().includes(searchLower)
      );
    }
    return true;
  });

  // Handle form submission
  const handleSubmitRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user?.uid || !propertyId) {
      showError('Missing user or property information');
      return;
    }
    
    if (!formData.title.trim() || !formData.description.trim() || !formData.category) {
      showError('Please fill in all required fields');
      return;
    }
    
    try {
      setSubmitting(true);
      setUploadProgress(0);
      
      // Create the maintenance request
      const requestData = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        category: formData.category,
        priority: formData.isEmergency ? 'high' : formData.priority,
        tenantId: user.uid,
        propertyId: propertyId,
        isEmergency: formData.isEmergency,
        photos: []
      };
      
      const requestId = await maintenanceService.createMaintenanceRequest(requestData);
      
      // Upload photos if any
      if (formData.photos.length > 0) {
        const photoUrls = await maintenanceService.uploadRequestPhotos(
          requestId,
          formData.photos,
          (progress) => setUploadProgress(progress)
        );
        
        // Update request with photo URLs
        await maintenanceService.updateRequestPhotos(requestId, photoUrls);
      }
      
      // Reset form
      setFormData({
        title: '',
        description: '',
        category: '',
        priority: 'medium',
        photos: [],
        isEmergency: false
      });
      
      setShowSubmissionForm(false);
      showSuccess(formData.isEmergency ? 'Emergency request submitted successfully!' : 'Request submitted successfully!');
      
    } catch (error) {
      console.error('Error submitting request:', error);
      showError('Failed to submit request');
    } finally {
      setSubmitting(false);
      setUploadProgress(0);
    }
  };

  // Handle photo selection
  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const validFiles = files.filter(file => {
      const isValid = file.type.startsWith('image/') && file.size <= 10 * 1024 * 1024; // 10MB limit
      if (!isValid && file.size > 10 * 1024 * 1024) {
        showError(`File ${file.name} is too large. Maximum size is 10MB.`);
      }
      return isValid;
    });
    
    setFormData(prev => ({
      ...prev,
      photos: [...prev.photos, ...validFiles].slice(0, 5) // Limit to 5 photos
    }));
  };

  // Remove photo from form
  const removePhoto = (index: number) => {
    setFormData(prev => ({
      ...prev,
      photos: prev.photos.filter((_, i) => i !== index)
    }));
  };

  // Handle template selection
  const handleTemplateSelect = (template: string) => {
    setFormData(prev => ({
      ...prev,
      title: template,
      description: `Please describe the issue with: ${template}`
    }));
  };

  // Handle sending message
  const handleSendMessage = async () => {
    if (!selectedRequest || !newMessage.trim()) return;
    
    try {
      setSendingMessage(true);
      
      await communicationService.addMessage(selectedRequest.id, {
        content: newMessage.trim(),
        senderId: user!.uid,
        senderRole: 'tenant',
        attachments: []
      });
      
      setNewMessage('');
      await loadCommunications(); // Refresh messages
      
    } catch (error) {
      console.error('Error sending message:', error);
      showError('Failed to send message');
    } finally {
      setSendingMessage(false);
    }
  };

  // Handle rating submission
  const handleSubmitRating = async () => {
    if (!selectedRequest || rating === 0) {
      showError('Please provide a rating');
      return;
    }
    
    try {
      setSubmittingRating(true);
      
      await maintenanceService.submitRating(selectedRequest.id, {
        rating,
        comment: ratingComment.trim(),
        tenantId: user!.uid
      });
      
      setRating(0);
      setRatingComment('');
      setShowRatingModal(false);
      showSuccess('Thank you for your feedback!');
      
    } catch (error) {
      console.error('Error submitting rating:', error);
      showError('Failed to submit rating');
    } finally {
      setSubmittingRating(false);
    }
  };

  // Get status color for timeline
  const getStatusColor = (status: MaintenanceStatus) => {
    switch (status) {
      case 'pending': return 'bg-yellow-500';
      case 'in_progress': return 'bg-blue-500';
      case 'completed': return 'bg-green-500';
      case 'cancelled': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  // Get priority badge color
  const getPriorityColor = (priority: MaintenancePriority) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800 border-red-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
        <span className="ml-3 text-gray-600">Loading your requests...</span>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <div className={`space-y-6 ${className}`}>
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              My Maintenance Requests
            </h1>
            <p className="mt-2 text-gray-600 dark:text-gray-400">
              Submit new requests and track the progress of your maintenance issues
            </p>
          </div>
          
          <div className="mt-4 sm:mt-0 flex flex-wrap gap-2">
            <Button
              onClick={() => setShowSubmissionForm(true)}
              className="flex items-center"
            >
              <PlusIcon className="w-4 h-4 mr-2" />
              New Request
            </Button>
            
            <div className="flex border border-gray-300 dark:border-gray-600 rounded-md">
              <button
                onClick={() => setViewMode('timeline')}
                className={`px-3 py-2 text-sm font-medium rounded-l-md ${
                  viewMode === 'timeline'
                    ? 'bg-blue-600 text-white'
                    : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                }`}
              >
                Timeline
              </button>
              <button
                onClick={() => setViewMode('grid')}
                className={`px-3 py-2 text-sm font-medium rounded-r-md border-l border-gray-300 dark:border-gray-600 ${
                  viewMode === 'grid'
                    ? 'bg-blue-600 text-white'
                    : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                }`}
              >
                Grid
              </button>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow border border-gray-200 dark:border-gray-700">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Search */}
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search requests..."
                className="pl-10 w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm"
              />
            </div>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm"
            >
              <option value="all">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="in_progress">In Progress</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>

            {/* Category Filter */}
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm"
            >
              <option value="all">All Categories</option>
              {MAINTENANCE_CATEGORIES.map(category => (
                <option key={category.id} value={category.id}>
                  {category.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Requests Display */}
        {viewMode === 'timeline' ? (
          <div className="flow-root">
            <ul className="-mb-8">
              {filteredRequests.map((request, requestIdx) => (
                <li key={request.id}>
                  <div className="relative pb-8">
                    {requestIdx !== filteredRequests.length - 1 && (
                      <span
                        className="absolute left-4 top-4 -ml-px h-full w-0.5 bg-gray-200 dark:bg-gray-700"
                        aria-hidden="true"
                      />
                    )}
                    <div className="relative flex space-x-3">
                      <div>
                        <span className={`h-8 w-8 rounded-full ${getStatusColor(request.status)} flex items-center justify-center ring-8 ring-white dark:ring-gray-900`}>
                          {request.status === 'completed' ? (
                            <CheckCircleIcon className="h-5 w-5 text-white" />
                          ) : request.status === 'in_progress' ? (
                            <ClockIcon className="h-5 w-5 text-white" />
                          ) : (
                            <ExclamationTriangleIcon className="h-5 w-5 text-white" />
                          )}
                        </span>
                      </div>
                      <div className="flex min-w-0 flex-1 justify-between space-x-4 pt-1.5">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center space-x-2 mb-2">
                            <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                              {request.title}
                            </h3>
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getPriorityColor(request.priority)}`}>
                              {request.priority}
                            </span>
                            {request.isEmergency && (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 border border-red-200">
                                <ExclamationTriangleSolid className="w-3 h-3 mr-1" />
                                Emergency
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                            {request.description}
                          </p>
                          <div className="flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400">
                            <span>Category: {request.category}</span>
                            <StatusPill status={request.status} />
                            {request.estimatedCost && (
                              <span>Cost: ${request.estimatedCost.toLocaleString()}</span>
                            )}
                          </div>
                          
                          {/* Action Buttons */}
                          <div className="mt-3 flex flex-wrap gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setSelectedRequest(request)}
                              className="flex items-center"
                            >
                              <ChatBubbleLeftRightIcon className="w-4 h-4 mr-1" />
                              Messages
                            </Button>
                            
                            {request.photos && request.photos.length > 0 && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setSelectedPhotos(request.photos || []);
                                  setShowPhotoModal(true);
                                }}
                                className="flex items-center"
                              >
                                <PhotoIcon className="w-4 h-4 mr-1" />
                                Photos ({request.photos.length})
                              </Button>
                            )}
                            
                            {request.status === 'completed' && !request.rating && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setSelectedRequest(request);
                                  setShowRatingModal(true);
                                }}
                                className="flex items-center"
                              >
                                <StarIcon className="w-4 h-4 mr-1" />
                                Rate Service
                              </Button>
                            )}
                          </div>
                          
                          <div className="mt-3">
                            <RequestStatusTracker
                              requestId={request.id}
                              currentStatus={request.status}
                              compact
                            />
                          </div>
                        </div>
                        <div className="whitespace-nowrap text-right text-sm text-gray-500 dark:text-gray-400">
                          <time dateTime={request.createdAt.toDate().toISOString()}>
                            {request.createdAt.toDate().toLocaleDateString()}
                          </time>
                        </div>
                      </div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        ) : (
          // Grid view implementation would go here
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredRequests.map((request) => (
              <div
                key={request.id}
                className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700 p-6"
              >
                <div className="flex items-start justify-between mb-4">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white truncate">
                    {request.title}
                  </h3>
                  <StatusPill status={request.status} />
                </div>
                
                <p className="text-gray-600 dark:text-gray-400 text-sm mb-4 line-clamp-2">
                  {request.description}
                </p>
                
                <div className="space-y-2 text-sm text-gray-500 dark:text-gray-400 mb-4">
                  <div>Category: {request.category}</div>
                  <div>Created: {request.createdAt.toDate().toLocaleDateString()}</div>
                  <div className="flex items-center space-x-2">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getPriorityColor(request.priority)}`}>
                      {request.priority}
                    </span>
                    {request.isEmergency && (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 border border-red-200">
                        Emergency
                      </span>
                    )}
                  </div>
                </div>
                
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedRequest(request)}
                    className="flex items-center"
                  >
                    <ChatBubbleLeftRightIcon className="w-4 h-4 mr-1" />
                    Messages
                  </Button>
                  
                  {request.photos && request.photos.length > 0 && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedPhotos(request.photos || []);
                        setShowPhotoModal(true);
                      }}
                      className="flex items-center"
                    >
                      <PhotoIcon className="w-4 h-4 mr-1" />
                      Photos
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Empty State */}
        {filteredRequests.length === 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700 p-8">
            <div className="text-center">
              <ClockIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                No maintenance requests found
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                {searchTerm || statusFilter !== 'all' || categoryFilter !== 'all'
                  ? 'Try adjusting your filters to see more requests.'
                  : 'You haven\'t submitted any maintenance requests yet.'}
              </p>
              <Button onClick={() => setShowSubmissionForm(true)}>
                Submit Your First Request
              </Button>
            </div>
          </div>
        )}

        {/* Request Submission Modal */}
        <Modal
          isOpen={showSubmissionForm}
          onClose={() => setShowSubmissionForm(false)}
          title="Submit Maintenance Request"
          size="lg"
        >
          <form onSubmit={handleSubmitRequest} className="space-y-6">
            {/* Emergency Toggle */}
            <div className="flex items-center justify-between p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
              <div>
                <h3 className="text-sm font-medium text-red-800 dark:text-red-200">
                  Emergency Request
                </h3>
                <p className="text-xs text-red-600 dark:text-red-300">
                  For urgent issues requiring immediate attention
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.isEmergency}
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    isEmergency: e.target.checked,
                    priority: e.target.checked ? 'high' : 'medium'
                  }))}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-red-300 dark:peer-focus:ring-red-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-red-600"></div>
              </label>
            </div>

            {/* Category Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Category *
              </label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {MAINTENANCE_CATEGORIES.map(category => (
                  <button
                    key={category.id}
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, category: category.id }))}
                    className={`p-3 rounded-lg border text-sm font-medium text-left transition-colors ${
                      formData.category === category.id
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300'
                        : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
                    }`}
                  >
                    <div className="flex items-center space-x-2">
                      <span className="text-lg">{category.icon}</span>
                      <span>{category.label}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Template Selection */}
            {formData.category && REQUEST_TEMPLATES[formData.category as keyof typeof REQUEST_TEMPLATES] && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Quick Templates (Optional)
                </label>
                <div className="space-y-2">
                  {REQUEST_TEMPLATES[formData.category as keyof typeof REQUEST_TEMPLATES].map((template, index) => (
                    <button
                      key={index}
                      type="button"
                      onClick={() => handleTemplateSelect(template)}
                      className="w-full text-left p-2 text-sm rounded border border-gray-300 dark:border-gray-600 hover:border-blue-500 dark:hover:border-blue-400 transition-colors"
                    >
                      {template}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Title */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Request Title *
              </label>
              <input
                type="text"
                required
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Brief description of the issue"
                className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm"
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Detailed Description *
              </label>
              <textarea
                required
                rows={4}
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Please provide detailed information about the issue, including when it started, any steps you've taken, etc."
                className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm"
              />
            </div>

            {/* Priority (if not emergency) */}
            {!formData.isEmergency && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Priority
                </label>
                <select
                  value={formData.priority}
                  onChange={(e) => setFormData(prev => ({ ...prev, priority: e.target.value as MaintenancePriority }))}
                  className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm"
                >
                  <option value="low">Low - Can wait a few days</option>
                  <option value="medium">Medium - Should be addressed within a week</option>
                  <option value="high">High - Needs attention within 24 hours</option>
                </select>
              </div>
            )}

            {/* Photo Upload */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Photos (Optional)
              </label>
              <div className="space-y-3">
                <div className="flex items-center space-x-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                    className="flex items-center"
                  >
                    <PhotoIcon className="w-4 h-4 mr-2" />
                    Add Photos
                  </Button>
                  <span className="text-sm text-gray-500">
                    Up to 5 photos, 10MB each
                  </span>
                </div>
                
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handlePhotoSelect}
                  className="hidden"
                />

                {/* Photo Previews */}
                {formData.photos.length > 0 && (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    {formData.photos.map((file, index) => (
                      <div key={index} className="relative group">
                        <img
                          src={URL.createObjectURL(file)}
                          alt={`Preview ${index + 1}`}
                          className="w-full h-24 object-cover rounded border"
                        />
                        <button
                          type="button"
                          onClick={() => removePhoto(index)}
                          className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Upload Progress */}
                {submitting && uploadProgress > 0 && (
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Form Actions */}
            <div className="flex flex-col sm:flex-row sm:justify-end space-y-2 sm:space-y-0 sm:space-x-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowSubmissionForm(false)}
                disabled={submitting}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={submitting}
                className="flex items-center"
              >
                {submitting ? (
                  <>
                    <LoadingSpinner size="sm" className="mr-2" />
                    {uploadProgress > 0 ? `Uploading... ${uploadProgress}%` : 'Submitting...'}
                  </>
                ) : (
                  <>
                    <DocumentArrowUpIcon className="w-4 h-4 mr-2" />
                    {formData.isEmergency ? 'Submit Emergency Request' : 'Submit Request'}
                  </>
                )}
              </Button>
            </div>
          </form>
        </Modal>

        {/* Photo Modal */}
        <Modal
          isOpen={showPhotoModal}
          onClose={() => setShowPhotoModal(false)}
          title="Request Photos"
          size="lg"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {selectedPhotos.map((photoUrl, index) => (
              <img
                key={index}
                src={photoUrl}
                alt={`Request photo ${index + 1}`}
                className="w-full h-64 object-cover rounded-lg border"
              />
            ))}
          </div>
        </Modal>

        {/* Communication Modal */}
        <Modal
          isOpen={!!selectedRequest}
          onClose={() => setSelectedRequest(null)}
          title={`Messages - ${selectedRequest?.title}`}
          size="lg"
        >
          {selectedRequest && (
            <div className="space-y-4">
              {/* Messages List */}
              <div className="max-h-64 overflow-y-auto space-y-3 border rounded-lg p-4">
                {messages.length === 0 ? (
                  <p className="text-gray-500 text-center">No messages yet</p>
                ) : (
                  messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex ${message.senderRole === 'tenant' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                          message.senderRole === 'tenant'
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white'
                        }`}
                      >
                        <p className="text-sm">{message.content}</p>
                        <p className={`text-xs mt-1 ${
                          message.senderRole === 'tenant' ? 'text-blue-100' : 'text-gray-500'
                        }`}>
                          {message.createdAt.toDate().toLocaleString()}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Message Input */}
              <div className="flex space-x-2">
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
          )}
        </Modal>

        {/* Rating Modal */}
        <Modal
          isOpen={showRatingModal}
          onClose={() => setShowRatingModal(false)}
          title="Rate Your Experience"
          size="md"
        >
          <div className="space-y-4">
            <div className="text-center">
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                How would you rate the service you received?
              </p>
              
              {/* Star Rating */}
              <div className="flex justify-center space-x-1 mb-4">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    className="text-2xl focus:outline-none"
                  >
                    {star <= rating ? (
                      <StarSolid className="w-8 h-8 text-yellow-400" />
                    ) : (
                      <StarIcon className="w-8 h-8 text-gray-300" />
                    )}
                  </button>
                ))}
              </div>
              
              {/* Comment */}
              <textarea
                value={ratingComment}
                onChange={(e) => setRatingComment(e.target.value)}
                placeholder="Share your feedback (optional)"
                rows={3}
                className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm"
              />
            </div>
            
            <div className="flex justify-end space-x-3">
              <Button
                variant="outline"
                onClick={() => setShowRatingModal(false)}
                disabled={submittingRating}
              >
                Cancel
              </Button>
              <Button
                onClick={handleSubmitRating}
                disabled={rating === 0 || submittingRating}
              >
                {submittingRating ? <LoadingSpinner size="sm" /> : 'Submit Rating'}
              </Button>
            </div>
          </div>
        </Modal>
      </div>
    </ErrorBoundary>
  );
};

export default TenantRequestHistory; 