// Helper to check which component was last loaded
// Import and use in your app or run directly with Node

function checkLastLoadedComponent() {
  if (typeof window !== 'undefined' && window.localStorage) {
    const component = localStorage.getItem('LAST_COMPONENT_LOADED');
    const time = localStorage.getItem('LAST_COMPONENT_LOAD_TIME');
    
    if (component && time) {
      console.log(`Last loaded component: ${component} at ${time}`);
      return { component, time };
    } else {
      console.log('No component load information found');
      return null;
    }
  } else {
    console.log('localStorage not available');
    return null;
  }
}

// For direct Node execution
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { checkLastLoadedComponent };
  
  // If run directly
  if (require.main === module) {
    console.log('Run this in your browser console or import in your app');
  }
}
