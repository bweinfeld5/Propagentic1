
# Feature: Contractor Job Status Tracking

## 1. Objective

This guide provides instructions to implement a job status tracking system for contractors. This involves updating the `contractorProfiles` data model and enhancing the existing `assignContractorToRequest` cloud function to populate a new `pending` jobs list when an assignment is made.

## 2. Part 1: Update the Firestore Data Model

We need to add a new field to the documents in the `contractorProfiles` collection to track the status of their assigned jobs.

**Collection to Modify:** `contractorProfiles`

**Instruction:**
For each document in the `contractorProfiles` collection, a new map called `contracts` should be added. This map will contain three arrays to categorize maintenance requests:

-   `contracts` (Map)
    -   `pending` (Array of strings)
    -   `ongoing` (Array of strings)
    -   `finished` (Array of strings)

**Example `contractorProfiles` Document Structure:**
```json
{
  "id": "contractor123",
  "name": "John the Plumber",
  "email": "john@plumbing.com",
  "trades": ["Plumbing"],
  "maintenanceRequests": ["req1", "req2"], // This is the old field
  "contracts": {
    "pending": ["req3"], // The new field we are adding to
    "ongoing": ["req2"],
    "finished": ["req1"]
  }
}
```
*Note: New contractor documents should be created with these three empty arrays within the `contracts` map.*

---

## 3. Part 2: Update the Backend Assignment Logic

The existing cloud function that handles assignments must be updated to populate the new `pending` array.

**File to Modify:** `functions/src/assignContractorToRequest.ts`

**Instruction:**
Modify the `assignContractorToRequest` function to add one more write operation to the existing Firestore transaction. This new operation will add the `requestId` to the assigned contractor's `contracts.pending` array.

**Replace the entire `assignContractorToRequest` function with the following corrected and enhanced code:**

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
    // 3. Perform all updates in a single atomic transaction
    await db.runTransaction(async (transaction) => {
      // READ PHASE: Perform all reads first.
      const requestDoc = await transaction.get(requestRef);
      if (!requestDoc.exists) {
        throw new functions.https.HttpsError('not-found', 'Maintenance request not found.');
      }
      const contractorDoc = await transaction.get(contractorProfileRef);
      if (!contractorDoc.exists) {
        throw new functions.https.HttpsError('not-found', 'Contractor profile not found.');
      }

      // WRITE PHASE: Perform all writes now.
      
      // a. Update the maintenance request document
      transaction.update(requestRef, {
        contractorId: contractorId,
        status: 'in-progress', // Set status to 'in-progress' upon assignment
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });

      // b. Update the contractor's profile with the new contract
      // This uses dot notation to update a nested field.
      const newContractPath = `contracts.pending`;
      transaction.update(contractorProfileRef, {
        [newContractPath]: admin.firestore.FieldValue.arrayUnion(requestId)
      });
    });

    functions.logger.info(`Successfully assigned contractor ${contractorId} to request ${requestId}`);
    return { success: true, message: "Contractor assigned successfully." };

  } catch (error) {
    console.error("Error assigning contractor:", error);
    if (error instanceof functions.https.HttpsError) {
      throw error;
    }
    throw new functions.https.HttpsError('internal', 'An internal error occurred while assigning the contractor.');
  }
});
```

## 4. Final Check

After deploying these changes, when a landlord assigns a contractor to a maintenance request:
1.  The `maintenanceRequests` document will be updated with the `contractorId` and its status will change to `in-progress`.
2.  The `contractorProfiles` document for the assigned contractor will have the maintenance request's ID added to its `contracts.pending` array.
3.  Both of these operations will happen atomically, ensuring data integrity.
