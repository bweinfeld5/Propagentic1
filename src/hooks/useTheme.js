import { useState, useEffect, useCallback } from 'react';

const useTheme = () => {
  // Always return light mode - no theme switching
  const [theme] = useState('light');

  // Effect to ensure document is always in light mode
  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove('dark');
    root.classList.add('light');
    
    // Clear any dark mode preference from localStorage
    localStorage.setItem('theme', 'light');
  }, []);

  // No-op function - theme toggling disabled
  const toggleTheme = useCallback(() => {
    // Do nothing - always stay in light mode
  }, []);

  // Optional: Listen for system preference changes but ignore them
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    
    const handleChange = (e) => {
      // Do nothing - always stay in light mode regardless of system preference
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  // Always return light mode
  return ['light', toggleTheme];
};

export default useTheme; 