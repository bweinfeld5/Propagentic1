import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { SafeMotion, AnimatePresence } from "../../shared/SafeMotion";

const FloatingActionButton = () => {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const isScrolled = window.scrollY > 300;
      if (isScrolled !== scrolled) {
        setScrolled(isScrolled);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, [scrolled]);

  return (
    <AnimatePresence>
      {scrolled && (
        <SafeMotion.div
          className="fixed bottom-8 right-8 z-50"
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        >
          <Link
            to="/signup"
            className="bg-propagentic-teal text-propagentic-neutral-lightest px-6 py-3 rounded-full font-medium shadow-lg hover:bg-propagentic-teal-dark transform hover:scale-105 transition duration-200 flex items-center focus:outline-none focus:ring-2 focus:ring-propagentic-teal focus:ring-offset-2"
          >
            <span>Get Started</span>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 ml-2" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </Link>
        </SafeMotion.div>
      )}
    </AnimatePresence>
  );
};

export default FloatingActionButton; 