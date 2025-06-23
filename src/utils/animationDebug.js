/**
 * Animation Debug Utility
 * PropAgentic - Comprehensive animation error debugging and prevention
 * 
 * This utility helps identify and prevent Web Animations API (WAAPI) errors
 * related to invalid delay values and other animation timing issues.
 */

// Animation timing validation and debugging
export const AnimationDebug = {
  // Enable debug mode in development
  debugMode: process.env.NODE_ENV === 'development',
  
  // Log animation errors to console
  logError: function(error, context = '') {
    if (this.debugMode) {
      console.group('🎬 Animation Debug Error');
      console.error(`Context: ${context}`);
      console.error('Error:', error);
      console.trace();
      console.groupEnd();
    }
  },

  // Validate and sanitize delay values
  validateDelay: function(delay, fallback = 0, context = '') {
    // Check for various invalid values
    if (delay === null || delay === undefined) {
      this.debugMode && console.warn(`Animation Debug: null/undefined delay in ${context}, using fallback:`, fallback);
      return fallback;
    }
    
    if (typeof delay !== 'number') {
      this.debugMode && console.warn(`Animation Debug: non-number delay (${typeof delay}) in ${context}:`, delay, 'using fallback:', fallback);
      return fallback;
    }
    
    if (isNaN(delay)) {
      this.debugMode && console.warn(`Animation Debug: NaN delay in ${context}, using fallback:`, fallback);
      return fallback;
    }
    
    if (!isFinite(delay)) {
      this.debugMode && console.warn(`Animation Debug: non-finite delay in ${context}:`, delay, 'using fallback:', fallback);
      return fallback;
    }
    
    if (delay < 0) {
      this.debugMode && console.warn(`Animation Debug: negative delay in ${context}:`, delay, 'using fallback:', Math.max(0, fallback));
      return Math.max(0, fallback);
    }
    
    return delay;
  },

  // Validate animation timing object
  validateTiming: function(timing, context = '') {
    if (!timing || typeof timing !== 'object') {
      this.debugMode && console.warn(`Animation Debug: invalid timing object in ${context}:`, timing);
      return {};
    }
    
    const validated = {};
    
    // Validate each timing property
    Object.keys(timing).forEach(key => {
      const value = timing[key];
      
      switch (key) {
        case 'delay':
        case 'duration':
        case 'endDelay':
          validated[key] = this.validateDelay(value, 0, `${context}.${key}`);
          break;
          
        case 'iterations':
          if (typeof value === 'number' && isFinite(value) && value >= 0) {
            validated[key] = value;
          } else if (value === 'infinite' || value === Infinity) {
            validated[key] = Infinity;
          } else {
            this.debugMode && console.warn(`Animation Debug: invalid iterations in ${context}:`, value);
            validated[key] = 1;
          }
          break;
          
        case 'direction':
          if (['normal', 'reverse', 'alternate', 'alternate-reverse'].includes(value)) {
            validated[key] = value;
          } else {
            this.debugMode && console.warn(`Animation Debug: invalid direction in ${context}:`, value);
            validated[key] = 'normal';
          }
          break;
          
        case 'fill':
          if (['none', 'forwards', 'backwards', 'both'].includes(value)) {
            validated[key] = value;
          } else {
            this.debugMode && console.warn(`Animation Debug: invalid fill in ${context}:`, value);
            validated[key] = 'none';
          }
          break;
          
        default:
          // Pass through other properties as-is (like easing, composite)
          validated[key] = value;
      }
    });
    
    return validated;
  },

  // Safe wrapper for element.animate()
  safeAnimate: function(element, keyframes, options = {}, context = '') {
    try {
      // Validate element
      if (!element || typeof element.animate !== 'function') {
        this.logError('Invalid element or element.animate not supported', context);
        return null;
      }
      
      // Validate and sanitize options
      const safeOptions = this.validateTiming(options, context);
      
      // Attempt animation
      const animation = element.animate(keyframes, safeOptions);
      
      // Add error handler
      if (animation && typeof animation.addEventListener === 'function') {
        animation.addEventListener('error', (error) => {
          this.logError(error, `${context} - runtime error`);
        });
      }
      
      return animation;
      
    } catch (error) {
      this.logError(error, context);
      return null;
    }
  },

  // Debug array mapping delay calculations
  debugArrayDelay: function(array, multiplier, context = '') {
    if (!Array.isArray(array)) {
      this.debugMode && console.warn(`Animation Debug: ${context} - not an array:`, array);
      return [];
    }
    
    return array.map((item, index) => {
      const delay = this.validateDelay(index * multiplier, 0, `${context}[${index}]`);
      if (this.debugMode && delay !== index * multiplier) {
        console.warn(`Animation Debug: ${context}[${index}] - delay calculation fixed:`, index * multiplier, '->', delay);
      }
      return { ...item, calculatedDelay: delay };
    });
  },

  // Monitor WAAPI errors globally
  setupGlobalErrorHandler: function() {
    if (typeof window !== 'undefined' && this.debugMode) {
      // Catch unhandled promise rejections from animations
      window.addEventListener('unhandledrejection', (event) => {
        if (event.reason && event.reason.message && 
            (event.reason.message.includes('animate') || 
             event.reason.message.includes('WAAPI') ||
             event.reason.message.includes('non-finite'))) {
          
          console.group('🎬 Animation WAAPI Error Detected');
          console.error('Unhandled animation error:', event.reason);
          console.warn('This is likely a Web Animations API timing error');
          console.info('Check for invalid delay, duration, or other timing values');
          console.groupEnd();
          
          // Prevent the error from propagating
          event.preventDefault();
        }
      });
      
      // Override console.error to catch WAAPI errors
      const originalError = console.error;
      console.error = (...args) => {
        const message = args.join(' ');
        if (message.includes('non-finite') && message.includes('animate')) {
          console.group('🎬 Animation Timing Error Intercepted');
          console.warn('WAAPI Error Details:', ...args);
          console.info('This error has been caught and logged by AnimationDebug');
          console.info('Check your animation delay/duration values for NaN, Infinity, or undefined');
          console.groupEnd();
        } else {
          originalError.apply(console, args);
        }
      };
    }
  }
};

// Export convenience functions
export const safeDelay = (delay, fallback = 0, context = '') => 
  AnimationDebug.validateDelay(delay, fallback, context);

export const safeTiming = (timing, context = '') => 
  AnimationDebug.validateTiming(timing, context);

export const safeAnimate = (element, keyframes, options, context = '') => 
  AnimationDebug.safeAnimate(element, keyframes, options, context);

// Initialize global error handling in development
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  AnimationDebug.setupGlobalErrorHandler();
}

export default AnimationDebug; 