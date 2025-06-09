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
  
  const directionClasses = {
    vertical: 'flex-col',
    horizontal: 'flex-row',
  };

  const alignClasses = {
    start: 'items-start',
    center: 'items-center',
    end: 'items-end',
    stretch: 'items-stretch',
    baseline: 'items-baseline',
  };

  const gapClass = `gap-${gap}`;

  return (
    <div 
      className={`flex ${directionClasses[currentDirection]} ${alignClasses[align]} ${gapClass} ${className}`}
    >
      {children}
    </div>
  );
};

/**
 * Hook to manage responsive layout state
 */
export const useResponsiveLayout = () => {
  const [layout, setLayout] = useState({
    sidebarOpen: false,
    panelOpen: false,
  });
  
  const toggleSidebar = () => {
    setLayout(prev => ({ ...prev, sidebarOpen: !prev.sidebarOpen }));
  };

  const togglePanel = () => {
    setLayout(prev => ({ ...prev, panelOpen: !prev.panelOpen }));
  };
  
  return { layout, toggleSidebar, togglePanel };
};

/**
 * Full-screen responsive layout container
 */
export const ResponsiveLayout = ({
  sidebar,
  mainContent,
  panel,
  header,
  footer,
}) => {
  const { layout, toggleSidebar, togglePanel } = useResponsiveLayout();
  const breakpoint = useBreakpoint();
  
  // Show sidebar permanently on larger screens
  const isSidebarPersistent = breakpoint.isDesktop;

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      {(isSidebarPersistent || layout.sidebarOpen) && (
        <aside 
          className={`
            ${isSidebarPersistent ? 'w-64' : 'fixed inset-y-0 left-0 w-64 z-30'}
            bg-white border-r border-gray-200 shadow-lg
          `}
        >
          {sidebar}
        </aside>
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {header && (
          <header className="bg-white border-b border-gray-200">
            {header({ toggleSidebar })}
          </header>
        )}
        
        <main className="flex-1 overflow-y-auto">
          {mainContent}
        </main>
        
        {footer && (
          <footer className="bg-white border-t border-gray-200">
            {footer}
          </footer>
        )}
      </div>

      {/* Right panel */}
      {panel && layout.panelOpen && (
        <aside className="fixed inset-y-0 right-0 w-80 bg-white border-l border-gray-200 shadow-lg z-30">
          {panel({ togglePanel })}
        </aside>
      )}
    </div>
  );
}; 