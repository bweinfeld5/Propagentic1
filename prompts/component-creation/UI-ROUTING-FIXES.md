# Propagentic UI & Routing Fixes Workflow

This document outlines the steps to address the UI inconsistencies and routing issues identified.

## Task List

1.  **Fix Back Button Routing (`/` vs `/propagentic/new`)**
    *   **Goal:** Ensure navigating back from auth pages leads to `/propagentic/new`, not the old `/`.
    *   **Location:** `src/App.js`, Potentially auth components (`src/pages/AuthPage.jsx`, `src/pages/LoginPage.js`, `src/pages/RegisterPage.js`)
    *   **Action:**
        *   Verify `<Route path="/" element={<Navigate to="/propagentic/new" replace />} />` exists and is correctly placed *before* any other `/` route in `src/App.js`.
        *   Investigate navigation logic after successful login/signup. Ensure `navigate('...', { replace: true })` is used when redirecting to dashboard/profile pages to remove the auth page from history.
        *   Consider removing the old `<Route path="/old-landing" element={<LandingPage />} />` entirely if it's fully deprecated.
    *   **Status:** `done`

2.  **Fix Pricing Page Link in Header**
    *   **Goal:** Ensure the 'Pricing' link in the main navigation header on `/propagentic/new` works.
    *   **Location:** `src/components/landing/newComponents/HeaderTabs.jsx` (or relevant header component).
    *   **Action:** Locate the navigation link for 'Pricing' and confirm its `to` prop is set to `/pricing`.
    *   **Status:** `done`

3.  **Reposition Dashboard Preview Section**
    *   **Goal:** Move the 'Powerful Dashboard Management' section (`DashboardPreview`) to appear directly below the role selection/hero section.
    *   **Location:** `src/components/landing/EnhancedLandingPage.jsx`
    *   **Action:** Cut the `<section>` containing `<DashboardPreview />` and paste it immediately after the `<EnhancedHeroSection />` component. Adjust surrounding styling if necessary.
    *   **Status:** `done`

4.  **Update `EnhancedInteractiveDemo` Styling (Maintenance Workflow)**
    *   **Goal:** Restyle the 'Propagentic Maintenance Workflow' component to match the new theme.
    *   **Location:** `src/components/landing/newComponents/EnhancedInteractiveDemo.jsx`
    *   **Action:** Applied theme styling to container, header, steps, and main content area. Further detailed styling of step content might be needed manually.
    *   **Status:** `done`

5.  **Update `DashboardPreview` Styling**
    *   **Goal:** Restyle the 'Powerful Dashboard Management' preview for both Landlord and Tenant views.
    *   **Location:** `src/components/landing/newComponents/DashboardPreview.jsx`
    *   **Action:** Apply theme tokens and consistent styling (`rounded-xl`, `shadow-lg`, borders, spacing) to the container, header, sidebar, stat cards, and request list items. Utilize the `StatusPill` component. Add theme colors where appropriate to enhance visual appeal.
    *   **Status:** `done`

6.  **Fix Disappearing Icons in `EnhancedAIExplainer`**
    *   **Goal:** Prevent icons from disappearing on hover within the 'How AI Powers Our Platform' section.
    *   **Location:** `src/components/landing/newComponents/EnhancedAIExplainer.jsx`
    *   **Action:** Adjusted z-index and hover states to ensure icon visibility. Cloned icon element to control styling dynamically.
    *   **Status:** `done`

7.  **Final Testing**
    *   **Goal:** Verify all fixes and ensure no regressions were introduced.
    *   **Action:**
        *   Test the back button behavior after login/signup.
        *   Click the 'Pricing' link from the new landing page header.
        *   Confirm the Dashboard Preview is correctly positioned.
        *   Review the styling of the Maintenance Workflow and Dashboard Preview components.
        *   Check the hover effect in the AI Explainer section.
        *   Perform general navigation tests.
    *   **Status:** `todo` 