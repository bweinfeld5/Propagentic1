# Firebase Deployment Guide for PropAgentic

This guide explains how to properly deploy your PropAgentic application to Firebase Hosting.

## Prerequisites

1. **Firebase CLI**
   Make sure you have Firebase CLI installed:
   ```bash
   npm install -g firebase-tools
   ```

2. **Firebase Login**
   Ensure you're logged in to Firebase:
   ```bash
   firebase login
   ```

3. **Firebase Project**
   Your project should be initialized with Firebase. If not, run:
   ```bash
   firebase init
   ```
   And select "Hosting" when prompted for features.

## Deployment Options

### Option 1: Use the Deployment Helper (Recommended)

We've created a helper script that handles common deployment issues:

```bash
# Standard deployment (uses existing build if available)
npm run deploy:helper

# Force rebuild and deploy
npm run deploy:force
```

**Benefits:**
- Checks for build errors before deploying
- Provides helpful error messages
- Validates Firebase configuration
- Handles common issues automatically

### Option 2: Standard Deployment

Use the standard deployment script:

```bash
npm run deploy
# or
npm run deploy:firebase
```

This will build your application and then deploy it to Firebase Hosting.

### Option 3: Manual Deployment

If you need more control, you can run the commands separately:

```bash
# Build the application
npm run build

# Deploy to Firebase
firebase deploy --only hosting
```

## Troubleshooting

### Build Failures

#### React Version Compatibility Issues

If you see errors like:
```
export 'useId' (imported as 'useId') was not found in 'react'
```

This is because some packages (like framer-motion v10+) require React 18, but we're using React 17.

**Solution:**
```bash
npm install framer-motion@6.5.1 --legacy-peer-deps
```

#### TypeScript Errors

Fix TypeScript errors before deployment:
```bash
npm run fix-ts
```

### Deployment Failures

#### Not Logged In

If you see "Error: Not logged in":
```bash
firebase login
```

#### Project Not Found

If your project can't be found:
```bash
# List your Firebase projects
firebase projects:list

# Set the active project
firebase use YOUR_PROJECT_ID
```

#### Permission Denied

Ensure you have the necessary permissions in the Firebase console.

## Notes on Production Build

1. The production build is created in the `build` directory
2. All assets are optimized and minified
3. Environment variables with `REACT_APP_` prefix are included in the build
4. Sourcemaps are generated for debugging

## Checking Your Deployment

After successful deployment, you can view your site at:
```
https://YOUR-PROJECT-ID.web.app
```

Or through the custom domain if you've configured one in Firebase Hosting settings. 