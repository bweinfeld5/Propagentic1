import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { db, storage, callFunction } from '../../firebase/config';
import { collection, getDocs, doc, setDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { v4 as uuidv4 } from 'uuid';

const URGENCY_LEVELS = [
  { id: 'low', label: 'Low - Can be addressed within a week', color: 'bg-green-100 text-green-800' },
  { id: 'medium', label: 'Medium - Needs attention within 2-3 days', color: 'bg-yellow-100 text-yellow-800' },
  { id: 'high', label: 'High - Requires immediate attention', color: 'bg-red-100 text-red-800' }
];

const MaintenanceForm = () => {
  const { currentUser, userProfile } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    urgency: 'medium',
    unitNumber: '',
    propertyId: '',
  });
  
  const [photos, setPhotos] = useState([]);
  const [photoFiles, setPhotoFiles] = useState([]);
  const [properties, setProperties] = useState([]);
  const [units, setUnits] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [aiAnalysis, setAiAnalysis] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);

  // Fetch properties and units
  useEffect(() => {
    const fetchPropertiesAndUnits = async () => {
      try {
        // If tenant, fetch only the property/unit they belong to
        if (userProfile?.propertyId && userProfile?.unitNumber) {
          const propertyRef = doc(db, 'properties', userProfile.propertyId);
          const propertyDoc = await getDoc(propertyRef);
          
          if (propertyDoc.exists()) {
            setProperties([{ id: propertyDoc.id, ...propertyDoc.data() }]);
            setFormData(prev => ({
              ...prev,
              propertyId: propertyDoc.id,
              unitNumber: userProfile.unitNumber
            }));
          }
        } else {
          // For testing or if not assigned to a property yet
          const propertiesSnap = await getDocs(collection(db, 'properties'));
          const propertiesList = [];
          
          propertiesSnap.forEach(doc => {
            propertiesList.push({ id: doc.id, ...doc.data() });
          });
          
          setProperties(propertiesList);
          
          if (propertiesList.length > 0) {
            setFormData(prev => ({
              ...prev,
              propertyId: propertiesList[0].id
            }));
          }
        }
      } catch (error) {
        console.error("Error fetching properties:", error);
        setError("Could not load properties. Please try again later.");
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
        if (selectedProperty.units.length > 0 && !selectedProperty.units.some(u => u.number === formData.unitNumber)) {
          setFormData(prev => ({
            ...prev,
            unitNumber: selectedProperty.units[0].number
          }));
        }
      } else {
        setUnits([]);
      }
    }
  }, [formData.propertyId, properties]);

  // Handle form field changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Handle photo uploads
  const handlePhotoChange = (e) => {
    const files = Array.from(e.target.files);
    
    if (files.length > 0) {
      // Preview images
      const newPhotos = files.map(file => ({
        id: uuidv4(),
        url: URL.createObjectURL(file),
        file
      }));
      
      setPhotos(prev => [...prev, ...newPhotos]);
      setPhotoFiles(prev => [...prev, ...files]);
      
      // Reset the input
      e.target.value = '';
    }
  };

  // Remove a photo from the list
  const removePhoto = (photoId) => {
    const photoIndex = photos.findIndex(p => p.id === photoId);
    if (photoIndex !== -1) {
      // Create new arrays without the removed photo
      const newPhotos = [...photos];
      const newPhotoFiles = [...photoFiles];
      newPhotos.splice(photoIndex, 1);
      newPhotoFiles.splice(photoIndex, 1);
      
      // Release object URL to prevent memory leaks
      URL.revokeObjectURL(photos[photoIndex].url);
      
      setPhotos(newPhotos);
      setPhotoFiles(newPhotoFiles);
    }
  };

  // Analyze the maintenance issue with Claude
  const analyzeWithClaude = async () => {
    if (!formData.description.trim()) {
      setError("Please provide a description for AI analysis");
      return;
    }
    
    setError('');
    setAiLoading(true);
    
    try {
      // Call the cloud function that will interact with Claude
      const result = await callFunction('analyzeMaintenanceRequest', {
        description: formData.description,
        title: formData.title
      });
      
      if (result.success) {
        setAiAnalysis(result.analysis);
      } else {
        setError(result.error || "AI analysis failed. Please try again.");
      }
    } catch (error) {
      console.error("Error analyzing with Claude:", error);
      setError("AI analysis failed. Please try again or submit without analysis.");
    } finally {
      setAiLoading(false);
    }
  };

  // Accept AI suggestions
  const acceptAiSuggestions = () => {
    if (aiAnalysis) {
      setFormData(prev => ({
        ...prev,
        title: aiAnalysis.suggestedTitle || prev.title,
        urgency: aiAnalysis.suggestedUrgency || prev.urgency
      }));
    }
  };
  
  // Upload all photos to Firebase Storage
  const uploadPhotos = async () => {
    if (photoFiles.length === 0) return [];
    
    const uploadPromises = photoFiles.map(async (file, index) => {
      const fileRef = ref(storage, `maintenance-requests/${currentUser.uid}/${Date.now()}-${index}-${file.name}`);
      await uploadBytes(fileRef, file);
      const downloadURL = await getDownloadURL(fileRef);
      return downloadURL;
    });
    
    return Promise.all(uploadPromises);
  };

  // Submit the form
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.title.trim()) {
      setError("Please provide a title for your request");
      return;
    }
    
    if (!formData.description.trim()) {
      setError("Please provide a description of the issue");
      return;
    }
    
    if (!formData.propertyId) {
      setError("Please select a property");
      return;
    }
    
    if (!formData.unitNumber) {
      setError("Please select a unit");
      return;
    }
    
    setError('');
    setLoading(true);
    
    try {
      // Upload photos
      const photoUrls = await uploadPhotos();
      
      // Generate a unique ID for the request
      const requestId = uuidv4();
      
      // Prepare request data
      const requestData = {
        id: requestId,
        tenantId: currentUser.uid,
        tenantName: userProfile?.name || currentUser.email,
        tenantEmail: currentUser.email,
        tenantPhone: userProfile?.phone || null,
        title: formData.title,
        description: formData.description,
        propertyId: formData.propertyId,
        propertyName: properties.find(p => p.id === formData.propertyId)?.name || 'Unknown Property',
        unitNumber: formData.unitNumber,
        urgency: formData.urgency,
        status: 'pending', // Initial status
        photoUrls: photoUrls,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        aiAnalysis: aiAnalysis,
      };
      
      // Save to Firestore
      await setDoc(doc(db, 'requests', requestId), requestData);
      
      // Process with AI and assign contractor via Cloud Function
      await callFunction('processMaintenanceRequest', {
        requestId,
        data: requestData
      });
      
      setSuccess("Maintenance request submitted successfully!");
      
      // Wait 2 seconds and navigate to the requests list
      setTimeout(() => {
        navigate('/maintenance/my-requests');
      }, 2000);
    } catch (error) {
      console.error("Error submitting request:", error);
      setError("Failed to submit request. Please try again.");
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-2xl font-semibold text-gray-900">Submit Maintenance Request</h1>
      
      {error && (
        <div className="mt-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
          <span className="block sm:inline">{error}</span>
        </div>
      )}
      
      {success && (
        <div className="mt-4 bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative" role="alert">
          <span className="block sm:inline">{success}</span>
        </div>
      )}
      
      <form className="mt-6 space-y-6" onSubmit={handleSubmit}>
        {/* Property and Unit Selection */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          <div>
            <label htmlFor="propertyId" className="block text-sm font-medium text-gray-700">
              Property
            </label>
            <select
              id="propertyId"
              name="propertyId"
              className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
              value={formData.propertyId}
              onChange={handleChange}
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
          </div>
          
          <div>
            <label htmlFor="unitNumber" className="block text-sm font-medium text-gray-700">
              Unit Number
            </label>
            <select
              id="unitNumber"
              name="unitNumber"
              className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
              value={formData.unitNumber}
              onChange={handleChange}
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
          </div>
        </div>
        
        {/* Title and Description */}
        <div>
          <label htmlFor="title" className="block text-sm font-medium text-gray-700">
            Title
          </label>
          <input
            type="text"
            name="title"
            id="title"
            className="mt-1 focus:ring-indigo-500 focus:border-indigo-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
            placeholder="Brief title of the issue"
            value={formData.title}
            onChange={handleChange}
            disabled={loading}
            required
          />
        </div>
        
        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-700">
            Description
          </label>
          <textarea
            id="description"
            name="description"
            rows={4}
            className="mt-1 focus:ring-indigo-500 focus:border-indigo-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
            placeholder="Please describe the issue in detail"
            value={formData.description}
            onChange={handleChange}
            disabled={loading}
            required
          />
        </div>
        
        {/* AI Analysis Section */}
        <div className="border border-gray-200 rounded-md p-4 bg-gray-50">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium text-gray-900">AI Analysis</h3>
            <button
              type="button"
              className={`inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm ${
                aiLoading
                  ? 'bg-gray-300 cursor-not-allowed'
                  : 'text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500'
              }`}
              onClick={analyzeWithClaude}
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
            <div className="mt-4">
              <div className="bg-white p-4 rounded-md shadow-sm">
                <h4 className="font-medium text-gray-900">AI Suggestions:</h4>
                <dl className="mt-2 divide-y divide-gray-200">
                  <div className="py-2 sm:grid sm:grid-cols-3 sm:gap-4">
                    <dt className="text-sm font-medium text-gray-500">Issue Type</dt>
                    <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{aiAnalysis.issueType}</dd>
                  </div>
                  <div className="py-2 sm:grid sm:grid-cols-3 sm:gap-4">
                    <dt className="text-sm font-medium text-gray-500">Suggested Title</dt>
                    <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{aiAnalysis.suggestedTitle}</dd>
                  </div>
                  <div className="py-2 sm:grid sm:grid-cols-3 sm:gap-4">
                    <dt className="text-sm font-medium text-gray-500">Suggested Urgency</dt>
                    <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        URGENCY_LEVELS.find(u => u.id === aiAnalysis.suggestedUrgency)?.color || 'bg-gray-100'
                      }`}>
                        {aiAnalysis.suggestedUrgency && aiAnalysis.suggestedUrgency.toUpperCase()}
                      </span>
                    </dd>
                  </div>
                  <div className="py-2 sm:grid sm:grid-cols-3 sm:gap-4">
                    <dt className="text-sm font-medium text-gray-500">Suggested Contractor</dt>
                    <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{aiAnalysis.suggestedContractorType}</dd>
                  </div>
                  <div className="py-2 sm:grid sm:grid-cols-3 sm:gap-4">
                    <dt className="text-sm font-medium text-gray-500">AI Analysis</dt>
                    <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{aiAnalysis.reasoning}</dd>
                  </div>
                </dl>
                
                <div className="mt-4">
                  <button
                    type="button"
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    onClick={acceptAiSuggestions}
                    disabled={loading}
                  >
                    Accept AI Suggestions
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
        
        {/* Urgency */}
        <div>
          <label htmlFor="urgency" className="block text-sm font-medium text-gray-700">
            Urgency Level
          </label>
          <select
            id="urgency"
            name="urgency"
            className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
            value={formData.urgency}
            onChange={handleChange}
            disabled={loading}
          >
            {URGENCY_LEVELS.map(urgency => (
              <option key={urgency.id} value={urgency.id}>
                {urgency.label}
              </option>
            ))}
          </select>
        </div>
        
        {/* Photo upload */}
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Photos
          </label>
          <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
            <div className="space-y-1 text-center">
              <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48" aria-hidden="true">
                <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <div className="flex text-sm text-gray-600">
                <label htmlFor="file-upload" className="relative cursor-pointer bg-white rounded-md font-medium text-indigo-600 hover:text-indigo-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-indigo-500">
                  <span>Upload photos</span>
                  <input
                    id="file-upload"
                    name="file-upload"
                    type="file"
                    className="sr-only"
                    multiple
                    accept="image/*"
                    onChange={handlePhotoChange}
                    disabled={loading}
                  />
                </label>
                <p className="pl-1">or drag and drop</p>
              </div>
              <p className="text-xs text-gray-500">
                PNG, JPG, GIF up to 10MB each
              </p>
            </div>
          </div>
          
          {/* Photo previews */}
          {photos.length > 0 && (
            <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
              {photos.map(photo => (
                <div key={photo.id} className="relative group">
                  <img
                    src={photo.url}
                    alt="Preview"
                    className="h-24 w-full object-cover rounded-md"
                  />
                  <button
                    type="button"
                    onClick={() => removePhoto(photo.id)}
                    className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity rounded-md"
                    disabled={loading}
                  >
                    <svg className="h-6 w-6 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
        
        {/* Submit button */}
        <div className="pt-5">
          <div className="flex justify-end">
            <button
              type="button"
              className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              onClick={() => navigate(-1)}
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className={`ml-3 inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white ${
                loading
                  ? 'bg-indigo-400 cursor-not-allowed'
                  : 'bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500'
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
                'Submit Request'
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default MaintenanceForm; 