# 🛠️ Fix Invite Code Validation in TenantInviteForm

## 🧩 Problem Summary

When a tenant enters a valid 8-digit invite code shown in their invite email (e.g., `64251450`), the app incorrectly throws an "Invalid invite code" error.

### Evidence:
- Code is clearly shown to be `64251450` in the invite.
- The Firebase function returns `isValid: false`.
- The UI shows "Invalid invite code" with a red X.
- Logs from `TenantInviteForm.tsx` show a failed validation message even though the invite code exists.

---

## 🔎 What You Need to Investigate

1. **Check Firebase Invites Collection**
   - Go to the Firestore database.
   - Look for a document in the `invites` collection where the field `code` equals `64251450`.
   - Confirm it exists and has a valid timestamp (`createdAt`) and property ID.

2. **Audit Invite Code Validation Logic**
   - Find the backend function (Cloud Function or Firestore query) responsible for validating the code.
   - Check if:
     - It's querying using `where("code", "==", inputCode)`
     - The query is case- and type-sensitive.
     - The code is stored as a **string**, not a number.

3. **Potential Type Mismatch**
   - If input from the form is a string and the Firestore `code` is stored as a number (or vice versa), the validation will fail.
   - ✅ Normalize both the `code` field in Firestore and the input to **string** before comparing.

---

## ✅ Fix Plan

### Step 1: Normalize Invite Code Input
Make sure the code input is converted to a string:

```ts
const inviteCode = inputCode.toString().trim();
```

### Step 2: Update Firebase Query (Validation Function)

```ts
const snapshot = await db
  .collection("invites")
  .where("code", "==", inviteCode)
  .limit(1)
  .get();
```

Ensure:
- `inviteCode` is a string
- `code` field in Firestore is stored as a **string**, not a number

If needed, migrate old numeric `code` values in Firestore to strings.

---

## 🚀 Enhancement (Post-Fix)

If validation passes:
- Link tenant to the appropriate property using `propertyId` from the invite doc.
- Store tenant metadata (e.g., email) under that property's subcollection.
- Invalidate or expire the invite if needed.

---

## 🔒 Bonus: Add Logging for Debugging

Add console logs when validating to output:
- Input code
- Type of input code
- Result of Firestore query
- Any matches found

Example:

```ts
console.log("Validating invite code:", inviteCode, "Type:", typeof inviteCode);
console.log("Snapshot size:", snapshot.size);
```

---

## ✅ Acceptance Criteria

- [ ] Tenant can enter 8-digit invite code and be linked to property.
- [ ] "Invalid code" message no longer appears for valid invites.
- [ ] Code comparison is type-safe.
- [ ] Firestore invite codes stored as strings.
- [ ] Proper logging added for validation process.

---

## 📁 Files to Check

- `/functions/validateInviteCode.ts` (or wherever the validation logic lives)
- `/components/TenantInviteForm.tsx`
- Firebase Firestore: `invites` collection
