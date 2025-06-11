/**
 * SafeMotion - Accessible Motion Components
 * PropAgentic Design System
 * 
 * Provides Framer Motion components with built-in accessibility support
 * and respect for user motion preferences.
 */

import React from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { useReducedMotion as useA11yReducedMotion } from '../../design-system/accessibility';
import { safeDelay as utilSafeDelay } from '../../utils/animationDebug';

// Utility function to ensure delay values are safe
const safeDelay = (delay) => {
  // Use the comprehensive validation from animationDebug utility
  return utilSafeDelay(delay, 0, 'SafeMotion');
};

// Motion configuration that respects accessibility preferences
const createMotionConfig = (prefersReducedMotion) => {
  if (prefersReducedMotion) {
    return {
      initial: { opacity: 0 },
      animate: { opacity: 1 },
      exit: { opacity: 0 },
      transition: { duration: 0.01 }
    };
  }
  
  return {
    transition: {
      type: 'spring',
      stiffness: 300,
      damping: 30
    }
  };
};

// Safe motion variants for common animations
export const motionVariants = {
  // Page transitions
  pageTransition: {
    initial: { opacity: 0, y: 20 },
    animate: { 
      opacity: 1, 
      y: 0,
      transition: {
        duration: 0.4,
        ease: [0.23, 1, 0.32, 1]
      }
    },
    exit: { 
      opacity: 0, 
      y: -20,
      transition: {
        duration: 0.3,
        ease: [0.23, 1, 0.32, 1]
      }
    }
  },

  // Fade in/out
  fadeIn: {
    initial: { opacity: 0 },
    animate: { 
      opacity: 1,
      transition: {
        duration: 0.3,
        ease: 'easeOut'
      }
    },
    exit: { 
      opacity: 0,
      transition: {
        duration: 0.2,
        ease: 'easeIn'
      }
    }
  },

  // Slide up
  slideUp: {
    initial: { opacity: 0, y: 30 },
    animate: { 
      opacity: 1, 
      y: 0,
      transition: {
        duration: 0.4,
        ease: [0.16, 1, 0.3, 1]
      }
    },
    exit: { 
      opacity: 0, 
      y: 30,
      transition: {
        duration: 0.3,
        ease: [0.7, 0, 0.84, 0]
      }
    }
  },

  // Scale in
  scaleIn: {
    initial: { opacity: 0, scale: 0.9 },
    animate: { 
      opacity: 1, 
      scale: 1,
      transition: {
        duration: 0.3,
        ease: [0.16, 1, 0.3, 1]
      }
    },
    exit: { 
      opacity: 0, 
      scale: 0.95,
      transition: {
        duration: 0.2,
        ease: 'easeIn'
      }
    }
  },

  // Stagger children
  staggerContainer: {
    animate: {
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.1
      }
    }
  },

  staggerItem: {
    initial: { opacity: 0, y: 20 },
    animate: { 
      opacity: 1, 
      y: 0,
      transition: {
        duration: 0.4,
        ease: [0.23, 1, 0.32, 1]
      }
    }
  },

  // Hover effects
  hover: {
    scale: 1.02,
    transition: {
      duration: 0.2,
      ease: 'easeOut'
    }
  },

  tap: {
    scale: 0.98,
    transition: {
      duration: 0.1,
      ease: 'easeInOut'
    }
  }
};

// Safe Motion wrapper component
export const SafeMotion = ({ 
  children, 
  variant = 'fadeIn', 
  custom,
  className = '',
  style = {},
  ...props 
}) => {
  const prefersReducedMotion = useReducedMotion();
  const a11yReducedMotion = useA11yReducedMotion();
  const shouldReduceMotion = prefersReducedMotion || a11yReducedMotion;

  const motionConfig = shouldReduceMotion 
    ? createMotionConfig(true)
    : {
        ...motionVariants[variant],
        ...custom
      };

  return (
    <motion.div
      className={className}
      style={style}
      {...motionConfig}
      {...props}
    >
      {children}
    </motion.div>
  );
};

// Safe AnimatePresence wrapper
export const SafeAnimatePresence = ({ children, ...props }) => {
  const prefersReducedMotion = useReducedMotion();
  const a11yReducedMotion = useA11yReducedMotion();
  const shouldReduceMotion = prefersReducedMotion || a11yReducedMotion;

  if (shouldReduceMotion) {
    return <>{children}</>;
  }

  return (
    <AnimatePresence {...props}>
      {children}
    </AnimatePresence>
  );
};

// Specialized motion components
export const PageTransition = ({ children, className = '', ...props }) => (
  <SafeMotion 
    variant="pageTransition" 
    className={className}
    {...props}
  >
    {children}
  </SafeMotion>
);

export const FadeIn = ({ children, className = '', delay = 0, ...props }) => (
  <SafeMotion 
    variant="fadeIn"
    custom={{
      animate: {
        ...motionVariants.fadeIn.animate,
        transition: {
          ...motionVariants.fadeIn.animate.transition,
          delay: safeDelay(delay)
        }
      }
    }}
    className={className}
    {...props}
  >
    {children}
  </SafeMotion>
);

export const SlideUp = ({ children, className = '', delay = 0, ...props }) => (
  <SafeMotion 
    variant="slideUp"
    custom={{
      animate: {
        ...motionVariants.slideUp.animate,
        transition: {
          ...motionVariants.slideUp.animate.transition,
          delay: safeDelay(delay)
        }
      }
    }}
    className={className}
    {...props}
  >
    {children}
  </SafeMotion>
);

export const ScaleIn = ({ children, className = '', delay = 0, ...props }) => (
  <SafeMotion 
    variant="scaleIn"
    custom={{
      animate: {
        ...motionVariants.scaleIn.animate,
        transition: {
          ...motionVariants.scaleIn.animate.transition,
          delay: safeDelay(delay)
        }
      }
    }}
    className={className}
    {...props}
  >
    {children}
  </SafeMotion>
);

export const StaggerContainer = ({ children, className = '', ...props }) => (
  <SafeMotion 
    variant="staggerContainer"
    className={className}
    {...props}
  >
    {children}
  </SafeMotion>
);

export const StaggerItem = ({ children, className = '', ...props }) => (
  <SafeMotion 
    variant="staggerItem"
    className={className}
    {...props}
  >
    {children}
  </SafeMotion>
);

// Interactive motion component for buttons and clickable elements
export const InteractiveMotion = ({ 
  children, 
  className = '',
  disabled = false,
  whileHover,
  whileTap,
  ...props 
}) => {
  const prefersReducedMotion = useReducedMotion();
  const a11yReducedMotion = useA11yReducedMotion();
  const shouldReduceMotion = prefersReducedMotion || a11yReducedMotion;

  if (shouldReduceMotion || disabled) {
    return (
      <div className={className} {...props}>
        {children}
      </div>
    );
  }

  return (
    <motion.div
      className={className}
      whileHover={whileHover || motionVariants.hover}
      whileTap={whileTap || motionVariants.tap}
      {...props}
    >
      {children}
    </motion.div>
  );
};

export default SafeMotion;
