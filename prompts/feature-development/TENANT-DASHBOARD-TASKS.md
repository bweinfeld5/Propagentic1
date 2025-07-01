# Tenant Dashboard Implementation - Task List

**Goal:** Create a functional dashboard for tenants allowing them to accept property invitations and submit/view maintenance requests.

**Current Status:**
*   Tenant authentication and basic profile exist.
*   Route `/tenant/dashboard` exists but points to a placeholder.
*   `invites` collection exists for tracking invitations.
*   `tickets` collection exists for maintenance requests.
*   `dataService` has methods for creating tickets and potentially fetching properties/users.

**MVP Feature List:**

1.  Display pending property invitations.
2.  Allow tenants to Accept/Reject invitations (requires backend function).
3.  Display basic info about the associated property once accepted.
4.  Provide a way to submit new maintenance requests for the associated property.
5.  Display a list of previously submitted maintenance requests.

---

## Task Breakdown

**Phase 1: Dashboard Setup & Invitation Handling**

*   `[ ]` **1.1: Create `TenantDashboard.jsx` Component:**
    *   **File(s):** Create `src/pages/tenant/TenantDashboard.jsx` (or replace placeholder).
    *   Set up basic structure, import `useAuth`.
*   `[ ]` **1.2: Fetch Initial Data:**
    *   **File(s):** `src/pages/tenant/TenantDashboard.jsx`
    *   Use `useEffect` and `currentUser` from `useAuth`.
    *   If `userProfile.propertyId` is NOT set:
        *   Query `invites` collection: `where('tenantEmail', '==', currentUser.email), where('status', '==', 'pending')`.
        *   Store results in `pendingInvites` state.
    *   If `userProfile.propertyId` IS set:
        *   Fetch property details using `dataService.getPropertyById(userProfile.propertyId)`.
        *   Store result in `propertyDetails` state.
    *   Implement loading and error states.
*   `[ ]` **1.3: Display Pending Invitations:**
    *   **File(s):** `src/pages/tenant/TenantDashboard.jsx`, Create `src/components/tenant/InviteCard.jsx` (optional).
    *   Conditionally render the list of `pendingInvites` if `!userProfile.propertyId`.
    *   Display Property Name, Landlord Name.
    *   Add "Accept" and "Reject" buttons to each invite card.
*   `[ ]` **1.4: Implement Backend Invitation Logic (Firebase Function):**
    *   **File(s):** `functions/index.js` (or separate function file).
    *   Create callable function `acceptPropertyInvite`:
        *   Takes `inviteId` as input.
        *   Performs validation (user is correct tenant, invite is pending).
        *   Atomically updates: `users/{tenantId}`, `properties/{propertyId}`, `invites/{inviteId}`.
    *   Create callable function `rejectPropertyInvite`:
        *   Takes `inviteId` as input.
        *   Updates `invites/{inviteId}` status to `rejected`.
*   `[ ]` **1.5: Connect Frontend Invite Actions:**
    *   **File(s):** `src/pages/tenant/TenantDashboard.jsx`
    *   Implement `handleAcceptInvite(inviteId)`: Calls the `acceptPropertyInvite` Firebase Function. On success, refetches `userProfile`.
    *   Implement `handleRejectInvite(inviteId)`: Calls the `rejectPropertyInvite` Firebase Function. On success, removes the invite from the local `pendingInvites` state.
*   `[ ]` **1.6: Display Associated Property Info:**
    *   **File(s):** `src/pages/tenant/TenantDashboard.jsx`
    *   Conditionally render `propertyDetails` if `userProfile.propertyId` exists.
    *   Show Property Address, Landlord Name/Contact (if available in property data).

**Phase 2: Maintenance Request Functionality**

*   `[ ]` **2.1: Create `MaintenanceRequestModal.jsx`:**
    *   **File(s):** Create `src/components/tenant/MaintenanceRequestModal.jsx`.
    *   Build a modal form using Headless UI or similar.
    *   Include fields: Issue Type (Dropdown: Plumbing, Electrical, HVAC, Appliance, Other), Description (Textarea), Urgency (Optional Dropdown: Low, Medium, High), Photo Upload (Optional).
    *   Handle form state and validation.
*   `[ ]` **2.2: Add "Submit Request" UI:**
    *   **File(s):** `src/pages/tenant/TenantDashboard.jsx`
    *   Add a prominent "Submit Maintenance Request" button (only visible if associated with a property).
    *   Add state to control the `MaintenanceRequestModal` visibility.
*   `[ ]` **2.3: Implement Submit Logic:**
    *   **File(s):** `src/components/tenant/MaintenanceRequestModal.jsx`, `src/pages/tenant/TenantDashboard.jsx`
    *   Pass an `onSubmit` handler from the dashboard to the modal.
    *   The handler calls `dataService.createMaintenanceTicket` with form data, `tenantId: currentUser.uid`, and `propertyId: userProfile.propertyId`.
    *   Handle loading/error states during submission. Close modal on success.
*   `[ ]` **2.4: Fetch Past Requests:**
    *   **File(s):** `src/pages/tenant/TenantDashboard.jsx`
    *   Add `useEffect` to fetch tickets: `where('tenantId', '==', currentUser.uid), orderBy('createdAt', 'desc')`.
    *   Store results in `maintenanceRequests` state.
*   `[ ]` **2.5: Display Past Requests:**
    *   **File(s):** `src/pages/tenant/TenantDashboard.jsx`, Create `src/components/tenant/TenantTicketList.jsx` (optional).
    *   Render the `maintenanceRequests` state in a table or list.
    *   Include columns/fields: Description, Status, Date Submitted.

**Phase 3: Refinement & Testing**

*   `[ ]` **3.1: Implement Loading & Error States:** Ensure all data fetching and actions have clear loading indicators and user-friendly error messages.
*   `[ ]` **3.2: UI Styling:** Apply consistent Tailwind styling, reuse existing components (`Button`, `StatusPill`, etc.).
*   `[ ]` **3.3: End-to-End Testing:**
    *   Landlord invites Tenant.
    *   Tenant logs in, sees invite.
    *   Tenant rejects invite -> Invite disappears.
    *   Tenant accepts invite -> Invite disappears, property info appears.
    *   Tenant submits maintenance request -> Request appears in list.
    *   Verify request appears in Landlord's view.

---

**Notes:**
- Mock data is sufficient for now. Integration with backend data comes later.
- Focus on structure, basic functionality, and applying the new theme. 