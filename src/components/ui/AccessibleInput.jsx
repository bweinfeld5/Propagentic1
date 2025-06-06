/**
 * Accessible Input Component - WCAG 2.1 AA Compliant
 * PropAgentic Design System
 */

import React, { forwardRef, useId, useState, useCallback } from 'react';
import PropTypes from 'prop-types';
import { useKeyboardNavigation, getAriaAttributes, useAccessibility } from '../../design-system/accessibility';
import { darkModeClasses } from '../../design-system/dark-mode';
import { ExclamationCircleIcon, CheckCircleIcon, EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline';

const AccessibleInput = forwardRef(({
  label,
  type = 'text',
  value = '',
  placeholder = '',
  disabled = false,
  required = false,
  readOnly = false,
  error = null,
  success = false,
  helpText = null,
  size = 'md',
  fullWidth = false,
  leftIcon = null,
  rightIcon = null,
  showPasswordToggle = false,
  autoComplete = 'off',
  maxLength = null,
  minLength = null,
  pattern = null,
  onChange,
  onFocus,
  onBlur,
  onKeyDown,
  className = '',
  inputClassName = '',
  labelClassName = '',
  errorClassName = '',
  helpTextClassName = '',
  id: providedId,
  name,
  ...props
}, ref) => {
  const { announce } = useAccessibility();
  const generatedId = useId();
  const inputId = providedId || generatedId;
  const errorId = `${inputId}-error`;
  const helpId = `${inputId}-help`;
  const [showPassword, setShowPassword] = useState(false);
  const [focused, setFocused] = useState(false);

  // Determine input type based on password toggle state
  const inputType = type === 'password' && showPassword ? 'text' : type;

  // Password toggle handler
  const togglePasswordVisibility = useCallback(() => {
    setShowPassword(prev => {
      const newState = !prev;
      announce(newState ? 'Password shown' : 'Password hidden', 'polite');
      return newState;
    });
  }, [announce]);

  // Focus handlers with announcements
  const handleFocus = useCallback((event) => {
    setFocused(true);
    
    // Announce validation requirements to screen readers
    if (required && !value) {
      announce(`${label} is required`, 'polite');
    }
    
    onFocus?.(event);
  }, [onFocus, required, value, label, announce]);

  const handleBlur = useCallback((event) => {
    setFocused(false);
    onBlur?.(event);
  }, [onBlur]);

  // Change handler with validation announcements
  const handleChange = useCallback((event) => {
    onChange?.(event);
    
    // Clear error announcement when user starts typing
    if (error && event.target.value) {
      announce('Error cleared', 'polite');
    }
  }, [onChange, error, announce]);

  // Keyboard navigation
  const { handleKeyDown: handleKeyboardNav } = useKeyboardNavigation({
    enabled: !disabled && !readOnly,
    preventDefault: false,
    onEscape: (event) => {
      event.target.blur();
    }
  });

  const handleKeyDownWrapper = useCallback((event) => {
    handleKeyboardNav(event);
    onKeyDown?.(event);
  }, [handleKeyboardNav, onKeyDown]);

  // Size variants
  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm min-h-[32px]',
    md: 'px-4 py-2 text-sm min-h-[36px]',
    lg: 'px-4 py-2.5 text-base min-h-[44px]'
  };

  // Input state classes
  const getInputStateClasses = () => {
    if (disabled) {
      return 'bg-gray-100 border-gray-200 text-gray-500 cursor-not-allowed';
    }
    
    if (error) {
      return `
        bg-gray-50 border-red-300 text-red-900 placeholder-red-300
        focus:ring-red-500 focus:border-red-500
        ${darkModeClasses.border.default}
      `;
    }
    
    if (success) {
      return `
        bg-gray-50 border-green-300 text-green-900 placeholder-green-300
        focus:ring-green-500 focus:border-green-500
      `;
    }
    
    return `
      bg-gray-50 border-gray-300 text-gray-900 placeholder-gray-400
      focus:ring-primary-500 focus:border-primary-500
      ${darkModeClasses.border.default} ${darkModeClasses.text.primary}
    `;
  };

  // Base input classes
  const baseInputClasses = `
    w-full rounded-md border transition-colors duration-200
    focus:outline-none focus:ring-2 focus:ring-offset-0
    ${darkModeClasses.bg.primary}
  `;

  // Generate ARIA attributes
  const ariaAttributes = getAriaAttributes({
    required,
    invalid: !!error,
    describedBy: [
      error ? errorId : null,
      helpText ? helpId : null
    ].filter(Boolean).join(' ') || undefined
  });

  // Character count
  const showCharCount = maxLength && focused;
  const charCount = value ? value.length : 0;
  const isNearLimit = maxLength && charCount > maxLength * 0.8;

  return (
    <div className={`${fullWidth ? 'w-full' : ''} ${className}`}>
      {/* Label */}
      {label && (
        <label 
          htmlFor={inputId}
          className={`
            block text-sm font-medium mb-1
            ${required ? "after:content-['*'] after:ml-0.5 after:text-red-500" : ''}
            ${disabled ? 'text-gray-400' : darkModeClasses.text.primary}
            ${labelClassName}
          `}
        >
          {label}
        </label>
      )}

      {/* Input container */}
      <div className="relative">
        {/* Left icon */}
        {leftIcon && (
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            {React.cloneElement(leftIcon, {
              className: `h-5 w-5 ${error ? 'text-red-400' : 'text-gray-400'} ${leftIcon.props.className || ''}`,
              'aria-hidden': 'true'
            })}
          </div>
        )}

        {/* Input field */}
        <input
          ref={ref}
          id={inputId}
          name={name}
          type={inputType}
          value={value}
          placeholder={placeholder}
          disabled={disabled}
          required={required}
          readOnly={readOnly}
          autoComplete={autoComplete}
          maxLength={maxLength}
          minLength={minLength}
          pattern={pattern}
          onChange={handleChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          onKeyDown={handleKeyDownWrapper}
          className={`
            ${baseInputClasses}
            ${sizeClasses[size]}
            ${getInputStateClasses()}
            ${leftIcon ? 'pl-10' : ''}
            ${(rightIcon || showPasswordToggle || type === 'password') ? 'pr-10' : ''}
            ${inputClassName}
          `}
          {...ariaAttributes}
          {...props}
        />

        {/* Right side icons */}
        <div className="absolute inset-y-0 right-0 flex items-center pr-3">
          {/* Error icon */}
          {error && (
            <ExclamationCircleIcon 
              className="h-5 w-5 text-red-400 mr-2" 
              aria-hidden="true"
            />
          )}
          
          {/* Success icon */}
          {success && !error && (
            <CheckCircleIcon 
              className="h-5 w-5 text-green-400 mr-2" 
              aria-hidden="true"
            />
          )}

          {/* Password toggle */}
          {showPasswordToggle && type === 'password' && (
            <button
              type="button"
              onClick={togglePasswordVisibility}
              className={`
                text-gray-400 hover:text-gray-600 focus:outline-none 
                focus:ring-2 focus:ring-primary-500 focus:ring-offset-0 rounded
                ${rightIcon ? 'mr-2' : ''}
              `}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? (
                <EyeSlashIcon className="h-5 w-5" aria-hidden="true" />
              ) : (
                <EyeIcon className="h-5 w-5" aria-hidden="true" />
              )}
            </button>
          )}

          {/* Right icon */}
          {rightIcon && (
            <div className="pointer-events-none">
              {React.cloneElement(rightIcon, {
                className: `h-5 w-5 ${error ? 'text-red-400' : 'text-gray-400'} ${rightIcon.props.className || ''}`,
                'aria-hidden': 'true'
              })}
            </div>
          )}
        </div>
      </div>

      {/* Character count */}
      {showCharCount && (
        <div className={`
          text-xs mt-1 text-right
          ${isNearLimit ? 'text-yellow-600' : 'text-gray-500'}
          ${charCount > maxLength ? 'text-red-600' : ''}
        `}>
          {charCount}/{maxLength}
        </div>
      )}

      {/* Error message */}
      {error && (
        <p 
          id={errorId}
          className={`mt-1 text-sm text-red-600 flex items-center ${errorClassName}`}
          role="alert"
          aria-live="polite"
        >
          <ExclamationCircleIcon className="h-4 w-4 mr-1 flex-shrink-0" aria-hidden="true" />
          {error}
        </p>
      )}

      {/* Help text */}
      {helpText && !error && (
        <p 
          id={helpId}
          className={`mt-1 text-sm ${darkModeClasses.text.tertiary} ${helpTextClassName}`}
        >
          {helpText}
        </p>
      )}
    </div>
  );
});

