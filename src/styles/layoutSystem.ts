// Layout System for PropAgentic
// Responsive design patterns and information architecture

export const layoutSystem = {
  // Responsive Breakpoints
  breakpoints: {
    sm: '640px',   // Mobile landscape
    md: '768px',   // Tablet
    lg: '1024px',  // Desktop
    xl: '1280px',  // Large desktop
    '2xl': '1536px' // Extra large
  },

  // Grid Systems
  grid: {
    // Main dashboard grid
    dashboard: {
      mobile: 'grid-cols-1',
      tablet: 'md:grid-cols-2',
      desktop: 'lg:grid-cols-12'
    },
    
    // Stats cards grid
    stats: {
      mobile: 'grid-cols-1',
      tablet: 'sm:grid-cols-2', 
      desktop: 'lg:grid-cols-4'
    },
    
    // Widget grid for different content types
    widgets: {
      primary: 'lg:col-span-8',    // Main content (2/3)
      secondary: 'lg:col-span-4',  // Sidebar (1/3)
      full: 'lg:col-span-12',      // Full width
      half: 'lg:col-span-6'        // Half width
    }
  },

  // Content Organization Patterns
  contentGroups: {
    // Essential information (always visible)
    critical: {
      order: 1,
      items: ['verification-status', 'stats-overview'],
      responsive: 'order-1'
    },
    
    // Primary workflow (job management)
    primary: {
      order: 2, 
      items: ['job-pipeline', 'active-jobs', 'earnings'],
      responsive: 'order-2'
    },
    
    // Secondary tools (performance, communication)
    secondary: {
      order: 3,
      items: ['performance-metrics', 'communication', 'schedule'],
      responsive: 'order-3 lg:order-2'
    },
    
    // Contextual information (notifications, quick actions)
    contextual: {
      order: 4,
      items: ['notifications', 'quick-actions'],
      responsive: 'order-2 lg:order-3'
    }
  },

  // Mobile Navigation Patterns
  navigation: {
    mobile: {
      type: 'bottom-tabs',
      maxTabs: 4,
      collapsible: true
    },
    tablet: {
      type: 'top-tabs',
      maxTabs: 6,
      scrollable: true
    },
    desktop: {
      type: 'horizontal-tabs',
      maxTabs: 8,
      persistent: true
    }
  },

  // Spacing for different screen sizes
  spacing: {
    mobile: {
      container: 'px-4 py-4',
      section: 'space-y-4',
      grid: 'gap-4'
    },
    tablet: {
      container: 'px-6 py-6', 
      section: 'space-y-6',
      grid: 'gap-6'
    },
    desktop: {
      container: 'px-8 py-8',
      section: 'space-y-8', 
      grid: 'gap-8'
    }
  },

  // Widget Layout Patterns
  widgetLayouts: {
    // Priority-based responsive layout
    priority: {
      high: 'order-1 lg:col-span-8',      // Main content area
      medium: 'order-2 lg:col-span-4',    // Sidebar
      low: 'order-3 lg:col-span-12'       // Bottom full-width
    },
    
    // Role-specific layouts
    contractor: {
      verification: 'lg:col-span-12 order-1',
      stats: 'lg:col-span-12 order-2',
      pipeline: 'lg:col-span-8 order-3',
      sidebar: 'lg:col-span-4 order-4'
    }
  },

  // Progressive Disclosure Patterns
  disclosure: {
    // Mobile-first approach - show essential info first
    mobile: {
      immediate: ['stats', 'verification-status'],
      onTap: ['job-details', 'performance-details'],
      onNavigate: ['full-job-list', 'settings']
    },
    
    // Desktop - more information visible
    desktop: {
      immediate: ['stats', 'pipeline', 'performance', 'quick-actions'],
      onDemand: ['detailed-analytics', 'full-history']
    }
  }
};

// Responsive utility functions
export const getResponsiveClasses = (
  mobile: string,
  tablet?: string, 
  desktop?: string
) => {
  let classes = mobile;
  if (tablet) classes += ` md:${tablet}`;
  if (desktop) classes += ` lg:${desktop}`;
  return classes;
};

export const getGridLayout = (
  type: keyof typeof layoutSystem.grid,
  includeGaps: boolean = true
) => {
  const grid = layoutSystem.grid[type];
  const gaps = includeGaps ? 'gap-4 md:gap-6 lg:gap-8' : '';
  
  if (typeof grid === 'object') {
    return `grid ${Object.values(grid).join(' ')} ${gaps}`.trim();
  }
  return `grid ${grid} ${gaps}`.trim();
};

export const getContentOrder = (group: keyof typeof layoutSystem.contentGroups) => {
  return layoutSystem.contentGroups[group].responsive;
};

export const getMobileSpacing = () => layoutSystem.spacing.mobile;
export const getTabletSpacing = () => layoutSystem.spacing.tablet;
export const getDesktopSpacing = () => layoutSystem.spacing.desktop;

export default layoutSystem; 