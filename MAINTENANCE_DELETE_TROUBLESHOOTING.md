# Maintenance Request Deletion Troubleshooting Guide

## Overview

If you're unable to delete maintenance requests in the landlord dashboard, this guide will help you identify and fix the issue.

## Summary of Your System

✅ **Your contractor assignment functionality is already working correctly** - when you assign a contractor to a maintenance request, it automatically updates the contractor's profile.

✅ **Your Firestore rules already allow landlord deletion** - the permissions are correctly configured to allow property owners to delete maintenance requests.

## Quick Fix Attempts

### 1. Use the Built-in Debug Tools

When you hover over a maintenance request in your dashboard, you'll now see two buttons:
- 🔍 **Blue "Debug" button** - Click this to analyze why deletion might be failing
- 🗑️ **Red "Delete" button** - The actual delete button

**Step 1:** Click the blue debug button on a maintenance request you can't delete
**Step 2:** Check the browser console (F12 → Console tab) for detailed analysis

### 2. Console Debugging Commands

Open your browser console (F12 → Console) and try these commands:

```javascript
// List all your maintenance requests
listMaintenanceRequests()

// Debug permissions for a specific request (replace with actual ID)
debugMaintenanceRequest("your-maintenance-request-id")
```

## Common Issues and Solutions

### Issue 1: Property Ownership Mismatch
**Symptom:** Error message about property ownership
**Solution:** The property's `landlordId` field doesn't match your user ID

### Issue 2: User Role Problems  
**Symptom:** Error about user role not being 'landlord'
**Solution:** Your user account role needs to be set to 'landlord'

### Issue 3: Missing Property Association
**Symptom:** Maintenance request doesn't have a valid `propertyId`
**Solution:** Data integrity issue - the maintenance request isn't properly linked to a property

## Advanced Debugging

### Check Your User Profile
1. Open browser console (F12)
2. Run: `console.log('Current user:', auth.currentUser)`
3. Check that your user ID is correct

### Check Property Ownership
1. In browser console, run: `listMaintenanceRequests()`
2. Verify that the properties are actually owned by your user ID

### Manual Permission Check
1. Get a maintenance request ID from the dashboard
2. Run: `debugMaintenanceRequest("request-id-here")`
3. Review the detailed permission analysis

## Error Message Meanings

| Error Message | Likely Cause | Solution |
|---------------|--------------|----------|
| "Permission denied: You don't own the property..." | Property ownership mismatch | Check property `landlordId` field |
| "Permission denied: Your account role is..." | User role issue | Update user profile role to 'landlord' |
| "Maintenance request not found" | Invalid request ID | Verify request exists |
| "Property not found" | Missing property | Check property data integrity |

## Getting More Help

### Enable Detailed Logging
1. Open browser console
2. Run any delete operation
3. Look for the "🔍 Running permission diagnostic..." message
4. Review the detailed permission analysis

### Export Debug Information
If you need to report an issue:

1. Click the debug button (blue eye icon) on a problematic maintenance request
2. Copy the console output
3. Include this information when reporting the issue

## Technical Details

The delete permission works by checking:
1. ✅ User is authenticated
2. ✅ User has 'landlord' role in their profile
3. ✅ Property exists and user owns it (property.landlordId === user.uid)
4. ✅ Maintenance request exists and is linked to the property

The Firestore rule that handles this:
```javascript
allow delete: if isSignedIn() && (
  resource.data.submittedBy == request.auth.uid ||
  resource.data.tenantId == request.auth.uid ||
  isMaintenanceRequestPropertyOwner() ||
  isAdmin()
);
```

This rule allows deletion if you're the property owner of the maintenance request's associated property.

## Quick Test

To verify the fix is working:

1. Go to your landlord dashboard
2. Navigate to the Maintenance tab
3. Hover over any maintenance request
4. You should see both a blue debug button and red delete button
5. Try clicking the debug button first - it will tell you if permissions are working
6. If debug shows "✅ Permissions look good!", try the delete button

## Contact Support

If these steps don't resolve the issue, please provide:
- The output from running `debugMaintenanceRequest("request-id")`
- Your user ID and role information
- The specific error message you're seeing 