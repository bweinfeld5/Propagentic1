# Tenant Invitation Flow Tasks

This file tracks the tasks needed to complete and verify the tenant email invitation feature.

- [ ] **Task 1: Fix Invite Creation (`TenantsPage.jsx`)**
    - [ ] Add Firestore imports (`db`, `collection`, `addDoc`, `serverTimestamp`) to `createTenantInvite`.
    - [ ] (Optional) Enhance error handling/feedback in `createTenantInvite` to be less generic.

- [ ] **Task 2: Enhance Invite Modal (`InviteTenantModal.jsx` & `TenantsPage.jsx`)**
    - [ ] Pass the `properties` list from `TenantsPage.jsx` to `InviteTenantModal.jsx`.
    - [ ] Modify `InviteTenantModal.jsx` to include a `<select>` dropdown for property selection if `propertyId` prop is initially null or undefined.
    - [ ] Ensure the selected property ID is used when calling `onInvite`.
    - [ ] Update the modal title to be generic if no initial property name is provided.

- [ ] **Task 3: Implement Tenant Acceptance/Decline Frontend Logic**
    - [ ] Create/Identify the tenant-side component/page (e.g., `Dashboard.jsx`, `Notifications.jsx`) where pending invitations are displayed using `InvitationCard.jsx`.
    - [ ] Fetch notifications/invites for the logged-in tenant.
    - [ ] Implement `handleAcceptInvite(inviteId)` function in the tenant component.
    - [ ] Implement `handleDeclineInvite(inviteId)` function in the tenant component.
    - [ ] Pass these functions as `onAccept` and `onDecline` props to `InvitationCard.jsx`.
    - [ ] Add state management for loading/processing states (`isProcessing` prop for `InvitationCard`).

- [ ] **Task 4: Create Backend Cloud Functions for Acceptance/Decline**
    - [ ] Create an HTTPS Callable Cloud Function `acceptInvite(data: { inviteId: string }, context)` in `functions/src/index.ts` (or new file like `inviteActions.ts`).
        - [ ] Validate `inviteId` and authenticated user (`context.auth.uid`).
        - [ ] Verify the invite exists, belongs to the user, and is 'pending'.
        - [ ] Update invite status to 'accepted'.
        - [ ] Add tenant UID to `properties/{propertyId}.tenants` array.
        - [ ] Add property ID to `users/{tenantUid}.properties` (or `tenantProfiles`) array.
        - [ ] Add landlord ID to `users/{tenantUid}.landlords` (or `tenantProfiles`) array.
        - [ ] Return success/error.
    - [ ] Create an HTTPS Callable Cloud Function `declineInvite(data: { inviteId: string }, context)` in `functions/src/index.ts` (or `inviteActions.ts`).
        - [ ] Validate `inviteId` and authenticated user (`context.auth.uid`).
        - [ ] Verify the invite exists, belongs to the user, and is 'pending'.
        - [ ] Update invite status to 'declined'.
        - [ ] Return success/error.
    - [ ] Ensure new functions are exported from `functions/src/index.ts` and deployed.

- [ ] **Task 5: Review Notification Trigger (`inviteTriggers.ts`)**
    - [ ] Verify the `relatedData` in the notification payload includes all necessary info for `InvitationCard.jsx` and the accept/decline actions (e.g., `inviteId`, `propertyId`, `propertyName`, `landlordName`).
    - [ ] (Optional) Add logic to update the invite status to 'error_notification_failed' if writing the notification fails.

- [ ] **Task 6: Testing**
    - [ ] Test the full end-to-end flow: Invite -> Receive Notification -> Accept -> Verify property/tenant links.
    - [ ] Test the decline flow.
    - [ ] Test inviting a non-existent user email.
    - [ ] Test inviting a tenant to a property they are already on (should be handled by accept logic ideally).
