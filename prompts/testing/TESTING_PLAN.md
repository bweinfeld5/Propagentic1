# PropAgentic Tenant Invitation Flow - Testing & Troubleshooting Guide

## 🚨 Current Issues Identified

### 1. Firebase Permissions Error
**Error**: `FirebaseError: Missing or insufficient permissions`
**Root Cause**: Firestore rules using `getUserData()` function creates circular dependency
**Impact**: Prevents property loading and dashboard functionality

### 2. Auth State Issues  
**Error**: Multiple auth state changes with undefined values
**Root Cause**: AuthContext triggering multiple updates during initialization
**Impact**: Causes performance issues and UI flickering

### 3. Performance Problems
**Error**: "More than 10 properties, using multiple queries"
**Root Cause**: Inefficient data fetching in dataService
**Impact**: Slow dashboard loading and potential rate limiting

## 🔧 Immediate Fixes Required

### Fix 1: Simplify Firestore Rules (CRITICAL)
```javascript
// Replace the problematic getUserData() function in firestore.rules
function isLandlord() { 
  return isSignedIn() && request.auth.token.userType == 'landlord';
}

function isTenant() { 
  return isSignedIn() && request.auth.token.userType == 'tenant';
}
```

### Fix 2: Optimize Property Queries
```javascript
// In dataService.js - use single query instead of multiple
async getPropertiesForCurrentLandlord() {
  const q = query(
    collection(db, 'properties'), 
    where('landlordId', '==', this.currentUser.uid)
  );
  // Remove the multiple field fallback approach
}
```

### Fix 3: Add Custom Claims for Auth
```javascript
// Set custom claims during user creation
await admin.auth().setCustomUserClaims(user.uid, { 
  userType: 'landlord' // or 'tenant', 'contractor'
});
```

## 🧪 Testing Strategy

### Phase 1: Fix Core Authentication (30 minutes)
1. **Deploy simplified Firestore rules**
2. **Test basic auth flow**
3. **Verify property loading**

### Phase 2: Test Landlord Invitation Flow (45 minutes)
1. **Create test landlord account**
2. **Add test property**
3. **Send invitation to test email**
4. **Verify invitation document creation**
5. **Check email delivery (if configured)**

### Phase 3: Test Tenant Acceptance Flow (45 minutes)
1. **Create test tenant account**
2. **Navigate to invitation acceptance page**
3. **Test both URL and code entry methods**
4. **Verify property association**
5. **Test dashboard access**

### Phase 4: End-to-End Integration (30 minutes)
1. **Complete full flow from landlord to tenant**
2. **Test maintenance request submission**
3. **Verify real-time updates**

## 🛠️ Troubleshooting Tools

### 1. Firebase Console Debugging
- **Firestore Rules Playground**: Test rules with sample data
- **Authentication Users**: Verify user creation and custom claims
- **Firestore Data**: Check document structure and permissions

### 2. Browser Developer Tools
- **Console**: Monitor auth state changes and errors
- **Network**: Check Firebase API calls and responses
- **Application Storage**: Verify localStorage data

### 3. Custom Debug Components
```jsx
// Add to any page for debugging
import UserProfileDebug from '../components/debug/UserProfileDebug';

// In component render:
{process.env.NODE_ENV === 'development' && <UserProfileDebug />}
```

## 📋 Testing Checklist

### Pre-Testing Setup
- [ ] Backup current firestore.rules
- [ ] Create test accounts (landlord + tenant)
- [ ] Clear browser cache and localStorage
- [ ] Open browser dev tools

### Landlord Flow Testing
- [ ] Login as landlord
- [ ] Navigate to properties page
- [ ] Create new property
- [ ] Send tenant invitation
- [ ] Verify invitation in Firestore
- [ ] Check console for errors

### Tenant Flow Testing  
- [ ] Login as tenant
- [ ] Navigate to invitation URL
- [ ] Accept invitation
- [ ] Verify property association
- [ ] Access tenant dashboard
- [ ] Submit maintenance request

### Error Scenarios
- [ ] Invalid invitation code
- [ ] Expired invitation
- [ ] Already accepted invitation
- [ ] Unauthorized access attempts

## 🚀 Quick Start Testing Commands

```bash
# 1. Start development server
npm run start:fix

# 2. Open multiple browser windows/incognito tabs
# - Window 1: Landlord account
# - Window 2: Tenant account  
# - Window 3: Firebase Console

# 3. Test URLs to verify:
# - http://localhost:3000/landlord/dashboard
# - http://localhost:3000/tenant/dashboard
# - http://localhost:3000/invite/[test-invite-id]
# - http://localhost:3000/tenant/accept/[test-invite-id]
```

## 🔍 Key Metrics to Monitor

### Performance
- [ ] Page load times < 3 seconds
- [ ] Auth state changes < 3 per session
- [ ] Firestore reads < 50 per page load

### Functionality  
- [ ] Invitation creation success rate
- [ ] Email delivery (if configured)
- [ ] Tenant acceptance success rate
- [ ] Property association accuracy

### User Experience
- [ ] Clear error messages
- [ ] Loading states
- [ ] Responsive design
- [ ] Accessibility compliance

## 🆘 Emergency Rollback Plan

If critical issues arise:

1. **Revert Firestore Rules**:
   ```bash
   firebase deploy --only firestore:rules --project [project-id]
   ```

2. **Disable Invitation Features**:
   ```javascript
   // In feature flags or environment variables
   ENABLE_INVITATIONS=false
   ```

3. **Fallback to Demo Mode**:
   ```javascript
   // In dataService configuration
   dataService.configure({ isDemoMode: true });
   ```

## 📞 Support Contacts

- **Firebase Console**: https://console.firebase.google.com
- **Documentation**: https://firebase.google.com/docs
- **Status Page**: https://status.firebase.google.com

---

**Next Steps**: Start with Phase 1 fixes, then proceed through testing phases systematically. 