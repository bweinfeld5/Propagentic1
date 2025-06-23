import React from 'react';
import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';
import Button from '../ui/Button'; // Import Button if needed, or handle interaction directly
import { SafeMotion } from "../shared/SafeMotion";

/**
 * DashboardCard Component
 * 
 * A reusable card component for dashboard interfaces with support for hover effects,
 * animations, and different color themes.
 */
const DashboardCard = ({
  title,
  value,
  icon,
  footer,
  className = '',
  theme = 'neutral', // Default to neutral
  to,
  onClick,
  isLoading = false,
  animate = true,
  delay = 0,
  growOnHover = true,
  children
}) => {

  // Define theme color classes using new semantic names
  const themeClasses = {
    primary:   'border-primary/30 bg-primary/5 dark:bg-primary/10',
    secondary: 'border-secondary/30 bg-secondary/5 dark:bg-secondary/10',
    success:   'border-success/30 bg-success-subtle dark:bg-success-darkSubtle',
    warning:   'border-warning/30 bg-warning-subtle dark:bg-warning-darkSubtle',
    danger:    'border-danger/30 bg-danger-subtle dark:bg-danger-darkSubtle',
    info:      'border-info/30 bg-info-subtle dark:bg-info-darkSubtle',
    neutral:   'border-border dark:border-border-dark bg-background dark:bg-background-darkSubtle',
  };
  
  // Icon color classes based on theme
  const iconColorClasses = {
    primary:   'text-primary dark:text-primary-light',
    secondary: 'text-secondary dark:text-secondary-light',
    success:   'text-success dark:text-emerald-400',
    warning:   'text-warning dark:text-amber-400',
    danger:    'text-danger dark:text-red-400',
    info:      'text-info dark:text-blue-400',
    neutral:   'text-content-secondary dark:text-content-darkSecondary',
  };

  // Determine if the card should be interactive
  const isInteractive = !!(to || onClick);

  // Content for the card
  const cardContent = (
    <>
      <div className="flex justify-between items-start mb-4">
        {/* Use theme text color */}
        {title && <h3 className="text-base font-medium text-content-secondary dark:text-content-darkSecondary">{title}</h3>}
        {/* Use theme icon color */}
        {icon && <span className={`${iconColorClasses[theme] || iconColorClasses.neutral}`}>{icon}</span>}
      </div>
      
      {isLoading ? (
        // Use theme loading colors
        <div className="animate-pulse h-8 bg-neutral-200 dark:bg-neutral-700 rounded-md w-2/3 mb-4"></div>
      ) : (
        // Use theme text color
        value !== undefined && value !== null && <div className="text-2xl font-bold text-content dark:text-content-dark mb-2">{value}</div>
      )}
      
      {children}
      
      {footer && (
        // Use theme border and text colors
        <div className="mt-4 pt-3 border-t border-border/50 dark:border-border-dark/50 text-sm text-content-subtle dark:text-content-darkSubtle">
          {footer}
        </div>
      )}
    </>
  );
  
  // Base classes + theme classes + interaction classes
  const combinedClassName = `
    relative rounded-xl border p-5 shadow-sm 
    ${themeClasses[theme] || themeClasses.neutral} 
    ${isInteractive ? 'cursor-pointer' : ''} 
    ${growOnHover && isInteractive ? 'transition-all duration-200 hover:shadow-md hover:border-primary/50 dark:hover:border-primary-light/50' : ''} // Updated hover border
    ${className}
  `.trim();

  // Determine root component type
  const RootComponent = to ? Link : onClick ? 'button' : 'div';
  const rootProps = {
      className: combinedClassName,
      ...(to && { to }),
      ...(onClick && { onClick, type: 'button' }),
      // Add other necessary props like disabled for button if applicable
  };

  // Return animated or non-animated version
  if (animate) {
    return (
      <SafeMotion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay }}
        whileHover={growOnHover && isInteractive ? { scale: 1.02, transition: { duration: 0.2 } } : {}}
        // Apply classes to motion.div if it's the clickable element, otherwise apply to RootComponent
        {...(RootComponent === 'div' ? { className: combinedClassName } : {})}
      >
        {/* If RootComponent is Link or button, motion.div is just a wrapper */}
        {/* If RootComponent is div, it gets combinedClassName from motion.div */} 
        {React.createElement(RootComponent, RootComponent !== 'div' ? rootProps : {}, cardContent)}
      </SafeMotion.div>
    );
  }
  
  // Non-animated version
  return React.createElement(RootComponent, rootProps, cardContent);

};

DashboardCard.propTypes = {
  title: PropTypes.node,
  value: PropTypes.node,
  icon: PropTypes.node,
  footer: PropTypes.node,
  className: PropTypes.string,
  theme: PropTypes.oneOf(['primary', 'secondary', 'success', 'warning', 'danger', 'info', 'neutral']),
  to: PropTypes.string,
  onClick: PropTypes.func,
  isLoading: PropTypes.bool,
  animate: PropTypes.bool,
  delay: PropTypes.number,
  growOnHover: PropTypes.bool,
  children: PropTypes.node
};

export default DashboardCard; 