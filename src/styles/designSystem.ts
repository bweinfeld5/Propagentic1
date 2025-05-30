// Design System Foundation for PropAgentic
// Centralized design tokens for consistent styling across the contractor dashboard

export const designSystem = {
  // Color Palette
  colors: {
    // Primary (Orange brand colors)
    primary: {
      50: '#fff7ed',
      100: '#ffedd5', 
      200: '#fed7aa',
      300: '#fdba74',
      400: '#fb923c',
      500: '#f97316', // Main orange
      600: '#ea580c',
      700: '#c2410c',
      800: '#9a3412',
      900: '#7c2d12'
    },
    
    // Secondary (Warm grays)
    gray: {
      50: '#fafaf9',
      100: '#f5f5f4',
      200: '#e7e5e4',
      300: '#d6d3d1',
      400: '#a8a29e',
      500: '#78716c',
      600: '#57534e',
      700: '#44403c',
      800: '#292524',
      900: '#1c1917'
    },
    
    // Accent colors for different categories
    blue: {
      50: '#eff6ff',
      100: '#dbeafe',
      500: '#3b82f6',
      600: '#2563eb'
    },
    
    green: {
      50: '#f0fdf4',
      100: '#dcfce7',
      500: '#22c55e',
      600: '#16a34a'
    },
    
    red: {
      50: '#fef2f2',
      100: '#fee2e2',
      500: '#ef4444',
      600: '#dc2626'
    },
    
    yellow: {
      50: '#fefce8',
      100: '#fef3c7',
      500: '#eab308',
      600: '#ca8a04'
    },
    
    purple: {
      50: '#faf5ff',
      100: '#f3e8ff',
      500: '#a855f7',
      600: '#9333ea'
    }
  },
  
  // Spacing Scale (8px grid system)
  spacing: {
    xs: '4px',   // 0.5
    sm: '8px',   // 1
    md: '16px',  // 2
    lg: '24px',  // 3
    xl: '32px',  // 4
    '2xl': '48px', // 6
    '3xl': '64px', // 8
    '4xl': '96px'  // 12
  },
  
  // Typography Scale
  typography: {
    // Font sizes
    text: {
      xs: '12px',   // 0.75rem
      sm: '14px',   // 0.875rem
      base: '16px', // 1rem
      lg: '18px',   // 1.125rem
      xl: '20px',   // 1.25rem
      '2xl': '24px', // 1.5rem
      '3xl': '30px', // 1.875rem
      '4xl': '36px'  // 2.25rem
    },
    
    // Font weights
    weight: {
      normal: '400',
      medium: '500',
      semibold: '600',
      bold: '700'
    },
    
    // Line heights
    leading: {
      tight: '1.25',
      normal: '1.5',
      relaxed: '1.75'
    }
  },
  
  // Border Radius
  borderRadius: {
    sm: '6px',
    md: '8px',
    lg: '12px',
    xl: '16px',
    '2xl': '24px',
    full: '9999px'
  },
  
  // Shadows
  shadows: {
    sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
    md: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
    lg: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
    xl: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)'
  },
  
  // Component Styles
  components: {
    // Standard card styling
    card: {
      base: 'bg-white/95 backdrop-blur-sm border border-gray-200 shadow-md hover:shadow-lg transition-all duration-200',
      padding: 'p-6', // 24px (lg spacing)
      borderRadius: 'rounded-xl', // 16px
      spacing: 'space-y-6' // 24px between elements
    },
    
    // Widget container
    widget: {
      base: 'bg-white/95 backdrop-blur-sm border border-orange-200 shadow-lg hover:shadow-xl transition-all duration-200',
      padding: 'p-6',
      borderRadius: 'rounded-xl',
      spacing: 'space-y-4'
    },
    
    // Icon containers
    iconContainer: {
      sm: 'w-8 h-8 rounded-lg flex items-center justify-center',
      md: 'w-10 h-10 rounded-xl flex items-center justify-center',
      lg: 'w-12 h-12 rounded-xl flex items-center justify-center'
    },
    
    // Buttons
    button: {
      primary: 'bg-orange-600 hover:bg-orange-700 text-white font-medium px-4 py-2 rounded-lg transition-colors duration-200',
      secondary: 'bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium px-4 py-2 rounded-lg transition-colors duration-200',
      outline: 'border border-orange-200 text-orange-700 hover:bg-orange-50 font-medium px-4 py-2 rounded-lg transition-colors duration-200'
    }
  }
};

// Utility functions for consistent styling
export const getColorClasses = (color: string, variant: 'bg' | 'text' | 'border' = 'bg', shade: number = 500) => {
  const colorMap: Record<string, string> = {
    orange: 'orange',
    blue: 'blue', 
    green: 'green',
    red: 'red',
    yellow: 'yellow',
    purple: 'purple',
    gray: 'gray'
  };
  
  const colorName = colorMap[color] || 'gray';
  return `${variant}-${colorName}-${shade}`;
};

export const getSpacingClass = (size: keyof typeof designSystem.spacing, property: 'p' | 'm' | 'gap' = 'p') => {
  const sizeMap: Record<keyof typeof designSystem.spacing, string> = {
    xs: '1',
    sm: '2', 
    md: '4',
    lg: '6',
    xl: '8',
    '2xl': '12',
    '3xl': '16',
    '4xl': '24'
  };
  
  return `${property}-${sizeMap[size]}`;
};

export default designSystem; 