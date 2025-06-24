# QR Code Generation Debug Guide

## 🚨 Current Issue Summary

The QR code generation system is failing with an "invalid-argument" error. Multiple issues have been identified through comprehensive testing.

## 📊 Error Analysis

### Primary Errors Observed
```
❌ Error generating invite code: FirebaseError: invalid-argument
❌ Missing or insufficient permissions
❌ The query requires an index
❌ Decoding Firebase ID token failed
```

### Error Sources
1. **Firebase Functions Authentication**: Token verification failures
2. **Firestore Permissions**: Missing security rules and indexes
3. **Frontend Authentication**: httpsCallable not sending proper tokens
4. **Database Access**: Property ownership validation issues

## 🔍 Test Results Summary

### ✅ What's Working
- Firebase Function is deployed and accessible
- CORS headers are properly configured
- Function responds to requests (returns 401/500 appropriately)
- Local Firebase emulator starts successfully

### ❌ What's Failing
- Firebase ID token authentication
- Firestore index missing for notifications
- Property ownership validation
- QR code generation in production

## 🎯 Root Cause Analysis

### 1. Firebase Authentication Issue
**Problem**: The Firebase Function receives invalid or missing ID tokens

**Evidence**:
```
Error creating invite code: FirebaseAuthError: Decoding Firebase ID token failed.
Make sure you passed the entire string JWT which represents an ID token.
```

**Likely Causes**:
- User not properly authenticated in browser
- Token expired or corrupted
- httpsCallable not including authentication headers
- Frontend auth context issues

### 2. Missing Firestore Index
**Problem**: Critical database index missing for notifications collection

**Evidence**:
```
The query requires an index. You can create it here: 
https://console.firebase.google.com/v1/r/project/propagentic/firestore/indexes?create_composite=...
```

**Impact**: Prevents notification queries from executing

### 3. Property Ownership Validation
**Problem**: Function can't verify user owns the property

**Evidence**:
```
❌ Error generating invite code: FirebaseError: invalid-argument
```

**Likely Causes**:
- Property doesn't exist in Firestore
- User ID doesn't match property.landlordId
- Missing propertyId in request

## 🔧 Immediate Fix Actions

### Step 1: Fix Firestore Index (CRITICAL)
**Action**: Add missing composite index
**URL**: https://console.firebase.google.com/v1/r/project/propagentic/firestore/indexes?create_composite=ClFwcm9qZWN0cy9wcm9wYWdlbnRpYy9kYXRhYmFzZXMvKGRlZmF1bHQpL2NvbGxlY3Rpb25Hcm91cHMvbm90aWZpY2F0aW9ucy9pbmRleGVzL18QARoKCgZ1c2VySWQQARoNCgljcmVhdGVkQXQQAhoMCghfX25hbWVfXxAC

**Time**: 2-5 minutes to build
**Priority**: HIGH - This blocks multiple operations

### Step 2: Debug Authentication in Frontend
**Action**: Add debug logging to QRInviteGenerator.tsx

```typescript
// Add before calling generateInviteCodeFunction
const user = auth.currentUser;
console.log("🔐 Auth Debug:", {
  user: user?.uid,
  email: user?.email,
  token: user ? await user.getIdToken().then(t => t.substring(0, 50) + "...") : null
});

if (!user) {
  throw new Error("User not authenticated");
}

// Force fresh token
await user.getIdToken(true);
```

### Step 3: Verify Property Ownership
**Action**: Check property exists and user has access

```javascript
// Add to Firebase Functions logs check
firebase functions:log --only generateInviteCode --limit 20
```

**Verify in Firestore Console**:
1. Go to Firestore → properties collection
2. Find property with your user ID as landlordId
3. Note the property ID for testing

### Step 4: Test with Real Firebase Token
**Action**: Get actual ID token from browser

**Steps**:
1. Login to https://propagentic.web.app
2. Open DevTools → Application → Local Storage
3. Look for Firebase Auth token
4. Test with real token in test script

## 🧪 Testing Checklist

### Pre-Testing Setup
- [ ] Firestore index added and built
- [ ] User authenticated in browser
- [ ] Property exists in Firestore with correct landlordId
- [ ] Firebase Functions deployed successfully

