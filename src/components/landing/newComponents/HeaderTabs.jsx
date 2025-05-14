import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

const HeaderTabs = () => {
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      // Set scrolled state if user scrolls down more than 10px
      setIsScrolled(window.scrollY > 10);
    };

    // Add scroll event listener
    window.addEventListener('scroll', handleScroll);

    // Clean up listener on component unmount
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []); // Empty dependency array ensures this runs only once on mount

  // Define base classes for links
  const linkBaseClasses = "px-3 py-2 rounded-md text-sm font-semibold transition-colors duration-300";
  
  // Define base classes for the button
  const buttonBaseClasses = "inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-semibold rounded-md transition-all duration-300";

  return (
    <div className={`
      sticky top-0 z-50 
      transition-all duration-300 ease-in-out 
      ${isScrolled 
        ? 'backdrop-blur-md bg-white/10 border-b border-white/20 shadow-md' // Glassy effect when scrolled
        : 'backdrop-blur-sm bg-white/5 border-b border-white/10' // Subtle glassy effect when at top
      }
    `}>
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center py-3"> {/* Increased padding for better visibility */}
          <div className="flex space-x-6"> {/* Increased spacing between links */}
            <Link 
              to="/" 
              className={`${linkBaseClasses} text-white hover:text-white/80`}
            >
              Home
            </Link>
            <Link 
              to="/pricing" 
              className={`${linkBaseClasses} text-white hover:text-white/80`}
            >
              Pricing
            </Link>
            <Link 
              to="/about" 
              className={`${linkBaseClasses} text-white hover:text-white/80`}
            >
              About
            </Link>
          </div>
          <div className="flex items-center space-x-4">
            <Link 
              to="/auth?tab=login" 
              className={`${linkBaseClasses} text-white hover:text-white/80`}
            >
              Log In
            </Link>
            <Link 
              to="/auth" 
              className={`${buttonBaseClasses} ${
                isScrolled 
                ? 'bg-indigo-600 hover:bg-indigo-500 text-white' // More visible when scrolled
                : 'bg-white/20 hover:bg-white/30 text-white backdrop-blur-md' // Translucent when at top
              }`}
            >
              Sign Up
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HeaderTabs; 