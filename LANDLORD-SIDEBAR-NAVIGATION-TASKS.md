# Landlord Sidebar Navigation - Task List

**Goal:** Implement functional pages or sections corresponding to each item in the Landlord Dashboard sidebar navigation (Dashboard, Properties, Tenants, Maintenance, Profile, Support, Settings).

**Current Status:**
*   Sidebar UI exists (`src/components/layout/SidebarNav.jsx`).
*   `Dashboard` likely points to `LandlordTicketDashboard.jsx`.
*   `Maintenance` might also point to the ticket section within `LandlordTicketDashboard.jsx`.
*   `Profile` might point to a generic `ProfilePage.js`.
*   `Properties`, `Tenants`, `Support`, `Settings` likely lack dedicated pages/routes or point to non-existent ones.

**MVP Feature List per Section:**

1.  **Dashboard:** Verify it links correctly and displays the intended overview (property list + ticket summary).
2.  **Properties:** Display a list/table of properties, allow adding new properties, link to view/edit details.
3.  **Tenants:** Display a list/table of tenants associated with the landlord's properties, allow inviting new tenants.
4.  **Maintenance:** Display a comprehensive list/table of maintenance tickets related to the landlord's properties, allow viewing details and potentially assigning contractors.
5.  **Profile:** Allow viewing and editing landlord-specific profile information.
6.  **Support:** Basic page with contact information or FAQ link.
7.  **Settings:** Basic page for account settings (e.g., notification preferences).

---

## Task Breakdown

**Phase 1: Routing & Page Creation**

*   `[ ]` **1.1: Define Routes:**
    *   **File(s):** `src/App.js`
    *   Ensure distinct routes exist within the `DashboardLayout` for each sidebar item:
        *   `/landlord/dashboard` (Existing - Verify target component)
        *   `/landlord/properties` (New)
        *   `/landlord/tenants` (New)
        *   `/landlord/maintenance` (New or confirm existing route)
        *   `/profile` (Existing - Verify target component)
        *   `/support` (New)
        *   `/settings` (New)
*   `[ ]` **1.2: Create Placeholder Page Components:**
    *   **File(s):** Create `src/pages/landlord/PropertiesPage.jsx`, `src/pages/landlord/TenantsPage.jsx`, `src/pages/landlord/MaintenancePage.jsx` (if needed), `src/pages/SupportPage.jsx`, `src/pages/SettingsPage.jsx`.
    *   Create basic functional components for each new page, wrapping them in `DashboardLayout` and including a simple heading (e.g., `<h1>Properties</h1>`).
    *   Map these new components to the routes defined in `App.js`.

**Phase 2: Sidebar Integration & Navigation**

*   `[ ]` **2.1: Update Sidebar Links:**
    *   **File(s):** `src/components/layout/SidebarNav.jsx`
    *   Modify the `navigation` array or link elements within the sidebar component.
    *   Ensure each item (`Dashboard`, `Properties`, `Tenants`, etc.) links to the correct path defined in Task 1.1.
*   `[ ]` **2.2: Implement Active State Highlighting:**
    *   **File(s):** `src/components/layout/SidebarNav.jsx`
    *   Use `useLocation` hook from `react-router-dom`.
    *   Conditionally apply active styling (e.g., different background color, text color, border) to the sidebar link that matches the current `location.pathname`.

**Phase 3: Page Implementation (MVP Functionality)**

*   `[ ]` **3.1: Properties Page (`PropertiesPage.jsx`):**
    *   Fetch properties using `dataService.subscribeToProperties`.
    *   Display properties using `PropertyCard` or a new `PropertyTable` component.
    *   Integrate the `AddPropertyModal` and `handleAddProperty` logic (move/reuse from `LandlordTicketDashboard`).
    *   Include loading, error, and empty states.
    *   *(MVP+):* Link each property to a details view/modal.
*   `[ ]` **3.2: Tenants Page (`TenantsPage.jsx`):**
    *   Fetch tenants associated with the landlord's properties. This might require a new `dataService` method (`getTenantsForLandlord` or similar) that aggregates tenants from all properties.
    *   Display tenants using `TenantTable` or a new `TenantCard` component.
    *   Integrate the `InviteTenantModal` and `createTenantInvite` logic (move/reuse). Add a primary "Invite Tenant" button.
    *   Include loading, error, and empty states.
*   `[ ]` **3.3: Maintenance Page (`MaintenancePage.jsx` or adapt `LandlordTicketDashboard.jsx`):**
    *   If creating a new page, replicate the ticket fetching and display logic from `LandlordTicketDashboard.jsx`.
    *   Ensure comprehensive display of tickets (perhaps with filtering/sorting options).
    *   Ensure ticket detail viewing and assignment logic is present.
    *   If adapting `LandlordTicketDashboard`, ensure it focuses solely on tickets and the property list is moved to `PropertiesPage`.
*   `[ ]` **3.4: Profile Page (`ProfilePage.js`):**
    *   Fetch landlord-specific data from `users` and `landlordProfiles` collections using `currentUser.uid`.
    *   Display relevant profile information (Name, Email, Business Name, etc.).
    *   Implement an edit mode/form to allow updating profile fields.
    *   Connect form submission to `dataService.updateUserProfile` or a specific `updateLandlordProfile` method.
*   `[ ]` **3.5: Support Page (`SupportPage.jsx`):**
    *   Add basic content: Contact email, link to documentation (if any), simple FAQ section.
    *   *(MVP+):* Implement a contact form.
*   `[ ]` **3.6: Settings Page (`SettingsPage.jsx`):**
    *   Integrate `NotificationPreferences` component.
    *   Add placeholders for other potential settings (e.g., password change, billing - if applicable).

**Phase 4: Refinement & Testing**

*   `[ ]` **4.1: Consolidate Data Fetching:** Review data fetching across new pages to avoid redundant calls. Ensure `dataService` methods are efficient.
*   `[ ]` **4.2: Component Reuse:** Ensure components like Modals, Cards, Tables are reused effectively.
*   `[ ]` **4.3: End-to-End Testing:**
    *   Click every sidebar link and verify the correct page loads.
    *   Test the core functionality of each page (viewing data, adding properties, inviting tenants, editing profile).
    *   Verify active state highlighting works correctly on the sidebar.
    *   Check responsive design for all new pages.

--- 