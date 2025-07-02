# Codebase Redundancy Analysis (Propagentic)

This document outlines identified duplicate or redundant files, components, and logic within the `src` directory, along with recommendations for optimization.

## 1. Firebase Configuration

*   **Files:**
    *   `src/firebase/config.js`
    *   `src/firebase/firebaseConfig.js`
*   **Description:** `firebaseConfig.js` holds the config object, while `config.js` initializes services using it.
*   **Type:** Near-duplicate / Opportunity for consolidation.
*   **Recommendation:** Merge the config object from `firebaseConfig.js` directly into `config.js`. **Delete** `src/firebase/firebaseConfig.js`. Update the import within `config.js`.

## 2. Layout Components (Header)

*   **Files:**
    *   `src/components/layout/HeaderNav.jsx` (In use)
    *   `src/components/layout/HeaderBar.jsx` (Likely unused)
*   **Description:** Two header components exist. `HeaderNav.jsx` is the currently used, more feature-rich version.
*   **Type:** Redundant Component / Potential Duplicate.
*   **Recommendation:** Verify `HeaderBar.jsx` is unused. If confirmed, **delete** `src/components/layout/HeaderBar.jsx`. Keep `src/components/layout/HeaderNav.jsx`.

## 3. Layout Components (Dashboard)

*   **Files:**
    *   `src/components/layout/DashboardLayout.jsx` (In use by `App.js`)
    *   `src/components/layout/DashboardLayout.js` (Appears redundant/older)
*   **Description:** A duplicate `.js` version of the dashboard layout exists alongside the `.jsx` version used by the application.
*   **Type:** Duplicate / Redundant Component.
*   **Recommendation:** **Delete** the unused `src/components/layout/DashboardLayout.js`. Keep `src/components/layout/DashboardLayout.jsx`.

## 4. Notification Providers

*   **Files:**
    *   `src/components/shared/NotificationProvider.js` (Used in `App.js`)
    *   `src/context/NotificationContext.tsx`
*   **Description:** Two distinct systems for handling notifications seem to exist.
*   **Type:** Potential Redundancy / Opportunity for Consolidation.
*   **Recommendation:** Analyze both implementations. Choose one (likely `src/context/NotificationContext.tsx`). Refactor the application to use only the chosen system. **Delete** the unused provider file. Requires careful usage analysis.

## 5. Error Handling Utilities

*   **Files:**
    *   `src/utils/errorTracker.js` (More comprehensive)
    *   `src/utils/ErrorHandling.ts` (Simpler, typed)
*   **Description:** Two utilities for error handling with potentially overlapping scope.
*   **Type:** Potential Redundancy / Opportunity for Consolidation.
*   **Recommendation:** Examine usage. If `ErrorHandling.ts` is unused or its functionality is covered by `errorTracker.js`, **merge** useful parts (like types) into `errorTracker.js` and **delete** `src/utils/ErrorHandling.ts`. Otherwise, keep both if they serve distinct, necessary purposes.

## 6. Dashboard Logic Abstraction

*   **Files:**
    *   `src/pages/tenant/TenantDashboard.js`
    *   `src/components/landlord/LandlordTicketDashboard.js`
    *   `src/components/contractor/ContractorDashboard.js`
*   **Description:** These role-specific dashboards likely contain repeated logic for fetching and displaying common data types (e.g., tickets).
*   **Type:** Opportunity for Abstraction.
*   **Recommendation:** **Abstract** common data fetching (e.g., `useTickets`) and UI rendering (e.g., `<TicketList>`) into shared hooks and components to reduce code duplication within these files. 