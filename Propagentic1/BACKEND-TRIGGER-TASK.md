# Backend Trigger for Invite Notifications: Implementation & Testing Plan

**Goal:** Implement a Firebase Cloud Function (using Firestore triggers) that automatically creates a user-facing notification document whenever a new invitation document is created in the `invites` collection with `status: 'pending'`. This allows the tenant's frontend to easily query and display relevant notifications.

**Assumptions:**

1.  A Firestore collection named `users` exists, where each document ID is the user's `uid` and contains at least an `email` field for lookup.
2.  A Firestore subcollection named `notifications` will be created under each user's document (`users/{userId}/notifications`) to store their specific notifications. (Alternatively, a root `notifications` collection with a `recipientUid` field could be used, but subcollections are often clearer for user-specific data).
3.  The Firebase Admin SDK is correctly initialized in the Cloud Functions environment (`functions/src/index.ts`).
4.  The Cloud Functions environment is set up for TypeScript development (`tsconfig.json`, `package.json` scripts).

## Data Models

**1. `invites` Collection Document (Input - Relevant Fields):**

```json
{
  "inviteId": "auto-generated-id",
  "tenantEmail": "tenant@example.com",
  "landlordId": "landlord_uid_123",
  "landlordName": "Landlord Name",
  "propertyId": "property_id_456",
  "propertyName": "Property Name",
  "status": "pending", // Trigger condition
  "createdAt": "Timestamp(...)",
  // ... other fields
}
```

**2. `users/{userId}/notifications` Document (Output):**

```json
{
  "notificationId": "auto-generated-id",
  "recipientUid": "tenant_uid_789", // The UID of the tenant receiving the notification
  "type": "property_invite", // Identifies the notification type
  "title": "Property Invitation",
  "message": "Landlord Name invited you to join Property Name.",
  "status": "unread", // e.g., 'unread', 'read'
  "createdAt": "Timestamp(...)", // Server timestamp
  "relatedData": { // Optional: Data to help frontend link/display details
    "inviteId": "auto-generated-id", // From the triggering invite doc
    "propertyId": "property_id_456",
    "propertyName": "Property Name",
    "landlordName": "Landlord Name"
  }
}
```

## Implementation Tasks

1.  **Create Trigger File:**
    *   Create a new file: `functions/src/inviteTriggers.ts`.
    *   Add necessary imports: `firebase-functions`, `firebase-admin`. Initialize `adminDb`.

2.  **Define the Trigger:**
    *   Use `functions.firestore.document('invites/{inviteId}')`.
    *   Use the `onCreate` trigger handler.
    *   ```typescript
        import * as functions from "firebase-functions";
        import * as admin from "firebase-admin";

        const adminDb = admin.firestore();

        export const createNotificationOnInvite = functions.firestore
          .document('invites/{inviteId}')
          .onCreate(async (snapshot, context) => {
            // Function logic goes here
          });
        ```