### Authentication Testing
- [ ] User logged in and verified: `firebase.auth().currentUser`
- [ ] Fresh token generated: `user.getIdToken(true)`
- [ ] Token included in httpsCallable request
- [ ] No CORS errors in browser console

### Database Testing
- [ ] Property exists in properties collection
- [ ] User ID matches property.landlordId
- [ ] Firestore rules allow access
- [ ] Notifications index built successfully

### Function Testing
- [ ] Firebase Functions logs show no errors
- [ ] Request reaches function with valid data
- [ ] Response returns invite code successfully
- [ ] QR code generates and displays

## 📋 Debug Commands

### Check Firebase Functions Status
```bash
# View recent logs
firebase functions:log --only generateInviteCode --limit 20

# Monitor live logs
firebase functions:log --only generateInviteCode --follow

# List deployed functions
firebase functions:list
```

### Test Firebase Functions Locally
```bash
# Start emulators
firebase emulators:start --only functions,firestore

# Test in browser at
http://localhost:4000
```

### Verify Firestore Data
```bash
# Check if property exists
# Go to Firebase Console → Firestore → properties collection
# Verify your user ID is in landlordId field
```

## 🔍 Browser Debug Console Commands

### Check Authentication State
```javascript
// In browser console on https://propagentic.web.app
firebase.auth().currentUser

// Get fresh token
firebase.auth().currentUser.getIdToken(true)

// Check user claims
firebase.auth().currentUser.getIdTokenResult()
```

### Test QR Function Manually
```javascript
// In browser console (replace with your property ID)
const functions = firebase.functions();
const generateInviteCode = functions.httpsCallable('generateInviteCode');

generateInviteCode({
  propertyId: 'your-property-id',
  expirationDays: 7
}).then(result => {
  console.log('Success:', result.data);
}).catch(error => {
  console.error('Error:', error);
});
```

## 📊 Expected Success Flow

### 1. User Authentication ✅
- User logged in with valid Firebase Auth
- Fresh ID token available
- Token automatically included in httpsCallable

### 2. Request Processing ✅
- Function receives authenticated request
- Token verified successfully
- User permissions validated

### 3. Property Validation ✅
- Property exists in Firestore
- User owns property (landlordId matches)
- Request includes valid propertyId

### 4. Invite Code Generation ✅
- Random code generated
- Saved to inviteCodes collection
- QR code URL created
- Response returned to frontend

### 5. QR Display ✅
- QR code image generated
- Property info displayed
- Copy/download options available

## 🚨 Emergency Fallback

If Firebase Functions continue failing, the system has local fallback:

```typescript
// In qrCodeService.ts - local service fallback
const localService = {
  generateInviteCode: () => {
    return Math.random().toString(36).substr(2, 8).toUpperCase();
  }
};
```

**Current Status**: Local fallback is working and generating codes like `2LN9WSRL`

## 📞 Support Resources

### Firebase Console Links
- [Functions](https://console.firebase.google.com/project/propagentic/functions)
- [Firestore](https://console.firebase.google.com/project/propagentic/firestore)
- [Authentication](https://console.firebase.google.com/project/propagentic/authentication)
- [Indexes](https://console.firebase.google.com/project/propagentic/firestore/indexes)

### Documentation
- [Firebase ID Tokens](https://firebase.google.com/docs/auth/admin/verify-id-tokens)
- [Cloud Functions HTTPS Callable](https://firebase.google.com/docs/functions/callable)
- [Firestore Security Rules](https://firebase.google.com/docs/firestore/security/get-started)

## ✅ Success Indicators

### When Everything Works
1. **No console errors** in browser
2. **QR code displays** with property info
3. **Invite codes saved** to Firestore inviteCodes collection
4. **Firebase Functions logs** show successful execution
5. **Generated QR URLs** work correctly

### Test QR Code URLs
- **Local Development**: `http://localhost:3000/invite/[CODE]`
- **Production**: `https://propagentic.web.app/invite/[CODE]`

---

**Last Updated**: January 2025  
**Status**: Active debugging in progress  
**Priority**: HIGH - Critical feature for tenant onboarding 