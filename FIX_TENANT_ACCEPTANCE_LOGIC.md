
# Bug Fix: Tenant Not Added to Property on Invite Acceptance (v2)

## 1. Problem Diagnosis

The root cause of the failure is that the frontend **`InviteAcceptancePage.tsx` is not sending the `unitId` to the backend function**.

The backend function `acceptTenantInvite.ts` actually contains the correct logic to handle the new unit-based system, but it can't execute that logic because it never receives the `unitId`. Instead, it falls back to an outdated "legacy" mode that doesn't work with the new data structure, causing the updates to fail silently.

## 2. Solution: Fix the Frontend Payload

The solution is to ensure the `unitId` is correctly retrieved when the invite is validated and then sent to the backend when the invite is accepted.

**File to Modify:** `src/pages/tenant/InviteAcceptancePage.tsx`

### Step 2.1: Update the `InviteDetails` Interface
First, add `unitId` to the `InviteDetails` interface to hold the value we get from the backend.

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
  expiresAt?: string;
  type: 'email' | 'qr';
  status: 'valid' | 'expired' | 'used' | 'invalid';
}
```

### Step 2.2: Store `unitId` When Validating the Invite
In the `validateInviteCode` function, we need to make sure we are storing the `unitId` that the `validatePropertyInvite` function should be returning.

**Find this section inside `validateInviteCode`:**
```typescript
if (data.success && data.invite) {
  setInviteDetails({
    inviteCode,
    property: data.invite.property,
    expiresAt: data.invite.expiresAt,
    type: fromQR ? 'qr' : 'email',
    status: data.invite.status
  });
}
```

**Update it to correctly store the `unitId`:**
```typescript
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
*(Note: This assumes your `validatePropertyInvite` function returns the `unitId`. If it doesn't, that function must also be updated to include it.)*

### Step 2.3: Pass `unitId` to the Backend on Acceptance
This is the most critical fix. In the `handleAcceptInvite` function, we must add the `unitId` to the payload.

**Find this function call inside `handleAcceptInvite`:**
```typescript
const result = await acceptInvite({
  inviteCode: inviteDetails.inviteCode,
  propertyId: propertyId || inviteDetails.property.id
});
```

**Update it to include the `unitId`:**
```typescript
const result = await acceptInvite({
  inviteCode: inviteDetails.inviteCode,
  propertyId: propertyId || inviteDetails.property.id,
  unitId: inviteDetails.unitId // Add this line
});
```

## 3. Verifying the Backend (No Changes Needed)

Your backend function `acceptTenantInvite.ts` already has the correct logic. The key part is this `if` statement, which was not being triggered before:

```typescript
// in functions/src/acceptTenantInvite.ts
const unitId = invite.unitId; 

if (unitId && propertyData.units) {
  // This is the correct, modern logic that will now run.
  const updatePath = `units.${unitId}.tenants`;
  transaction.update(propertyRef, {
    [updatePath]: admin.firestore.FieldValue.arrayUnion(uid),
    // ...
  });
} else {
  // This was the legacy logic that was being incorrectly triggered.
  transaction.update(propertyRef, {
    tenants: admin.firestore.FieldValue.arrayUnion(uid),
    // ...
  });
}
```
By sending the `unitId` from the frontend, you will ensure the correct block of code is executed, and all database writes will be performed as expected.

## 4. Final Check

After applying these frontend changes:
1.  The `InviteAcceptancePage` will correctly request and store the `unitId`.
2.  When the tenant clicks "Accept," the `unitId` will be included in the payload to the `acceptTenantInvite` function.
3.  The backend function will now execute the correct logic, atomically updating the `landlordProfile` and the specific `unit` within the `property` document.
4.  The landlord dashboard will now display the correct, up-to-date information.
