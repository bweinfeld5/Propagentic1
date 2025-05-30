import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

/**
 * Floating action button that appears when scrolling down
 * Provides quick access to sign up
 */
const FloatingActionButton: React.FC = () => {
  const [visible, setVisible] = useState(false);
  
  // Show button when scrolling down
  useEffect(() => {
    const toggleVisibility = () => {
      if (window.scrollY > 500) {
        setVisible(true);
      } else {
        setVisible(false);
      }
    };
    
    window.addEventListener('scroll', toggleVisibility);
    
    return () => window.removeEventListener('scroll', toggleVisibility);
  }, []);
  
  if (!visible) return null;
  
  return (
    <Link 
      to="/signup" 
      className="fixed bottom-6 right-6 bg-primary hover:bg-primary-dark text-white p-4 rounded-full shadow-lg transition-all duration-300 z-50"
      aria-label="Sign up"
    >
      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
      </svg>
    </Link>
  );
};

export default FloatingActionButton; 