import { useState, useCallback, useRef } from 'react';
import { useConnection } from '../context/ConnectionContext';
import { withRetry, isFirestoreRetryableError } from '../utils/retryUtils';

/**
 * Custom hook for handling retry logic with connection awareness
 * @param {Function} operation - The async operation to retry
 * @param {Object} options - Configuration options
 * @returns {Object} - Retry state and functions
 */
export const useRetry = (operation, options = {}) => {
  const {
    maxRetries = 3,
    baseDelay = 1000,
    shouldRetry = isFirestoreRetryableError,
    onRetryAttempt = null,
    onSuccess = null,
    onError = null,
    resetOnSuccess = true,
    ...retryOptions
  } = options;

  const { 
    isOnline, 
    connectionQuality, 
    getRetryDelay,
    incrementRetryAttempts: incrementConnectionRetries,
    resetRetryAttempts: resetConnectionRetries
  } = useConnection();

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [retryCount, setRetryCount] = useState(0);
  const [lastAttempt, setLastAttempt] = useState(null);
  const [hasSucceeded, setHasSucceeded] = useState(false);
  
  const abortControllerRef = useRef(null);
  const timeoutRef = useRef(null);

  // Enhanced retry function with connection awareness
  const executeWithRetry = useCallback(async (...args) => {
    // Clear any existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Create new abort controller
    abortControllerRef.current = new AbortController();
    const { signal } = abortControllerRef.current;

    setIsLoading(true);
    setError(null);
    setLastAttempt(Date.now());

    // Connection-aware retry configuration
    const connectionAwareOptions = {
      maxRetries: isOnline ? maxRetries : Math.max(1, maxRetries - 2),
      baseDelay: connectionQuality === 'poor' ? baseDelay * 2 : baseDelay,
      shouldRetry: (error) => {
        // Don't retry if offline and it's not a network error
        if (!isOnline && !isNetworkError(error)) {
          return false;
        }
        
        // Use custom shouldRetry function if provided
        if (typeof shouldRetry === 'function') {
          return shouldRetry(error);
        }
        
        return isFirestoreRetryableError(error);
      },
      onRetry: (attemptNumber, error, delay) => {
        setRetryCount(attemptNumber);
        incrementConnectionRetries();
        
        console.log(
          `Retry attempt ${attemptNumber}/${maxRetries} ` +
          `(connection: ${connectionQuality}, delay: ${delay}ms): ${error.message}`
        );
        
        if (onRetryAttempt) {
          onRetryAttempt(attemptNumber, error, delay);
        }
      },
      ...retryOptions
    };

    try {
      // Add abort signal to operation if it supports it
      const operationArgs = signal ? [...args, { signal }] : args;
      const result = await withRetry(
        () => operation(...operationArgs),
        connectionAwareOptions
      );

      // Success handling
      setHasSucceeded(true);
      setIsLoading(false);
      
      if (resetOnSuccess) {
        setRetryCount(0);
        resetConnectionRetries();
      }
      
      if (onSuccess) {
        onSuccess(result);
      }
      
      return result;

    } catch (err) {
      // Don't update state if operation was aborted
      if (signal.aborted) {
        return;
      }

      setError(err);
      setIsLoading(false);
      
      if (onError) {
        onError(err);
      }
      
      throw err;
    }
  }, [
    operation,
    maxRetries,
    baseDelay,
    shouldRetry,
    onRetryAttempt,
    onSuccess,
    onError,
    resetOnSuccess,
    isOnline,
    connectionQuality,
    incrementConnectionRetries,
    resetConnectionRetries,
    retryOptions
  ]);

  // Retry with delay based on connection quality
  const retryWithDelay = useCallback(async (delayOverride = null, ...args) => {
    const delay = delayOverride || getRetryDelay();
    
    return new Promise((resolve, reject) => {
      timeoutRef.current = setTimeout(async () => {
        try {
          const result = await executeWithRetry(...args);
          resolve(result);
        } catch (error) {
          reject(error);
        }
      }, delay);
    });
  }, [executeWithRetry, getRetryDelay]);

  // Cancel any ongoing operation
  const cancel = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    setIsLoading(false);
  }, []);

  // Reset retry state
  const reset = useCallback(() => {
    cancel();
    setError(null);
    setRetryCount(0);
    setLastAttempt(null);
    setHasSucceeded(false);
    resetConnectionRetries();
  }, [cancel, resetConnectionRetries]);

  // Get current retry status
  const getStatus = useCallback(() => {
    if (isLoading) return 'loading';
    if (error) return 'error';
    if (hasSucceeded) return 'success';
    return 'idle';
  }, [isLoading, error, hasSucceeded]);

  // Get retry recommendation based on connection
  const getRetryRecommendation = useCallback(() => {
    if (!isOnline) {
      return {
        shouldRetry: false,
        message: 'Cannot retry while offline',
        recommendedDelay: null
      };
    }

    const hasRetriesLeft = retryCount < maxRetries;
    const recommendedDelay = getRetryDelay();

    return {
      shouldRetry: hasRetriesLeft,
      message: hasRetriesLeft 
        ? `Retry available (${retryCount}/${maxRetries} attempts used)`
        : 'Maximum retries exceeded',
      recommendedDelay,
      connectionQuality
    };
  }, [isOnline, retryCount, maxRetries, getRetryDelay, connectionQuality]);

  return {
    // State
    isLoading,
    error,
    retryCount,
    lastAttempt,
    hasSucceeded,
    status: getStatus(),
    
    // Actions
    execute: executeWithRetry,
    retry: retryWithDelay,
    cancel,
    reset,
    
    // Helpers
    getRetryRecommendation,
    canRetry: retryCount < maxRetries && isOnline,
    
    // Connection info
    connectionQuality,
    isOnline
  };
};

/**
 * Helper function to determine if an error is network-related
 * @param {Error} error - The error to check
 * @returns {boolean} - Whether the error is network-related
 */
const isNetworkError = (error) => {
  const networkErrorMessages = [
    'network',
    'fetch',
    'connection',
    'timeout',
    'offline',
    'unreachable'
  ];
  
  const errorMessage = (error?.message || '').toLowerCase();
  return networkErrorMessages.some(msg => errorMessage.includes(msg));
};

/**
 * Hook for simple retry operations without complex state management
 * @param {Function} operation - The operation to retry
 * @param {Object} options - Retry options
 * @returns {Function} - Execute function that returns a promise
 */
export const useSimpleRetry = (operation, options = {}) => {
  const { execute } = useRetry(operation, options);
  return execute;
};

export default useRetry;