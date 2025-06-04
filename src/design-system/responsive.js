/**
 * Responsive Design Utilities
 * Mobile-first responsive helpers for PropAgentic
 */

import { useState, useEffect } from 'react';
import { breakpoints } from './tokens';

// Convert breakpoint values to numbers
const breakpointValues = Object.entries(breakpoints).reduce((acc, [key, value]) => {
  acc[key] = parseInt(value);
  return acc;
}, {});

/**
 * Hook to detect current breakpoint
 * @returns {Object} Current breakpoint information
 */
export const useBreakpoint = () => {
  const [breakpoint, setBreakpoint] = useState({
    current: 'xs',
    width: typeof window !== 'undefined' ? window.innerWidth : 0,
    isXs: true,
    isSm: false,
    isMd: false,
    isLg: false,
    isXl: false,
    is2xl: false,
    isMobile: true,
    isTablet: false,
    isDesktop: false,
  });

  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      
      const current = 
        width >= breakpointValues['2xl'] ? '2xl' :
        width >= breakpointValues.xl ? 'xl' :
        width >= breakpointValues.lg ? 'lg' :
        width >= breakpointValues.md ? 'md' :
        width >= breakpointValues.sm ? 'sm' : 'xs';

      setBreakpoint({
        current,
        width,
        isXs: width < breakpointValues.sm,
        isSm: width >= breakpointValues.sm && width < breakpointValues.md,
        isMd: width >= breakpointValues.md && width < breakpointValues.lg,
        isLg: width >= breakpointValues.lg && width < breakpointValues.xl,
        isXl: width >= breakpointValues.xl && width < breakpointValues['2xl'],
        is2xl: width >= breakpointValues['2xl'],
        isMobile: width < breakpointValues.md,
        isTablet: width >= breakpointValues.md && width < breakpointValues.lg,
        isDesktop: width >= breakpointValues.lg,
      });
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return breakpoint;
};

/**
 * Hook to check if screen matches specific breakpoint
 * @param {string} breakpoint - Breakpoint to check
 * @returns {boolean} Whether screen matches breakpoint
 */
export const useMediaQuery = (query) => {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia(query);
    setMatches(mediaQuery.matches);

    const handler = (e) => setMatches(e.matches);
    mediaQuery.addEventListener('change', handler);
    
    return () => mediaQuery.removeEventListener('change', handler);
  }, [query]);

  return matches;
};

/**
 * Generate responsive classes based on breakpoint
 * @param {Object} classes - Object with breakpoint keys and class values
 * @returns {string} Combined class string
 */
export const responsiveClasses = (classes) => {
  if (typeof classes === 'string') return classes;
  
  return Object.entries(classes)
    .map(([breakpoint, className]) => {
      if (breakpoint === 'default') return className;
      return `${breakpoint}:${className}`;
    })
    .join(' ');
};

/**
 * Responsive value helper
 * Returns appropriate value based on current breakpoint
 * @param {Object} values - Object with breakpoint keys and values
 * @param {string} currentBreakpoint - Current breakpoint
 * @returns {*} Value for current breakpoint
 */
export const responsiveValue = (values, currentBreakpoint) => {
  if (typeof values !== 'object') return values;
  
  const breakpointOrder = ['xs', 'sm', 'md', 'lg', 'xl', '2xl'];
  const currentIndex = breakpointOrder.indexOf(currentBreakpoint);
  
  // Find the closest defined value
  for (let i = currentIndex; i >= 0; i--) {
    const bp = breakpointOrder[i];
    if (values[bp] !== undefined) {
      return values[bp];
    }
  }
  
  return values.default || values.xs || null;
};

/**
 * Container component with responsive padding
 */
export const Container = ({ children, className = '', maxWidth = '2xl', padding = true }) => {
  const maxWidthClasses = {
    sm: 'max-w-screen-sm',
    md: 'max-w-screen-md',
    lg: 'max-w-screen-lg',
    xl: 'max-w-screen-xl',
    '2xl': 'max-w-screen-2xl',
    full: 'max-w-full',
  };

  const paddingClasses = padding ? 'px-4 sm:px-6 lg:px-8' : '';

  return (
    <div className={`mx-auto ${maxWidthClasses[maxWidth]} ${paddingClasses} ${className}`}>
      {children}
    </div>
  );
};

/**
 * Responsive grid component
 */
export const ResponsiveGrid = ({ 
  children, 
  cols = { xs: 1, sm: 2, md: 3, lg: 4 }, 
  gap = 4,
  className = '' 
}) => {
  const colClasses = responsiveClasses({
    default: 'grid',
    ...(typeof cols === 'object' ? {
      [`grid-cols-${cols.xs || 1}`]: true,
      sm: cols.sm ? `grid-cols-${cols.sm}` : undefined,
      md: cols.md ? `grid-cols-${cols.md}` : undefined,
      lg: cols.lg ? `grid-cols-${cols.lg}` : undefined,
      xl: cols.xl ? `grid-cols-${cols.xl}` : undefined,
    } : {
      [`grid-cols-${cols}`]: true,
    })
  });

  const gapClass = typeof gap === 'number' ? `gap-${gap}` : gap;

  return (
    <div className={`${colClasses} ${gapClass} ${className}`}>
      {children}
    </div>
  );
};

/**
 * Responsive show/hide utilities
 */
