import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CheckCircleIcon,
  ExclamationCircleIcon,
  InformationCircleIcon,
  XCircleIcon,
  ArrowPathIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import { CheckCircleIcon as CheckCircleSolid } from '@heroicons/react/24/solid';

const ActionFeedback = ({
  isOpen,
  type,
  title,
  message,
  progress = 0,
  showUndo = false,
  undoText = 'Undo',
  onUndo,
  onClose,
  duration = 5000,
  showRetry = false,
  onRetry,
  className = '',
  position = 'bottom'
}) => {
  const [countdown, setCountdown] = useState(duration / 1000);

  useEffect(() => {
    if (!isOpen || type === 'loading' || type === 'progress') return;

    const timer = setTimeout(() => {
      onClose?.();
    }, duration);

    const countdownInterval = setInterval(() => {
      setCountdown(prev => Math.max(0, prev - 0.1));
    }, 100);

    return () => {
      clearTimeout(timer);
      clearInterval(countdownInterval);
    };
  }, [isOpen, type, duration, onClose]);

  const getIcon = () => {
    switch (type) {
      case 'loading':
        return <ArrowPathIcon className="w-5 h-5 animate-spin text-blue-500" />;
      case 'success':
        return <CheckCircleSolid className="w-5 h-5 text-green-500" />;
      case 'error':
        return <XCircleIcon className="w-5 h-5 text-red-500" />;
      case 'info':
        return <InformationCircleIcon className="w-5 h-5 text-blue-500" />;
      case 'progress':
        return <ArrowPathIcon className="w-5 h-5 animate-spin text-orange-500" />;
      default:
        return <InformationCircleIcon className="w-5 h-5 text-blue-500" />;
    }
  };

  const getBackgroundColor = () => {
    switch (type) {
      case 'success':
        return 'bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800';
      case 'error':
        return 'bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800';
      case 'info':
      case 'loading':
        return 'bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-800';
      case 'progress':
        return 'bg-orange-50 border-orange-200 dark:bg-orange-900/20 dark:border-orange-800';
      default:
        return 'bg-gray-50 border-gray-200 dark:bg-gray-900/20 dark:border-gray-800';
    }
  };

  const getPositionClasses = () => {
    switch (position) {
      case 'top':
        return 'top-4 left-1/2 transform -translate-x-1/2';
      case 'center':
        return 'top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2';
      case 'bottom':
      default:
        return 'bottom-4 left-1/2 transform -translate-x-1/2';
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: position === 'top' ? -50 : 50, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: position === 'top' ? -50 : 50, scale: 0.95 }}
        className={`fixed ${getPositionClasses()} z-50 ${className}`}
      >
        <div className={`max-w-sm w-full rounded-lg border shadow-lg ${getBackgroundColor()} p-4`}>
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 mt-0.5">
              {getIcon()}
            </div>
            
            <div className="flex-1 min-w-0">
              <h4 className="text-sm font-semibold text-gray-900 dark:text-white">
                {title}
              </h4>
              
              {message && (
                <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                  {message}
                </p>
              )}
              
              {type === 'progress' && (
                <div className="mt-2">
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <motion.div
                      className="bg-orange-500 h-2 rounded-full"
                      initial={{ width: 0 }}
                      animate={{ width: `${progress}%` }}
                      transition={{ duration: 0.3 }}
                    />
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {Math.round(progress)}% complete
                  </p>
                </div>
              )}
              
              {(showUndo || showRetry) && (
                <div className="flex items-center gap-2 mt-3">
                  {showUndo && onUndo && (
                    <button
                      onClick={onUndo}
                      className="text-xs font-medium text-orange-600 dark:text-orange-400 hover:text-orange-700 dark:hover:text-orange-300 transition-colors"
                    >
                      {undoText}
                    </button>
                  )}
                  
                  {showRetry && onRetry && (
                    <button
                      onClick={onRetry}
                      className="text-xs font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors"
                    >
                      Retry
                    </button>
                  )}
                </div>
              )}
            </div>
            
            {type !== 'loading' && type !== 'progress' && onClose && (
              <button
                onClick={onClose}
                className="flex-shrink-0 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
              >
                <XMarkIcon className="w-4 h-4" />
              </button>
            )}
          </div>
          
          {/* Auto-close progress bar */}
          {type !== 'loading' && type !== 'progress' && duration > 0 && (
            <motion.div
              className="absolute bottom-0 left-0 h-1 bg-gray-300 dark:bg-gray-600 rounded-b-lg"
              initial={{ width: '100%' }}
              animate={{ width: '0%' }}
              transition={{ duration: duration / 1000, ease: 'linear' }}
            />
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default ActionFeedback;