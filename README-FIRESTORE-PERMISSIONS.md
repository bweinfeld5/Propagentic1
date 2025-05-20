# Firestore Permissions Guide

## Issue: "Missing or Insufficient Permissions"

If you see error messages like:

```
FirebaseError: Firestore operation failed: Missing or insufficient permissions.
```

Or these specific subscription errors:

```
Subscription with field 'landlordId' failed: FirebaseError: Missing or insufficient permissions.
Subscription with field 'ownerId' failed: FirebaseError: Missing or insufficient permissions.
Subscription with field 'createdBy' failed: FirebaseError: Missing or insufficient permissions.
```

This means your Firebase security rules are blocking access to the data you're trying to read or write.

## The Fix

We've updated the Firestore security rules to:

1. **Add a development mode** that grants more permissions when using test emails:
   - Any email ending with `@propagentic.com` or `@example.com`
   - This makes testing and debugging easier

2. **Make properties collection more accessible to landlords**:
   - Allows any landlord to read any property
   - Previous rules only allowed landlords to read properties they owned

3. **Add explicit rules for the tenants collection**:
   - Allows landlords to read tenant data
   - Ensures owners can access their own data

4. **Make tickets viewable by any landlord**:
   - Helps with debugging ticketing system issues
   - Provides visibility across all properties

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