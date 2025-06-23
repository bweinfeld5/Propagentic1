import React, { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import { useBreakpoint } from '../../design-system';

// Touch utility functions
const getTouchTargetSize = (isMobile) => isMobile ? '48px' : '44px';
const getInteractionDelay = (isMobile) => isMobile ? 150 : 0;

// Haptic feedback utility
const triggerHapticFeedback = (type = 'light') => {
  if ('vibrate' in navigator) {
    const patterns = {
      light: 10,
      medium: 20,
      heavy: 50,
      success: [10, 50, 10],
      error: [20, 100, 20],
      warning: [50, 50, 50]
    };
    navigator.vibrate(patterns[type] || patterns.light);
  }
};

// Touch-friendly button with proper sizing and haptic feedback
export const TouchButton = ({ 
  children, 
  size = 'auto',
  haptic = false,
  hapticType = 'light',
  variant = 'default',
  disabled = false,
  loading = false,
  className = '',
  style = {},
  ...props 
}) => {
  const { isMobile } = useBreakpoint();
  const [isPressed, setIsPressed] = useState(false);
  
  const minSize = getTouchTargetSize(isMobile);
  const interactionDelay = getInteractionDelay(isMobile);
  
  const handleTouchStart = useCallback(() => {
    if (disabled || loading) return;
    setIsPressed(true);
    
    if (haptic) {
      triggerHapticFeedback(hapticType);
    }
  }, [disabled, loading, haptic, hapticType]);
  
  const handleTouchEnd = useCallback(() => {
    setIsPressed(false);
  }, []);
  
  const handleClick = useCallback((e) => {
    if (disabled || loading) {
      e.preventDefault();
      return;
    }
    
    // Add slight delay for mobile touch feedback
    if (isMobile && interactionDelay > 0) {
      setTimeout(() => {
        props.onClick?.(e);
      }, interactionDelay);
    } else {
      props.onClick?.(e);
    }
  }, [disabled, loading, isMobile, interactionDelay, props.onClick]);
  
  const baseClasses = useMemo(() => {
    const variants = {
      default: 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 active:bg-gray-100',
      primary: 'bg-blue-600 border border-blue-600 text-white hover:bg-blue-700 active:bg-blue-800',
      secondary: 'bg-gray-600 border border-gray-600 text-white hover:bg-gray-700 active:bg-gray-800',
      success: 'bg-green-600 border border-green-600 text-white hover:bg-green-700 active:bg-green-800',
      danger: 'bg-red-600 border border-red-600 text-white hover:bg-red-700 active:bg-red-800',
      ghost: 'bg-transparent border border-transparent text-gray-700 hover:bg-gray-100 active:bg-gray-200'
    };
    
    return `
      inline-flex items-center justify-center
      font-medium rounded-lg
      transition-all duration-200 ease-in-out
      focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
      disabled:opacity-50 disabled:cursor-not-allowed
      select-none touch-manipulation
      ${variants[variant] || variants.default}
      ${isPressed ? 'transform scale-95' : ''}
      ${isMobile ? 'active:scale-95' : ''}
    `.trim();
  }, [variant, isPressed, isMobile]);
  
  const sizeClasses = useMemo(() => {
    const sizes = {
      xs: 'px-2 py-1 text-xs',
      sm: 'px-3 py-1.5 text-sm',
      md: 'px-4 py-2 text-sm',
      lg: 'px-6 py-3 text-base',
      xl: 'px-8 py-4 text-lg'
    };
    
    return sizes[size] || sizes.md;
  }, [size]);
  
  const buttonStyle = {
    minHeight: minSize,
    minWidth: minSize,
    ...style
  };
  
  return (
    <button
      {...props}
      onClick={handleClick}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      disabled={disabled || loading}
      className={`${baseClasses} ${sizeClasses} ${className}`}
      style={buttonStyle}
      data-touch-optimized="true"
      aria-busy={loading}
    >
      {loading ? (
        <div className="flex items-center space-x-2">
          <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
          <span>Loading...</span>
        </div>
      ) : (
        children
      )}
    </button>
  );
};

// Swipe-enabled list item with configurable actions
export const SwipeableListItem = ({ 
  children, 
  onSwipeLeft, 
  onSwipeRight,
  leftActions,
  rightActions,
  threshold = 80,
  haptic = true,
  className = '',
  ...props 
}) => {
  const [swipeState, setSwipeState] = useState({
    isDragging: false,
    startX: 0,
    currentX: 0,
    direction: null
  });
  
  const itemRef = useRef(null);
  const { isMobile } = useBreakpoint();
  
  const handleTouchStart = useCallback((e) => {
    if (!isMobile) return;
    
    const touch = e.touches[0];
    setSwipeState({
      isDragging: true,
      startX: touch.clientX,
      currentX: touch.clientX,
      direction: null
    });
  }, [isMobile]);
  
  const handleTouchMove = useCallback((e) => {
    if (!swipeState.isDragging) return;
    
    const touch = e.touches[0];
    const deltaX = touch.clientX - swipeState.startX;
    const direction = deltaX > 0 ? 'right' : 'left';
    
    setSwipeState(prev => ({
      ...prev,
      currentX: touch.clientX,
      direction
    }));
    
    // Apply transform based on swipe distance
    if (itemRef.current) {
      const maxSwipe = Math.min(Math.abs(deltaX), threshold * 1.5);
      const clampedDelta = deltaX > 0 ? maxSwipe : -maxSwipe;
      itemRef.current.style.transform = `translateX(${clampedDelta}px)`;
    }
  }, [swipeState.isDragging, swipeState.startX, threshold]);
  
  const handleTouchEnd = useCallback(() => {
    if (!swipeState.isDragging) return;
    
    const deltaX = swipeState.currentX - swipeState.startX;
    const absDistance = Math.abs(deltaX);
    
    if (absDistance >= threshold) {
      // Trigger haptic feedback for successful swipe
      if (haptic) {
        triggerHapticFeedback('medium');
      }
      
      // Execute swipe action
      if (deltaX > 0 && onSwipeRight) {
        onSwipeRight();
      } else if (deltaX < 0 && onSwipeLeft) {
        onSwipeLeft();
      }
    }
    
    // Reset position
    if (itemRef.current) {
      itemRef.current.style.transform = 'translateX(0)';
    }
    
    setSwipeState({
      isDragging: false,
      startX: 0,
      currentX: 0,
      direction: null
    });
  }, [swipeState, threshold, haptic, onSwipeLeft, onSwipeRight]);
  
  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (itemRef.current) {
        itemRef.current.style.transform = 'translateX(0)';
      }
    };
  }, []);
  
  return (
    <div 
      className={`relative overflow-hidden ${className}`}
      {...props}
    >
      {/* Left actions */}
      {leftActions && (
        <div className="absolute left-0 top-0 h-full flex items-center px-4 bg-green-500 text-white">
          {leftActions}
        </div>
      )}
      
      {/* Right actions */}
      {rightActions && (
        <div className="absolute right-0 top-0 h-full flex items-center px-4 bg-red-500 text-white">
          {rightActions}
        </div>
      )}
      
      {/* Main content */}
      <div 
        ref={itemRef}
        className={`
          relative bg-white border-b border-gray-200 
          transition-transform duration-200 ease-out
          ${swipeState.isDragging ? 'cursor-grabbing' : 'cursor-grab'}
          ${isMobile ? 'touch-pan-y' : ''}
        `}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        style={{
          touchAction: 'pan-y' // Allow vertical scrolling but not horizontal
        }}
      >
        {children}
      </div>
      
      {/* Swipe indicators */}
      {isMobile && swipeState.isDragging && (
        <div className="absolute top-1/2 transform -translate-y-1/2 pointer-events-none">
          {swipeState.direction === 'right' && leftActions && (
            <div className="left-4 text-green-500">
              ← Swipe
            </div>
          )}
          {swipeState.direction === 'left' && rightActions && (
            <div className="right-4 text-red-500">
              Swipe →
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// Touch-optimized input field with better mobile UX
export const TouchInput = ({
  type = 'text',
  placeholder,
  value,
  onChange,
  onFocus,
  onBlur,
  disabled = false,
  error = false,
  helpText,
  icon,
  clearable = false,
  className = '',
  ...props
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const [internalValue, setInternalValue] = useState(value || '');
  const { isMobile } = useBreakpoint();
  const inputRef = useRef(null);
  
  const handleFocus = useCallback((e) => {
    setIsFocused(true);
    onFocus?.(e);
    
    // On mobile, scroll input into view
    if (isMobile && inputRef.current) {
      setTimeout(() => {
        inputRef.current.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'center' 
        });
      }, 300); // Wait for keyboard animation
    }
  }, [isMobile, onFocus]);
  
  const handleBlur = useCallback((e) => {
    setIsFocused(false);
    onBlur?.(e);
  }, [onBlur]);
  
  const handleChange = useCallback((e) => {
    const newValue = e.target.value;
    setInternalValue(newValue);
    onChange?.(e);
  }, [onChange]);
  
  const handleClear = useCallback(() => {
    setInternalValue('');
    if (inputRef.current) {
      inputRef.current.focus();
    }
    onChange?.({ target: { value: '' } });
  }, [onChange]);
  
  const inputClasses = useMemo(() => {
    return `
      w-full px-4 py-3 text-base
      bg-white border rounded-lg
      transition-all duration-200 ease-in-out
      placeholder-gray-400
      focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
      disabled:bg-gray-50 disabled:cursor-not-allowed
      ${error ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : 'border-gray-300'}
      ${icon ? 'pl-12' : ''}
      ${clearable && internalValue ? 'pr-12' : ''}
      ${isMobile ? 'text-16px' : ''} /* Prevent zoom on iOS */
    `.trim();
  }, [error, icon, clearable, internalValue, isMobile]);
  
  return (
    <div className={`relative ${className}`}>
      {/* Icon */}
      {icon && (
        <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
          {icon}
        </div>
      )}
      
      {/* Input */}
      <input
        ref={inputRef}
        type={type}
        placeholder={placeholder}
        value={value !== undefined ? value : internalValue}
        onChange={handleChange}
        onFocus={handleFocus}
        onBlur={handleBlur}
        disabled={disabled}
        className={inputClasses}
        style={{
          fontSize: isMobile ? '16px' : '14px', // Prevent iOS zoom
          minHeight: getTouchTargetSize(isMobile)
        }}
        autoComplete={type === 'email' ? 'email' : 'off'}
        autoCapitalize="none"
        autoCorrect="off"
        spellCheck="false"
        {...props}
      />
      
      {/* Clear button */}
      {clearable && internalValue && (
        <TouchButton
          variant="ghost"
          size="xs"
          onClick={handleClear}
          className="absolute right-2 top-1/2 transform -translate-y-1/2 p-1"
          aria-label="Clear input"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </TouchButton>
      )}
      
      {/* Help text */}
      {helpText && (
        <p className={`mt-1 text-sm ${error ? 'text-red-600' : 'text-gray-500'}`}>
          {helpText}
        </p>
      )}
    </div>
  );
};

// Pull-to-refresh container
export const PullToRefresh = ({
  children,
  onRefresh,
  refreshing = false,
  threshold = 80,
  className = '',
  ...props
}) => {
  const [pullState, setPullState] = useState({
    isPulling: false,
    pullDistance: 0,
    canRefresh: false
  });
  
  const containerRef = useRef(null);
  const { isMobile } = useBreakpoint();
  
  const handleTouchStart = useCallback((e) => {
    if (!isMobile || window.scrollY > 0) return;
    
    const touch = e.touches[0];
    setPullState(prev => ({
      ...prev,
      isPulling: true,
      startY: touch.clientY
    }));
  }, [isMobile]);
  
  const handleTouchMove = useCallback((e) => {
    if (!pullState.isPulling || window.scrollY > 0) return;
    
    const touch = e.touches[0];
    const pullDistance = Math.max(0, touch.clientY - pullState.startY);
    const canRefresh = pullDistance >= threshold;
    
    setPullState(prev => ({
      ...prev,
      pullDistance,
      canRefresh
    }));
    
    // Prevent default scrolling when pulling
    if (pullDistance > 0) {
      e.preventDefault();
    }
  }, [pullState.isPulling, pullState.startY, threshold]);
  
  const handleTouchEnd = useCallback(() => {
    if (!pullState.isPulling) return;
    
    if (pullState.canRefresh && !refreshing) {
      triggerHapticFeedback('medium');
      onRefresh?.();
    }
    
    setPullState({
      isPulling: false,
      pullDistance: 0,
      canRefresh: false
    });
  }, [pullState.isPulling, pullState.canRefresh, refreshing, onRefresh]);
  
  const pullIndicatorStyle = useMemo(() => {
    const opacity = Math.min(pullState.pullDistance / threshold, 1);
    const scale = Math.min(pullState.pullDistance / threshold, 1);
    
    return {
      transform: `translateY(${Math.min(pullState.pullDistance * 0.5, threshold * 0.5)}px) scale(${scale})`,
      opacity
    };
  }, [pullState.pullDistance, threshold]);
  
  return (
    <div 
      ref={containerRef}
      className={`relative ${className}`}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      {...props}
    >
      {/* Pull indicator */}
      {isMobile && (pullState.isPulling || refreshing) && (
        <div 
          className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-full flex items-center justify-center w-12 h-12 text-blue-500"
          style={pullIndicatorStyle}
        >
          {refreshing ? (
            <div className="w-6 h-6 border-2 border-current border-t-transparent rounded-full animate-spin" />
          ) : (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          )}
        </div>
      )}
      
      {children}
    </div>
  );
};

export default {
  TouchButton,
  SwipeableListItem,
  TouchInput,
  PullToRefresh
}; 