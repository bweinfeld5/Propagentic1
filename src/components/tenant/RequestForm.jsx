import React, { useState } from 'react';
import { db, storage } from '../../firebase/config';
import { doc, setDoc, serverTimestamp, collection, addDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { v4 as uuidv4 } from 'uuid';
import PropTypes from 'prop-types';
import { toast } from 'react-hot-toast';

const URGENCY_LEVELS = [
  { id: 'low', label: 'Low' },
  { id: 'medium', label: 'Medium' },
  { id: 'high', label: 'High' }
];

const RequestForm = ({ onSuccess, currentUser, userProfile }) => {
  const [formData, setFormData] = useState({
    issueTitle: '',
    description: '',
    urgency: 'medium',
    category: '',
  });
  
  const [photos, setPhotos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Handle form field changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Handle photo upload
  const handlePhotoChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      
      // Basic validation
      if (file.size > 5 * 1024 * 1024) {
        setError('File size exceeds 5MB limit');
        return;
      }
      
      setPhotos([file]);
    }
  };

  // Remove photo
  const removePhoto = (index) => {
    const newPhotos = photos.filter((_, i) => i !== index);
    setPhotos(newPhotos);
  };

  // Upload photo to Firebase Storage
  const uploadPhoto = async (file) => {
    if (!file) return null;
    
    try {
      const fileRef = ref(storage, `maintenance-photos/${Date.now()}-${file.name}`);
      const snapshot = await uploadBytes(fileRef, file);
      return await getDownloadURL(snapshot.ref);
    } catch (error) {
      console.error('Error uploading photo:', error);
      throw new Error('Failed to upload photo');
    }
  };

  // Reset form
  const resetForm = () => {
    setFormData({
      issueTitle: '',
      description: '',
      urgency: 'medium',
      category: '',
    });
    setPhotos([]);
  };

  // Submit form
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Upload photos first if any
      const photoURLs = [];
      if (photos.length > 0) {
        for (const photo of photos) {
          const photoRef = ref(storage, `maintenance-photos/${Date.now()}-${photo.name}`);
          const snapshot = await uploadBytes(photoRef, photo);
          const downloadURL = await getDownloadURL(snapshot.ref);
          photoURLs.push(downloadURL);
        }
      }

      // Create the maintenance request with pending_classification status
      const ticketData = {
        issueTitle: formData.issueTitle || 'Maintenance Request',
        description: formData.description,
        urgency: formData.urgency,
        category: formData.category || 'general',
        status: 'pending_classification', // Start with classification status
        submittedBy: currentUser.uid,
        propertyId: userProfile?.propertyId || 'unknown',
        unitNumber: userProfile?.unitNumber || 'N/A',
        photoUrl: photoURLs[0] || null,
        photoUrls: photoURLs,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        tenantEmail: currentUser.email,
        tenantName: userProfile?.fullName || currentUser.displayName || 'Unknown'
      };

      console.log('Creating ticket with data:', ticketData);
      
      // Add to Firestore - this will trigger the AI classification function
      const docRef = await addDoc(collection(db, 'tickets'), ticketData);
      
      console.log('Ticket created with ID:', docRef.id);
      
      // Show success message
      toast.success('Maintenance request submitted! AI is analyzing your request...');
      
      // Reset form
      resetForm();
      
      // Call onSuccess if provided
      if (onSuccess) {
        onSuccess();
      }
      
    } catch (error) {
      console.error('Error submitting maintenance request:', error);
      setError('Failed to submit maintenance request. Please try again.');
      toast.error('Failed to submit maintenance request');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white shadow-md rounded-lg overflow-hidden">
      <div className="px-6 py-4 bg-[#176B5D] text-white">
        <h2 className="text-xl font-bold">Submit Maintenance Request</h2>
      </div>
      
      <form onSubmit={handleSubmit} className="p-6">
        {error && (
          <div className="mb-4 bg-red-100 border-l-4 border-red-500 text-red-700 p-4" role="alert">
            <p>{error}</p>
          </div>
        )}
        
        {/* Issue Title */}
        <div className="mb-4">
          <label htmlFor="issueTitle" className="block text-sm font-medium text-gray-700 mb-1">
            Issue Title <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            id="issueTitle"
            name="issueTitle"
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-teal-500 focus:border-teal-500"
            value={formData.issueTitle}
            onChange={handleChange}
            disabled={loading}
            placeholder="e.g., Leaking faucet in bathroom"
          />
        </div>
        
        {/* Description */}
        <div className="mb-4">
          <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
            Description <span className="text-red-500">*</span>
          </label>
          <textarea
            id="description"
            name="description"
            rows={4}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-teal-500 focus:border-teal-500"
            value={formData.description}
            onChange={handleChange}
            disabled={loading}
            placeholder="Please describe the issue in detail..."
          />
        </div>
        
        {/* Urgency */}
        <div className="mb-4">
          <label htmlFor="urgency" className="block text-sm font-medium text-gray-700 mb-1">
            Urgency Level <span className="text-red-500">*</span>
          </label>
          <select
            id="urgency"
            name="urgency"
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-teal-500 focus:border-teal-500"
            value={formData.urgency}
            onChange={handleChange}
            disabled={loading}
          >
            {URGENCY_LEVELS.map(level => (
              <option key={level.id} value={level.id}>
                {level.label}
              </option>
            ))}
          </select>
        </div>
        
        {/* Category */}
        <div className="mb-4">
          <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1">
            Category
          </label>
          <select
            id="category"
            name="category"
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-teal-500 focus:border-teal-500"
            value={formData.category}
            onChange={handleChange}
            disabled={loading}
          >
            {/* Add category options here */}
          </select>
        </div>
        
        {/* Photo Upload */}
        <div className="mb-4">
          <span className="block text-sm font-medium text-gray-700 mb-1">
            Photo Upload
          </span>
          
          {!photos.length ? (
            <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
              <div className="space-y-1 text-center">
                <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48" aria-hidden="true">
                  <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <div className="flex text-sm text-gray-600">
                  <label htmlFor="photo-upload" className="relative cursor-pointer bg-white rounded-md font-medium text-[#176B5D] hover:text-teal-500 focus-within:outline-none">
                    <span>Upload a photo</span>
                    <input 
                      id="photo-upload" 
                      name="photo" 
                      type="file" 
                      className="sr-only" 
                      accept="image/*"
                      onChange={handlePhotoChange}
                      disabled={loading}
                    />
                  </label>
                  <p className="pl-1">or drag and drop</p>
                </div>
                <p className="text-xs text-gray-500">PNG, JPG, GIF up to 5MB</p>
              </div>
            </div>
          ) : (
            <div className="mt-1 relative">
              {photos.map((photo, index) => (
                <div key={index} className="mb-4">
                  <img
                    src={URL.createObjectURL(photo)}
                    alt={`Preview ${index + 1}`}
                    className="h-64 w-full object-contain rounded-md border border-gray-300"
                  />
                  <button
                    type="button"
                    className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 focus:outline-none"
                    onClick={() => removePhoto(index)}
                    disabled={loading}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
        
        {/* Submit Button */}
        <div className="mt-6">
          <button
            type="submit"
            disabled={loading}
            className={`w-full px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-[#176B5D] hover:bg-[#145c50] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500 ${loading ? 'opacity-75 cursor-not-allowed' : ''}`}
          >
            {loading ? (
              <div className="flex items-center justify-center">
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Submitting...
              </div>
            ) : (
              'Submit Request'
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

RequestForm.propTypes = {
  onSuccess: PropTypes.func.isRequired,
  currentUser: PropTypes.object.isRequired,
  userProfile: PropTypes.object
};

export default RequestForm; 