# Tenant Login Troubleshooting Guide

## Overview
This document provides a comprehensive troubleshooting guide for tenant authentication and portal access issues in the Propagentic application. It covers common authentication problems, routing issues, and step-by-step instructions for resolving login failures.

## Table of Contents
- [Quick Diagnostic Checklist](#quick-diagnostic-checklist)
- [Authentication Flow Analysis](#authentication-flow-analysis)
- [Common Issues and Solutions](#common-issues-and-solutions)
- [Advanced Troubleshooting](#advanced-troubleshooting)
- [Database Verification Steps](#database-verification-steps)
- [Browser-specific Issues](#browser-specific-issues)
- [Mobile Device Considerations](#mobile-device-considerations)
- [Contact Support](#contact-support)

## Quick Diagnostic Checklist

Before diving into detailed troubleshooting, check these common issues:

- [ ] Verify user credentials (email/password)
- [ ] Check if the tenant account exists in Firebase Authentication
- [ ] Confirm the user document exists in Firestore's 'users' collection
- [ ] Verify the user document has the correct 'userType' or 'role' field set to 'tenant'
- [ ] Check that 'onboardingComplete' is set to true
- [ ] Clear browser cache and cookies
- [ ] Try an incognito/private browsing window
- [ ] Check for browser console errors during login attempt

## Authentication Flow Analysis

The Propagentic tenant login process follows these steps:

1. User enters email/password on `/login` page
2. Firebase Authentication verifies credentials
3. On successful authentication, the app fetches the user profile from Firestore
4. The app checks user role (tenant) and onboarding status
5. If properly set up, the user is redirected to `/tenant/dashboard`

### Potential Failure Points:

- Firebase Authentication failure
- Missing or incomplete Firestore user document
- Incorrect role assignment
- Failed redirects due to routing issues
- User profile fetch timing issues
- Browser storage/cache problems

## Common Issues and Solutions

### 1. Authentication Failures

**Symptoms:**
- Error message on login page
- User remains on login page after submitting credentials
- Console errors related to authentication

**Solutions:**

```javascript
// Check for specific Firebase Auth error codes
const errorMessages = {
  'auth/user-not-found': 'No account found with this email. Please check your email or create an account.',
  'auth/wrong-password': 'Incorrect password. Please try again or reset your password.',
  'auth/invalid-email': 'Please provide a valid email address.',
  'auth/too-many-requests': 'Too many unsuccessful attempts. Please try again later.',
  'auth/user-disabled': 'This account has been disabled. Please contact support.'
};
```

- Reset password if forgotten
- Verify email address format is correct
- Check for account lockout due to too many attempts
- Verify the tenant hasn't been disabled in Firebase Console

### 2. User Document Issues

**Symptoms:**
- Successfully authenticates but gets redirected back to login
- Console errors about missing profile data
- Tenant can log in but sees the wrong dashboard type

**Solutions:**
- Ensure the 'users' collection has a document with the user's UID
- Verify the document contains:
  ```json
  {
    "email": "tenant@example.com",
    "userType": "tenant",
    "role": "tenant",
    "onboardingComplete": true,
    "uid": "[user-uid]"
  }
  ```
- If missing critical fields, update the document using the debug tool:
  ```bash
  node debug-login.js tenant@example.com
  ```

### 3. Routing/Redirect Issues

**Symptoms:**
- Login seems successful but user ends up on the wrong page
- Browser URL changes multiple times during login
- Infinite redirect loops

**Solutions:**
- Check the `RoleBasedRedirect` component in App.js
- Verify tenant routing in App.js is correct:
  ```javascript
  <Route path="/tenant/dashboard" element={<PrivateRoute><TenantDashboard /></PrivateRoute>} />
  ```
- Check for route guards that might be preventing access:
  ```javascript
  const PrivateRoute = ({ children }) => {
    const { currentUser, loading } = useAuth();
    return currentUser ? children : <Navigate to="/login" />;
  };
  ```

### 4. Profile Loading Timing Issues

**Symptoms:**
- Intermittent login failures
- Occasional redirects to onboarding instead of dashboard
- Works on second attempt

**Solutions:**
- Use the `loading` state properly to avoid race conditions
- Verify the `useEffect` dependencies array includes all required variables
- Check for proper error handling in profile fetching logic
- Ensure localStorage is updated after user profile is fetched

## Advanced Troubleshooting

### Using Debug Login Tool

The `debug-login.js` script provides detailed diagnostics for user accounts:

```bash
# Run in terminal
node debug-login.js tenant@example.com [optional-password]
```

This will:
1. Attempt authentication
2. Verify user document exists in Firestore
3. Check for critical fields
4. Fix missing fields if needed
5. Report expected redirect path

### Manual Firestore Document Inspection

1. Access Firebase Console: https://console.firebase.google.com/
2. Navigate to Firestore Database
3. Select the 'users' collection
4. Find the document matching the tenant's UID
5. Verify these fields exist and are correct:
   - `email`: matches login email
   - `userType` or `role`: set to "tenant"
   - `onboardingComplete`: set to true
   - `uid`: matches user's Firebase Auth UID

### Client-Side Debugging

Add these console logs to relevant components for troubleshooting:

```javascript
// In LoginPage.js
console.log('LoginPage - Attempting to login with email:', email);
console.log('LoginPage - Login successful, fetching user profile');
console.log('LoginPage - User profile loaded:', userProfile);
console.log('LoginPage - User role detected:', userRole);
console.log(`LoginPage - Redirecting to: ${redirectPath}`);

// In RoleBasedRedirect component
console.log('RoleBasedRedirect: User profile loaded:', userProfile);
console.log(`RoleBasedRedirect - Role: ${userRole}, Onboarding Complete: ${onboardingComplete}`);
```

## Database Verification Steps

### 1. Firebase Authentication Verification

Verify the tenant exists in Firebase Authentication:

1. Go to Firebase Console → Authentication → Users
2. Search for tenant's email
3. Verify user exists and is not disabled
4. If needed, enable the user or reset password

### 2. Firestore Document Integrity Check

Run these Firestore queries to verify user data:

```javascript
// Query by email (this is how the app initially finds the user)
const usersRef = collection(db, 'users');
const q = query(usersRef, where('email', '==', 'tenant@example.com'));
const querySnapshot = await getDocs(q);

// Query by UID (this is how direct document access works)
const userDocRef = doc(db, 'users', 'user-uid-here');
const docSnap = await getDoc(userDocRef);
```

### 3. Fixed Templates for Critical Fields

If you need to recreate or fix a tenant document:

```javascript
// Template for a complete tenant document
const tenantTemplate = {
  email: "tenant@example.com",
  userType: "tenant",
  role: "tenant", // Redundant with userType for backward compatibility
  onboardingComplete: true,
  uid: "[replace-with-actual-uid]",
  createdAt: serverTimestamp()
};

// Minimal fix for tenant role issues
const minimalFix = {
  userType: "tenant",
  role: "tenant",
  onboardingComplete: true
};
```

## Browser-specific Issues

### Local Storage Problems

If the browser's local storage is corrupted:

1. Open the browser's developer tools (F12)
2. Navigate to the Application tab
3. Select Local Storage from the left sidebar
4. Find and clear entries for propagentic.firebaseapp.com
5. Try logging in again

### Browser Compatibility

The application is optimized for:
- Chrome (latest 2 versions)
- Firefox (latest 2 versions)
- Safari (latest 2 versions)
- Edge (Chromium-based, latest version)

Issues specific to older browsers may include:
- JWT parsing failures
- LocalStorage limitations
- CSS/layout problems affecting the login form

## Mobile Device Considerations

For tenant login on mobile devices:

- Verify the responsive design is working correctly on the login page
- Check for mobile-specific redirects that might interfere with authentication
- Ensure the tenant dashboard is optimized for mobile viewport
- Test on both iOS and Android devices when possible

## Contact Support

If all troubleshooting steps fail, collect the following information before contacting support:

1. Tenant email address
2. Exact error messages displayed
3. Browser console logs (if available)
4. Screenshot of the issue
5. Steps to reproduce the problem
6. Browser and device information

Contact support at: support@propagentic.com

---

## Appendix: Code References

### AuthContext.js

Key authentication functions:

```javascript
// Login an existing user
const login = (email, password) => {
  return signInWithEmailAndPassword(auth, email, password);
};

// Fetch user profile data from Firestore
const fetchUserProfile = async (uid) => {
  try {
    const userDocRef = doc(db, 'users', uid);
    const userDoc = await getDoc(userDocRef);
    
    if (userDoc.exists()) {
      let profileData = userDoc.data();
      // Process profile data...
      return profileData;
    }
    return null;
  } catch (error) {
    console.error('Error fetching user profile:', error);
    return null;
  }
};
```

### LoginPage.js

Login form submission and redirection:

```javascript
const handleSubmit = async (e) => {
  e.preventDefault();
  
  try {
    setError('');
    setLoading(true);
    
    const { user } = await login(email, password);
    const userProfile = await fetchUserProfile(user.uid);
    
    const userRole = userProfile.userType || userProfile.role;
    
    // Redirect based on user type
    if (userRole === 'tenant') {
      navigate('/tenant/dashboard');
    } else {
      // Other roles...
    }
  } catch (error) {
    const errorCode = error.code || 'unknown';
    setError(getErrorMessage(errorCode));
  } finally {
    setLoading(false);
  }
};
``` 