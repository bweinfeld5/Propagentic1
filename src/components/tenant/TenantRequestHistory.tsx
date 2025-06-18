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
import { MaintenanceRequest, MaintenanceStatus, MaintenancePriority, MaintenanceCategory } from '../../models';
import { CommunicationMessage } from '../../models';

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
  { id: 'appliance', label: 'Appliance', icon: '🏠' },
  { id: 'structural', label: 'Structural', icon: '🏗️' },
  { id: 'cosmetic', label: 'Cosmetic', icon: '🎨' },
  { id: 'security', label: 'Security', icon: '🔒' },
  { id: 'other', label: 'Other', icon: '🔨' }
];

const REQUEST_TEMPLATES: Record<string, string[]> = {
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
  appliance: [
    'Refrigerator not cooling',
    'Washer not draining',
    'Dryer not heating',
    'Dishwasher not cleaning dishes'
  ],
  other: [
    'General inquiry',
  ]
};

const TenantRequestHistory: React.FC<TenantRequestHistoryProps> = ({ 
  className = '', 
  propertyId 
}) => {
  const { user } = useAuth();
  const { showSuccess, showError, showInfo } = useActionFeedback();
  
  const [requests, setRequests] = useState<MaintenanceRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  
  const [showSubmissionForm, setShowSubmissionForm] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<MaintenanceRequest | null>(null);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<MaintenanceStatus | 'all'>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  
  const [formData, setFormData] = useState<RequestSubmissionData>({
    title: '',
    description: '',
    category: '',
    priority: 'medium',
    photos: [],
    isEmergency: false
  });
  
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  
  const [messages, setMessages] = useState<CommunicationMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  
  const [rating, setRating] = useState(0);
  const [ratingComment, setRatingComment] = useState('');
  
  const [unsubscribe, setUnsubscribe] = useState<(() => void) | null>(null);

  useEffect(() => {
    if (!user?.uid) return;

    const setupListeners = async () => {
      try {
        setLoading(true);
        const unsubscribeFn = await maintenanceService.subscribeToTenantRequests(
          user.uid,
          (updatedRequests: MaintenanceRequest[]) => {
            setRequests(updatedRequests);
          },
          (error: Error) => {
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
      if (unsubscribe) unsubscribe();
    };
  }, [user?.uid, showError]);

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
      
      const requestData = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        category: formData.category as MaintenanceCategory,
        priority: formData.isEmergency ? 'urgent' : formData.priority,
        tenantId: user.uid,
        tenantName: user.displayName || 'N/A',
        tenantEmail: user.email || 'N/A',
        propertyId: propertyId,
        propertyName: 'N/A',
        propertyAddress: 'N/A',
        isEmergency: formData.isEmergency
      };
      
      const newRequest = await maintenanceService.createMaintenanceRequest(requestData);
      
      if (formData.photos.length > 0) {
        await maintenanceService.uploadProgressPhotos(
          newRequest.id,
          formData.photos,
          (progress: number) => setUploadProgress(progress)
        );
      }
      
      setShowSubmissionForm(false);
      setFormData({ title: '', description: '', category: '', priority: 'medium', photos: [], isEmergency: false });
      showSuccess('Maintenance request submitted successfully!');

    } catch (error) {
      console.error('Error submitting request:', error);
      showError('Failed to submit request');
    } finally {
      setSubmitting(false);
    }
  };
  
  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedRequest) return;

    try {
      await communicationService.addMessage(selectedRequest.id, {
        content: newMessage.trim(),
        senderId: user!.uid,
        senderRole: 'tenant',
        senderName: user!.displayName || 'Tenant',
      });
      setNewMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
      showError('Failed to send message');
    }
  };

  const handleSubmitRating = async () => {
    if (rating === 0 || !selectedRequest) return;
    try {
      await maintenanceService.submitRating(selectedRequest.id, {
        rating,
        comment: ratingComment.trim(),
        tenantId: user!.uid,
      });
      showSuccess('Rating submitted. Thank you!');
    } catch (error) {
      console.error('Error submitting rating:', error);
      showError('Failed to submit rating');
    }
  };

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newPhotos = Array.from(e.target.files);
      if (formData.photos.length + newPhotos.length > 5) {
        showError('You can upload a maximum of 5 photos.');
        return;
      }
      setFormData(prev => ({ ...prev, photos: [...prev.photos, ...newPhotos] }));
    }
  };

  const removePhoto = (index: number) => {
    setFormData(prev => ({ ...prev, photos: prev.photos.filter((_, i) => i !== index) }));
  };

  const handleTemplateSelect = (template: string) => {
    setFormData(prev => ({ ...prev, title: template }));
  };

  const getStatusColor = (status: MaintenancePriority) => {
    switch (status) {
      case 'urgent': return 'bg-red-500';
      case 'high': return 'bg-yellow-500';
      case 'medium': return 'bg-blue-500';
      case 'low': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  return (
    <div className={`p-4 ${className}`}>
      {/* ... JSX ... */}
    </div>
  );
};

export default TenantRequestHistory; 