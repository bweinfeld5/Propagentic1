import React, { useMemo } from 'react';
import { useBreakpoint, ResponsiveGrid } from '../../design-system';
import { useAuth } from '../../context/AuthContext';

// Layout patterns for different contexts
const layoutPatterns = {
  dashboard: {
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
  },
  content: {
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
  },
  cards: {
    properties: {
      mobile: 'grid-cols-1 gap-4',
      tablet: 'sm:grid-cols-2 gap-6',
      desktop: 'lg:grid-cols-3 xl:grid-cols-4 gap-6'
    },
    jobs: {
      mobile: 'grid-cols-1 gap-4',
      tablet: 'sm:grid-cols-1 md:grid-cols-2 gap-6',
      desktop: 'lg:grid-cols-2 xl:grid-cols-3 gap-6'
    },
    stats: {
      mobile: 'grid-cols-2 gap-4',
      tablet: 'sm:grid-cols-2 md:grid-cols-4 gap-6',
      desktop: 'lg:grid-cols-4 xl:grid-cols-6 gap-6'
    }
  }
};

// Progressive disclosure patterns based on screen size and role
const progressiveDisclosure = {
  mobile: {
    high: ['critical-stats', 'urgent-items'],
    medium: ['recent-activity'],
    low: []
  },
  tablet: {
    high: ['critical-stats', 'urgent-items', 'recent-activity'],
    medium: ['secondary-stats', 'communication'],
    low: ['detailed-analytics']
  },
  desktop: {
    high: ['critical-stats', 'urgent-items', 'recent-activity', 'secondary-stats'],
    medium: ['communication', 'detailed-analytics'],
    low: ['advanced-features']
  }
};

export const AdaptiveGrid = ({ 
  children, 
  pattern = 'dashboard',
  variant = 'default',
  priority = 'high',
  className = '',
  spacing = 'standard',
  role: propRole,
  ...props 
}) => {
  const { userProfile } = useAuth();
  const { current: breakpoint, isMobile, isTablet, isDesktop } = useBreakpoint();
  
  // Determine user role (prop takes precedence)
  const userRole = propRole || userProfile?.userType || 'tenant';
  
  // Get layout pattern
  const layoutConfig = useMemo(() => {
    const patterns = layoutPatterns[pattern];
    if (!patterns) return layoutPatterns.content.default;
    
    const rolePattern = patterns[userRole] || patterns[variant] || patterns.default;
    if (!rolePattern) return layoutPatterns.content.default;
    
    return rolePattern;
  }, [pattern, variant, userRole]);
  
  // Get current layout classes
  const layoutClasses = useMemo(() => {
    const base = 'grid';
    
    if (isMobile) {
      return `${base} ${layoutConfig.mobile}`;
    } else if (isTablet) {
      return `${base} ${layoutConfig.tablet}`;
    } else {
      return `${base} ${layoutConfig.desktop}`;
    }
  }, [layoutConfig, isMobile, isTablet]);
  
  // Apply spacing modifications
  const spacingClasses = useMemo(() => {
    const spacingMap = {
      compact: 'gap-2 md:gap-3 lg:gap-4',
      standard: 'gap-4 md:gap-6 lg:gap-8',
      spacious: 'gap-6 md:gap-8 lg:gap-12'
    };
    
    return spacingMap[spacing] || spacingMap.standard;
  }, [spacing]);
  
  // Filter children based on progressive disclosure
  const visibleChildren = useMemo(() => {
    if (!Array.isArray(children)) return children;
    
    const disclosure = progressiveDisclosure[breakpoint] || progressiveDisclosure.desktop;
    const visibleIds = [...(disclosure.high || []), ...(disclosure.medium || [])];
    
    // If no specific filtering needed, return all children
    if (visibleIds.length === 0) return children;
    
    return children.filter((child, index) => {
      // Check if child has a data-priority attribute
      const childPriority = child?.props?.['data-priority'];
      if (childPriority) {
        return visibleIds.includes(childPriority);
      }
      
      // For unnamed children, show based on index and breakpoint
      if (isMobile) return index < 2;  // Show first 2 items on mobile
      if (isTablet) return index < 4;  // Show first 4 items on tablet
      return true; // Show all on desktop
    });
  }, [children, breakpoint, isMobile, isTablet]);
  
  return (
    <div 
      className={`${layoutClasses} ${spacingClasses} ${className}`}
      data-pattern={pattern}
      data-variant={variant}
      data-role={userRole}
      data-breakpoint={breakpoint}
      {...props}
    >
      {visibleChildren}
    </div>
  );
};

