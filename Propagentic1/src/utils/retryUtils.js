/**
 * Utility functions for implementing retry logic on API calls and Firestore operations
 */

/**
 * Exponential backoff calculation helper
 * @param {number} retryCount - Current retry attempt number
 * @param {number} baseDelay - Base delay in milliseconds
 * @param {number} maxDelay - Maximum delay in milliseconds
 * @returns {number} - Delay time in milliseconds
 */
const calculateBackoff = (retryCount, baseDelay = 300, maxDelay = 10000) => {
  // Calculate exponential backoff with jitter: 2^retryCount * baseDelay + random jitter
  const exponentialDelay = Math.min(
    maxDelay,
    Math.pow(2, retryCount) * baseDelay + Math.random() * 100
  );
  return exponentialDelay;
};

/**
 * Retry function with exponential backoff
 * @param {Function} operation - The async function to retry
 * @param {Object} options - Retry options
 * @param {number} options.maxRetries - Maximum number of retry attempts (default: 3)
 * @param {number} options.baseDelay - Initial delay in milliseconds (default: 300)
 * @param {number} options.maxDelay - Maximum delay in milliseconds (default: 10000)
 * @param {Function} options.shouldRetry - Function to determine if the error is retryable (default: all errors)
 * @param {Function} options.onRetry - Callback executed before each retry (receives retry count and error)
 * @returns {Promise<any>} - Result of the operation
 */
export const withRetry = async (operation, options = {}) => {
  const {
    maxRetries = 3,
    baseDelay = 300,
    maxDelay = 10000,
    shouldRetry = () => true,
    onRetry = () => {}
  } = options;
  
  let retryCount = 0;
  
  const executeWithRetry = async () => {
    try {
      return await operation();
    } catch (error) {
      // Check if we should retry based on the error and retry count
      if (retryCount < maxRetries && shouldRetry(error)) {
        retryCount++;
        
        // Calculate backoff delay
        const delay = calculateBackoff(retryCount, baseDelay, maxDelay);
        
        // Execute onRetry callback if provided
        if (onRetry) {
          onRetry(retryCount, error, delay);
        }
        
        // Wait for the backoff period
        await new Promise(resolve => setTimeout(resolve, delay));
        
        // Try again
        return executeWithRetry();
      }
      
      // We've exhausted retries or error is not retryable
      throw error;
    }
  };
  
  return executeWithRetry();
};

/**
 * Firestore error classifier
 * Determines if an error from a Firestore operation is retryable
 * @param {Error} error - The error to check
 * @returns {boolean} - Whether the error is retryable
 */
export const isFirestoreRetryableError = (error) => {
  // Common Firestore error codes that are worth retrying
  const retryableCodes = [
    'unavailable',               // Service unavailable, likely temporary
    'deadline-exceeded',         // Operation took too long, possible timeout
    'resource-exhausted',        // Rate limit or quota exceeded
    'internal',                  // Internal server error
    'failed-precondition',       // System not in a state for this operation
    'network-request-failed'     // Network issue
  ];
  
  // Check if the error has a code that's retryable
  const errorCode = error?.code || '';
  return retryableCodes.some(code => errorCode.includes(code));
};

/**
 * Wraps a Firestore operation with retry logic specifically configured for Firestore
 * @param {Function} operation - The Firestore operation to execute
 * @param {Object} options - Optional configuration for the retry
 * @param {string} options.operationName - Name of the operation for logging
 * @returns {Promise<any>} - Result of the operation
 */
export const withFirestoreRetry = (operation, options = {}) => {
  const { operationName = 'Firestore operation' } = options;
  
  // Enhance on-retry logging
  const enhancedOptions = {
    maxRetries: 5,
    baseDelay: 500,
    maxDelay: 15000,
    shouldRetry: isFirestoreRetryableError,
    onRetry: (retryCount, error, delay) => {
      console.warn(
        `Retrying ${operationName} (attempt ${retryCount}) after error: ${error.message || error}. ` +
        `Next retry in ${Math.round(delay / 100) / 10}s.`
      );
      
      // Call the original onRetry if provided
      if (options.onRetry) {
        options.onRetry(retryCount, error, delay);
      }
    },
    ...options
  };
  
  return withRetry(async () => {
    try {
      return await operation();
    } catch (error) {
      // Enhance error with operation context
      if (error && typeof error === 'object') {
        error.operationName = operationName;
        error.message = `${operationName} failed: ${error.message || 'Unknown error'}`;
      }
      throw error;
    }
  }, enhancedOptions);
};

/**
 * Circuit breaker pattern implementation for Firestore
 */
class FirestoreCircuitBreaker {
  constructor(options = {}) {
    this.failureThreshold = options.failureThreshold || 5;
    this.resetTimeout = options.resetTimeout || 30000; // 30 seconds
    this.failureCount = 0;
    this.state = 'CLOSED'; // CLOSED, OPEN, HALF_OPEN
    this.lastFailureTime = null;
  }
  
  async executeOperation(operation) {
    if (this.state === 'OPEN') {
      // Check if it's time to try again
      const now = Date.now();
      if (now - this.lastFailureTime > this.resetTimeout) {
        this.state = 'HALF_OPEN';
      } else {
        throw new Error('Circuit breaker is OPEN - Firestore service appears to be down');
      }
    }
    
    try {
      const result = await operation();
      
      // Reset if successful in HALF_OPEN state
      if (this.state === 'HALF_OPEN') {
        this.reset();
      }
      
      return result;
    } catch (error) {
      this.recordFailure();
      throw error;
    }
  }
  
  recordFailure() {
    this.failureCount++;
    this.lastFailureTime = Date.now();
    
    if (this.failureCount >= this.failureThreshold) {
      this.state = 'OPEN';
    }
  }
  
  reset() {
    this.failureCount = 0;
    this.state = 'CLOSED';
    this.lastFailureTime = null;
  }
  
  getState() {
    return this.state;
  }
}

// Create a singleton instance for the application
export const firestoreCircuitBreaker = new FirestoreCircuitBreaker();

/**
 * Execute a Firestore operation with circuit breaker pattern
 * @param {Function} operation - Async operation to execute
 * @returns {Promise<any>} - Result of the operation
 */
export const withCircuitBreaker = async (operation) => {
  return firestoreCircuitBreaker.executeOperation(operation);
};

/**
 * Comprehensive Firestore resilience wrapper combining retry and circuit breaker
 * @param {Function} operation - Firestore operation to execute
 * @param {Object} options - Retry options
 * @returns {Promise<any>} - Result of operation
 */
export const resilientFirestoreOperation = async (operation, options = {}) => {
  return withCircuitBreaker(() => withFirestoreRetry(operation, options));
}; 