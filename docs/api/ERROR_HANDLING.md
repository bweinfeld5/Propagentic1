# Error Handling Guide

## Table of Contents
- [Overview](#overview)
- [Error Types](#error-types)
- [Firebase Functions Errors](#firebase-functions-errors)
- [Client-Side Error Handling](#client-side-error-handling)
- [Error Monitoring](#error-monitoring)
- [Logging Strategy](#logging-strategy)
- [User Experience](#user-experience)
- [Testing Error Scenarios](#testing-error-scenarios)
- [Best Practices](#best-practices)

## Overview

Comprehensive error handling is crucial for providing a reliable user experience and maintaining system stability. This guide covers error handling patterns across the entire Propagentic application stack.

### Error Handling Philosophy
1. **Fail Fast**: Detect errors early and provide immediate feedback
2. **Graceful Degradation**: Maintain functionality when possible
3. **Informative Messages**: Provide actionable error information
4. **Consistent Patterns**: Use standardized error formats
5. **Comprehensive Logging**: Enable effective debugging and monitoring

## Error Types

### 1. Authentication Errors
```typescript
interface AuthError {
  code: 'auth/user-not-found' | 'auth/wrong-password' | 'auth/email-already-in-use' | 
        'auth/weak-password' | 'auth/invalid-email' | 'auth/user-disabled' |
        'auth/too-many-requests' | 'auth/network-request-failed';
  message: string;
  details?: any;
}
```

### 2. Validation Errors
```typescript
interface ValidationError {
  code: 'validation/required-field' | 'validation/invalid-format' | 
        'validation/out-of-range' | 'validation/invalid-type';
  field: string;
  message: string;
  expectedFormat?: string;
}
```

### 3. Business Logic Errors
```typescript
interface BusinessError {
  code: 'business/insufficient-permissions' | 'business/resource-not-found' |
        'business/operation-not-allowed' | 'business/quota-exceeded';
  message: string;
  context?: any;
}
```

### 4. Network Errors
```typescript
interface NetworkError {
  code: 'network/timeout' | 'network/connection-failed' | 
        'network/server-error' | 'network/rate-limited';
  message: string;
  statusCode?: number;
  retryable: boolean;
}
```

## Firebase Functions Errors

### Standard Error Codes
```typescript
// functions/src/utils/errors.ts
export enum ErrorCodes {
  // Authentication
  UNAUTHENTICATED = 'unauthenticated',
  PERMISSION_DENIED = 'permission-denied',
  
  // Validation
  INVALID_ARGUMENT = 'invalid-argument',
  FAILED_PRECONDITION = 'failed-precondition',
  
  // Resources
  NOT_FOUND = 'not-found',
  ALREADY_EXISTS = 'already-exists',
  RESOURCE_EXHAUSTED = 'resource-exhausted',
  
  // System
  INTERNAL = 'internal',
  UNAVAILABLE = 'unavailable',
  DEADLINE_EXCEEDED = 'deadline-exceeded'
}

export class AppError extends Error {
  constructor(
    public code: ErrorCodes,
    message: string,
    public details?: any
  ) {
    super(message);
    this.name = 'AppError';
  }
}
```

### Error Factory Functions
```typescript
// functions/src/utils/errorFactory.ts
import * as functions from 'firebase-functions';

export const createAuthError = (message: string, details?: any) => {
  return new functions.https.HttpsError('unauthenticated', message, details);
};

export const createValidationError = (field: string, message: string) => {
  return new functions.https.HttpsError('invalid-argument', message, { field });
};

export const createPermissionError = (resource: string, action: string) => {
  return new functions.https.HttpsError(
    'permission-denied',
    `Access denied: cannot ${action} ${resource}`,
    { resource, action }
  );
};

export const createNotFoundError = (resource: string, id: string) => {
  return new functions.https.HttpsError(
    'not-found',
    `${resource} with ID '${id}' not found`,
    { resource, id }
  );
};

export const createConflictError = (resource: string, field: string, value: string) => {
  return new functions.https.HttpsError(
    'already-exists',
    `${resource} with ${field} '${value}' already exists`,
    { resource, field, value }
  );
};
```

### Function Error Handling Pattern
```typescript
// functions/src/patterns/errorHandling.ts
export const withErrorHandling = (handler: Function) => {
  return async (data: any, context: any) => {
    const startTime = Date.now();
    const functionName = handler.name;
    
    try {
      console.log(`[${functionName}] Function started`, {
        uid: context.auth?.uid,
        data: JSON.stringify(data),
        timestamp: new Date().toISOString()
      });

      const result = await handler(data, context);
      
      const duration = Date.now() - startTime;
      console.log(`[${functionName}] Function completed successfully`, {
        duration: `${duration}ms`,
        uid: context.auth?.uid
      });
      
      return result;
      
    } catch (error) {
      const duration = Date.now() - startTime;
      
      // Log error details
      console.error(`[${functionName}] Function failed`, {
        error: error.message,
        code: error.code,
        stack: error.stack,
        duration: `${duration}ms`,
        uid: context.auth?.uid,
        data: JSON.stringify(data)
      });
      
      // Re-throw known HttpsErrors
      if (error instanceof functions.https.HttpsError) {
        throw error;
      }
      
      // Handle unexpected errors
      if (error.code === 'UNAUTHENTICATED') {
        throw createAuthError('Authentication required');
      }
      
      if (error.code === 'PERMISSION_DENIED') {
        throw createPermissionError('resource', 'access');
      }
      
      // Default to internal error
      throw new functions.https.HttpsError(
        'internal',
        'An unexpected error occurred',
        { originalError: error.message }
      );
    }
  };
};

// Usage example
export const sendPropertyInvite = functions.https.onCall(
  withErrorHandling(async (data, context) => {
    // Function implementation
    return { success: true };
  })
);
```

### Input Validation
```typescript
// functions/src/utils/validation.ts
export const validateRequired = (data: any, fields: string[]) => {
  const missing = fields.filter(field => !data[field]);
  if (missing.length > 0) {
    throw createValidationError(
      missing[0],
      `Missing required field(s): ${missing.join(', ')}`
    );
  }
};

export const validateEmail = (email: string) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    throw createValidationError('email', 'Invalid email format');
  }
};

export const validateUserType = (userType: string) => {
  const validTypes = ['landlord', 'tenant', 'contractor', 'admin'];
  if (!validTypes.includes(userType)) {
    throw createValidationError(
      'userType',
      `Invalid user type. Must be one of: ${validTypes.join(', ')}`
    );
  }
};

export const validatePropertyOwnership = async (
  propertyId: string,
  landlordId: string
) => {
  const propertyDoc = await admin.firestore()
    .collection('properties')
    .doc(propertyId)
    .get();
    
  if (!propertyDoc.exists) {
    throw createNotFoundError('Property', propertyId);
  }
  
  if (propertyDoc.data()?.landlordId !== landlordId) {
    throw createPermissionError('property', 'modify');
  }
};
```

## Client-Side Error Handling

### Error Context Provider
```javascript
// context/ErrorContext.jsx
import { createContext, useContext, useState, useCallback } from 'react';
import { toast } from 'react-toastify';

const ErrorContext = createContext();

export function useError() {
  return useContext(ErrorContext);
}

export function ErrorProvider({ children }) {
  const [errors, setErrors] = useState([]);

  const addError = useCallback((error) => {
    const errorId = Date.now().toString();
    const errorObj = {
      id: errorId,
      message: error.message || 'An unexpected error occurred',
      code: error.code,
      timestamp: new Date(),
      details: error.details
    };

    setErrors(prev => [...prev, errorObj]);

    // Show toast notification
    toast.error(errorObj.message, {
      toastId: errorId,
      autoClose: 5000
    });

    // Auto-remove after 10 seconds
    setTimeout(() => {
      removeError(errorId);
    }, 10000);

    return errorId;
  }, []);

  const removeError = useCallback((errorId) => {
    setErrors(prev => prev.filter(error => error.id !== errorId));
  }, []);

  const clearErrors = useCallback(() => {
    setErrors([]);
  }, []);

  const value = {
    errors,
    addError,
    removeError,
    clearErrors
  };

  return (
    <ErrorContext.Provider value={value}>
      {children}
    </ErrorContext.Provider>
  );
}
```

### Error Boundary Component
```javascript
// components/error/ErrorBoundary.jsx
import React from 'react';
import { logError } from '../../utils/errorLogging';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({
      error,
      errorInfo
    });

    // Log error to monitoring service
    logError(error, {
      componentStack: errorInfo.componentStack,
      errorBoundary: true,
      props: this.props
    });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="error-boundary">
          <h2>Something went wrong</h2>
          <p>We're sorry, but something unexpected happened.</p>
          
          {process.env.NODE_ENV === 'development' && (
            <details style={{ whiteSpace: 'pre-wrap' }}>
              <summary>Error Details (Development)</summary>
              {this.state.error && this.state.error.toString()}
              <br />
              {this.state.errorInfo.componentStack}
            </details>
          )}
          
          <button
            onClick={() => this.setState({ hasError: false, error: null, errorInfo: null })}
          >
            Try Again
          </button>
          
          <button onClick={() => window.location.reload()}>
            Reload Page
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
```

### Service Error Handling
```javascript
// services/errorService.js
import { getAuthErrorMessage } from '../utils/authErrors';
import { logError } from '../utils/errorLogging';

export class ApiError extends Error {
  constructor(code, message, details = null, statusCode = null) {
    super(message);
    this.name = 'ApiError';
    this.code = code;
    this.details = details;
    this.statusCode = statusCode;
  }
}

export const handleApiError = (error, context = {}) => {
  // Log error
  logError(error, context);

  // Handle Firebase Functions errors
  if (error.code) {
    switch (error.code) {
      case 'unauthenticated':
        return new ApiError(
          'UNAUTHENTICATED',
          'Please log in to continue',
          error.details
        );
        
      case 'permission-denied':
        return new ApiError(
          'PERMISSION_DENIED',
          'You do not have permission to perform this action',
          error.details
        );
        
      case 'not-found':
        return new ApiError(
          'NOT_FOUND',
          'The requested resource was not found',
          error.details
        );
        
      case 'invalid-argument':
        return new ApiError(
          'VALIDATION_ERROR',
          error.message || 'Invalid input provided',
          error.details
        );
        
      case 'already-exists':
        return new ApiError(
          'CONFLICT',
          error.message || 'Resource already exists',
          error.details
        );
        
      default:
        return new ApiError(
          'API_ERROR',
          error.message || 'An error occurred while processing your request',
          error.details
        );
    }
  }

  // Handle authentication errors
  if (error.code && error.code.startsWith('auth/')) {
    const message = getAuthErrorMessage(error.code);
    return new ApiError('AUTH_ERROR', message, { originalCode: error.code });
  }

  // Handle network errors
  if (error.name === 'NetworkError' || error.code === 'NETWORK_ERROR') {
    return new ApiError(
      'NETWORK_ERROR',
      'Network error. Please check your connection and try again.',
      error.details
    );
  }

  // Default error
  return new ApiError(
    'UNKNOWN_ERROR',
    'An unexpected error occurred. Please try again.',
    { originalError: error.message }
  );
};

// Service wrapper for API calls
export const withErrorHandling = (apiCall) => {
  return async (...args) => {
    try {
      return await apiCall(...args);
    } catch (error) {
      throw handleApiError(error, {
        apiCall: apiCall.name,
        args: args
      });
    }
  };
};
```

### Hook for Error Handling
```javascript
// hooks/useApiError.js
import { useState, useCallback } from 'react';
import { useError } from '../context/ErrorContext';
import { handleApiError } from '../services/errorService';

export function useApiError() {
  const [loading, setLoading] = useState(false);
  const { addError } = useError();

  const executeWithErrorHandling = useCallback(async (apiCall, options = {}) => {
    const { 
      showToast = true, 
      retries = 0, 
      onError = null,
      loadingState = true 
    } = options;

    if (loadingState) setLoading(true);

    let lastError;
    
    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        const result = await apiCall();
        if (loadingState) setLoading(false);
        return result;
      } catch (error) {
        lastError = handleApiError(error);
        
        // If retryable and not last attempt, wait and retry
        if (attempt < retries && isRetryableError(lastError)) {
          await new Promise(resolve => 
            setTimeout(resolve, Math.pow(2, attempt) * 1000)
          );
          continue;
        }
        
        break;
      }
    }

    if (loadingState) setLoading(false);

    // Handle final error
    if (showToast) {
      addError(lastError);
    }

    if (onError) {
      onError(lastError);
    }

    throw lastError;
  }, [addError]);

  return {
    loading,
    executeWithErrorHandling
  };
}

const isRetryableError = (error) => {
  const retryableCodes = ['NETWORK_ERROR', 'TIMEOUT', 'INTERNAL'];
  return retryableCodes.includes(error.code);
};
```

## Error Monitoring

### Error Logging Service
```javascript
// utils/errorLogging.js
import { getFunctions, httpsCallable } from 'firebase/functions';

export const logError = async (error, context = {}) => {
  const errorData = {
    message: error.message,
    stack: error.stack,
    code: error.code,
    name: error.name,
    timestamp: new Date().toISOString(),
    url: window.location.href,
    userAgent: navigator.userAgent,
    context
  };

  // Log to console in development
  if (process.env.NODE_ENV === 'development') {
    console.error('Error logged:', errorData);
  }

  // Send to error tracking service
  try {
    // Log to Firebase Functions for server-side processing
    const functions = getFunctions();
    const logErrorFunction = httpsCallable(functions, 'logClientError');
    await logErrorFunction(errorData);
  } catch (loggingError) {
    console.error('Failed to log error:', loggingError);
  }
};

export const logPerformanceIssue = async (metric, value, context = {}) => {
  const performanceData = {
    metric,
    value,
    timestamp: new Date().toISOString(),
    url: window.location.href,
    context
  };

  try {
    const functions = getFunctions();
    const logPerformanceFunction = httpsCallable(functions, 'logPerformanceMetric');
    await logPerformanceFunction(performanceData);
  } catch (error) {
    console.error('Failed to log performance metric:', error);
  }
};
```

### Firebase Function for Error Logging
```typescript
// functions/src/logging.ts
export const logClientError = functions.https.onCall(async (data, context) => {
  try {
    const errorLog = {
      ...data,
      userId: context.auth?.uid || 'anonymous',
      severity: determineErrorSeverity(data),
      environment: process.env.NODE_ENV || 'production'
    };

    // Log to Cloud Logging
    console.error('Client Error:', JSON.stringify(errorLog));

    // Store in Firestore for analysis
    await admin.firestore()
      .collection('errorLogs')
      .add(errorLog);

    // Send to external monitoring if critical
    if (errorLog.severity === 'critical') {
      await sendCriticalErrorAlert(errorLog);
    }

    return { success: true };
  } catch (error) {
    console.error('Failed to log client error:', error);
    return { success: false, error: error.message };
  }
});

const determineErrorSeverity = (errorData) => {
  if (errorData.code === 'INTERNAL' || errorData.name === 'ChunkLoadError') {
    return 'critical';
  }
  if (errorData.code === 'PERMISSION_DENIED' || errorData.code === 'UNAUTHENTICATED') {
    return 'warning';
  }
  return 'info';
};
```

## User Experience

### User-Friendly Error Messages
```javascript
// utils/userMessages.js
export const USER_ERROR_MESSAGES = {
  // Network errors
  'NETWORK_ERROR': {
    title: 'Connection Problem',
    message: 'Please check your internet connection and try again.',
    action: 'Retry'
  },
  
  // Authentication errors
  'UNAUTHENTICATED': {
    title: 'Please Sign In',
    message: 'You need to be signed in to access this feature.',
    action: 'Sign In'
  },
  
  // Permission errors
  'PERMISSION_DENIED': {
    title: 'Access Denied',
    message: 'You don\'t have permission to perform this action.',
    action: 'Contact Support'
  },
  
  // Validation errors
  'VALIDATION_ERROR': {
    title: 'Invalid Information',
    message: 'Please check your input and try again.',
    action: 'Fix and Retry'
  },
  
  // Resource errors
  'NOT_FOUND': {
    title: 'Not Found',
    message: 'The item you\'re looking for could not be found.',
    action: 'Go Back'
  },
  
  // Default
  'UNKNOWN_ERROR': {
    title: 'Something Went Wrong',
    message: 'We encountered an unexpected problem. Please try again.',
    action: 'Try Again'
  }
};

export const getUserErrorMessage = (error) => {
  return USER_ERROR_MESSAGES[error.code] || USER_ERROR_MESSAGES['UNKNOWN_ERROR'];
};
```

### Error Display Components
```javascript
// components/error/ErrorDisplay.jsx
import { getUserErrorMessage } from '../../utils/userMessages';

export function ErrorDisplay({ error, onRetry, onDismiss }) {
  const errorInfo = getUserErrorMessage(error);

  return (
    <div className="error-display">
      <div className="error-icon">⚠️</div>
      <h3>{errorInfo.title}</h3>
      <p>{error.message || errorInfo.message}</p>
      
      <div className="error-actions">
        {onRetry && (
          <button onClick={onRetry} className="btn-primary">
            {errorInfo.action}
          </button>
        )}
        {onDismiss && (
          <button onClick={onDismiss} className="btn-secondary">
            Dismiss
          </button>
        )}
      </div>
      
      {process.env.NODE_ENV === 'development' && error.details && (
        <details className="error-details">
          <summary>Debug Information</summary>
          <pre>{JSON.stringify(error.details, null, 2)}</pre>
        </details>
      )}
    </div>
  );
}

// Inline error component
export function InlineError({ error }) {
  if (!error) return null;

  return (
    <div className="inline-error">
      <span className="error-icon">❌</span>
      <span className="error-message">{error.message}</span>
    </div>
  );
}
```

## Testing Error Scenarios

### Error Simulation Utilities
```javascript
// utils/errorSimulation.js
export const simulateNetworkError = () => {
  throw new Error('Simulated network error');
};

export const simulateAuthError = () => {
  const error = new Error('Simulated auth error');
  error.code = 'auth/user-not-found';
  throw error;
};

export const simulateValidationError = (field) => {
  const error = new Error(`Validation failed for field: ${field}`);
  error.code = 'invalid-argument';
  error.details = { field };
  throw error;
};

// Error testing hook
export const useErrorTesting = () => {
  const [errorType, setErrorType] = useState(null);

  const triggerError = (type) => {
    setErrorType(type);
    
    switch (type) {
      case 'network':
        simulateNetworkError();
        break;
      case 'auth':
        simulateAuthError();
        break;
      case 'validation':
        simulateValidationError('email');
        break;
      default:
        throw new Error('Unknown error type');
    }
  };

  return { triggerError, errorType };
};
```

### Test Cases
```javascript
// __tests__/errorHandling.test.js
import { handleApiError } from '../services/errorService';
import { getUserErrorMessage } from '../utils/userMessages';

describe('Error Handling', () => {
  describe('handleApiError', () => {
    it('should handle Firebase auth errors', () => {
      const firebaseError = {
        code: 'auth/user-not-found',
        message: 'There is no user record corresponding to this identifier.'
      };
      
      const result = handleApiError(firebaseError);
      
      expect(result.code).toBe('AUTH_ERROR');
      expect(result.message).toContain('No account found');
    });

    it('should handle Firebase Functions errors', () => {
      const functionsError = {
        code: 'permission-denied',
        message: 'Access denied',
        details: { resource: 'property' }
      };
      
      const result = handleApiError(functionsError);
      
      expect(result.code).toBe('PERMISSION_DENIED');
      expect(result.details).toEqual({ resource: 'property' });
    });
  });

  describe('getUserErrorMessage', () => {
    it('should return user-friendly messages', () => {
      const error = { code: 'NETWORK_ERROR' };
      const message = getUserErrorMessage(error);
      
      expect(message.title).toBe('Connection Problem');
      expect(message.action).toBe('Retry');
    });

    it('should handle unknown errors', () => {
      const error = { code: 'UNKNOWN_CODE' };
      const message = getUserErrorMessage(error);
      
      expect(message.title).toBe('Something Went Wrong');
    });
  });
});
```

## Best Practices

### 1. Error Prevention
```javascript
// Validate inputs early
const validateInput = (data) => {
  if (!data.email) throw new ValidationError('email', 'Email is required');
  if (!data.password) throw new ValidationError('password', 'Password is required');
};

// Use TypeScript for type safety
interface CreatePropertyRequest {
  name: string;
  address: Address;
  landlordId: string;
}

// Implement circuit breakers for external services
class CircuitBreaker {
  constructor(threshold = 5, timeout = 60000) {
    this.threshold = threshold;
    this.timeout = timeout;
    this.failures = 0;
    this.state = 'CLOSED';
    this.nextAttempt = Date.now();
  }

  async call(fn) {
    if (this.state === 'OPEN' && Date.now() < this.nextAttempt) {
      throw new Error('Circuit breaker is OPEN');
    }

    try {
      const result = await fn();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  onSuccess() {
    this.failures = 0;
    this.state = 'CLOSED';
  }

  onFailure() {
    this.failures++;
    if (this.failures >= this.threshold) {
      this.state = 'OPEN';
      this.nextAttempt = Date.now() + this.timeout;
    }
  }
}
```

### 2. Error Recovery
```javascript
// Implement retry logic with exponential backoff
const retryWithBackoff = async (fn, maxRetries = 3, baseDelay = 1000) => {
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      if (attempt === maxRetries || !isRetryableError(error)) {
        throw error;
      }
      
      const delay = baseDelay * Math.pow(2, attempt);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
};

// Graceful degradation
const getDataWithFallback = async (primarySource, fallbackSource) => {
  try {
    return await primarySource();
  } catch (error) {
    console.warn('Primary source failed, using fallback:', error.message);
    return await fallbackSource();
  }
};
```

### 3. Error Communication
```javascript
// Progressive error disclosure
const ErrorSeverity = {
  INFO: 'info',
  WARNING: 'warning', 
  ERROR: 'error',
  CRITICAL: 'critical'
};

const notifyUser = (error, severity = ErrorSeverity.ERROR) => {
  switch (severity) {
    case ErrorSeverity.INFO:
      toast.info(error.message);
      break;
    case ErrorSeverity.WARNING:
      toast.warn(error.message);
      break;
    case ErrorSeverity.ERROR:
      toast.error(error.message);
      break;
    case ErrorSeverity.CRITICAL:
      // Show modal dialog for critical errors
      showCriticalErrorModal(error);
      break;
  }
};
```

### 4. Error Analysis
```javascript
// Error aggregation for analysis
const aggregateErrors = (errors) => {
  const summary = errors.reduce((acc, error) => {
    const key = `${error.code}-${error.component}`;
    if (!acc[key]) {
      acc[key] = {
        count: 0,
        samples: [],
        firstSeen: error.timestamp,
        lastSeen: error.timestamp
      };
    }
    
    acc[key].count++;
    acc[key].lastSeen = error.timestamp;
    
    if (acc[key].samples.length < 3) {
      acc[key].samples.push(error);
    }
    
    return acc;
  }, {});
  
  return summary;
};
```

---

**Error Handling Guide Version**: 2.0  
**Last Updated**: January 2025  
**Maintainer**: Development Team

**Related Documentation**:
- [API Documentation](API_DOCUMENTATION.md)
- [Firebase Functions Guide](FIREBASE_FUNCTIONS.md)
- [Authentication Guide](AUTHENTICATION_GUIDE.md) 