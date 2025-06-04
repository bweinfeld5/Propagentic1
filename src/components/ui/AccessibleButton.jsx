/**
 * Accessible Button Component - WCAG 2.1 AA Compliant
 * PropAgentic Design System
 */

import React, { forwardRef, useCallback } from 'react';
import PropTypes from 'prop-types';
import { useKeyboardNavigation, getAriaAttributes, useAccessibility } from '../../design-system/accessibility';
import { darkModeClasses } from '../../design-system/dark-mode';

const AccessibleButton = forwardRef(({
  children,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  pressed = false,
  expanded = null,
  controls = null,
  describedBy = null,
  hasPopup = null,
  onClick,
  onFocus,
  onBlur,
  className = '',
  type = 'button',
  role = 'button',
  ariaLabel,
  loadingText = 'Loading...',
  icon = null,
  iconPosition = 'left',
  fullWidth = false,
  ...props
}, ref) => {
  const { announce } = useAccessibility();

  // Handle click with accessibility announcements
  const handleClick = useCallback((event) => {
    if (disabled || loading) {
      event.preventDefault();
      return;
    }

    // Announce action to screen readers
    if (ariaLabel && !loading) {
      announce(`${ariaLabel} activated`, 'assertive');
    }

    onClick?.(event);
  }, [disabled, loading, onClick, ariaLabel, announce]);

  // Keyboard navigation
  const { handleKeyDown } = useKeyboardNavigation({
    onEnter: handleClick,
    onSpace: handleClick,
    enabled: !disabled && !loading,
    preventDefault: false
  });

  // Size variants
  const sizeClasses = {
    xs: 'px-2 py-1 text-xs min-h-[28px]',
    sm: 'px-3 py-1.5 text-sm min-h-[32px]',
    md: 'px-4 py-2 text-sm min-h-[36px]',
    lg: 'px-6 py-2.5 text-base min-h-[44px]',
    xl: 'px-8 py-3 text-lg min-h-[48px]'
  };

  // Variant styles with accessibility considerations
  const variantClasses = {
    primary: `
      bg-primary-600 hover:bg-primary-700 active:bg-primary-800
      text-white border border-transparent
      focus:ring-2 focus:ring-primary-500 focus:ring-offset-2
      disabled:bg-primary-300 disabled:cursor-not-allowed
    `,
    secondary: `
      bg-white hover:bg-gray-50 active:bg-gray-100
      text-gray-900 border border-gray-300
      focus:ring-2 focus:ring-primary-500 focus:ring-offset-2
      disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed
      ${darkModeClasses.bg.secondary} ${darkModeClasses.text.primary} ${darkModeClasses.border.default}
    `,
    danger: `
      bg-red-600 hover:bg-red-700 active:bg-red-800
      text-white border border-transparent
      focus:ring-2 focus:ring-red-500 focus:ring-offset-2
      disabled:bg-red-300 disabled:cursor-not-allowed
    `,
    ghost: `
      bg-transparent hover:bg-gray-100 active:bg-gray-200
      text-gray-700 border border-transparent
      focus:ring-2 focus:ring-primary-500 focus:ring-offset-2
      disabled:text-gray-400 disabled:cursor-not-allowed
      ${darkModeClasses.text.secondary} hover:${darkModeClasses.bg.hover}
    `,
    outline: `
      bg-transparent hover:bg-primary-50 active:bg-primary-100
      text-primary-600 border border-primary-600
      focus:ring-2 focus:ring-primary-500 focus:ring-offset-2
      disabled:border-primary-300 disabled:text-primary-300 disabled:cursor-not-allowed
    `
  };

  // Generate ARIA attributes
  const ariaAttributes = getAriaAttributes({
    label: ariaLabel,
    describedBy,
    pressed: typeof pressed === 'boolean' ? pressed : undefined,
    expanded,
    controls,
    hasPopup,
    disabled: disabled || loading
  });

  // Loading spinner component
  const LoadingSpinner = () => (
    <svg 
      className="animate-spin h-4 w-4" 
      xmlns="http://www.w3.org/2000/svg" 
      fill="none" 
      viewBox="0 0 24 24"
      aria-hidden="true"
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

  // Icon rendering with accessibility
  const renderIcon = () => {
    if (loading) return <LoadingSpinner />;
    if (!icon) return null;
    
    return React.cloneElement(icon, {
      className: `h-4 w-4 ${icon.props.className || ''}`,
      'aria-hidden': 'true'
    });
  };

  // Base classes
  const baseClasses = `
    inline-flex items-center justify-center
    font-medium rounded-md
    transition-all duration-200
    focus:outline-none
    relative
    ${fullWidth ? 'w-full' : ''}
    ${disabled || loading ? 'pointer-events-none' : 'cursor-pointer'}
  `;

  return (
    <button
      ref={ref}
      type={type}
      role={role}
      disabled={disabled || loading}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      onFocus={onFocus}
      onBlur={onBlur}
      className={`
        ${baseClasses}
        ${sizeClasses[size]}
        ${variantClasses[variant]}
        ${className}
      `}
      {...ariaAttributes}
      {...props}
    >
      {/* Content wrapper for proper spacing */}
      <span className="flex items-center gap-2">
        {/* Left icon */}
        {iconPosition === 'left' && renderIcon()}
        
        {/* Button text with loading state */}
        <span className={loading ? 'opacity-0' : ''}>
          {children}
        </span>
        
        {/* Right icon */}
        {iconPosition === 'right' && renderIcon()}
      </span>

      {/* Loading overlay */}
      {loading && (
        <span className="absolute inset-0 flex items-center justify-center">
          <LoadingSpinner />
          <span className="sr-only">{loadingText}</span>
        </span>
      )}
    </button>
  );
});

AccessibleButton.displayName = 'AccessibleButton';

AccessibleButton.propTypes = {
  children: PropTypes.node.isRequired,
  variant: PropTypes.oneOf(['primary', 'secondary', 'danger', 'ghost', 'outline']),
  size: PropTypes.oneOf(['xs', 'sm', 'md', 'lg', 'xl']),
  disabled: PropTypes.bool,
  loading: PropTypes.bool,
  pressed: PropTypes.bool,
  expanded: PropTypes.bool,
  controls: PropTypes.string,
  describedBy: PropTypes.string,
  hasPopup: PropTypes.oneOf([true, 'true', 'false', 'menu', 'listbox', 'tree', 'grid', 'dialog']),
  onClick: PropTypes.func,
  onFocus: PropTypes.func,
  onBlur: PropTypes.func,
  className: PropTypes.string,
  type: PropTypes.oneOf(['button', 'submit', 'reset']),
  role: PropTypes.string,
  ariaLabel: PropTypes.string,
  loadingText: PropTypes.string,
  icon: PropTypes.element,
  iconPosition: PropTypes.oneOf(['left', 'right']),
  fullWidth: PropTypes.bool
};

export default AccessibleButton; 