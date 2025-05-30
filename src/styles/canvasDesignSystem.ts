// Canvas-Inspired Design System for PropAgentic
// Clean, minimal design following Canvas LMS principles

export const canvasDesignSystem = {
  // Canvas Color Palette
  colors: {
    // Primary Colors (Canvas-inspired)
    primary: {
      50: '#EEF7FF',
      100: '#D9EDFF', 
      200: '#BCDDFF',
      300: '#8FC4FF',
      400: '#5BA2FF',
      500: '#0374B5', // Canvas blue
      600: '#025A94',
      700: '#024173',
      800: '#012952',
      900: '#001A36'
    },
    
    // Success (Canvas green)
    success: {
      50: '#E6F7E6',
      100: '#B3E5B3',
      200: '#80D280',
      300: '#4DC04D',
      400: '#1AAD1A',
      500: '#00AC18', // Canvas green
      600: '#008A13',
      700: '#00690F',
      800: '#00470A',
      900: '#002605'
    },
    
    // Warning (Canvas orange)
    warning: {
      50: '#FFF4E6',
      100: '#FFE0B3',
      200: '#FFCC80',
      300: '#FFB84D',
      400: '#FFA41A',
      500: '#FC5E13', // Canvas orange
      600: '#E0520F',
      700: '#B8420C',
      800: '#8F3209',
      900: '#661F05'
    },
    
    // Error (Canvas red)
    error: {
      50: '#FDF2F2',
      100: '#FCDCDC',
      200: '#FAB8B8',
      300: '#F89494',
      400: '#F56F6F',
      500: '#EE0612', // Canvas red
      600: '#D1050F',
      700: '#A6040C',
      800: '#7A0309',
      900: '#4F0206'
    },
    
    // Neutral Grays (Canvas-style)
    neutral: {
      50: '#F8F9FA',   // Canvas light background
      100: '#E7E8EA',  // Canvas border color
      200: '#C7CDD1',  // Light borders
      300: '#A7AFB5',  // Disabled text
      400: '#8B95A0',  // Secondary text
      500: '#73818F',  // Canvas secondary text
      600: '#5B6C7A',  // Tertiary text
      700: '#445566',  // Strong text
      800: '#2D3B45',  // Canvas primary text
      900: '#1A2329'   // Darkest text
    },
    
    // Surface Colors
    surface: {
      primary: '#FFFFFF',     // Card backgrounds
      secondary: '#F8F9FA',   // Page background (Canvas style)
      accent: '#EEF7FF',      // Highlighted sections
      elevated: '#FFFFFF',    // Elevated cards
      overlay: 'rgba(45, 59, 69, 0.8)' // Modal overlays
    },
    
    // Canvas-specific UI colors
    canvas: {
      sidebar: '#2D3B45',        // Canvas sidebar color
      sidebarHover: '#445566',   // Sidebar hover
      linkBlue: '#0374B5',       // Canvas link color
      linkHover: '#025A94',      // Link hover
      borderLight: '#E7E8EA',    // Light borders
      textMuted: '#73818F'       // Muted text
    }
  },
  
  // Canvas Typography System
  typography: {
    // Font families
    fontFamily: {
      sans: ['LatoWeb', 'Lato', 'Helvetica Neue', 'Helvetica', 'Arial', 'sans-serif'],
      mono: ['Monaco', 'Menlo', 'Ubuntu Mono', 'monospace']
    },
    
    // Font sizes (Canvas-inspired scale)
    fontSize: {
      xs: '12px',     // 0.75rem - Captions, labels
      sm: '14px',     // 0.875rem - Secondary text
      base: '16px',   // 1rem - Body text
      lg: '18px',     // 1.125rem - Large body
      xl: '20px',     // 1.25rem - Subheadings
      '2xl': '24px',  // 1.5rem - Section headers
      '3xl': '28px',  // 1.75rem - Page titles
      '4xl': '32px',  // 2rem - Large headers
      '5xl': '36px'   // 2.25rem - Hero text
    },
    
    // Font weights
    fontWeight: {
      light: '300',
      normal: '400',
      medium: '500',
      semibold: '600',
      bold: '700'
    },
    
    // Line heights (Canvas-optimized)
    lineHeight: {
      tight: '1.25',    // Headlines
      normal: '1.5',    // Body text
      relaxed: '1.75',  // Captions
      loose: '2.0'      // Spacious text
    },
    
    // Letter spacing
    letterSpacing: {
      tight: '-0.025em',
      normal: '0',
      wide: '0.025em'
    }
  },
  
  // Canvas Spacing System (8px grid)
  spacing: {
    px: '1px',
    0: '0',
    1: '8px',      // xs
    2: '16px',     // sm  
    3: '24px',     // md
    4: '32px',     // lg
    5: '40px',     // xl
    6: '48px',     // 2xl
    7: '56px',     // 3xl
    8: '64px',     // 4xl
    9: '72px',     // 5xl
    10: '80px',    // 6xl
    12: '96px',    // 7xl
    16: '128px',   // 8xl
    20: '160px',   // 9xl
    24: '192px'    // 10xl
  },
  
  // Canvas Border Radius
  borderRadius: {
    none: '0',
    sm: '4px',     // Small elements
    md: '6px',     // Cards, buttons
    lg: '8px',     // Large cards
    xl: '12px',    // Panels
    '2xl': '16px', // Large panels
    full: '9999px' // Pills, avatars
  },
  
  // Canvas Shadows (subtle, clean)
  shadows: {
    none: 'none',
    sm: '0 1px 2px 0 rgba(45, 59, 69, 0.05)',
    md: '0 4px 6px -1px rgba(45, 59, 69, 0.1), 0 2px 4px -1px rgba(45, 59, 69, 0.06)',
    lg: '0 10px 15px -3px rgba(45, 59, 69, 0.1), 0 4px 6px -2px rgba(45, 59, 69, 0.05)',
    xl: '0 20px 25px -5px rgba(45, 59, 69, 0.1), 0 10px 10px -5px rgba(45, 59, 69, 0.04)',
    '2xl': '0 25px 50px -12px rgba(45, 59, 69, 0.25)',
    inner: 'inset 0 2px 4px 0 rgba(45, 59, 69, 0.06)'
  },
  
  // Canvas Component Patterns
  components: {
    // Canvas Card Style
    card: {
      base: 'bg-white border border-neutral-200 shadow-md hover:shadow-lg transition-all duration-200',
      padding: 'p-6',
      borderRadius: 'rounded-lg',
      spacing: 'space-y-4'
    },
    
    // Canvas Button Styles
    button: {
      primary: 'bg-primary-500 hover:bg-primary-600 text-white font-medium px-4 py-2 rounded-md transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2',
      secondary: 'bg-neutral-100 hover:bg-neutral-200 text-neutral-800 font-medium px-4 py-2 rounded-md transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-neutral-500 focus:ring-offset-2',
      outline: 'border border-primary-500 text-primary-600 hover:bg-primary-50 font-medium px-4 py-2 rounded-md transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2',
      ghost: 'text-neutral-600 hover:bg-neutral-100 font-medium px-4 py-2 rounded-md transition-colors duration-200',
      link: 'text-primary-500 hover:text-primary-600 font-medium underline-offset-4 hover:underline'
    },
    
    // Canvas Input Styles  
    input: {
      base: 'w-full px-3 py-2 border border-neutral-300 rounded-md shadow-sm placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors duration-200',
      error: 'border-error-500 focus:ring-error-500 focus:border-error-500',
      success: 'border-success-500 focus:ring-success-500 focus:border-success-500'
    },
    
    // Canvas Navigation
    nav: {
      item: 'flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors duration-200',
      itemActive: 'bg-primary-100 text-primary-700',
      itemInactive: 'text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900'
    },
    
    // Canvas Badges
    badge: {
      primary: 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary-100 text-primary-800',
      success: 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-success-100 text-success-800',
      warning: 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-warning-100 text-warning-800',
      error: 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-error-100 text-error-800',
      neutral: 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-neutral-100 text-neutral-800'
    }
  }
};

