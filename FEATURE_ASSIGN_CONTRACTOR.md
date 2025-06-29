
# Feature: Assign Contractors to Maintenance Requests

## 1. Objective

This guide outlines the complete implementation of a system for landlords to assign their preferred contractors to maintenance requests directly from the dashboard. This involves updating the UI to categorize requests, adding a new backend function for the assignment logic, and updating the Firestore data model.

---

## 2. Part 1: Data Model and Backend Function

We will start by creating the backend infrastructure. This ensures the core logic is in place before we build the UI.

### Step 2.1: Update the Data Models
The following fields need to be added to your Firestore documents:

1.  **In the `maintenanceRequests` collection:** Each document needs a new field to store the ID of the assigned contractor.
    -   Add `contractorId: string | null`

2.  **In the `contractorProfiles` collection:** Each document needs a new array to store a list of assigned maintenance request IDs.
    -   Add `maintenanceRequests: string[]`

### Step 2.2: Create the Backend Cloud Function
This new Firebase Function will handle the assignment atomically, ensuring data consistency.

**Create a new file at this location:** `functions/src/assignContractorToRequest.ts`

**Add the following code to the new file:**
```typescript
import * as functions from "firebase-functions";
import * as admin from "firebase-admin";

if (!admin.apps.length) {
  admin.initializeApp();
}
const db = admin.firestore();

export const assignContractorToRequest = functions.https.onCall(async (data, context) => {
  // 1. Authentication & Validation
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'The function must be called while authenticated.');
  }
  const landlordId = context.auth.uid;
  const { requestId, contractorId } = data;

  if (!requestId || !contractorId) {
    throw new functions.https.HttpsError('invalid-argument', 'The function must be called with "requestId" and "contractorId" arguments.');
  }

  functions.logger.info(`Assigning contractor ${contractorId} to request ${requestId} by landlord ${landlordId}`);

  // 2. Define Document References
  const requestRef = db.collection('maintenanceRequests').doc(requestId);
  const contractorProfileRef = db.collection('contractorProfiles').doc(contractorId);

  try {
    // 3. Perform updates in a single atomic transaction
    await db.runTransaction(async (transaction) => {
      // Read the maintenance request to ensure it exists
      const requestDoc = await transaction.get(requestRef);
      if (!requestDoc.exists) {
        throw new functions.https.HttpsError('not-found', 'Maintenance request not found.');
      }

      // Update the maintenance request with the contractorId and set status to 'in-progress'
      transaction.update(requestRef, {
        contractorId: contractorId,
        status: 'in-progress',
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });

      // Add the maintenance request ID to the contractor's profile
      transaction.update(contractorProfileRef, {
        maintenanceRequests: admin.firestore.FieldValue.arrayUnion(requestId)
      });
    });

    functions.logger.info(`Successfully assigned contractor ${contractorId} to request ${requestId}`);
    return { success: true, message: "Contractor assigned successfully." };

  } catch (error) {
    console.error("Error assigning contractor:", error);
    // Re-throw errors to be caught by the client
    if (error instanceof functions.https.HttpsError) {
      throw error;
    }
    throw new functions.https.HttpsError('internal', 'An internal error occurred while assigning the contractor.');
  }
});
```

### Step 2.3: Export the New Function
To deploy this new function, it must be exported from the main index file.

**File to Modify:** `functions/src/index.ts`

**Add the following export line:**
```typescript
export { assignContractorToRequest } from './assignContractorToRequest';
```

---

## 4. Part 2: Frontend Dashboard Implementation

Now, we will build the user interface on the landlord dashboard.

**File to Modify:** `src/pages/landlord/LandlordDashboard.tsx`

### Step 4.1: Import `httpsCallable`
We need this to call our new backend function.

**Add this to the existing imports from `firebase/functions`:**
```typescript
import { getFunctions, httpsCallable } from 'firebase/functions';
```

### Step 4.2: Fetch Contractors
The dashboard needs to know which contractors are available to be assigned.

**Add the new state variables inside the `LandlordDashboard` component:**
```typescript
const [contractors, setContractors] = useState<any[]>([]);
const [isAssigning, setIsAssigning] = useState<string | null>(null); // To track which request is being updated
```

