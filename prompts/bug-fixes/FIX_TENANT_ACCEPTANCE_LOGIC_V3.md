
# Final Fix: Correcting the Tenant Invitation Logic

## 1. Problem Diagnosis

The root cause of the invitation failure is twofold:
1.  **Incorrect Frontend Payload:** The service layer at `src/services/firestore/inviteService.ts` was not sending the `unitId` to the backend.
2.  **Non-Atomic Backend Transaction:** The cloud function `acceptTenantInvite.ts` was performing database writes outside of a transaction, leading to data inconsistency and unhandled errors when one of the writes failed.

This guide provides a definitive, two-part solution to fix the entire flow.

---

## 2. Part 1: Fix the Frontend Service Payload

This is the first critical fix. We must ensure the `unitId` is sent to the backend.

**File to Modify:** `src/services/firestore/inviteService.ts`

### Step 2.1: Update the `acceptTenantInvite` Function
Replace the entire `acceptTenantInvite` function with this corrected version. This version now accepts an object containing the `unitId` and correctly includes it in the body of the request sent to the backend.

```typescript
// Replace the existing acceptTenantInvite function with this one.
export const acceptTenantInvite = async (payload: { inviteCode: string; unitId?: string }): Promise<{
  success: boolean;
  message: string;
  propertyId?: string;
  propertyAddress?: string;
}> => {
  try {
    if (!payload.inviteCode) {
      return { success: false, message: 'Invite code is required' };
    }

    const currentUser = auth.currentUser;
    if (!currentUser) {
      return { success: false, message: 'User must be authenticated' };
    }

    const token = await currentUser.getIdToken();

    // The backend URL for the HTTP function
    const functionUrl = 'https://us-central1-propagentic.cloudfunctions.net/acceptTenantInvite';

    console.log(`Calling acceptTenantInvite function at ${functionUrl} with payload:`, payload);

    const response = await fetch(functionUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      // Ensure the entire payload, including unitId, is sent
      body: JSON.stringify(payload),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('Error response from acceptTenantInvite:', data);
      return {
        success: false,
        message: data.message || `HTTP Error: ${response.status}`
      };
    }

    return {
      success: data.success || true,
      message: data.message || 'Successfully joined property!',
      propertyId: data.propertyId,
      propertyAddress: data.propertyAddress
    };

  } catch (error) {
    console.error('Fatal error calling acceptTenantInvite:', error);
    return {
      success: false,
      message: 'A network or unexpected error occurred. Please try again.'
    };
  }
};
```

### Step 2.2: Update the Frontend Components (Verification)
Ensure that the components calling this service are passing the full payload object.

**File to check:** `src/components/auth/InviteCodeWall.tsx` (and the other two invite modals)
**Verify this line exists in the `handleInviteValidated` function:**
```typescript
const result = await inviteService.acceptTenantInvite({
  inviteCode: propertyInfo.inviteCode,
  unitId: propertyInfo.unitId 
});
```

---

## 3. Part 2: Fix the Backend Transaction Logic

This is the second critical fix. We will rewrite the backend function to be robust and atomic.

**File to Modify:** `functions/src/acceptTenantInvite.ts`

**Replace the entire content of the file** with the following corrected and hardened code. This new version validates all data *before* the transaction and performs all writes *inside* the transaction, preventing data inconsistencies.

