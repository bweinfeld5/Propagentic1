import React from 'react';
import { Link } from 'react-router-dom';
import { cx, createComponentClasses, components, durations, easings, darkModeClasses } from '../../design-system';

/**
 * Button Component
 * Reusable button component for PropAgentic using Design System
 */

const Button = ({ 
  children, 
  onClick, 
  variant = 'primary', 
  size = 'md', 
  disabled = false,
  loading = false,
  fullWidth = false,
  icon = null,
  iconPosition = 'left',
  className = '',
  type = 'button',
  href = null,
  to = null,
  ...props 
}) => {
  // Base classes with design system integration
  const baseClasses = `
    inline-flex items-center justify-center
    font-medium rounded-lg
    transition-all duration-${durations.normal}
    focus:outline-none focus:ring-2 focus:ring-offset-2
    disabled:cursor-not-allowed disabled:opacity-50
    ${fullWidth ? 'w-full' : ''}
  `;
  
  // Variant classes using design system dark mode utilities
  const variantClasses = {
    primary: `${darkModeClasses.button.primary} focus:ring-blue-500 dark:focus:ring-blue-400`,
    secondary: `${darkModeClasses.button.secondary} focus:ring-gray-500 dark:focus:ring-gray-400`,
    outline: `${darkModeClasses.button.outline} focus:ring-blue-500 dark:focus:ring-blue-400 border-2`,
    ghost: `${darkModeClasses.button.ghost} focus:ring-gray-500 dark:focus:ring-gray-400`,
    danger: 'bg-red-600 hover:bg-red-700 dark:bg-red-500 dark:hover:bg-red-600 text-white focus:ring-red-500 dark:focus:ring-red-400',
    success: 'bg-green-600 hover:bg-green-700 dark:bg-green-500 dark:hover:bg-green-600 text-white focus:ring-green-500 dark:focus:ring-green-400',
  };
  
  // Size classes using design system component tokens
  const sizeClasses = {
    xs: 'px-2.5 py-1.5 text-xs gap-1',
    sm: 'px-3 py-2 text-sm gap-1.5',
    md: 'px-4 py-2.5 text-base gap-2',
    lg: 'px-6 py-3 text-lg gap-2.5',
    xl: 'px-8 py-4 text-xl gap-3',
  };
  
  // Icon size mapping
  const iconSizes = {
    xs: 'w-3 h-3',
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6',
    xl: 'w-7 h-7',
  };
  
  // Loading spinner (simplified version)
  const LoadingSpinner = () => (
    <svg 
      className={`animate-spin ${iconSizes[size]}`} 
      xmlns="http://www.w3.org/2000/svg" 
      fill="none" 
      viewBox="0 0 24 24"
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
  
  // Render icon with proper sizing
  const renderIcon = () => {
    if (loading) return <LoadingSpinner />;
    if (!icon) return null;
    
    return React.cloneElement(icon, {
      className: cx(iconSizes[size], icon.props?.className),
    });
  };
  
  // Combine all classes
  const buttonClasses = cx(
    baseClasses,
    variantClasses[variant],
    sizeClasses[size],
    className
  );
  
  // Button content with icon support
  const buttonContent = (
    <>
      {(icon || loading) && iconPosition === 'left' && renderIcon()}
      {children}
      {icon && !loading && iconPosition === 'right' && renderIcon()}
    </>
  );
  
  // Handle different button types (regular, link, router link)
  if (href) {
    return (
      <a
        href={href}
        className={buttonClasses}
        onClick={onClick}
        {...props}
      >
        {buttonContent}
      </a>
    );
  }
  
  if (to) {
    return (
      <Link
        to={to}
        className={buttonClasses}
        onClick={onClick}
        {...props}
      >
        {buttonContent}
      </Link>
    );
  }
  
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={buttonClasses}
      {...props}
    >
      {buttonContent}
    </button>
  );
};

export default Button; 