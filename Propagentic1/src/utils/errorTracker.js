/**
 * Error tracking utility - Centralizes error handling and tracking
 * This provides a simple logger now, but can be expanded to use Sentry, LogRocket, etc.
 */

// Configuration flags
const CONFIG = {
  logToConsole: true,
  collectMetrics: true,
  maxErrorsStored: 100,
};

// Error storage for metrics
const errors = [];
const errorCounts = {};

/**
 * Main error capture function
 * @param {Error|string} error - The error object or message
 * @param {string} context - Where the error occurred (component name, function, etc.)
 * @param {Object} metadata - Additional information about the error context
 * @param {boolean} silent - Whether to suppress console logging
 */
export const captureError = (error, context = 'unknown', metadata = {}, silent = false) => {
  // Extract error details
  const errorObj = error instanceof Error ? error : new Error(error);
  const message = errorObj.message || String(error);
  const stack = errorObj.stack;
  const name = errorObj.name;
  
  // Create error record with timestamp
  const errorRecord = {
    message,
    stack,
    name,
    context,
    metadata,
    timestamp: new Date().toISOString(),
    // Add browser/environment info if available
    userAgent: navigator?.userAgent,
    url: window?.location?.href,
  };
  
  // Track error in local storage for metrics
  if (CONFIG.collectMetrics) {
    // Keep errors array at maximum size
    if (errors.length >= CONFIG.maxErrorsStored) {
      errors.shift(); // Remove oldest error
    }
    errors.push(errorRecord);
    
    // Update error counts
    const errorKey = `${context}:${name}:${message.substring(0, 100)}`;
    errorCounts[errorKey] = (errorCounts[errorKey] || 0) + 1;
  }
  
  // Log to console if enabled and not silent
  if (CONFIG.logToConsole && !silent) {
    console.error(`[ErrorTracker] ${context}: ${message}`, {
      error: errorObj,
      metadata
    });
  }
  
  // TODO: In future, integrate with Sentry, LogRocket, etc.
  // To be implemented in: src/utils/sentryIntegration.js
  
  return errorRecord;
};

/**
 * Capture an API error with standardized metadata
 * @param {Error} error - The API error
 * @param {string} endpoint - The API endpoint that was called
 * @param {Object} params - The parameters that were passed to the API
 */
export const captureApiError = (error, endpoint, params = {}) => {
  // Extract API-specific info from error if available
  const status = error.status || error.statusCode || 'unknown';
  const statusText = error.statusText || 'Unknown Status';
  
  // Clean sensitive data from params
  const cleanParams = { ...params };
  // Remove passwords, tokens, etc.
  ['password', 'token', 'apiKey', 'secret', 'credential', 'auth'].forEach(key => {
    if (key in cleanParams) {
      cleanParams[key] = '[REDACTED]';
    }
  });
  
  return captureError(error, 'api', {
    endpoint,
    params: cleanParams,
    status,
    statusText
  });
};

/**
 * Capture a Firestore error with standardized metadata
 * @param {Error} error - The Firestore error
 * @param {string} operation - The Firestore operation (get, set, update, etc.)
 * @param {Object} details - Additional details about the operation
 */
export const captureFirestoreError = (error, operation, details = {}) => {
  return captureError(error, 'firestore', {
    operation,
    ...details,
    code: error.code,
    firestoreErrorCode: error.code,
  });
};

/**
 * Get error metrics
 * @returns {Object} Error metrics
 */
export const getErrorMetrics = () => {
  return {
    totalErrors: errors.length,
    errorsByType: errorCounts,
    recentErrors: errors.slice(-10), // Last 10 errors
  };
};

/**
 * Reset error tracking metrics
 */
export const resetErrorMetrics = () => {
  errors.length = 0;
  Object.keys(errorCounts).forEach(key => delete errorCounts[key]);
};

/**
 * Higher-order function to safely execute a function and capture any errors
 * @param {Function} fn - The function to execute
 * @param {string} context - Error context
 * @param {Object} metadata - Additional error metadata
 * @returns {Function} - Wrapped function that captures errors
 */
export const withErrorTracking = (fn, context, metadata = {}) => {
  return (...args) => {
    try {
      return fn(...args);
    } catch (error) {
      captureError(error, context, {
        ...metadata,
        arguments: args.map(arg => 
          // Simple serialization for logging, avoid circular references
          typeof arg === 'object' ? `[${arg?.constructor?.name || 'Object'}]` : String(arg)
        )
      });
      // Re-throw to maintain original behavior
      throw error;
    }
  };
};

/**
 * Create an async function wrapper that captures any errors
 * @param {Function} asyncFn - Async function to wrap
 * @param {string} context - Error context
 * @param {Object} metadata - Additional error metadata
 * @returns {Function} - Wrapped async function
 */
export const withAsyncErrorTracking = (asyncFn, context, metadata = {}) => {
  return async (...args) => {
    try {
      return await asyncFn(...args);
    } catch (error) {
      captureError(error, context, {
        ...metadata,
        arguments: args.map(arg => 
          typeof arg === 'object' ? `[${arg?.constructor?.name || 'Object'}]` : String(arg)
        )
      });
      throw error;
    }
  };
};

export default {
  captureError,
  captureApiError,
  captureFirestoreError,
  getErrorMetrics,
  resetErrorMetrics,
  withErrorTracking,
  withAsyncErrorTracking
}; 