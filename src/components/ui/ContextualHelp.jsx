import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  QuestionMarkCircleIcon,
  XMarkIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  PlayIcon,
  BookOpenIcon,
  LightBulbIcon
} from '@heroicons/react/24/outline';

const ContextualHelp = ({
  trigger = 'hover',
  position = 'top',
  title,
  content,
  steps = [],
  showOnFirstVisit = false,
  persistKey,
  className = '',
  children,
  disabled = false,
  maxWidth = 300,
  offset = 10,
  delay = 500
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [hasBeenSeen, setHasBeenSeen] = useState(false);
  const triggerRef = useRef(null);
  const tooltipRef = useRef(null);
  const timeoutRef = useRef(null);

  // Check if this help has been seen before
  useEffect(() => {
    if (persistKey && showOnFirstVisit) {
      const seen = localStorage.getItem(`help-seen-${persistKey}`);
      if (!seen) {
        setIsOpen(true);
      }
      setHasBeenSeen(!!seen);
    }
  }, [persistKey, showOnFirstVisit]);

  // Mark as seen when closed
  const handleClose = () => {
    setIsOpen(false);
    setCurrentStep(0);
    
    if (persistKey && !hasBeenSeen) {
      localStorage.setItem(`help-seen-${persistKey}`, 'true');
      setHasBeenSeen(true);
    }
  };

  // Handle trigger events
  const handleMouseEnter = () => {
    if (trigger === 'hover' && !disabled) {
      timeoutRef.current = setTimeout(() => {
        setIsOpen(true);
      }, delay);
    }
  };

  const handleMouseLeave = () => {
    if (trigger === 'hover') {
      clearTimeout(timeoutRef.current);
      setIsOpen(false);
    }
  };

  const handleClick = () => {
    if (trigger === 'click' && !disabled) {
      setIsOpen(!isOpen);
    }
  };

  const handleFocus = () => {
    if (trigger === 'focus' && !disabled) {
      setIsOpen(true);
    }
  };

  const handleBlur = () => {
    if (trigger === 'focus') {
      setIsOpen(false);
    }
  };

  // Navigation for multi-step help
  const nextStep = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleClose();
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const goToStep = (index) => {
    setCurrentStep(index);
  };

  // Get position styles
  const getPositionStyles = () => {
    const styles = {
      position: 'absolute',
      zIndex: 1000,
      maxWidth: `${maxWidth}px`,
    };

    switch (position) {
      case 'top':
        styles.bottom = `calc(100% + ${offset}px)`;
        styles.left = '50%';
        styles.transform = 'translateX(-50%)';
        break;
      case 'bottom':
        styles.top = `calc(100% + ${offset}px)`;
        styles.left = '50%';
        styles.transform = 'translateX(-50%)';
        break;
      case 'left':
        styles.right = `calc(100% + ${offset}px)`;
        styles.top = '50%';
        styles.transform = 'translateY(-50%)';
        break;
      case 'right':
        styles.left = `calc(100% + ${offset}px)`;
        styles.top = '50%';
        styles.transform = 'translateY(-50%)';
        break;
      default:
        styles.bottom = `calc(100% + ${offset}px)`;
        styles.left = '50%';
        styles.transform = 'translateX(-50%)';
    }

    return styles;
  };

  // Get arrow styles
  const getArrowClasses = () => {
    const baseClasses = "absolute w-0 h-0 border-solid";
    
    switch (position) {
      case 'top':
        return `${baseClasses} border-l-8 border-r-8 border-t-8 border-l-transparent border-r-transparent border-t-white dark:border-t-gray-800 top-full left-1/2 transform -translate-x-1/2`;
      case 'bottom':
        return `${baseClasses} border-l-8 border-r-8 border-b-8 border-l-transparent border-r-transparent border-b-white dark:border-b-gray-800 bottom-full left-1/2 transform -translate-x-1/2`;
      case 'left':
        return `${baseClasses} border-t-8 border-b-8 border-l-8 border-t-transparent border-b-transparent border-l-white dark:border-l-gray-800 left-full top-1/2 transform -translate-y-1/2`;
      case 'right':
        return `${baseClasses} border-t-8 border-b-8 border-r-8 border-t-transparent border-b-transparent border-r-white dark:border-r-gray-800 right-full top-1/2 transform -translate-y-1/2`;
      default:
        return `${baseClasses} border-l-8 border-r-8 border-t-8 border-l-transparent border-r-transparent border-t-white dark:border-t-gray-800 top-full left-1/2 transform -translate-x-1/2`;
    }
  };

  const currentContent = steps.length > 0 ? steps[currentStep] : { title, content };
  const isMultiStep = steps.length > 1;

  return (
    <div className={`relative inline-block ${className}`}>
      {/* Trigger Element */}
      <div
        ref={triggerRef}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onClick={handleClick}
        onFocus={handleFocus}
        onBlur={handleBlur}
        className={trigger === 'click' ? 'cursor-pointer' : ''}
      >
        {children || (
          <QuestionMarkCircleIcon 
            className="w-5 h-5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors" 
          />
        )}
      </div>

      {/* Tooltip/Help Content */}
      <AnimatePresence>
        {isOpen && !disabled && (
          <motion.div
            ref={tooltipRef}
            initial={{ opacity: 0, scale: 0.95, y: position === 'top' ? 10 : -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: position === 'top' ? 10 : -10 }}
            transition={{ duration: 0.15 }}
            style={getPositionStyles()}
            className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg p-4"
          >
            {/* Arrow */}
            <div className={getArrowClasses()} />

            {/* Header */}
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-2">
                {currentContent.icon && (
                  <currentContent.icon className="w-5 h-5 text-orange-500" />
                )}
                {currentContent.title && (
                  <h3 className="font-semibold text-gray-900 dark:text-white text-sm">
                    {currentContent.title}
                  </h3>
                )}
              </div>
              
              <button
                onClick={handleClose}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors ml-2"
              >
                <XMarkIcon className="w-4 h-4" />
              </button>
            </div>

            {/* Content */}
            <div className="text-sm text-gray-600 dark:text-gray-300 mb-3">
              {typeof currentContent.content === 'string' ? (
                <p>{currentContent.content}</p>
              ) : (
                currentContent.content
              )}
            </div>

            {/* Video/Demo link */}
            {currentContent.video && (
              <div className="mb-3">
                <a
                  href={currentContent.video}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-sm text-orange-600 dark:text-orange-400 hover:text-orange-700 dark:hover:text-orange-300 transition-colors"
                >
                  <PlayIcon className="w-4 h-4" />
                  Watch demo
                </a>
              </div>
            )}

            {/* Documentation link */}
            {currentContent.docs && (
              <div className="mb-3">
                <a
                  href={currentContent.docs}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors"
                >
                  <BookOpenIcon className="w-4 h-4" />
                  Read more
                </a>
              </div>
            )}

            {/* Multi-step navigation */}
            {isMultiStep && (
              <div className="flex items-center justify-between pt-3 border-t border-gray-200 dark:border-gray-700">
                <button
                  onClick={prevStep}
                  disabled={currentStep === 0}
                  className="flex items-center gap-1 text-sm text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronLeftIcon className="w-4 h-4" />
                  Previous
                </button>

                {/* Step indicators */}
                <div className="flex items-center gap-1">
                  {steps.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => goToStep(index)}
                      className={`w-2 h-2 rounded-full transition-colors ${
                        index === currentStep
                          ? 'bg-orange-500'
                          : 'bg-gray-300 dark:bg-gray-600 hover:bg-gray-400 dark:hover:bg-gray-500'
                      }`}
                    />
                  ))}
                </div>

                <button
                  onClick={nextStep}
                  className="flex items-center gap-1 text-sm text-orange-600 dark:text-orange-400 hover:text-orange-700 dark:hover:text-orange-300 transition-colors"
                >
                  {currentStep === steps.length - 1 ? 'Finish' : 'Next'}
                  <ChevronRightIcon className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* Tips */}
            {currentContent.tip && (
              <div className="mt-3 p-2 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded text-xs text-yellow-800 dark:text-yellow-200">
                <div className="flex items-start gap-2">
                  <LightBulbIcon className="w-3 h-3 mt-0.5 flex-shrink-0" />
                  <span>{currentContent.tip}</span>
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// Preset help configurations
export const helpConfigs = {
  keyboard: {
    title: "Keyboard Shortcuts",
    content: "Press Cmd/Ctrl + K to open quick search, or Cmd/Ctrl + / to see all shortcuts.",
    icon: QuestionMarkCircleIcon,
    tip: "Most shortcuts work even when typing in forms!"
  },
  
  bulk: {
    title: "Bulk Operations",
    content: "Select multiple items and use the bulk actions bar that appears at the bottom.",
    icon: QuestionMarkCircleIcon,
    tip: "Use Cmd/Ctrl + A to select all items quickly."
  },
  
  mobile: {
    title: "Mobile Gestures",
    content: "Swipe left or right on cards to reveal quick actions like delete or archive.",
    icon: QuestionMarkCircleIcon,
    tip: "Long press on items for additional context menus."
  }
};

export default ContextualHelp;