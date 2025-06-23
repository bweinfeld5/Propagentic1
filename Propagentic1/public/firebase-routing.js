/**
 * React Router Fix for Firebase Hosting
 * 
 * This script helps redirect 404s back to index.html
 * to support client-side routing with React Router.
 * 
 * Add this script to your 404.html page.
 */

// This single page app routing magic adapted from
// https://github.com/rafgraph/spa-github-pages

(function() {
  // CONFIGURABLE: Number of path segments to keep in the base URL
  // (1 for firebase or github pages, 0 for custom domains)
  const segmentsToKeep = 0; 

  // Get current URL parts
  const location = window.location;
  
  // Only redirect non-API calls and return 404 for API
  if (location.pathname.indexOf('/api/') !== 0) {
    // Redirect logic
    const restOfUrl = location.pathname.slice(1)
      .split('/')
      .slice(segmentsToKeep)
      .join('/')
      .replace(/&/g, '~and~');

    const redirectUrl = 
      location.protocol + '//' + location.hostname + 
      (location.port ? ':' + location.port : '') +
      location.pathname.split('/').slice(0, 1 + segmentsToKeep).join('/') + 
      '/?/' + restOfUrl +
      (location.search ? '&' + location.search.slice(1).replace(/&/g, '~and~') : '') +
      location.hash;

    // Redirect to the clean URL
    window.location.replace(redirectUrl);
  }
})(); 