import React from 'react';

/**
 * Check for React 19 compatibility issues
 * @returns {Object} - Object with compatibility status and issues
 */
export const checkReact19Compatibility = () => {
  const reactVersion = React.version;
  const isReact19 = reactVersion.startsWith('19');
  
  const issues = [];
  
  if (isReact19) {
    // Check for framer-motion compatibility
    try {
      const framerMotion = require('framer-motion');
      const version = framerMotion.version || 'unknown';
      const minVersion = '10.0.0'; // Adjust based on React 19 compatibility
      
      if (version < minVersion) {
        issues.push({
          component: 'framer-motion',
          version: version,
          minRecommendedVersion: minVersion,
          severity: 'high'
        });
      }
    } catch (error) {
      console.log('Failed to check framer-motion version:', error);
    }
    
    // Add other React 19 compatibility checks as needed
  }
  
  return {
    reactVersion,
    isReact19,
    issues,
    isCompatible: issues.length === 0
  };
};

/**
 * Feature detection for modern browser features needed by the app
 * @returns {Object} - Object with feature detection results
 */
export const checkBrowserFeatures = () => {
  const features = {
    intersectionObserver: typeof IntersectionObserver !== 'undefined',
    flexGap: true, // Would need a proper detection method
    webAnimations: typeof Element !== 'undefined' && typeof Element.prototype.animate !== 'undefined',
    shadowDOM: typeof Element !== 'undefined' && typeof Element.prototype.attachShadow !== 'undefined',
    webComponents: typeof customElements !== 'undefined'
  };
  
  const missingFeatures = Object.entries(features)
    .filter(([_, supported]) => !supported)
    .map(([feature]) => feature);
  
  return {
    features,
    missingFeatures,
    isCompatible: missingFeatures.length === 0
  };
};

/**
 * Check for rendering engine compatibility issues
 * @returns {Object} - Object with compatibility info
 */
export const checkRenderingEngineCompatibility = () => {
  const ua = navigator.userAgent;
  
  // Detect browser/engine
  const isChrome = /Chrome/.test(ua) && /Google Inc/.test(navigator.vendor);
  const isSafari = /Safari/.test(ua) && /Apple Computer/.test(navigator.vendor);
  const isFirefox = /Firefox/.test(ua);
  const isEdge = /Edg/.test(ua);
  
  // Extract version (simplified)
  let browserVersion = 'unknown';
  try {
    if (isChrome) {
      browserVersion = ua.match(/Chrome\/([0-9.]+)/)[1];
    } else if (isSafari) {
      browserVersion = ua.match(/Version\/([0-9.]+)/)[1];
    } else if (isFirefox) {
      browserVersion = ua.match(/Firefox\/([0-9.]+)/)[1];
    } else if (isEdge) {
      browserVersion = ua.match(/Edg\/([0-9.]+)/)[1];
    }
  } catch (e) {
    console.error('Error parsing browser version:', e);
  }
  
  const engine = isChrome || isEdge ? 'Blink' : 
                 isSafari ? 'WebKit' : 
                 isFirefox ? 'Gecko' : 'Unknown';
  
  return {
    browser: isChrome ? 'Chrome' : 
             isSafari ? 'Safari' : 
             isFirefox ? 'Firefox' : 
             isEdge ? 'Edge' : 'Unknown',
    browserVersion,
    engine,
    hasKnownIssues: false // Implement specific checks as needed
  };
};

/**
 * Run all compatibility checks
 * @returns {Object} - Comprehensive compatibility information
 */
export const runCompatibilityChecks = () => {
  const react19 = checkReact19Compatibility();
  const browserFeatures = checkBrowserFeatures();
  const renderingEngine = checkRenderingEngineCompatibility();
  
  return {
    react19,
    browserFeatures,
    renderingEngine,
    isFullyCompatible: react19.isCompatible && browserFeatures.isCompatible && !renderingEngine.hasKnownIssues
  };
};

export default {
  checkReact19Compatibility,
  checkBrowserFeatures,
  checkRenderingEngineCompatibility,
  runCompatibilityChecks
}; 