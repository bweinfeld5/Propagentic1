/**
 * Loading States Library
 * Consistent skeleton loaders, spinners, and loading states for PropAgentic
 */

import React from 'react';
import { durations, easings } from './tokens';

/**
 * Shimmer effect for skeleton loaders
 */
const shimmerKeyframes = `
  @keyframes shimmer {
    0% {
      transform: translateX(-100%);
    }
    100% {
      transform: translateX(100%);
    }
  }
`;

// Inject shimmer keyframes into document
if (typeof document !== 'undefined' && !document.getElementById('shimmer-keyframes')) {
  const style = document.createElement('style');
  style.id = 'shimmer-keyframes';
  style.innerHTML = shimmerKeyframes;
  document.head.appendChild(style);
}

/**
 * Base skeleton component
 */
export const Skeleton = ({ 
  className = '', 
  width, 
  height,
  rounded = 'md',
  animate = true 
}) => {
  const roundedClasses = {
    none: 'rounded-none',
    sm: 'rounded-sm',
    md: 'rounded-md',
    lg: 'rounded-lg',
    xl: 'rounded-xl',
    full: 'rounded-full',
  };

  const baseClasses = `
    bg-gray-200 dark:bg-gray-700
    ${roundedClasses[rounded]}
    ${animate ? 'relative overflow-hidden' : ''}
    ${className}
  `;

  const style = {
    width: width || '100%',
    height: height || '1rem',
  };

  return (
    <div className={baseClasses} style={style}>
      {animate && (
        <div
          className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent"
          style={{
            animation: `shimmer 2s ${easings.easeInOut} infinite`,
          }}
        />
      )}
    </div>
  );
};

/**
 * Text skeleton loader
 */
export const SkeletonText = ({ lines = 3, gap = 2, lastLineWidth = '80%' }) => {
  return (
    <div className={`space-y-${gap}`}>
      {[...Array(lines)].map((_, index) => (
        <Skeleton
          key={index}
          width={index === lines - 1 ? lastLineWidth : '100%'}
          height="0.875rem"
        />
      ))}
    </div>
  );
};

/**
 * Avatar skeleton loader
 */
export const SkeletonAvatar = ({ size = 'md' }) => {
  const sizes = {
    xs: 'w-8 h-8',
    sm: 'w-10 h-10',
    md: 'w-12 h-12',
    lg: 'w-16 h-16',
    xl: 'w-20 h-20',
  };

  return <Skeleton className={sizes[size]} rounded="full" />;
};

/**
 * Button skeleton loader
 */
export const SkeletonButton = ({ size = 'md', width }) => {
  const heights = {
    sm: '2rem',
    md: '2.5rem',
    lg: '3rem',
  };

  return (
    <Skeleton 
      width={width || '6rem'} 
      height={heights[size]} 
      rounded="lg" 
    />
  );
};

/**
 * Card skeleton loader
 */
export const SkeletonCard = ({ showMedia = true, showActions = false }) => {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
      {showMedia && (
        <Skeleton width="100%" height="12rem" rounded="none" />
      )}
      <div className="p-6 space-y-4">
        <Skeleton width="60%" height="1.5rem" />
        <SkeletonText lines={3} />
        {showActions && (
          <div className="flex gap-2 pt-2">
            <SkeletonButton />
            <SkeletonButton variant="outline" />
          </div>
        )}
      </div>
    </div>
  );
};

/**
 * Table skeleton loader
 */
