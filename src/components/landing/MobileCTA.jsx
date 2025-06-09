import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

const MobileCTA = () => {
  const [isVisible, setIsVisible] = useState(false);
  
  // Show CTA after scrolling down
  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY;
      // Show after scrolling down 400px
      setIsVisible(scrollY > 400);
    };
    
    window.addEventListener('scroll', handleScroll);
    
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  return (
    <div 
      className={`fixed bottom-0 left-0 right-0 bg-white dark:bg-propagentic-neutral-dark shadow-md border-t border-propagentic-neutral transform transition-transform duration-300 z-50 ${
        isVisible ? 'translate-y-0' : 'translate-y-full'
      } md:hidden`}
    >
      <div className="container mx-auto px-4 py-3">
        <div className="flex flex-col">
          <div className="mb-2 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-propagentic-neutral-dark dark:text-white">
                First 5 Properties Managed on Us
              </p>
              <p className="text-xs text-propagentic-neutral-dark/70 dark:text-propagentic-neutral-light">
                No credit card required
              </p>
            </div>
            <div className="flex items-center">
              <span className="text-xs bg-propagentic-teal-light text-white px-2 py-1 rounded-full mr-2">
                New
              </span>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-propagentic-teal" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M5 2a1 1 0 011 1v1h1a1 1 0 010 2H6v1a1 1 0 01-2 0V6H3a1 1 0 010-2h1V3a1 1 0 011-1zm0 10a1 1 0 011 1v1h1a1 1 0 110 2H6v1a1 1 0 11-2 0v-1H3a1 1 0 110-2h1v-1a1 1 0 011-1zM12 2a1 1 0 01.967.744L14.146 7.2 17.5 9.134a1 1 0 010 1.732l-3.354 1.935-1.18 4.455a1 1 0 01-1.933 0L9.854 12.8 6.5 10.866a1 1 0 010-1.732l3.354-1.935 1.18-4.455A1 1 0 0112 2z" clipRule="evenodd" />
              </svg>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-2">
            <Link 
              to="/signup" 
              className="bg-propagentic-teal text-white px-4 py-2 rounded-lg text-center font-medium hover:bg-propagentic-teal-dark transition-colors duration-150"
            >
              Start Free
            </Link>
            <Link 
              to="/how-it-works" 
              className="bg-propagentic-neutral-light dark:bg-propagentic-neutral text-propagentic-neutral-dark dark:text-white px-4 py-2 rounded-lg text-center font-medium transition-colors duration-150"
            >
              Learn More
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MobileCTA; 