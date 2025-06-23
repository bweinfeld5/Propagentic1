# Notification Trigger Function Fix: Implementation Plan

**Goal:** Resolve the TypeScript build errors in `functions/src/inviteTriggers.ts` to allow the `createNotificationOnInvite` function to build and deploy successfully, enabling the automatic creation of tenant notifications when invites are generated.

**Problem:** The `npm run build` command fails with TypeScript errors, primarily:

1.  `TS2339: Property 'document' does not exist on type 'typeof import(".../v2/providers/firestore")'.` (in `inviteTriggers.ts`)
2.  `TS7006: Parameter 'snapshot' implicitly has an 'any' type.` (in `inviteTriggers.ts`)
3.  `TS7006: Parameter 'context' implicitly has an 'any' type.` (in `inviteTriggers.ts`)
4.  `TS6133: '...' is declared but its value is never read.` (in `index.ts` - less critical but should be cleaned up)

This prevents the function from being deployed and therefore stops the notification logic from working.

## Cause Analysis

*   **Error 1 (TS2339):** The syntax `functions.firestore.document(...).onCreate(...)` is for Firebase Cloud Functions **v1**. The project dependencies (`firebase-functions` v6+) and error message context suggest **v2** functions are expected. V2 requires importing specific trigger functions like `onDocumentCreated` from `firebase-functions/v2/firestore`.
*   **Errors 2 & 3 (TS7006):** These occur because the function parameters (`snapshot`, `context`) lack explicit type definitions, and TypeScript's strict mode requires them. For v2 `onDocumentCreated`, the parameter is a single `event` object with a specific type.
*   **Error 4 (TS6133):** These are happening because the main function in `index.ts` was commented out during previous debugging steps. Now that `createNotificationOnInvite` is being imported and exported, these might resolve naturally or require minor cleanup.

## Implementation Tasks

1.  **Update `inviteTriggers.ts` to v2 Syntax:**
    *   **Action:** Modify `functions/src/inviteTriggers.ts`.
    *   Change the import from `firebase-functions` to include `onDocumentCreated` from `firebase-functions/v2/firestore`.
    *   Update the function definition to use `onDocumentCreated('invites/{inviteId}', async (event) => { ... });`.
    *   Add the correct type annotation for the `event` parameter (e.g., `FirestoreEvent<QueryDocumentSnapshot | undefined, { inviteId: string }>`).
    *   Update logic to access parameters via `event.params.inviteId` instead of `context.params.inviteId`.
    *   Update logic to access the snapshot data via `event.data` instead of `snapshot`, adding necessary checks (e.g., `if (!event.data) return;`).

2.  **Clean Up `index.ts` (Optional but Recommended):**
    *   **Action:** Modify `functions/src/index.ts`.
    *   Ensure all imported modules (`functions`, `admin`, `FieldValue`) are actually used now that `createNotificationOnInvite` is exported. Remove unused imports if any remain.
    *   Verify the `adminDb` constant is used (it likely is by `sendPropertyInvite`).

3.  **Build Verification:**
    *   **Action:** Run `cd functions && npm run build`.
    *   **Goal:** Confirm that the build completes *without* any TypeScript errors.

4.  **Emulator Test:**
    *   **Action:** Run `cd functions && firebase emulators:start --only functions,firestore` (killing ports if needed).
    *   **Goal:** Verify both `sendPropertyInvite` and `createNotificationOnInvite` load successfully without the "User code failed to load" error.
    *   Perform the emulator testing scenarios outlined in `BACKEND-TRIGGER-TASK.md` to ensure the trigger logic works correctly.

5.  **Deployment:**
    *   **Action:** Run `firebase deploy --only functions`.
    *   **Goal:** Successfully deploy both functions to the live environment.

## Testing

*   Refer to the detailed Emulator Testing plan in `BACKEND-TRIGGER-TASK.md`.
*   Perform end-to-end testing via the frontend after successful deployment. 