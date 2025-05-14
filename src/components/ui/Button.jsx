import React from 'react';
import { Link } from 'react-router-dom'; // Import Link for routing capabilities

/**
 * Button Component
 * 
 * Props:
 * - variant: 'primary', 'secondary', 'outline', 'ghost', 'danger' (default: 'primary')
 * - size: 'xs', 'sm', 'md', 'lg', 'xl' (default: 'md')
 * - children: Button content
 * - onClick: Click handler
 * - disabled: Boolean, disables the button
 * - type: 'button', 'submit', 'reset' (default: 'button')
 * - fullWidth: Boolean, makes button take full width
 * - className: Additional Tailwind classes
 * - icon: Optional React node for an icon (usually an SVG)
 * - iconPosition: 'left' or 'right' (default: 'left')
 * - to: String, if provided, renders the button as a React Router Link
 * - href: String, if provided, renders the button as a standard anchor tag
 * - as: Optional prop for custom polymorphic behavior
 */
const Button = React.forwardRef((
  {
    variant = 'primary',
    size = 'md',
    children,
    onClick,
    disabled = false,
    type = 'button',
    fullWidth = false,
    className = '',
    icon = null,
    iconPosition = 'left',
    to = null,
    href = null,
    // Explicitly capture component prop if used for polymorphism
    as = null, 
    ...props
  },
  ref
) => {

  // Base styles
  const base = `inline-flex items-center justify-center font-medium rounded-lg border focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-background-dark transition-colors duration-150 ease-in-out`;

  // Size styles
  const sizes = {
    xs: 'px-2.5 py-1.5 text-xs',
    sm: 'px-3 py-2 text-sm',
    md: 'px-4 py-2 text-sm',
    lg: 'px-4 py-2 text-base',
    xl: 'px-6 py-3 text-base'
  };

  // Variant styles (Light & Dark Mode)
  const variants = {
    primary: `bg-primary border-transparent text-white hover:bg-primary-dark focus-visible:ring-primary 
              dark:hover:bg-primary-light 
              disabled:bg-primary/50 disabled:cursor-not-allowed`,
    secondary: `bg-secondary border-transparent text-white hover:bg-secondary-dark focus-visible:ring-secondary 
                disabled:bg-secondary/50 disabled:cursor-not-allowed`,
    outline: `bg-transparent border-border dark:border-border-dark text-content dark:text-content-dark hover:bg-neutral-100 dark:hover:bg-neutral-700/50 focus-visible:ring-primary 
              disabled:opacity-50 disabled:cursor-not-allowed`,
    ghost: `bg-transparent border-transparent text-content dark:text-content-dark hover:bg-neutral-100 dark:hover:bg-neutral-700/50 focus-visible:ring-primary 
            disabled:opacity-50 disabled:cursor-not-allowed`,
    danger: `bg-danger border-transparent text-white hover:bg-red-600 dark:hover:bg-red-400 focus-visible:ring-danger 
             disabled:bg-danger/50 disabled:cursor-not-allowed`,
    // Specific variants for HeaderBar filters
    'filter-active': `bg-white dark:bg-neutral-700 border-transparent text-primary dark:text-primary-light shadow focus-visible:ring-primary`,
    'filter-inactive': `bg-primary/10 dark:bg-neutral-800/60 border-transparent text-white dark:text-neutral-300 hover:bg-primary/20 dark:hover:bg-neutral-700/80 focus-visible:ring-primary`,
    // Variants for placing buttons on dark/colored backgrounds (e.g., non-sticky header)
    'light': `bg-white border-transparent text-primary hover:bg-neutral-100 focus-visible:ring-primary 
              disabled:bg-white/70 disabled:text-primary/70 disabled:cursor-not-allowed`,
    'outline-inverse': `bg-transparent border-white/50 text-white hover:bg-white/10 focus-visible:ring-white 
                        disabled:opacity-50 disabled:cursor-not-allowed`,
    'ghost-inverse': `bg-transparent border-transparent text-white hover:bg-white/10 focus-visible:ring-white 
                      disabled:opacity-50 disabled:cursor-not-allowed`,
    // Tab variants for role selectors
    'tab-active': `bg-primary text-white border-transparent shadow-sm focus-visible:ring-primary 
                  disabled:opacity-70 disabled:cursor-not-allowed`,
    'tab-inactive': `bg-transparent text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-700/50 focus-visible:ring-primary 
                    disabled:opacity-50 disabled:cursor-not-allowed`,
  };

  // Icon margin based on position and size
  const iconMargin = size === 'xs' || size === 'sm' ? 'mr-1.5' : 'mr-2';
  const iconMarginRight = size === 'xs' || size === 'sm' ? 'ml-1.5' : 'ml-2';

  // Combine classes
  const classes = `
    ${base}
    ${sizes[size]}
    ${variants[variant]}
    ${fullWidth ? 'w-full' : ''}
    ${disabled ? 'opacity-70 cursor-not-allowed' : ''}
    ${className}
  `.trim();

  const content = (
    <>
      {icon && iconPosition === 'left' && <span className={iconMargin}>{React.cloneElement(icon, { className: icon.props.className || "w-4 h-4" })}</span>}
      {children}
      {icon && iconPosition === 'right' && <span className={iconMarginRight}>{React.cloneElement(icon, { className: icon.props.className || "w-4 h-4" })}</span>}
    </>
  );

  // Explicit conditional rendering based on props

  // Render as React Router Link if 'to' prop is provided
  if (to && !disabled) { // Ensure disabled links aren't rendered as active Links
    return (
      <Link to={to} className={classes} ref={ref} {...props}>
        {content}
      </Link>
    );
  }

  // Render as standard anchor tag if 'href' prop is provided
  if (href && !disabled) { // Ensure disabled links aren't rendered as active anchors
    return (
      <a href={href} className={classes} ref={ref} {...props}>
        {content}
      </a>
    );
  }
  
  // Handle disabled links/anchors (render as span or button with aria-disabled)
  // This prevents navigation but keeps the visual style
  if ((to || href) && disabled) {
    return (
      <span
        className={classes} // Apply disabled styles from variants
        aria-disabled="true"
        ref={ref}
        {...props} // Pass other props like aria-label
      >
        {content}
      </span>
    );
  }

  // Render as standard button (default case)
  return (
    <button
      type={type}
      className={classes}
      onClick={onClick}
      disabled={disabled}
      ref={ref}
      {...props}
    >
      {content}
    </button>
  );
});

export default Button; 