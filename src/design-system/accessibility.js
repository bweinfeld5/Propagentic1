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

    // Remove announcement after it's been read
    setTimeout(() => {
      setAnnouncements(prev => prev.filter(a => a.id !== id));
    }, 3000);
  }, []);

  const clearAnnouncements = useCallback(() => {
    setAnnouncements([]);
  }, []);

  return {
    announce,
    clearAnnouncements,
    announcements
  };
};

/**
 * Screen reader only text component
 */
export const ScreenReaderOnly = ({ children, as: Component = 'span', ...props }) => (
  <Component
    className="sr-only"
    {...props}
  >
    {children}
  </Component>
);

/**
 * Live region component for screen reader announcements
 */
export const LiveRegion = ({ children, priority = 'polite', atomic = false, relevant = 'additions text' }) => (
  <div
    aria-live={priority}
    aria-atomic={atomic}
    aria-relevant={relevant}
    className="sr-only"
  >
    {children}
  </div>
);

// ==============================================
// ARIA UTILITIES
// ==============================================

/**
 * Enhanced ARIA attributes generator
 */
export const getAriaAttributes = (options = {}) => {
  const {
    label,
    labelledBy,
    describedBy,
    expanded,
    selected,
    checked,
    pressed,
    current,
    disabled,
    required,
    invalid,
    hasPopup,
    controls,
    owns,
    hidden,
    live,
    atomic,
    relevant,
    level,
    setSize,
    posInSet,
    role,
    valueMin,
    valueMax,
    valueNow,
    valueText
  } = options;

  const attributes = {};

  // Basic labeling
  if (label) attributes['aria-label'] = label;
  if (labelledBy) attributes['aria-labelledby'] = labelledBy;
  if (describedBy) attributes['aria-describedby'] = describedBy;

  // States
  if (typeof expanded === 'boolean') attributes['aria-expanded'] = expanded.toString();
  if (typeof selected === 'boolean') attributes['aria-selected'] = selected.toString();
  if (typeof checked === 'boolean') attributes['aria-checked'] = checked.toString();
  if (typeof pressed === 'boolean') attributes['aria-pressed'] = pressed.toString();
  if (current) attributes['aria-current'] = current;
  if (typeof disabled === 'boolean') attributes['aria-disabled'] = disabled.toString();
  if (typeof required === 'boolean') attributes['aria-required'] = required.toString();
  if (typeof invalid === 'boolean') attributes['aria-invalid'] = invalid.toString();
  if (typeof hidden === 'boolean') attributes['aria-hidden'] = hidden.toString();

  // Relationships
  if (hasPopup) attributes['aria-haspopup'] = hasPopup;
  if (controls) attributes['aria-controls'] = controls;
  if (owns) attributes['aria-owns'] = owns;

  // Live regions
  if (live) attributes['aria-live'] = live;
  if (typeof atomic === 'boolean') attributes['aria-atomic'] = atomic.toString();
  if (relevant) attributes['aria-relevant'] = relevant;

  // Structural
  if (role) attributes.role = role;
  if (typeof level === 'number') attributes['aria-level'] = level.toString();
  if (typeof setSize === 'number') attributes['aria-setsize'] = setSize.toString();
  if (typeof posInSet === 'number') attributes['aria-posinset'] = posInSet.toString();

  // Values
  if (typeof valueMin === 'number') attributes['aria-valuemin'] = valueMin.toString();
  if (typeof valueMax === 'number') attributes['aria-valuemax'] = valueMax.toString();
  if (typeof valueNow === 'number') attributes['aria-valuenow'] = valueNow.toString();
  if (valueText) attributes['aria-valuetext'] = valueText;

  return attributes;
};

// ==============================================
// FOCUS MANAGEMENT COMPONENTS
// ==============================================

/**
 * Focus ring component with customizable styling
 */
export const FocusRing = ({ 
  children, 
  variant = 'default',
  visible = true,
  className = '',
  ...props 
}) => {
  const focusRingClasses = {
    default: `focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2`,
    strong: `focus:outline-none focus:ring-4 focus:ring-primary-500 focus:ring-offset-2`,
    subtle: `focus:outline-none focus:ring-1 focus:ring-primary-300 focus:ring-offset-1`,
    inset: `focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary-500`,
    dark: `focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-gray-900`,
    light: `focus:outline-none focus:ring-2 focus:ring-gray-900 focus:ring-offset-2 focus:ring-offset-white`,
  };

  const appliedClass = visible ? focusRingClasses[variant] || focusRingClasses.default : '';

  return (
    <div className={`${appliedClass} ${className}`} {...props}>
      {children}
    </div>
  );
};

/**
 * Skip link component for keyboard navigation
 */
export const SkipLink = ({ href = '#main', children = 'Skip to main content', className = '' }) => (
  <a
    href={href}
    className={`
      sr-only focus:not-sr-only 
      fixed top-0 left-0 z-50 
      bg-white text-black 
      px-4 py-2 
      border border-gray-300 
      rounded-br-md 
      font-medium
      transition-all duration-200
      focus:outline-none focus:ring-2 focus:ring-primary-500
      ${className}
    `}
  >
    {children}
  </a>
);

// ==============================================
// HIGH CONTRAST MODE
// ==============================================

