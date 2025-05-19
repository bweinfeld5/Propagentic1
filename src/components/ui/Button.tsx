import React from 'react';

interface ButtonProps {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'success' | 'filter-active' | 'filter-inactive' | 'light' | 'outline-inverse' | 'ghost-inverse' | 'tab-active' | 'tab-inactive';
  size?: 'xs' | 'sm' | 'md' | 'lg';
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  type?: 'button' | 'submit' | 'reset';
  className?: string;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  fullWidth?: boolean;
}

/**
 * Standardized button component for PropAgentic
 */
const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  children,
  onClick,
  disabled = false,
  type = 'button',
  className = '',
  icon,
  iconPosition = 'left',
  fullWidth = false,
}) => {
  const baseStyles = 'inline-flex items-center justify-center font-medium transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-propagentic-teal rounded-lg';
  
  const variantStyles = {
    primary: 'bg-propagentic-teal text-white hover:bg-teal-600 shadow-sm',
    secondary: 'bg-propagentic-slate-light text-propagentic-slate-dark hover:bg-propagentic-slate-light/80 dark:bg-propagentic-slate dark:text-white',
    outline: 'border border-propagentic-teal text-propagentic-teal hover:bg-propagentic-teal hover:text-white',
    ghost: 'bg-transparent border-transparent text-content dark:text-content-dark hover:bg-neutral-100 dark:hover:bg-neutral-700/50',
    danger: 'bg-red-500 text-white hover:bg-red-600',
    success: 'bg-green-500 text-white hover:bg-green-600',
    'filter-active': 'bg-white dark:bg-neutral-700 border-transparent text-primary dark:text-primary-light shadow',
    'filter-inactive': 'bg-primary/10 dark:bg-neutral-800/60 border-transparent text-white dark:text-neutral-300 hover:bg-primary/20 dark:hover:bg-neutral-700/80',
    'light': 'bg-white border-transparent text-primary hover:bg-neutral-100',
    'outline-inverse': 'bg-transparent border-white/50 text-white hover:bg-white/10',
    'ghost-inverse': 'bg-transparent border-transparent text-white hover:bg-white/10',
    'tab-active': 'bg-primary text-white border-transparent shadow-sm',
    'tab-inactive': 'bg-transparent text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-700/50'
  };
  
  const sizeStyles = {
    xs: 'text-xs px-2.5 py-1.5',
    sm: 'text-sm px-3 py-2',
    md: 'text-sm px-6 py-2',
    lg: 'text-base px-8 py-3',
  };
  
  const disabledStyles = disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer';
  const widthStyles = fullWidth ? 'w-full' : '';
  
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${disabledStyles} ${widthStyles} ${className}`}
    >
      {icon && iconPosition === 'left' && <span className="mr-2">{icon}</span>}
      {children}
      {icon && iconPosition === 'right' && <span className="ml-2">{icon}</span>}
    </button>
  );
};

export default Button; 