/**
 * Card Component - PropAgentic UI
 * 
 * Basic card wrapper with consistent styling
 */

import React from 'react';
import PropTypes from 'prop-types';

const Card = ({ 
  children, 
  className = '', 
  padding = true,
  shadow = true,
  hover = false,
  ...props 
}) => {
  const baseClasses = 'bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700';
  const paddingClasses = padding ? 'p-6' : '';
  const shadowClasses = shadow ? 'shadow-sm' : '';
  const hoverClasses = hover ? 'hover:shadow-md transition-shadow duration-200' : '';
  
  const classes = [
    baseClasses,
    paddingClasses,
    shadowClasses,
    hoverClasses,
    className
  ].filter(Boolean).join(' ');

  return (
    <div className={classes} {...props}>
      {children}
    </div>
  );
};

Card.propTypes = {
  children: PropTypes.node.isRequired,
  className: PropTypes.string,
  padding: PropTypes.bool,
  shadow: PropTypes.bool,
  hover: PropTypes.bool
};

export default Card; 