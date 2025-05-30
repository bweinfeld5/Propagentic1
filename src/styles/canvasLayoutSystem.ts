// Canvas-Inspired Layout System for PropAgentic
// Clean, spacious layouts following Canvas LMS patterns

export const canvasLayoutSystem = {
  // Canvas-style Responsive Breakpoints
  breakpoints: {
    sm: '576px',   // Mobile landscape (Canvas uses 576px)
    md: '768px',   // Tablet
    lg: '992px',   // Desktop (Canvas uses 992px)
    xl: '1200px',  // Large desktop (Canvas uses 1200px)
    '2xl': '1400px' // Extra large
  },

  // Canvas Dashboard Layout Patterns
  layouts: {
    // Canvas-style dashboard layout
    dashboard: {
      // Mobile: Single column stack
      mobile: 'grid grid-cols-1',
      // Tablet: Two column with sidebar
      tablet: 'md:grid md:grid-cols-[280px_1fr]',
      // Desktop: Three column with expanded sidebar
      desktop: 'lg:grid lg:grid-cols-[320px_1fr_280px]',
      // Gaps
      gap: 'gap-6 md:gap-8 lg:gap-10'
    },

    // Canvas course/content layout
    content: {
      // Mobile: Full width
      mobile: 'grid grid-cols-1',
      // Tablet: Content + small sidebar
      tablet: 'md:grid md:grid-cols-[1fr_260px]',
      // Desktop: Centered content with sidebars
      desktop: 'lg:grid lg:grid-cols-[240px_1fr_240px]',
      gap: 'gap-6 lg:gap-8'
    },

    // Canvas card grid layouts
    cardGrid: {
      // Course cards, job cards, etc.
      mobile: 'grid grid-cols-1',
      tablet: 'sm:grid-cols-2 md:grid-cols-2',
      desktop: 'lg:grid-cols-3 xl:grid-cols-4',
      gap: 'gap-4 sm:gap-6'
    },

    // Canvas list layout (assignments, announcements)
    list: {
      base: 'grid grid-cols-1',
      gap: 'gap-3'
    }
  },

  // Canvas Container Patterns
  containers: {
    // Page container (Canvas uses max-width with auto margins)
    page: {
      base: 'w-full max-w-7xl mx-auto',
      padding: 'px-4 sm:px-6 lg:px-8',
      spacing: 'py-6 sm:py-8 lg:py-10'
    },

    // Content container (narrower for readability)
    content: {
      base: 'w-full max-w-4xl mx-auto',
      padding: 'px-4 sm:px-6',
      spacing: 'py-4 sm:py-6'
    },

    // Card container
    card: {
      base: 'w-full',
      padding: 'p-4 sm:p-6',
      spacing: 'space-y-4'
    },

    // Sidebar container
    sidebar: {
      base: 'w-full',
      padding: 'p-4 lg:p-6',
      spacing: 'space-y-6'
    }
  },

  // Canvas Spacing Patterns
  spacing: {
    // Section spacing (between major sections)
    section: {
      mobile: 'space-y-6',
      tablet: 'sm:space-y-8',
      desktop: 'lg:space-y-10'
    },

    // Component spacing (between related components)
    component: {
      mobile: 'space-y-4',
      tablet: 'sm:space-y-6',
      desktop: 'lg:space-y-6'
    },

    // Element spacing (between small elements)
    element: {
      mobile: 'space-y-2',
      tablet: 'sm:space-y-3',
      desktop: 'lg:space-y-4'
    },

    // Canvas-style margins
    margin: {
      section: 'mb-6 sm:mb-8 lg:mb-10',
      component: 'mb-4 sm:mb-6',
      element: 'mb-2 sm:mb-3'
    },

    // Canvas-style padding
    padding: {
      page: 'p-4 sm:p-6 lg:p-8',
      section: 'p-4 sm:p-6',
      component: 'p-3 sm:p-4',
      element: 'p-2 sm:p-3'
    }
  },

  // Canvas Widget/Component Layouts
  widgets: {
    // Quick actions sidebar (Canvas navigation style)
    quickActions: {
      base: 'w-full lg:w-80',
      position: 'lg:sticky lg:top-6',
      height: 'lg:h-fit',
      order: 'order-1 lg:order-1'
    },

    // Main content area
    mainContent: {
      base: 'w-full',
      minHeight: 'min-h-[400px]',
      order: 'order-2 lg:order-2'
    },

    // Activity stream (Canvas style)
    activityStream: {
      base: 'w-full lg:w-80',
      position: 'lg:sticky lg:top-6',
      height: 'lg:h-fit lg:max-h-[80vh] lg:overflow-y-auto',
      order: 'order-3 lg:order-3'
    },

    // Stats/metrics bar
    statsBar: {
      base: 'w-full',
      layout: 'grid grid-cols-2 md:grid-cols-4 lg:grid-cols-4',
      gap: 'gap-3 sm:gap-4 lg:gap-6',
      order: 'order-1'
    }
  },

  // Canvas Navigation Patterns
  navigation: {
    // Top navigation (Canvas style)
    topNav: {
      height: 'h-14 sm:h-16',
      padding: 'px-4 sm:px-6 lg:px-8',
      background: 'bg-white border-b border-neutral-200',
      position: 'sticky top-0 z-50'
    },

    // Sidebar navigation
    sideNav: {
      width: 'w-64 lg:w-80',
      background: 'bg-neutral-50 border-r border-neutral-200',
      position: 'sticky top-0',
      height: 'h-screen',
      padding: 'p-4 lg:p-6'
    },

    // Breadcrumbs (Canvas style)
    breadcrumbs: {
      base: 'flex items-center space-x-2 text-sm',
      padding: 'py-3 px-4 sm:px-6 lg:px-8',
      background: 'bg-neutral-50 border-b border-neutral-200'
    },

    // Tab navigation
    tabs: {
      base: 'flex space-x-1 sm:space-x-4 lg:space-x-6',
      container: 'border-b border-neutral-200',
      padding: 'px-4 sm:px-6 lg:px-8'
    }
  },

  // Canvas Card Patterns
  cards: {
    // Course/job card (Canvas style)
    primary: {
      base: 'bg-white border border-neutral-200 rounded-lg shadow-sm hover:shadow-md transition-all duration-200',
      padding: 'p-4 sm:p-6',
      spacing: 'space-y-4',
      hover: 'hover:border-primary-300 hover:-translate-y-0.5'
    },

    // Dashboard widget card
    widget: {
      base: 'bg-white border border-neutral-200 rounded-lg shadow-sm',
      padding: 'p-4 sm:p-6',
      spacing: 'space-y-4',
      header: 'pb-4 border-b border-neutral-200 mb-4'
    },

    // Announcement/activity card
    activity: {
      base: 'bg-white border border-neutral-200 rounded-lg shadow-sm',
      padding: 'p-4',
      spacing: 'space-y-3',
      compact: true
    },

    // Stat/metric card
    stat: {
      base: 'bg-white border border-neutral-200 rounded-lg shadow-sm text-center',
      padding: 'p-4 sm:p-6',
      spacing: 'space-y-2'
    }
  },

  // Canvas-style Progressive Disclosure
  disclosure: {
    // Mobile-first: Essential content only
    mobile: {
      priority1: ['quick-actions', 'active-jobs'],
      priority2: ['stats', 'notifications'],
      priority3: ['performance', 'history'],
      collapsed: ['detailed-metrics', 'full-calendar']
    },

    // Tablet: More content visible
    tablet: {
      priority1: ['quick-actions', 'active-jobs', 'stats'],
      priority2: ['notifications', 'performance'],
      priority3: ['calendar', 'activity-stream'],
      collapsed: ['detailed-analytics']
    },

    // Desktop: Full layout
    desktop: {
      immediate: ['all-widgets'],
      sidebar: ['quick-actions', 'activity-stream'],
      main: ['active-jobs', 'stats', 'performance'],
      optional: ['detailed-analytics']
    }
  }
};

