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
  const baseStyles = 'inline-flex items-center justify-center font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 rounded-lg';
  
  const variantStyles = {
    primary: 'bg-gradient-to-r from-orange-600 to-red-600 text-white hover:from-orange-700 hover:to-red-700 transform hover:scale-105 active:scale-95 shadow-lg hover:shadow-xl',
    secondary: 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-white dark:hover:bg-gray-600',
    outline: 'border-2 border-orange-500 text-orange-600 hover:bg-orange-500 hover:text-white transition-all duration-200',
    ghost: 'bg-transparent border-transparent text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700/50',
    danger: 'bg-red-500 text-white hover:bg-red-600 shadow-lg hover:shadow-xl',
    success: 'bg-green-500 text-white hover:bg-green-600 shadow-lg hover:shadow-xl',
    'filter-active': 'bg-white dark:bg-gray-700 border-transparent text-orange-600 dark:text-orange-400 shadow',
    'filter-inactive': 'bg-orange-50 dark:bg-gray-800/60 border-transparent text-orange-600 dark:text-gray-300 hover:bg-orange-100 dark:hover:bg-gray-700/80',
    'light': 'bg-white border-transparent text-orange-600 hover:bg-gray-50',
    'outline-inverse': 'bg-transparent border-white/50 text-white hover:bg-white/10',
    'ghost-inverse': 'bg-transparent border-transparent text-white hover:bg-white/10',
    'tab-active': 'bg-orange-600 text-white border-transparent shadow-sm',
    'tab-inactive': 'bg-transparent text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700/50'
  };
  
  const sizeStyles = {
    xs: 'text-xs px-2.5 py-1.5',
    sm: 'text-sm px-3 py-2',
    md: 'text-sm px-6 py-2',
    lg: 'text-base px-8 py-3',
  };
  
  const disabledStyles = disabled ? 'opacity-50 cursor-not-allowed transform-none' : 'cursor-pointer';
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