// Specialized grid components for common patterns
export const DashboardGrid = ({ children, className = '', ...props }) => (
  <AdaptiveGrid 
    pattern="dashboard" 
    className={className}
    {...props}
  >
    {children}
  </AdaptiveGrid>
);

export const ContentGrid = ({ children, sidebar = false, className = '', ...props }) => (
  <AdaptiveGrid 
    pattern="content" 
    variant={sidebar ? 'default' : 'wide'}
    className={className}
    {...props}
  >
    {children}
  </AdaptiveGrid>
);

export const CardGrid = ({ type = 'properties', children, className = '', ...props }) => (
  <AdaptiveGrid 
    pattern="cards" 
    variant={type}
    className={className}
    {...props}
  >
    {children}
  </AdaptiveGrid>
);

// Responsive container with role-based max-widths
export const AdaptiveContainer = ({ 
  children, 
  size = 'default',
  role: propRole,
  className = '',
  ...props 
}) => {
  const { userProfile } = useAuth();
  const userRole = propRole || userProfile?.userType || 'tenant';
  
  const containerClasses = useMemo(() => {
    const sizeMap = {
      sm: 'max-w-2xl',
      default: 'max-w-6xl',
      lg: 'max-w-7xl',
      full: 'max-w-none'
    };
    
    // Role-specific container sizes
    const roleMap = {
      landlord: 'lg',     // Landlords need more space for property management
      contractor: 'default', // Contractors need moderate space for job management
      tenant: 'default'   // Tenants need standard space
    };
    
    const containerSize = sizeMap[size] || sizeMap[roleMap[userRole]] || sizeMap.default;
    
    return `mx-auto w-full px-4 sm:px-6 lg:px-8 ${containerSize}`;
  }, [size, userRole]);
  
  return (
    <div 
      className={`${containerClasses} ${className}`}
      data-size={size}
      data-role={userRole}
      {...props}
    >
      {children}
    </div>
  );
};

// Widget area component with adaptive sizing
export const WidgetArea = ({ 
  children, 
  span = 'auto',
  priority = 'medium',
  className = '',
  ...props 
}) => {
  const { isMobile, isTablet } = useBreakpoint();
  
  const spanClasses = useMemo(() => {
    if (span === 'auto') {
      // Auto-sizing based on breakpoint
      if (isMobile) return 'col-span-1';
      if (isTablet) return 'col-span-1 md:col-span-2';
      return 'col-span-1 lg:col-span-6';
    }
    
    // Explicit span values
    const spanMap = {
      1: 'col-span-1',
      2: 'col-span-1 md:col-span-2',
      3: 'col-span-1 md:col-span-3',
      4: 'col-span-1 md:col-span-2 lg:col-span-4',
      6: 'col-span-1 md:col-span-3 lg:col-span-6',
      8: 'col-span-1 md:col-span-4 lg:col-span-8',
      12: 'col-span-1 md:col-span-6 lg:col-span-12',
      full: 'col-span-full'
    };
    
    return spanMap[span] || spanMap[1];
  }, [span, isMobile, isTablet]);
  
  return (
    <div 
      className={`${spanClasses} ${className}`}
      data-priority={priority}
      data-span={span}
      {...props}
    >
      {children}
    </div>
  );
};

export default AdaptiveGrid; 