export const ShowOn = ({ breakpoint, children }) => {
  const bp = useBreakpoint();
  const breakpointOrder = ['xs', 'sm', 'md', 'lg', 'xl', '2xl'];
  const targetIndex = breakpointOrder.indexOf(breakpoint);
  const currentIndex = breakpointOrder.indexOf(bp.current);
  
  if (currentIndex >= targetIndex) {
    return children;
  }
  
  return null;
};

export const HideOn = ({ breakpoint, children }) => {
  const bp = useBreakpoint();
  const breakpointOrder = ['xs', 'sm', 'md', 'lg', 'xl', '2xl'];
  const targetIndex = breakpointOrder.indexOf(breakpoint);
  const currentIndex = breakpointOrder.indexOf(bp.current);
  
  if (currentIndex < targetIndex) {
    return children;
  }
  
  return null;
};

/**
 * Responsive text size helper
 */
export const responsiveText = {
  xs: 'text-xs sm:text-sm',
  sm: 'text-sm sm:text-base',
  base: 'text-base sm:text-lg',
  lg: 'text-lg sm:text-xl md:text-2xl',
  xl: 'text-xl sm:text-2xl md:text-3xl',
  '2xl': 'text-2xl sm:text-3xl md:text-4xl',
  '3xl': 'text-3xl sm:text-4xl md:text-5xl',
  '4xl': 'text-4xl sm:text-5xl md:text-6xl',
};

/**
 * Responsive spacing helper
 */
export const responsiveSpacing = {
  none: 'p-0',
  xs: 'p-2 sm:p-3',
  sm: 'p-3 sm:p-4',
  base: 'p-4 sm:p-6',
  lg: 'p-6 sm:p-8',
  xl: 'p-8 sm:p-10',
};

/**
 * Responsive stack component (vertical on mobile, horizontal on desktop)
 */
export const ResponsiveStack = ({ 
  children, 
  direction = { xs: 'vertical', md: 'horizontal' },
  gap = 4,
  align = 'start',
  className = '' 
}) => {
  const breakpoint = useBreakpoint();
  const currentDirection = responsiveValue(direction, breakpoint.current);
  
  const baseClasses = currentDirection === 'horizontal' 
    ? `flex flex-row items-${align} space-x-${gap}`
    : `flex flex-col space-y-${gap}`;

  return (
    <div className={`${baseClasses} ${className}`}>
      {children}
    </div>
  );
};

// Phase 3.4: Enhanced responsive utilities for mobile-first design

/**
 * Advanced responsive layout hook
 * Provides layout patterns, touch optimization, and progressive disclosure
 */
export const useResponsiveLayout = () => {
  const breakpoint = useBreakpoint();
  
  return {
    // Layout patterns
    getDashboardLayout: (userRole) => {
      const layouts = {
        landlord: {
          mobile: 'grid-cols-1 gap-4',
          tablet: 'md:grid-cols-2 gap-6', 
          desktop: 'lg:grid-cols-12 gap-8'
        },
        tenant: {
          mobile: 'grid-cols-1 gap-4',
          tablet: 'md:grid-cols-1 gap-6',
          desktop: 'lg:grid-cols-8 gap-6'
        },
        contractor: {
          mobile: 'grid-cols-1 gap-4',
          tablet: 'md:grid-cols-2 gap-6',
          desktop: 'lg:grid-cols-10 gap-8'
        }
      };
      
      const layout = layouts[userRole] || layouts.tenant;
      
      if (breakpoint.isMobile) return layout.mobile;
      if (breakpoint.isTablet) return layout.tablet;
      return layout.desktop;
    },
    
    getContentLayout: (pageType) => {
      const layouts = {
        default: {
          mobile: 'grid-cols-1 gap-4',
          tablet: 'md:grid-cols-1 gap-6',
          desktop: 'lg:grid-cols-[1fr_280px] gap-8'
        },
        wide: {
          mobile: 'grid-cols-1 gap-4',
          tablet: 'md:grid-cols-1 gap-6',
          desktop: 'lg:grid-cols-1 gap-8'
        }
      };
      
      const layout = layouts[pageType] || layouts.default;
      
      if (breakpoint.isMobile) return layout.mobile;
      if (breakpoint.isTablet) return layout.tablet;
      return layout.desktop;
    },
    
    // Progressive disclosure
    getVisibleItems: (items, priority) => {
      const disclosure = {
        mobile: { high: 2, medium: 1, low: 0 },
        tablet: { high: 4, medium: 2, low: 1 },
        desktop: { high: -1, medium: -1, low: -1 } // -1 means show all
      };
      
      const currentDevice = breakpoint.isMobile ? 'mobile' : 
                           breakpoint.isTablet ? 'tablet' : 'desktop';
      const maxItems = disclosure[currentDevice][priority];
      
      return maxItems === -1 ? items : items.slice(0, maxItems);
    },
    
    // Touch optimization
    getTouchTargetSize: () => breakpoint.isMobile ? '48px' : '44px',
    getInteractionDelay: () => breakpoint.isMobile ? 150 : 0,
    shouldUseHaptics: () => breakpoint.isMobile,
    
    // Current responsive state
    breakpoint
  };
};

// Export responsive utilities
export default {
  useBreakpoint,
  useMediaQuery,
  responsiveClasses,
  responsiveValue,
  Container,
  ResponsiveGrid,
  ShowOn,
  HideOn,
  responsiveText,
  responsiveSpacing,
  ResponsiveStack,
  // Phase 3.4 additions
  useResponsiveLayout
}; 