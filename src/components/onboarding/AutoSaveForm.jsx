import React, { useEffect, useCallback, useState } from 'react';
import { debounce } from 'lodash';
import SaveIndicator from './SaveIndicator';

/**
 * Auto-save form wrapper component that automatically saves form data
 * and provides visual feedback about save status
 */
const AutoSaveForm = ({ 
  children, 
  onSave, 
  formData, 
  debounceMs = 2000,
  className = '',
  showSaveIndicator = true 
}) => {
  const [saveStatus, setSaveStatus] = useState('saved');
  const [lastSaved, setLastSaved] = useState(null);
  const [error, setError] = useState(null);

  // Create debounced save function
  const debouncedSave = useCallback(
    debounce(async (data) => {
      if (!data || Object.keys(data).length === 0) return;
      
      setSaveStatus('saving');
      setError(null);
      
      try {
        await onSave(data);
        setSaveStatus('saved');
        setLastSaved(new Date());
      } catch (error) {
        console.error('Auto-save error:', error);
        setSaveStatus('error');
        setError(error.message || 'Failed to save progress');
      }
    }, debounceMs),
    [onSave, debounceMs]
  );

  // Auto-save when form data changes
  useEffect(() => {
    if (formData && Object.keys(formData).length > 0) {
      debouncedSave(formData);
    }
  }, [formData, debouncedSave]);

  // Manual save function
  const manualSave = useCallback(async () => {
    if (!formData || Object.keys(formData).length === 0) return;
    
    setSaveStatus('saving');
    setError(null);
    
    try {
      await onSave(formData);
      setSaveStatus('saved');
      setLastSaved(new Date());
    } catch (error) {
      console.error('Manual save error:', error);
      setSaveStatus('error');
      setError(error.message || 'Failed to save progress');
    }
  }, [formData, onSave]);

  // Cleanup debounced function on unmount
  useEffect(() => {
    return () => {
      debouncedSave.cancel();
    };
  }, [debouncedSave]);

  return (
    <div className={`relative ${className}`}>
      {/* Save indicator */}
      {showSaveIndicator && (
        <div className="sticky top-0 z-10 mb-4">
          <SaveIndicator 
            status={saveStatus}
            lastSaved={lastSaved}
            error={error}
            onRetry={manualSave}
          />
        </div>
      )}

      {/* Form content */}
      <div className="space-y-6">
        {typeof children === 'function' 
          ? children({ saveStatus, manualSave, error })
          : children
        }
      </div>

      {/* Error display */}
      {error && !showSaveIndicator && (
        <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
          <div className="flex justify-between items-center">
            <div className="flex items-center">
              <svg className="h-5 w-5 text-red-400 mr-2" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              <span className="text-sm text-red-700">{error}</span>
            </div>
            <button
              onClick={manualSave}
              className="text-sm text-red-600 hover:text-red-800 font-medium"
            >
              Retry
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AutoSaveForm; 