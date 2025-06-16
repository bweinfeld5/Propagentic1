import React from 'react';
import { cx } from '../../design-system';

/**
 * Base Skeleton component for creating loading placeholders
 */
export const Skeleton = ({ 
  className = '', 
  width = 'w-full', 
  height = 'h-4',
  rounded = 'rounded',
  animated = true,
  variant = 'default'
}) => {
  const baseClasses = cx(
    'bg-gray-200 dark:bg-gray-700',
    width,
    height,
    rounded,
    animated && 'animate-pulse',
    variant === 'circle' && 'rounded-full',
    variant === 'text' && 'rounded-md',
    className
  );

  return <div className={baseClasses} />;
};

/**
 * Text skeleton for text content
 */
export const TextSkeleton = ({ 
  lines = 1, 
  className = '',
  spacing = 'space-y-2',
  widths = ['w-full']
}) => {
  if (lines === 1) {
    return <Skeleton className={className} variant="text" />;
  }

  const lineWidths = Array.isArray(widths) ? widths : Array(lines).fill('w-full');

  return (
    <div className={cx(spacing, className)}>
      {Array.from({ length: lines }, (_, index) => (
        <Skeleton 
          key={index}
          width={lineWidths[index] || lineWidths[lineWidths.length - 1]}
          variant="text"
        />
      ))}
    </div>
  );
};

/**
 * Property Card Skeleton
 */
