import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext.jsx';
import { useNavigate, useLocation } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { 
  WrenchScrewdriverIcon, 
  PhotoIcon, 
  XMarkIcon,
  SparklesIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import Button from '../ui/Button';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage, callFunction } from '../../firebase/config';
import dataService from '../../services/dataService';

interface EnhancedMaintenanceFormProps {
  propertyId?: string;
  onSuccess?: () => void;
}

interface FormData {
  issueTitle: string;
  description: string;
  category: string;
  urgency: 'low' | 'medium' | 'high' | 'emergency';
  location: string;
  photos: File[];
  availabilityNotes: string;
}

const ISSUE_CATEGORIES = [
  { id: 'plumbing', label: 'Plumbing', icon: '🚿', keywords: ['leak', 'water', 'pipe', 'drain', 'faucet', 'toilet'] },
  { id: 'electrical', label: 'Electrical', icon: '⚡', keywords: ['light', 'power', 'outlet', 'switch', 'electric'] },
  { id: 'hvac', label: 'HVAC', icon: '❄️', keywords: ['heat', 'cold', 'air', 'temperature', 'thermostat', 'vent'] },
  { id: 'appliance', label: 'Appliance', icon: '🔌', keywords: ['refrigerator', 'stove', 'dishwasher', 'washer', 'dryer'] },
  { id: 'structural', label: 'Structural', icon: '🏗️', keywords: ['wall', 'door', 'window', 'floor', 'ceiling', 'crack'] },
  { id: 'pest', label: 'Pest Control', icon: '🐛', keywords: ['bug', 'pest', 'mice', 'roach', 'ant', 'insect'] },
  { id: 'other', label: 'Other', icon: '🔧', keywords: [] }
];

const URGENCY_LEVELS = [
  { id: 'low', label: 'Low Priority', desc: 'Can wait 1-2 weeks', color: 'text-green-600', bgColor: 'bg-green-50' },
  { id: 'medium', label: 'Normal', desc: 'Should be addressed within a week', color: 'text-blue-600', bgColor: 'bg-blue-50' },
  { id: 'high', label: 'High Priority', desc: 'Needs attention within 48 hours', color: 'text-orange-600', bgColor: 'bg-orange-50' },
  { id: 'emergency', label: 'Emergency', desc: 'Immediate attention required', color: 'text-red-600', bgColor: 'bg-red-50' }
];

