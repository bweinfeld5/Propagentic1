import { useState, useCallback, useRef, useEffect } from 'react';

/**
 * Hook for managing multiple loading states with detailed tracking
 * @param {Object} initialStates - Initial loading states
 * @param {Object} options - Configuration options
 * @returns {Object} - Loading state management utilities
 */
export const useLoadingStates = (initialStates = {}, options = {}) => {
  const {
    persistToStorage = false,
    storageKey = 'loading-states',
    globalTimeout = 30000, // 30 seconds global timeout
    enableDebug = false
  } = options;

  // Initialize states with defaults
  const [loadingStates, setLoadingStates] = useState(() => {
    const defaultStates = {
      global: false,
      properties: false,
      tickets: false,
      tenants: false,
      ...initialStates
    };

    // Load from storage if enabled
    if (persistToStorage && typeof Storage !== 'undefined') {
      try {
        const stored = localStorage.getItem(storageKey);
        if (stored) {
          const parsedStates = JSON.parse(stored);
          return { ...defaultStates, ...parsedStates };
        }
      } catch (error) {
        console.warn('Failed to load loading states from storage:', error);
      }
    }

    return defaultStates;
  });

  // Track loading start times and timeouts
  const startTimesRef = useRef({});
  const timeoutsRef = useRef({});
  const debugInfoRef = useRef({});

  // Persist to storage when states change
  useEffect(() => {
    if (persistToStorage && typeof Storage !== 'undefined') {
      try {
        localStorage.setItem(storageKey, JSON.stringify(loadingStates));
      } catch (error) {
        console.warn('Failed to persist loading states:', error);
      }
    }
  }, [loadingStates, persistToStorage, storageKey]);

  // Set loading state for a specific key
  const setLoading = useCallback((key, isLoading, timeout = globalTimeout) => {
    if (enableDebug) {
      console.log(`Loading state change: ${key} = ${isLoading}`);
    }

    setLoadingStates(prev => {
      const newStates = { ...prev, [key]: isLoading };
      
      if (isLoading) {
        // Record start time
        startTimesRef.current[key] = Date.now();
        
        // Set timeout if specified
        if (timeout > 0) {
          // Clear existing timeout
          if (timeoutsRef.current[key]) {
            clearTimeout(timeoutsRef.current[key]);
          }
          
          // Set new timeout
          timeoutsRef.current[key] = setTimeout(() => {
            console.warn(`Loading timeout for ${key} after ${timeout}ms`);
            setLoadingStates(prevStates => ({
              ...prevStates,
              [key]: false
            }));
            
            // Clean up
            delete startTimesRef.current[key];
            delete timeoutsRef.current[key];
          }, timeout);
        }
        
        // Store debug info
        if (enableDebug) {
          debugInfoRef.current[key] = {
            startTime: startTimesRef.current[key],
            timeout,
            stack: new Error().stack
          };
        }
      } else {
        // Calculate duration
        const startTime = startTimesRef.current[key];
        if (startTime && enableDebug) {
          const duration = Date.now() - startTime;
          console.log(`Loading completed for ${key} in ${duration}ms`);
        }
        
        // Clear timeout
        if (timeoutsRef.current[key]) {
          clearTimeout(timeoutsRef.current[key]);
          delete timeoutsRef.current[key];
        }
        
        // Clean up tracking
        delete startTimesRef.current[key];
        delete debugInfoRef.current[key];
      }
      
      return newStates;
    });
  }, [globalTimeout, enableDebug]);

  // Set multiple loading states
  const setMultipleLoading = useCallback((stateUpdates) => {
    setLoadingStates(prev => {
      const newStates = { ...prev };
      
      Object.entries(stateUpdates).forEach(([key, isLoading]) => {
        newStates[key] = isLoading;
        
        if (isLoading) {
          startTimesRef.current[key] = Date.now();
        } else {
          // Calculate duration for debug
          if (enableDebug && startTimesRef.current[key]) {
            const duration = Date.now() - startTimesRef.current[key];
            console.log(`Loading completed for ${key} in ${duration}ms`);
          }
          
          // Clean up
          if (timeoutsRef.current[key]) {
            clearTimeout(timeoutsRef.current[key]);
            delete timeoutsRef.current[key];
          }
          delete startTimesRef.current[key];
        }
      });
      
      return newStates;
    });
  }, [enableDebug]);

  // Clear all loading states
  const clearAllLoading = useCallback(() => {
    // Clear all timeouts
    Object.values(timeoutsRef.current).forEach(timeout => {
      clearTimeout(timeout);
    });
    
    // Reset refs
    startTimesRef.current = {};
    timeoutsRef.current = {};
    debugInfoRef.current = {};
    
    // Reset states
    setLoadingStates(prev => {
      const clearedStates = {};
      Object.keys(prev).forEach(key => {
        clearedStates[key] = false;
      });
      return clearedStates;
    });
  }, []);

  // Check if any state is loading
  const isAnyLoading = useCallback((keys = null) => {
    if (keys) {
      return keys.some(key => loadingStates[key]);
    }
    return Object.values(loadingStates).some(state => state);
  }, [loadingStates]);

  // Check if all specified states are loading
  const areAllLoading = useCallback((keys) => {
    return keys.every(key => loadingStates[key]);
  }, [loadingStates]);

  // Get loading duration for a key
  const getLoadingDuration = useCallback((key) => {
    const startTime = startTimesRef.current[key];
    return startTime ? Date.now() - startTime : 0;
  }, []);

  // Get all loading durations
  const getAllLoadingDurations = useCallback(() => {
    const durations = {};
    Object.keys(startTimesRef.current).forEach(key => {
      durations[key] = Date.now() - startTimesRef.current[key];
    });
    return durations;
  }, []);

  // Wrap an async function with loading state management
  const withLoading = useCallback((key, asyncFn, timeout = globalTimeout) => {
    return async (...args) => {
      setLoading(key, true, timeout);
      try {
        const result = await asyncFn(...args);
        setLoading(key, false);
        return result;
      } catch (error) {
        setLoading(key, false);
        throw error;
      }
    };
  }, [setLoading, globalTimeout]);

  // Create a loading wrapper for multiple operations
  const withMultipleLoading = useCallback((keys, asyncFn) => {
    return async (...args) => {
      const loadingUpdates = {};
      keys.forEach(key => {
        loadingUpdates[key] = true;
      });
      
      setMultipleLoading(loadingUpdates);
      
      try {
        const result = await asyncFn(...args);
        
        // Clear loading states
        const clearUpdates = {};
        keys.forEach(key => {
          clearUpdates[key] = false;
        });
        setMultipleLoading(clearUpdates);
        
        return result;
      } catch (error) {
        // Clear loading states on error
        const clearUpdates = {};
        keys.forEach(key => {
          clearUpdates[key] = false;
        });
        setMultipleLoading(clearUpdates);
        
        throw error;
      }
    };
  }, [setMultipleLoading]);

  // Get loading state summary
  const getLoadingSummary = useCallback(() => {
    const activeLoading = Object.entries(loadingStates)
      .filter(([_, isLoading]) => isLoading)
      .map(([key]) => key);
    
    const durations = getAllLoadingDurations();
    
    return {
      totalActive: activeLoading.length,
      activeKeys: activeLoading,
      durations,
      isAnyActive: activeLoading.length > 0,
      longestRunning: activeLoading.length > 0 
        ? activeLoading.reduce((longest, key) => 
            durations[key] > (durations[longest] || 0) ? key : longest
          )
        : null
    };
  }, [loadingStates, getAllLoadingDurations]);

  // Debug utilities
  const getDebugInfo = useCallback(() => {
    if (!enableDebug) {
      return { message: 'Debug mode is disabled' };
    }
    
    return {
      currentStates: loadingStates,
      startTimes: { ...startTimesRef.current },
      debugInfo: { ...debugInfoRef.current },
      summary: getLoadingSummary()
    };
  }, [loadingStates, getLoadingSummary, enableDebug]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      // Clear all timeouts
      Object.values(timeoutsRef.current).forEach(timeout => {
        clearTimeout(timeout);
      });
    };
  }, []);

  return {
    // State
    loadingStates,
    
    // Basic actions
    setLoading,
    setMultipleLoading,
    clearAllLoading,
    
    // Checkers
    isLoading: (key) => Boolean(loadingStates[key]),
    isAnyLoading,
    areAllLoading,
    
    // Duration tracking
    getLoadingDuration,
    getAllLoadingDurations,
    
    // Wrappers
    withLoading,
    withMultipleLoading,
    
    // Analytics
    getLoadingSummary,
    getDebugInfo,
    
    // Convenience getters
    isGlobalLoading: Boolean(loadingStates.global),
    isPropertiesLoading: Boolean(loadingStates.properties),
    isTicketsLoading: Boolean(loadingStates.tickets),
    isTenantsLoading: Boolean(loadingStates.tenants)
  };
};

/**
 * Simple loading state hook for single operations
 * @param {boolean} initialState - Initial loading state
 * @returns {Object} - Simple loading state management
 */
export const useLoading = (initialState = false) => {
  const [isLoading, setIsLoading] = useState(initialState);
  const startTimeRef = useRef(null);

  const setLoading = useCallback((loading) => {
    if (loading) {
      startTimeRef.current = Date.now();
    } else {
      startTimeRef.current = null;
    }
    setIsLoading(loading);
  }, []);

  const withLoading = useCallback((asyncFn) => {
    return async (...args) => {
      setLoading(true);
      try {
        const result = await asyncFn(...args);
        setLoading(false);
        return result;
      } catch (error) {
        setLoading(false);
        throw error;
      }
    };
  }, [setLoading]);

  const getDuration = useCallback(() => {
    return startTimeRef.current ? Date.now() - startTimeRef.current : 0;
  }, []);

  return {
    isLoading,
    setLoading,
    withLoading,
    getDuration
  };
};

export default useLoadingStates;