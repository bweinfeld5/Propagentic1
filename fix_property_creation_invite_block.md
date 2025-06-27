
# Cursor Prompt: Fix Blocker in Property Creation Flow (Invite Optional)

## Summary
When adding a new property, the final step (Step 9 of 9) forces the user to send tenant invitations, even if they choose the "Skip invitations for now" option. This makes it **impossible to finish property creation without inviting tenants**, which is broken behavior.

---

## Bug Details

### ❌ Observed Behavior:
- User clicks **"Skip invitations for now (you can send them later)"**
- Still sees error:
  ```
  Property must be created before sending invites.
  ```
- Cannot click **"Send Invites & Finish"**, even though no invites should be required.

---

## ✅ Expected Behavior:
- If "Skip invitations" is selected, the system should:
  1. **Allow property creation without sending tenant invites**
  2. **Show a success confirmation**
  3. **Allow landlords to invite tenants later** via the "Tenants" or "Properties" section

---

## Tasks to Fix

### 1. Allow Property Creation Without Tenant Invites
- If the user selects "Skip invitations for now", bypass the invite requirement and finalize property creation.

```ts
if (skipInvitesChecked) {
  await createProperty();
  toast.success("Property created successfully. You can invite tenants later.");
  navigate("/landlord/properties");
}
```

### 2. Fix Validation Condition
- Audit form validation logic. Current behavior appears to **require at least one tenant email**, even when skipping.

Fix logic like:
```ts
if (!propertyCreated && !tenantEmails.length) {
  showError("Property must be created before sending invites");
}
```
to check the `skipInvitesChecked` flag as well.

### 3. Ensure Invite Flow Can Be Done Later
- Landlord dashboard must allow tenant invites to be sent for an existing property later on.
  - Via a modal, drawer, or button like **"Invite Tenants"** inside the property view.

---

## Acceptance Criteria

- ✅ Landlords can complete property creation without sending any invites.
- ✅ Button "Send Invites & Finish" functions even with "Skip invitations" checked.
- ✅ Error message does not appear unless tenant emails are required and `skipInvitesChecked === false`.
- ✅ Tenants can still be invited later.

---

## Optional Enhancements
- Add a success message that confirms:
  ```
  Property created. No invites sent. You can invite tenants at any time from the property dashboard.
  ```

---

## Tags
`#property-creation` `#tenant-invite` `#form-validation` `#onboarding-bug`
