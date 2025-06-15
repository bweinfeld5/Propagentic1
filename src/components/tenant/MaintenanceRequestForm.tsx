import React, { useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { db, storage, callFunction } from '../../firebase/config';
import { collection, addDoc, serverTimestamp, getDocs, doc, getDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { toast } from 'react-hot-toast';
import { 
  CameraIcon, 
  XMarkIcon, 
  ExclamationTriangleIcon,
  ClockIcon,
  WrenchScrewdriverIcon,
  PhotoIcon,
  SparklesIcon
} from '@heroicons/react/24/outline';

// Types and interfaces
interface FormData {
  issueTitle: string;
  description: string;
  urgency: 'low' | 'medium' | 'high' | 'emergency';
  category: string;
  location: string;
  bestTimeToContact: string;
  accessInstructions: string;
  unitNumber: string;
  propertyId: string;
}

interface PhotoFile {
  file: File;
  preview: string;
  id: string;
}

interface Property {
  id: string;
  name: string;
  units?: Array<{ number: string; description?: string }>;
}

interface AIAnalysis {
  issueType: string;
  suggestedTitle: string;
  suggestedUrgency: string;
  suggestedContractorType: string;
  reasoning: string;
}

// Constants
const CATEGORIES = [
  { id: 'plumbing', label: 'Plumbing', icon: '🔧', description: 'Leaks, clogs, water issues' },
  { id: 'electrical', label: 'Electrical', icon: '⚡', description: 'Outlets, lights, wiring' },
  { id: 'hvac', label: 'HVAC', icon: '❄️', description: 'Heating, cooling, ventilation' },
  { id: 'appliance', label: 'Appliances', icon: '🏠', description: 'Washer, dryer, dishwasher' },
  { id: 'structural', label: 'Structural', icon: '🏗️', description: 'Walls, floors, ceilings' },
  { id: 'pest_control', label: 'Pest Control', icon: '🐛', description: 'Insects, rodents' },
  { id: 'security', label: 'Security', icon: '🔒', description: 'Locks, doors, windows' },
  { id: 'landscaping', label: 'Landscaping', icon: '🌱', description: 'Yard, garden maintenance' },
  { id: 'general', label: 'General', icon: '🔨', description: 'Other maintenance issues' }
];

const URGENCY_LEVELS = [
  { 
    id: 'low', 
    label: 'Low Priority', 
    description: 'Can wait a few days - not urgent',
    color: 'bg-green-100 text-green-800 border-green-200',
    icon: <ClockIcon className="w-4 h-4" />
  },
  { 
    id: 'medium', 
    label: 'Medium Priority', 
    description: 'Should be addressed within 2-3 days',
    color: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    icon: <WrenchScrewdriverIcon className="w-4 h-4" />
  },
  { 
    id: 'high', 
    label: 'High Priority', 
    description: 'Needs immediate attention within 24 hours',
    color: 'bg-red-100 text-red-800 border-red-200',
    icon: <ExclamationTriangleIcon className="w-4 h-4" />
  },
  { 
    id: 'emergency', 
    label: 'Emergency', 
    description: 'Safety hazard - immediate response required',
    color: 'bg-red-200 text-red-900 border-red-300',
    icon: <ExclamationTriangleIcon className="w-4 h-4" />
  }
];

const COMMON_ISSUES = [
  'Leaking faucet or pipes',
  'Clogged drain or toilet',
  'Electrical outlet not working',
  'Light fixture needs repair',
  'Air conditioning not working',
  'Heating not working',
  'Appliance malfunction',
  'Door lock issues',
  'Window won\'t open/close',
  'Pest control needed'
];

const CONTACT_TIMES = [
  { value: '', label: 'Select preferred time' },
  { value: 'morning', label: 'Morning (8 AM - 12 PM)' },
  { value: 'afternoon', label: 'Afternoon (12 PM - 5 PM)' },
  { value: 'evening', label: 'Evening (5 PM - 8 PM)' },
  { value: 'anytime', label: 'Anytime during business hours' },
  { value: 'weekend', label: 'Weekends only' }
];

// Validation constants
const MAX_DESCRIPTION_LENGTH = 1000;
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const MAX_PHOTOS = 5;
const ALLOWED_FILE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'];

const MaintenanceRequestForm: React.FC = () => {
  const { currentUser, userProfile } = useAuth();
  const navigate = useNavigate();

  // Form state
  const [formData, setFormData] = useState<FormData>({
    issueTitle: '',
    description: '',
    urgency: 'medium',
    category: '',
    location: '',
    bestTimeToContact: '',
    accessInstructions: '',
    unitNumber: '',
    propertyId: ''
  });

  // UI state
  const [photos, setPhotos] = useState<PhotoFile[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);
  const [units, setUnits] = useState<Array<{ number: string; description?: string }>>([]);
  const [loading, setLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [dragActive, setDragActive] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState<AIAnalysis | null>(null);
  const [aiLoading, setAiLoading] = useState(false);

  // Fetch properties and units
  useEffect(() => {
    const fetchPropertiesAndUnits = async () => {
      try {
        if (userProfile?.propertyId && userProfile?.unitNumber) {
          // If tenant has assigned property/unit, use that
          const propertyRef = doc(db, 'properties', userProfile.propertyId);
          const propertyDoc = await getDoc(propertyRef);
          
          if (propertyDoc.exists()) {
            const propertyData = { id: propertyDoc.id, ...propertyDoc.data() } as Property;
            setProperties([propertyData]);
            setFormData(prev => ({
              ...prev,
              propertyId: propertyDoc.id,
              unitNumber: userProfile.unitNumber
            }));
            
            if (propertyData.units) {
              setUnits(propertyData.units);
            }
          }
        } else {
          // Fetch all properties (for testing or unassigned tenants)
          const propertiesSnap = await getDocs(collection(db, 'properties'));
          const propertiesList = propertiesSnap.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          })) as Property[];
          
          setProperties(propertiesList);
          
          if (propertiesList.length > 0) {
            setFormData(prev => ({
              ...prev,
              propertyId: propertiesList[0].id
            }));
            
            if (propertiesList[0].units) {
              setUnits(propertiesList[0].units);
            }
          }
        }
      } catch (error) {
        console.error("Error fetching properties:", error);
        toast.error("Could not load properties. Please try again later.");
      }
    };
    
    fetchPropertiesAndUnits();
  }, [userProfile]);

  // Update units when property changes
  useEffect(() => {
    if (formData.propertyId) {
      const selectedProperty = properties.find(p => p.id === formData.propertyId);
      if (selectedProperty?.units) {
        setUnits(selectedProperty.units);
        
        // If current unit is not in the new property, reset it
        if (selectedProperty.units.length > 0 && 
            !selectedProperty.units.some(u => u.number === formData.unitNumber)) {
          setFormData(prev => ({
            ...prev,
            unitNumber: selectedProperty.units![0].number
          }));
        }
      } else {
        setUnits([]);
      }
    }
  }, [formData.propertyId, properties]);

  // Validation
  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.issueTitle.trim()) {
      newErrors.issueTitle = 'Issue title is required';
    } else if (formData.issueTitle.length < 10) {
      newErrors.issueTitle = 'Please provide a more descriptive title (minimum 10 characters)';
    }
    
    if (!formData.description.trim()) {
      newErrors.description = 'Description is required';
    } else if (formData.description.length < 20) {
      newErrors.description = 'Please provide more details (minimum 20 characters)';
    }
    
    if (!formData.category) {
      newErrors.category = 'Please select a category';
    }
    
    if (!formData.propertyId) {
      newErrors.propertyId = 'Please select a property';
    }
    
    if (!formData.unitNumber) {
      newErrors.unitNumber = 'Please select a unit';
    }
    
    if (photos.some(photo => photo.file.size > MAX_FILE_SIZE)) {
      newErrors.photos = `Each photo must be smaller than ${MAX_FILE_SIZE / 1024 / 1024}MB`;
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Input sanitization
  const sanitizeText = (text: string) => {
    return text
      .replace(/<(|\/|[^>\/bi]|\/[^>bi]|[^\/>][^>]+|\/[^>][^>]+)>/g, '')
      .trim();
  };

  // Form field changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  // Handle photo upload via file input
  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      handleNewFiles(newFiles);
    }
  };

  // Handle new files (from input or drag)
  const handleNewFiles = (newFiles: File[]) => {
    const validFiles: PhotoFile[] = [];
    
    newFiles.forEach(file => {
      // Check file type
      if (!ALLOWED_FILE_TYPES.includes(file.type.toLowerCase())) {
        toast.error(`${file.name} is not a supported image type`);
        return;
      }
      
      // Check file size
      if (file.size > MAX_FILE_SIZE) {
        toast.error(`${file.name} is too large (max ${MAX_FILE_SIZE / 1024 / 1024}MB)`);
        return;
      }
      
      validFiles.push({
        file,
        preview: URL.createObjectURL(file),
        id: `${Date.now()}-${Math.random()}`
      });
    });
    
    if (photos.length + validFiles.length > MAX_PHOTOS) {
      toast.error(`Maximum ${MAX_PHOTOS} photos allowed`);
      return;
    }
    
    setPhotos(prev => [...prev, ...validFiles]);
  };

  // Drag and drop handlers
  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const droppedFiles = Array.from(e.dataTransfer.files);
      handleNewFiles(droppedFiles);
    }
  }, [photos.length]);

  // Remove photo
  const removePhoto = (id: string) => {
    setPhotos(prev => {
      const photoToRemove = prev.find(p => p.id === id);
      if (photoToRemove) {
        URL.revokeObjectURL(photoToRemove.preview);
      }
      return prev.filter(p => p.id !== id);
    });
  };

  // Quick fill common issue
  const fillCommonIssue = (issue: string) => {
    setFormData(prev => ({
      ...prev,
      issueTitle: issue,
      description: prev.description || `I'm experiencing an issue with ${issue.toLowerCase()}. Please help resolve this.`
    }));
  };

  // AI Analysis
  const analyzeWithAI = async () => {
    if (!formData.description.trim()) {
      toast.error("Please provide a description for AI analysis");
      return;
    }
    
    setAiLoading(true);
    
    try {
      const result = await callFunction('analyzeMaintenanceRequest', {
        description: formData.description,
        title: formData.issueTitle
      });
      
      if (result.success) {
        setAiAnalysis(result.analysis);
        toast.success("AI analysis complete!");
      } else {
        toast.error(result.error || "AI analysis failed. Please try again.");
      }
    } catch (error) {
      console.error("Error analyzing with AI:", error);
      toast.error("AI analysis failed. Please try again or submit without analysis.");
    } finally {
      setAiLoading(false);
    }
  };

  // Accept AI suggestions
  const acceptAiSuggestions = () => {
    if (aiAnalysis) {
      setFormData(prev => ({
        ...prev,
        issueTitle: aiAnalysis.suggestedTitle || prev.issueTitle,
        urgency: (aiAnalysis.suggestedUrgency as FormData['urgency']) || prev.urgency
      }));
      toast.success("AI suggestions applied!");
    }
  };

  // Upload photos to Firebase Storage
  const uploadPhotos = async (files: PhotoFile[]): Promise<string[]> => {
    if (files.length === 0) return [];
    
    const uploadPromises = files.map(async (photoFile, index) => {
      const timestamp = Date.now();
      const fileName = `${timestamp}-${index}-${photoFile.file.name}`;
      const fileRef = ref(storage, `maintenance-requests/${currentUser?.uid}/${fileName}`);
      
      await uploadBytes(fileRef, photoFile.file);
      const downloadURL = await getDownloadURL(fileRef);
      
      // Update progress
      setUploadProgress(Math.round(((index + 1) / files.length) * 100));
      
      return downloadURL;
    });
    
    return Promise.all(uploadPromises);
  };

  // Submit form
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast.error('Please fix the errors below');
      return;
    }
    
    if (!currentUser) {
      toast.error("You must be logged in to submit a maintenance request");
      return;
    }
    
    setLoading(true);
    setUploadProgress(0);
    
    try {
      // Upload photos first
      const photoURLs = photos.length > 0 ? await uploadPhotos(photos) : [];
      
      // Prepare request data
      const requestData = {
        // Basic info
        issueTitle: sanitizeText(formData.issueTitle),
        description: sanitizeText(formData.description),
        urgency: formData.urgency,
        category: formData.category,
        location: sanitizeText(formData.location),
        
        // Contact preferences
        bestTimeToContact: formData.bestTimeToContact,
        accessInstructions: sanitizeText(formData.accessInstructions),
        
        // Property info
        propertyId: formData.propertyId,
        propertyName: properties.find(p => p.id === formData.propertyId)?.name || 'Unknown Property',
        unitNumber: formData.unitNumber,
        
        // User info
        tenantId: currentUser.uid,
        tenantName: userProfile?.name || userProfile?.fullName || currentUser.displayName || currentUser.email,
        tenantEmail: currentUser.email,
        tenantPhone: userProfile?.phone || null,
        
        // Media
        photoUrls: photoURLs,
        photoUrl: photoURLs[0] || null, // For backwards compatibility
        photosCount: photoURLs.length,
        
        // Status and timestamps
        status: 'pending_classification',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        
        // AI analysis if available
        aiAnalysis: aiAnalysis,
        
        // Additional metadata
        submissionMethod: 'unified_form',
        userAgent: navigator.userAgent,
        
        // Updates history
        updates: [{
          timestamp: new Date().toISOString(),
          status: 'pending_classification',
          message: 'Maintenance request created and awaiting AI classification',
          userId: currentUser.uid,
          userRole: 'tenant'
        }]
      };
      
      // Submit to Firestore
      const docRef = await addDoc(collection(db, 'tickets'), requestData);
      
      // Trigger AI classification and contractor assignment
      try {
        await callFunction('processMaintenanceRequest', {
          requestId: docRef.id,
          data: requestData
        });
      } catch (functionError) {
        console.warn("AI processing failed, but request was submitted:", functionError);
      }
      
      // Success feedback
      toast.success('Maintenance request submitted successfully! You\'ll receive updates via email.');
      
      // Reset form
      setFormData({
        issueTitle: '',
        description: '',
        urgency: 'medium',
        category: '',
        location: '',
        bestTimeToContact: '',
        accessInstructions: '',
        unitNumber: '',
        propertyId: properties.length > 0 ? properties[0].id : ''
      });
      
      // Clean up photo previews
      photos.forEach(photo => URL.revokeObjectURL(photo.preview));
      setPhotos([]);
      setAiAnalysis(null);
      setErrors({});
      setUploadProgress(0);
      
      // Navigate to requests list after delay
      setTimeout(() => {
        navigate('/maintenance/my-requests');
      }, 2000);
      
    } catch (error) {
      console.error('Error submitting maintenance request:', error);
      toast.error('Failed to submit request. Please try again.');
    } finally {
      setLoading(false);
      setUploadProgress(0);
    }
  };

  // Clean up previews on unmount
  React.useEffect(() => {
    return () => {
      photos.forEach(photo => URL.revokeObjectURL(photo.preview));
    };
  }, [photos]);

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white rounded-lg shadow-lg overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-teal-600 to-teal-700 px-6 py-4">
          <h1 className="text-2xl font-bold text-white flex items-center">
            <WrenchScrewdriverIcon className="w-6 h-6 mr-2" />
            Submit Maintenance Request
          </h1>
          <p className="text-teal-100 text-sm mt-1">
            {properties.find(p => p.id === formData.propertyId)?.name && 
             `Property: ${properties.find(p => p.id === formData.propertyId)?.name}`}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Quick Actions */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Common Issues (Click to quick-fill)
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {COMMON_ISSUES.slice(0, 6).map((issue) => (
                <button
                  key={issue}
                  type="button"
                  onClick={() => fillCommonIssue(issue)}
                  className="text-left px-3 py-2 text-sm border border-gray-200 rounded-md hover:bg-gray-50 hover:border-gray-300 transition-colors"
                  disabled={loading}
                >
                  {issue}
                </button>
              ))}
            </div>
          </div>

          {/* Property and Unit Selection */}
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <div>
              <label htmlFor="propertyId" className="block text-sm font-medium text-gray-700 mb-1">
                Property <span className="text-red-500">*</span>
              </label>
              <select
                id="propertyId"
                name="propertyId"
                value={formData.propertyId}
                onChange={handleChange}
                className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 ${
                  errors.propertyId ? 'border-red-300' : 'border-gray-300'
                }`}
                disabled={userProfile?.propertyId || loading}
                required
              >
                <option value="">Select a property</option>
                {properties.map(property => (
                  <option key={property.id} value={property.id}>
                    {property.name}
                  </option>
                ))}
              </select>
              {errors.propertyId && (
                <p className="mt-1 text-sm text-red-600">{errors.propertyId}</p>
              )}
            </div>
            
            <div>
              <label htmlFor="unitNumber" className="block text-sm font-medium text-gray-700 mb-1">
                Unit Number <span className="text-red-500">*</span>
              </label>
              <select
                id="unitNumber"
                name="unitNumber"
                value={formData.unitNumber}
                onChange={handleChange}
                className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 ${
                  errors.unitNumber ? 'border-red-300' : 'border-gray-300'
                }`}
                disabled={userProfile?.unitNumber || loading}
                required
              >
                <option value="">Select a unit</option>
                {units.map(unit => (
                  <option key={unit.number} value={unit.number}>
                    {unit.number} {unit.description ? `- ${unit.description}` : ''}
                  </option>
                ))}
              </select>
              {errors.unitNumber && (
                <p className="mt-1 text-sm text-red-600">{errors.unitNumber}</p>
              )}
            </div>
          </div>

          {/* Issue Title */}
          <div>
            <label htmlFor="issueTitle" className="block text-sm font-medium text-gray-700 mb-1">
              Issue Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="issueTitle"
              name="issueTitle"
              value={formData.issueTitle}
              onChange={handleChange}
              className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 ${
                errors.issueTitle ? 'border-red-300' : 'border-gray-300'
              }`}
              placeholder="e.g., Kitchen faucet is leaking constantly"
              disabled={loading}
              required
            />
            {errors.issueTitle && (
              <p className="mt-1 text-sm text-red-600">{errors.issueTitle}</p>
            )}
          </div>

          {/* Category Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Category <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-5 gap-2">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, category: cat.id }))}
                  className={`p-3 text-center border rounded-lg transition-colors ${
                    formData.category === cat.id
                      ? 'border-teal-500 bg-teal-50 text-teal-700'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  disabled={loading}
                >
                  <div className="text-lg mb-1">{cat.icon}</div>
                  <div className="text-xs font-medium">{cat.label}</div>
                  <div className="text-xs text-gray-500">{cat.description}</div>
                </button>
              ))}
            </div>
            {errors.category && (
              <p className="mt-1 text-sm text-red-600">{errors.category}</p>
            )}
          </div>

          {/* Description */}
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
              Detailed Description <span className="text-red-500">*</span>
            </label>
            <textarea
              id="description"
              name="description"
              rows={4}
              value={formData.description}
              onChange={handleChange}
              className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 ${
                errors.description ? 'border-red-300' : 'border-gray-300'
              }`}
              placeholder="Please provide detailed information about the issue, when it started, and any relevant circumstances..."
              disabled={loading}
              maxLength={MAX_DESCRIPTION_LENGTH}
              required
            />
            <div className="mt-1 flex justify-between items-center">
              <p className={`text-xs ${formData.description.length > MAX_DESCRIPTION_LENGTH * 0.8 ? 'text-orange-500' : 'text-gray-500'}`}>
                {formData.description.length}/{MAX_DESCRIPTION_LENGTH} characters (minimum 20)
              </p>
              {errors.description && (
                <p className="text-sm text-red-600">{errors.description}</p>
              )}
            </div>
          </div>

          {/* Urgency Level */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Urgency Level <span className="text-red-500">*</span>
            </label>
            <div className="space-y-2">
              {URGENCY_LEVELS.map((level) => (
                <label
                  key={level.id}
                  className={`flex items-center p-3 border rounded-lg cursor-pointer transition-colors ${
                    formData.urgency === level.id
                      ? 'border-teal-500 bg-teal-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <input
                    type="radio"
                    name="urgency"
                    value={level.id}
                    checked={formData.urgency === level.id}
                    onChange={handleChange}
                    className="sr-only"
                    disabled={loading}
                  />
                  <div className="flex items-center space-x-3">
                    <div className={`flex items-center justify-center w-8 h-8 rounded-full border ${level.color}`}>
                      {level.icon}
                    </div>
                    <div>
                      <div className="font-medium text-gray-900">{level.label}</div>
                      <div className="text-sm text-gray-500">{level.description}</div>
                    </div>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Location */}
          <div>
            <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-1">
              Specific Location in Unit
            </label>
            <input
              type="text"
              id="location"
              name="location"
              value={formData.location}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
              placeholder="e.g., Master bathroom, Kitchen sink, Living room"
              disabled={loading}
            />
          </div>

          {/* Best Time to Contact */}
          <div>
            <label htmlFor="bestTimeToContact" className="block text-sm font-medium text-gray-700 mb-1">
              Best Time to Contact You
            </label>
            <select
              id="bestTimeToContact"
              name="bestTimeToContact"
              value={formData.bestTimeToContact}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
              disabled={loading}
            >
              {CONTACT_TIMES.map(time => (
                <option key={time.value} value={time.value}>
                  {time.label}
                </option>
              ))}
            </select>
          </div>

          {/* Access Instructions */}
          <div>
            <label htmlFor="accessInstructions" className="block text-sm font-medium text-gray-700 mb-1">
              Access Instructions (Optional)
            </label>
            <textarea
              id="accessInstructions"
              name="accessInstructions"
              rows={2}
              value={formData.accessInstructions}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
              placeholder="Any special instructions for accessing your unit..."
              disabled={loading}
            />
          </div>

          {/* Photo Upload with Drag & Drop */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Photos (Optional, max {MAX_PHOTOS})
            </label>
            <div
              {...(loading ? {} : {
                onDragEnter: handleDrag,
                onDragLeave: handleDrag,
                onDragOver: handleDrag,
                onDrop: handleDrop
              })}
              className={`mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-dashed rounded-md transition-colors ${
                dragActive 
                  ? 'border-teal-500 bg-teal-50' 
                  : 'border-gray-300 hover:border-gray-400'
              }`}
            >
              <div className="space-y-1 text-center">
                <PhotoIcon className="mx-auto h-12 w-12 text-gray-400" />
                <div className="flex text-sm text-gray-600">
                  <label
                    htmlFor="photo-upload"
                    className="relative cursor-pointer bg-white rounded-md font-medium text-teal-600 hover:text-teal-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-teal-500"
                  >
                    <span>Upload photos</span>
                    <input
                      id="photo-upload"
                      name="photos"
                      type="file"
                      className="sr-only"
                      multiple
                      accept={ALLOWED_FILE_TYPES.join(',')}
                      onChange={handlePhotoChange}
                      disabled={loading}
                    />
                  </label>
                  <p className="pl-1">or drag and drop</p>
                </div>
                <p className="text-xs text-gray-500">
                  PNG, JPG, GIF up to {MAX_FILE_SIZE / 1024 / 1024}MB each
                </p>
              </div>
            </div>
            
            {errors.photos && (
              <p className="mt-1 text-sm text-red-600">{errors.photos}</p>
            )}

            {/* Photo Previews */}
            {photos.length > 0 && (
              <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
                {photos.map((photo) => (
                  <div key={photo.id} className="relative group">
                    <img
                      src={photo.preview}
                      alt="Preview"
                      className="h-24 w-full object-cover rounded-md border border-gray-300"
                    />
                    <button
                      type="button"
                      onClick={() => removePhoto(photo.id)}
                      className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                      disabled={loading}
                    >
                      <XMarkIcon className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* AI Analysis Section */}
          <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-medium text-gray-900 flex items-center">
                <SparklesIcon className="w-5 h-5 mr-2 text-teal-600" />
                AI Analysis
              </h3>
              <button
                type="button"
                className={`inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm ${
                  aiLoading
                    ? 'bg-gray-300 cursor-not-allowed'
                    : 'text-white bg-teal-600 hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500'
                }`}
                onClick={analyzeWithAI}
                disabled={aiLoading || loading || !formData.description.trim()}
              >
                {aiLoading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Analyzing...
                  </>
                ) : (
                  'Analyze with AI'
                )}
              </button>
            </div>
            
            {aiAnalysis && (
              <div className="bg-white p-4 rounded-md shadow-sm">
                <h4 className="font-medium text-gray-900 mb-3">AI Suggestions:</h4>
                <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Issue Type</dt>
                    <dd className="mt-1 text-sm text-gray-900">{aiAnalysis.issueType}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Suggested Title</dt>
                    <dd className="mt-1 text-sm text-gray-900">{aiAnalysis.suggestedTitle}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Suggested Urgency</dt>
                    <dd className="mt-1 text-sm text-gray-900">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        URGENCY_LEVELS.find(u => u.id === aiAnalysis.suggestedUrgency)?.color || 'bg-gray-100'
                      }`}>
                        {aiAnalysis.suggestedUrgency?.toUpperCase()}
                      </span>
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Suggested Contractor</dt>
                    <dd className="mt-1 text-sm text-gray-900">{aiAnalysis.suggestedContractorType}</dd>
                  </div>
                </dl>
                <div className="mt-4">
                  <dt className="text-sm font-medium text-gray-500">AI Analysis</dt>
                  <dd className="mt-1 text-sm text-gray-900">{aiAnalysis.reasoning}</dd>
                </div>
                
                <div className="mt-4">
                  <button
                    type="button"
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-teal-600 hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500"
                    onClick={acceptAiSuggestions}
                    disabled={loading}
                  >
                    Accept AI Suggestions
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Upload Progress */}
          {loading && uploadProgress > 0 && (
            <div className="w-full">
              <div className="text-xs font-semibold inline-block text-teal-600 mb-1">
                Uploading photos: {uploadProgress}%
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2.5">
                <div 
                  className="bg-teal-600 h-2.5 rounded-full transition-all duration-300 ease-in-out"
                  style={{ width: `${uploadProgress}%` }}
                ></div>
              </div>
            </div>
          )}

          {/* Submit Button */}
          <div className="pt-5">
            <div className="flex justify-end space-x-3">
              <button
                type="button"
                className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500"
                onClick={() => navigate(-1)}
                disabled={loading}
              >
                Cancel
              </button>
              <button
                type="submit"
                className={`inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white ${
                  loading
                    ? 'bg-teal-400 cursor-not-allowed'
                    : 'bg-teal-600 hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500'
                }`}
                disabled={loading}
              >
                {loading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Submitting...
                  </>
                ) : (
                  'Submit Maintenance Request'
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default MaintenanceRequestForm;