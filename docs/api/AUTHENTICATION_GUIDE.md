# Firebase Authentication Integration Guide

## Table of Contents
- [Overview](#overview)
- [Authentication Setup](#authentication-setup)
- [User Types and Roles](#user-types-and-roles)
- [Authentication Flow](#authentication-flow)
- [Client-Side Implementation](#client-side-implementation)
- [Server-Side Validation](#server-side-validation)
- [Custom Claims](#custom-claims)
- [Security Rules Integration](#security-rules-integration)
- [Error Handling](#error-handling)
- [Best Practices](#best-practices)

## Overview

Propagentic uses Firebase Authentication to provide secure, scalable user authentication with role-based access control. The system supports multiple user types with different permissions and capabilities.

### Supported Authentication Methods
- **Email/Password**: Primary authentication method
- **Google OAuth**: Social login for convenience
- **Email Verification**: Required for account activation
- **Password Reset**: Self-service password recovery

### User Journey
1. **Registration**: Create account with email/password
2. **Email Verification**: Verify email address
3. **Profile Setup**: Complete user profile with role selection
4. **Custom Claims**: Set user type for role-based access
5. **Access Control**: Firestore rules enforce permissions

## Authentication Setup

### Firebase Configuration
```javascript
// firebase/config.js
import { initializeApp } from 'firebase/app';
import { getAuth, connectAuthEmulator } from 'firebase/auth';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.REACT_APP_FIREBASE_APP_ID
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

// Connect to emulators in development
if (process.env.NODE_ENV === 'development') {
  connectAuthEmulator(auth, 'http://localhost:9099');
  connectFirestoreEmulator(db, 'localhost', 8080);
}
```

### Authentication Context
```javascript
// context/AuthContext.jsx
import { createContext, useContext, useEffect, useState } from 'react';
import { auth, db } from '../firebase/config';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      
      if (user) {
        // Fetch user profile from Firestore
        try {
          const userDoc = await getDoc(doc(db, 'users', user.uid));
          if (userDoc.exists()) {
            setUserProfile(userDoc.data());
          }
        } catch (error) {
          console.error('Error fetching user profile:', error);
        }
      } else {
        setUserProfile(null);
      }
      
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const logout = async () => {
    try {
      await signOut(auth);
      setCurrentUser(null);
      setUserProfile(null);
    } catch (error) {
      console.error('Error signing out:', error);
      throw error;
    }
  };

  const value = {
    currentUser,
    userProfile,
    loading,
    logout
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}
```

## User Types and Roles

### User Type Definitions
```typescript
type UserType = 'landlord' | 'tenant' | 'contractor' | 'admin';

interface UserProfile {
  uid: string;
  email: string;
  userType: UserType;
  firstName: string;
  lastName: string;
  phone?: string;
  profileComplete: boolean;
  emailVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
  
  // Role-specific fields
  landlord?: LandlordProfile;
  tenant?: TenantProfile;
  contractor?: ContractorProfile;
  admin?: AdminProfile;
}
```

### Role Permissions Matrix

| Action | Landlord | Tenant | Contractor | Admin |
|--------|----------|--------|------------|-------|
| Create Property | ✅ | ❌ | ❌ | ✅ |
| Invite Tenants | ✅ | ❌ | ❌ | ✅ |
| Submit Maintenance Request | ❌ | ✅ | ❌ | ✅ |
| Accept Job Assignments | ❌ | ❌ | ✅ | ✅ |
| View All Properties | ❌ | ❌ | ❌ | ✅ |
| Manage Users | ❌ | ❌ | ❌ | ✅ |

## Authentication Flow

### Registration Flow
```javascript
// services/authService.js
import { createUserWithEmailAndPassword, sendEmailVerification } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { auth, db } from '../firebase/config';

export const registerUser = async (email, password, userData) => {
  try {
    // Create Firebase Auth user
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // Send email verification
    await sendEmailVerification(user);

    // Create user profile in Firestore
    const userProfile = {
      uid: user.uid,
      email: user.email,
      userType: userData.userType,
      firstName: userData.firstName,
      lastName: userData.lastName,
      phone: userData.phone,
      profileComplete: false,
      emailVerified: false,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    await setDoc(doc(db, 'users', user.uid), userProfile);

    // Set custom claims via Cloud Function
    const functions = getFunctions();
    const setUserClaims = httpsCallable(functions, 'setUserClaims');
    await setUserClaims({
      uid: user.uid,
      userType: userData.userType
    });

    return { user, userProfile };
  } catch (error) {
    console.error('Registration error:', error);
    throw error;
  }
};
```

### Login Flow
```javascript
export const loginUser = async (email, password) => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // Check email verification
    if (!user.emailVerified) {
      throw new Error('EMAIL_NOT_VERIFIED');
    }

    // Fetch user profile
    const userDoc = await getDoc(doc(db, 'users', user.uid));
    if (!userDoc.exists()) {
      throw new Error('USER_PROFILE_NOT_FOUND');
    }

    const userProfile = userDoc.data();

    // Check profile completion
    if (!userProfile.profileComplete) {
      throw new Error('PROFILE_INCOMPLETE');
    }

    return { user, userProfile };
  } catch (error) {
    console.error('Login error:', error);
    throw error;
  }
};
```

### Email Verification
```javascript
export const handleEmailVerification = async () => {
  try {
    const user = auth.currentUser;
    if (!user) throw new Error('No user logged in');

    await user.reload(); // Refresh user object
    
    if (user.emailVerified) {
      // Update user profile in Firestore
      await updateDoc(doc(db, 'users', user.uid), {
        emailVerified: true,
        updatedAt: new Date()
      });
      
      return true;
    }
    
    return false;
  } catch (error) {
    console.error('Email verification error:', error);
    throw error;
  }
};

export const resendVerificationEmail = async () => {
  try {
    const user = auth.currentUser;
    if (!user) throw new Error('No user logged in');

    await sendEmailVerification(user);
    return true;
  } catch (error) {
    console.error('Resend verification error:', error);
    throw error;
  }
};
```

## Client-Side Implementation

### Protected Route Component
```javascript
// components/guards/PrivateRoute.jsx
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export default function PrivateRoute({ children, requiredRole = null }) {
  const { currentUser, userProfile, loading } = useAuth();

  if (loading) {
    return <LoadingSpinner />;
  }

  if (!currentUser) {
    return <Navigate to="/login" />;
  }

  if (!currentUser.emailVerified) {
    return <Navigate to="/verify-email" />;
  }

  if (!userProfile?.profileComplete) {
    return <Navigate to="/complete-profile" />;
  }

  if (requiredRole && userProfile.userType !== requiredRole) {
    return <Navigate to="/unauthorized" />;
  }

  return children;
}
```

### Role-Based Access Component
```javascript
// components/guards/RoleGuard.jsx
import { useAuth } from '../../context/AuthContext';

export default function RoleGuard({ 
  children, 
  allowedRoles = [], 
  fallback = null 
}) {
  const { userProfile } = useAuth();

  if (!userProfile || !allowedRoles.includes(userProfile.userType)) {
    return fallback || <div>Access denied</div>;
  }

  return children;
}

// Usage example
<RoleGuard allowedRoles={['landlord', 'admin']}>
  <PropertyManagementPanel />
</RoleGuard>
```

### Authentication Hooks
```javascript
// hooks/useAuthActions.js
import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import * as authService from '../services/authService';

export function useAuthActions() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { logout } = useAuth();

  const register = async (formData) => {
    setLoading(true);
    setError(null);
    try {
      const result = await authService.registerUser(
        formData.email,
        formData.password,
        formData
      );
      return result;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    setLoading(true);
    setError(null);
    try {
      const result = await authService.loginUser(email, password);
      return result;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    setLoading(true);
    try {
      await logout();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return {
    register,
    login,
    logout: handleLogout,
    loading,
    error,
    clearError: () => setError(null)
  };
}
```

## Server-Side Validation

### Firebase Functions Authentication
```typescript
// functions/src/utils/auth.ts
import * as admin from 'firebase-admin';

export interface AuthContext {
  uid: string;
  email: string;
  userType?: string;
}

export const validateAuthentication = (context: any): AuthContext => {
  if (!context.auth) {
    throw new functions.https.HttpsError(
      'unauthenticated',
      'User must be authenticated'
    );
  }

  return {
    uid: context.auth.uid,
    email: context.auth.token.email,
    userType: context.auth.token.userType
  };
};

export const validateUserType = (
  authContext: AuthContext, 
  allowedTypes: string[]
): void => {
  if (!authContext.userType || !allowedTypes.includes(authContext.userType)) {
    throw new functions.https.HttpsError(
      'permission-denied',
      `User type '${authContext.userType}' not authorized for this operation`
    );
  }
};

export const validateOwnership = async (
  authContext: AuthContext,
  resourceId: string,
  resourceType: 'property' | 'tenant' | 'request'
): Promise<void> => {
  // Implementation depends on resource type
  const db = admin.firestore();
  
  switch (resourceType) {
    case 'property':
      const propertyDoc = await db.collection('properties').doc(resourceId).get();
      if (!propertyDoc.exists) {
        throw new functions.https.HttpsError('not-found', 'Property not found');
      }
      if (propertyDoc.data()?.landlordId !== authContext.uid) {
        throw new functions.https.HttpsError('permission-denied', 'Not property owner');
      }
      break;
      
    // Add other resource types as needed
  }
};
```

### Function Implementation Example
```typescript
// functions/src/propertyFunctions.ts
export const createProperty = functions.https.onCall(async (data, context) => {
  const authContext = validateAuthentication(context);
  validateUserType(authContext, ['landlord', 'admin']);

  // Validate input
  if (!data.name || !data.address) {
    throw new functions.https.HttpsError(
      'invalid-argument',
      'Property name and address are required'
    );
  }

  const db = admin.firestore();
  const propertyData = {
    ...data,
    landlordId: authContext.uid,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp()
  };

  const propertyRef = await db.collection('properties').add(propertyData);
  
  return {
    success: true,
    propertyId: propertyRef.id
  };
});
```

## Custom Claims

### Setting Custom Claims
```typescript
// functions/src/userManagement.ts
export const setUserClaims = functions.https.onCall(async (data, context) => {
  const authContext = validateAuthentication(context);
  
  const { uid, userType } = data;
  
  // Validate user type
  const validUserTypes = ['landlord', 'tenant', 'contractor', 'admin'];
  if (!validUserTypes.includes(userType)) {
    throw new functions.https.HttpsError(
      'invalid-argument',
      'Invalid user type'
    );
  }

  // Only allow setting claims for self or if admin
  if (authContext.uid !== uid && authContext.userType !== 'admin') {
    throw new functions.https.HttpsError(
      'permission-denied',
      'Cannot set claims for other users'
    );
  }

  try {
    await admin.auth().setCustomUserClaims(uid, { 
      userType,
      timestamp: Date.now() 
    });
    
    return { 
      success: true, 
      message: `Custom claims set for user ${uid}`,
      userType 
    };
  } catch (error) {
    console.error('Error setting custom claims:', error);
    throw new functions.https.HttpsError(
      'internal',
      'Failed to set custom claims'
    );
  }
});
```

### Refreshing Token with Claims
```javascript
// Client-side token refresh
export const refreshUserToken = async () => {
  const user = auth.currentUser;
  if (user) {
    // Force token refresh to get updated custom claims
    await user.getIdToken(true);
    return user.getIdTokenResult();
  }
  throw new Error('No user logged in');
};
```

## Security Rules Integration

### Firestore Security Rules
```javascript
// firestore.rules
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Helper functions
    function isAuthenticated() {
      return request.auth != null;
    }
    
    function getUserType() {
      return request.auth.token.userType;
    }
    
    function isOwner(resource) {
      return request.auth.uid == resource.data.landlordId;
    }
    
    function isTenant(resource) {
      return request.auth.uid in resource.data.tenants;
    }
    
    // User profiles
    match /users/{userId} {
      allow read, write: if isAuthenticated() && 
        (request.auth.uid == userId || getUserType() == 'admin');
    }
    
    // Properties
    match /properties/{propertyId} {
      allow read: if isAuthenticated() && 
        (isOwner(resource) || isTenant(resource) || getUserType() == 'admin');
      allow create, update: if isAuthenticated() && 
        (getUserType() == 'landlord' || getUserType() == 'admin');
      allow delete: if isAuthenticated() && 
        (isOwner(resource) || getUserType() == 'admin');
    }
    
    // Maintenance requests
    match /maintenanceRequests/{requestId} {
      allow read: if isAuthenticated() && 
        (request.auth.uid == resource.data.tenantId || 
         request.auth.uid == resource.data.landlordId ||
         request.auth.uid == resource.data.assignedContractorId ||
         getUserType() == 'admin');
      allow create: if isAuthenticated() && getUserType() == 'tenant';
      allow update: if isAuthenticated() && 
        (request.auth.uid == resource.data.landlordId ||
         request.auth.uid == resource.data.assignedContractorId ||
         getUserType() == 'admin');
    }
    
    // Invites
    match /invites/{inviteId} {
      allow read: if isAuthenticated() && 
        (request.auth.uid == resource.data.inviterId ||
         request.auth.email == resource.data.inviteeEmail ||
         getUserType() == 'admin');
      allow create: if isAuthenticated() && 
        (getUserType() == 'landlord' || getUserType() == 'admin');
      allow update: if isAuthenticated() && 
        (request.auth.email == resource.data.inviteeEmail ||
         request.auth.uid == resource.data.inviterId ||
         getUserType() == 'admin');
    }
  }
}
```

## Error Handling

### Authentication Error Types
```javascript
// utils/authErrors.js
export const AUTH_ERRORS = {
  'auth/user-not-found': 'No account found with this email address.',
  'auth/wrong-password': 'Incorrect password.',
  'auth/email-already-in-use': 'An account with this email already exists.',
  'auth/weak-password': 'Password should be at least 6 characters.',
  'auth/invalid-email': 'Invalid email address.',
  'auth/user-disabled': 'This account has been disabled.',
  'auth/too-many-requests': 'Too many failed attempts. Please try again later.',
  'auth/network-request-failed': 'Network error. Please check your connection.',
  'EMAIL_NOT_VERIFIED': 'Please verify your email address before logging in.',
  'PROFILE_INCOMPLETE': 'Please complete your profile to continue.',
  'USER_PROFILE_NOT_FOUND': 'User profile not found. Please contact support.'
};

export const getAuthErrorMessage = (errorCode) => {
  return AUTH_ERRORS[errorCode] || 'An unexpected error occurred. Please try again.';
};
```

### Error Handling Hook
```javascript
// hooks/useAuthError.js
import { useState } from 'react';
import { getAuthErrorMessage } from '../utils/authErrors';

export function useAuthError() {
  const [error, setError] = useState(null);

  const handleAuthError = (error) => {
    const message = getAuthErrorMessage(error.code || error.message);
    setError(message);
  };

  const clearError = () => setError(null);

  return {
    error,
    handleAuthError,
    clearError
  };
}
```

## Best Practices

### Security Best Practices
1. **Always Validate Server-Side**: Never trust client-side authentication alone
2. **Use Custom Claims**: Implement role-based access with custom claims
3. **Secure Firestore Rules**: Write comprehensive security rules
4. **Validate Input**: Sanitize and validate all user input
5. **Monitor Authentication**: Track failed login attempts and suspicious activity

### Performance Best Practices
1. **Cache User Profile**: Store user profile in context to avoid repeated fetches
2. **Lazy Load Permissions**: Only check permissions when needed
3. **Optimize Token Refresh**: Minimize token refresh calls
4. **Efficient Firestore Queries**: Use security rules to optimize database access

### User Experience Best Practices
1. **Clear Error Messages**: Provide helpful, actionable error messages
2. **Loading States**: Show loading indicators during authentication operations
3. **Email Verification**: Guide users through email verification process
4. **Password Requirements**: Clearly communicate password requirements
5. **Account Recovery**: Provide easy password reset functionality

### Development Best Practices
1. **Use TypeScript**: Type safety for authentication flows
2. **Test Authentication**: Unit test authentication functions
3. **Environment Variables**: Secure API keys and configuration
4. **Logging**: Comprehensive logging for debugging
5. **Error Boundaries**: Catch and handle authentication errors gracefully

---

**Authentication Guide Version**: 2.0  
**Last Updated**: January 2025  
**Maintainer**: Development Team

**Related Documentation**:
- [API Documentation](API_DOCUMENTATION.md)
- [Firebase Functions Guide](FIREBASE_FUNCTIONS.md)
- [Error Handling Guide](ERROR_HANDLING.md) 