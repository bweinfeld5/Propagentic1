import React, { useState, useEffect } from 'react';

/**
 * Debug component for displaying and managing localStorage
 * 
 * Usage:
 * - Import and add <LocalStorageDebug /> to any component
 * - Toggle visibility with the "Show/Hide" button
 * - This component will automatically removed itself in production builds
 */
const LocalStorageDebug = () => {
  const [visible, setVisible] = useState(false);
  const [localStorage, setLocalStorage] = useState({});
  const [selectedKey, setSelectedKey] = useState('');
  const [selectedValue, setSelectedValue] = useState('');
  
  // Load localStorage data
  useEffect(() => {
    if (process.env.NODE_ENV === 'production') {
      return; // Don't render in production
    }
    
    const loadStorage = () => {
      const items = {};
      for (let i = 0; i < window.localStorage.length; i++) {
        const key = window.localStorage.key(i);
        try {
          const value = window.localStorage.getItem(key);
          items[key] = value;
        } catch (error) {
          items[key] = `[Error: ${error.message}]`;
        }
      }
      setLocalStorage(items);
    };
    
    loadStorage();
    
    // Add event listener for storage changes
    window.addEventListener('storage', loadStorage);
    return () => window.removeEventListener('storage', loadStorage);
  }, [visible]);
  
  // Select a key to view/edit
  const handleSelectKey = (key) => {
    setSelectedKey(key);
    setSelectedValue(localStorage[key] || '');
  };
  
  // Update localStorage value
  const handleUpdateValue = () => {
    if (selectedKey) {
      window.localStorage.setItem(selectedKey, selectedValue);
      setLocalStorage(prev => ({
        ...prev,
        [selectedKey]: selectedValue
      }));
    }
  };
  
  // Delete localStorage key
  const handleDeleteKey = (key) => {
    window.localStorage.removeItem(key);
    setLocalStorage(prev => {
      const newState = {...prev};
      delete newState[key];
      return newState;
    });
    if (selectedKey === key) {
      setSelectedKey('');
      setSelectedValue('');
    }
  };
  
  // Don't render anything in production
  if (process.env.NODE_ENV === 'production') {
    return null;
  }
  
  return (
    <div className="fixed bottom-0 right-0 z-50 bg-white border border-gray-300 rounded-tl shadow-lg">
      <button 
        className="w-full bg-blue-500 text-white py-1 px-2 text-sm"
        onClick={() => setVisible(!visible)}
      >
        {visible ? 'Hide' : 'Show'} LocalStorage Debug
      </button>
      
      {visible && (
        <div className="p-3 max-w-md max-h-96 overflow-auto">
          <h3 className="text-lg font-bold mb-2">LocalStorage Contents</h3>
          
          {Object.keys(localStorage).length === 0 ? (
            <p className="text-gray-500 italic">LocalStorage is empty</p>
          ) : (
            <div className="grid grid-cols-1 gap-3">
              <div className="border rounded overflow-hidden">
                <div className="bg-gray-100 px-2 py-1 text-sm font-medium">Keys</div>
                <div className="max-h-40 overflow-y-auto">
                  {Object.keys(localStorage).map(key => (
                    <div 
                      key={key} 
                      className={`px-2 py-1 text-sm flex justify-between items-center cursor-pointer ${selectedKey === key ? 'bg-blue-100' : 'hover:bg-gray-50'}`}
                      onClick={() => handleSelectKey(key)}
                    >
                      <span className="truncate">{key}</span>
                      <button 
                        className="text-red-500 text-xs hover:text-red-700"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteKey(key);
                        }}
                      >
                        Delete
                      </button>
                    </div>
                  ))}
                </div>
              </div>
              
              {selectedKey && (
                <div className="border rounded overflow-hidden">
                  <div className="bg-gray-100 px-2 py-1 text-sm font-medium">
                    Value for: {selectedKey}
                  </div>
                  <div className="p-2">
                    <textarea
                      className="w-full border p-2 text-sm"
                      rows="5"
                      value={selectedValue}
                      onChange={(e) => setSelectedValue(e.target.value)}
                    />
                    <div className="flex justify-end mt-1">
                      <button
                        className="bg-green-500 text-white px-2 py-1 text-xs rounded"
                        onClick={handleUpdateValue}
                      >
                        Update
                      </button>
                    </div>
                  </div>
                </div>
              )}
              
              <div className="flex justify-between mt-1">
                <button
                  className="bg-red-500 text-white px-2 py-1 text-xs rounded"
                  onClick={() => {
                    if (window.confirm('Clear all localStorage items?')) {
                      window.localStorage.clear();
                      setLocalStorage({});
                      setSelectedKey('');
                      setSelectedValue('');
                    }
                  }}
                >
                  Clear All
                </button>
                <button
                  className="bg-gray-500 text-white px-2 py-1 text-xs rounded"
                  onClick={() => {
                    try {
                      const parsed = JSON.parse(selectedValue);
                      setSelectedValue(JSON.stringify(parsed, null, 2));
                    } catch (e) {
                      alert('Not valid JSON: ' + e.message);
                    }
                  }}
                  disabled={!selectedValue}
                >
                  Format JSON
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default LocalStorageDebug; 