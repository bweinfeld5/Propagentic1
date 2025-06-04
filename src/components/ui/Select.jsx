/**
 * Select Component - PropAgentic UI
 * 
 * Basic select component with consistent styling
 */

import React from 'react';
import PropTypes from 'prop-types';

const Select = ({ 
  children,
  className = '',
  disabled = false,
  error = false,
  placeholder = '',
  ...props 
}) => {
  const baseClasses = 'block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors';
  const stateClasses = error 
    ? 'border-red-300 text-red-900 focus:ring-red-500 focus:border-red-500' 
    : 'border-gray-300 text-gray-900';
  const disabledClasses = disabled ? 'bg-gray-50 text-gray-500 cursor-not-allowed' : 'bg-white';
  const darkModeClasses = 'dark:bg-gray-800 dark:border-gray-600 dark:text-gray-100 dark:focus:ring-blue-400 dark:focus:border-blue-400';
  
  const classes = [
    baseClasses,
    stateClasses,
    disabledClasses,
    darkModeClasses,
    className
  ].filter(Boolean).join(' ');

  return (
    <select
      className={classes}
      disabled={disabled}
      {...props}
    >
      {placeholder && (
        <option value="" disabled>
          {placeholder}
        </option>
      )}
      {children}
    </select>
  );
};

Select.propTypes = {
  children: PropTypes.node.isRequired,
  className: PropTypes.string,
  disabled: PropTypes.bool,
  error: PropTypes.bool,
  placeholder: PropTypes.string
};

export default Select; 