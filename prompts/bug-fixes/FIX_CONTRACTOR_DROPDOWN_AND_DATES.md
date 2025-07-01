
# Bug Fix: Correcting Contractor Dropdown and Maintenance Request Dates

## 1. Objective

This guide provides a definitive fix for two issues on the landlord dashboard's "Maintenance" tab:
1.  The "Assign Contractor" dropdown is empty because it is not being populated with contractor names.
2.  Maintenance requests display "Created Unknown" instead of their creation date.

## 2. Part 1: Fix the Empty Contractor Dropdown

The root cause is that the dashboard is fetching a list of contractor *IDs* but never fetching the full profile documents for those IDs. We will fix this by adding a new function to the `contractorService` and updating the dashboard to use it.

### Step 2.1: Add a New Function to `contractorService`
First, we need to give our application the ability to fetch multiple contractor profiles at once.

**File to Modify:** `src/services/firestore/contractorService.ts`

**Add the following function to this file.** This function is highly efficient as it fetches documents in batches.
```typescript
import { doc, getDoc, collection, query, where, getDocs, documentId } from 'firebase/firestore';
import { db } from '../../firebase/config';

// ... (keep any existing code in the file)

/**
 * Fetches multiple contractor profiles from a list of IDs.
 * @param {string[]} contractorIds - An array of contractor document IDs.
 * @returns {Promise<any[]>} A promise that resolves to an array of contractor profile objects.
 */
export const getContractorsByIds = async (contractorIds: string[]): Promise<any[]> => {
  if (!contractorIds || contractorIds.length === 0) {
    return [];
  }

  const contractors: any[] = [];
  // Firestore 'in' queries are limited to 30 items per query.
  // We process the IDs in chunks to handle any number of contractors.
  const chunks = [];
  for (let i = 0; i < contractorIds.length; i += 30) {
    chunks.push(contractorIds.slice(i, i + 30));
  }

  for (const chunk of chunks) {
    if (chunk.length === 0) continue;
    
    const q = query(collection(db, 'contractorProfiles'), where(documentId(), 'in', chunk));
    const querySnapshot = await getDocs(q);
    querySnapshot.forEach((doc) => {
      contractors.push({ id: doc.id, ...doc.data() });
    });
  }

  return contractors;
};

// You may need to add this service to the default export if one exists
const contractorService = {
  // ... any existing functions
  getContractorsByIds,
};

export default contractorService;
```

### Step 2.2: Update the Dashboard to Use the New Function
Now, we'll update the `LandlordDashboard` to correctly fetch and use the contractor profiles.

**File to Modify:** `src/pages/landlord/LandlordDashboard.tsx`

**Add the new import at the top of the file:**
```typescript
import contractorService from '../../services/firestore/contractorService';
```

**Replace the `useEffect` hook for fetching contractors.** Find the existing `useEffect` that fetches contractors and replace it entirely with this corrected version:
```typescript
// Replace the old contractor-fetching useEffect with this one.
useEffect(() => {
  const fetchContractors = async () => {
    if (currentUser) {
      try {
        const landlordProfile = await landlordProfileService.getLandlordProfile(currentUser.uid);
        const contractorIds = landlordProfile?.contractors || [];

        if (contractorIds.length > 0) {
          // Use the new service function to get full contractor profiles
          const fetchedContractors = await contractorService.getContractorsByIds(contractorIds);
          setContractors(fetchedContractors);
        } else {
          setContractors([]);
        }
      } catch (error) {
        console.error("Error fetching contractors:", error);
        toast.error("Could not load your list of contractors.");
      }
    }
  };
  fetchContractors();
}, [currentUser]);
```

---

## 3. Part 2: Fix the "Created Unknown" Date Display

This is a simple formatting issue. We just need to apply the `formatFirestoreDate` utility we created previously.

**File to Modify:** `src/pages/landlord/LandlordDashboard.tsx`

### Step 3.1: Add a Date to the Ongoing Tickets
In the `renderMaintenanceView` function, find the JSX for the "Ongoing Requests" section.

**Find this block of code:**
```jsx
<p className="text-sm text-gray-600">{ticket.propertyName}</p>
```

**Add the following code directly below it.** This will add the creation date to each ongoing ticket.
```jsx
<p className="text-xs text-gray-500 mt-1">
  Created: {formatFirestoreDate(ticket.createdAt)}
</p>
```

## 4. Final Check

After applying these changes:
1.  The "Assign Contractor" dropdown will now correctly display the names of the landlord's contractors.
2.  The "Ongoing Requests" in the maintenance tab will now show a properly formatted creation date instead of "Created Unknown".
