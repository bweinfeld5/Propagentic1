import React, { useState, useEffect } from 'react';
import { useModelContext } from '../../contexts/ModelContext';

const AIConfigurationPanel = () => {
  const [apiKey, setApiKey] = useState('');
  const [status, setStatus] = useState('checking');
  const [showApiKey, setShowApiKey] = useState(false);
  const { protocol, configure } = useModelContext();

  // Check initial configuration on mount
  useEffect(() => {
    const envApiKey = process.env.REACT_APP_OPENAI_API_KEY;
    
    if (envApiKey) {
      // Mask the API key for display
      const maskedKey = maskApiKey(envApiKey);
      setApiKey(maskedKey);
      setStatus('configured');
    } else {
      setStatus('unconfigured');
    }
  }, []);

  // Helper to mask the API key
  const maskApiKey = (key) => {
    if (!key) return '';
    const prefix = key.substring(0, 5);
    const suffix = key.substring(key.length - 4);
    return `${prefix}...${suffix}`;
  };

  // Save API key to local storage and update context
  const handleSaveApiKey = () => {
    if (!apiKey) {
      setStatus('error');
      return;
    }

    try {
      // Save to local storage for persistence between refreshes
      localStorage.setItem('openai_api_key', apiKey);
      
      // Update the model context configuration
      configure({ apiKey });
      
      setStatus('configured');
    } catch (error) {
      console.error('Failed to save API key:', error);
      setStatus('error');
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-5 mb-8">
      <h2 className="text-xl font-semibold mb-3">API Configuration</h2>
      
      <div className="mb-4">
        <p className="text-sm text-gray-600 mb-2">
          Status: {' '}
          {status === 'checking' && <span className="text-blue-500">Checking configuration...</span>}
          {status === 'configured' && <span className="text-green-500">API key configured</span>}
          {status === 'unconfigured' && <span className="text-yellow-500">API key not configured</span>}
          {status === 'error' && <span className="text-red-500">Error configuring API key</span>}
        </p>
      </div>
      
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">OpenAI API Key</label>
        <div className="flex">
          <input
            type={showApiKey ? "text" : "password"}
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder="sk-..."
            className="flex-1 px-3 py-2 border border-gray-300 rounded-l-lg focus:outline-none focus:ring-2 focus:ring-propagentic-teal"
          />
          <button
            type="button"
            onClick={() => setShowApiKey(!showApiKey)}
            className="px-3 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700"
          >
            {showApiKey ? 'Hide' : 'Show'}
          </button>
          <button
            type="button"
            onClick={handleSaveApiKey}
            className="px-4 py-2 bg-propagentic-teal text-white rounded-r-lg hover:bg-teal-600"
          >
            Save
          </button>
        </div>
      </div>
      
      <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
        <div className="flex items-start">
          <div className="ml-3">
            <p className="text-sm text-yellow-700 font-medium">Security Warning</p>
            <p className="text-xs text-yellow-700 mt-1">
              Using your API key directly in the browser is not recommended for production applications.
              For better security, consider proxying your API requests through a secure backend service.
              <a href="https://help.openai.com/en/articles/5112595-best-practices-for-api-key-safety" 
                 target="_blank" 
                 rel="noreferrer"
                 className="underline ml-1">
                Learn more
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AIConfigurationPanel; 