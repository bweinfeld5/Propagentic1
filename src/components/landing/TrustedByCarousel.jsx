import React from 'react';
import { SafeMotion } from '../shared/SafeMotion';
import ErrorBoundary from '../shared/ErrorBoundary';

/**
 * Component that displays a carousel of chips representing people who trust the service
 * Chips animate from right to left in an infinite loop and pause on hover
 * Provides fallback for browsers that don't support motion
 */
const TrustedByCarousel = ({ 
  chips = [
    'Your neighbour John',
    'Your dentist Craig',
    'Your plumber Harold',
    'Your doctor Mike',
    'Your electrician Tom'
  ] 
}) => {
  // Helper function to get initials from names
  const getInitials = (name) => {
    // Split the name by spaces and get the last part (assuming format is "Your role Name")
    const parts = name.split(' ');
    if (parts.length > 0) {
      return parts[parts.length - 1].charAt(0);
    }
    return 'A'; // Default fallback
  };

  // To create a smooth loop effect, duplicate the chips
  const duplicatedChips = [...chips, ...chips];

  return (
    <ErrorBoundary fallback="Couldn't load testimonials">
      {/* Container with shimmer effect background */}
      <div className="relative overflow-hidden py-8 w-full">
        {/* Carousel Component */}
        <div className="relative w-full overflow-hidden">
          {/* Animation container */}
          <SafeMotion.ul
            className="flex space-x-4 motion-safe:animate-carousel motion-safe:hover:animation-play-state-paused"
            role="list"
            style={{
              animationDuration: '25s',
              animationTimingFunction: 'linear',
              animationIterationCount: 'infinite'
            }}
            initial={{ x: '100%' }} 
            animate={{ x: '-100%' }}
            transition={{ 
              repeat: Infinity,
              duration: 25,
              ease: "linear"
            }}
          >
            {duplicatedChips.map((chip, index) => (
              <SafeMotion.li
                key={`${chip}-${index}`}
                className="flex-shrink-0"
                role="listitem"
                aria-label={chip}
              >
                <div className="flex items-center bg-white bg-opacity-8 border border-white border-opacity-20 rounded-md px-4 py-2 min-w-max">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-white bg-opacity-15 flex items-center justify-center mr-3 text-white">
                    {getInitials(chip)}
                  </div>
                  <div>
                    <p className="text-white whitespace-nowrap">
                      <span className="text-opacity-80">Trusted by</span>{' '}
                      <span className="text-[#0B5CFF] font-semibold">{chip}</span>
                    </p>
                  </div>
                </div>
              </SafeMotion.li>
            ))}
          </SafeMotion.ul>
          
          {/* Fallback for browsers that don't support motion */}
          <div className="motion-reduce:block hidden">
            <ul
              className="flex flex-wrap justify-center gap-4"
              role="list"
            >
              {chips.map((chip, index) => (
                <li
                  key={`${chip}-${index}`}
                  className="flex-shrink-0"
                  role="listitem"
                  aria-label={chip}
                >
                  <div className="flex items-center bg-white bg-opacity-8 border border-white border-opacity-20 rounded-md px-4 py-2">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-white bg-opacity-15 flex items-center justify-center mr-3 text-white">
                      {getInitials(chip)}
                    </div>
                    <div>
                      <p className="text-white">
                        <span className="text-opacity-80">Trusted by</span>{' '}
                        <span className="text-[#0B5CFF] font-semibold">{chip}</span>
                      </p>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </ErrorBoundary>
  );
};

export default TrustedByCarousel; 