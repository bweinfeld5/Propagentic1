import React, { createElement, forwardRef } from 'react';

/**
 * SafeMotion - A compatibility layer for framer-motion with React 19
 * Provides fallbacks when framer-motion is not available
 */

// Define types for motion elements
/**
 * @typedef {Object} MotionProps
 * @property {any} [initial]
 * @property {any} [animate]
 * @property {any} [exit]
 * @property {any} [transition]
 * @property {any} [whileHover]
 * @property {any} [whileTap]
 * @property {any} [whileInView]
 * @property {any} [viewport]
 * @property {any} [variants]
 */

/**
 * @typedef {Object} AnimatePresenceProps
 * @property {React.ReactNode} children
 * @property {'sync' | 'wait' | 'popLayout'} [mode]
 * @property {boolean} [initial]
 * @property {() => void} [onExitComplete]
 * @property {boolean} [exitBeforeEnter]
 * @property {boolean} [presenceAffectsLayout]
 */

// Create fallback elements
const createFallbackElement = (elementType) => {
  return forwardRef((props, ref) => {
    // Filter out motion-specific props to prevent warnings
    const {
      initial, animate, exit, transition, whileHover, 
      whileTap, whileInView, viewport, variants,
      ...restProps
    } = props;
    
    return createElement(elementType, { ...restProps, ref });
  });
};

// Create fallback AnimatePresence component
const AnimatePresence = forwardRef(({ children, mode }, ref) => <>{children}</>);

/**
 * @typedef {Object} SafeMotionType
 * @property {React.ForwardRefExoticComponent} div
 * @property {React.ForwardRefExoticComponent} span
 * @property {React.ForwardRefExoticComponent} img
 * @property {React.ForwardRefExoticComponent} button
 * @property {React.ForwardRefExoticComponent} a
 * @property {React.ForwardRefExoticComponent} ul
 * @property {React.ForwardRefExoticComponent} li
 * @property {React.ForwardRefExoticComponent} p
 * @property {React.ForwardRefExoticComponent} h1
 * @property {React.ForwardRefExoticComponent} h2
 * @property {React.ForwardRefExoticComponent} h3
 * @property {React.ForwardRefExoticComponent} h4
 * @property {React.ForwardRefExoticComponent} h5
 * @property {React.ForwardRefExoticComponent} h6
 * @property {React.ForwardRefExoticComponent} header
 * @property {React.ForwardRefExoticComponent} footer
 * @property {React.ForwardRefExoticComponent} nav
 * @property {React.ForwardRefExoticComponent} form
 * @property {React.ForwardRefExoticComponent} section
 * @property {React.ForwardRefExoticComponent} article
 * @property {React.ForwardRefExoticComponent} aside
 * @property {React.ForwardRefExoticComponent} main
 */

/** @type {SafeMotionType} */
const SafeMotion = {
  div: createFallbackElement('div'),
  span: createFallbackElement('span'),
  img: createFallbackElement('img'),
  button: createFallbackElement('button'),
  a: createFallbackElement('a'),
  ul: createFallbackElement('ul'),
  li: createFallbackElement('li'),
  p: createFallbackElement('p'),
  h1: createFallbackElement('h1'),
  h2: createFallbackElement('h2'),
  h3: createFallbackElement('h3'),
  h4: createFallbackElement('h4'),
  h5: createFallbackElement('h5'),
  h6: createFallbackElement('h6'),
  header: createFallbackElement('header'),
  footer: createFallbackElement('footer'),
  nav: createFallbackElement('nav'),
  form: createFallbackElement('form'),
  section: createFallbackElement('section'),
  article: createFallbackElement('article'),
  aside: createFallbackElement('aside'),
  main: createFallbackElement('main')
};

export { SafeMotion, AnimatePresence };

// Helper function to check if framer-motion is available (always returns false in this fallback)
export const isFramerMotionAvailable = () => Promise.resolve(false); 