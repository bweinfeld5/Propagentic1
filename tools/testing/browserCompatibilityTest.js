/**
 * Browser Compatibility Test Helper
 * 
 * This script adds polyfills and feature detection for critical browser features
 * used by our animation and interactive components. To use:
 * 
 * 1. Include this script in your test environment
 * 2. Call checkCompatibility() to get a report of potential issues
 * 3. Use the applyCompatibilityFixes() to add polyfills where possible
 */

const checkCompatibility = () => {
  const issues = [];
  
  // Check for Intersection Observer support (used for animations)
  if (!('IntersectionObserver' in window)) {
    issues.push({
      feature: 'IntersectionObserver',
      component: ['animations', 'lazy loading'],
      canPolyfill: true,
      severity: 'high',
    });
  }
  
  // Check for Web Animations API (used by framer-motion)
  if (!('animate' in document.createElement('div'))) {
    issues.push({
      feature: 'Web Animations API',
      component: ['page transitions', 'motion components'],
      canPolyfill: true,
      severity: 'high',
    });
  }
  
  // Check for Pointer Events support (used by drag and drop)
  if (!('PointerEvent' in window)) {
    issues.push({
      feature: 'Pointer Events',
      component: ['drag and drop', 'sortable tasks'],
      canPolyfill: true,
      severity: 'medium',
    });
  }
  
  // Check for passive event listeners support
  let passiveSupported = false;
  try {
    const options = {
      get passive() {
        passiveSupported = true;
        return false;
      }
    };
    window.addEventListener('test', null, options);
    window.removeEventListener('test', null, options);
  } catch (err) {
    passiveSupported = false;
  }
  
  if (!passiveSupported) {
    issues.push({
      feature: 'Passive Event Listeners',
      component: ['scrolling', 'touch interactions'],
      canPolyfill: false,
      severity: 'low',
    });
  }
  
  // Check for ResizeObserver (used for responsive charts)
  if (!('ResizeObserver' in window)) {
    issues.push({
      feature: 'ResizeObserver',
      component: ['charts', 'responsive layouts'],
      canPolyfill: true,
      severity: 'medium',
    });
  }
  
  return {
    compatible: issues.length === 0,
    issues,
    browserInfo: {
      userAgent: navigator.userAgent,
      vendor: navigator.vendor,
      platform: navigator.platform
    }
  };
};

const applyCompatibilityFixes = async () => {
  const report = checkCompatibility();
  const appliedFixes = [];
  
  // Only apply fixes for issues that can be polyfilled
  for (const issue of report.issues) {
    if (issue.canPolyfill) {
      switch (issue.feature) {
        case 'IntersectionObserver':
          await loadScript('https://polyfill.io/v3/polyfill.min.js?features=IntersectionObserver');
          appliedFixes.push('IntersectionObserver');
          break;
          
        case 'Web Animations API':
          await loadScript('https://cdn.jsdelivr.net/npm/web-animations-js@2.3.2/web-animations.min.js');
          appliedFixes.push('Web Animations API');
          break;
          
        case 'Pointer Events':
          await loadScript('https://cdn.jsdelivr.net/npm/pepjs@0.5.3/dist/pep.min.js');
          appliedFixes.push('Pointer Events');
          break;
          
        case 'ResizeObserver':
          await loadScript('https://cdn.jsdelivr.net/npm/resize-observer-polyfill@1.5.1/dist/ResizeObserver.min.js');
          appliedFixes.push('ResizeObserver');
          break;
      }
    }
  }
  
  return {
    originalIssues: report.issues.length,
    fixesApplied: appliedFixes.length,
    remainingIssues: report.issues.length - appliedFixes.length,
    appliedFixes
  };
};

const loadScript = (src) => {
  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = src;
    script.onload = resolve;
    script.onerror = reject;
    document.head.appendChild(script);
  });
};

// For Node.js environments (testing)
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    checkCompatibility,
    applyCompatibilityFixes
  };
}

// Add to window for browser environments
if (typeof window !== 'undefined') {
  window.PropAgentic = window.PropAgentic || {};
  window.PropAgentic.compat = {
    checkCompatibility,
    applyCompatibilityFixes
  };
} 