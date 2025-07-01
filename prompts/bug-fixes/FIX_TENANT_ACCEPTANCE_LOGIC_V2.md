
# Critical Fix: Correcting the Tenant Invitation Flow

## 1. Problem Diagnosis

The root cause of the invitation failure has been located. The service layer function `inviteService.acceptTenantInvite` was only designed to accept an `inviteCode`, completely ignoring the `unitId`. This caused the backend to receive an incomplete payload and fail to add the tenant to the correct unit.

This guide provides the definitive fix by updating the service layer and all the frontend components that call it.

## 2. Part 1: Update the Service Layer

This is the most critical change. We must update the function that makes the final call to the backend.

**File to Modify:** `src/services/firestore/inviteService.ts`

### Step 2.1: Update the `acceptTenantInvite` Function Signature
Find the `acceptTenantInvite` function and change its signature to accept an object.

**Find this line:**
```typescript
export const acceptTenantInvite = async (inviteCode: string): Promise<{
```
**Change it to:**
```typescript
export const acceptTenantInvite = async (payload: { inviteCode: string; unitId?: string }): Promise<{
```

### Step 2.2: Update the `fetch` Request Body
Now, modify the `body` of the `fetch` call to include the entire payload.

**Find this line:**
```typescript
body: JSON.stringify({ inviteCode }),
```
**Change it to:**
```typescript
body: JSON.stringify(payload),
```

The final, corrected function in `inviteService.ts` should look like this:
```typescript
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

    const response = await fetch('https://us-central1-propagentic.cloudfunctions.net/acceptTenantInvite', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(payload), // Pass the entire payload
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        message: data.message || `HTTP ${response.status}: ${response.statusText}`
      };
    }

    return {
      success: data.success || true,
      message: data.message || 'Successfully joined property!',
      propertyId: data.propertyId,
      propertyAddress: data.propertyAddress
    };

  } catch (error) {
    console.error('Error accepting tenant invite:', error);
    return {
      success: false,
      message: 'Failed to join property. Please try again.'
    };
  }
};
```

---

## 3. Part 2: Update Frontend Components

Now we must update the three components that use this service to pass the correct payload.

### Step 3.1: Update `InviteCodeModal.tsx`

**File to Modify:** `src/components/auth/InviteCodeModal.tsx`

**Find this function call inside `handleInviteValidated`:**
```typescript
const result = await inviteService.acceptTenantInvite(propertyInfo.inviteCode);
```
**Change it to pass the full object:**
```typescript
const result = await inviteService.acceptTenantInvite({
  inviteCode: propertyInfo.inviteCode,
  unitId: propertyInfo.unitId
});
```

### Step 3.2: Update `InviteCodeWall.tsx`

**File to Modify:** `src/components/auth/InviteCodeWall.tsx`

**Find this function call inside `handleInviteValidated`:**
```typescript
const result = await inviteService.acceptTenantInvite(propertyInfo.inviteCode);
```
**Change it to pass the full object:**
```typescript
const result = await inviteService.acceptTenantInvite({
  inviteCode: propertyInfo.inviteCode,
  unitId: propertyInfo.unitId
});
```

### Step 3.3: Update `TenantInviteModal.tsx`

**File to Modify:** `src/components/tenant/TenantInviteModal.tsx`

**Find this function call inside `handleJoinProperty`:**
```typescript
const result = await inviteService.acceptTenantInvite(validatedProperty.inviteCode);
```
**Change it to pass the full object:**
```typescript
const result = await inviteService.acceptTenantInvite({
  inviteCode: validatedProperty.inviteCode,
  unitId: validatedProperty.unitId
});
```

## 4. Final Check

After applying these changes, the entire flow will be corrected:
1.  The frontend components will now pass an object containing both `inviteCode` and `unitId` to the `inviteService`.
2.  The `inviteService` will forward this complete payload to the backend Firebase Function.
3.  The backend function will receive the `unitId` and execute the correct logic to update the landlord's profile and the specific unit in the property document.
