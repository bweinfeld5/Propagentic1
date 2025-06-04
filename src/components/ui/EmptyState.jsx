/**
 * EmptyState Component - PropAgentic Design System
 * 
 * Provides helpful guidance when users have no data to display.
 * Includes illustrations, actions, and accessibility features.
 */

import React from 'react';
import PropTypes from 'prop-types';
import { 
  FaceSmileIcon, 
  DocumentPlusIcon, 
  UserPlusIcon,
  HomeIcon,
  WrenchScrewdriverIcon,
  ExclamationTriangleIcon,
  MagnifyingGlassIcon,
  InboxIcon,
  PhotoIcon,
  ClipboardDocumentCheckIcon
} from '@heroicons/react/24/outline';
import AccessibleButton from './AccessibleButton';
import { FadeIn, ScaleIn } from './SafeMotion';
import { darkModeClasses } from '../../design-system/dark-mode';
import { useAccessibility } from '../../design-system/accessibility';

// Predefined empty state configurations
const emptyStateConfigs = {
  // Property Management
  properties: {
    icon: HomeIcon,
    title: 'No Properties Yet',
    description: 'Start building your property portfolio by adding your first property.',
    actionText: 'Add Property',
    actionIcon: DocumentPlusIcon,
    illustration: 'properties'
  },

  tenants: {
    icon: UserPlusIcon,
    title: 'No Tenants Found',
    description: 'Your property doesn\'t have any tenants yet. Start by inviting tenants or adding existing ones.',
    actionText: 'Add Tenant',
    actionIcon: UserPlusIcon,
    illustration: 'tenants'
  },

  maintenance: {
    icon: WrenchScrewdriverIcon,
    title: 'No Maintenance Requests',
    description: 'All caught up! There are no pending maintenance requests at the moment.',
    actionText: 'Report Issue',
    actionIcon: DocumentPlusIcon,
    illustration: 'maintenance',
    positive: true
  },

  documents: {
    icon: ClipboardDocumentCheckIcon,
    title: 'No Documents Uploaded',
    description: 'Keep important property documents organized and accessible by uploading them here.',
    actionText: 'Upload Document',
    actionIcon: DocumentPlusIcon,
    illustration: 'documents'
  },

  search: {
    icon: MagnifyingGlassIcon,
    title: 'No Results Found',
    description: 'We couldn\'t find anything matching your search. Try adjusting your filters or search terms.',
    actionText: 'Clear Filters',
    actionIcon: ExclamationTriangleIcon,
    illustration: 'search'
  },

  inbox: {
    icon: InboxIcon,
    title: 'Inbox is Empty',
    description: 'You\'re all caught up! No new messages or notifications at the moment.',
    illustration: 'inbox',
    positive: true
  },

  photos: {
    icon: PhotoIcon,
    title: 'No Photos Added',
    description: 'Add photos to showcase your property and help with documentation.',
    actionText: 'Add Photos',
    actionIcon: PhotoIcon,
    illustration: 'photos'
  },

  error: {
    icon: ExclamationTriangleIcon,
    title: 'Something Went Wrong',
    description: 'We encountered an error while loading your data. Please try again.',
    actionText: 'Try Again',
    actionIcon: ExclamationTriangleIcon,
    illustration: 'error',
    variant: 'error'
  }
};

