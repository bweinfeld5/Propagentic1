# Tenant Login Troubleshooting Guide - Extended Solutions

This document explains how to use the tools we've created to troubleshoot the tenant login issues you're experiencing.

## Issue 1: Firestore Security Rules Preventing Debugging

The Firestore security rules are correctly securing your data (which is good for production), but this makes debugging difficult because our debugging tools can't access data they need.

### Solution: Temporary Debug Rules

We've created two files to help:

1. `firestore.debug.rules` - More permissive security rules for debugging
2. `deploy-debug-rules.sh` - Script to temporarily deploy debug rules and automatically restore production rules

**How to use:**

```bash
# Make sure script is executable
chmod +x deploy-debug-rules.sh

# Run the script
./deploy-debug-rules.sh
```

The script will:
- Back up your current rules
- Deploy the debug rules
- Allow you to specify how long (up to 30 minutes) to keep debug rules active
- Automatically restore your production rules when time expires

**⚠️ IMPORTANT: Never leave debug rules in production for extended periods ⚠️**

## Issue 2: Component Confusion (Multiple TenantDashboard Components)

We've identified that there are multiple TenantDashboard components, but aren't sure which one is actually being used:

- `src/pages/tenant/TenantDashboard.jsx` (imported in App.js)
- `src/components/tenant/TenantDashboard.jsx`
- `src/pages/TenantDashboard.jsx`
- `src/pages/TenantDashboardOld.js`

### Solution: Component Tracing

We've created:

1. `component-trace.js` - Adds logging to all TenantDashboard components
2. `check-component-load.js` - Helper to check which component was loaded
3. `browser-debug.js` - Script to run in the browser console

**How to use:**

```bash
# Run the component tracing script
node component-trace.js

# Start your application
npm start

# Log in as a tenant and navigate to the dashboard
# Check browser console to see which component was loaded

# Alternatively, open browser console and paste the content of browser-debug.js
```

This will help identify which component is actually being rendered.

## Issue 3: Authentication and Data Access Debugging

To help diagnose authentication and data access issues, we've created a Firebase Admin debug tool:

`firebase-admin-debug.js` - A command-line tool to bypass security rules for debugging

**Prerequisites:**

1. Install the Firebase Admin SDK:
   ```bash
   npm install firebase-admin
   ```

2. Generate a service account key:
   - Go to Firebase Console → Project Settings → Service Accounts
   - Click "Generate new private key"
   - Save as `serviceAccountKey.json` in your project root
   - Edit `firebase-admin-debug.js` to uncomment the serviceAccount section

**How to use:**

```bash
# Run the Firebase Admin debug tool
node firebase-admin-debug.js
```

This will show a menu of options to help debug:
- Get user document by email or UID
- Get tenant profile
- Get property document
- Get tickets for tenant
- Update user document
- Add missing tenant profile
- Fix user permissions

## Step-by-Step Debugging Process

1. **Verify the User Account**
   ```bash
   node firebase-admin-debug.js
   # Choose option 1 to get user by email
   # Enter tenant email address
   ```

2. **Check Firestore Access**
   ```bash
   # Deploy debug rules temporarily
   ./deploy-debug-rules.sh
   
   # Try logging in with the tenant account
   ```

3. **Identify Which Component is Loading**
   ```bash
   # Add tracing to components
   node component-trace.js
   
   # Start the app and log in as tenant
   # Check console or run the browser debug script
   ```

4. **Fix User Profile if Needed**
   ```bash
   node firebase-admin-debug.js
   # Choose option 8 to fix user permissions
   # Enter the tenant's UID
   ```

## Common Issues and Fixes

1. **Missing User Document**:
   - Use option 6 in the admin tool to create a proper user document

2. **Incorrect User Type**:
   - Use option 6 in the admin tool to update the userType field to "tenant"

3. **Missing Tenant Profile**:
   - Use option 7 in the admin tool to create a tenant profile

4. **Incomplete Onboarding**:
   - Use option 6 to set onboardingComplete to true

5. **Wrong TenantDashboard Component**:
   - After identifying which component is loaded using the tracing tool,
   - Update imports in App.js if needed:
   ```js
   // Update this line in App.js if needed
   import TenantDashboard from './pages/tenant/TenantDashboard';
   ```

## Conclusion

By following these steps, you should be able to diagnose and fix the tenant login issues. The key is to:

1. Use `firebase-admin-debug.js` to verify user data
2. Use `deploy-debug-rules.sh` to temporarily enable debugging
3. Use `component-trace.js` to identify which component is loaded
4. Make necessary fixes to user data or component imports

After making these changes, commit them to your Git repository:

```bash
git add .
git commit -m "Fix tenant login issues"
git push origin main
``` 