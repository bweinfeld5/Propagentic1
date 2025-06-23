import React from 'react';
import { canvasDesignSystem } from '../../../styles/canvasDesignSystem';
import { canvasLayoutSystem, getCanvasCard } from '../../../styles/canvasLayoutSystem';

interface CanvasCardProps {
  children: React.ReactNode;
  variant?: 'primary' | 'widget' | 'activity' | 'stat';
  className?: string;
  hover?: boolean;
  onClick?: () => void;
  header?: React.ReactNode;
  footer?: React.ReactNode;
}

const CanvasCard: React.FC<CanvasCardProps> = ({
  children,
  variant = 'primary',
  className = '',
  hover = false,
  onClick,
  header,
  footer
}) => {
  const cardStyles = getCanvasCard(variant);
  const isClickable = Boolean(onClick);
  
  // Safely access hover styles with fallback
  const cardConfig = canvasLayoutSystem.cards[variant];
  const hoverStyles = hover || isClickable 
    ? ('hover' in cardConfig ? cardConfig.hover : 'hover:shadow-lg') || 'hover:shadow-lg'
    : '';
  
  const cursorStyle = isClickable ? 'cursor-pointer' : '';

  const Component = isClickable ? 'button' : 'div';

  return (
    <Component
      onClick={onClick}
      className={`${cardStyles} ${hoverStyles} ${cursorStyle} ${className}`}
      {...(isClickable && {
        type: 'button',
        role: 'button',
        tabIndex: 0
      })}
    >
      {header && (
        <div className={'header' in cardConfig ? cardConfig.header : 'pb-4 border-b border-neutral-200 mb-4'}>
          {header}
        </div>
      )}
      
      <div className={variant === 'widget' ? '' : cardConfig.spacing}>
        {children}
      </div>
      
      {footer && (
        <div className="pt-4 border-t border-neutral-200 mt-4">
          {footer}
        </div>
      )}
    </Component>
  );
};

export default CanvasCard; 