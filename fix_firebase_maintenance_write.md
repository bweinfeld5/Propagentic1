
# Cursor Prompt: Maintenance Request Shows Toast but Doesn't Save to Firebase

## Issue Summary
After submitting a maintenance request:
- ✅ A success toast message is shown (`Request submitted successfully` or similar).
- ❌ No data appears in Firebase under `maintenanceRequests` or the relevant collection.

---

## Debugging Checklist

### 1. **Verify Firestore Write Call**
Check the function responsible for submitting the request:

```js
import { addDoc, collection } from 'firebase/firestore';
await addDoc(collection(db, 'maintenanceRequests'), payload);
```

- Ensure this code is actually being called after form submission.
- Add a `console.log("Submitting to Firebase:", payload)` right before the call.

### 2. **Check for Silent Errors**
Wrap the Firestore call in try/catch:

```js
try {
  await addDoc(collection(db, 'maintenanceRequests'), payload);
  toast.success("Request submitted!");
} catch (err) {
  console.error("Failed to write to Firestore:", err);
  toast.error("Failed to submit maintenance request.");
}
```

- You may be swallowing a write error if `await` rejects but the toast is shown anyway.

### 3. **Validate Collection Path**
Make sure the collection you're writing to exists and is named exactly:
- `"maintenanceRequests"` or
- `"tenants/{tenantId}/requests"` or similar.

Double-check dynamic paths:
```js
collection(db, `tenants/${tenantId}/requests`)
```
Make sure `tenantId` is defined.

### 4. **Verify Firebase Rules**
Check if Firestore rules are preventing writes:
```js
match /maintenanceRequests/{docId} {
  allow write: if request.auth != null;
}
```
- Is the user authenticated?
- Are they authorized to write?

---

## Final Goal
- ✅ Toast appears.
- ✅ Document is actually added to Firebase (confirmed in console or dashboard).
- ✅ Errors are visible in dev console if something fails.

---

## Next Steps
Once confirmed working, log both the submitted payload and the resulting document ID.

```js
const docRef = await addDoc(...);
console.log("Request submitted with ID:", docRef.id);
```
