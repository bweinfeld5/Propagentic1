# Landlord Dashboard MVP - Task List

**Goal:** Achieve a Minimum Viable Product (MVP) for the Landlord Dashboard where landlords can log in, view their properties, add new properties, and invite tenants. Data should be fetched from and saved to Firestore.

**Current Status:**
*   Authentication and onboarding flow exist.
*   Landlord login leads to a dashboard view.
*   Core data services (`dataService.js`, `propertyService.ts`) and Firestore rules are defined.
*   Property loading issue is resolved.
*   Empty state UI is implemented.

**MVP Feature List:**
1.  Landlord Login & Dashboard Access.
2.  Display list of landlord's properties fetched from Firestore.
3.  Display an "empty state" with an "Add Property" prompt if no properties exist.
4.  Ability to add a new property (basic info: name, address) via a modal/form, saving to Firestore.
5.  Ability to invite a tenant to a specific property via email (basic Firestore record creation).

---

## Task Breakdown to MVP

**Phase 1: Core Dashboard & Property Loading (Fix Blocking Issues)**

*   `[X]` **1.1: Verify Dashboard Routing:**
    *   Confirmed route `/landlord/dashboard` points to `LandlordTicketDashboard.jsx`.
    *   Decision: Adapt this component instead of creating a new one for MVP.
*   `[X]` **1.2: Debug "Failed to load properties" Error:**
    *   Implemented multi-field queries, localStorage caching, improved error handling.
*   `[X]` **1.3: Implement Empty State UI:**
    *   Added empty state UI with "Add Property" button to `LandlordTicketDashboard.jsx`.

**Phase 2: Property Management (Add & View)**

*   `[X]` **2.1: Implement "Add Property" Modal & Logic:**
    *   Created `AddPropertyModal.jsx`.
    *   Integrated modal trigger and save logic into `LandlordTicketDashboard.jsx` (now moved to `PropertiesPage.jsx`).
*   `[X]` **2.2: Display Property List:**
    *   Created `PropertyCard.jsx`.
    *   Integrated property list display into `LandlordTicketDashboard.jsx` (now moved to `PropertiesPage.jsx`).

**Phase 3: Basic Tenant Invitation**

*   `[X]` **3.1: Implement "Invite Tenant" UI:**
    *   Created `InviteTenantModal.jsx`.
    *   Added "Invite Tenant" button to `PropertyCard.jsx`.
    *   Integrated modal trigger into `LandlordTicketDashboard.jsx` (now moved to `PropertiesPage.jsx` / `TenantsPage.jsx`).
*   `[X]` **3.2: Implement Invite Logic (Firestore Record):**
    *   Added `createTenantInvite` function to create record in `invites` collection in `LandlordTicketDashboard.jsx` (now moved to `PropertiesPage.jsx` / `TenantsPage.jsx`).

**Phase 4: Refinement & Cleanup**

*   `[X]` **4.1: Refactor/Remove Mock Data:**
    *   Removed mock data and handlers from `src/pages/landlord/LandlordDashboard.jsx`.
*   `[ ]` **4.2: Code Review & Testing:**
    *   Review implementations for clarity, efficiency, and error handling.
    *   Perform end-to-end testing:
        *   Register/Login as Landlord.
        *   Verify empty state is shown.
        *   Add a property -> Verify it appears.
        *   Invite a tenant -> Verify invite record is created in Firestore.
        *   Log out/in -> Verify property persists.
    *   Fix any identified bugs.

--- 