const EnhancedMaintenanceForm: React.FC<EnhancedMaintenanceFormProps> = ({
  propertyId: propPropertyId,
  onSuccess
}) => {
  const { currentUser, userProfile } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  
  const [formData, setFormData] = useState<FormData>({
    issueTitle: '',
    description: '',
    category: '',
    urgency: 'medium',
    location: '',
    photos: [],
    availabilityNotes: ''
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [properties, setProperties] = useState<any[]>([]);
  const [selectedProperty, setSelectedProperty] = useState<any>(null);
  const [photoPreviewUrls, setPhotoPreviewUrls] = useState<string[]>([]);
  const [aiSuggestions, setAiSuggestions] = useState<{category: string, confidence: number}[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // Get property ID from props or route state
  const propertyId = propPropertyId || (location.state as { propertyId?: string } | null)?.propertyId;
  const isTestMode = (location.state as { testMode?: boolean } | null)?.testMode || propertyId === 'test-property-id';

  // Fetch properties on mount
  useEffect(() => {
    const fetchProperties = async () => {
      if (!currentUser) return;
      
      try {
        dataService.configure({ isDemoMode: false, currentUser });
        
        if (propertyId) {
          // Handle test mode with mock property
          if (isTestMode && propertyId === 'test-property-id') {
            const mockProperty = {
              id: 'test-property-id',
              name: 'Test Property',
              nickname: 'Test Property for Development',
              streetAddress: '123 Test Street',
              city: 'Test City',
              state: 'TS',
              zipCode: '12345'
            };
            setProperties([mockProperty]);
            setSelectedProperty(mockProperty);
            return;
          }
          
          // If we have a specific property ID, just fetch that one
          const property = await dataService.getPropertyById(propertyId);
          if (property) {
            setProperties([property]);
            setSelectedProperty(property);
          }
        } else if (userProfile?.propertyId) {
          // Use user's default property
          const property = await dataService.getPropertyById(userProfile.propertyId);
          if (property) {
            setProperties([property]);
            setSelectedProperty(property);
          }
        } else {
          // Fetch all available properties for tenant
          const allProperties = await dataService.getPropertiesForCurrentTenant();
          setProperties(allProperties);
          if (allProperties.length === 1) {
            setSelectedProperty(allProperties[0]);
          }
        }
      } catch (err) {
        console.error('Error fetching properties:', err);
        setError('Failed to load properties');
      }
    };

    fetchProperties();
  }, [currentUser, userProfile, propertyId, isTestMode]);

  // AI-powered category suggestion
  const suggestCategory = async (description: string, title: string) => {
    if (!description.trim() && !title.trim()) return;
    
    setIsAnalyzing(true);
    try {
      const combinedText = `${title} ${description}`.toLowerCase();
      const suggestions: {category: string, confidence: number}[] = [];
      
      // Simple keyword-based categorization (can be enhanced with AI later)
      ISSUE_CATEGORIES.forEach(category => {
        if (category.keywords.length === 0) return; // Skip 'other'
        
        const matches = category.keywords.filter(keyword => 
          combinedText.includes(keyword.toLowerCase())
        );
        
        if (matches.length > 0) {
          const confidence = (matches.length / category.keywords.length) * 100;
          suggestions.push({ category: category.id, confidence });
        }
      });
      
      // Sort by confidence and take top 2
      suggestions.sort((a, b) => b.confidence - a.confidence);
      setAiSuggestions(suggestions.slice(0, 2));
      
    } catch (err) {
      console.error('Error suggesting category:', err);
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Handle form field changes
  const handleChange = (field: keyof FormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Trigger AI suggestions when description or title changes
    if (field === 'description' || field === 'issueTitle') {
      const newFormData = { ...formData, [field]: value };
      suggestCategory(newFormData.description, newFormData.issueTitle);
    }
  };

  // Handle photo upload
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const maxSize = 5 * 1024 * 1024; // 5MB
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png'];
    
    const validFiles = files.filter(file => {
      if (file.size > maxSize) {
        toast.error(`${file.name} is too large. Max size is 5MB.`);
        return false;
      }
      if (!allowedTypes.includes(file.type)) {
        toast.error(`${file.name} is not a supported image type.`);
        return false;
      }
      return true;
    });

    const currentPhotos = formData.photos;
    if (currentPhotos.length + validFiles.length > 5) {
      toast.error('Maximum 5 photos allowed');
      return;
    }

    // Create preview URLs
    const newPreviewUrls = validFiles.map(file => URL.createObjectURL(file));
    setPhotoPreviewUrls(prev => [...prev, ...newPreviewUrls]);
    handleChange('photos', [...currentPhotos, ...validFiles]);
  };

  // Remove photo
  const removePhoto = (index: number) => {
    const newPhotos = [...formData.photos];
    const newPreviews = [...photoPreviewUrls];
    
    // Revoke object URL to free memory
    URL.revokeObjectURL(newPreviews[index]);
    
    newPhotos.splice(index, 1);
    newPreviews.splice(index, 1);
    
    handleChange('photos', newPhotos);
    setPhotoPreviewUrls(newPreviews);
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!currentUser) {
      setError('You must be logged in to submit a request');
      return;
    }
    
    if (!selectedProperty) {
      setError('Please select a property');
      return;
    }

    if (!formData.issueTitle.trim()) {
      setError('Please provide a title for the issue');
      return;
    }

    if (!formData.description.trim()) {
      setError('Please provide a description');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Log test mode but don't skip Firebase submission unless explicitly in demo mode
      if (isTestMode) {
        console.warn('Test mode detected but proceeding with real Firebase submission');
        console.log('demoMode=false - submitting real data to Firebase');
      }

      // Upload photos to Firebase Storage
      const photoUrls: string[] = [];
      
      for (const photo of formData.photos) {
        const storageRef = ref(storage, `maintenance/${currentUser.uid}/${Date.now()}_${photo.name}`);
        await uploadBytes(storageRef, photo);
        const downloadUrl = await getDownloadURL(storageRef);
        photoUrls.push(downloadUrl);
      }

      // Create maintenance ticket - save to 'tickets' collection
      const ticketData = {
        tenantId: currentUser.uid,
        tenantName: currentUser.displayName || 'Unknown Tenant',
        tenantEmail: currentUser.email || '',
        propertyId: selectedProperty.id,
        propertyName: selectedProperty.name || selectedProperty.nickname || 'Property',
        propertyAddress: `${selectedProperty.streetAddress || ''} ${selectedProperty.city || ''} ${selectedProperty.state || ''}`.trim() || 'Address not available',
        unitNumber: selectedProperty.unitNumber || '',
        issueTitle: formData.issueTitle.trim(),
        description: formData.description.trim(),
        category: formData.category || 'other',
        urgency: formData.urgency,
        priority: formData.urgency === 'emergency' ? 'urgent' : formData.urgency,
        location: formData.location.trim() || '',
        photos: photoUrls,
        availabilityNotes: formData.availabilityNotes.trim() || '',
        isEmergency: formData.urgency === 'emergency',
        status: 'pending_classification',
        submittedBy: currentUser.uid,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      console.log('🔄 Submitting to "tickets" collection:', ticketData);
      console.log('👤 Current user:', currentUser.uid);
      console.log('🏠 Property:', selectedProperty);

      const docRef = await addDoc(collection(db, 'tickets'), ticketData);
      
      console.log('✅ Document written with ID:', docRef.id);

      // Trigger AI classification if available
      try {
        console.log('🤖 Attempting to trigger AI classification for ticket:', docRef.id);
        await callFunction('classifyMaintenanceRequest', { ticketId: docRef.id });
        console.log('✅ AI classification triggered successfully');
      } catch (classificationError) {
        console.warn('⚠️ AI classification failed, but ticket was created:', classificationError);
      }

      toast.success('Maintenance request submitted successfully!');
      
      // Call onSuccess callback or navigate
      if (onSuccess) {
        onSuccess();
      } else {
        navigate('/tenant/dashboard', { 
          state: { showSuccessMessage: true }
        });
      }

    } catch (err: any) {
      console.error('❌ Error submitting maintenance request:', err);
      console.error('Error details:', {
        message: err?.message,
        code: err?.code,
        stack: err?.stack
      });
      
      let errorMessage = 'Failed to submit request. Please try again.';
      
      // Provide more specific error messages based on Firebase error codes
      if (err?.code) {
        switch (err.code) {
          case 'permission-denied':
            errorMessage = 'Permission denied. You may not have access to submit requests.';
            break;
          case 'unavailable':
            errorMessage = 'Firebase is temporarily unavailable. Please try again later.';
            break;
          case 'unauthenticated':
            errorMessage = 'Authentication required. Please log in again.';
            break;
          default:
            errorMessage = `Firebase error: ${err.message || 'Unknown error'}`;
        }
      }
      
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Clean up preview URLs on unmount
  useEffect(() => {
    return () => {
      photoPreviewUrls.forEach(url => URL.revokeObjectURL(url));
    };
  }, []);

  const getCategoryById = (id: string) => ISSUE_CATEGORIES.find(cat => cat.id === id);

  return (
    <div className="max-w-2xl mx-auto bg-white rounded-xl shadow-lg overflow-hidden">
      {/* Header */}
      <div className={`bg-gradient-to-r px-6 py-4 ${
        isTestMode ? 'from-yellow-500 to-yellow-600' : 'from-blue-500 to-blue-600'
      }`}>
        <h2 className="text-xl font-semibold text-white flex items-center">
          <WrenchScrewdriverIcon className="w-6 h-6 mr-2" />
          Submit Maintenance Request
          {isTestMode && (
            <span className="ml-2 px-2 py-1 bg-yellow-800 text-yellow-100 text-xs rounded-full">
              TEST MODE
            </span>
          )}
        </h2>
        <p className={`text-sm mt-1 ${
          isTestMode ? 'text-yellow-100' : 'text-blue-100'
        }`}>
          {isTestMode 
            ? 'This is a test environment for development purposes' 
            : 'Describe your issue and we\'ll get it resolved quickly'
          }
        </p>
      </div>

      <form onSubmit={handleSubmit} className="p-6 space-y-6">
        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-md">
            <div className="flex">
              <ExclamationTriangleIcon className="h-5 w-5 text-red-400" />
              <div className="ml-3">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Property Selection (if multiple available) */}
        {properties.length > 1 && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Property
            </label>
            <select
              value={selectedProperty?.id || ''}
              onChange={(e) => {
                const property = properties.find(p => p.id === e.target.value);
                setSelectedProperty(property);
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
            >
              <option value="">Select a property</option>
              {properties.map(property => (
                <option key={property.id} value={property.id}>
                  {property.name || property.nickname || property.streetAddress}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Issue Title */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Issue Title <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={formData.issueTitle}
            onChange={(e) => handleChange('issueTitle', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="Brief description of the issue"
            required
          />
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Detailed Description <span className="text-red-500">*</span>
          </label>
          <textarea
            value={formData.description}
            onChange={(e) => handleChange('description', e.target.value)}
            rows={4}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="Please provide as much detail as possible about the issue..."
            required
          />
          {isAnalyzing && (
            <div className="mt-2 flex items-center text-sm text-gray-500">
              <SparklesIcon className="w-4 h-4 mr-1 animate-pulse" />
              Analyzing description...
            </div>
          )}
        </div>

        {/* AI Category Suggestions */}
        {aiSuggestions.length > 0 && !formData.category && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="text-sm font-medium text-blue-800 mb-2 flex items-center">
              <SparklesIcon className="w-4 h-4 mr-1" />
              Suggested Categories
            </h4>
            <div className="flex gap-2">
              {aiSuggestions.map((suggestion, index) => {
                const category = getCategoryById(suggestion.category);
                return category ? (
                  <button
                    key={index}
                    type="button"
                    onClick={() => handleChange('category', suggestion.category)}
                    className="px-3 py-1 bg-white border border-blue-300 rounded-full text-sm hover:bg-blue-50 transition-colors"
                  >
                    {category.icon} {category.label}
                  </button>
                ) : null;
              })}
            </div>
          </div>
        )}

        {/* Category Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Category
          </label>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {ISSUE_CATEGORIES.map(category => (
              <button
                key={category.id}
                type="button"
                onClick={() => handleChange('category', category.id)}
                className={`p-3 border rounded-lg text-left transition-colors ${
                  formData.category === category.id
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                    : 'border-gray-300 hover:border-gray-400'
                }`}
              >
                <div className="text-lg mb-1">{category.icon}</div>
                <div className="text-sm font-medium">{category.label}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Urgency Level */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Urgency Level
          </label>
          <div className="space-y-2">
            {URGENCY_LEVELS.map(urgency => (
              <label
                key={urgency.id}
                className={`flex items-center p-3 border rounded-lg cursor-pointer transition-colors ${
                  formData.urgency === urgency.id
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-300 hover:border-gray-400'
                }`}
              >
                <input
                  type="radio"
                  name="urgency"
                  value={urgency.id}
                  checked={formData.urgency === urgency.id}
                  onChange={(e) => handleChange('urgency', e.target.value)}
                  className="sr-only"
                />
                <div className={`w-3 h-3 rounded-full mr-3 ${
                  formData.urgency === urgency.id ? 'bg-blue-500' : 'bg-gray-300'
                }`} />
                <div className="flex-1">
                  <div className={`font-medium ${urgency.color}`}>{urgency.label}</div>
                  <div className="text-sm text-gray-500">{urgency.desc}</div>
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* Location */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Location (Optional)
          </label>
          <input
            type="text"
            value={formData.location}
            onChange={(e) => handleChange('location', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="e.g., Kitchen, Bedroom, Bathroom"
          />
        </div>

        {/* Photo Upload */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Photos ({formData.photos.length}/5)
          </label>
          
          {photoPreviewUrls.length > 0 && (
            <div className="grid grid-cols-3 gap-3 mb-3">
              {photoPreviewUrls.map((url, index) => (
                <div key={index} className="relative">
                  <img
                    src={url}
                    alt={`Preview ${index + 1}`}
                    className="w-full h-24 object-cover rounded-lg"
                  />
                  <button
                    type="button"
                    onClick={() => removePhoto(index)}
                    className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors"
                  >
                    <XMarkIcon className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
          
          {formData.photos.length < 5 && (
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors">
              <input
                type="file"
                multiple
                accept="image/jpeg,image/jpg,image/png"
                onChange={handlePhotoUpload}
                className="hidden"
                id="photo-upload"
              />
              <label htmlFor="photo-upload" className="cursor-pointer">
                <PhotoIcon className="w-12 h-12 mx-auto text-gray-400 mb-3" />
                <p className="text-sm text-gray-600">
                  Click to upload photos or drag and drop
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  JPG, PNG up to 5MB each (max 5 photos)
                </p>
              </label>
            </div>
          )}
        </div>

        {/* Availability Notes */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Availability Notes (Optional)
          </label>
          <textarea
            value={formData.availabilityNotes}
            onChange={(e) => handleChange('availabilityNotes', e.target.value)}
            rows={2}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="Let us know when you're available for repairs..."
          />
        </div>

        {/* Submit Button */}
        <div className="flex gap-3 pt-4">
          <Button
            type="button"
            variant="secondary"
            onClick={() => navigate(-1)}
            className="flex-1"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            isLoading={loading}
            disabled={!selectedProperty || !formData.issueTitle.trim() || !formData.description.trim()}
            className="flex-1"
          >
            {loading ? 'Submitting...' : 'Submit Request'}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default EnhancedMaintenanceForm; 