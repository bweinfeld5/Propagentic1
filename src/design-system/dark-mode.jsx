/**
 * Dark Mode Utilities
 * Consistent dark theme support for PropAgentic
 */

import { useState, useEffect, createContext, useContext } from 'react';

// Theme context
const ThemeContext = createContext({
  theme: 'light',
  toggleTheme: () => {},
  setTheme: () => {},
  systemTheme: 'light',
});

/**
 * Theme provider component
 */
export const ThemeProvider = ({ children, defaultTheme = 'system' }) => {
  const [theme, setThemeState] = useState(defaultTheme);
  const [systemTheme, setSystemTheme] = useState('light');

  // Get system theme preference
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    setSystemTheme(mediaQuery.matches ? 'dark' : 'light');

    const handler = (e) => setSystemTheme(e.matches ? 'dark' : 'light');
    mediaQuery.addEventListener('change', handler);
    
    return () => mediaQuery.removeEventListener('change', handler);
  }, []);

  // Load saved theme preference
  useEffect(() => {
    const savedTheme = localStorage.getItem('propAgentic_theme');
    if (savedTheme && ['light', 'dark', 'system'].includes(savedTheme)) {
      setThemeState(savedTheme);
    }
  }, []);

  // Apply theme to document
  useEffect(() => {
    const root = document.documentElement;
    const actualTheme = theme === 'system' ? systemTheme : theme;
    
    if (actualTheme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }

    // Save preference
    localStorage.setItem('propAgentic_theme', theme);
  }, [theme, systemTheme]);

  const toggleTheme = () => {
    setThemeState(prevTheme => {
      if (prevTheme === 'light') return 'dark';
      if (prevTheme === 'dark') return 'system';
      return 'light';
    });
  };

  const setTheme = (newTheme) => {
    if (['light', 'dark', 'system'].includes(newTheme)) {
      setThemeState(newTheme);
    }
  };

  const value = {
    theme,
    toggleTheme,
    setTheme,
    systemTheme,
    actualTheme: theme === 'system' ? systemTheme : theme,
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};

/**
 * Hook to use theme context
 */
export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

/**
 * Dark mode class utilities
 */
export const darkModeClasses = {
  // Background colors
  bg: {
    primary: 'bg-white dark:bg-gray-900',
    secondary: 'bg-gray-50 dark:bg-gray-800',
    tertiary: 'bg-gray-100 dark:bg-gray-700',
    elevated: 'bg-white dark:bg-gray-800',
    card: 'bg-white dark:bg-gray-800',
    hover: 'hover:bg-gray-50 dark:hover:bg-gray-700',
    active: 'active:bg-gray-100 dark:active:bg-gray-600',
  },
  
  // Text colors
  text: {
    primary: 'text-gray-900 dark:text-gray-100',
    secondary: 'text-gray-700 dark:text-gray-300',
    tertiary: 'text-gray-600 dark:text-gray-400',
    muted: 'text-gray-500 dark:text-gray-500',
    link: 'text-blue-600 dark:text-blue-400',
    error: 'text-red-600 dark:text-red-400',
    success: 'text-green-600 dark:text-green-400',
    warning: 'text-yellow-600 dark:text-yellow-400',
  },
  
  // Border colors
  border: {
    default: 'border-gray-200 dark:border-gray-700',
    subtle: 'border-gray-100 dark:border-gray-800',
    prominent: 'border-gray-300 dark:border-gray-600',
    focus: 'focus:border-blue-500 dark:focus:border-blue-400',
  },
  
  // Component-specific
  input: {
    base: 'bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100',
    placeholder: 'placeholder-gray-400 dark:placeholder-gray-500',
    focus: 'focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-blue-500 dark:focus:border-blue-400',
    disabled: 'disabled:bg-gray-50 dark:disabled:bg-gray-900 disabled:text-gray-500 dark:disabled:text-gray-500',
  },
  
  button: {
    primary: 'bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white',
    secondary: 'bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-900 dark:text-gray-100',
    outline: 'border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800',
    ghost: 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800',
  },
  
  card: {
    base: 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700',
    hover: 'hover:shadow-lg dark:hover:shadow-gray-900/50',
  },
  
  dropdown: {
    base: 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700',
    item: 'hover:bg-gray-100 dark:hover:bg-gray-700',
  },
  
  modal: {
    backdrop: 'bg-black/50 dark:bg-black/70',
    content: 'bg-white dark:bg-gray-800',
  },
  
  table: {
    header: 'bg-gray-50 dark:bg-gray-900',
    row: 'hover:bg-gray-50 dark:hover:bg-gray-700',
    border: 'border-gray-200 dark:border-gray-700',
  },
  
  badge: {
    default: 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200',
    primary: 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200',
    success: 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200',
    warning: 'bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200',
    error: 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200',
  },
};

/**
 * Dark mode color utilities
 */
export const darkModeColors = {
  // Convert light mode color to dark mode equivalent
  adaptColor: (lightColor, darkColor) => {
    return `${lightColor} dark:${darkColor}`;
  },
  
  // Generate color classes with dark mode support
  generateColorClasses: (colorName, shades = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900]) => {
    const classes = {};
    shades.forEach(shade => {
      // For backgrounds, invert the shade in dark mode
      const darkShade = 1000 - shade;
      classes[`bg-${shade}`] = `bg-${colorName}-${shade} dark:bg-${colorName}-${darkShade > 900 ? 900 : darkShade}`;
      
      // For text, adjust the shade
      const textDarkShade = shade <= 500 ? shade + 300 : shade - 200;
      classes[`text-${shade}`] = `text-${colorName}-${shade} dark:text-${colorName}-${textDarkShade}`;
    });
    return classes;
  },
};

/**
 * Theme toggle button component
 */
export const ThemeToggle = ({ className = '', showLabel = false }) => {
  const { theme, toggleTheme, actualTheme } = useTheme();
  
  const icons = {
    light: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
      </svg>
    ),
    dark: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
      </svg>
    ),
    system: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
      </svg>
    ),
  };
  
  const labels = {
    light: 'Light mode',
    dark: 'Dark mode',
    system: 'System theme',
  };

  return (
    <button
      onClick={toggleTheme}
      className={`p-2 rounded-lg transition-colors ${darkModeClasses.button.ghost} ${className}`}
      aria-label={`Switch to ${theme === 'light' ? 'dark' : theme === 'dark' ? 'system' : 'light'} theme`}
    >
      <div className="flex items-center space-x-2">
        {icons[theme]}
        {showLabel && (
          <span className="text-sm font-medium">{labels[theme]}</span>
        )}
      </div>
    </button>
  );
};

/**
 * Dark mode media utilities
 */
export const useDarkModeMediaQuery = (callback) => {
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = (e) => callback(e.matches ? 'dark' : 'light');
    
    mediaQuery.addEventListener('change', handler);
    
    // Initial call
    handler(mediaQuery);
    
    return () => mediaQuery.removeEventListener('change', handler);
  }, [callback]);
};

/**
 * Utility to apply dark mode classes conditionally
 */
export const withDarkMode = (Component) => {
  return (props) => {
    const { actualTheme } = useTheme();
    return <Component {...props} theme={actualTheme} />;
  };
};

/**
 * Fallback for SSR
 */
export const useSafeTheme = () => {
  if (typeof window === 'undefined') {
    return {
      theme: 'light',
      toggleTheme: () => {},
      setTheme: () => {},
      systemTheme: 'light',
      actualTheme: 'light',
    };
  }
  
  // eslint-disable-next-line react-hooks/rules-of-hooks
  return useTheme();
}; 