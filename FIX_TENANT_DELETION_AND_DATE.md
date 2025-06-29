
# Bug Fix: Tenant Deletion and Invalid Date Display

## 1. Objective

This guide provides the necessary steps to fix two critical bugs in the landlord dashboard:
1.  The failure to delete a tenant, which throws an "invalid query" error.
2.  The "Invalid Date" text appearing for the join date of all tenants.

## 2. Part 1: Fixing the Tenant Deletion Logic

The root cause of the deletion failure is that the frontend is not correctly passing the `tenantId` to the backend service. We will fix this by adding a dedicated `removeTenant` function to the `landlordProfileService` and ensuring it's called with the correct data.

### Step 2.1: Create a Date Utility File
First, let's create a centralized place for our date formatting logic. This will fix the "Invalid Date" issue and be reusable elsewhere.

**Create a new file:** `src/utils/dateUtils.ts`
```typescript
import { Timestamp } from 'firebase/firestore';

/**
 * Safely converts a Firestore Timestamp, JavaScript Date, or date string into a formatted string.
 * @param dateInput - The date to format (Timestamp, Date, or string).
 * @param options - Optional formatting options for toLocaleDateString.
 * @returns A formatted date string (e.g., "Jan 1, 2023") or "Date not available".
 */
export const formatFirestoreDate = (
  dateInput: any,
  options: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }
): string => {
  if (!dateInput) {
    return 'Date not available';
  }

  try {
    // Check if it's a Firestore Timestamp and convert it
    if (dateInput instanceof Timestamp) {
      return dateInput.toDate().toLocaleDateString('en-US', options);
    }
    
    // Check if it's already a JavaScript Date
    if (dateInput instanceof Date) {
      return dateInput.toLocaleDateString('en-US', options);
    }

    // Try to parse it as a string
    const date = new Date(dateInput);
    if (!isNaN(date.getTime())) {
      return date.toLocaleDateString('en-US', options);
    }

    return 'Invalid Date';
  } catch (error) {
    console.error("Error formatting date:", error);
    return 'Invalid Date';
  }
};
```

### Step 2.2: Update the `landlordProfileService`
Now, let's add the tenant removal logic directly into the service layer.

**File to Modify:** `src/services/firestore/landlordProfileService.ts`

**Add the following function to the file:**
```typescript
// Add this import at the top
import { arrayRemove } from 'firebase/firestore';

// Add this new function inside the file
/**
 * Removes a tenant from a landlord's profile and the associated property.
 */
export const removeTenant = async (landlordId: string, tenantId: string, propertyId: string): Promise<void> => {
  if (!landlordId || !tenantId || !propertyId) {
    throw new Error("Landlord ID, Tenant ID, and Property ID are required.");
  }

  const landlordProfileRef = doc(db, 'landlordProfiles', landlordId);
  const propertyRef = doc(db, 'properties', propertyId);

  try {
    await db.runTransaction(async (transaction) => {
      const landlordDoc = await transaction.get(landlordProfileRef);
      if (!landlordDoc.exists()) {
        throw new Error("Landlord profile not found.");
      }

      const landlordData = landlordDoc.data();
      
      // Find the specific tenant record to remove from acceptedTenantDetails
      const tenantRecordToRemove = landlordData.acceptedTenantDetails?.find(
        (record: AcceptedTenantRecord) => record.tenantId === tenantId && record.propertyId === propertyId
      );

      if (!tenantRecordToRemove) {
        console.warn(`Tenant record for tenant ${tenantId} on property ${propertyId} not found. Proceeding with other removals.`);
      }

      // 1. Remove the tenant from the landlord's main list
      transaction.update(landlordProfileRef, {
        acceptedTenants: arrayRemove(tenantId),
        acceptedTenantDetails: tenantRecordToRemove ? arrayRemove(tenantRecordToRemove) : undefined,
        totalInvitesAccepted: landlordData.totalInvitesAccepted > 0 ? landlordData.totalInvitesAccepted - 1 : 0,
        updatedAt: serverTimestamp()
      });

      // 2. Remove the tenant from the property's tenants array (new unit structure)
      const propertyDoc = await transaction.get(propertyRef);
      if (propertyDoc.exists()) {
        const propertyData = propertyDoc.data();
        // Find which unit the tenant is in and remove them
        for (const unitId in propertyData.units) {
          const unit = propertyData.units[unitId];
          if (unit.tenants?.includes(tenantId)) {
            const updatePath = `units.${unitId}.tenants`;
            transaction.update(propertyRef, {
              [updatePath]: arrayRemove(tenantId)
            });
            break; // Assume tenant is only in one unit per property
          }
        }
      }
    });
  } catch (error) {
    console.error('Error removing tenant:', error);
    throw error;
  }
};

// IMPORTANT: Export the new function
const landlordProfileService = {
  // ... keep existing exports
  removeTenant // Add this line
};

export default landlordProfileService;
```

### Step 2.3: Update `AcceptedTenantsSection.jsx`
Finally, update the component to use the new service function and the date formatting utility.

**File to Modify:** `src/components/landlord/AcceptedTenantsSection.jsx`

**Add the new imports at the top:**
```javascript
import { formatFirestoreDate } from '../../utils/dateUtils';
import landlordProfileService from '../../services/firestore/landlordProfileService'; // Ensure this is imported
```

**Replace the `confirmRemoveTenant` function:**
```javascript
// Replace the entire confirmRemoveTenant function with this
const confirmRemoveTenant = async () => {
  if (!tenantToRemove || !currentUser) return;

  const { tenantId, propertyId } = tenantToRemove;

  if (!tenantId || !propertyId) {
    toast.error("Cannot remove tenant: Missing Tenant ID or Property ID.");
    return;
  }

  setIsRemoving(true);
  try {
    await landlordProfileService.removeTenant(currentUser.uid, tenantId, propertyId);
    toast.success("Tenant removed successfully!");
    
    // Refresh the list locally for immediate UI update
    setTenants(prev => prev.filter(t => !(t.tenantId === tenantId && t.propertyId === propertyId)));
    
    setShowRemoveModal(false);
    setTenantToRemove(null);
  } catch (err) {
    console.error('Error removing tenant:', err);
    toast.error(`Failed to remove tenant: ${err.message}`);
  } finally {
    setIsRemoving(false);
  }
};
```

**Replace the `formatDate` helper function:**
```javascript
// Delete the old formatDate function entirely.
// We will now use the imported formatFirestoreDate function directly in the JSX.
```

**Update the JSX to use the new date formatter:**
Find this line in the JSX:
```jsx
Joined: {formatDate(tenant.acceptedAt || tenant.joinedDate)}
```
And replace it with this:
```jsx
Joined: {formatFirestoreDate(tenant.acceptedAt || tenant.joinedDate)}
```

## 3. Final Check

After applying these changes:
1.  Deleting a tenant will now correctly call the robust `landlordProfileService.removeTenant` function, which validates the IDs and performs a clean, transactional removal.
2.  The "Invalid Date" error will be gone, replaced by correctly formatted dates (e.g., "Jan 1, 2023") or the fallback text "Date not available" if the date is missing.
