/**
 * Setup script for Playwright testing
 * 
 * This script:
 * 1. Installs Playwright browser dependencies
 * 2. Creates browser-tests directory for screenshots
 * 3. Sets up the testing environment
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Define paths
const screenshotDirPath = path.join(process.cwd(), 'browser-tests');

// Check if directory exists, create if it doesn't
if (!fs.existsSync(screenshotDirPath)) {
  console.log(`Creating directory: ${screenshotDirPath}`);
  fs.mkdirSync(screenshotDirPath, { recursive: true });
}

console.log('Installing Playwright browsers and dependencies...');

try {
  // Install browsers with automatic acceptance of license
  execSync('npx playwright install --with-deps', { 
    stdio: 'inherit',
    env: { 
      ...process.env, 
      PLAYWRIGHT_BROWSERS_PATH: '0', // Use default location
      PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD: '0', // Ensure browsers are downloaded
      PLAYWRIGHT_SKIP_VALIDATION: '1' // Skip validation
    }
  });
  
  console.log('✅ Playwright setup complete!');
  console.log('');
  console.log('Running integration tests:');
  console.log('  npm run test:integration');
  console.log('');
  console.log('Or run the port manager to handle port conflicts:');
  console.log('  node port-manager.js [preferred-port]');
} catch (error) {
  console.error('❌ Error setting up Playwright:', error.message);
  console.log('');
  console.log('Try running the following commands manually:');
  console.log('  npm install -D playwright @playwright/test --legacy-peer-deps');
  console.log('  npx playwright install --with-deps');
  process.exit(1);
}

// Create an example .env.local file if it doesn't exist
const envLocalPath = path.join(process.cwd(), '.env.local');
if (!fs.existsSync(envLocalPath)) {
  console.log('Creating example .env.local file...');
  const envContent = `# Local environment settings
PORT=3001
REACT_APP_API_URL=http://localhost:8000/api
`;
  fs.writeFileSync(envLocalPath, envContent);
  console.log('✅ Created .env.local with PORT=3001');
} 