AccessibleInput.displayName = 'AccessibleInput';

AccessibleInput.propTypes = {
  label: PropTypes.string,
  type: PropTypes.oneOf(['text', 'email', 'password', 'tel', 'url', 'search', 'number']),
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  placeholder: PropTypes.string,
  disabled: PropTypes.bool,
  required: PropTypes.bool,
  readOnly: PropTypes.bool,
  error: PropTypes.string,
  success: PropTypes.bool,
  helpText: PropTypes.string,
  size: PropTypes.oneOf(['sm', 'md', 'lg']),
  fullWidth: PropTypes.bool,
  leftIcon: PropTypes.element,
  rightIcon: PropTypes.element,
  showPasswordToggle: PropTypes.bool,
  autoComplete: PropTypes.string,
  maxLength: PropTypes.number,
  minLength: PropTypes.number,
  pattern: PropTypes.string,
  onChange: PropTypes.func,
  onFocus: PropTypes.func,
  onBlur: PropTypes.func,
  onKeyDown: PropTypes.func,
  className: PropTypes.string,
  inputClassName: PropTypes.string,
  labelClassName: PropTypes.string,
  errorClassName: PropTypes.string,
  helpTextClassName: PropTypes.string,
  id: PropTypes.string,
  name: PropTypes.string
};

export default AccessibleInput; 