// Canvas Layout Utility Functions
export const getCanvasLayout = (
  type: keyof typeof canvasLayoutSystem.layouts,
  breakpoint?: 'mobile' | 'tablet' | 'desktop'
) => {
  const layout = canvasLayoutSystem.layouts[type];
  if (breakpoint && typeof layout === 'object') {
    return (layout as any)[breakpoint];
  }
  return Object.values(layout).join(' ');
};

export const getCanvasContainer = (
  type: keyof typeof canvasLayoutSystem.containers,
  includeSpacing: boolean = true
) => {
  const container = canvasLayoutSystem.containers[type];
  const baseClasses = container.base + ' ' + container.padding;
  return includeSpacing ? baseClasses + ' ' + container.spacing : baseClasses;
};

export const getCanvasSpacing = (
  type: keyof typeof canvasLayoutSystem.spacing,
  breakpoint?: 'mobile' | 'tablet' | 'desktop'
) => {
  const spacing = canvasLayoutSystem.spacing[type];
  if (breakpoint && typeof spacing === 'object') {
    return (spacing as any)[breakpoint];
  }
  return Object.values(spacing).join(' ');
};

export const getCanvasCard = (type: keyof typeof canvasLayoutSystem.cards) => {
  const card = canvasLayoutSystem.cards[type];
  return `${card.base} ${card.padding} ${card.spacing}`;
};

export const getCanvasWidget = (type: keyof typeof canvasLayoutSystem.widgets) => {
  const widget = canvasLayoutSystem.widgets[type];
  return Object.values(widget).join(' ');
};

// Responsive utility for Canvas breakpoints
export const canvasResponsive = (
  mobile: string,
  tablet?: string,
  desktop?: string,
  xl?: string
) => {
  let classes = mobile;
  if (tablet) classes += ` md:${tablet}`;
  if (desktop) classes += ` lg:${desktop}`;
  if (xl) classes += ` xl:${xl}`;
  return classes;
};

export default canvasLayoutSystem; 