/**
 * High contrast mode hook and component
 */
export const useHighContrastMode = () => {
  const [isHighContrast, setIsHighContrast] = useState(false);

  useEffect(() => {
    // Check for system preference
    const mediaQuery = window.matchMedia('(prefers-contrast: high)');
    setIsHighContrast(mediaQuery.matches);

    // Listen for changes
    const handleChange = (e) => setIsHighContrast(e.matches);
    mediaQuery.addEventListener('change', handleChange);

    // Check local storage preference
    const stored = localStorage.getItem('high-contrast-mode');
    if (stored !== null) {
      setIsHighContrast(stored === 'true');
    }

    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  const toggleHighContrast = useCallback(() => {
    const newValue = !isHighContrast;
    setIsHighContrast(newValue);
    localStorage.setItem('high-contrast-mode', newValue.toString());
    
    // Apply to document
    if (newValue) {
      document.documentElement.classList.add('high-contrast');
    } else {
      document.documentElement.classList.remove('high-contrast');
    }
  }, [isHighContrast]);

  return {
    isHighContrast,
    toggleHighContrast
  };
};

// ==============================================
// REDUCED MOTION SUPPORT
// ==============================================

/**
 * Reduced motion preference hook
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
// ACCESSIBILITY CONTEXT
// ==============================================

/**
 * Accessibility context provider
 */
export const AccessibilityContext = React.createContext({
  announcements: [],
  announce: () => {},
  clearAnnouncements: () => {},
  isHighContrast: false,
  toggleHighContrast: () => {},
  prefersReducedMotion: false,
  focusVisible: true
});

export const AccessibilityProvider = ({ children }) => {
  const { announcements, announce, clearAnnouncements } = useScreenReader();
  const { isHighContrast, toggleHighContrast } = useHighContrastMode();
  const prefersReducedMotion = useReducedMotion();
  const [focusVisible, setFocusVisible] = useState(true);

  const value = {
    announcements,
    announce,
    clearAnnouncements,
    isHighContrast,
    toggleHighContrast,
    prefersReducedMotion,
    focusVisible,
    setFocusVisible
  };

  return (
    <AccessibilityContext.Provider value={value}>
      {children}
      {/* Render announcements */}
      {announcements.map(announcement => (
        <LiveRegion key={announcement.id} priority={announcement.priority}>
          {announcement.message}
        </LiveRegion>
      ))}
    </AccessibilityContext.Provider>
  );
};

export const useAccessibility = () => {
  const context = React.useContext(AccessibilityContext);
  if (!context) {
    throw new Error('useAccessibility must be used within AccessibilityProvider');
  }
  return context;
};

// ==============================================
// ACCESSIBILITY TESTING UTILITIES
// ==============================================

/**
 * Accessibility testing utilities for development
 */
export const a11yTestUtils = {
  // Check for missing alt text
  checkMissingAltText: () => {
    const images = document.querySelectorAll('img:not([alt])');
    if (images.length > 0) {
      console.warn('Images missing alt text:', images);
    }
    return images;
  },

  // Check for missing form labels
  checkMissingFormLabels: () => {
    const inputs = document.querySelectorAll('input:not([aria-label]):not([aria-labelledby])');
    const unlabeled = Array.from(inputs).filter(input => {
      const id = input.getAttribute('id');
      return !id || !document.querySelector(`label[for="${id}"]`);
    });
    
    if (unlabeled.length > 0) {
      console.warn('Form inputs missing labels:', unlabeled);
    }
    return unlabeled;
  },

  // Check for proper heading hierarchy
  checkHeadingHierarchy: () => {
    const headings = document.querySelectorAll('h1, h2, h3, h4, h5, h6');
    const issues = [];
    let previousLevel = 0;

    headings.forEach((heading, index) => {
      const level = parseInt(heading.tagName.charAt(1));
      
      if (index === 0 && level !== 1) {
        issues.push({ element: heading, issue: 'First heading should be h1' });
      }
      
      if (level > previousLevel + 1) {
        issues.push({ element: heading, issue: `Heading level jumps from ${previousLevel} to ${level}` });
      }
      
      previousLevel = level;
    });

    if (issues.length > 0) {
      console.warn('Heading hierarchy issues:', issues);
    }
    return issues;
  },

  // Check color contrast
  checkColorContrast: () => {
    // This would require a more complex implementation
    // For now, just remind to use external tools
    console.info('Use tools like axe-core or Lighthouse for color contrast checking');
  },

  // Run all checks
  runAllChecks: () => {
    console.group('Accessibility Audit');
    a11yTestUtils.checkMissingAltText();
    a11yTestUtils.checkMissingFormLabels();
    a11yTestUtils.checkHeadingHierarchy();
    a11yTestUtils.checkColorContrast();
    console.groupEnd();
  }
};

// Export all utilities
export default {
  useKeyboardNavigation,
  useFocusManagement,
  useScreenReader,
  useHighContrastMode,
  useReducedMotion,
  useAccessibility,
  ScreenReaderOnly,
  LiveRegion,
  FocusRing,
  SkipLink,
  getAriaAttributes,
  AccessibilityProvider,
  AccessibilityContext,
  a11yTestUtils
}; 