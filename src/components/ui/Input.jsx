/**
 * Input Component - PropAgentic UI
 * 
 * Basic input component with consistent styling
 */

import React from 'react';
import PropTypes from 'prop-types';

const Input = ({ 
  type = 'text',
  className = '',
  placeholder = '',
  disabled = false,
  error = false,
  ...props 
}) => {
  const baseClasses = 'block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors';
  const stateClasses = error 
    ? 'border-red-300 text-red-900 placeholder-red-300 focus:ring-red-500 focus:border-red-500' 
    : 'border-gray-300 text-gray-900 placeholder-gray-400';
  const disabledClasses = disabled ? 'bg-gray-100 text-gray-500 cursor-not-allowed' : 'bg-gray-50';
  const darkModeClasses = 'dark:bg-gray-800 dark:border-gray-600 dark:text-gray-100 dark:placeholder-gray-400 dark:focus:ring-blue-400 dark:focus:border-blue-400';
  
  const classes = [
    baseClasses,
    stateClasses,
    disabledClasses,
    darkModeClasses,
    className
  ].filter(Boolean).join(' ');

  return (
    <input
      type={type}
      className={classes}
      placeholder={placeholder}
      disabled={disabled}
      {...props}
    />
  );
};

Input.propTypes = {
  type: PropTypes.string,
  className: PropTypes.string,
  placeholder: PropTypes.string,
  disabled: PropTypes.bool,
  error: PropTypes.bool
};

export default Input; 