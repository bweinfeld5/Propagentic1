/**
 * PropAgentic UI Theme Tokens
 * Reusable tokens to provide consistent styling across the application
 */

export const tokens = {
  // Color tokens
  colors: {
    // Primary brand colors
    propagentic: {
      teal: 'var(--color-propagentic-teal, #0AB3AC)',
      blue: 'var(--color-propagentic-blue, #178CF9)',
      yellow: 'var(--color-propagentic-yellow, #FFB800)',
      error: 'var(--color-propagentic-error, #F42D2D)',
      success: 'var(--color-propagentic-success, #04B851)',
    },
    
    // Neutral palette
    neutrals: {
      lightest: 'var(--color-neutral-lightest, #FFFFFF)',
      light: 'var(--color-neutral-light, #F5F7FA)', 
      main: 'var(--color-neutral-main, #E5E7EB)',
      dark: 'var(--color-neutral-dark, #1F2937)',
      darkest: 'var(--color-neutral-darkest, #0F172A)',
    },

    // Slate palette
    slate: {
      lightest: 'var(--color-slate-lightest, #F8FAFC)',
      light: 'var(--color-slate-light, #F1F5F9)',
      main: 'var(--color-slate-main, #94A3B8)',
      dark: 'var(--color-slate-dark, #334155)',
      darkest: 'var(--color-slate-darkest, #0F172A)',
    }
  },

  // Typography
  typography: {
    // Font family
    fontFamily: {
      sans: 'var(--font-family, "Inter", system-ui, -apple-system, "Segoe UI", Roboto, sans-serif)',
    },
    
    // Font sizes
    fontSize: {
      xs: 'var(--font-size-xs, 0.75rem)',
      sm: 'var(--font-size-sm, 0.875rem)',
      base: 'var(--font-size-base, 1rem)',
      lg: 'var(--font-size-lg, 1.125rem)',
      xl: 'var(--font-size-xl, 1.25rem)',
      '2xl': 'var(--font-size-2xl, 1.5rem)',
      '3xl': 'var(--font-size-3xl, 1.875rem)', 
      '4xl': 'var(--font-size-4xl, 2.25rem)',
      '5xl': 'var(--font-size-5xl, 3rem)',
    },
    
    // Font weights
    fontWeight: {
      normal: 'var(--font-weight-normal, 400)',
      medium: 'var(--font-weight-medium, 500)',
      semibold: 'var(--font-weight-semibold, 600)',
      bold: 'var(--font-weight-bold, 700)',
    },
  },
  
  // Spacing
  spacing: {
    '0': '0',
    '1': 'var(--spacing-1, 0.25rem)',
    '2': 'var(--spacing-2, 0.5rem)',
    '3': 'var(--spacing-3, 0.75rem)',
    '4': 'var(--spacing-4, 1rem)',
    '5': 'var(--spacing-5, 1.25rem)',
    '6': 'var(--spacing-6, 1.5rem)',
    '8': 'var(--spacing-8, 2rem)',
    '10': 'var(--spacing-10, 2.5rem)',
    '12': 'var(--spacing-12, 3rem)',
    '16': 'var(--spacing-16, 4rem)',
    '20': 'var(--spacing-20, 5rem)',
    '24': 'var(--spacing-24, 6rem)',
  },
  
  // Borders
  borderRadius: {
    none: '0',
    sm: 'var(--border-radius-sm, 0.125rem)',
    md: 'var(--border-radius-md, 0.375rem)',
    lg: 'var(--border-radius-lg, 0.5rem)',
    xl: 'var(--border-radius-xl, 0.75rem)',
    '2xl': 'var(--border-radius-2xl, 1rem)',
    full: 'var(--border-radius-full, 9999px)',
  },
  
  // Shadows
  shadows: {
    sm: 'var(--shadow-sm, 0 1px 2px 0 rgba(0, 0, 0, 0.05))',
    md: 'var(--shadow-md, 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06))',
    lg: 'var(--shadow-lg, 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05))',
    xl: 'var(--shadow-xl, 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04))',
    '2xl': 'var(--shadow-2xl, 0 25px 50px -12px rgba(0, 0, 0, 0.25))',
    inner: 'var(--shadow-inner, inset 0 2px 4px 0 rgba(0, 0, 0, 0.06))',
  },
};

export default tokens; 