export const PropertyCardSkeleton = ({ className = '' }) => {
  return (
    <div className={cx(
      'bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 shadow-sm',
      className
    )}>
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <Skeleton width="w-3/4" height="h-6" className="mb-2" />
          <Skeleton width="w-1/2" height="h-4" />
        </div>
        <Skeleton width="w-8" height="h-8" variant="circle" />
      </div>

      {/* Content */}
      <div className="space-y-4">
        {/* Property details */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Skeleton width="w-16" height="h-3" className="mb-1" />
            <Skeleton width="w-20" height="h-5" />
          </div>
          <div>
            <Skeleton width="w-12" height="h-3" className="mb-1" />
            <Skeleton width="w-16" height="h-5" />
          </div>
        </div>

        {/* Status indicators */}
        <div className="flex items-center space-x-2">
          <Skeleton width="w-16" height="h-6" rounded="rounded-full" />
          <Skeleton width="w-20" height="h-6" rounded="rounded-full" />
        </div>

        {/* Action buttons */}
        <div className="flex space-x-2 pt-2">
          <Skeleton width="w-20" height="h-8" rounded="rounded-md" />
          <Skeleton width="w-16" height="h-8" rounded="rounded-md" />
        </div>
      </div>
    </div>
  );
};

/**
 * Dashboard Stats Skeleton
 */
export const DashboardStatsSkeleton = ({ className = '', count = 4 }) => {
  return (
    <div className={cx('grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6', className)}>
      {Array.from({ length: count }, (_, index) => (
        <div 
          key={index}
          className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 shadow-sm"
        >
          {/* Icon and title */}
          <div className="flex items-center justify-between mb-4">
            <Skeleton width="w-6" height="h-6" variant="circle" />
            <Skeleton width="w-4" height="h-4" variant="circle" />
          </div>

          {/* Value */}
          <Skeleton width="w-16" height="h-8" className="mb-2" />
          
          {/* Label */}
          <Skeleton width="w-24" height="h-4" />

          {/* Trend indicator */}
          <div className="flex items-center mt-3">
            <Skeleton width="w-4" height="h-4" className="mr-1" />
            <Skeleton width="w-12" height="h-3" />
          </div>
        </div>
      ))}
    </div>
  );
};

/**
 * Table Skeleton
 */
export const TableSkeleton = ({ 
  rows = 5, 
  columns = 4, 
  className = '',
  hasHeader = true
}) => {
  return (
    <div className={cx('bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden', className)}>
      {/* Table Header */}
      {hasHeader && (
        <div className="border-b border-gray-200 dark:border-gray-700 p-4">
          <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
            {Array.from({ length: columns }, (_, index) => (
              <Skeleton key={`header-${index}`} width="w-20" height="h-4" />
            ))}
          </div>
        </div>
      )}

      {/* Table Rows */}
      <div className="divide-y divide-gray-200 dark:divide-gray-700">
        {Array.from({ length: rows }, (_, rowIndex) => (
          <div key={rowIndex} className="p-4">
            <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
              {Array.from({ length: columns }, (_, colIndex) => (
                <Skeleton 
                  key={`cell-${rowIndex}-${colIndex}`}
                  width={colIndex === 0 ? 'w-32' : 'w-24'}
                  height="h-4"
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

/**
 * List Skeleton
 */
export const ListSkeleton = ({ 
  items = 5, 
  className = '',
  hasAvatar = false,
  hasActions = false
}) => {
  return (
    <div className={cx('space-y-3', className)}>
      {Array.from({ length: items }, (_, index) => (
        <div 
          key={index}
          className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4"
        >
          <div className="flex items-center space-x-4">
            {hasAvatar && (
              <Skeleton width="w-10" height="h-10" variant="circle" />
            )}
            
            <div className="flex-1">
              <Skeleton width="w-3/4" height="h-4" className="mb-2" />
              <Skeleton width="w-1/2" height="h-3" />
            </div>

            {hasActions && (
              <div className="flex space-x-2">
                <Skeleton width="w-8" height="h-8" rounded="rounded-md" />
                <Skeleton width="w-8" height="h-8" rounded="rounded-md" />
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

/**
 * Form Skeleton
 */
export const FormSkeleton = ({ 
  fields = 4, 
  className = '',
  hasTitle = true,
  hasButtons = true
}) => {
  return (
    <div className={cx('bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6', className)}>
      {hasTitle && (
        <div className="mb-6">
          <Skeleton width="w-48" height="h-6" className="mb-2" />
          <Skeleton width="w-64" height="h-4" />
        </div>
      )}

      <div className="space-y-6">
        {Array.from({ length: fields }, (_, index) => (
          <div key={index}>
            <Skeleton width="w-24" height="h-4" className="mb-2" />
            <Skeleton width="w-full" height="h-10" rounded="rounded-md" />
          </div>
        ))}
      </div>

      {hasButtons && (
        <div className="flex space-x-3 mt-8">
          <Skeleton width="w-20" height="h-10" rounded="rounded-md" />
          <Skeleton width="w-16" height="h-10" rounded="rounded-md" />
        </div>
      )}
    </div>
  );
};

/**
 * Chart Skeleton
 */
export const ChartSkeleton = ({ 
  className = '',
  height = 'h-64',
  hasLegend = true
}) => {
  return (
    <div className={cx('bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6', className)}>
      {/* Chart title */}
      <div className="mb-4">
        <Skeleton width="w-48" height="h-5" className="mb-2" />
        <Skeleton width="w-32" height="h-3" />
      </div>

      {/* Chart area */}
      <div className={cx('relative', height)}>
        <Skeleton width="w-full" height="h-full" rounded="rounded-md" />
        
        {/* Simulate chart elements */}
        <div className="absolute inset-0 p-4">
          <div className="flex items-end justify-between h-full space-x-2">
            {Array.from({ length: 7 }, (_, index) => (
              <Skeleton 
                key={index}
                width="w-8"
                height={`h-${Math.floor(Math.random() * 20) + 10}`}
                className="bg-gray-300 dark:bg-gray-600"
              />
            ))}
          </div>
        </div>
      </div>

      {/* Legend */}
      {hasLegend && (
        <div className="flex items-center justify-center space-x-6 mt-4">
          {Array.from({ length: 3 }, (_, index) => (
            <div key={index} className="flex items-center space-x-2">
              <Skeleton width="w-3" height="h-3" variant="circle" />
              <Skeleton width="w-16" height="h-3" />
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

/**
 * Page Skeleton - Complete page loading state
 */
export const PageSkeleton = ({ className = '' }) => {
  return (
    <div className={cx('space-y-6', className)}>
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <Skeleton width="w-48" height="h-8" className="mb-2" />
            <Skeleton width="w-32" height="h-4" />
          </div>
          <div className="flex space-x-3">
            <Skeleton width="w-24" height="h-10" rounded="rounded-md" />
            <Skeleton width="w-20" height="h-10" rounded="rounded-md" />
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="px-6">
        {/* Stats */}
        <DashboardStatsSkeleton className="mb-8" />

        {/* Main content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <ChartSkeleton className="mb-6" />
            <TableSkeleton />
          </div>
          <div>
            <ListSkeleton hasAvatar hasActions />
          </div>
        </div>
      </div>
    </div>
  );
};

// Export all components
export default Skeleton;