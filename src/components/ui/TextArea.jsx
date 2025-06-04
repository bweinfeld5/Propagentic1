/**
 * TextArea Component - PropAgentic UI
 * 
 * Basic textarea component with consistent styling
 */

import React from 'react';
import PropTypes from 'prop-types';

const TextArea = ({ 
  className = '',
  placeholder = '',
  disabled = false,
  error = false,
  rows = 4,
  resize = 'vertical',
  ...props 
}) => {
  const baseClasses = 'block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors';
  const stateClasses = error 
    ? 'border-red-300 text-red-900 placeholder-red-300 focus:ring-red-500 focus:border-red-500' 
    : 'border-gray-300 text-gray-900 placeholder-gray-400';
  const disabledClasses = disabled ? 'bg-gray-50 text-gray-500 cursor-not-allowed' : 'bg-white';
  const darkModeClasses = 'dark:bg-gray-800 dark:border-gray-600 dark:text-gray-100 dark:placeholder-gray-400 dark:focus:ring-blue-400 dark:focus:border-blue-400';
  const resizeClasses = resize === 'none' ? 'resize-none' : resize === 'horizontal' ? 'resize-x' : resize === 'both' ? 'resize' : 'resize-y';
  
  const classes = [
    baseClasses,
    stateClasses,
    disabledClasses,
    darkModeClasses,
    resizeClasses,
    className
  ].filter(Boolean).join(' ');

  return (
    <textarea
      className={classes}
      placeholder={placeholder}
      disabled={disabled}
      rows={rows}
      {...props}
    />
  );
};

TextArea.propTypes = {
  className: PropTypes.string,
  placeholder: PropTypes.string,
  disabled: PropTypes.bool,
  error: PropTypes.bool,
  rows: PropTypes.number,
  resize: PropTypes.oneOf(['none', 'horizontal', 'vertical', 'both'])
};

export default TextArea; 