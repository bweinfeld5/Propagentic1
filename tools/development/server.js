const express = require('express');
const path = require('path');
const fs = require('fs');
const compression = require('compression');

const app = express();
const PORT = process.env.PORT || 3000;

// Use compression for all responses
app.use(compression());

// Serve static files from the build directory
app.use(express.static(path.join(__dirname, 'build'), {
  // Set caching headers
  setHeaders: (res, filePath) => {
    // For JavaScript and CSS files, cache for 1 week
    if (filePath.endsWith('.js') || filePath.endsWith('.css')) {
      res.setHeader('Cache-Control', 'public, max-age=604800');
    }
    // For HTML files, don't cache
    else if (filePath.endsWith('.html')) {
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    }
    // For other assets, cache for 1 month
    else {
      res.setHeader('Cache-Control', 'public, max-age=2592000');
    }
  }
}));

// Serve the 404.html directly for /404 route (for testing)
app.get('/404', (req, res) => {
  res.sendFile(path.join(__dirname, 'build', '404.html'));
});

// For all other routes, serve index.html
app.get('*', (req, res) => {
  // Check if requested file exists in the build folder
  const filePath = path.join(__dirname, 'build', req.path);
  
  // If the file exists, serve it
  if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
    return res.sendFile(filePath);
  }
  
  // Otherwise send index.html for client-side routing
  res.sendFile(path.join(__dirname, 'build', 'index.html'));
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
  console.log(`Serving the build directory: ${path.join(__dirname, 'build')}`);
  console.log('Press Ctrl+C to stop the server');
}); 