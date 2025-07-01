# Restore Maintenance Request Creation on Chat Open

We used to have the functionality to create a new document in the `maintenanceRequests` Firestore collection when a tenant opened a chat, but this no longer works. Please do the following to restore and enforce the correct behavior:

## ✅ Requirements:

1. **On Chat Open:**
   - When a tenant opens a chat with the landlord or property management system, it should immediately:
     - Create a new document in the `maintenanceRequests` Firestore collection.
     - This document should include:
       - `tenantId`: the current user's ID
       - `timestamp`: the time of creation
       - `status`: default to `"pending"`
       - `chatSessionId`: if available
       - any other existing metadata fields previously supported (such as `issueType`, `description`, `images`, etc.)

2. **Associate with Property:**
   - Look up the current tenant's `propertyId` by checking the `users` collection using their UID.
   - Once `propertyId` is known, find the corresponding document in the `properties` collection.
   - Add the ID of the newly created `maintenanceRequest` to the `maintenanceRequests` array of that property document (initialize the array if it doesn't exist).

3. **Ensure Idempotency:**
   - Do not create duplicate requests on repeat menu opens or chat reloads.
   - Consider using a `chatSessionId` or timestamp windowing to avoid spammy duplication.

4. **Logging:**
   - Add logs that confirm when:
     - A new `maintenanceRequest` is created.
     - A request is added to a property’s array.

5. **Validation and Error Handling:**
   - Handle Firestore permission errors gracefully.
   - Warn the user or fallback to logging if the property association step fails.
