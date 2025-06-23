import React, { useEffect, useRef } from 'react';
import { 
  ExclamationTriangleIcon, 
  InformationCircleIcon,
  CheckCircleIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import Button from './Button';
import { cx } from '../../design-system';

const ConfirmationModal = ({
  isOpen = false,
  onClose,
  onConfirm,
  title = 'Confirm Action',
  message = 'Are you sure you want to proceed?',
  variant = 'danger', // danger, warning, info, success
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  isLoading = false,
  loadingText = 'Processing...',
  showIcon = true,
  children = null,
  className = '',
  closeOnEscape = true,
  closeOnOverlayClick = true,
  focusTrap = true,
  size = 'md' // sm, md, lg
}) => {
  const modalRef = useRef(null);
  const cancelButtonRef = useRef(null);
  const confirmButtonRef = useRef(null);

  // Handle escape key
  useEffect(() => {
    if (!isOpen || !closeOnEscape) return;

    const handleEscape = (e) => {
      if (e.key === 'Escape' && !isLoading) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, closeOnEscape, onClose, isLoading]);

  // Focus management
  useEffect(() => {
    if (!isOpen || !focusTrap) return;

    const focusableElements = modalRef.current?.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );

    const firstElement = focusableElements?.[0];
    const lastElement = focusableElements?.[focusableElements.length - 1];

    // Focus the cancel button by default
    if (cancelButtonRef.current) {
      cancelButtonRef.current.focus();
    }

    const handleTabKey = (e) => {
      if (e.key !== 'Tab') return;

      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          lastElement?.focus();
          e.preventDefault();
        }
      } else {
        if (document.activeElement === lastElement) {
          firstElement?.focus();
          e.preventDefault();
        }
      }
    };

    document.addEventListener('keydown', handleTabKey);
    return () => document.removeEventListener('keydown', handleTabKey);
  }, [isOpen, focusTrap]);

  // Handle overlay click
  const handleOverlayClick = (e) => {
    if (closeOnOverlayClick && !isLoading && e.target === e.currentTarget) {
      onClose();
    }
  };

  // Handle confirm action
  const handleConfirm = async () => {
    if (isLoading) return;
    
    try {
      await onConfirm();
    } catch (error) {
      // Error handling is managed by the parent component
      console.error('Confirmation action failed:', error);
    }
  };

  if (!isOpen) return null;

  // Variant configurations
  const variantConfig = {
    danger: {
      icon: ExclamationTriangleIcon,
      iconBg: 'bg-red-100 dark:bg-red-900/20',
      iconColor: 'text-red-600 dark:text-red-400',
      confirmVariant: 'danger',
      titleColor: 'text-gray-900 dark:text-white'
    },
    warning: {
      icon: ExclamationTriangleIcon,
      iconBg: 'bg-yellow-100 dark:bg-yellow-900/20',
      iconColor: 'text-yellow-600 dark:text-yellow-400',
      confirmVariant: 'primary',
      titleColor: 'text-gray-900 dark:text-white'
    },
    info: {
      icon: InformationCircleIcon,
      iconBg: 'bg-blue-100 dark:bg-blue-900/20',
      iconColor: 'text-blue-600 dark:text-blue-400',
      confirmVariant: 'primary',
      titleColor: 'text-gray-900 dark:text-white'
    },
    success: {
      icon: CheckCircleIcon,
      iconBg: 'bg-green-100 dark:bg-green-900/20',
      iconColor: 'text-green-600 dark:text-green-400',
      confirmVariant: 'success',
      titleColor: 'text-gray-900 dark:text-white'
    }
  };

  const config = variantConfig[variant];
  const IconComponent = config.icon;

  // Size configurations
  const sizeConfig = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl'
  };

  return (
    <div 
      className="fixed inset-0 z-50 overflow-y-auto"
      aria-labelledby="modal-title"
      role="dialog"
      aria-modal="true"
    >
      {/* Backdrop */}
      <div 
        className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0"
        onClick={handleOverlayClick}
      >
        <div 
          className="fixed inset-0 bg-gray-500 bg-opacity-75 dark:bg-gray-900 dark:bg-opacity-80 transition-opacity"
          aria-hidden="true"
        />

        {/* Center modal vertically */}
        <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">
          &#8203;
        </span>

        {/* Modal panel */}
        <div
          ref={modalRef}
          className={cx(
            'relative inline-block align-bottom bg-white dark:bg-gray-800 rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:p-6',
            sizeConfig[size],
            'w-full',
            className
          )}
        >
          {/* Close button */}
          <div className="absolute top-0 right-0 pt-4 pr-4">
            <button
              type="button"
              className="bg-white dark:bg-gray-800 rounded-md text-gray-400 hover:text-gray-500 dark:text-gray-500 dark:hover:text-gray-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              onClick={onClose}
              disabled={isLoading}
            >
              <span className="sr-only">Close</span>
              <XMarkIcon className="h-6 w-6" aria-hidden="true" />
            </button>
          </div>

          <div className="sm:flex sm:items-start">
            {/* Icon */}
            {showIcon && (
              <div className={cx(
                'mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full sm:mx-0 sm:h-10 sm:w-10',
                config.iconBg
              )}>
                <IconComponent className={cx('h-6 w-6', config.iconColor)} aria-hidden="true" />
              </div>
            )}

            {/* Content */}
            <div className={cx('mt-3 text-center sm:mt-0 sm:text-left', showIcon && 'sm:ml-4')}>
              <h3 
                className={cx('text-lg leading-6 font-medium', config.titleColor)}
                id="modal-title"
              >
                {title}
              </h3>
              
              <div className="mt-2">
                {typeof message === 'string' ? (
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {message}
                  </p>
                ) : (
                  message
                )}
                
                {children && (
                  <div className="mt-4">
                    {children}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse">
            <Button
              ref={confirmButtonRef}
              type="button"
              variant={config.confirmVariant}
              onClick={handleConfirm}
              disabled={isLoading}
              loading={isLoading}
              className="w-full sm:ml-3 sm:w-auto"
            >
              {isLoading ? loadingText : confirmText}
            </Button>
            
            <Button
              ref={cancelButtonRef}
              type="button"
              variant="secondary"
              onClick={onClose}
              disabled={isLoading}
              className="mt-3 w-full sm:mt-0 sm:w-auto"
            >
              {cancelText}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConfirmationModal;