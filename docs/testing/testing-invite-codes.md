# Testing the Tenant Invite Code Functionality

This guide explains how to test the tenant invite code functionality in the PropAgentic application.

## Prerequisites

- Firebase project with Firestore and Authentication enabled
- Deploy the Firebase functions: `cd functions && npm run deploy`
- Deploy the Firestore security rules: `firebase deploy --only firestore:rules`
- At least two test accounts:
  - One with landlord role
  - One with tenant role

## 1. Generate an Invite Code (Landlord)

1. Log in as a landlord
2. Navigate to the Landlord Dashboard
3. Select a property (or create one if needed)
4. Click "Manage Tenants" or similar
5. Click "Generate Invite Code"
6. Configure the invite code:
   - (Optional) Restrict to specific email
   - (Optional) Restrict to specific unit
   - (Optional) Adjust expiration days
7. Click "Generate"
8. Copy the generated invite code

## 2. Redeem an Invite Code (Tenant)

1. Log in as a tenant (create a new tenant account if needed)
2. On the Tenant Dashboard, you'll see an empty state with "No properties yet"
3. Click "I have an invite code"
4. In the modal that opens:
   - Enter the invite code you copied from the landlord's dashboard
   - Click "Validate Code"
   - If valid, the property details will be displayed
   - Click "Join Property"
5. You should be redirected back to the dashboard with the new property displayed
6. Verify the property appears in the tenant's list of properties

## 3. Verify Tenant-Property Relationship

1. Log back in as the landlord
2. Navigate to the property where you generated the invite code
3. Check the tenants list to confirm the tenant has been added
4. Verify the unit assignment (if specified in the invite code)

## 4. Test Error Cases

### Invalid Code
1. Try entering an invalid code (e.g., "12345678")
2. Verify appropriate error message is displayed

### Expired Code
1. Generate a new code with 1-day expiration
2. Edit the code in Firebase console to set expiration date in the past
3. Try redeeming the expired code
4. Verify "This invite code has expired" error

### Already Used Code
1. Generate a new code
2. Redeem it with a tenant
3. Try redeeming the same code with another tenant
4. Verify "This invite code has already been used" error

### Email Restriction
1. Generate a new code with email restriction (e.g., specific.tenant@example.com)
2. Try redeeming with a different tenant email
3. Verify the error about email restriction

## 5. Test through API/Script

You can also test the Firebase functions directly using the provided test scripts:

```bash
# Test invite code creation
node scripts/test-invite-code-creation.js

# Test invite code redemption
node scripts/test-invite-code-redemption.js
```

Be sure to update the credentials and parameters in these scripts before running them.

## Troubleshooting

### Common Issues

1. **Error: "User profile not found"**  
   Make sure the tenant has completed their profile before redeeming the code.

2. **Error: "Already associated with this property"**  
   The tenant is already linked to this property.

3. **Error: "Property not found"**  
   The property associated with the invite code no longer exists.

4. **CORS errors in browser console**  
   Make sure your Firebase project has the correct domain in the authorized domains.

### Debugging

1. Check the Firebase Functions logs in the Firebase console
2. Examine the Firestore database to verify document creation/updates
3. Use the browser console to check for client-side errors 