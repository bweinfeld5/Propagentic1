# Email Verification Implementation & Data Cleanup Tasks

## Overview
Implement mandatory email verification for all user roles (tenant, landlord, contractor) and clean up existing test/unverified user data from Firebase Authentication and Firestore.

## Current Status
- ❌ Email verification not enforced
- ❌ Test accounts exist without verification
- ❌ No cleanup process for existing data
- ✅ Firebase Auth supports email verification
- ✅ User roles are defined (tenant, landlord, contractor)

---

## Phase 1: Data Cleanup Tasks

### Task 1: Backup Existing Data
**Priority**: Critical
**Status**: ❌ TODO
**Estimated Time**: 1 hour

#### Requirements
1. Export all existing user data from Firebase Auth
2. Export all related Firestore collections
3. Create backup documentation

#### Implementation Steps
```bash
# 1. Install Firebase CLI tools if not already installed
npm install -g firebase-tools

# 2. Login to Firebase
firebase login

# 3. Export Auth users
firebase auth:export users.json --format=json --project propagentic

# 4. Export Firestore data
firebase firestore:export gs://propagentic-backups/backup-$(date +%Y%m%d)
```

#### Backup Checklist
- [ ] Export Firebase Auth users to JSON
- [ ] Export Firestore collections: users, properties, invites, tickets
- [ ] Document which accounts are test vs. real
- [ ] Save backup files with timestamp
- [ ] Store backups securely (Google Cloud Storage recommended)

---

### Task 2: Identify & Document Test Accounts
**Priority**: High
**Status**: ❌ TODO
**Estimated Time**: 30 minutes

#### Test Account Identification Script
```javascript
// scripts/identify-test-accounts.js
const admin = require('firebase-admin');
const fs = require('fs');

// List of known test email patterns
const testEmailPatterns = [
  /test@/i,
  /demo@/i,
  /sample@/i,
  /example@/i,
  /@test\./i,
  /bweinfeld15@gmail\.com/ // Your specific test email
];

async function identifyTestAccounts() {
  const users = [];
  const listUsers = await admin.auth().listUsers();
  
  listUsers.users.forEach(user => {
    const isTest = testEmailPatterns.some(pattern => 
      pattern.test(user.email)
    );
    
    users.push({
      uid: user.uid,
      email: user.email,
      emailVerified: user.emailVerified,
      creationTime: user.metadata.creationTime,
      isTestAccount: isTest,
      shouldDelete: isTest || !user.emailVerified
    });
  });
  
  // Save to file
  fs.writeFileSync(
    'test-accounts-audit.json', 
    JSON.stringify(users, null, 2)
  );
  
  console.log(`Found ${users.filter(u => u.shouldDelete).length} accounts to delete`);
}
```

---

### Task 3: Delete Test User Data
**Priority**: High
**Status**: ❌ TODO
**Estimated Time**: 2 hours

#### Deletion Script
```javascript
// scripts/cleanup-test-accounts.js
const admin = require('firebase-admin');
const { getFirestore } = require('firebase-admin/firestore');

async function cleanupTestAccounts() {
  const audit = require('./test-accounts-audit.json');
  const db = getFirestore();
  const batch = db.batch();
  
  for (const user of audit) {
    if (user.shouldDelete) {
      try {
        // 1. Delete from Firebase Auth
        await admin.auth().deleteUser(user.uid);
        
        // 2. Delete from Firestore users collection
        batch.delete(db.collection('users').doc(user.uid));
        
        // 3. Delete related data
        // - Properties owned by this user
        const properties = await db.collection('properties')
          .where('landlordId', '==', user.uid).get();
        properties.forEach(doc => batch.delete(doc.ref));
        
        // - Invites sent by this user
        const invites = await db.collection('invites')
          .where('landlordId', '==', user.uid).get();
        invites.forEach(doc => batch.delete(doc.ref));
        
        // - Tickets submitted by this user
        const tickets = await db.collection('tickets')
          .where('submittedBy', '==', user.uid).get();
        tickets.forEach(doc => batch.delete(doc.ref));
        
        console.log(`Deleted user: ${user.email}`);
      } catch (error) {
        console.error(`Failed to delete ${user.email}:`, error);
      }
    }
  }
  
  await batch.commit();
  console.log('Cleanup complete');
}
```

#### Data to Clean
- [ ] Firebase Auth users (unverified & test accounts)
- [ ] Firestore `users` collection entries
- [ ] Related `properties` documents
- [ ] Related `invites` documents
- [ ] Related `tickets` documents
- [ ] Related `messages` and `conversations`
- [ ] Any uploaded files in Storage

---

## Phase 2: Email Verification Implementation

### Task 4: Update Authentication Flow
**Priority**: Critical
**Status**: ❌ TODO
**Estimated Time**: 3 hours

#### Requirements
1. Modify registration to send verification email
2. Prevent login until email is verified
3. Add resend verification email functionality
4. Update UI to show verification status

#### Implementation Steps

