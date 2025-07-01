
# Troubleshooting: Tenant Not Added to Property on Invite Acceptance

## 1. Problem Diagnosis

The investigation reveals that the tenant invitation acceptance process is failing because the backend logic was not updated to support the new, unit-based property structure.

Specifically, the `acceptTenantInvite` Firebase Function is still attempting to add a tenant's ID to a non-existent `tenants` array on the main property document, instead of adding it to the `tenants` array within a specific unit (e.g., `units.101.tenants`).

This is happening for two reasons:
1.  The frontend is not sending the required `unitId` to the backend.
2.  The backend function doesn't know how to handle the new nested data structure.

## 2. Solution Overview

We will fix this by making targeted changes to both the frontend and the backend.

-   **Frontend (`InviteAcceptancePage.tsx`):** We will ensure the `unitId` is retrieved from the invite details and passed to the backend when the "accept" button is clicked.
-   **Backend (`acceptTenantInvite.ts`):** We will update the function to receive the `unitId` and use it to perform a transactional update on the correct unit within the property document.

---

## 3. Part 1: Frontend Update

**File to Modify:** `src/pages/tenant/InviteAcceptancePage.tsx`

### Step 1.1: Update InviteDetails Interface
First, add `unitId` to the `InviteDetails` interface to ensure type safety.

**Find this interface:**
```typescript
interface InviteDetails {
  inviteCode: string;
  property: Property;
  // ... other fields
}
```

**Add the `unitId` field:**
```typescript
interface InviteDetails {
  inviteCode: string;
  property: Property;
  unitId?: string; // Add this line
  // ... other fields
}
```

### Step 1.2: Store `unitId` When Validating Invite
In the `validateInviteCode` function, make sure to store the `unitId` from the response.

**Find this section:**
```typescript
// Inside validateInviteCode function
if (data.success && data.invite) {
  setInviteDetails({
    inviteCode,
    property: data.invite.property,
    // ... other fields
  });
}
```

**Update it to include `unitId`:**
```typescript
// Inside validateInviteCode function
if (data.success && data.invite) {
  setInviteDetails({
    inviteCode,
    property: data.invite.property,
    unitId: data.invite.unitId, // Add this line
    expiresAt: data.invite.expiresAt,
    type: fromQR ? 'qr' : 'email',
    status: data.invite.status
  });
}
```

### Step 1.3: Pass `unitId` to the Backend
In the `handleAcceptInvite` function, pass the `unitId` in the payload to the backend function.

**Find this section:**
```typescript
// Inside handleAcceptInvite function
const result = await acceptInvite({
  inviteCode: inviteDetails.inviteCode,
  propertyId: propertyId || inviteDetails.property.id
});
```

**Update it to include `unitId`:**
```typescript
// Inside handleAcceptInvite function
const result = await acceptInvite({
  inviteCode: inviteDetails.inviteCode,
  propertyId: propertyId || inviteDetails.property.id,
  unitId: inviteDetails.unitId // Add this line
});
```

---

## 4. Part 2: Backend Update

**File to Modify:** `functions/src/acceptTenantInvite.ts`

### Step 2.1: Receive and Validate `unitId`
At the beginning of the function, receive the `unitId` from the request body and validate it.

**Find this line:**
```typescript
const { inviteCode } = req.body;
```

**Update it to include `unitId`:**
```typescript
const { inviteCode, unitId } = req.body;
```

**Add validation for `unitId` right after the `inviteCode` validation:**
```typescript
// After inviteCode validation
if (!unitId || typeof unitId !== 'string') {
  return res.status(400).json({
    success: false,
    error: "invalid-argument",
    message: "unitId must be a non-empty string."
  });
}
```

### Step 2.2: Perform Transactional Update on the Unit
This is the most critical change. We need to replace the old, incorrect Firestore update logic with a new transaction that correctly targets the nested `tenants` array within the specified unit.

**Find this entire block of code and replace it:**
```typescript
// FIND AND DELETE THIS ENTIRE BLOCK
transaction.update(propertyRef, {
  tenants: admin.firestore.FieldValue.arrayUnion(uid),
  updatedAt: admin.firestore.FieldValue.serverTimestamp()
});
```

**Replace it with this new, correct logic:**
```typescript
// This is the new, correct logic
const propertyData = propertyDoc.data()!;
const unit = propertyData.units?.[unitId];

if (!unit) {
  throw new Error(`Unit ${unitId} not found on property ${propertyId}.`);
}

if (unit.tenants && unit.tenants.length >= unit.capacity) {
  throw new Error(`Unit ${unitId} is already at full capacity.`);
}

// Use dot notation to update the nested tenants array
const updatePath = `units.${unitId}.tenants`;
transaction.update(propertyRef, {
  [updatePath]: admin.firestore.FieldValue.arrayUnion(uid),
  updatedAt: admin.firestore.FieldValue.serverTimestamp()
});

functions.logger.info(`Added tenant ${uid} to unit ${unitId} in property ${propertyId}`);
```

**Important:** This new code should be placed inside the `db.runTransaction` block, right where the old code was. The surrounding transaction logic for updating the landlord profile should remain the same.

## 5. Final Check

After applying these changes, the tenant acceptance flow should work as expected:
1.  The frontend sends the `inviteCode` and `unitId`.
2.  The backend validates both.
3.  The backend function atomically updates the `tenants` array for the specific unit within the property document.

This will resolve the bug and correctly associate the new tenant with their assigned unit.
