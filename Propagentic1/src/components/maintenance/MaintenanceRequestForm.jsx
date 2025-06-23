import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../../firebase/config';
import { v4 as uuidv4 } from 'uuid';

// Urgency options for the dropdown
const URGENCY_LEVELS = [
  { id: 'low', label: 'Low' },
  { id: 'medium', label: 'Medium' },
  { id: 'high', label: 'High' }
];

const MaintenanceRequestForm = () => {
  const { currentUser, userProfile } = useAuth();
  const navigate = useNavigate();

  // Form state
  const [formData, setFormData] = useState({
    issueTitle: '',
    description: '',
    unitNumber: '',
    urgency: 'medium'
  });

  // UI state
  const [photo, setPhoto] = useState(null);
  const [photoPreview, setPhotoPreview] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

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
      setPhoto(file);
      setPhotoPreview(URL.createObjectURL(file));
    }
  };

  // Remove photo
  const removePhoto = () => {
    if (photoPreview) {
      URL.revokeObjectURL(photoPreview);
    }
    setPhoto(null);
    setPhotoPreview('');
  };

  // Upload photo to Firebase Storage
  const uploadPhoto = async () => {
    if (!photo || !currentUser) return '';
    try {
      const fileRef = ref(storage, `maintenance-requests/${currentUser.uid}/${Date.now()}-${photo.name}`);
      await uploadBytes(fileRef, photo);
      return await getDownloadURL(fileRef);
    } catch (error) {
      console.error('Error uploading photo:', error);
      throw new Error('Failed to upload photo');
    }
  };

  // Submit the form
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate form
    if (!formData.issueTitle.trim()) {
      setError('Please provide a title for the issue');
      return;
    }

    if (!formData.description.trim()) {
      setError('Please provide a description of the issue');
      return;
    }

    if (!formData.unitNumber.trim()) {
      setError('Please provide your unit number');
      return;
    }

    setError('');
    setLoading(true);

    try {
      // Upload photo to Firebase Storage
      const photoUrl = await uploadPhoto();
      
      // Generate a unique ID for the request
      const ticketId = uuidv4();
      
      // Create document in Firestore
      await setDoc(doc(db, 'tickets', ticketId), {
        issueTitle: formData.issueTitle,
        description: formData.description,
        photoUrl: photoUrl || null,
        urgency: formData.urgency,
        unitNumber: formData.unitNumber,
        submittedBy: currentUser?.uid,
        tenantName: userProfile?.name || currentUser.email,
        tenantEmail: currentUser.email,
        status: 'pending_classification',
        createdAt: serverTimestamp(),
      });
      
      setSuccess('Maintenance request submitted successfully!');
      
      // Redirect after a short delay
      setTimeout(() => {
        navigate('/maintenance/my-requests');
      }, 2000);
    } catch (error) {
      console.error('Error submitting maintenance request:', error);
      setError('Failed to submit maintenance request. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">
        Submit Maintenance Request
      </h1>
      
      {error && (
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6" role="alert">
          <p>{error}</p>
        </div>
      )}
      
      {success && (
        <div className="bg-green-100 border-l-4 border-green-500 text-green-700 p-4 mb-6" role="alert">
          <p>{success}</p>
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-lg p-6">
        {/* Issue Title */}
        <div className="mb-6">
          <label 
            htmlFor="issueTitle" 
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            Issue Title <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            id="issueTitle"
            name="issueTitle"
            value={formData.issueTitle}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-teal-500 focus:border-teal-500"
            placeholder="e.g. Leaking faucet, Broken AC"
            required
          />
        </div>
        
        {/* Description */}
        <div className="mb-6">
          <label 
            htmlFor="description" 
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            Description <span className="text-red-500">*</span>
          </label>
          <textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleChange}
            rows={4}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-teal-500 focus:border-teal-500"
            placeholder="Please describe the issue in detail..."
            required
          />
        </div>
        
        {/* Unit Number */}
        <div className="mb-6">
          <label 
            htmlFor="unitNumber" 
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            Unit Number <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            id="unitNumber"
            name="unitNumber"
            value={formData.unitNumber}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-teal-500 focus:border-teal-500"
            placeholder="e.g. 101, 2B, etc."
            required
          />
        </div>
        
        {/* Urgency Level */}
        <div className="mb-6">
          <label 
            htmlFor="urgency" 
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            Urgency Level <span className="text-red-500">*</span>
          </label>
          <select
            id="urgency"
            name="urgency"
            value={formData.urgency}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-teal-500 focus:border-teal-500"
            required
          >
            {URGENCY_LEVELS.map(level => (
              <option key={level.id} value={level.id}>
                {level.label}
              </option>
            ))}
          </select>
        </div>
        
        {/* Photo Upload */}
        <div className="mb-6">
          <label 
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            Photo Upload
          </label>
          
          {!photoPreview ? (
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
                    className="relative cursor-pointer bg-white rounded-md font-medium text-teal-600 hover:text-teal-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-teal-500"
                  >
                    <span>Upload a photo</span>
                    <input
                      id="photo-upload"
                      name="photo"
                      type="file"
                      className="sr-only"
                      accept="image/*"
                      onChange={handlePhotoChange}
                    />
                  </label>
                  <p className="pl-1">or drag and drop</p>
                </div>
                <p className="text-xs text-gray-500">
                  PNG, JPG, GIF up to 10MB
                </p>
              </div>
            </div>
          ) : (
            <div className="mt-1 relative">
              <img
                src={photoPreview}
                alt="Issue preview"
                className="h-64 rounded-md mx-auto border border-gray-300 object-contain"
              />
              <button
                type="button"
                className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 focus:outline-none"
                onClick={removePhoto}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
          )}
        </div>
        
        {/* Submit Button */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={loading}
            className={`px-6 py-2 bg-teal-600 text-white rounded-md shadow-sm hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500 transition-colors ${
              loading ? 'opacity-70 cursor-not-allowed' : ''
            }`}
          >
            {loading ? (
              <div className="flex items-center">
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
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

export default MaintenanceRequestForm; 