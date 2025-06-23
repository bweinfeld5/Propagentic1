# Firestore Permissions Guide

## Issue: "Missing or Insufficient Permissions"

If you see error messages like:

```
Subscription with field 'landlordId' failed: FirebaseError: Missing or insufficient permissions.
Subscription with field 'ownerId' failed: FirebaseError: Missing or insufficient permissions.
Subscription with field 'createdBy' failed: FirebaseError: Missing or insufficient permissions.
```

This indicates your Firestore security rules are preventing access to data.

## The Fix - Standardizing on the 'landlordId' Field

We've made two complementary changes to fix this issue:

1. **Simplified Property Queries**:
   - Now using only the `landlordId` field to query properties instead of trying multiple fields
   - Removed the multi-field fallback approach that was causing permission errors
   - All property documents should use `landlordId` as the standard field for ownership

2. **Updated Firestore Security Rules**:
   - Rules now directly check the `landlordId` field instead of using a helper function
   - Added support for legacy field names in the read operations for backwards compatibility
   - Create operations now enforce using the `landlordId` field
   - Added better debugging and comments to make troubleshooting easier

## How to Create Properties Correctly

When creating new properties, always include the `landlordId` field:

```javascript
// CORRECT way to create a property
await dataService.createProperty({
  name: "Oak Apartments",
  address: "123 Oak Street",
  landlordId: currentUser.uid, // Required field
  // ... other property fields
});
```

## Migration for Existing Properties

If you have existing properties using different field names, you should migrate them:

```javascript
// Add this to your admin scripts
const propertyRef = doc(db, 'properties', propertyId);
await updateDoc(propertyRef, {
  landlordId: property.ownerId || property.owner || property.userId || property.createdBy
});
```

## Development Mode

During development, you can use test emails with domains ending in `@propagentic.com` or `@example.com` to get broader permissions for debugging.

## Testing Your Changes

After updating your code:

1. Log in with your landlord account
2. Check the console for query messages
3. Verify you only see queries using the `landlordId` field
4. Confirm no more "Missing or insufficient permissions" errors

## For Production

Before going to production, you should review and tighten these permissions. The current rules prioritize development ease over strict security.

## How to Deploy Updated Rules

If you need to update the rules:

```bash
firebase deploy --only firestore:rules
```

## Debugging Permissions

To debug permissions issues:

1. Check the user's authentication state (logged in, correct user type)
2. Look at the Firebase console logs for detailed rule failures
3. Ensure documents have the correct owner IDs (landlordId, tenantId, etc.)
4. Test with development mode emails when needed

## Security Rule Structure

Our security rules use these key functions:

- `isSignedIn()` - Checks if the user is authenticated
- `isLandlord()`, `isTenant()`, `isContractor()` - Checks the user's role
- `isPropertyOwner()` - Verifies the landlord owns the property
- `isPropertyTenant()` - Validates a tenant's access to property data
- `isDevMode()` - Provides relaxed permissions for development 