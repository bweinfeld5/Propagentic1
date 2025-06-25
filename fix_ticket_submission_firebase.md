
# Cursor Prompt: Fix Maintenance Request Not Saving to Firebase (Should Save to `tickets` Collection)

## Summary of Problem
When submitting a maintenance request from the enhanced form, a toast appears confirming submission, but **no document is saved in Firebase**.

Console logs reveal the following issues:

---

## Key Console Clues

### 🔸 Simulated Submission
```
EnhancedMaintenanceForm.tsx:257 Test mode: Maintenance request submission simulated
```
- This suggests the form is **running in test/simulated mode**, which likely **bypasses** the actual Firebase write call.
- However, `demoMode=false` is printed, which means **real data should be sent**.

---

### 🔸 Firestore Collection Misnamed
Submission appears to go to a collection named:
```
maintenance_requests
```
But the correct Firestore collection name should be:
```
tickets
```

This needs to be corrected anywhere in the code that references Firestore paths.

---

### 🔸 TenantInviteGuard Blocking Access
Logs from `TenantInviteGuard.tsx`:
```
propertyId: undefined
landlordId: undefined
allowAccess: false
needsInvite: true
```
This suggests the **user is not associated with a property or landlord**, and the guard is **denying access**, potentially disabling or altering Firestore behavior.

---

### 🔸 Firebase Error: Missing Index
```
Permission error fetching tickets: FirebaseError: The query requires an index.
```
- Fix this by following the Firebase console link to create the required index.
- Alternatively, simplify or guard against complex queries during testing.

---

## What to Fix

1. ✅ **Disable "test mode" fallback in `EnhancedMaintenanceForm.tsx`**
   - Ensure `demoMode` is respected.
   - Remove or bypass the test-mode block if `demoMode === false`.

2. 🛠️ **Update Firestore collection reference**
   - Change from `maintenance_requests` to `tickets` wherever requests are saved.

3. 🔐 **Allow uninvited test tenants to submit**
   - Modify `TenantInviteGuard.tsx` to allow access if in development or testing mode, e.g.:
     ```ts
     const allowAccess = isTestMode || (propertyId && landlordId && !needsInvite);
     ```

4. 📚 **Fix Firebase security rules (if relevant)**
   - Ensure `tickets` write permissions allow valid tenants or test users.

5. ⚙️ **Create required Firestore index**
   - Follow link in the error or rewrite the query to not require an index during dev.

---

## Goal
Submitting a maintenance request should:

- ✅ Add a new document to `tickets` in Firebase.
- ✅ Show toast confirmation.
- ✅ Not rely on `test mode` or simulation logic.
- ✅ Log `docRef.id` after successful submission for confirmation.

---

## Additional Suggestion
Temporarily enable verbose logging for Firebase writes:
```ts
console.log("Submitting to 'tickets':", payload);
const docRef = await addDoc(collection(db, 'tickets'), payload);
console.log("Document written with ID:", docRef.id);
```