##### 4.1 Update AuthContext.jsx
```javascript
// Add to AuthContext.jsx
const register = async (email, password, userType) => {
  try {
    // Create user
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    
    // Send verification email immediately
    await sendEmailVerification(user, {
      url: `${window.location.origin}/verify-email?continue=/onboarding`,
      handleCodeInApp: true
    });
    
    // Create user profile (but mark as unverified)
    await setDoc(doc(db, 'users', user.uid), {
      email: user.email,
      userType,
      emailVerified: false,
      verificationEmailSent: serverTimestamp(),
      createdAt: serverTimestamp(),
      onboardingComplete: false
    });
    
    // Sign out immediately - force verification first
    await signOut(auth);
    
    return { 
      success: true, 
      message: 'Verification email sent! Please check your inbox.' 
    };
  } catch (error) {
    console.error('Registration error:', error);
    throw error;
  }
};

// Add email verification check to login
const login = async (email, password) => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    
    // Check if email is verified
    if (!user.emailVerified) {
      await signOut(auth);
      throw new Error('email-not-verified');
    }
    
    // Update user profile to reflect verification
    await updateDoc(doc(db, 'users', user.uid), {
      emailVerified: true,
      lastLogin: serverTimestamp()
    });
    
    return userCredential;
  } catch (error) {
    console.error('Login error:', error);
    throw error;
  }
};

// Add resend verification email function
const resendVerificationEmail = async (email, password) => {
  try {
    // Temporarily sign in to get user object
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    
    if (user.emailVerified) {
      await signOut(auth);
      return { success: true, alreadyVerified: true };
    }
    
    // Send new verification email
    await sendEmailVerification(user);
    
    // Sign out again
    await signOut(auth);
    
    return { success: true, message: 'Verification email sent!' };
  } catch (error) {
    console.error('Resend verification error:', error);
    throw error;
  }
};
```

##### 4.2 Create Email Verification Page
```javascript
// src/pages/EmailVerificationPage.jsx
import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { CheckCircleIcon, XCircleIcon } from '@heroicons/react/24/outline';

const EmailVerificationPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { verifyEmail } = useAuth();
  const [verifying, setVerifying] = useState(true);
  const [verified, setVerified] = useState(false);
  const [error, setError] = useState('');
  
  useEffect(() => {
    const verifyUserEmail = async () => {
      const oobCode = searchParams.get('oobCode');
      const continueUrl = searchParams.get('continueUrl');
      
      if (!oobCode) {
        setError('Invalid verification link');
        setVerifying(false);
        return;
      }
      
      try {
        await verifyEmail(oobCode);
        setVerified(true);
        
        // Redirect after 3 seconds
        setTimeout(() => {
          navigate(continueUrl || '/login');
        }, 3000);
      } catch (error) {
        setError('Verification failed. The link may be expired.');
      } finally {
        setVerifying(false);
      }
    };
    
    verifyUserEmail();
  }, [searchParams, navigate, verifyEmail]);
  
  // Component JSX...
};
```

---

### Task 5: Update Login/Register UI
**Priority**: High
**Status**: ❌ TODO
**Estimated Time**: 2 hours

#### Requirements
1. Show clear messaging about email verification
2. Add "Resend verification email" option
3. Handle verification errors gracefully
4. Update registration success flow

#### UI Updates

##### 5.1 Update LoginPage.jsx
```javascript
// Add to LoginPage.jsx
{error === 'email-not-verified' && (
  <div className="rounded-md bg-yellow-50 p-4 mb-4">
    <div className="flex">
      <div className="flex-shrink-0">
        <ExclamationTriangleIcon className="h-5 w-5 text-yellow-400" />
      </div>
      <div className="ml-3">
        <h3 className="text-sm font-medium text-yellow-800">
          Email not verified
        </h3>
        <div className="mt-2 text-sm text-yellow-700">
          <p>Please check your email and click the verification link before logging in.</p>
          <button
            onClick={() => setShowResendVerification(true)}
            className="font-medium underline text-yellow-800 hover:text-yellow-900 mt-2"
          >
            Resend verification email
          </button>
        </div>
      </div>
    </div>
  </div>
)}
```

##### 5.2 Update RegisterPage.jsx
```javascript
// Show success message after registration
{registrationSuccess && (
  <div className="rounded-md bg-green-50 p-4">
    <div className="flex">
      <div className="flex-shrink-0">
        <CheckCircleIcon className="h-5 w-5 text-green-400" />
      </div>
      <div className="ml-3">
        <h3 className="text-sm font-medium text-green-800">
          Registration successful!
        </h3>
        <div className="mt-2 text-sm text-green-700">
          <p>We've sent a verification email to {email}.</p>
          <p className="mt-1">Please check your inbox and click the verification link to activate your account.</p>
        </div>
      </div>
    </div>
  </div>
)}
```

---

### Task 6: Update Firebase Security Rules
**Priority**: Critical
**Status**: ❌ TODO
**Estimated Time**: 1 hour