3.  **Extract Invite Data:**
    *   Get the data from the created invite document: `const inviteData = snapshot.data();`.
    *   Add checks to ensure `inviteData` exists and has the required fields (`tenantEmail`, `landlordId`, `propertyName`, `landlordName`). Log errors and exit if essential data is missing.
    *   Verify `inviteData.status` is 'pending' (though `onCreate` implies it's new, an explicit check is good practice).

4.  **Find Tenant User ID:**
    *   Query the `users` collection to find the user document where the `email` field matches `inviteData.tenantEmail`.
    *   ```typescript
        const tenantEmail = inviteData.tenantEmail;
        if (!tenantEmail) {
          console.error(`Invite ${context.params.inviteId} missing tenantEmail.`);
          return null; // Exit if no email
        }

        const usersRef = adminDb.collection('users');
        const userQuery = usersRef.where('email', '==', tenantEmail).limit(1);
        const userSnapshot = await userQuery.get();

        if (userSnapshot.empty) {
          console.warn(`No user found with email ${tenantEmail} for invite ${context.params.inviteId}. Notification not created.`);
          // Optional: Update invite status to 'user_not_found'?
          return null; // Exit function
        }

        const tenantUid = userSnapshot.docs[0].id;
        console.log(`Found user UID ${tenantUid} for email ${tenantEmail}`);
        ```

5.  **Construct Notification Payload:**
    *   Create the `notificationData` object based on the defined model, using data extracted from `inviteData`.
    *   ```typescript
        const notificationData = {
          recipientUid: tenantUid,
          type: "property_invite",
          title: "Property Invitation",
          message: `${inviteData.landlordName || 'Your Landlord'} invited you to join ${inviteData.propertyName || 'a property'}.`,
          status: "unread",
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          relatedData: {
            inviteId: context.params.inviteId, // Use the document ID from context
            propertyId: inviteData.propertyId || null,
            propertyName: inviteData.propertyName || null,
            landlordName: inviteData.landlordName || null,
          }
        };
        ```

6.  **Write Notification Document:**
    *   Define the path to the user's notification subcollection.
    *   Use `.add()` to create the new notification document.
    *   ```typescript
        const notificationRef = adminDb.collection('users').doc(tenantUid).collection('notifications');
        await notificationRef.add(notificationData);
        console.log(`Notification created for user ${tenantUid} regarding invite ${context.params.inviteId}`);
        ```

7.  **Export the Function:**
    *   Ensure the `createNotificationOnInvite` function is exported from `inviteTriggers.ts`.
    *   **Crucially:** Import and re-export this function from the main `functions/src/index.ts` file:
        ```typescript
        // In functions/src/index.ts
        // ... other imports ...
        import { createNotificationOnInvite } from './inviteTriggers'; // Adjust path if needed

        // ... other function exports ...
        export { createNotificationOnInvite }; // Add this line
        ```

8.  **Add Logging:** Include `console.log`, `console.warn`, `console.error` (or `functions.logger`) statements throughout the function for debugging in Cloud Logging and the emulator.

## Error Handling Considerations

*   **Missing Invite Data:** If `inviteData` or required fields like `tenantEmail` are missing, log an error and exit gracefully.
*   **User Not Found:** If no user matches the `tenantEmail`, log a warning and exit. Consider if the `invites` document should be updated with an error status.
*   **Firestore Write Failure:** Wrap the `notificationRef.add()` call in a try/catch block to handle potential Firestore errors during the write operation. Log the error.

## Security Considerations (Firestore Rules)

*   The trigger function itself runs with Admin privileges, bypassing Firestore rules for its *own* operations (like looking up users and writing notifications).
*   However, ensure your Firestore rules appropriately protect:
    *   The `users` collection (e.g., users can only read/write their own profile).
    *   The `users/{userId}/notifications` subcollection (e.g., only the `recipientUid` matching `{userId}` can read/update their notifications).
    *   The `invites` collection (e.g., perhaps only landlords can read invites they sent, and only invited tenants can read invites sent to them).

## Testing Plan

1.  **Unit Testing (Recommended):**
    *   Use `firebase-functions-test` library.
    *   Mock the Firestore `onCreate` event with sample `inviteData`.
    *   Stub the `adminDb.collection().where().get()` calls to simulate finding/not finding a user.
    *   Stub the `adminDb.collection().doc().collection().add()` call.
    *   Assert that the correct user lookup query is made.
    *   Assert that `add()` is called with the correctly structured notification data when a user is found.
    *   Assert that `add()` is *not* called if the user is not found or essential data is missing.

2.  **Emulator Testing (Essential):**
    *   Ensure `firebase.json` is configured to use the Firestore and Functions emulators.
    *   Run `cd functions && npm run build`.
    *   Run `firebase emulators:start --only functions,firestore`.
    *   **Scenario 1 (Happy Path):**
        *   Using the Emulator UI (Firestore tab), manually add a user document to the `users` collection with a specific email (e.g., `test-tenant@example.com`). Note the UID.
        *   Manually add a new document to the `invites` collection with `status: 'pending'` and `tenantEmail: 'test-tenant@example.com'`, including `landlordName` and `propertyName`.
        *   Check the Functions emulator logs: Verify `createNotificationOnInvite` executes, logs finding the user, logs creating the notification, and completes without errors.
        *   Check the Firestore emulator UI: Verify a new document was created under `users/{tenantUid}/notifications` with the correct data and `status: 'unread'`.
    *   **Scenario 2 (User Not Found):**
        *   Manually add a new document to `invites` with `status: 'pending'` but an email that does *not* exist in the `users` collection.
        *   Check Functions logs: Verify the function executes, logs the "User not found" warning, and exits gracefully without erroring out.
        *   Check Firestore: Verify *no* notification document was created.
    *   **Scenario 3 (Missing Data):**
        *   Manually add a document to `invites` *without* a `tenantEmail`.
        *   Check Functions logs: Verify the function executes, logs the missing data error, and exits gracefully.

## Deployment

1.  Run `cd functions && npm run build`.
2.  Run `firebase deploy --only functions`.
3.  Monitor deployment progress in the terminal.
4.  After deployment, check Google Cloud Console -> Cloud Functions list to ensure the function deployed successfully.
5.  Check Cloud Logging for any errors during initialization or initial executions.
6.  Perform live testing by triggering an invite from the frontend and verifying the notification appears for the tenant (after implementing the frontend notification fetching logic).

## Future Enhancements (Optional)

*   **Push Notifications:** Integrate Firebase Cloud Messaging (FCM) to send a push notification to the tenant's device in addition to creating the Firestore notification document.
*   **Invite Expiry:** Add logic (potentially another scheduled function) to handle expired invites.
*   **Error Status:** Update the `invites` document status (e.g., to `'error_user_not_found'`) if the notification cannot be created. 