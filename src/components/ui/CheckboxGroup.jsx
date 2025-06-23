/**
 * CheckboxGroup Component - PropAgentic UI
 * 
 * Checkbox group component for multiple selections
 */

import React from 'react';
import PropTypes from 'prop-types';

const CheckboxGroup = ({ 
  options = [],
  value = [],
  onChange,
  name,
  className = '',
  disabled = false,
  error = false,
  ...props 
}) => {
  const handleChange = (optionValue) => {
    if (disabled) return;
    
    const newValue = value.includes(optionValue)
      ? value.filter(v => v !== optionValue)
      : [...value, optionValue];
    
    if (onChange) {
      onChange(newValue);
    }
  };

  const groupClasses = [
    'space-y-2',
    className
  ].filter(Boolean).join(' ');

  return (
    <div className={groupClasses} {...props}>
      {options.map((option, index) => {
        const optionValue = typeof option === 'string' ? option : option.value;
        const optionLabel = typeof option === 'string' ? option : option.label;
        const isChecked = value.includes(optionValue);
        
        return (
          <label
            key={optionValue || index}
            className={`flex items-center space-x-3 cursor-pointer ${
              disabled ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            <input
              type="checkbox"
              name={name}
              value={optionValue}
              checked={isChecked}
              onChange={() => handleChange(optionValue)}
              disabled={disabled}
              className={`h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 focus:ring-2 transition-colors ${
                error ? 'border-red-300 text-red-600 focus:ring-red-500' : ''
              } ${
                disabled ? 'cursor-not-allowed' : 'cursor-pointer'
              } dark:border-gray-600 dark:bg-gray-800 dark:focus:ring-blue-400`}
            />
            <span className={`text-sm ${
              error ? 'text-red-700 dark:text-red-400' : 'text-gray-700 dark:text-gray-300'
            } ${
              disabled ? 'text-gray-500 dark:text-gray-500' : ''
            }`}>
              {optionLabel}
            </span>
          </label>
        );
      })}
    </div>
  );
};

CheckboxGroup.propTypes = {
  options: PropTypes.arrayOf(
    PropTypes.oneOfType([
      PropTypes.string,
      PropTypes.shape({
        value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
        label: PropTypes.string.isRequired
      })
    ])
  ).isRequired,
  value: PropTypes.array,
  onChange: PropTypes.func,
  name: PropTypes.string,
  className: PropTypes.string,
  disabled: PropTypes.bool,
  error: PropTypes.bool
};

export default CheckboxGroup; 