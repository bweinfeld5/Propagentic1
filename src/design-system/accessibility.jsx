/**
 * Accessibility Utilities for WCAG 2.1 AA Compliance
 * PropAgentic Design System
 */

import React, { useRef, useEffect, useCallback, useState } from 'react';
import { accessibility } from './tokens';

// ==============================================
// KEYBOARD NAVIGATION UTILITIES
// ==============================================

/**
 * Enhanced keyboard navigation hook with comprehensive key handling
 */
export const useKeyboardNavigation = (options = {}) => {
  const {
    onEnter,
    onSpace,
    onEscape,
    onArrowUp,
    onArrowDown,
    onArrowLeft,
    onArrowRight,
    onTab,
    onShiftTab,
    enabled = true,
    preventDefault = true,
    stopPropagation = false
  } = options;

  const handleKeyDown = useCallback((event) => {
    if (!enabled) return;

    const { key, shiftKey, metaKey, ctrlKey } = event;

    // Prevent default behavior if specified
    if (preventDefault) {
      event.preventDefault();
    }

    if (stopPropagation) {
      event.stopPropagation();
    }

    switch (key) {
      case 'Enter':
        onEnter?.(event);
        break;
      case ' ':
      case 'Space':
        onSpace?.(event);
        break;
      case 'Escape':
        onEscape?.(event);
        break;
      case 'ArrowUp':
        onArrowUp?.(event);
        break;
      case 'ArrowDown':
        onArrowDown?.(event);
        break;
      case 'ArrowLeft':
        onArrowLeft?.(event);
        break;
      case 'ArrowRight':
        onArrowRight?.(event);
        break;
      case 'Tab':
        if (shiftKey) {
          onShiftTab?.(event);
        } else {
          onTab?.(event);
        }
        break;
      default:
        break;
    }
  }, [
    enabled,
    preventDefault,
    stopPropagation,
    onEnter,
    onSpace,
    onEscape,
    onArrowUp,
    onArrowDown,
    onArrowLeft,
    onArrowRight,
    onTab,
    onShiftTab
  ]);

  return { handleKeyDown };
};

// ==============================================
// FOCUS MANAGEMENT
// ==============================================

/**
 * Advanced focus management hook with focus trapping and restoration
 */
export const useFocusManagement = (options = {}) => {
  const {
    autoFocus = false,
    restoreFocus = true,
    trapFocus = false,
    focusableSelectors = [
      'button:not([disabled])',
      'input:not([disabled])',
      'select:not([disabled])',
      'textarea:not([disabled])',
      'a[href]',
      '[tabindex]:not([tabindex="-1"])',
      '[contenteditable="true"]'
    ]
  } = options;

  const containerRef = useRef(null);
  const previousActiveElement = useRef(null);
  const [focusedIndex, setFocusedIndex] = useState(0);

  // Get all focusable elements within container
  const getFocusableElements = useCallback(() => {
    if (!containerRef.current) return [];
    
    const selector = focusableSelectors.join(', ');
    return Array.from(containerRef.current.querySelectorAll(selector))
      .filter(element => {
        // Additional checks for visibility and accessibility
        const style = window.getComputedStyle(element);
        return style.display !== 'none' && 
               style.visibility !== 'hidden' && 
               !element.hasAttribute('aria-hidden');
      });
  }, [focusableSelectors]);

  // Focus first element
  const focusFirst = useCallback(() => {
    const focusableElements = getFocusableElements();
    if (focusableElements.length > 0) {
      focusableElements[0].focus();
      setFocusedIndex(0);
    }
  }, [getFocusableElements]);

  // Focus last element
  const focusLast = useCallback(() => {
    const focusableElements = getFocusableElements();
    if (focusableElements.length > 0) {
      const lastIndex = focusableElements.length - 1;
      focusableElements[lastIndex].focus();
      setFocusedIndex(lastIndex);
    }
  }, [getFocusableElements]);

  // Focus next element
  const focusNext = useCallback(() => {
    const focusableElements = getFocusableElements();
    if (focusableElements.length > 0) {
      const nextIndex = (focusedIndex + 1) % focusableElements.length;
      focusableElements[nextIndex].focus();
      setFocusedIndex(nextIndex);
    }
  }, [getFocusableElements, focusedIndex]);

  // Focus previous element
  const focusPrevious = useCallback(() => {
    const focusableElements = getFocusableElements();
    if (focusableElements.length > 0) {
      const prevIndex = focusedIndex === 0 ? focusableElements.length - 1 : focusedIndex - 1;
      focusableElements[prevIndex].focus();
      setFocusedIndex(prevIndex);
    }
  }, [getFocusableElements, focusedIndex]);

  // Handle focus trap
  const handleFocusTrap = useCallback((event) => {
    if (!trapFocus) return;

    const focusableElements = getFocusableElements();
    if (focusableElements.length === 0) return;

    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    if (event.shiftKey && event.target === firstElement) {
      event.preventDefault();
      lastElement.focus();
    } else if (!event.shiftKey && event.target === lastElement) {
      event.preventDefault();
      firstElement.focus();
    }
  }, [trapFocus, getFocusableElements]);

  // Setup focus management
  useEffect(() => {
    if (autoFocus) {
      previousActiveElement.current = document.activeElement;
      focusFirst();
    }

    if (trapFocus) {
      document.addEventListener('keydown', handleFocusTrap);
    }

    return () => {
      if (trapFocus) {
        document.removeEventListener('keydown', handleFocusTrap);
      }

      if (restoreFocus && previousActiveElement.current) {
        previousActiveElement.current.focus();
      }
    };
  }, [autoFocus, trapFocus, restoreFocus, focusFirst, handleFocusTrap]);

  return {
    containerRef,
    focusFirst,
    focusLast,
    focusNext,
    focusPrevious,
    getFocusableElements,
    focusedIndex
  };
};

