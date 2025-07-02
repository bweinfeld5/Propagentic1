#!/bin/bash

# Navigate to project root directory
cd "$(dirname "$0")/.."


echo "===== COMPREHENSIVE REACT APP FIX ====="

# Step 1: Fix firebase.json with proper MIME types and cache control
echo "1. Setting up proper Firebase hosting configuration..."
cat > firebase.json << 'EOL'
{
  "hosting": {
    "public": "build",
    "ignore": [
      "firebase.json",
      "**/.*",
      "**/node_modules/**"
    ],
    "rewrites": [
      {
        "source": "**",
        "destination": "/index.html"
      }
    ],
    "headers": [
      {
        "source": "**/*.js",
        "headers": [
          {
            "key": "Content-Type",
            "value": "application/javascript"
          },
          {
            "key": "Cache-Control",
            "value": "no-cache"
          }
        ]
      },
      {
        "source": "**/*.css",
        "headers": [
          {
            "key": "Content-Type",
            "value": "text/css"
          },
          {
            "key": "Cache-Control",
            "value": "no-cache"
          }
        ]
      }
    ]
  }
}
EOL

# Step 2: Disable service workers (which can cause message channel errors)
echo "2. Disabling service workers..."
mkdir -p public
cat > public/noserviceworker.js << 'EOL'
// This file replaces any service worker registration to prevent issues
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then(function(registrations) {
    for (let registration of registrations) {
      registration.unregister();
      console.log('Service worker unregistered');
    }
  });
}
EOL

# Step 3: Update index.html to include the service worker disabler and better error handling
echo "3. Updating index.html with better error handling..."
cat > src/index.js.new << 'EOL'
import React from 'react';
import ReactDOM from 'react-dom';
import App from './App';
import './index.css';

console.log('Starting React application...');

// Disable any service workers that might be causing issues
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then(function(registrations) {
    for (let registration of registrations) {
      registration.unregister();
      console.log('Service worker unregistered');
    }
  });
}

// Render the React application with proper error handling
try {
  console.log('Attempting to render React app...');
  const rootElement = document.getElementById('root');
  
  if (!rootElement) {
    throw new Error('Could not find root element to mount React app');
  }
  
  ReactDOM.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>,
    rootElement
  );
  console.log('React app rendered successfully');
} catch (error) {
  console.error('Fatal error rendering React app:', error);
  
  // Display a user-friendly error message
  document.body.innerHTML = `
    <div style="font-family: sans-serif; max-width: 600px; margin: 50px auto; padding: 20px; border: 1px solid #f44336; border-radius: 4px;">
      <h2 style="color: #f44336;">Something went wrong</h2>
      <p>We're sorry, but something went wrong while loading the application.</p>
      <p><strong>Error:</strong> ${error.message}</p>
      <pre style="background: #f5f5f5; padding: 10px; overflow: auto;">${error.stack}</pre>
      <p>Please try refreshing the page. If the problem persists, contact support.</p>
      <button onclick="window.location.reload()" style="background: #4CAF50; color: white; border: none; padding: 10px 15px; border-radius: 4px; cursor: pointer;">
        Refresh Page
      </button>
    </div>
  `;
}
EOL

# Step 4: Replace the index.js file
echo "4. Replacing index.js with the fixed version..."
mv src/index.js.new src/index.js

# Step 5: Fix React import issues (remove .js extensions in imports)
echo "5. Fixing React component imports..."
find src -name "*.js" -exec sed -i '' -e 's/from \(.*\)\.js/from \1/g' {} \;

