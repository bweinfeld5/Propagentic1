import React, { useRef } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import ErrorBoundary from '../shared/ErrorBoundary';
import { 
  HomeIcon, 
  UserIcon,
  WrenchScrewdriverIcon, 
  HeartIcon,
  BoltIcon,
  BeakerIcon,
  ScaleIcon,
  PaintBrushIcon,
  AcademicCapIcon,
  BuildingOffice2Icon,
  IdentificationIcon,
  CameraIcon,
  ShoppingBagIcon,
  MusicalNoteIcon,
  DevicePhoneMobileIcon,
  TruckIcon,
  BookOpenIcon,
  ComputerDesktopIcon,
  GlobeAltIcon,
  BriefcaseIcon,
  CurrencyDollarIcon,
  CakeIcon,
  UserGroupIcon,
  PhoneIcon,
  ShieldCheckIcon
} from '@heroicons/react/24/outline';

/**
 * Get icon based on role type
 * @param {string} role The role identifier
 * @returns {JSX.Element} The appropriate icon component
 */
const getRoleIcon = (role) => {
  const lowerRole = role.toLowerCase();
  
  if (lowerRole.includes('neighbour')) return <HomeIcon className="w-3.5 h-3.5 text-white/80" aria-hidden="true" />;
  if (lowerRole.includes('dentist')) return <UserIcon className="w-3.5 h-3.5 text-white/80" aria-hidden="true" />;
  if (lowerRole.includes('plumber')) return <WrenchScrewdriverIcon className="w-3.5 h-3.5 text-white/80" aria-hidden="true" />;
  if (lowerRole.includes('doctor')) return <HeartIcon className="w-3.5 h-3.5 text-white/80" aria-hidden="true" />;
  if (lowerRole.includes('electrician')) return <BoltIcon className="w-3.5 h-3.5 text-white/80" aria-hidden="true" />;
  if (lowerRole.includes('scientist')) return <BeakerIcon className="w-3.5 h-3.5 text-white/80" aria-hidden="true" />;
  if (lowerRole.includes('lawyer')) return <ScaleIcon className="w-3.5 h-3.5 text-white/80" aria-hidden="true" />;
  if (lowerRole.includes('artist')) return <PaintBrushIcon className="w-3.5 h-3.5 text-white/80" aria-hidden="true" />;
  if (lowerRole.includes('professor')) return <AcademicCapIcon className="w-3.5 h-3.5 text-white/80" aria-hidden="true" />;
  if (lowerRole.includes('architect')) return <BuildingOffice2Icon className="w-3.5 h-3.5 text-white/80" aria-hidden="true" />;
  if (lowerRole.includes('designer')) return <IdentificationIcon className="w-3.5 h-3.5 text-white/80" aria-hidden="true" />;
  if (lowerRole.includes('photographer')) return <CameraIcon className="w-3.5 h-3.5 text-white/80" aria-hidden="true" />;
  if (lowerRole.includes('baker')) return <ShoppingBagIcon className="w-3.5 h-3.5 text-white/80" aria-hidden="true" />;
  if (lowerRole.includes('musician')) return <MusicalNoteIcon className="w-3.5 h-3.5 text-white/80" aria-hidden="true" />;
  if (lowerRole.includes('developer')) return <DevicePhoneMobileIcon className="w-3.5 h-3.5 text-white/80" aria-hidden="true" />;
  if (lowerRole.includes('driver')) return <TruckIcon className="w-3.5 h-3.5 text-white/80" aria-hidden="true" />;
  if (lowerRole.includes('teacher')) return <BookOpenIcon className="w-3.5 h-3.5 text-white/80" aria-hidden="true" />;
  if (lowerRole.includes('engineer')) return <ComputerDesktopIcon className="w-3.5 h-3.5 text-white/80" aria-hidden="true" />;
  if (lowerRole.includes('consultant')) return <BriefcaseIcon className="w-3.5 h-3.5 text-white/80" aria-hidden="true" />;
  if (lowerRole.includes('accountant')) return <CurrencyDollarIcon className="w-3.5 h-3.5 text-white/80" aria-hidden="true" />;
  if (lowerRole.includes('chef')) return <CakeIcon className="w-3.5 h-3.5 text-white/80" aria-hidden="true" />;
  if (lowerRole.includes('team')) return <UserGroupIcon className="w-3.5 h-3.5 text-white/80" aria-hidden="true" />;
  if (lowerRole.includes('support')) return <PhoneIcon className="w-3.5 h-3.5 text-white/80" aria-hidden="true" />;
  if (lowerRole.includes('security')) return <ShieldCheckIcon className="w-3.5 h-3.5 text-white/80" aria-hidden="true" />;
  if (lowerRole.includes('travel')) return <GlobeAltIcon className="w-3.5 h-3.5 text-white/80" aria-hidden="true" />;
  
  // Default icon
  return <UserIcon className="w-3.5 h-3.5 text-white/80" aria-hidden="true" />;
};

