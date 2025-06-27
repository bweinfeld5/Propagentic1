# 🔒 Firestore Security Rules for Tenant Property Access

## Current Issue
The enhanced tenant dashboard is trying to read from the `properties` collection, but your current Firestore security rules likely don't allow tenants to access property documents.

## Required Security Rules

Add these rules to your Firestore Security Rules to allow tenants to read properties they're associated with:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Allow users to read their own user profile
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }

    // Allow users to read their own tenant profile
    match /tenantProfiles/{tenantId} {
      allow read, write: if request.auth != null && request.auth.uid == tenantId;
    }

    // Allow tenants to read properties they are associated with
    match /properties/{propertyId} {
      allow read: if request.auth != null && isTenantOfProperty(propertyId);
      allow write: if false; // Tenants cannot write to properties
    }

    // Helper function to check if user is tenant of property
    function isTenantOfProperty(propertyId) {
      return exists(/databases/$(database)/documents/tenantProfiles/$(request.auth.uid)) &&
             propertyId in get(/databases/$(database)/documents/tenantProfiles/$(request.auth.uid)).data.properties;
    }

    // Allow tenants to read/write their own maintenance tickets
    match /tickets/{ticketId} {
      allow read, write: if request.auth != null && 
        request.auth.uid == resource.data.submittedBy;
    }

    // Allow tenants to read pending invites for their email
    match /invites/{inviteId} {
      allow read: if request.auth != null && 
        request.auth.token.email == resource.data.tenantEmail;
    }
  }
}
```

## Testing the Rules

1. **Deploy the rules** to your Firestore project
2. **Refresh the tenant dashboard** 
3. **Check the browser console** for debug logs:
   - Look for `🔍 [DEBUG]` messages
   - Check if property loading succeeds or shows permission errors
4. **Verify the debug panel** shows correct information

## Expected Behavior After Rules Update

✅ **With proper rules:** Properties load successfully, no error messages
❌ **Without rules:** Red error cards saying "You do not have permission to view this property"

## Data Structure Requirements

Make sure your data structure matches:

```javascript
// tenantProfiles/{tenantId}
{
  properties: ["property-id-1", "property-id-2"]
}

// properties/{propertyId}  
{
  name: "Property Name",
  address: {
    street: "123 Main St",
    city: "City",
    state: "State", 
    zipCode: "12345",
    unit: "4B"
  },
  landlord: {
    name: "Landlord Name",
    email: "landlord@example.com", 
    phone: "(555) 123-4567"
  }
}
``` 