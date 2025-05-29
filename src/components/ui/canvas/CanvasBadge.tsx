import React from 'react';
import { canvasDesignSystem, getCanvasComponent } from '../../../styles/canvasDesignSystem';

interface CanvasBadgeProps {
  children: React.ReactNode;
  variant?: 'primary' | 'success' | 'warning' | 'error' | 'neutral';
  size?: 'sm' | 'md' | 'lg';
  dot?: boolean;
  className?: string;
  icon?: React.ReactNode;
}

const CanvasBadge: React.FC<CanvasBadgeProps> = ({
  children,
  variant = 'neutral',
  size = 'md',
  dot = false,
  className = '',
  icon
}) => {
  // Get base badge styles from Canvas design system
  const baseStyles = getCanvasComponent('badge', variant);
  
  // Size styles
  const sizeStyles = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2.5 py-0.5 text-xs',
    lg: 'px-3 py-1 text-sm'
  };

  // Dot style (for notification dots)
  const dotStyles = dot ? 'w-2 h-2 p-0 rounded-full' : '';

  return (
    <span
      className={`
        ${baseStyles}
        ${sizeStyles[size]}
        ${dotStyles}
        ${className}
        inline-flex items-center
        font-medium
      `.trim().replace(/\s+/g, ' ')}
    >
      {icon && !dot && (
        <span className="mr-1 flex-shrink-0">
          {icon}
        </span>
      )}
      
      {!dot && children}
    </span>
  );
};

export default CanvasBadge; 