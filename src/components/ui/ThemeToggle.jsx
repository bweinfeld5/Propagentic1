import React from 'react';
import useTheme from '../../hooks/useTheme';
import { SafeMotion } from '../shared/SafeMotion';
import { AnimatePresence } from 'framer-motion';
 // Direct import might be needed if SafeMotion doesn't export it reliably

// Sun Icon
const SunIcon = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z" />
  </svg>
);

// Moon Icon
const MoonIcon = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M21.752 15.002A9.718 9.718 0 0118 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 003 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 009.002-5.998z" />
  </svg>
);

const ThemeToggle = () => {
  const [theme, toggleTheme] = useTheme();

  // Determine which icon to show based on the *next* theme
  const isDark = theme === 'dark';
  const Icon = isDark ? SunIcon : MoonIcon;

  return (
    <button
      onClick={toggleTheme}
      className="p-2 rounded-full text-content-secondary dark:text-content-darkSecondary hover:bg-background-subtle dark:hover:bg-background-darkSubtle focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 dark:focus-visible:ring-offset-background-dark transition-colors duration-200"
      aria-label={isDark ? 'Activate light mode' : 'Activate dark mode'}
    >
      <AnimatePresence mode="wait" initial={false}>
        <SafeMotion.div
          key={isDark ? 'sun' : 'moon'}
          initial={{ opacity: 0, rotate: isDark ? 90 : -90 }}
          animate={{ opacity: 1, rotate: 0 }}
          exit={{ opacity: 0, rotate: isDark ? -90 : 90 }}
          transition={{ duration: 0.25 }}
        >
          <Icon className="w-5 h-5" />
        </SafeMotion.div>
      </AnimatePresence>
    </button>
  );
};

export default ThemeToggle; 