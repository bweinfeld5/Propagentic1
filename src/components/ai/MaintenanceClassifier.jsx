import React, { useState } from 'react';
import { useMaintenanceAI } from '../../hooks/useMaintenanceAI';

const MaintenanceClassifier = () => {
  const [requestDescription, setRequestDescription] = useState('');
  const [classifiedResults, setClassifiedResults] = useState(null);
  const { classifyMaintenanceRequest, isLoading, error } = useMaintenanceAI();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!requestDescription.trim()) return;

    try {
      const result = await classifyMaintenanceRequest(requestDescription);
      setClassifiedResults(result);
    } catch (err) {
      console.error('Error classifying request:', err);
    }
  };

  // Get the appropriate color for priority badge
  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return 'bg-red-500';
      case 'medium': return 'bg-yellow-500';
      case 'low': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  // Get the appropriate icon for category
  const getCategoryIcon = (category) => {
    switch (category) {
      case 'plumbing': return '🚿';
      case 'electrical': return '⚡';
      case 'hvac': return '❄️';
      case 'appliance': return '🔌';
      case 'structural': return '🏗️';
      default: return '🔧';
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded-xl shadow-lg">
      <h2 className="text-2xl font-bold mb-6 text-propagentic-teal">AI Maintenance Request Classifier</h2>
      
      <form onSubmit={handleSubmit} className="mb-6">
        <div className="mb-4">
          <label htmlFor="request" className="block text-sm font-medium text-gray-700 mb-2">
            Describe the maintenance issue:
          </label>
          <textarea
            id="request"
            rows="4"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-propagentic-teal"
            placeholder="E.g., The bathroom sink is leaking and water is pooling on the floor..."
            value={requestDescription}
            onChange={(e) => setRequestDescription(e.target.value)}
          ></textarea>
        </div>
        
        <button
          type="submit"
          disabled={isLoading || !requestDescription.trim()}
          className={`px-4 py-2 bg-propagentic-teal text-white rounded-full hover:bg-teal-600 transition ${
            isLoading || !requestDescription.trim() ? 'opacity-50 cursor-not-allowed' : ''
          }`}
        >
          {isLoading ? 'Analyzing...' : 'Analyze Request'}
        </button>
      </form>
      
      {error && (
        <div className="mb-6 p-3 bg-red-100 border border-red-400 rounded text-red-700">
          Error: {error.message}
        </div>
      )}
      
      {classifiedResults && (
        <div className="bg-gray-50 p-4 rounded-lg border">
          <h3 className="text-lg font-semibold mb-3 flex items-center">
            {getCategoryIcon(classifiedResults.category)} {classifiedResults.category.charAt(0).toUpperCase() + classifiedResults.category.slice(1)} Issue
          </h3>
          
          <div className="mb-2">
            <span className={`inline-block px-2 py-1 text-xs text-white rounded-full ${getPriorityColor(classifiedResults.priority)}`}>
              {classifiedResults.priority.toUpperCase()} Priority
            </span>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            <div>
              <h4 className="text-sm font-medium text-gray-700">Estimated Time:</h4>
              <p className="text-sm">{classifiedResults.estimatedTime}</p>
            </div>
            
            <div>
              <h4 className="text-sm font-medium text-gray-700">Suggested Action:</h4>
              <p className="text-sm">{classifiedResults.suggestedAction}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MaintenanceClassifier; 