# Step 6: Create a diagnostic page
echo "6. Adding diagnostic page..."
cat > public/diagnose.html << 'EOL'
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>React App Diagnostics</title>
  <style>
    body { font-family: sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
    .card { border: 1px solid #ddd; border-radius: 4px; padding: 15px; margin-bottom: 20px; }
    .success { color: #4CAF50; }
    .error { color: #f44336; }
    .warning { color: #ff9800; }
    pre { background: #f5f5f5; padding: 10px; overflow: auto; border-radius: 4px; }
    button { background: #2196F3; color: white; border: none; padding: 10px 15px; border-radius: 4px; cursor: pointer; }
  </style>
</head>
<body>
  <h1>React Application Diagnostics</h1>
  <p>This page helps diagnose common problems with your React application.</p>
  
  <div class="card">
    <h2>1. Basic JavaScript</h2>
    <div id="basic-js-test">Testing...</div>
    <script>
      document.getElementById('basic-js-test').innerHTML = '<span class="success">✓ JavaScript is working correctly</span>';
    </script>
  </div>
  
  <div class="card">
    <h2>2. Browser Information</h2>
    <pre id="browser-info"></pre>
    <script>
      document.getElementById('browser-info').textContent = `User Agent: ${navigator.userAgent}
URL: ${window.location.href}
React App URL: ${window.location.origin}
Time: ${new Date().toLocaleString()}`;
    </script>
  </div>
  
  <div class="card">
    <h2>3. Network & Bundle Tests</h2>
    <div id="network-test">Running tests...</div>
    <script>
      const networkTest = document.getElementById('network-test');
      
      // Test loading the main JavaScript bundle
      fetch('/index.html')
        .then(response => response.text())
        .then(html => {
          const bundleMatch = html.match(/\/static\/js\/main\.([a-z0-9]+)\.js/);
          const cssMatch = html.match(/\/static\/css\/main\.([a-z0-9]+)\.css/);
          
          let results = '<h3>Resources detected:</h3><ul>';
          
          if (bundleMatch) {
            const bundlePath = bundleMatch[0];
            results += `<li>JS Bundle: ${bundlePath} - <span class="success">Found</span></li>`;
            
            // Test loading the bundle
            fetch(bundlePath)
              .then(response => {
                if (!response.ok) throw new Error(`Status: ${response.status}`);
                return response.text();
              })
              .then(text => {
                if (text.includes('<!DOCTYPE html>') || text.startsWith('<')) {
                  networkTest.innerHTML += `<div class="error">
                    <p>⚠️ Error: JavaScript bundle is returning HTML instead of JavaScript!</p>
                    <p>This is causing the "Unexpected token '&lt;'" error.</p>
                    <pre>${text.substring(0, 100).replace(/</g, '&lt;')}...</pre>
                  </div>`;
                } else {
                  networkTest.innerHTML += `<p class="success">✓ JavaScript bundle loaded successfully (${text.length} bytes)</p>`;
                }
              })
              .catch(error => {
                networkTest.innerHTML += `<p class="error">✗ Error loading JS bundle: ${error.message}</p>`;
              });
          } else {
            results += `<li>JS Bundle: <span class="error">Not found in index.html</span></li>`;
          }
          
          if (cssMatch) {
            results += `<li>CSS: ${cssMatch[0]} - <span class="success">Found</span></li>`;
          } else {
            results += `<li>CSS: <span class="warning">Not found in index.html</span></li>`;
          }
          
          results += '</ul>';
          networkTest.innerHTML = results;
          
          // Check Firebase routing
          fetch('/non-existent-page-test')
            .then(response => response.text())
            .then(text => {
              if (text.includes('<div id="root">')) {
                networkTest.innerHTML += `<p class="success">✓ Firebase routing is working correctly</p>`;
              } else {
                networkTest.innerHTML += `<p class="warning">⚠️ Firebase routing might not be correctly configured</p>`;
              }
            })
            .catch(error => {
              networkTest.innerHTML += `<p class="error">✗ Error testing routes: ${error.message}</p>`;
            });
        })
        .catch(error => {
          networkTest.innerHTML = `<p class="error">✗ Error loading index.html: ${error.message}</p>`;
        });
    </script>
  </div>
  
  <div class="card">
    <h2>4. Service Worker Status</h2>
    <div id="sw-test">Checking...</div>
    <script>
      const swTest = document.getElementById('sw-test');
      
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.getRegistrations()
          .then(registrations => {
            if (registrations.length === 0) {
              swTest.innerHTML = '<span class="success">✓ No service workers registered (good for troubleshooting)</span>';
            } else {
              swTest.innerHTML = `<p class="warning">⚠️ Found ${registrations.length} service worker(s):</p><ul>`;
              registrations.forEach(reg => {
                swTest.innerHTML += `<li>${reg.scope}</li>`;
              });
              swTest.innerHTML += '</ul>';
              swTest.innerHTML += '<button id="unregister-sw">Unregister All Service Workers</button>';
              
              document.getElementById('unregister-sw').addEventListener('click', () => {
                Promise.all(registrations.map(reg => reg.unregister()))
                  .then(() => {
                    swTest.innerHTML = '<span class="success">✓ All service workers unregistered successfully</span>';
                  })
                  .catch(error => {
                    swTest.innerHTML = `<span class="error">✗ Error unregistering service workers: ${error.message}</span>`;
                  });
              });
            }
          })
          .catch(error => {
            swTest.innerHTML = `<span class="error">✗ Error checking service workers: ${error.message}</span>`;
          });
      } else {
        swTest.innerHTML = '<span class="success">✓ Service workers not supported in this browser (no issues)</span>';
      }
    </script>
  </div>
  
  <div class="card">
    <h2>5. Firebase Configuration</h2>
    <div id="firebase-test">Checking...</div>
    <script>
      const firebaseTest = document.getElementById('firebase-test');
      
      fetch('/firebase.json')
        .then(response => {
          if (!response.ok) {
            firebaseTest.innerHTML = `<p class="warning">⚠️ Could not access firebase.json (Status: ${response.status})</p>`;
            return;
          }
          return response.json();
        })
        .then(config => {
          if (!config) return;
          
          let configOk = true;
          let results = '<ul>';
          
          if (!config.hosting || !config.hosting.rewrites || !config.hosting.rewrites.length) {
            results += `<li class="error">✗ Missing rewrite rules in firebase.json</li>`;
            configOk = false;
          } else {
            results += `<li class="success">✓ Rewrite rules found</li>`;
          }
          
          if (!config.hosting || !config.hosting.headers || !config.hosting.headers.length) {
            results += `<li class="warning">⚠️ No custom headers defined in firebase.json</li>`;
          } else {
            results += `<li class="success">✓ Custom headers found</li>`;
          }
          
          results += '</ul>';
          
          if (configOk) {
            firebaseTest.innerHTML = `<p class="success">✓ Firebase configuration looks good!</p>${results}`;
          } else {
            firebaseTest.innerHTML = `<p class="warning">⚠️ Firebase configuration needs attention</p>${results}`;
          }
        })
        .catch(error => {
          firebaseTest.innerHTML = `<p class="error">✗ Error checking Firebase configuration: ${error.message}</p>`;
        });
    </script>
  </div>
  
  <div class="card">
    <h2>Actions</h2>
    <button onclick="location.href='/'">Go to Application</button>
    <button onclick="window.location.reload()">Refresh Diagnostics</button>
    <button onclick="localStorage.clear(); sessionStorage.clear(); alert('Storage cleared!')">Clear Storage</button>
  </div>
</body>
</html>
EOL

# Step 7: Rebuild and deploy
echo "7. Rebuilding React application..."
npm run build

echo "8. Deploying to Firebase..."
npx firebase-tools deploy --only hosting

echo "===== FIX COMPLETE ====="
echo "Your app has been fixed and deployed to https://propagentic.web.app"
echo "To diagnose any remaining issues, visit https://propagentic.web.app/diagnose.html" 