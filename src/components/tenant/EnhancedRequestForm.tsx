import React, { useState, useCallback } from 'react';
import { db, storage } from '../../firebase/config';
import { collection, addDoc, serverTimestamp, doc, getDoc, updateDoc, arrayUnion } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { toast } from 'react-hot-toast';
import { 
  CameraIcon, 
  XMarkIcon, 
  ExclamationTriangleIcon,
  ClockIcon,
  WrenchScrewdriverIcon,
  PhotoIcon
} from '@heroicons/react/24/outline';
import Button from '../ui/Button';

interface User {
  uid: string;
  email?: string;
  displayName?: string;
}

interface UserProfile {
  propertyId?: string;
  propertyName?: string;
  unitNumber?: string;
  fullName?: string;
  firstName?: string;
  lastName?: string;
}

interface EnhancedRequestFormProps {
  onSuccess: () => void;
  currentUser: User;
  userProfile?: UserProfile;
}

const CATEGORIES = [
  { id: 'plumbing', label: 'Plumbing', icon: '🔧' },
  { id: 'electrical', label: 'Electrical', icon: '⚡' },
  { id: 'hvac', label: 'HVAC', icon: '🌡️' },
  { id: 'appliances', label: 'Appliances', icon: '🏠' },
  { id: 'structural', label: 'Structural', icon: '🏗️' },
  { id: 'security', label: 'Security', icon: '🔒' },
  { id: 'pest', label: 'Pest Control', icon: '🐛' },
  { id: 'cleaning', label: 'Cleaning', icon: '🧹' },
  { id: 'other', label: 'Other', icon: '📝' }
];

