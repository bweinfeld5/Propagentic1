/**
 * Utility functions for checking browser and library compatibility
 */

import React from 'react';
import { SafeMotion } from "../shared/SafeMotion";

/**
 * Check if framer-motion is compatible with the current React version
 * @returns {boolean} True if compatible, false otherwise
 */
export const isFramerMotionCompatible = () => {
  try {
    // Try creating a simple motion component
    const MotionDiv = motion.div;
    // If createElement doesn't throw an error, motion should be compatible
    React.createElement(MotionDiv, { initial: { opacity: 0 } });
    return true;
  } catch (error) {
    console.warn('Framer Motion compatibility check failed:', error);
    return false;
  }
};

/**
 * Check if the browser supports modern CSS features like CSS Grid
 * @returns {boolean} True if the browser supports modern CSS
 */
export const hasModernCSSSupport = () => {
  if (typeof window === 'undefined') return false;
  
  // Check for CSS Grid support
  return 'CSS' in window && 
    'supports' in window.CSS && 
    window.CSS.supports('display', 'grid');
};

/**
 * Check if the browser supports the Intersection Observer API
 * @returns {boolean} True if Intersection Observer is supported
 */
export const hasIntersectionObserverSupport = () => {
  return typeof IntersectionObserver !== 'undefined';
};

/**
 * Check if the browser supports the Web Animations API
 * @returns {boolean} True if Web Animations API is supported
 */
export const hasWebAnimationsSupport = () => {
  return typeof Element !== 'undefined' && 
    typeof Element.prototype.animate === 'function';
};

/**
 * Get overall feature support for the current environment
 * @returns {Object} Object containing support status for various features
 */
export const getFeatureSupport = () => {
  return {
    framerMotion: isFramerMotionCompatible(),
    modernCSS: hasModernCSSSupport(),
    intersectionObserver: hasIntersectionObserverSupport(),
    webAnimations: hasWebAnimationsSupport(),
  };
};

/**
 * Determine if the environment should use enhanced UI features
 * @returns {boolean} True if enhanced UI should be used
 */
export const shouldUseEnhancedUI = () => {
  const support = getFeatureSupport();
  
  // Require key features for enhanced UI
  return support.framerMotion && 
    support.modernCSS && 
    support.intersectionObserver;
};

/**
 * Log compatibility information to the console in development
 */
export const logCompatibilityInfo = () => {
  if (process.env.NODE_ENV !== 'production') {
    const support = getFeatureSupport();
    
    console.group('PropAgentic Feature Compatibility');
    console.log('React Version:', React.version);
    console.log('Framer Motion:', support.framerMotion ? '✅ Compatible' : '❌ Not Compatible');
    console.log('Modern CSS:', support.modernCSS ? '✅ Supported' : '❌ Not Supported');
    console.log('Intersection Observer:', support.intersectionObserver ? '✅ Supported' : '❌ Not Supported');
    console.log('Web Animations:', support.webAnimations ? '✅ Supported' : '❌ Not Supported');
    console.log('UI Mode:', shouldUseEnhancedUI() ? 'Enhanced' : 'Basic');
    console.groupEnd();
  }
}; 