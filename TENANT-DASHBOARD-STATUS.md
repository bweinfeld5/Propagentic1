# Tenant Dashboard Task Status

`TENANT-DASHBOARD-TASKS.md` lists all items as incomplete, but the codebase implements many of the phase 1 features.

## Completed
- `TenantDashboard.tsx` exists and fetches pending invitations and property details using `useAuth` and `inviteService`.
- Invitations are displayed using `InvitationBanner` with accept/decline handlers.
- Backend functions `acceptPropertyInvite` and `rejectPropertyInvite` are implemented in `functions/src/userRelationships.ts`.
- Property information is shown via `PropertyList` and tenants can navigate to the maintenance request form.
- `MaintenanceRequestModal.jsx` component is present and a survey form at `/maintenance/new` creates tickets via `dataService`.

## Missing or Partial
- The dashboard does not show past maintenance requests and does not use `MaintenanceRequestModal` directly.
- Fetching of existing tickets and display of a request list is not implemented.
- Phase 3 refinement/testing tasks remain open.