// Simple SVG illustrations for different empty states
const EmptyStateIllustration = ({ type, className = '' }) => {
  const illustrations = {
    properties: (
      <svg viewBox="0 0 200 200" className={className} fill="none">
        <circle cx="100" cy="100" r="80" fill="currentColor" opacity="0.1"/>
        <rect x="60" y="80" width="80" height="60" fill="currentColor" opacity="0.2" rx="4"/>
        <rect x="75" y="95" width="12" height="8" fill="currentColor" opacity="0.4"/>
        <rect x="95" y="95" width="12" height="8" fill="currentColor" opacity="0.4"/>
        <rect x="115" y="95" width="12" height="8" fill="currentColor" opacity="0.4"/>
        <rect x="85" y="115" width="30" height="20" fill="currentColor" opacity="0.3" rx="2"/>
      </svg>
    ),
    
    tenants: (
      <svg viewBox="0 0 200 200" className={className} fill="none">
        <circle cx="100" cy="100" r="80" fill="currentColor" opacity="0.1"/>
        <circle cx="100" cy="85" r="20" fill="currentColor" opacity="0.3"/>
        <path d="M70 130c0-16.569 13.431-30 30-30s30 13.431 30 30v20H70v-20z" fill="currentColor" opacity="0.2"/>
      </svg>
    ),
    
    maintenance: (
      <svg viewBox="0 0 200 200" className={className} fill="none">
        <circle cx="100" cy="100" r="80" fill="currentColor" opacity="0.1"/>
        <rect x="85" y="70" width="30" height="8" fill="currentColor" opacity="0.3" rx="4"/>
        <rect x="92" y="85" width="16" height="40" fill="currentColor" opacity="0.3" rx="2"/>
        <circle cx="100" cy="140" r="8" fill="currentColor" opacity="0.4"/>
      </svg>
    ),
    
    search: (
      <svg viewBox="0 0 200 200" className={className} fill="none">
        <circle cx="100" cy="100" r="80" fill="currentColor" opacity="0.1"/>
        <circle cx="90" cy="90" r="25" stroke="currentColor" strokeWidth="4" opacity="0.3" fill="none"/>
        <line x1="110" y1="110" x2="130" y2="130" stroke="currentColor" strokeWidth="4" opacity="0.3"/>
      </svg>
    ),
    
    default: (
      <svg viewBox="0 0 200 200" className={className} fill="none">
        <circle cx="100" cy="100" r="80" fill="currentColor" opacity="0.1"/>
        <circle cx="100" cy="100" r="40" fill="currentColor" opacity="0.2"/>
        <circle cx="100" cy="100" r="20" fill="currentColor" opacity="0.3"/>
      </svg>
    )
  };

  return illustrations[type] || illustrations.default;
};