```typescript
import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import * as corsLib from "cors";

if (!admin.apps.length) {
  admin.initializeApp();
}
const db = admin.firestore();
const cors = corsLib({ origin: true });

export const acceptTenantInvite = functions.https.onRequest((req, res) => {
  cors(req, res, async () => {
    if (req.method !== "POST") {
      return res.status(405).send({ success: false, message: "Method Not Allowed" });
    }

    const { inviteCode, unitId } = req.body;
    const token = req.headers.authorization?.split("Bearer ")[1];

    if (!token) {
      return res.status(401).json({ success: false, message: "Unauthorized: Missing token." });
    }
    if (!inviteCode || !unitId) {
      return res.status(400).json({ success: false, message: "Invite code and unit ID are required." });
    }

    try {
      const decodedToken = await admin.auth().verifyIdToken(token);
      const uid = decodedToken.uid;
      const normalizedInviteCode = inviteCode.trim().toUpperCase();

      functions.logger.info(`Starting invite acceptance for user ${uid} with code ${normalizedInviteCode} for unit ${unitId}`);

      // --- 1. VALIDATION (Outside Transaction) ---
      const inviteQuery = await db.collection('invites').where('shortCode', '==', normalizedInviteCode).limit(1).get();
      if (inviteQuery.empty) {
        return res.status(404).json({ success: false, message: "Invalid invite code." });
      }

      const inviteDoc = inviteQuery.docs[0];
      const invite = inviteDoc.data();
      if (invite.status !== 'pending') {
        return res.status(400).json({ success: false, message: `This invite has already been ${invite.status}.` });
      }

      const propertyRef = db.collection('properties').doc(invite.propertyId);
      const propertyDoc = await propertyRef.get();
      if (!propertyDoc.exists) {
        return res.status(404).json({ success: false, message: "The associated property does not exist." });
      }
      
      const propertyData = propertyDoc.data()!;
      const unit = propertyData.units?.[unitId];
      if (!unit) {
        return res.status(404).json({ success: false, message: `Unit ${unitId} not found on property.` });
      }
      if ((unit.tenants?.length || 0) >= unit.capacity) {
        return res.status(409).json({ success: false, message: "This unit is at full capacity." });
      }

      const tenantProfileRef = db.collection('tenantProfiles').doc(uid);
      const landlordProfileRef = db.collection('landlordProfiles').doc(invite.landlordId);

      // --- 2. ATOMIC TRANSACTION (All Writes) ---
      await db.runTransaction(async (transaction) => {
        const landlordDoc = await transaction.get(landlordProfileRef);
        if (!landlordDoc.exists()) {
          throw new Error("Landlord profile could not be found.");
        }

        // a. Update Property: Add tenant to the unit's tenants array
        const unitTenantsPath = `units.${unitId}.tenants`;
        transaction.update(propertyRef, {
          [unitTenantsPath]: admin.firestore.FieldValue.arrayUnion(uid),
          updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });

        // b. Update Tenant Profile: Add property to tenant's properties array
        transaction.update(tenantProfileRef, {
          properties: admin.firestore.FieldValue.arrayUnion(invite.propertyId),
          updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });

        // c. Update Landlord Profile: Add tenant to accepted lists
        const acceptedTenantRecord = {
          tenantId: uid,
          propertyId: invite.propertyId,
          unitId: unitId,
          inviteId: inviteDoc.id,
          inviteCode: normalizedInviteCode,
          tenantEmail: invite.tenantEmail || '',
          acceptedAt: admin.firestore.FieldValue.serverTimestamp(),
        };
        transaction.update(landlordProfileRef, {
          acceptedTenants: admin.firestore.FieldValue.arrayUnion(uid),
          acceptedTenantDetails: admin.firestore.FieldValue.arrayUnion(acceptedTenantRecord),
          totalInvitesAccepted: admin.firestore.FieldValue.increment(1),
          updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });

        // d. Update Invite: Mark as accepted
        transaction.update(inviteDoc.ref, {
          status: 'accepted',
          tenantId: uid,
          acceptedAt: admin.firestore.FieldValue.serverTimestamp()
        });
      });

      functions.logger.info(`Successfully completed invite acceptance for user ${uid}`);
      return res.status(200).json({ success: true, message: "Successfully joined property!" });

    } catch (error: any) {
      functions.logger.error("Error in acceptTenantInvite:", error);
      return res.status(500).json({ success: false, message: error.message || "An internal error occurred." });
    }
  });
});
```
