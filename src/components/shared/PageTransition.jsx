import React from 'react';
import PropTypes from 'prop-types';
import { SafeMotion } from "../shared/SafeMotion";

/**
 * PageTransition Component
 * 
 * A wrapper component that applies consistent page transition animations
 * throughout the application.
 * 
 * @param {Object} props
 * @param {React.ReactNode} props.children - Content to be animated
 * @param {string} props.transitionType - Type of transition animation to apply
 * @param {number} props.duration - Duration of the animation in seconds
 */
const PageTransition = ({ 
  children, 
  transitionType = 'fade', 
  duration = 0.5,
  delay = 0
}) => {
  // Define different animation variants
  const variants = {
    fade: {
      initial: { opacity: 0 },
      animate: { opacity: 1 },
      exit: { opacity: 0 }
    },
    slideUp: {
      initial: { opacity: 0, y: 20 },
      animate: { opacity: 1, y: 0 },
      exit: { opacity: 0, y: -20 }
    },
    slideRight: {
      initial: { opacity: 0, x: -20 },
      animate: { opacity: 1, x: 0 },
      exit: { opacity: 0, x: 20 }
    },
    scale: {
      initial: { opacity: 0, scale: 0.95 },
      animate: { opacity: 1, scale: 1 },
      exit: { opacity: 0, scale: 1.05 }
    },
    // Dashboard-specific animations
    dashboardTransition: {
      initial: { opacity: 0, y: 10 },
      animate: { opacity: 1, y: 0 },
      exit: { opacity: 0, y: -10 }
    }
  };

  // Get the selected variant
  const selectedVariant = variants[transitionType] || variants.fade;
  
  return (
    <SafeMotion.div
      initial="initial"
      animate="animate"
      exit="exit"
      variants={selectedVariant}
      transition={{ 
        duration, 
        delay,
        ease: [0.22, 1, 0.36, 1] // Custom easing curve for smooth transitions
      }}
      className="w-full h-full"
    >
      {children}
    </SafeMotion.div>
  );
};

PageTransition.propTypes = {
  children: PropTypes.node.isRequired,
  transitionType: PropTypes.oneOf(['fade', 'slideUp', 'slideRight', 'scale', 'dashboardTransition']),
  duration: PropTypes.number,
  delay: PropTypes.number
};

export default PageTransition; 