const EmptyState = ({
  type = 'default',
  title,
  description,
  icon: CustomIcon,
  illustration,
  actionText,
  actionIcon: CustomActionIcon,
  onAction,
  secondaryActionText,
  onSecondaryAction,
  children,
  size = 'md',
  variant = 'default',
  className = '',
  showIllustration = true,
  ...props
}) => {
  const { announce } = useAccessibility();
  
  // Get configuration for predefined types
  const config = emptyStateConfigs[type] || {};
  
  // Use props or fall back to config
  const finalTitle = title || config.title || 'No Data Available';
  const finalDescription = description || config.description || 'There\'s nothing to show here right now.';
  const finalActionText = actionText || config.actionText;
  const finalIcon = CustomIcon || config.icon || FaceSmileIcon;
  const finalActionIcon = CustomActionIcon || config.actionIcon;
  const finalVariant = variant !== 'default' ? variant : config.variant || 'default';
  const finalIllustration = illustration || config.illustration || type;
  const isPositive = config.positive || false;

  // Size variants
  const sizeClasses = {
    sm: {
      container: 'py-8 px-4',
      icon: 'h-12 w-12',
      illustration: 'h-32 w-32',
      title: 'text-lg',
      description: 'text-sm',
      spacing: 'space-y-3'
    },
    md: {
      container: 'py-12 px-6',
      icon: 'h-16 w-16',
      illustration: 'h-40 w-40',
      title: 'text-xl',
      description: 'text-base',
      spacing: 'space-y-4'
    },
    lg: {
      container: 'py-16 px-8',
      icon: 'h-20 w-20',
      illustration: 'h-48 w-48',
      title: 'text-2xl',
      description: 'text-lg',
      spacing: 'space-y-6'
    }
  };

  // Variant styles
  const variantClasses = {
    default: {
      icon: darkModeClasses.text.tertiary,
      title: darkModeClasses.text.primary,
      description: darkModeClasses.text.secondary,
      illustration: darkModeClasses.text.tertiary
    },
    error: {
      icon: 'text-red-500',
      title: 'text-red-600 dark:text-red-400',
      description: 'text-red-500 dark:text-red-300',
      illustration: 'text-red-400'
    },
    warning: {
      icon: 'text-yellow-500',
      title: 'text-yellow-600 dark:text-yellow-400',
      description: 'text-yellow-500 dark:text-yellow-300',
      illustration: 'text-yellow-400'
    },
    success: {
      icon: 'text-green-500',
      title: 'text-green-600 dark:text-green-400',
      description: 'text-green-500 dark:text-green-300',
      illustration: 'text-green-400'
    }
  };

  const styles = sizeClasses[size];
  const colors = variantClasses[finalVariant];

  const handleAction = () => {
    if (onAction) {
      announce(`${finalActionText} action activated`, 'polite');
      onAction();
    }
  };

  const handleSecondaryAction = () => {
    if (onSecondaryAction) {
      announce(`${secondaryActionText} action activated`, 'polite');
      onSecondaryAction();
    }
  };

  return (
    <FadeIn
      className={`
        text-center ${styles.container} ${styles.spacing} ${className}
      `}
      {...props}
    >
      {/* Illustration or Icon */}
      <ScaleIn delay={0.1}>
        <div className="flex justify-center">
          {showIllustration && finalIllustration !== 'none' ? (
            <EmptyStateIllustration 
              type={finalIllustration}
              className={`${styles.illustration} ${colors.illustration}`}
            />
          ) : (
            <finalIcon 
              className={`${styles.icon} ${colors.icon}`}
              aria-hidden="true"
            />
          )}
        </div>
      </ScaleIn>

      {/* Content */}
      <div className={styles.spacing}>
        <ScaleIn delay={0.2}>
          <h3 className={`font-semibold ${styles.title} ${colors.title}`}>
            {finalTitle}
          </h3>
        </ScaleIn>

        <ScaleIn delay={0.3}>
          <p className={`max-w-sm mx-auto ${styles.description} ${colors.description}`}>
            {finalDescription}
          </p>
        </ScaleIn>

        {/* Actions */}
        {(finalActionText || secondaryActionText || children) && (
          <ScaleIn delay={0.4}>
            <div className="flex flex-col sm:flex-row gap-3 justify-center items-center mt-6">
              {finalActionText && (
                <AccessibleButton
                  variant={finalVariant === 'error' ? 'danger' : 'primary'}
                  onClick={handleAction}
                  icon={finalActionIcon ? <finalActionIcon /> : undefined}
                  ariaLabel={`${finalActionText} for ${finalTitle.toLowerCase()}`}
                >
                  {finalActionText}
                </AccessibleButton>
              )}

              {secondaryActionText && (
                <AccessibleButton
                  variant="outline"
                  onClick={handleSecondaryAction}
                  ariaLabel={`${secondaryActionText} for ${finalTitle.toLowerCase()}`}
                >
                  {secondaryActionText}
                </AccessibleButton>
              )}

              {children}
            </div>
          </ScaleIn>
        )}
      </div>

      {/* Screen reader announcement */}
      <div className="sr-only" aria-live="polite">
        {isPositive ? 'Good news: ' : ''}{finalTitle}. {finalDescription}
      </div>
    </FadeIn>
  );
};

EmptyState.propTypes = {
  type: PropTypes.oneOf(Object.keys(emptyStateConfigs)),
  title: PropTypes.string,
  description: PropTypes.string,
  icon: PropTypes.elementType,
  illustration: PropTypes.string,
  actionText: PropTypes.string,
  actionIcon: PropTypes.elementType,
  onAction: PropTypes.func,
  secondaryActionText: PropTypes.string,
  onSecondaryAction: PropTypes.func,
  children: PropTypes.node,
  size: PropTypes.oneOf(['sm', 'md', 'lg']),
  variant: PropTypes.oneOf(['default', 'error', 'warning', 'success']),
  className: PropTypes.string,
  showIllustration: PropTypes.bool
};

export default EmptyState; 