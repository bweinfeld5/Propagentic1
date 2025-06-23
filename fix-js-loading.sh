#!/bin/bash

echo "Creating a troubleshooting HTML file..."
cat > public/test-js.html << 'EOL'
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>JS Test</title>
</head>
<body>
  <h1>JavaScript Loading Test</h1>
  <p>This page tests if JavaScript files are being properly served.</p>
  <div id="result">Testing...</div>

  <script>
    document.getElementById('result').innerText = 'JavaScript is working!';
    
    // Try to load the main bundle
    const script = document.createElement('script');
    script.src = '/static/js/main.a27f7f5e.js'; // Use your actual bundle name
    script.onerror = () => {
      document.getElementById('result').innerText = 'Error: Failed to load JavaScript bundle!';
    };
    script.onload = () => {
      document.getElementById('result').innerText += ' Bundle loaded successfully!';
    };
    document.body.appendChild(script);
  </script>
</body>
</html>
EOL

echo "Creating a clean index.js..."
cat > src/index.js.clean << 'EOL'
import React from 'react';
import ReactDOM from 'react-dom';
import App from './App';
import './index.css';

// Simple React 17 rendering approach
try {
  console.log('React render starting...');
  ReactDOM.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>,
    document.getElementById('root')
  );
  console.log('React render complete!');
} catch (error) {
  console.error("Error rendering React app:", error);
  document.body.innerHTML += `
    <div style="color: red; padding: 20px; margin: 20px; border: 1px solid red;">
      <h2>React Error</h2>
      <p>${error.message}</p>
      <pre>${error.stack}</pre>
    </div>
  `;
}
EOL

echo "Moving clean index.js..."
mv src/index.js.clean src/index.js

echo "Done!" 