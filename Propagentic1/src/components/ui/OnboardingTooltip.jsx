/**
 * OnboardingTooltip System - PropAgentic Design System
 * 
 * Progressive disclosure system for onboarding new users to features.
 * Includes tooltip positioning, step management, and accessibility.
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import PropTypes from 'prop-types';
import { createPortal } from 'react-dom';
import { 
  XMarkIcon, 
  ChevronLeftIcon, 
  ChevronRightIcon,
  LightBulbIcon,
  CheckIcon
} from '@heroicons/react/24/outline';
import AccessibleButton from './AccessibleButton';
import { FadeIn, ScaleIn, SafeAnimatePresence } from './SafeMotion';
import { darkModeClasses } from '../../design-system/dark-mode';
import { 
  useAccessibility, 
  useFocusManagement, 
  useKeyboardNavigation,
  getAriaAttributes 
} from '../../design-system/accessibility';

// Tooltip positioning utilities
const calculatePosition = (element, placement = 'auto', offset = 8) => {
  if (!element) return { top: 0, left: 0, placement: 'bottom' };

  const rect = element.getBoundingClientRect();
  const viewport = {
    width: window.innerWidth,
    height: window.innerHeight
  };

  const tooltipSize = { width: 320, height: 200 }; // Estimated size

  const positions = {
    top: {
      top: rect.top - tooltipSize.height - offset,
      left: rect.left + (rect.width / 2) - (tooltipSize.width / 2),
      placement: 'top'
    },
    bottom: {
      top: rect.bottom + offset,
      left: rect.left + (rect.width / 2) - (tooltipSize.width / 2),
      placement: 'bottom'
    },
    left: {
      top: rect.top + (rect.height / 2) - (tooltipSize.height / 2),
      left: rect.left - tooltipSize.width - offset,
      placement: 'left'
    },
    right: {
      top: rect.top + (rect.height / 2) - (tooltipSize.height / 2),
      left: rect.right + offset,
      placement: 'right'
    }
  };

  // Auto placement logic
  if (placement === 'auto') {
    const availableSpace = {
      top: rect.top,
      bottom: viewport.height - rect.bottom,
      left: rect.left,
      right: viewport.width - rect.right
    };

    // Choose the side with most available space
    const bestSide = Object.entries(availableSpace)
      .sort(([,a], [,b]) => b - a)[0][0];
    
    placement = bestSide;
  }

  let position = positions[placement];

  // Adjust for viewport boundaries
  if (position.left < 0) {
    position.left = 8;
  } else if (position.left + tooltipSize.width > viewport.width) {
    position.left = viewport.width - tooltipSize.width - 8;
  }

  if (position.top < 0) {
    position.top = 8;
  } else if (position.top + tooltipSize.height > viewport.height) {
    position.top = viewport.height - tooltipSize.height - 8;
  }

  return position;
};

// Individual Tooltip Component
const OnboardingTooltip = ({
  isOpen,
  target,
  title,
  content,
  placement = 'auto',
  showArrow = true,
  onClose,
  onNext,
  onPrevious,
  currentStep = 1,
  totalSteps = 1,
  primaryAction,
  secondaryAction,
  className = '',
  zIndex = 9999,
  ...props
}) => {
  const { announce } = useAccessibility();
  const tooltipRef = useRef(null);
  const [position, setPosition] = useState({ top: 0, left: 0, placement: 'bottom' });

  // Focus management
  const { containerRef, focusFirst } = useFocusManagement({
    autoFocus: true,
    trapFocus: true,
    restoreFocus: true
  });

  // Keyboard navigation
  const { handleKeyDown } = useKeyboardNavigation({
    onEscape: onClose,
    onArrowLeft: onPrevious,
    onArrowRight: onNext,
    enabled: isOpen,
    preventDefault: false
  });

  // Calculate position when target or isOpen changes
  useEffect(() => {
    if (isOpen && target) {
      const element = typeof target === 'string' 
        ? document.querySelector(target) 
        : target.current || target;
      
      if (element) {
        const newPosition = calculatePosition(element, placement);
        setPosition(newPosition);
        
        // Announce tooltip opening
        announce(`${title} tooltip opened. Step ${currentStep} of ${totalSteps}`, 'polite');
      }
    }
  }, [isOpen, target, placement, title, currentStep, totalSteps, announce]);

  // Update position on scroll/resize
  useEffect(() => {
    if (!isOpen) return;

    const updatePosition = () => {
      if (target) {
        const element = typeof target === 'string' 
          ? document.querySelector(target) 
          : target.current || target;
        
        if (element) {
          const newPosition = calculatePosition(element, placement);
          setPosition(newPosition);
        }
      }
    };

    window.addEventListener('scroll', updatePosition, true);
    window.addEventListener('resize', updatePosition);

    return () => {
      window.removeEventListener('scroll', updatePosition, true);
      window.removeEventListener('resize', updatePosition);
    };
  }, [isOpen, target, placement]);

  // Focus first element when tooltip opens
  useEffect(() => {
    if (isOpen && containerRef.current) {
      setTimeout(() => focusFirst(), 100);
    }
  }, [isOpen, focusFirst, containerRef]);

  // Arrow component
  const Arrow = () => {
    if (!showArrow) return null;

    const arrowClasses = {
      top: 'absolute -bottom-2 left-1/2 transform -translate-x-1/2 border-l-8 border-r-8 border-t-8 border-transparent border-t-white dark:border-t-gray-800',
      bottom: 'absolute -top-2 left-1/2 transform -translate-x-1/2 border-l-8 border-r-8 border-b-8 border-transparent border-b-white dark:border-b-gray-800',
      left: 'absolute -right-2 top-1/2 transform -translate-y-1/2 border-t-8 border-b-8 border-l-8 border-transparent border-l-white dark:border-l-gray-800',
      right: 'absolute -left-2 top-1/2 transform -translate-y-1/2 border-t-8 border-b-8 border-r-8 border-transparent border-r-white dark:border-r-gray-800'
    };

    return <div className={arrowClasses[position.placement]} aria-hidden="true" />;
  };

  if (!isOpen) return null;

  const tooltipContent = (
    <FadeIn>
      <div
        ref={(node) => {
          tooltipRef.current = node;
          containerRef.current = node;
        }}
        className={`
          fixed max-w-sm w-80 p-4 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700
          ${className}
        `}
        style={{
          top: position.top,
          left: position.left,
          zIndex
        }}
        onKeyDown={handleKeyDown}
        {...getAriaAttributes({
          role: 'dialog',
          modal: true,
          labelledBy: 'tooltip-title',
          describedBy: 'tooltip-content'
        })}
        {...props}
      >
        <Arrow />
        
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2">
            <LightBulbIcon className="h-5 w-5 text-primary-500 flex-shrink-0" aria-hidden="true" />
            <h3 
              id="tooltip-title"
              className={`font-semibold text-sm ${darkModeClasses.text.primary}`}
            >
              {title}
            </h3>
          </div>
          
          <AccessibleButton
            variant="ghost"
            size="xs"
            onClick={onClose}
            ariaLabel="Close tooltip"
            className="p-1 -mr-1 -mt-1"
          >
            <XMarkIcon className="h-4 w-4" />
          </AccessibleButton>
        </div>

        {/* Content */}
        <div 
          id="tooltip-content"
          className={`text-sm mb-4 ${darkModeClasses.text.secondary}`}
        >
          {typeof content === 'string' ? <p>{content}</p> : content}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between">
          {/* Progress indicator */}
          <div className="flex items-center gap-2">
            <span className={`text-xs ${darkModeClasses.text.tertiary}`}>
              {currentStep} of {totalSteps}
            </span>
            <div className="flex gap-1">
              {Array.from({ length: totalSteps }, (_, i) => (
                <div
                  key={i}
                  className={`
                    w-2 h-2 rounded-full transition-colors
                    ${i < currentStep ? 'bg-primary-500' : 'bg-gray-300 dark:bg-gray-600'}
                  `}
                  aria-hidden="true"
                />
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            {onPrevious && currentStep > 1 && (
              <AccessibleButton
                variant="ghost"
                size="sm"
                onClick={onPrevious}
                ariaLabel="Previous step"
                icon={<ChevronLeftIcon />}
              >
                Back
              </AccessibleButton>
            )}

            {secondaryAction && (
              <AccessibleButton
                variant="outline"
                size="sm"
                onClick={secondaryAction.onClick}
                ariaLabel={secondaryAction.ariaLabel}
              >
                {secondaryAction.text}
              </AccessibleButton>
            )}

            {primaryAction ? (
              <AccessibleButton
                variant="primary"
                size="sm"
                onClick={primaryAction.onClick}
                ariaLabel={primaryAction.ariaLabel}
                icon={primaryAction.icon}
              >
                {primaryAction.text}
              </AccessibleButton>
            ) : onNext ? (
              <AccessibleButton
                variant="primary"
                size="sm"
                onClick={onNext}
                ariaLabel={currentStep === totalSteps ? "Finish tutorial" : "Next step"}
                icon={currentStep === totalSteps ? <CheckIcon /> : <ChevronRightIcon />}
              >
                {currentStep === totalSteps ? 'Finish' : 'Next'}
              </AccessibleButton>
            ) : null}
          </div>
        </div>
      </div>
    </FadeIn>
  );

  return createPortal(tooltipContent, document.body);
};

// Onboarding Tour Manager
export const OnboardingTour = ({
  steps = [],
  isActive = false,
  currentStep = 0,
  onStepChange,
  onComplete,
  onSkip,
  showSkipButton = true,
  showProgress = true,
  className = ''
}) => {
  const { announce } = useAccessibility();
  const [localStep, setLocalStep] = useState(currentStep);
  const [isVisible, setIsVisible] = useState(isActive);

  const currentStepData = steps[localStep];
  const isLastStep = localStep === steps.length - 1;

  // Handle step changes
  const handleStepChange = useCallback((newStep) => {
    if (newStep >= 0 && newStep < steps.length) {
      setLocalStep(newStep);
      onStepChange?.(newStep);
      
      // Announce step change
      const stepData = steps[newStep];
      announce(`Step ${newStep + 1}: ${stepData.title}`, 'polite');
    }
  }, [steps, onStepChange, announce]);

  const handleNext = useCallback(() => {
    if (isLastStep) {
      setIsVisible(false);
      onComplete?.();
      announce('Onboarding tour completed', 'polite');
    } else {
      handleStepChange(localStep + 1);
    }
  }, [isLastStep, localStep, handleStepChange, onComplete, announce]);

  const handlePrevious = useCallback(() => {
    if (localStep > 0) {
      handleStepChange(localStep - 1);
    }
  }, [localStep, handleStepChange]);

  const handleSkip = useCallback(() => {
    setIsVisible(false);
    onSkip?.();
    announce('Onboarding tour skipped', 'polite');
  }, [onSkip, announce]);

  const handleClose = useCallback(() => {
    setIsVisible(false);
    onSkip?.();
  }, [onSkip]);

  // Sync with external state
  useEffect(() => {
    setIsVisible(isActive);
  }, [isActive]);

  useEffect(() => {
    setLocalStep(currentStep);
  }, [currentStep]);

  if (!isVisible || !currentStepData) return null;

  return (
    <>
      {/* Backdrop overlay */}
      <SafeAnimatePresence>
        {isVisible && (
          <FadeIn>
            <div 
              className="fixed inset-0 bg-black bg-opacity-30 backdrop-blur-sm"
              style={{ zIndex: 9998 }}
              aria-hidden="true"
            />
          </FadeIn>
        )}
      </SafeAnimatePresence>

      {/* Skip button */}
      {showSkipButton && (
        <div className="fixed top-4 right-4 z-[10000]">
          <AccessibleButton
            variant="outline"
            size="sm"
            onClick={handleSkip}
            ariaLabel="Skip onboarding tour"
            className="bg-white dark:bg-gray-800 shadow-lg"
          >
            Skip Tour
          </AccessibleButton>
        </div>
      )}

      {/* Tooltip */}
      <OnboardingTooltip
        isOpen={isVisible}
        target={currentStepData.target}
        title={currentStepData.title}
        content={currentStepData.content}
        placement={currentStepData.placement}
        currentStep={localStep + 1}
        totalSteps={steps.length}
        onClose={handleClose}
        onNext={handleNext}
        onPrevious={localStep > 0 ? handlePrevious : undefined}
        primaryAction={currentStepData.primaryAction}
        secondaryAction={currentStepData.secondaryAction}
        className={className}
      />
    </>
  );
};

OnboardingTooltip.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  target: PropTypes.oneOfType([
    PropTypes.string,
    PropTypes.object,
    PropTypes.func
  ]).isRequired,
  title: PropTypes.string.isRequired,
  content: PropTypes.oneOfType([PropTypes.string, PropTypes.node]).isRequired,
  placement: PropTypes.oneOf(['auto', 'top', 'bottom', 'left', 'right']),
  showArrow: PropTypes.bool,
  onClose: PropTypes.func,
  onNext: PropTypes.func,
  onPrevious: PropTypes.func,
  currentStep: PropTypes.number,
  totalSteps: PropTypes.number,
  primaryAction: PropTypes.shape({
    text: PropTypes.string.isRequired,
    onClick: PropTypes.func.isRequired,
    ariaLabel: PropTypes.string,
    icon: PropTypes.element
  }),
  secondaryAction: PropTypes.shape({
    text: PropTypes.string.isRequired,
    onClick: PropTypes.func.isRequired,
    ariaLabel: PropTypes.string
  }),
  className: PropTypes.string,
  zIndex: PropTypes.number
};

OnboardingTour.propTypes = {
  steps: PropTypes.arrayOf(PropTypes.shape({
    target: PropTypes.oneOfType([PropTypes.string, PropTypes.object]).isRequired,
    title: PropTypes.string.isRequired,
    content: PropTypes.oneOfType([PropTypes.string, PropTypes.node]).isRequired,
    placement: PropTypes.oneOf(['auto', 'top', 'bottom', 'left', 'right']),
    primaryAction: PropTypes.object,
    secondaryAction: PropTypes.object
  })).isRequired,
  isActive: PropTypes.bool,
  currentStep: PropTypes.number,
  onStepChange: PropTypes.func,
  onComplete: PropTypes.func,
  onSkip: PropTypes.func,
  showSkipButton: PropTypes.bool,
  showProgress: PropTypes.bool,
  className: PropTypes.string
};

export default OnboardingTooltip; 