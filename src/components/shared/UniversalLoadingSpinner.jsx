import React from 'react';

/**
 * UniversalLoadingSpinner Component
 *
 * A simple, centered loading spinner for use as a fallback during lazy loading
 * or other asynchronous operations.
 */
const UniversalLoadingSpinner = ({ message = 'Loading...' }) => {
  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-background/80 dark:bg-background-dark/80 backdrop-blur-sm">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-t-2 border-primary dark:border-primary-light mb-4"></div>
      {message && <p className="text-sm font-medium text-content dark:text-content-dark">{message}</p>}
    </div>
  );
};

export default UniversalLoadingSpinner; 