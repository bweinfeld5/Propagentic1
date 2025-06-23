import React from 'react';
import PropTypes from 'prop-types';
import { useLocation } from 'react-router-dom';
import PageTransition from '../shared/PageTransition';
import { SafeMotion, AnimatePresence } from "../shared/SafeMotion";

/**
 * AnimatedPageLayout Component
 * 
 * A layout wrapper that applies page transition animations when 
 * navigating between routes, providing a smoother user experience.
 * 
 * Usage:
 * ```jsx
 * <AnimatedPageLayout transitionType="fade">
 *   {children}
 * </AnimatedPageLayout>
 * ```
 */
const AnimatedPageLayout = ({ 
  children, 
  transitionType = 'fade', 
  duration = 0.3,
  className = '' 
}) => {
  const location = useLocation();
  
  return (
    <div className={`w-full h-full ${className}`}>
      <AnimatePresence mode="wait">
        <PageTransition 
          key={location.pathname} 
          transitionType={transitionType}
          duration={duration}
        >
          {children}
        </PageTransition>
      </AnimatePresence>
    </div>
  );
};

AnimatedPageLayout.propTypes = {
  children: PropTypes.node.isRequired,
  transitionType: PropTypes.oneOf(['fade', 'slideUp', 'slideRight', 'scale', 'dashboardTransition']),
  duration: PropTypes.number,
  className: PropTypes.string
};

export default AnimatedPageLayout; 