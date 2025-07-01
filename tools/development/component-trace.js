// Component Tracing Script
// This script adds console.log statements to all TenantDashboard components
// to help identify which one is actually being used

const fs = require('fs');
const path = require('path');

// Paths to all TenantDashboard components
const componentPaths = [
  'src/pages/tenant/TenantDashboard.jsx',
  'src/components/tenant/TenantDashboard.jsx',
  'src/pages/TenantDashboard.jsx',
  'src/pages/TenantDashboardOld.js'
];

// Inject logger at the beginning of each component
componentPaths.forEach(componentPath => {
  if (fs.existsSync(componentPath)) {
    console.log(`Adding trace logger to ${componentPath}`);
    
    // Read file
    let content = fs.readFileSync(componentPath, 'utf8');
    
    // Check if it's already instrumented
    if (content.includes('COMPONENT_TRACE_LOGGER')) {
      console.log(`  Already instrumented, skipping`);
      return;
    }
    
    // Create a unique ID based on file path
    const componentId = path.basename(componentPath);
    
    // Check if it's a React component
    if (content.includes('function') && content.includes('return') || 
        content.includes('class') && content.includes('render')) {
      
      // Find the start of the component function/class
      let insertPosition;
      
      if (content.includes('export default function')) {
        // Function component with default export
        insertPosition = content.indexOf('export default function') + 'export default function'.length;
        // Find the opening bracket
        const nameEndPosition = content.indexOf('{', insertPosition);
        // Insert after the opening bracket
        insertPosition = nameEndPosition + 1;
      } 
      else if (content.includes('function') && content.includes('return')) {
        // Regular function component
        insertPosition = content.indexOf('function') + 'function'.length;
        // Find the name and parameters
        const nameEndPosition = content.indexOf('{', insertPosition);
        // Insert after the opening bracket
        insertPosition = nameEndPosition + 1;
      }
      else if (content.includes('const') && content.includes('=>')) {
        // Arrow function component
        insertPosition = content.indexOf('=>') + '=>'.length;
        // Find the opening bracket
        const bracketPosition = content.indexOf('{', insertPosition);
        // Insert after the opening bracket
        insertPosition = bracketPosition + 1;
      }
      else if (content.includes('class') && content.includes('render')) {
        // Class component, insert in render method
        insertPosition = content.indexOf('render() {') + 'render() {'.length;
        // If render isn't found that way, try another pattern
        if (insertPosition === -1 + 'render() {'.length) {
          insertPosition = content.indexOf('render () {') + 'render () {'.length;
        }
      }
      
      if (insertPosition) {
        // Create the logging snippet
        const loggingSnippet = `\n  // COMPONENT_TRACE_LOGGER
  console.log('COMPONENT_LOADED: ${componentId}');
  // Save to local storage for debugging
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem('LAST_COMPONENT_LOADED', '${componentId}');
      localStorage.setItem('LAST_COMPONENT_LOAD_TIME', new Date().toISOString());
    } catch (e) {
      console.error('Could not write to localStorage');
    }
  }\n`;
        
        // Insert the logging code
        content = content.slice(0, insertPosition) + loggingSnippet + content.slice(insertPosition);
        
        // Write back to file
        fs.writeFileSync(componentPath, content, 'utf8');
        console.log(`  Successfully added trace logger`);
      } else {
        console.log(`  Could not find insertion point`);
      }
    } else {
      console.log(`  Not a React component, skipping`);
    }
  } else {
    console.log(`Component file ${componentPath} does not exist`);
  }
});

// Create a helper script to read the last loaded component
const helperScriptContent = `// Helper to check which component was last loaded
// Import and use in your app or run directly with Node

function checkLastLoadedComponent() {
  if (typeof window !== 'undefined' && window.localStorage) {
    const component = localStorage.getItem('LAST_COMPONENT_LOADED');
    const time = localStorage.getItem('LAST_COMPONENT_LOAD_TIME');
    
    if (component && time) {
      console.log(\`Last loaded component: \${component} at \${time}\`);
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
`;

fs.writeFileSync('check-component-load.js', helperScriptContent, 'utf8');
console.log('\nCreated helper script: check-component-load.js');

console.log('\nInstructions:');
console.log('1. Run your application');
console.log('2. Login as a tenant');
console.log('3. Navigate to the tenant dashboard');
console.log('4. Open browser console to see which component loaded');
console.log('5. Alternatively, check localStorage for LAST_COMPONENT_LOADED');

// Create a browser script for debugging
const browserConsoleScript = `
// Copy and paste this into your browser console
(function() {
  const component = localStorage.getItem('LAST_COMPONENT_LOADED');
  const time = localStorage.getItem('LAST_COMPONENT_LOAD_TIME');
  
  if (component && time) {
    console.log('%cLast Component Loaded', 'font-weight: bold; font-size: 16px; color: blue;');
    console.log(\`File: \${component}\`);
    console.log(\`Time: \${time}\`);
    console.log(\`Age: \${Math.round((new Date() - new Date(time)) / 1000)} seconds ago\`);
  } else {
    console.log('%cNo component load information found', 'color: red');
  }
})();
`;

fs.writeFileSync('browser-debug.js', browserConsoleScript, 'utf8');
console.log('Created browser console script: browser-debug.js'); 