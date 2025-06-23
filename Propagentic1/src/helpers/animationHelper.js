/**
 * Animation Helper - Utilities to handle animation fallbacks for React 19 compatibility
 */

// Check if animations can be safely used
export const canUseAnimations = () => {
  try {
    // Try to create a simple animation with framer-motion API
    const elem = document.createElement('div');
    const testKey = '__test_animation_key_' + Math.random().toString(36).substring(2, 15);
    
    // Store original console.error
    const originalConsoleError = console.error;
    let errorThrown = false;
    
    // Override console.error temporarily to catch errors
    console.error = (...args) => {
      errorThrown = true;
      // Optional: check args to see if error is animation related
    };
    
    // Try to run simple animation code
    try {
      // We won't actually use framer-motion here to avoid import,
      // just simulate what might fail
      elem.style.transition = 'opacity 0.5s ease';
      elem.style.opacity = '0';
      setTimeout(() => {
        elem.style.opacity = '1';
      }, 50);
      
      // Clean up
      setTimeout(() => {
        document.body.removeChild(elem);
      }, 100);
    } catch (err) {
      errorThrown = true;
    }
    
    // Restore console.error
    console.error = originalConsoleError;
    
    return !errorThrown;
  } catch (e) {
    console.warn('Animation compatibility check failed:', e);
    return false;
  }
};

// Setup animation fallbacks and preferences
export const setupAnimations = () => {
  const disableAnimations = localStorage.getItem('disableAnimations') === 'true';
  
  if (disableAnimations) {
    console.info('Animations are disabled by user preference');
    return false;
  }
  
  // Check if we should/can use animations
  const canUse = canUseAnimations();
  
  // If animations are problematic, save this preference
  if (!canUse) {
    console.warn('Animations may cause issues, disabling for better performance');
    localStorage.setItem('disableAnimations', 'true');
  }
  
  return canUse;
};

// Disable animations globally (can be called by error handling code)
export const disableAnimations = () => {
  localStorage.setItem('disableAnimations', 'true');
  console.info('Animations have been disabled. Refresh the page for this to take effect.');
  
  // Add a CSS class to document for immediate effect
  document.documentElement.classList.add('animations-disabled');
  
  // Apply some immediate CSS if needed
  const style = document.createElement('style');
  style.textContent = `
    .animations-disabled * {
      transition: none !important;
      animation: none !important;
      transform: none !important;
    }
  `;
  document.head.appendChild(style);
  
  return false;
};

// Enable animations (for user preference)
export const enableAnimations = () => {
  localStorage.removeItem('disableAnimations');
  document.documentElement.classList.remove('animations-disabled');
  return true;
};

// Initialize on module import
export const shouldUseAnimations = setupAnimations();

export default {
  canUseAnimations,
  setupAnimations,
  disableAnimations,
  enableAnimations,
  shouldUseAnimations
}; 