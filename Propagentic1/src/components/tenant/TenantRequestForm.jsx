import React, { useState, useRef } from 'react';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage, auth, callFunction } from '../../firebase/config';

// Constants for validation
const MAX_DESCRIPTION_LENGTH = 500;
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_FILE_TYPES = ['image/jpeg', 'image/jpg', 'image/png'];

const issueTypes = [
  'plumbing',
  'electrical',
  'hvac',
  'appliance',
  'structural',
  'pest_control',
  'landscaping',
  'general',
  'other'
];

const TenantRequestForm = ({ propertyId, propertyName }) => {
  const [description, setDescription] = useState('');
  const [issueType, setIssueType] = useState('');
  const [urgency, setUrgency] = useState('normal');
  const [photos, setPhotos] = useState([]);
  const [photoURLs, setPhotoURLs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState({ type: '', message: '' });
  const [uploadProgress, setUploadProgress] = useState(0);
  const [validationErrors, setValidationErrors] = useState({});
  const fileInputRef = useRef(null);

  // Handle description input with validation
  const handleDescriptionChange = (e) => {
    const value = e.target.value;
    if (value.length <= MAX_DESCRIPTION_LENGTH) {
      setDescription(value);
      
      // Clear validation error if fixed
      if (validationErrors.description) {
        setValidationErrors(prev => ({...prev, description: null}));
      }
    }
  };

  // Sanitize input
  const sanitizeText = (text) => {
    // Remove potential XSS characters and scripts
    return text
      .replace(/<(|\/|[^>\/bi]|\/[^>bi]|[^\/>][^>]+|\/[^>][^>]+)>/g, '')
      .trim();
  };

  const handlePhotoChange = (e) => {
    const files = Array.from(e.target.files);
    const errors = {};
    const validFiles = [];
    const validPhotoURLs = [];

    files.forEach(file => {
      // Validate file size
      if (file.size > MAX_FILE_SIZE) {
        errors.fileSize = `File "${file.name}" exceeds the maximum size of 5MB`;
        return;
      }

      // Validate file type
      if (!ALLOWED_FILE_TYPES.includes(file.type)) {
        errors.fileType = `File "${file.name}" is not a supported image type (JPG/PNG only)`;
        return;
      }

      validFiles.push(file);
      validPhotoURLs.push(URL.createObjectURL(file));
    });

    if (Object.keys(errors).length > 0) {
      setValidationErrors({...validationErrors, ...errors});
    } else {
      setPhotos([...photos, ...validFiles]);
      setPhotoURLs([...photoURLs, ...validPhotoURLs]);
      
      // Clear file-related validation errors
      if (validationErrors.fileSize || validationErrors.fileType) {
        const newErrors = {...validationErrors};
        delete newErrors.fileSize;
        delete newErrors.fileType;
        setValidationErrors(newErrors);
      }
    }
  };

  const removePhoto = (index) => {
    const newPhotos = [...photos];
    const newPhotoURLs = [...photoURLs];
    
    newPhotos.splice(index, 1);
    newPhotoURLs.splice(index, 1);
    
    setPhotos(newPhotos);
    setPhotoURLs(newPhotoURLs);
  };

  const validateForm = () => {
    const errors = {};
    
    if (!description.trim()) {
      errors.description = 'Please provide a description of the issue';
    } else if (description.length < 10) {
      errors.description = 'Description should be at least 10 characters';
    }
    
    if (!issueType) {
      errors.issueType = 'Please select an issue type';
    }
    
    if (!propertyId) {
      errors.property = 'No property selected for this request';
    }
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate form
    if (!validateForm()) {
      return;
    }
    
    setLoading(true);
    setStatus({ type: '', message: '' });
    setUploadProgress(0);
    
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) {
        throw new Error('You must be logged in to submit a request');
      }
      
      // Sanitize user input
      const sanitizedDescription = sanitizeText(description);
      
      // Upload photos if any
      const photoDownloadURLs = [];
      
      if (photos.length > 0) {
        for (let i = 0; i < photos.length; i++) {
          const photo = photos[i];
          const storageRef = ref(storage, `tickets/${propertyId}/${Date.now()}_${photo.name}`);
          
          await uploadBytes(storageRef, photo);
          const url = await getDownloadURL(storageRef);
          photoDownloadURLs.push(url);
          
          // Update progress
          setUploadProgress(Math.round(((i + 1) / photos.length) * 100));
        }
      }
      
      // Create ticket document
      const ticketRef = collection(db, 'tickets');
      const newTicket = {
        tenantId: currentUser.uid,
        tenantName: currentUser.displayName || 'Unknown Tenant',
        tenantEmail: currentUser.email,
        propertyId,
        propertyName: propertyName || 'Unknown Property',
        description: sanitizedDescription,
        issueType,
        urgencyLevel: urgency,
        photos: photoDownloadURLs,
        status: 'pending_classification', // Initial status
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        updates: [{
          timestamp: new Date().toISOString(),
          status: 'pending_classification',
          message: 'Ticket created and awaiting processing',
          userId: currentUser.uid,
          userRole: 'tenant'
        }]
      };
      
      const docRef = await addDoc(ticketRef, newTicket);
      
      // Trigger classification function
      await callFunction('classifyMaintenanceRequest', {
        ticketId: docRef.id
      });
      
      // Reset form
      setDescription('');
      setIssueType('');
      setUrgency('normal');
      setPhotos([]);
      setPhotoURLs([]);
      setUploadProgress(0);
      
      setStatus({
        type: 'success',
        message: 'Maintenance request submitted successfully!'
      });
      
    } catch (err) {
      console.error('Error submitting maintenance request:', err);
      setStatus({
        type: 'error',
        message: err.message || 'Failed to submit maintenance request'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-xl font-semibold text-gray-800 mb-6">Submit Maintenance Request</h2>
      
      {status.message && (
        <div className={`mb-6 p-4 rounded-md ${
          status.type === 'error' 
            ? 'bg-red-50 text-red-700 border border-red-200' 
            : 'bg-green-50 text-green-700 border border-green-200'
        }`}>
          {status.message}
        </div>
      )}
      
      <form onSubmit={handleSubmit}>
        <div className="space-y-6">
          <div>
            <label htmlFor="issueType" className="block text-sm font-medium text-gray-700 mb-1">
              Issue Type <span className="text-red-500">*</span>
            </label>
            <select
              id="issueType"
              value={issueType}
              onChange={(e) => {
                setIssueType(e.target.value);
                if (validationErrors.issueType) {
                  setValidationErrors(prev => ({...prev, issueType: null}));
                }
              }}
              className={`block w-full rounded-md shadow-sm sm:text-sm ${
                validationErrors.issueType 
                  ? 'border-red-300 focus:border-red-500 focus:ring-red-500' 
                  : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'
              }`}
              required
            >
              <option value="">Select issue type</option>
              {issueTypes.map((type) => (
                <option key={type} value={type}>
                  {type.charAt(0).toUpperCase() + type.slice(1).replace('_', ' ')}
                </option>
              ))}
            </select>
            {validationErrors.issueType && (
              <p className="mt-1 text-sm text-red-600">{validationErrors.issueType}</p>
            )}
          </div>
          
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
              Description <span className="text-red-500">*</span>
            </label>
            <textarea
              id="description"
              value={description}
              onChange={handleDescriptionChange}
              rows={4}
              className={`block w-full rounded-md shadow-sm sm:text-sm ${
                validationErrors.description 
                  ? 'border-red-300 focus:border-red-500 focus:ring-red-500' 
                  : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'
              }`}
              placeholder="Please describe the issue in detail..."
              required
            ></textarea>
            <div className="mt-1 flex justify-between items-center">
              <p className={`text-xs ${description.length > MAX_DESCRIPTION_LENGTH * 0.8 ? 'text-orange-500' : 'text-gray-500'}`}>
                {description.length}/{MAX_DESCRIPTION_LENGTH} characters
              </p>
              {validationErrors.description && (
                <p className="text-sm text-red-600">{validationErrors.description}</p>
              )}
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Urgency
            </label>
            <div className="flex space-x-4">
              <div className="flex items-center">
                <input
                  id="urgency-low"
                  name="urgency"
                  type="radio"
                  value="low"
                  checked={urgency === 'low'}
                  onChange={() => setUrgency('low')}
                  className="h-4 w-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                />
                <label htmlFor="urgency-low" className="ml-2 block text-sm text-gray-700">
                  Low
                </label>
              </div>
              <div className="flex items-center">
                <input
                  id="urgency-normal"
                  name="urgency"
                  type="radio"
                  value="normal"
                  checked={urgency === 'normal'}
                  onChange={() => setUrgency('normal')}
                  className="h-4 w-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                />
                <label htmlFor="urgency-normal" className="ml-2 block text-sm text-gray-700">
                  Normal
                </label>
              </div>
              <div className="flex items-center">
                <input
                  id="urgency-high"
                  name="urgency"
                  type="radio"
                  value="high"
                  checked={urgency === 'high'}
                  onChange={() => setUrgency('high')}
                  className="h-4 w-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                />
                <label htmlFor="urgency-high" className="ml-2 block text-sm text-gray-700">
                  High
                </label>
              </div>
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Photos
            </label>
            <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
              <div className="space-y-1 text-center">
                <svg
                  className="mx-auto h-12 w-12 text-gray-400"
                  stroke="currentColor"
                  fill="none"
                  viewBox="0 0 48 48"
                  aria-hidden="true"
                >
                  <path
                    d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                    strokeWidth={2}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                <div className="flex text-sm text-gray-600">
                  <label
                    htmlFor="photo-upload"
                    className="relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-blue-500"
                  >
                    <span>Upload photos</span>
                    <input
                      id="photo-upload"
                      name="photo-upload"
                      type="file"
                      className="sr-only"
                      accept="image/jpeg,image/jpg,image/png"
                      multiple
                      ref={fileInputRef}
                      onChange={handlePhotoChange}
                      disabled={loading}
                    />
                  </label>
                  <p className="pl-1">or drag and drop</p>
                </div>
                <p className="text-xs text-gray-500">JPG, PNG only, up to 5MB each</p>
              </div>
            </div>
            
            {(validationErrors.fileSize || validationErrors.fileType) && (
              <div className="mt-2 text-sm text-red-600">
                {validationErrors.fileSize && <p>{validationErrors.fileSize}</p>}
                {validationErrors.fileType && <p>{validationErrors.fileType}</p>}
              </div>
            )}
            
            {photoURLs.length > 0 && (
              <div className="mt-4 grid grid-cols-3 gap-4">
                {photoURLs.map((url, index) => (
                  <div key={index} className="relative">
                    <img
                      src={url}
                      alt={`Upload ${index + 1}`}
                      className="h-24 w-24 rounded-md object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => removePhoto(index)}
                      disabled={loading}
                      className="absolute -top-2 -right-2 rounded-full bg-red-500 p-1 text-white hover:bg-red-600 focus:outline-none"
                    >
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
          
          {loading && uploadProgress > 0 && (
            <div className="w-full">
              <div className="text-xs font-semibold inline-block text-blue-600 mb-1">
                Uploading photos: {uploadProgress}%
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2.5">
                <div 
                  className="bg-blue-600 h-2.5 rounded-full transition-all duration-300 ease-in-out"
                  style={{ width: `${uploadProgress}%` }}
                ></div>
              </div>
            </div>
          )}
          
          <div>
            <button
              type="submit"
              disabled={loading}
              className={`w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
                loading 
                  ? 'bg-blue-400 cursor-not-allowed' 
                  : 'bg-blue-600 hover:bg-blue-700'
              }`}
            >
              {loading ? 'Submitting...' : 'Submit Request'}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default TenantRequestForm;
