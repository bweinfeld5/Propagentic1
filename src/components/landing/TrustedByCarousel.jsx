import React from 'react';
import { motion } from 'framer-motion';
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
      <div className="relative overflow-hidden w-full">
        {/* Carousel Component - Motion Enabled Browsers */}
        <div className="motion-safe:block hidden">
          <div className="relative w-full overflow-hidden">
            <motion.ul
              className="flex gap-3 md:gap-4"
              initial={{ x: '100%' }} 
              animate={{ x: '-100%' }}
              transition={{ 
                repeat: Infinity,
                duration: 25,
                ease: "linear"
              }}
              style={{
                willChange: 'transform'
              }}
              whileHover={{ animationPlayState: 'paused' }}
              role="list"
            >
              {duplicatedChips.map((chip, index) => (
                <motion.li
                  key={`${chip}-${index}`}
                  className="flex-shrink-0"
                  role="listitem"
                  aria-label={chip}
                >
                  <div className="flex items-center bg-white/8 hover:bg-white/12 backdrop-blur-sm border border-white/20 rounded-md px-4 py-1.5 min-w-max transition-all duration-300">
                    <div className="flex-shrink-0 w-6 h-6 rounded-full bg-white/15 flex items-center justify-center mr-2 text-white text-xs">
                      {getInitials(chip)}
                    </div>
                    <span className="text-white whitespace-nowrap text-sm">
                      <span className="text-[#0B5CFF] font-medium">{chip}</span>
                    </span>
                  </div>
                </motion.li>
              ))}
            </motion.ul>
          </div>
        </div>
        
        {/* Fallback for browsers with reduced motion preference */}
        <div className="motion-reduce:block hidden">
          <ul
            className="flex flex-wrap justify-center gap-3 md:gap-4"
            role="list"
          >
            {chips.map((chip, index) => (
              <li
                key={`${chip}-${index}`}
                className="flex-shrink-0"
                role="listitem"
                aria-label={chip}
              >
                <div className="flex items-center bg-white/8 border border-white/20 rounded-md px-4 py-1.5">
                  <div className="flex-shrink-0 w-6 h-6 rounded-full bg-white/15 flex items-center justify-center mr-2 text-white text-xs">
                    {getInitials(chip)}
                  </div>
                  <span className="text-white whitespace-nowrap text-sm">
                    <span className="text-[#0B5CFF] font-medium">{chip}</span>
                  </span>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </ErrorBoundary>
  );
};

export default TrustedByCarousel; 