const URGENCY_LEVELS = [
  { 
    id: 'low', 
    label: 'Low Priority', 
    description: 'Can wait a few days',
    color: 'bg-green-100 text-green-800 border-green-200',
    icon: <ClockIcon className="w-4 h-4" />
  },
  { 
    id: 'medium', 
    label: 'Medium Priority', 
    description: 'Should be addressed soon',
    color: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    icon: <WrenchScrewdriverIcon className="w-4 h-4" />
  },
  { 
    id: 'high', 
    label: 'High Priority', 
    description: 'Needs immediate attention',
    color: 'bg-red-100 text-red-800 border-red-200',
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

const EnhancedRequestForm: React.FC<EnhancedRequestFormProps> = ({
  onSuccess,
  currentUser,
  userProfile
}) => {
  const [formData, setFormData] = useState({
    issueTitle: '',
    description: '',
    urgency: 'medium',
    category: '',
    location: '',
    bestTimeToContact: '',
    accessInstructions: ''
  });

  const [photos, setPhotos] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [dragActive, setDragActive] = useState(false);

  // Validation rules
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
    
    if (photos.some(photo => photo.size > 10 * 1024 * 1024)) {
      newErrors.photos = 'Each photo must be smaller than 10MB';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form field changes
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
    const validFiles = newFiles.filter(file => {
      // Check file type
      if (!file.type.startsWith('image/')) {
        toast.error(`${file.name} is not an image file`);
        return false;
      }
      
      // Check file size
      if (file.size > 10 * 1024 * 1024) {
        toast.error(`${file.name} is too large (max 10MB)`);
        return false;
      }
      
      return true;
    });
    
    if (photos.length + validFiles.length > 5) {
      toast.error('Maximum 5 photos allowed');
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
  const removePhoto = (index: number) => {
    setPhotos(prev => prev.filter((_, i) => i !== index));
  };

  // Quick fill common issue
  const fillCommonIssue = (issue: string) => {
    setFormData(prev => ({
      ...prev,
      issueTitle: issue,
      description: prev.description || `I'm experiencing an issue with ${issue.toLowerCase()}. Please help resolve this.`
    }));
  };

  // Upload photos to Firebase Storage
  const uploadPhotos = async (files: File[]): Promise<string[]> => {
    const uploadPromises = files.map(async (file) => {
      const timestamp = Date.now();
      const fileName = `${timestamp}-${file.name}`;
      const fileRef = ref(storage, `maintenance-photos/${currentUser.uid}/${fileName}`);
      
      const snapshot = await uploadBytes(fileRef, file);
      return await getDownloadURL(snapshot.ref);
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
    
    setUploading(true);
    
    try {
      // Upload photos first
      const photoURLs = photos.length > 0 ? await uploadPhotos(photos) : [];
      
      // Get property ID for linking
      const propertyId = userProfile?.propertyId;
      if (!propertyId || propertyId === 'unknown') {
        toast.error('Property information not found. Please contact your landlord.');
        setUploading(false);
        return;
      }
      
      // Prepare ticket data
      const ticketData = {
        issueTitle: formData.issueTitle.trim(),
        description: formData.description.trim(),
        urgency: formData.urgency,
        category: formData.category,
        location: formData.location.trim(),
        bestTimeToContact: formData.bestTimeToContact,
        accessInstructions: formData.accessInstructions.trim(),
        status: 'pending_classification',
        submittedBy: currentUser.uid,
        propertyId: propertyId,
        propertyName: userProfile?.propertyName || 'Unknown Property',
        unitNumber: formData.location || userProfile?.unitNumber || 'N/A',
        photoUrls: photoURLs,
        photoUrl: photoURLs[0] || null, // For backwards compatibility
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        tenantEmail: currentUser.email || '',
        tenantName: userProfile?.fullName || 
                   `${userProfile?.firstName || ''} ${userProfile?.lastName || ''}`.trim() ||
                   currentUser.displayName || 
                   'Unknown Tenant',
        // Additional metadata
        submissionMethod: 'enhanced_form',
        photosCount: photoURLs.length,
        userAgent: navigator.userAgent,
        timestamp: new Date().toISOString()
      };

      // Step 1: Create the maintenance request in Firestore
      console.log('🔍 [DEBUG] Creating maintenance request...');
      const docRef = await addDoc(collection(db, 'tickets'), ticketData);
      const requestId = docRef.id;
      console.log('✅ [DEBUG] Maintenance request created with ID:', requestId);
      
      // Step 2: Link the request to the property document
      console.log('🔍 [DEBUG] Linking request to property:', propertyId);
      try {
        const propertyRef = doc(db, 'properties', propertyId);
        const propertySnap = await getDoc(propertyRef);
        
        if (propertySnap.exists()) {
          // Update property document to include this maintenance request
          await updateDoc(propertyRef, {
            maintenanceRequests: arrayUnion(requestId),
            updatedAt: serverTimestamp()
          });
          console.log('✅ [DEBUG] Successfully linked request to property');
        } else {
          console.warn('⚠️  [DEBUG] Property document not found:', propertyId);
          // Don't fail the request creation, just log the warning
        }
      } catch (propertyError) {
        console.warn('⚠️  [DEBUG] Failed to link request to property:', propertyError);
        // Don't fail the request creation, property linking is secondary
      }
      
      // Success feedback
      toast.success('Request submitted successfully! You\'ll receive updates via email.');
      
      // Reset form
      setFormData({
        issueTitle: '',
        description: '',
        urgency: 'medium',
        category: '',
        location: '',
        bestTimeToContact: '',
        accessInstructions: ''
      });
      setPhotos([]);
      setErrors({});
      
      // Call success callback
      onSuccess();
      
    } catch (error) {
      console.error('❌ [DEBUG] Error submitting maintenance request:', error);
      toast.error('Failed to submit request. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-lg overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-teal-600 to-teal-700 px-6 py-4">
        <h2 className="text-xl font-bold text-white flex items-center">
          <WrenchScrewdriverIcon className="w-6 h-6 mr-2" />
          Submit Maintenance Request
        </h2>
        <p className="text-teal-100 text-sm mt-1">
          {userProfile?.propertyName && `Property: ${userProfile.propertyName}`}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="p-6 space-y-6">
        {/* Quick Actions */}
        <div className="mb-6">
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
              >
                {issue}
              </button>
            ))}
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
            disabled={uploading}
          />
          {errors.issueTitle && (
            <p className="mt-1 text-sm text-red-600">{errors.issueTitle}</p>
          )}
        </div>

        {/* Category */}
        <div>
          <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1">
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
              >
                <div className="text-lg mb-1">{cat.icon}</div>
                <div className="text-xs font-medium">{cat.label}</div>
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
            disabled={uploading}
          />
          <p className="mt-1 text-sm text-gray-500">
            {formData.description.length} characters (minimum 20)
          </p>
          {errors.description && (
            <p className="mt-1 text-sm text-red-600">{errors.description}</p>
          )}
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
            Specific Location
          </label>
          <input
            type="text"
            id="location"
            name="location"
            value={formData.location}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
            placeholder="e.g., Master bathroom, Kitchen sink, Living room"
            disabled={uploading}
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
            disabled={uploading}
          >
            <option value="">Select preferred time</option>
            <option value="morning">Morning (8 AM - 12 PM)</option>
            <option value="afternoon">Afternoon (12 PM - 5 PM)</option>
            <option value="evening">Evening (5 PM - 8 PM)</option>
            <option value="anytime">Anytime during business hours</option>
            <option value="weekend">Weekends only</option>
          </select>
        </div>

        {/* Access Instructions */}
        <div>
          <label htmlFor="accessInstructions" className="block text-sm font-medium text-gray-700 mb-1">
            Access Instructions
          </label>
          <textarea
            id="accessInstructions"
            name="accessInstructions"
            rows={2}
            value={formData.accessInstructions}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
            placeholder="Special access instructions, pet information, or other important notes for the maintenance team..."
            disabled={uploading}
          />
        </div>

        {/* Photo Upload */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Photos (Optional) - Maximum 5 photos
          </label>
          
          {/* Upload Area */}
          <div
            className={`relative border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
              dragActive 
                ? 'border-teal-400 bg-teal-50' 
                : 'border-gray-300 hover:border-gray-400'
            }`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            <PhotoIcon className="w-12 h-12 mx-auto text-gray-400 mb-4" />
            <div className="space-y-2">
              <label
                htmlFor="photo-upload"
                className="cursor-pointer inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-teal-700 bg-teal-100 hover:bg-teal-200"
              >
                <CameraIcon className="w-4 h-4 mr-2" />
                Choose Photos
              </label>
              <input
                id="photo-upload"
                type="file"
                multiple
                accept="image/*"
                onChange={handlePhotoChange}
                className="sr-only"
                disabled={uploading}
              />
              <p className="text-sm text-gray-500">
                or drag and drop images here
              </p>
              <p className="text-xs text-gray-400">
                PNG, JPG, GIF up to 10MB each
              </p>
            </div>
          </div>

          {/* Photo Previews */}
          {photos.length > 0 && (
            <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 gap-4">
              {photos.map((photo, index) => (
                <div key={index} className="relative group">
                  <img
                    src={URL.createObjectURL(photo)}
                    alt={`Preview ${index + 1}`}
                    className="w-full h-24 object-cover rounded-lg border border-gray-200"
                  />
                  <button
                    type="button"
                    onClick={() => removePhoto(index)}
                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                    disabled={uploading}
                  >
                    <XMarkIcon className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
          
          {errors.photos && (
            <p className="mt-1 text-sm text-red-600">{errors.photos}</p>
          )}
        </div>

        {/* Submit Button */}
        <div className="pt-4">
          <Button
            type="submit"
            variant="primary"
            disabled={uploading}
            isLoading={uploading}
            className="w-full"
          >
            {uploading ? 'Submitting Request...' : 'Submit Maintenance Request'}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default EnhancedRequestForm; 