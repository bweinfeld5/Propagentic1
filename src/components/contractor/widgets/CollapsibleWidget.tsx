import React, { useState, useRef, useEffect } from 'react';
import {
  ChevronDownIcon,
  ChevronUpIcon
} from '@heroicons/react/24/outline';
import { designSystem } from '../../../styles/designSystem';

interface CollapsibleWidgetProps {
  title: string;
  icon?: React.ComponentType<{ className?: string }>;
  children: React.ReactNode;
  defaultExpanded?: boolean;
  priority?: 'critical' | 'high' | 'medium' | 'low';
  badge?: number | string;
  actions?: React.ReactNode;
  className?: string;
}

const CollapsibleWidget: React.FC<CollapsibleWidgetProps> = ({
  title,
  icon: Icon,
  children,
  defaultExpanded = true,
  priority = 'medium',
  badge,
  actions,
  className = ''
}) => {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  const [contentHeight, setContentHeight] = useState<number | undefined>(undefined);
  const contentRef = useRef<HTMLDivElement>(null);

  // Calculate content height for smooth animations
  useEffect(() => {
    if (contentRef.current) {
      const height = contentRef.current.scrollHeight;
      setContentHeight(height);
    }
  }, [children, isExpanded]);

  // Handle expand/collapse with haptic feedback
  const toggleExpanded = () => {
    setIsExpanded(!isExpanded);
    
    // Add subtle haptic feedback on supported devices
    if ('vibrate' in navigator) {
      navigator.vibrate(10);
    }
  };

  // Priority-based styling
  const getPriorityStyles = () => {
    switch (priority) {
      case 'critical':
        return {
          border: 'border-red-200',
          bg: 'bg-red-50/50',
          headerBg: 'bg-red-50',
          iconBg: 'bg-red-100',
          iconColor: 'text-red-600'
        };
      case 'high':
        return {
          border: 'border-orange-200',
          bg: 'bg-orange-50/30',
          headerBg: 'bg-orange-50',
          iconBg: 'bg-orange-100',
          iconColor: 'text-orange-600'
        };
      case 'medium':
        return {
          border: 'border-gray-200',
          bg: 'bg-white/95',
          headerBg: 'bg-gray-50',
          iconBg: 'bg-gray-100',
          iconColor: 'text-gray-600'
        };
      case 'low':
        return {
          border: 'border-gray-150',
          bg: 'bg-gray-50/50',
          headerBg: 'bg-gray-100',
          iconBg: 'bg-gray-200',
          iconColor: 'text-gray-500'
        };
      default:
        return {
          border: 'border-gray-200',
          bg: 'bg-white/95',
          headerBg: 'bg-gray-50',
          iconBg: 'bg-gray-100',
          iconColor: 'text-gray-600'
        };
    }
  };

  const styles = getPriorityStyles();

  return (
    <div className={`${styles.bg} ${styles.border} border rounded-xl shadow-md hover:shadow-lg transition-all duration-300 overflow-hidden ${className}`}>
      {/* Collapsible Header */}
      <button
        onClick={toggleExpanded}
        className={`w-full ${styles.headerBg} hover:bg-opacity-80 p-4 md:p-6 text-left transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-inset`}
        aria-expanded={isExpanded}
        aria-label={`${isExpanded ? 'Collapse' : 'Expand'} ${title} section`}
      >
        <div className="flex items-center justify-between">
          {/* Left side: Icon, Title, Badge */}
          <div className="flex items-center space-x-3 flex-1 min-w-0">
            {Icon && (
              <div className={`${designSystem.components.iconContainer.md} ${styles.iconBg} flex-shrink-0`}>
                <Icon className={`w-5 h-5 ${styles.iconColor}`} />
              </div>
            )}
            
            <div className="flex-1 min-w-0">
              <h2 className="text-lg md:text-xl font-semibold text-gray-900 truncate">
                {title}
              </h2>
            </div>
            
            {badge && (
              <span className="bg-red-500 text-white text-xs font-bold px-2.5 py-1 rounded-full flex-shrink-0">
                {badge}
              </span>
            )}
          </div>

          {/* Right side: Actions and Collapse Icon */}
          <div className="flex items-center space-x-3 flex-shrink-0">
            {actions && (
              <div 
                className="flex items-center space-x-2"
                onClick={(e) => e.stopPropagation()} // Prevent collapse when clicking actions
              >
                {actions}
              </div>
            )}
            
            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-white/50 hover:bg-white/80 transition-colors duration-200">
              {isExpanded ? (
                <ChevronUpIcon className="w-4 h-4 text-gray-600" />
              ) : (
                <ChevronDownIcon className="w-4 h-4 text-gray-600" />
              )}
            </div>
          </div>
        </div>
      </button>

      {/* Collapsible Content */}
      <div 
        className="overflow-hidden transition-all duration-300 ease-in-out"
        style={{
          height: isExpanded ? contentHeight : 0,
          opacity: isExpanded ? 1 : 0
        }}
      >
        <div 
          ref={contentRef}
          className="p-4 md:p-6 pt-0"
        >
          {children}
        </div>
      </div>

      {/* Collapsed Preview (Optional) */}
      {!isExpanded && (
        <div className="px-4 md:px-6 pb-4">
          <div className="text-sm text-gray-500 bg-gray-100 rounded-lg p-3 border-l-4 border-orange-400">
            <span className="font-medium">Click to expand</span> - {title.toLowerCase()} details
          </div>
        </div>
      )}
    </div>
  );
};

export default CollapsibleWidget; 