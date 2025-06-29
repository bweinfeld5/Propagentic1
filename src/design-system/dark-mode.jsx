/**
 * Light Mode Only Theme System
 * Enforces light theme across PropAgentic
 */

import { useState, useEffect, createContext, useContext } from 'react';

// Theme context - light mode only
const ThemeContext = createContext({
  theme: 'light',
  toggleTheme: () => {}, // No-op for compatibility
  setTheme: () => {},   // No-op for compatibility
  systemTheme: 'light',
  actualTheme: 'light',
});

/**
 * Light-mode-only theme provider component
 */
export const ThemeProvider = ({ children, defaultTheme = 'light' }) => {
  const [theme] = useState('light'); // Always light mode

  // Ensure document is always in light mode
  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove('dark');
    root.classList.add('light');
    
    // Clear any dark mode preference from localStorage
    localStorage.setItem('propAgentic_theme', 'light');
    localStorage.setItem('theme', 'light');
  }, []);

  // No-op functions for compatibility with existing code
  const toggleTheme = () => {
    // Do nothing - always light mode
  };

  const setTheme = () => {
    // Do nothing - always light mode
  };

  const value = {
    theme: 'light',
    toggleTheme,
    setTheme,
    systemTheme: 'light',
    actualTheme: 'light',
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};

/**
 * Hook to use theme context (light mode only)
 */
export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    // Return light mode defaults if no context
    return {
      theme: 'light',
      toggleTheme: () => {},
      setTheme: () => {},
      systemTheme: 'light',
      actualTheme: 'light',
    };
  }
  return context;
};

/**
 * Light mode class utilities (dark mode classes removed)
 */
export const darkModeClasses = {
  // Background colors (light mode only)
  bg: {
    primary: 'bg-white',
    secondary: 'bg-gray-50',
    tertiary: 'bg-gray-100',
    elevated: 'bg-white',
    card: 'bg-white',
    hover: 'hover:bg-gray-50',
    active: 'active:bg-gray-100',
  },
  
  // Text colors (light mode only)
  text: {
    primary: 'text-gray-900',
    secondary: 'text-gray-700',
    tertiary: 'text-gray-600',
    muted: 'text-gray-500',
    link: 'text-blue-600',
    error: 'text-red-600',
    success: 'text-green-600',
    warning: 'text-yellow-600',
  },
  
  // Border colors (light mode only)
  border: {
    default: 'border-gray-200',
    subtle: 'border-gray-100',
    prominent: 'border-gray-300',
    focus: 'focus:border-blue-500',
  },
  
  // Component-specific (light mode only)
  input: {
    base: 'bg-white border-gray-300 text-gray-900',
    placeholder: 'placeholder-gray-400',
    focus: 'focus:ring-blue-500 focus:border-blue-500',
    disabled: 'disabled:bg-gray-50 disabled:text-gray-500',
  },
  
  button: {
    primary: 'bg-blue-600 hover:bg-blue-700 text-white',
    secondary: 'bg-gray-200 hover:bg-gray-300 text-gray-900',
    outline: 'border-gray-300 text-gray-700 hover:bg-gray-50',
    ghost: 'text-gray-700 hover:bg-gray-100',
  },
  
  card: {
    base: 'bg-white border-gray-200',
    hover: 'hover:shadow-lg',
  },
  
  dropdown: {
    base: 'bg-white border-gray-200',
    item: 'hover:bg-gray-100',
  },
  
  modal: {
    backdrop: 'bg-black/50',
    content: 'bg-white',
  },
  
  table: {
    header: 'bg-gray-50',
    row: 'hover:bg-gray-50',
    border: 'border-gray-200',
  },
  
  badge: {
    default: 'bg-gray-100 text-gray-800',
    primary: 'bg-blue-100 text-blue-800',
    success: 'bg-green-100 text-green-800',
    warning: 'bg-yellow-100 text-yellow-800',
    error: 'bg-red-100 text-red-800',
  },
};

/**
 * Light mode color utilities
 */
export const darkModeColors = {
  // Return light mode color only
  adaptColor: (lightColor, darkColor) => {
    return lightColor;
  },
  
  // Generate color classes (light mode only)
  generateColorClasses: (colorName, shades = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900]) => {
    const classes = {};
    shades.forEach(shade => {
      classes[`bg-${shade}`] = `bg-${colorName}-${shade}`;
      classes[`text-${shade}`] = `text-${colorName}-${shade}`;
    });
    return classes;
  },
};

/**
 * No-op theme toggle button component (for compatibility)
 */
export const ThemeToggle = ({ className = '', showLabel = false }) => {
  // Return nothing - no theme toggle needed
  return null;
};

/**
 * Utility to apply light mode classes
 */
export const withDarkMode = (Component) => {
  return (props) => {
    return <Component {...props} theme="light" />;
  };
};

/**
 * Light mode only hook
 */
export const useSafeTheme = () => {
  return {
    theme: 'light',
    toggleTheme: () => {},
    setTheme: () => {},
    systemTheme: 'light',
    actualTheme: 'light',
  };
};

/**
 * No-op media query hook
 */
export const useDarkModeMediaQuery = (callback) => {
  useEffect(() => {
    // Always call with light mode
    callback('light');
  }, [callback]);
}; 