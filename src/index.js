import React from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import './styles/theme.css';
import App from './App';
import { ModelContextProvider } from './contexts/ModelContext';

console.log('Starting React application...');
console.log('React version:', React.version);

// Check for React 19 compatibility issues
const isReact19 = React.version.startsWith('19');
if (isReact19) {
  console.log('Using React 19 - ensuring compatibility with libraries');
  // Register a global error handler for any framer-motion or other library issues
  window.__REACT19_COMPAT_MODE = true;
}

// Global error handler for React rendering errors
window.addEventListener('error', (event) => {
  console.error('Global error caught in event listener:', event.error);
  if (event.error && event.error.message && event.error.message.includes('framer-motion')) {
    console.error('Framer Motion error detected. This could be a React 19 compatibility issue.');
  }
});

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
  console.log('Attempting to render React app using createRoot...');
  const rootElement = document.getElementById('root');
  
  if (!rootElement) {
    throw new Error('Could not find root element to mount React app');
  }
  
  // Create a root.
  const root = createRoot(rootElement);
  
  // Initialize ModelContextProvider with configuration from env variables
  const modelContextConfig = {
    model: process.env.REACT_APP_DEFAULT_MODEL || 'gpt-3.5-turbo',
    temperature: process.env.REACT_APP_DEFAULT_TEMPERATURE ? 
      parseFloat(process.env.REACT_APP_DEFAULT_TEMPERATURE) : 0.3,
    maxTokens: process.env.REACT_APP_DEFAULT_MAX_TOKENS ? 
      parseInt(process.env.REACT_APP_DEFAULT_MAX_TOKENS, 10) : 1000,
    apiKey: process.env.REACT_APP_OPENAI_API_KEY
  };
  
  // Verify that we have an API key
  if (!modelContextConfig.apiKey) {
    console.warn('OpenAI API key is not set. AI features will not work properly.');
  } else {
    console.log('OpenAI API key is configured. AI features should work properly.');
  }
  
  // Initial render: Render an element to the root.
  root.render(
    <React.StrictMode>
      <ModelContextProvider initialConfig={modelContextConfig}>
        <App />
      </ModelContextProvider>
    </React.StrictMode>
  );
  console.log('React app rendered successfully using createRoot');
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
