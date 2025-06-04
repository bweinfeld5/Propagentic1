/**
 * Accessible Modal Component - WCAG 2.1 AA Compliant
 * PropAgentic Design System
 */

import React, { useEffect, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import PropTypes from 'prop-types';
import { 
  useFocusManagement, 
  useKeyboardNavigation, 
  getAriaAttributes, 
  useAccessibility,
  ScreenReaderOnly 
} from '../../design-system/accessibility';
import { darkModeClasses } from '../../design-system/dark-mode';
import { XMarkIcon } from '@heroicons/react/24/outline';
import AccessibleButton from './AccessibleButton';

const AccessibleModal = ({
  isOpen,
  onClose,
  children,
  title,
  description,
  size = 'md',
  closeOnOverlayClick = true,
  closeOnEscape = true,
  showCloseButton = true,
  closeButtonAriaLabel = 'Close modal',
  preventScroll = true,
  initialFocus = null,
  finalFocus = null,
  className = '',
  overlayClassName = '',
  contentClassName = '',
  headerClassName = '',
  bodyClassName = '',
  footerClassName = '',
  footer = null,
  role = 'dialog',
  ariaModal = true,
  id,
  ...props
}) => {
  const { announce } = useAccessibility();
  const overlayRef = useRef(null);
  const modalRef = useRef(null);
  const originalActiveElement = useRef(null);

  // Focus management with trapping
  const { 
    containerRef, 
    focusFirst, 
    focusLast 
  } = useFocusManagement({
    autoFocus: true,
    restoreFocus: true,
    trapFocus: true
  });

  // Size variants
  const sizeClasses = {
    xs: 'max-w-xs',
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl',
    '3xl': 'max-w-3xl',
    '4xl': 'max-w-4xl',
    '5xl': 'max-w-5xl',
    '6xl': 'max-w-6xl',
    full: 'max-w-full mx-4'
  };

  // Close handler with announcements
  const handleClose = useCallback(() => {
    announce('Modal closed', 'polite');
    onClose();
  }, [onClose, announce]);

  // Overlay click handler
  const handleOverlayClick = useCallback((event) => {
    if (closeOnOverlayClick && event.target === overlayRef.current) {
      handleClose();
    }
  }, [closeOnOverlayClick, handleClose]);

  // Keyboard navigation
  const { handleKeyDown } = useKeyboardNavigation({
    onEscape: closeOnEscape ? handleClose : undefined,
    onTab: (event) => {
      // Handle tab trapping manually if needed
      const focusableElements = containerRef.current?.querySelectorAll(
        'button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), a[href], [tabindex]:not([tabindex="-1"])'
      );
      
      if (focusableElements?.length > 0) {
        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];
        
        if (event.shiftKey && event.target === firstElement) {
          event.preventDefault();
          lastElement.focus();
        } else if (!event.shiftKey && event.target === lastElement) {
          event.preventDefault();
          firstElement.focus();
        }
      }
    },
    enabled: isOpen,
    preventDefault: false
  });

  // Effect for modal lifecycle
  useEffect(() => {
    if (isOpen) {
      // Store the previously focused element
      originalActiveElement.current = document.activeElement;
      
      // Prevent body scroll if specified
      if (preventScroll) {
        document.body.style.overflow = 'hidden';
      }
      
      // Announce modal opening
      announce(`${title || 'Modal'} opened`, 'assertive');
      
      // Focus management
      if (initialFocus) {
        initialFocus.current?.focus();
      } else {
        // Focus first focusable element or modal itself
        setTimeout(() => {
          const firstFocusable = containerRef.current?.querySelector(
            'button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), a[href], [tabindex]:not([tabindex="-1"])'
          );
          
          if (firstFocusable) {
            firstFocusable.focus();
          } else {
            containerRef.current?.focus();
          }
        }, 0);
      }
    } else {
      // Restore body scroll
      if (preventScroll) {
        document.body.style.overflow = '';
      }
      
      // Restore focus
      if (finalFocus) {
        finalFocus.current?.focus();
      } else if (originalActiveElement.current) {
        originalActiveElement.current.focus();
      }
    }

    return () => {
      if (preventScroll) {
        document.body.style.overflow = '';
      }
    };
  }, [isOpen, preventScroll, title, announce, initialFocus, finalFocus, containerRef]);

  // Add event listeners
  useEffect(() => {
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [isOpen, handleKeyDown]);

  // Generate ARIA attributes
  const ariaAttributes = getAriaAttributes({
    modal: ariaModal,
    labelledBy: title ? `${id || 'modal'}-title` : undefined,
    describedBy: description ? `${id || 'modal'}-description` : undefined,
    role
  });

  if (!isOpen) return null;

  const modalContent = (
    <div
      ref={overlayRef}
      className={`
        fixed inset-0 z-50 flex items-center justify-center p-4
        bg-black bg-opacity-50 backdrop-blur-sm
        transition-opacity duration-300
        ${overlayClassName}
      `}
      onClick={handleOverlayClick}
    >
      <div
        ref={(node) => {
          modalRef.current = node;
          containerRef.current = node;
        }}
        className={`
          relative w-full ${sizeClasses[size]}
          bg-white rounded-lg shadow-xl
          transform transition-all duration-300
          ${darkModeClasses.bg.primary}
          ${contentClassName}
        `}
        tabIndex={-1}
        {...ariaAttributes}
        {...props}
      >
        {/* Header */}
        {(title || showCloseButton) && (
          <div className={`
            flex items-center justify-between p-6 border-b
            ${darkModeClasses.border.default}
            ${headerClassName}
          `}>
            <div className="flex-1">
              {title && (
                <h2 
                  id={`${id || 'modal'}-title`}
                  className={`text-lg font-semibold ${darkModeClasses.text.primary}`}
                >
                  {title}
                </h2>
              )}
              {description && (
                <p 
                  id={`${id || 'modal'}-description`}
                  className={`mt-1 text-sm ${darkModeClasses.text.secondary}`}
                >
                  {description}
                </p>
              )}
            </div>
            
            {showCloseButton && (
              <AccessibleButton
                variant="ghost"
                size="sm"
                onClick={handleClose}
                ariaLabel={closeButtonAriaLabel}
                className="ml-4 p-2"
                icon={<XMarkIcon />}
              />
            )}
          </div>
        )}

        {/* Body */}
        <div className={`p-6 ${bodyClassName}`}>
          {children}
        </div>

        {/* Footer */}
        {footer && (
          <div className={`
            flex items-center justify-end gap-3 p-6 border-t
            ${darkModeClasses.border.default}
            ${footerClassName}
          `}>
            {footer}
          </div>
        )}

        {/* Screen reader announcements */}
        <ScreenReaderOnly>
          <div aria-live="polite" aria-atomic="true">
            Press Escape to close this modal
          </div>
        </ScreenReaderOnly>
      </div>
    </div>
  );

  // Render to portal
  return createPortal(modalContent, document.body);
};

AccessibleModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  children: PropTypes.node.isRequired,
  title: PropTypes.string,
  description: PropTypes.string,
  size: PropTypes.oneOf(['xs', 'sm', 'md', 'lg', 'xl', '2xl', '3xl', '4xl', '5xl', '6xl', 'full']),
  closeOnOverlayClick: PropTypes.bool,
  closeOnEscape: PropTypes.bool,
  showCloseButton: PropTypes.bool,
  closeButtonAriaLabel: PropTypes.string,
  preventScroll: PropTypes.bool,
  initialFocus: PropTypes.shape({ current: PropTypes.instanceOf(Element) }),
  finalFocus: PropTypes.shape({ current: PropTypes.instanceOf(Element) }),
  className: PropTypes.string,
  overlayClassName: PropTypes.string,
  contentClassName: PropTypes.string,
  headerClassName: PropTypes.string,
  bodyClassName: PropTypes.string,
  footerClassName: PropTypes.string,
  footer: PropTypes.node,
  role: PropTypes.string,
  ariaModal: PropTypes.bool,
  id: PropTypes.string
};

export default AccessibleModal; 