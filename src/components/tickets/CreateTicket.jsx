import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from 'context/AuthContext';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '../firebase/config';
import { callFunction } from '../firebase/config';

const CreateTicket = () => {
  const { currentUser, userProfile } = useAuth();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [propertyId, setPropertyId] = useState('property123'); // In a real app, you'd fetch properties
  const [propertyName, setPropertyName] = useState('123 Main Street, Apt 4B'); // This would also be dynamic
  const [urgency, setUrgency] = useState('medium');
  const [type, setType] = useState('plumbing');
  const [photos, setPhotos] = useState([]);
  const [photoFiles, setPhotoFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [aiAnalysis, setAiAnalysis] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);
  const fileInputRef = useRef();
  const navigate = useNavigate();

  const handlePhotoChange = (e) => {
    const files = Array.from(e.target.files);
    if (files.length > 0) {
      // Store the actual file objects for upload
      setPhotoFiles(prevFiles => [...prevFiles, ...files]);
      
      // Generate preview URLs
      const newPhotos = files.map(file => ({
        file: file,
        preview: URL.createObjectURL(file)
      }));
      
      setPhotos(prevPhotos => [...prevPhotos, ...newPhotos]);
    }
  };

  const removePhoto = (index) => {
    // Create new arrays without the deleted photo
    const updatedPhotos = [...photos];
    const updatedPhotoFiles = [...photoFiles];
    
    // Revoke the object URL to avoid memory leaks
    URL.revokeObjectURL(photos[index].preview);
    
    updatedPhotos.splice(index, 1);
    updatedPhotoFiles.splice(index, 1);
    
    setPhotos(updatedPhotos);
    setPhotoFiles(updatedPhotoFiles);
  };

  const analyzeWithAI = async () => {
    if (!description) {
      setError("Please provide a description for AI analysis");
      return;
    }

    setAnalyzing(true);
    setError('');

    try {
      // In a real app, you would call your AI function here
      // For demo purposes, we'll simulate an AI response
      setTimeout(() => {
        const mockAnalysis = {
          suggestedType: 'plumbing',
          urgency: 'medium',
          estimatedTimeToFix: '1-2 hours',
          recommendedContractors: [
            { id: '1', name: 'John Smith Plumbing', rating: 4.8 },
            { id: '2', name: 'A1 Plumbing Services', rating: 4.5 }
          ],
          possibleCauses: [
            'Worn out washer or O-ring',
            'Loose water connection',
            'Corroded valve seat'
          ]
        };
        
        setAiAnalysis(mockAnalysis);
        setType(mockAnalysis.suggestedType);
        setUrgency(mockAnalysis.urgency);
        setAnalyzing(false);
      }, 2000);
      
    } catch (error) {
      console.error("Error analyzing with AI:", error);
      setError("Failed to analyze with AI: " + error.message);
      setAnalyzing(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!title || !description || !propertyId) {
      setError('Please fill in all required fields');
      return;
    }
    
    setLoading(true);
    setError('');
    
    try {
      // Upload photos if any
      const photoUrls = [];
      
      if (photoFiles.length > 0) {
        for (const file of photoFiles) {
          const photoRef = ref(storage, `tickets/${currentUser.uid}/${Date.now()}-${file.name}`);
          const uploadResult = await uploadBytes(photoRef, file);
          const downloadUrl = await getDownloadURL(uploadResult.ref);
          photoUrls.push(downloadUrl);
        }
      }
      
      // Call the Firebase function to create the ticket
      const result = await callFunction('createMaintenanceTicket', {
        title,
        description,
        propertyId,
        propertyName,
        urgency,
        type,
        photoUrls,
        aiAnalysis: aiAnalysis || null
      });
      
      // Redirect to the tickets list or the new ticket detail page
      if (result.success) {
        // Use role-based redirect handled by RoleBasedRedirect component
        navigate('/dashboard');
      } else {
        throw new Error('Failed to create ticket');
      }
    } catch (error) {
      console.error("Error creating ticket:", error);
      setError("Failed to create ticket: " + error.message);
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Report a Maintenance Issue</h1>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
          <span className="block sm:inline">{error}</span>
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="bg-white shadow-md rounded-lg overflow-hidden">
        <div className="p-6">
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="title">
              Issue Title *
            </label>
            <input
              id="title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              placeholder="e.g., Leaking Kitchen Faucet"
              required
            />
          </div>
          
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="description">
              Description *
            </label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline h-32"
              placeholder="Please describe the issue in detail..."
              required
            ></textarea>
            <button
              type="button"
              onClick={analyzeWithAI}
              disabled={analyzing || !description}
              className="mt-2 bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline disabled:opacity-50"
            >
              {analyzing ? 'Analyzing...' : 'Analyze with AI'}
            </button>
          </div>
          
          {aiAnalysis && (
            <div className="mb-6 bg-purple-50 p-4 rounded-lg">
              <h3 className="font-bold text-purple-800 mb-2">AI Analysis</h3>
              <p><span className="font-semibold">Suggested Type:</span> {aiAnalysis.suggestedType}</p>
              <p><span className="font-semibold">Recommended Urgency:</span> {aiAnalysis.urgency}</p>
              <p><span className="font-semibold">Estimated Time to Fix:</span> {aiAnalysis.estimatedTimeToFix}</p>
              
              <div className="mt-2">
                <p className="font-semibold">Possible Causes:</p>
                <ul className="list-disc pl-5">
                  {aiAnalysis.possibleCauses.map((cause, index) => (
                    <li key={index}>{cause}</li>
                  ))}
                </ul>
              </div>
              
              <div className="mt-2">
                <p className="font-semibold">Recommended Contractors:</p>
                <ul className="list-disc pl-5">
                  {aiAnalysis.recommendedContractors.map((contractor) => (
                    <li key={contractor.id}>
                      {contractor.name} - {contractor.rating} stars
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}
          
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="property">
              Property
            </label>
            <div className="bg-gray-100 p-3 rounded">
              {propertyName}
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="type">
                Issue Type
              </label>
              <select
                id="type"
                value={type}
                onChange={(e) => setType(e.target.value)}
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              >
                <option value="plumbing">Plumbing</option>
                <option value="electrical">Electrical</option>
                <option value="hvac">HVAC/Heating</option>
                <option value="appliance">Appliance</option>
                <option value="structural">Structural</option>
                <option value="pest">Pest Control</option>
                <option value="other">Other</option>
              </select>
            </div>
            
            <div>
              <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="urgency">
                Urgency
              </label>
              <select
                id="urgency"
                value={urgency}
                onChange={(e) => setUrgency(e.target.value)}
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              >
                <option value="low">Low - Not urgent</option>
                <option value="medium">Medium - Needs attention soon</option>
                <option value="high">High - Requires immediate attention</option>
              </select>
            </div>
          </div>
          
          <div className="mb-6">
            <label className="block text-gray-700 text-sm font-bold mb-2">
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
                      ref={fileInputRef}
                    />
                  </label>
                  <p className="pl-1">or drag and drop</p>
                </div>
                <p className="text-xs text-gray-500">PNG, JPG, GIF up to 10MB</p>
              </div>
            </div>
            
            {photos.length > 0 && (
              <div className="mt-4 grid grid-cols-2 md:grid-cols-3 gap-4">
                {photos.map((photo, index) => (
                  <div key={index} className="relative group">
                    <img 
                      src={photo.preview} 
                      alt={`Preview ${index}`} 
                      className="h-24 w-full object-cover rounded-md"
                    />
                    <button
                      type="button"
                      onClick={() => removePhoto(index)}
                      className="absolute top-0 right-0 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm hover:bg-red-600 focus:outline-none"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
        
        <div className="bg-gray-50 px-4 py-3 text-right sm:px-6">
          <button
            type="button"
            onClick={() => navigate('/dashboard')} // Role-based redirect handled by RoleBasedRedirect
            className="mr-2 inline-flex justify-center py-2 px-4 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
          >
            {loading ? 'Submitting...' : 'Submit Ticket'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CreateTicket; 