// ==============================================
// SCREEN READER UTILITIES
// ==============================================

/**
 * Screen reader announcements hook
 */
export const useScreenReader = () => {
  const [announcements, setAnnouncements] = useState([]);

  const announce = useCallback((message, priority = 'polite') => {
    const id = Date.now() + Math.random();
    const announcement = {
      id,
      message,
      priority,
      timestamp: Date.now()
    };

    setAnnouncements(prev => [...prev, announcement]);

    // Cleanup old announcements
    setTimeout(() => {
      setAnnouncements(prev => prev.filter(a => a.id !== id));
    }, 5000);
  }, []);

  return { announce, announcements };
};

/**
 * Visually hidden component for screen reader users
 */
export const ScreenReaderOnly = ({ children, as: Component = 'span', ...props }) => (
  <Component 
    style={{
      position: 'absolute',
      width: '1px',
      height: '1px',
      padding: '0',
      margin: '-1px',
      overflow: 'hidden',
      clip: 'rect(0, 0, 0, 0)',
      whiteSpace: 'nowrap',
      border: '0',
    }}
    {...props}
  >
    {children}
  </Component>
);

/**
 * ARIA live region for dynamic content announcements
 */
export const LiveRegion = ({ children, priority = 'polite', atomic = false, relevant = 'additions text' }) => (
  <div
    aria-live={priority}
    aria-atomic={atomic}
    aria-relevant={relevant}
    style={{
      position: 'absolute',
      width: '1px',
      height: '1px',
      padding: '0',
      margin: '-1px',
      overflow: 'hidden',
      clip: 'rect(0, 0, 0, 0)',
      whiteSpace: 'nowrap',
      border: '0',
    }}
  >
    {children}
  </div>
);


// ==============================================
// ARIA ATTRIBUTES
// ==============================================

/**
 * Utility to generate common ARIA attributes
 */
export const getAriaAttributes = (options = {}) => {
  const {
    label,
    labelledby,
    describedby,
    role,
    hidden,
    expanded,
    haspopup,
    invalid,
    required,
    checked,
    pressed,
    selected,
    level,
    valuemin,
    valuemax,
    valuenow,
    valuetext,
    controls,
    owns,
    activedescendant
  } = options;

  const attributes = {};

  if (label) attributes['aria-label'] = label;
  if (labelledby) attributes['aria-labelledby'] = labelledby;
  if (describedby) attributes['aria-describedby'] = describedby;
  if (role) attributes.role = role;
  if (hidden !== undefined) attributes['aria-hidden'] = hidden;
  if (expanded !== undefined) attributes['aria-expanded'] = expanded;
  if (haspopup !== undefined) attributes['aria-haspopup'] = haspopup;
  if (invalid !== undefined) attributes['aria-invalid'] = invalid;
  if (required !== undefined) attributes['aria-required'] = required;
  if (checked !== undefined) attributes['aria-checked'] = checked;
  if (pressed !== undefined) attributes['aria-pressed'] = pressed;
  if (selected !== undefined) attributes['aria-selected'] = selected;
  if (level) attributes['aria-level'] = level;
  if (valuemin) attributes['aria-valuemin'] = valuemin;
  if (valuemax) attributes['aria-valuemax'] = valuemax;
  if (valuenow) attributes['aria-valuenow'] = valuenow;
  if (valuetext) attributes['aria-valuetext'] = valuetext;
  if (controls) attributes['aria-controls'] = controls;
  if (owns) attributes['aria-owns'] = owns;
  if (activedescendant) attributes['aria-activedescendant'] = activedescendant;

  return attributes;
};