/**
 * Chip component with enhanced animations
 */
const AnimatedChip = ({ chip, index }) => {
  // Get delay based on index for staggered animation
  const getAnimationDelay = () => {
    return `${(index % 5) * 0.7}s`;
  };
  
  // Helper function to get initials from names
  const getInitials = (name) => {
    const parts = name.split(' ');
    if (parts.length > 0) {
      const lastPart = parts[parts.length - 1];
      if (lastPart === "team") return "TM";
      return lastPart.charAt(0);
    }
    return 'A';
  };

  return (
    <motion.li
      className="flex-shrink-0"
      role="listitem"
      aria-label={chip}
      whileHover={{ 
        scale: 1.05, 
        transition: { duration: 0.2 } 
      }}
      initial={{ y: 10, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{
        delay: getAnimationDelay(),
        duration: 0.5
      }}
    >
      <motion.div 
        className="flex items-center bg-white/10 hover:bg-white/15 backdrop-blur-md border border-white/20 rounded-md px-3 py-1.5 min-w-max transition-all duration-300 shadow-lg shadow-black/10 focus-within:ring-2 focus-within:ring-white/40"
        whileHover={{
          backgroundColor: 'rgba(255, 255, 255, 0.18)',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
          borderColor: 'rgba(255, 255, 255, 0.3)'
        }}
        tabIndex="0"
      >
        {/* Icon indicator */}
        <div className="flex-shrink-0 w-4 h-4 flex items-center justify-center mr-2" aria-hidden="true">
          {getRoleIcon(chip)}
        </div>
        
        {/* Initials with glow effect */}
        <div 
          className="flex-shrink-0 w-6 h-6 rounded-full bg-gradient-to-br from-blue-400/30 to-blue-600/40 flex items-center justify-center mr-2 text-white text-xs border border-white/10 shadow-sm animate-soft-glow"
          aria-hidden="true"
        >
          {getInitials(chip)}
        </div>
        
        {/* Name */}
        <span className="text-white whitespace-nowrap text-sm font-medium">
          {chip}
        </span>
      </motion.div>
    </motion.li>
  );
};

/**
 * Component that displays a carousel of chips representing people who trust the service
 * Chips animate from right to left in an infinite loop and pause on hover
 * Provides fallback for browsers that don't support motion
 */
const TrustedByCarousel = ({ 
  chips = [
    'Your neighbour John',
    'Your family dentist Craig',
    'Your emergency plumber Harold',
    'Your primary doctor Mike',
    'Your local electrician Tom',
    'Your estate lawyer Sarah',
    'Your portrait artist Emma',
    'Your university professor David',
    'Your residential architect Julia',
    'Your UX designer Michael',
    'Your wedding photographer Kate',
    'Your artisan baker Robert',
    'Your jazz musician Alex',
    'Your iOS developer Lisa',
    'Your delivery driver James',
    'Your child\'s teacher Olivia',
    'Your software engineer William',
    'Your research scientist Rachel',
    'Your physical therapist Maria',
    'Your personal chef Daniel',
    'Your travel consultant Sophia',
    'Your financial accountant Steven',
    'Your security advisor Chris',
    'Your interior decorator Jennifer',
    'Your IT support team',
    'Your Manhattan neighbor Ethan',
    'Your San Francisco realtor Jessica',
    'Your Chicago contractor Nathan',
    'Your Boston landscaper Mark',
    'Your Miami fitness trainer Nicole',
    'Your remote developer team',
    'Your Seattle barista Zoe',
    'Your Dallas home inspector Kevin',
    'Your Atlanta mortgage broker Tyler',
    'Your Portland organic gardener Lucy',
    'Your Los Angeles stylist Ryan',
    'Your Denver ski instructor Abigail',
    'Your Nashville recording artist Jack',
    'Your New Orleans tour guide Elena',
    'Your Phoenix solar installer Diego'
  ],
  ariaLabel = "People who trust our service"
}) => {
  // Check for reduced motion preference
  const prefersReducedMotion = useReducedMotion();
  
  // Reference for carousel container to handle pause on hover/focus
  const carouselRef = useRef(null);
  
  // For performance, only render a subset of chips when duplicating
  const optimizedChips = prefersReducedMotion ? chips.slice(0, 8) : chips;
  
  // To create a smooth loop effect, duplicate the chips
  const duplicatedChips = [...optimizedChips, ...optimizedChips];

  return (
    <ErrorBoundary fallback="Couldn't load testimonials">
      {/* Container with shimmer effect background */}
      <div 
        className="relative overflow-hidden w-full py-1 max-w-screen mx-auto"
        aria-label={ariaLabel}
        role="region"
      >
        {/* Symmetrical edge gradients for fade effect */}
        <div className="absolute left-0 top-0 bottom-0 w-16 bg-gradient-to-r from-gray-800 to-transparent z-10" aria-hidden="true"></div>
        <div className="absolute right-0 top-0 bottom-0 w-16 bg-gradient-to-l from-gray-800 to-transparent z-10" aria-hidden="true"></div>
        
        {/* Carousel Component - Motion Enabled Browsers */}
        <div className={prefersReducedMotion ? "hidden" : "block"}>
          <div 
            className="relative w-full overflow-hidden px-16"
            ref={carouselRef}
            onMouseEnter={() => {
              if (carouselRef.current) {
                carouselRef.current.style.animationPlayState = 'paused';
              }
            }}
            onMouseLeave={() => {
              if (carouselRef.current) {
                carouselRef.current.style.animationPlayState = 'running';
              }
            }}
            onFocus={() => {
              if (carouselRef.current) {
                carouselRef.current.style.animationPlayState = 'paused';
              }
            }}
            onBlur={() => {
              if (carouselRef.current) {
                carouselRef.current.style.animationPlayState = 'running';
              }
            }}
          >
            <motion.ul
              className="flex gap-3 md:gap-4"
              initial={{ x: '-16px' }} 
              animate={{ x: 'calc(-50% - 16px)' }}
              transition={{ 
                repeat: Infinity,
                duration: 30,
                ease: "linear"
              }}
              style={{
                willChange: 'transform'
              }}
              role="list"
              aria-live="polite"
            >
              {duplicatedChips.map((chip, index) => (
                <AnimatedChip key={`${chip}-${index}`} chip={chip} index={index} />
              ))}
            </motion.ul>
          </div>
        </div>
        
        {/* Fallback for browsers with reduced motion preference */}
        <div className={!prefersReducedMotion ? "hidden" : "block"}>
          <ul
            className="flex flex-wrap justify-center gap-3 px-16"
            role="list"
            aria-live="polite"
          >
            {optimizedChips.map((chip, index) => (
              <li
                key={`${chip}-${index}`}
                className="flex-shrink-0 animate-float"
                style={{ animationDelay: `${index * 0.2}s` }}
                role="listitem"
                aria-label={chip}
              >
                <div 
                  className="flex items-center bg-white/10 border border-white/20 rounded-md px-3 py-1.5 shadow-lg shadow-black/10 focus-within:ring-2 focus-within:ring-white/40"
                  tabIndex="0"
                >
                  {/* Icon indicator */}
                  <div className="flex-shrink-0 w-4 h-4 flex items-center justify-center mr-2" aria-hidden="true">
                    {getRoleIcon(chip)}
                  </div>
                  
                  {/* Initials */}
                  <div 
                    className="flex-shrink-0 w-6 h-6 rounded-full bg-gradient-to-br from-blue-400/30 to-blue-600/40 flex items-center justify-center mr-2 text-white text-xs border border-white/10 shadow-sm"
                    aria-hidden="true"
                  >
                    {chip.split(' ').pop().charAt(0)}
                  </div>
                  
                  {/* Name */}
                  <span className="text-white whitespace-nowrap text-sm font-medium">
                    {chip}
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