// Utility functions for Canvas design system
export const getCanvasColor = (
  color: keyof typeof canvasDesignSystem.colors,
  shade?: number | string
) => {
  const colorObj = canvasDesignSystem.colors[color];
  
  // Handle shade-based colors (primary, success, warning, error, neutral)
  if (typeof colorObj === 'object' && colorObj !== null && !Array.isArray(colorObj)) {
    if (shade && String(shade) in colorObj) {
      return (colorObj as Record<string, string>)[String(shade)];
    }
    // Default to 500 for shade-based colors, or return first available color
    if ('500' in colorObj) {
      return (colorObj as Record<string, string>)['500'];
    }
    // For surface and canvas objects, return first value
    const values = Object.values(colorObj);
    return values[0] as string;
  }
  
  // Fallback for any other case
  return '#000000';
};

export const getCanvasSpacing = (size: keyof typeof canvasDesignSystem.spacing) => {
  return canvasDesignSystem.spacing[size];
};

export const getCanvasComponent = (
  component: keyof typeof canvasDesignSystem.components,
  variant?: string
) => {
  const comp = canvasDesignSystem.components[component];
  if (variant && typeof comp === 'object') {
    return (comp as any)[variant] || (comp as any).base;
  }
  return comp;
};

export default canvasDesignSystem; 