**Add this `useEffect` hook to fetch the contractors when the component loads:**
```typescript
useEffect(() => {
  const fetchContractors = async () => {
    if (currentUser) {
      try {
        // Assuming landlordProfileService has a function to get contractors
        const landlordProfile = await landlordProfileService.getLandlordProfile(currentUser.uid);
        if (landlordProfile && landlordProfile.contractors) {
          // You may need a service to get full contractor details from their IDs
          // For now, we'll assume the profile contains the necessary info
          setContractors(landlordProfile.contractors);
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

### Step 4.3: Implement the Assignment Logic
This function will be called when the landlord selects a contractor from the dropdown.

**Add this new handler function inside the `LandlordDashboard` component:**
```typescript
const handleAssignContractor = async (requestId: string, contractorId: string) => {
  if (!window.confirm("Are you sure you want to assign this contractor?")) {
    return;
  }

  setIsAssigning(requestId);
  const toastId = toast.loading('Assigning contractor...');

  try {
    const functions = getFunctions();
    const assignContractor = httpsCallable(functions, 'assignContractorToRequest');
    
    await assignContractor({ requestId, contractorId });

    toast.success('Contractor assigned successfully!', { id: toastId });

    // Refresh the dashboard data to show the change
    loadDashboardData();

  } catch (error: any) {
    console.error("Error assigning contractor:", error);
    toast.error(`Assignment failed: ${error.message}`, { id: toastId });
  } finally {
    setIsAssigning(null);
  }
};
```

### Step 4.4: Update the Maintenance View
Finally, update the `renderMaintenanceView` function to include the new UI.

**Replace the entire `renderMaintenanceView` function with this new version:**
```jsx
const renderMaintenanceView = (): JSX.Element => {
  const ongoingTickets = tickets.filter(t => t.status === 'pending' || t.status === 'in-progress');
  const finishedTickets = tickets.filter(t => t.status === 'completed' || t.status === 'closed');

  return (
    <div className="p-6 bg-gray-50 min-h-full">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Ongoing Section */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Ongoing Requests</h3>
          {ongoingTickets.length === 0 ? (
            <p className="text-gray-500">No ongoing maintenance requests.</p>
          ) : (
            <div className="space-y-4">
              {ongoingTickets.map((ticket) => (
                <div key={ticket.id} className="p-4 bg-white border border-gray-200 rounded-lg shadow-sm">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-semibold text-gray-800">{ticket.title || 'Maintenance Request'}</h4>
                      <p className="text-sm text-gray-600">{ticket.propertyName}</p>
                    </div>
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                      ticket.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : 'bg-blue-100 text-blue-800'
                    }`}>
                      {ticket.status}
                    </span>
                  </div>
                  <p className="text-sm text-gray-700 mt-2">{ticket.description}</p>
                  
                  {/* Assignment UI */}
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    {ticket.status === 'pending' && (
                      <>
                        <label htmlFor={`assign-${ticket.id}`} className="block text-sm font-medium text-gray-700 mb-1">Assign Contractor</label>
                        <div className="flex gap-2">
                          <select
                            id={`assign-${ticket.id}`}
                            disabled={isAssigning === ticket.id}
                            onChange={(e) => handleAssignContractor(ticket.id, e.target.value)}
                            className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-orange-500 focus:border-orange-500 sm:text-sm"
                          >
                            <option value="">Select a contractor...</option>
                            {contractors.map(contractor => (
                              <option key={contractor.id} value={contractor.id}>{contractor.name || contractor.email}</option>
                            ))}
                          </select>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">Status will become "in-progress" upon assignment.</p>
                      </>
                    )}
                    {ticket.status === 'in-progress' && (
                      <p className="text-sm text-gray-600">
                        <strong>Assigned to:</strong> {contractors.find(c => c.id === ticket.contractorId)?.name || 'Unknown Contractor'}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Finished Section */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Finished Requests</h3>
          {finishedTickets.length === 0 ? (
            <p className="text-gray-500">No finished maintenance requests.</p>
          ) : (
            <div className="space-y-4">
              {finishedTickets.map((ticket) => (
                <div key={ticket.id} className="p-4 bg-white border border-gray-200 rounded-lg opacity-70">
                  <h4 className="font-semibold text-gray-700">{ticket.title || 'Maintenance Request'}</h4>
                  <p className="text-sm text-gray-500">{ticket.propertyName}</p>
                  <p className="text-xs text-gray-500 mt-1">Completed on: {formatFirestoreDate(ticket.updatedAt)}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
```