// ==============================================
// VISUAL ACCESSIBILITY
// ==============================================

/**
 * Focus ring component for consistent focus indicators
 */
export const FocusRing = ({ 
  children, 
  variant = 'default',
  visible = true,
  className = '',
  ...props 
}) => {
  const ringClasses = {
    default: `focus:ring-2 focus:ring-offset-2 ${accessibility.focusRing.color.default} ${accessibility.focusRing.width}`,
    error: `focus:ring-2 focus:ring-offset-2 ${accessibility.focusRing.color.error} ${accessibility.focusRing.width}`,
    success: `focus:ring-2 focus:ring-offset-2 ${accessibility.focusRing.color.success} ${accessibility.focusRing.width}`,
  };

  return React.cloneElement(children, {
    className: `${children.props.className || ''} ${visible ? ringClasses[variant] : 'focus:outline-none'} ${className}`,
    ...props
  });
};

/**
 * Skip navigation link for keyboard users
 */
export const SkipLink = ({ href = '#main', children = 'Skip to main content', className = '' }) => (
  <a
    href={href}
    className={`
      absolute -top-40 left-0
      z-50 p-3 bg-white text-blue-600
      transition-transform transform
      focus:top-0
      ${className}
    `}
  >
    {children}
  </a>
);

/**
 * Hook to detect high contrast mode
 */
export const useHighContrastMode = () => {
  const [isHighContrast, setIsHighContrast] = useState(false);

  useEffect(() => {
    // Check for Windows High Contrast mode
    const mediaQuery = window.matchMedia('(forced-colors: active)');
    setIsHighContrast(mediaQuery.matches);
    
    const handleChange = (e) => setIsHighContrast(e.matches);
    mediaQuery.addEventListener('change', handleChange);
    
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);
  
  return isHighContrast;
};

/**
 * Hook to detect reduced motion preference
 */
export const useReducedMotion = () => {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);
    
    const handleChange = (e) => setPrefersReducedMotion(e.matches);
    mediaQuery.addEventListener('change', handleChange);
    
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  return prefersReducedMotion;
};


// ==============================================
// ACCESSIBILITY PROVIDER & CONTEXT
// ==============================================

const AccessibilityContext = React.createContext({
  isHighContrast: false,
  prefersReducedMotion: false,
  announce: () => {},
});

/**
 * Provider for accessibility context
 */
export const AccessibilityProvider = ({ children }) => {
  const isHighContrast = useHighContrastMode();
  const prefersReducedMotion = useReducedMotion();
  const { announce, announcements } = useScreenReader();

  const value = {
    isHighContrast,
    prefersReducedMotion,
    announce,
  };

  return (
    <AccessibilityContext.Provider value={value}>
      {children}
      
      {/* Live regions for screen reader announcements */}
      <LiveRegion priority="polite">
        {announcements
          .filter(a => a.priority === 'polite')
          .map(a => <div key={a.id}>{a.message}</div>)
        }
      </LiveRegion>
      
      <LiveRegion priority="assertive">
        {announcements
          .filter(a => a.priority === 'assertive')
          .map(a => <div key={a.id}>{a.message}</div>)
        }
      </LiveRegion>
    </AccessibilityContext.Provider>
  );
};

/**
 * Hook to consume accessibility context
 */
export const useAccessibility = () => {
  const context = React.useContext(AccessibilityContext);
  if (!context) {
    throw new Error('useAccessibility must be used within an AccessibilityProvider');
  }
  return context;
};


// ==============================================
// SEMANTIC HTML & LANDMARKS
// ==============================================

/**
 * Semantic main landmark component
 */
export const Main = (props) => (
  <main id="main" tabIndex="-1" {...props} />
);

/**
 * Semantic section component
 */
export const Section = ({ labelledby, children, ...props }) => (
  <section aria-labelledby={labelledby} {...props}>
    {children}
  </section>
);

/**
 * Semantic nav landmark component
 */
export const Nav = ({ label, children, ...props }) => (
  <nav aria-label={label} {...props}>
    {children}
  </nav>
);

/**
 * Semantic header landmark component
 */
export const Header = (props) => (
  <header {...props} />
);

/**
 * Semantic footer landmark component
 */
export const Footer = (props) => (
  <footer {...props} />
);

// Default export of all utilities
export default {
  useKeyboardNavigation,
  useFocusManagement,
  useScreenReader,
  useHighContrastMode,
  useReducedMotion,
  useAccessibility,
  AccessibilityProvider,
  ScreenReaderOnly,
  LiveRegion,
  getAriaAttributes,
  FocusRing,
  SkipLink,
  Main,
  Section,
  Nav,
  Header,
  Footer,
}; 