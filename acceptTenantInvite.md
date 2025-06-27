# Task: Implement Tenant Invite Acceptance Flow (From Scratch)

## Overview
Build backend functionality that allows a **tenant to accept an invite** from a landlord using an **8-digit invite code**. The old implementation was deleted — this should be rebuilt **from scratch**, using the UML diagram provided.

## System Context
- Firestore collections used:
  - `invites`: stores invites with an 8-digit `code` and a `propertyId`
  - `users`: contains user auth data; tenant's `uid` is used to find the corresponding `tenantProfile`
  - `tenantProfiles`: contains tenant metadata, including a `properties` array
  - `properties`: contains all property documents; validate against `propertyId` in invite

## What is already implemented
- The **frontend** already verifies that the tenant is not already associated with a property.
- Basic Firestore setup and user authentication is in place.

## What you need to implement
1. **Create a new Firebase Callable Function** called `acceptTenantInvite`.
2. The function should:
    - Accept a JSON payload with: `{ inviteCode: string }`
    - Get the `uid` of the authenticated user.
    - Use that `uid` to fetch the corresponding document in `tenantProfiles` (where `tenantProfile.uid == uid`)
    - Search the `invites` collection for a document where `code == inviteCode`
      - If no such document exists → throw `invalid-argument` error: `"Invalid invite code."`
    - Get the `propertyId` from the invite document.
    - Verify that a property with that `propertyId` exists in the `properties` collection
      - If no such document exists → throw `not-found` error: `"Property does not exist."`
    - Fetch the tenant's current `properties` array.
      - If `propertyId` is already in the array → throw `already-exists` error: `"Tenant already linked to this property."`
    - Append the `propertyId` to the tenantProfile’s `properties` array.
    - Save the updated tenantProfile.

3. Ensure errors are logged and caught clearly.

## Output
Please add the new function in a Firebase Cloud Function file (e.g., `index.ts` or a new `tenants.ts` module if applicable). Include TypeScript typings and use best practices for error handling.

## Example Firestore Data Structures

### `invites`
```json
{
  "code": "12345678",
  "propertyId": "abc123",
  "createdAt": Timestamp,
  ...
}
```

### `tenantProfiles`
```json
{
  "uid": "user123",
  "name": "John Tenant",
  "properties": ["abc123"]
}
```

### `properties`
```json
{
  "id": "abc123",
  "address": "123 Main St",
  ...
}
```

## Notes
- If the invite is valid and everything checks out, **do not delete the invite** (unless future functionality requires this).
- Use structured logging to help with debugging.
- Keep this functionality modular — it may be used again for other user roles in future updates.

## Additional Context
Refer to the attached UML diagram to understand the intended flow.
