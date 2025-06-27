# 🚨 URGENT: Fix Firestore Permission Issue

## 🔍 Debug Analysis
Based on your console output:
- ✅ TenantProfile exists with property: `InPxMITQ7MSziM4OJQaR`
- ❌ Permission denied when reading from properties collection
- 🎯 **Root Cause:** Firestore security rules don't allow tenant property access

## 🔧 Immediate Fix

### Step 1: Go to Firebase Console
1. Open [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Go to **Firestore Database**
4. Click **Rules** tab

### Step 2: Replace Your Rules
Copy and paste this EXACT code:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Allow users to read their own profiles
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }

    // Allow users to read their own tenant profile  
    match /tenantProfiles/{tenantId} {
      allow read, write: if request.auth != null && request.auth.uid == tenantId;
    }

    // KEY RULE: Allow tenants to read properties they're associated with
    // AND update maintenanceRequests when submitting requests
    match /properties/{propertyId} {
      allow read: if request.auth != null && isTenantOfProperty(propertyId);
      allow update: if request.auth != null && isTenantOfProperty(propertyId) && 
                    onlyUpdatingMaintenanceRequests();
      // Landlords can read/write their properties
      allow read, write: if request.auth != null && isPropertyOwner(propertyId);
    }

    // Helper function: Check if user is tenant of this property
    function isTenantOfProperty(propertyId) {
      return exists(/databases/$(database)/documents/tenantProfiles/$(request.auth.uid)) &&
             propertyId in get(/databases/$(database)/documents/tenantProfiles/$(request.auth.uid)).data.properties;
    }

    // Helper function: Check if user owns this property  
    function isPropertyOwner(propertyId) {
      return exists(/databases/$(database)/documents/properties/$(propertyId)) &&
             request.auth.uid == get(/databases/$(database)/documents/properties/$(propertyId)).data.landlordId;
    }

    // Helper function: Check if tenant is only updating maintenanceRequests array
    function onlyUpdatingMaintenanceRequests() {
      let affectedKeys = request.resource.data.diff(resource.data).affectedKeys();
      return affectedKeys.hasOnly(['maintenanceRequests', 'updatedAt']);
    }

    // Allow tenants to read/write their maintenance tickets
    match /tickets/{ticketId} {
      allow read, write: if request.auth != null && 
        request.auth.uid == resource.data.submittedBy;
      allow create: if request.auth != null;
    }

    // Allow reading invites for your email
    match /invites/{inviteId} {
      allow read: if request.auth != null && 
        request.auth.token.email == resource.data.tenantEmail;
    }

    // Allow landlords to manage their properties and tenants
    match /landlordProfiles/{landlordId} {
      allow read, write: if request.auth != null && request.auth.uid == landlordId;
    }
  }
}
```

### Step 3: Click "Publish" 
⚠️ **IMPORTANT:** Click the **Publish** button to deploy the rules

### Step 4: Test Immediately
1. **Refresh your tenant dashboard** page
2. **Check the console** for new debug messages
3. **Look for**: `✅ [DEBUG] Property data loaded: InPxMITQ7MSziM4OJQaR`

## 🧪 Expected Results

**BEFORE (Current):**
```
❌ [DEBUG] Permission denied for property: InPxMITQ7MSziM4OJQaR
Properties Count: 1
Demo Mode: NO
Red error card showing permission denied
```

**AFTER (Fixed):**
```  
✅ [DEBUG] Property data loaded: InPxMITQ7MSziM4OJQaR [object with property data]
Properties Count: 1  
Demo Mode: NO
Property card showing real property information
```

## ✅ New Features Added

With the updated rules, tenants can now:
1. **Read their assigned properties** (resolves permission error)
2. **Submit maintenance requests** that automatically link to properties
3. **Update property maintenanceRequests arrays** when submitting requests

When you submit a maintenance request, you'll see these debug logs:
```
🔍 [DEBUG] Creating maintenance request...
✅ [DEBUG] Maintenance request created with ID: [request-id]
🔍 [DEBUG] Linking request to property: InPxMITQ7MSziM4OJQaR
✅ [DEBUG] Successfully linked request to property
```

## 🚨 If Still Not Working

1. **Check property exists:** Verify property `InPxMITQ7MSziM4OJQaR` exists in Firestore
2. **Check data structure:** Make sure your property document has the expected fields
3. **Clear browser cache:** Hard refresh (Ctrl+F5 / Cmd+Shift+R)
4. **Wait 30 seconds:** Firestore rules take a moment to propagate

The debug panel will tell us exactly what happens! 