export const SkeletonTable = ({ rows = 5, cols = 4 }) => {
  return (
    <div className="overflow-hidden">
      {/* Header */}
      <div className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="grid grid-cols-4 gap-4 p-4">
          {[...Array(cols)].map((_, index) => (
            <Skeleton key={index} height="1rem" width="80%" />
          ))}
        </div>
      </div>
      
      {/* Rows */}
      <div className="divide-y divide-gray-200 dark:divide-gray-700">
        {[...Array(rows)].map((_, rowIndex) => (
          <div key={rowIndex} className="grid grid-cols-4 gap-4 p-4">
            {[...Array(cols)].map((_, colIndex) => (
              <Skeleton 
                key={colIndex} 
                height="0.875rem" 
                width={colIndex === 0 ? '100%' : '60%'} 
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
};

/**
 * Form skeleton loader
 */
export const SkeletonForm = ({ fields = 4 }) => {
  return (
    <div className="space-y-6">
      {[...Array(fields)].map((_, index) => (
        <div key={index} className="space-y-2">
          <Skeleton width="30%" height="0.875rem" />
          <Skeleton height="2.5rem" rounded="lg" />
        </div>
      ))}
      <div className="flex gap-2 pt-4">
        <SkeletonButton size="md" width="5rem" />
        <SkeletonButton size="md" width="5rem" />
      </div>
    </div>
  );
};

/**
 * Spinner component
 */
export const Spinner = ({ 
  size = 'md', 
  color = 'primary',
  className = '' 
}) => {
  const sizes = {
    xs: 'w-3 h-3',
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
    xl: 'w-12 h-12',
  };

  const colors = {
    primary: 'text-blue-600',
    secondary: 'text-purple-600',
    success: 'text-green-600',
    warning: 'text-yellow-600',
    error: 'text-red-600',
    white: 'text-white',
    current: 'text-current',
  };

  return (
    <svg
      className={`animate-spin ${sizes[size]} ${colors[color]} ${className}`}
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  );
};

/**
 * Loading overlay component
 */
export const LoadingOverlay = ({ 
  visible = true, 
  message = 'Loading...',
  blur = true 
}) => {
  if (!visible) return null;

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center">
      {blur && (
        <div className="absolute inset-0 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm" />
      )}
      <div className="relative flex flex-col items-center space-y-4">
        <Spinner size="lg" />
        {message && (
          <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
            {message}
          </p>
        )}
      </div>
    </div>
  );
};

/**
 * Progress bar component
 */
export const ProgressBar = ({ 
  value = 0, 
  max = 100,
  size = 'md',
  color = 'primary',
  showLabel = false,
  animated = true 
}) => {
  const percentage = Math.min(Math.max((value / max) * 100, 0), 100);
  
  const sizes = {
    xs: 'h-1',
    sm: 'h-2',
    md: 'h-3',
    lg: 'h-4',
  };

  const colors = {
    primary: 'bg-blue-600',
    secondary: 'bg-purple-600',
    success: 'bg-green-600',
    warning: 'bg-yellow-600',
    error: 'bg-red-600',
  };

  return (
    <div className="w-full">
      <div className={`bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden ${sizes[size]}`}>
        <div
          className={`${colors[color]} h-full rounded-full transition-all duration-300 ${
            animated ? 'transition-all duration-500' : ''
          }`}
          style={{ width: `${percentage}%` }}
        />
      </div>
      {showLabel && (
        <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
          {Math.round(percentage)}%
        </p>
      )}
    </div>
  );
};

/**
 * Dots loading indicator
 */
export const LoadingDots = ({ size = 'md', color = 'primary' }) => {
  const sizes = {
    xs: 'w-1 h-1',
    sm: 'w-1.5 h-1.5',
    md: 'w-2 h-2',
    lg: 'w-3 h-3',
  };

  const colors = {
    primary: 'bg-blue-600',
    secondary: 'bg-purple-600',
    success: 'bg-green-600',
    warning: 'bg-yellow-600',
    error: 'bg-red-600',
    white: 'bg-white',
    current: 'bg-current',
  };

  return (
    <div className="flex space-x-1">
      {[0, 1, 2].map((index) => (
        <div
          key={index}
          className={`${sizes[size]} ${colors[color]} rounded-full animate-bounce`}
          style={{
            animationDelay: `${index * 150}ms`,
            animationDuration: '1.4s',
          }}
        />
      ))}
    </div>
  );
};

/**
 * Pulse loader (good for cards/content areas)
 */
export const PulseLoader = ({ className = '' }) => {
  return (
    <div className={`animate-pulse ${className}`}>
      <div className="h-full w-full bg-gray-200 dark:bg-gray-700 rounded-lg" />
    </div>
  );
};

/**
 * Loading state wrapper component
 */
export const LoadingState = ({ 
  loading = false, 
  error = null,
  empty = false,
  emptyMessage = 'No data available',
  errorMessage = 'An error occurred',
  loader = <Spinner size="lg" />,
  children 
}) => {
  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        {loader}
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="text-red-500 mb-4">
          <svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <p className="text-gray-700 dark:text-gray-300">{errorMessage}</p>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">{error.message || error}</p>
      </div>
    );
  }

  if (empty) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="text-gray-400 mb-4">
          <svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
          </svg>
        </div>
        <p className="text-gray-600 dark:text-gray-400">{emptyMessage}</p>
      </div>
    );
  }

  return children;
};

// Export all loading components
export default {
  Skeleton,
  SkeletonText,
  SkeletonAvatar,
  SkeletonButton,
  SkeletonCard,
  SkeletonTable,
  SkeletonForm,
  Spinner,
  LoadingOverlay,
  ProgressBar,
  LoadingDots,
  PulseLoader,
  LoadingState,
}; 