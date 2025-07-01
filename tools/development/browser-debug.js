
// Copy and paste this into your browser console
(function() {
  const component = localStorage.getItem('LAST_COMPONENT_LOADED');
  const time = localStorage.getItem('LAST_COMPONENT_LOAD_TIME');
  
  if (component && time) {
    console.log('%cLast Component Loaded', 'font-weight: bold; font-size: 16px; color: blue;');
    console.log(`File: ${component}`);
    console.log(`Time: ${time}`);
    console.log(`Age: ${Math.round((new Date() - new Date(time)) / 1000)} seconds ago`);
  } else {
    console.log('%cNo component load information found', 'color: red');
  }
})();
