/**
 * Error Handling Utilities - PropAgentic
 * 
 * Standardized error handling utilities for consistent error management
 */

import toastService from '../services/toastService';
import analyticsService from '../services/analyticsService';

interface ErrorHandlingOptions {
  userId?: string | null;
  showToast?: boolean;
  trackAnalytics?: boolean;
  context?: Record<string, any>;
  errorSource?: string;
}

/**
 * Handle an error with standardized logging, analytics, and user feedback
 */
export const handleError = (
  error: unknown,
  message: string = 'An error occurred',
  options: ErrorHandlingOptions = {}
): void => {
  const {
    userId = null,
    showToast = true,
    trackAnalytics = true,
    context = {},
    errorSource = 'app'
  } = options;

  // Extract error details
  const errorMessage = error instanceof Error ? error.message : String(error);
  const errorStack = error instanceof Error ? error.stack : undefined;
  const errorName = error instanceof Error ? error.name : 'UnknownError';

  // Log error to console
  console.error(`${message}: ${errorMessage}`, {
    error,
    context,
    source: errorSource
  });

  // Show toast notification if enabled
  if (showToast) {
    toastService.showErrorToast(message, errorMessage);
  }

  // Track error in analytics if enabled
  if (trackAnalytics) {
    analyticsService.trackEvent('error', userId, {
      errorType: errorName,
      errorMessage,
      errorSource,
      ...context
    });
  }
};

/**
 * Safely execute an async function with standardized error handling
 */
export const safeAsync = async <T>(
  asyncFn: () => Promise<T>,
  errorMessage: string = 'Operation failed',
  options: ErrorHandlingOptions = {}
): Promise<T | null> => {
  try {
    return await asyncFn();
  } catch (error) {
    handleError(error, errorMessage, options);
    return null;
  }
};

/**
 * Format a Firebase error message to be more user-friendly
 */
export const formatFirebaseError = (error: any): string => {
  if (!error || !error.code) {
    return 'An unknown error occurred';
  }

  // Map common Firebase error codes to user-friendly messages
  const errorMessages: Record<string, string> = {
    'auth/user-not-found': 'No account found with this email address',
    'auth/wrong-password': 'Incorrect password',
    'auth/email-already-in-use': 'An account with this email already exists',
    'auth/weak-password': 'Password is too weak',
    'auth/invalid-email': 'Invalid email address',
    'auth/account-exists-with-different-credential': 'An account already exists with the same email address but different sign-in credentials',
    'auth/operation-not-allowed': 'This operation is not allowed',
    'auth/too-many-requests': 'Too many unsuccessful login attempts. Please try again later',
    'auth/user-disabled': 'This account has been disabled',
    'auth/requires-recent-login': 'Please log in again to complete this action',
    'permission-denied': 'You don\'t have permission to perform this action',
    'unavailable': 'Service temporarily unavailable. Please try again later',
    'not-found': 'The requested resource was not found',
    'already-exists': 'This record already exists'
  };

  return errorMessages[error.code] || error.message || 'An error occurred';
};

// Export the legacy function name for backward compatibility
export const getFirebaseErrorMessage = formatFirebaseError;

const errorHandling = {
  handleError,
  safeAsync,
  formatFirebaseError,
  getFirebaseErrorMessage
};

export default errorHandling; 