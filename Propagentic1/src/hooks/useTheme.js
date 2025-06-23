import { useState, useEffect, useCallback } from 'react';

const useTheme = () => {
  // Initialize state, trying to read from localStorage first, then system preference, then default to light
  const [theme, setTheme] = useState(() => {
    if (typeof window === 'undefined') {
      // Default theme for SSR or build-time rendering
      return 'light';
    }
    const storedTheme = localStorage.getItem('theme');
    if (storedTheme) {
      return storedTheme;
    }
    // Check system preference
    const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    return prefersDark ? 'dark' : 'light';
  });

  // Effect to apply the theme class to the root element and update localStorage
  useEffect(() => {
    const root = window.document.documentElement; // Get the <html> element
    root.classList.remove('light', 'dark'); // Remove previous theme class
    root.classList.add(theme); // Add the current theme class
    localStorage.setItem('theme', theme); // Persist the theme choice
  }, [theme]); // Re-run only when the theme state changes

  // Function to toggle the theme
  const toggleTheme = useCallback(() => {
    setTheme((prevTheme) => (prevTheme === 'light' ? 'dark' : 'light'));
  }, []);

  // Optional: Listen for system preference changes
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    
    const handleChange = (e) => {
      // Optionally update the theme if the user hasn't explicitly set one
      // For simplicity, we currently rely on the initial check and manual toggle
      // console.log('System theme changed:', e.matches ? 'dark' : 'light');
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  return [theme, toggleTheme];
};

export default useTheme; 