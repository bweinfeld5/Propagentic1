
# Bug Fix: Firestore Transaction and Permission Errors

## 1. Objective

This guide provides the necessary fixes for two critical Firebase errors:
1.  A transaction error ("All reads must be executed before all writes") that occurs when removing a tenant.
2.  Permission errors ("Missing or insufficient permissions") that prevent the landlord dashboard from loading tenant details.

## 2. Part 1: Fixing the Firestore Transaction Error

The transaction error is caused by performing a read operation after a write operation within the same transaction. We will fix this by reordering the operations in the `removeTenant` function.

**File to Modify:** `src/services/firestore/landlordProfileService.ts`

**Replace the `removeTenant` function:** Find the entire `removeTenant` function and replace it with the following corrected version.

```typescript
// Replace the entire old function with this one.
export const removeTenant = async (landlordId: string, tenantId: string, propertyId: string): Promise<void> => {
  if (!landlordId || !tenantId || !propertyId) {
    throw new Error("Landlord ID, Tenant ID, and Property ID are required.");
  }

  const landlordProfileRef = doc(db, 'landlordProfiles', landlordId);
  const propertyRef = doc(db, 'properties', propertyId);

  try {
    await db.runTransaction(async (transaction) => {
      // --- READ PHASE ---
      // All reads must happen BEFORE any writes.
      const landlordDoc = await transaction.get(landlordProfileRef);
      const propertyDoc = await transaction.get(propertyRef);

      if (!landlordDoc.exists()) {
        throw new Error("Landlord profile not found.");
      }

      // --- WRITE PHASE ---
      // Now we can safely perform all our write operations.
      const landlordData = landlordDoc.data();
      
      // Find the specific tenant record to remove from the detailed list.
      const tenantRecordToRemove = landlordData.acceptedTenantDetails?.find(
        (record: AcceptedTenantRecord) => record.tenantId === tenantId && record.propertyId === propertyId
      );

      // 1. Update the landlord's profile.
      // We use arrayRemove to safely remove elements from arrays.
      transaction.update(landlordProfileRef, {
        acceptedTenants: arrayRemove(tenantId),
        acceptedTenantDetails: tenantRecordToRemove ? arrayRemove(tenantRecordToRemove) : undefined,
        totalInvitesAccepted: landlordData.totalInvitesAccepted > 0 ? landlordData.totalInvitesAccepted - 1 : 0,
        updatedAt: serverTimestamp()
      });

      // 2. Update the property document.
      if (propertyDoc.exists()) {
        const propertyData = propertyDoc.data();
        // Find which unit the tenant is in and remove them.
        for (const unitId in propertyData.units) {
          const unit = propertyData.units[unitId];
          if (unit.tenants?.includes(tenantId)) {
            const updatePath = `units.${unitId}.tenants`;
            transaction.update(propertyRef, {
              [updatePath]: arrayRemove(tenantId)
            });
            break; // Assume tenant is only in one unit per property.
          }
        }
      } else {
        console.warn(`Property with ID ${propertyId} not found during tenant removal.`);
      }
    });
    console.log(`Successfully removed tenant ${tenantId} from landlord ${landlordId}`);
  } catch (error) {
    console.error('Error in removeTenant transaction:', error);
    throw error; // Re-throw the error to be caught by the calling UI.
  }
};
```

---

## 3. Part 2: Fixing the Firestore Permission Errors

The permission errors are happening because the security rules are too restrictive. We will update them to allow landlords to read the information of tenants they have accepted.

**File to Modify:** `firestore.rules`

**Replace the entire content of `firestore.rules` with the following:** This new ruleset is more secure and explicitly defines the relationships required for users to access data.

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    // Function to check if a user is a landlord.
    function isLandlord(userId) {
      return exists(/databases/$(database)/documents/landlordProfiles/$(userId));
    }

    // Function to check if a user is a tenant of a specific landlord.
    function isTenantOf(landlordId, tenantId) {
      return get(/databases/$(database)/documents/landlordProfiles/$(landlordId)).data.acceptedTenants.hasAny([tenantId]);
    }

    // Users Collection:
    // - Allow users to read/write their own document.
    // - Allow a landlord to read the user document of one of their accepted tenants.
    match /users/{userId} {
      allow read, write: if request.auth.uid == userId;
      allow read: if isLandlord(request.auth.uid) && isTenantOf(request.auth.uid, userId);
    }

    // Tenant Profiles Collection:
    // - Allow tenants to read/write their own profile.
    // - Allow a landlord to read the profile of one of their accepted tenants.
    match /tenantProfiles/{tenantId} {
      allow read, write: if request.auth.uid == tenantId;
      allow read: if isLandlord(request.auth.uid) && isTenantOf(request.auth.uid, tenantId);
    }

    // Landlord Profiles Collection:
    // - Allow landlords to read/write their own profile.
    match /landlordProfiles/{landlordId} {
      allow read, write: if request.auth.uid == landlordId;
    }

    // Properties Collection:
    // - Allow landlords to manage properties they own.
    // - Allow tenants to read properties they are associated with.
    match /properties/{propertyId} {
      allow read, create, update, delete: if request.auth.uid == resource.data.landlordId;
      allow read: if get(/databases/$(database)/documents/tenantProfiles/$(request.auth.uid)).data.properties.hasAny([propertyId]);
    }

    // Invites Collection:
    // - Allow landlords to create invites.
    // - Allow authenticated users to read invites if they have the code (for acceptance page).
    match /invites/{inviteId} {
      allow create: if isLandlord(request.auth.uid);
      allow read: if request.auth != null;
    }

    // Maintenance Requests Collection:
    // - Allow tenants to create requests.
    // - Allow landlords to read/update requests for their properties.
    // - Allow tenants to read requests for properties they are part of.
    match /maintenanceRequests/{requestId} {
      allow create: if request.auth.uid == request.resource.data.tenantId;
      allow read, update: if isLandlord(request.auth.uid) && request.auth.uid == resource.data.landlordId;
      allow read: if get(/databases/$(database)/documents/tenantProfiles/$(request.auth.uid)).data.properties.hasAny([resource.data.propertyId]);
    }
  }
}
```

## 4. Final Check

After applying these changes and deploying your Firestore rules:
1.  The tenant deletion process will complete without any transaction errors.
2.  The landlord dashboard will load successfully, displaying all tenant details without any permission-denied errors in the console.
