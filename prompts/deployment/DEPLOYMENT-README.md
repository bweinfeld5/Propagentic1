# PropAgentic Deployment Guide

This guide addresses common deployment issues and provides solutions for a smooth development and deployment process.

## Common Issues and Solutions

### 1. Port Conflicts

When starting the development server, you might encounter a port conflict error:

```
Something is already running on port 3000...
Would you like to run the app on another port instead?
```

#### Solutions:

**Option 1: Automatically handle port conflicts**

Run the application with our port manager tool:

```bash
npm run start:port
```

This will check if port 3000 is available and give you options to:
- Kill the process using port 3000
- Find an available port automatically
- Exit without starting the server

**Option 2: Use a predefined alternative port**

Start the application on port 3001:

```bash
npm run start:alt
```

**Option 3: Manually specify a port**

```bash
PORT=3002 npm run start
```

### 2. Integration Test Failures

If you encounter errors when running integration tests:

#### Missing Playwright Dependencies

Error: `Cannot find module 'playwright'`

Solution:

```bash
# Install Playwright and setup browsers
npm run setup:playwright
```

This script will:
1. Install Playwright and required browsers
2. Create necessary directories
3. Set up configuration files

#### Manual Playwright Setup

If the automatic setup fails, run these commands:

```bash
# Install dependencies
npm install -D playwright @playwright/test --legacy-peer-deps

# Install browser binaries
npx playwright install --with-deps
```

### 3. Running Tests on a Different Port

The integration tests are configured to run on port 3001 by default. If you need to change this:

1. Edit `integration-test.js` and update the `appUrl` in the config object:

```javascript
const config = {
  appUrl: 'http://localhost:YOUR_PORT/ui-showcase',
  // ...other config settings
};
```

2. Make sure your application is running on the specified port before running the tests.

## Development Scripts

| Script | Description |
|--------|-------------|
| `npm run start` | Start development server (default port 3000) |
| `npm run start:alt` | Start development server on port 3001 |
| `npm run start:port` | Start with port management tool |
| `npm run port-check` | Run port manager without starting app |
| `npm run test:integration` | Run integration tests |
| `npm run setup:playwright` | Set up Playwright for testing |
| `npm run check-browser-compatibility` | Run browser compatibility checks |
| `npm run performance-test` | Run performance tests |
| `npm run prepare-deploy` | Run all checks and build for deployment |
| `npm run clean-start` | Clear cache and start server safely |

## Environment Configuration

For local development, create a `.env.local` file with your configuration:

```
PORT=3001
REACT_APP_API_URL=http://localhost:8000/api
```

This allows you to override the default port and configure other environment-specific settings.

## Icon Issues

If you encounter icon-related errors with `@heroicons/react`, make sure you're using the correct import paths:

```jsx
// For solid icons
import { ChevronUpIcon, ChevronDownIcon } from '@heroicons/react/24/solid';

// For outline icons
import { EyeIcon } from '@heroicons/react/24/outline';
```

## Troubleshooting

### RpcIpcMessagePortClosedError

This error can occur when the development server crashes or is terminated improperly. To fix:

1. Kill all node processes: `killall node`
2. Clear the cache: `npm run clear-cache`
3. Restart using clean start: `npm run clean-start`

### TypeScript Errors

If TypeScript errors prevent deployment:

1. Fix type errors: `npm run fix-ts`
2. If errors persist, check component property types and imports

### Browser Compatibility Issues

Run the browser compatibility test to identify issues:

```bash
npm run check-browser-compatibility
```

This will generate a report of potential compatibility problems. 