#### Firestore Rules Update
```javascript
// firestore.rules
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Helper function to check if user is verified
    function isVerifiedUser() {
      return request.auth != null && 
             request.auth.token.email_verified == true;
    }
    
    // Users collection
    match /users/{userId} {
      allow read: if request.auth != null && request.auth.uid == userId;
      allow write: if request.auth != null && 
                      request.auth.uid == userId && 
                      isVerifiedUser();
    }
    
    // Properties collection - only verified users
    match /properties/{propertyId} {
      allow read: if isVerifiedUser() && 
                     (resource.data.landlordId == request.auth.uid ||
                      request.auth.uid in resource.data.tenantIds);
      allow create: if isVerifiedUser() && 
                       request.auth.uid == request.resource.data.landlordId;
      allow update: if isVerifiedUser() && 
                       resource.data.landlordId == request.auth.uid;
    }
    
    // Similar rules for other collections...
  }
}
```

---

### Task 7: Email Template Customization
**Priority**: Medium
**Status**: ❌ TODO
**Estimated Time**: 2 hours

#### Requirements
1. Create branded email verification template
2. Include clear call-to-action
3. Add security information
4. Support multiple languages (future)

#### Firebase Email Template Setup
1. Go to Firebase Console > Authentication > Templates
2. Customize the email verification template
3. Add PropAgentic branding
4. Include support contact information

#### Custom Email Template (via Cloud Function)
```javascript
// functions/src/emailTemplates.js
const verificationEmailTemplate = (verificationLink, userType) => `
<!DOCTYPE html>
<html>
<head>
  <style>
    .container { max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif; }
    .header { background: linear-gradient(135deg, #FF6B35 0%, #F7444E 100%); padding: 30px; text-align: center; }
    .content { padding: 30px; background: #f8f9fa; }
    .button { display: inline-block; padding: 15px 30px; background: #FF6B35; color: white; text-decoration: none; border-radius: 5px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1 style="color: white; margin: 0;">Welcome to PropAgentic!</h1>
    </div>
    <div class="content">
      <h2>Verify Your Email Address</h2>
      <p>Thank you for registering as a ${userType} with PropAgentic.</p>
      <p>To complete your registration and access your dashboard, please verify your email address:</p>
      <p style="text-align: center; margin: 30px 0;">
        <a href="${verificationLink}" class="button">Verify Email Address</a>
      </p>
      <p style="font-size: 14px; color: #666;">
        This link will expire in 24 hours. If you didn't create an account with PropAgentic, you can safely ignore this email.
      </p>
    </div>
  </div>
</body>
</html>
`;
```

---

### Task 8: Testing & Monitoring
**Priority**: High
**Status**: ❌ TODO
**Estimated Time**: 2 hours

#### Test Scenarios
- [ ] New user registration flow
- [ ] Email verification link functionality
- [ ] Login with unverified email (should fail)
- [ ] Login with verified email (should succeed)
- [ ] Resend verification email
- [ ] Expired verification link handling
- [ ] Multiple user roles (tenant, landlord, contractor)

#### Monitoring Setup
```javascript
// Add to Firebase Cloud Functions
exports.monitorVerificationRate = functions.pubsub
  .schedule('every 24 hours')
  .onRun(async (context) => {
    const users = await admin.auth().listUsers();
    const stats = {
      total: users.users.length,
      verified: users.users.filter(u => u.emailVerified).length,
      unverified: users.users.filter(u => !u.emailVerified).length,
      verificationRate: 0
    };
    
    stats.verificationRate = (stats.verified / stats.total) * 100;
    
    // Log to Firestore for tracking
    await admin.firestore()
      .collection('analytics')
      .doc('emailVerification')
      .set({
        ...stats,
        timestamp: admin.firestore.FieldValue.serverTimestamp()
      });
  });
```

---

## Implementation Timeline

### Week 1: Cleanup & Preparation
- Day 1-2: Backup all data and identify test accounts
- Day 3-4: Run cleanup scripts and verify data integrity
- Day 5: Test with clean database

### Week 2: Core Implementation
- Day 1-2: Update AuthContext and authentication flow
- Day 3: Create email verification page and routes
- Day 4: Update login/register UI components
- Day 5: Test complete flow

### Week 3: Security & Polish
- Day 1-2: Update Firebase security rules
- Day 2-3: Customize email templates
- Day 4-5: Testing and monitoring setup

---

## Success Metrics
- [ ] 100% of new users must verify email
- [ ] 0 unverified users can access protected resources
- [ ] < 5% bounce rate on verification emails
- [ ] > 90% verification completion rate
- [ ] < 24 hour average verification time

---

## Rollback Plan
1. Keep backups for 30 days minimum
2. Document all deleted accounts
3. Have restore scripts ready
4. Test restore process before deletion

---

## Notes & Considerations
- Consider grace period for existing users to verify
- Send warning emails before deleting accounts
- Consider implementing magic link authentication as alternative
- Monitor for delivery issues with certain email providers
- Plan for users who change email addresses
- Consider SMS verification as backup option 