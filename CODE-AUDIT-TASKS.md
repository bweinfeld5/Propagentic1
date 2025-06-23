# Code Audit & Refactoring Tasks (Post-Theme Implementation)

**Goal:** Address issues identified during the codebase audit after the initial light/dark theme implementation, ensuring consistency, fixing errors, and improving navigation.

---

## High Priority Tasks

1.  **Fix Invalid Theme Class Usage:** Replace remaining instances of old `propagentic-` prefixes and hardcoded colors with the new semantic theme colors from `tailwind.config.js`.
    *   **Status:** `todo`
    *   **Files:**
        *   `src/App.js` (Line 145: `border-propagentic-teal`) -> Suggestion: Use `border-primary`. Priority: High.
        *   `src/pages/AIExamples.jsx` (Line 9: `text-propagentic-teal`) -> Suggestion: Use `text-primary`. Priority: High.
        *   `src/pages/AITutorial.jsx` (Line 52, 91) -> Suggestion: Use `text-primary`, `bg-primary`. Priority: High.
        *   `src/pages/AboutPage.jsx` (Multiple lines) -> Suggestion: Replace `propagentic-slate-dark`, `propagentic-teal`, etc., with `bg-background dark:bg-background-dark`, `text-content`, `bg-primary`, etc. Priority: High.
        *   `src/pages/DashboardPage.js` (Line 7: `text-propagentic-slate-dark`) -> Suggestion: Use `text-content dark:text-content-dark`. Priority: High.
        *   `src/pages/PricingPage.js` (Multiple lines) -> Suggestion: Replace `propagentic-slate-dark`, `propagentic-teal`, `focus:ring-propagentic-teal`, etc., with theme colors (`bg-background`, `text-content`, `focus:ring-primary`, etc.). Priority: High.
        *   `src/components/ui/AppTourGuide.jsx` (Line 125) -> Suggestion: Replace classes with `<Button variant="primary">` styling. Priority: High.
        *   `src/components/dashboard/DashboardDemo.jsx` (Line 199) -> Suggestion: Replace classes with `<Button variant="ghost">` styling using `primary` text color. Priority: High.
        *   `src/components/dashboard/Dashboard.js` (Multiple lines) -> Suggestion: Review component, likely deprecated? If used, replace hardcoded colors (`bg-indigo-600`, etc.) with theme colors or Button component. Priority: Medium.
        *   `src/components/landing/ContractorDashboardDemo.js` (Multiple lines) -> Suggestion: Replace `propagentic-teal` classes with theme colors or Button component. Priority: High.
        *   `src/components/landlord/PropertyTable.jsx` (Lines 158, 172) -> Suggestion: Replace classes with theme colors or Button component (`ghost` or `outline`). Priority: High.
        *   `src/components/landlord/TenantTable.jsx` (Lines 124, 139) -> Suggestion: Replace classes with theme colors or Button component (`ghost` or `outline`). Priority: High.
        *   `src/components/landlord/RequestFeed.jsx` (Lines 99, 154) -> Suggestion: Replace classes with theme colors or Button component (`outline`, `ghost`). Priority: High.
        *   `src/components/landing/TenantDashboardDemo.js` (Lines 200, 346) -> Suggestion: Replace classes with theme colors (`text-primary`, etc.). Priority: High.
        *   `src/components/landing/LandlordDashboardDemo.js` (Multiple lines) -> Suggestion: Replace classes with theme colors or Button component. Priority: High.
        *   `src/components/contractor/ContractorDashboard.jsx` -> Task: Complete refactoring of Ticket Detail Panel and Progress Form (started previously). Priority: High.

2.  **Fix Missing `onClick` Handlers on Buttons:** Add placeholder handlers or implement intended functionality for buttons missing `onClick`.
    *   **Status:** `todo`
    *   **Files:**
        *   `src/pages/LandlordDashboard.js` (Lines 514, 522, 531) -> Suggestion: Add `onClick={() => alert('Action Needed')}` or implement function. Priority: Medium (verify if file is used).
        *   `src/pages/DemoPage.jsx` (Multiple lines) -> Suggestion: Add handlers or confirm if buttons are decorative. Priority: Medium.
        *   `src/components/dashboard/Dashboard.js` (Lines 64, 80, 139, 154) -> Suggestion: Add handlers or remove if unused. Priority: Medium.
        *   `src/components/auth/SignupForm.jsx` (Social Login Buttons) -> Suggestion: Implement social login `onClick` handlers. Priority: High.
        *   `src/components/landing/ContractorDashboardDemo.js` (Lines 196, 205, 253) -> Suggestion: Add handlers or confirm decorative. Priority: Medium.
        *   `src/components/landlord/PropertyTable.jsx` (Line 158, 172) -> Suggestion: Add handlers (e.g., view property, add property). Priority: High.
        *   `src/components/landlord/TenantTable.jsx` (Line 124, 139) -> Suggestion: Add handlers (e.g., view tenant, add tenant). Priority: High.
        *   `src/components/landlord/RequestFeed.jsx` (Line 99, 154) -> Suggestion: Add handlers (e.g., filter, view request). Priority: High.
        *   `src/components/landing/TenantDashboardDemo.js` (Lines 200, 346) -> Suggestion: Add handlers or confirm decorative. Priority: Medium.
        *   `src/components/landing/LandlordDashboardDemo.js` (Multiple lines) -> Suggestion: Add handlers or confirm decorative. Priority: Medium.

---

## Medium Priority Tasks

1.  **Add Active State Styling to Landing Page Nav:** Implement visual indication for the active link in `HeaderTabs.jsx`'s main navigation (`NavLink` component).
    *   **Status:** `todo`
    *   **File:** `src/components/landing/newComponents/HeaderTabs.jsx` (`NavLink` sub-component)
    *   **Suggestion:** Use `useLocation` hook from `react-router-dom` to compare `location.pathname` with the link's `to` prop. Apply theme classes (e.g., `text-primary font-semibold`) conditionally.

2.  **Create Missing Pages:** Implement basic placeholder pages for Settings and Support.
    *   **Status:** `todo`
    *   **Files:**
        *   Create `src/pages/SettingsPage.jsx`
        *   Create `src/pages/SupportPage.jsx`
    *   **Suggestion:** Create simple functional components wrapped in `DashboardLayout` with a relevant heading (e.g., "Settings", "Support"). Add routes for `/settings` and `/support` in `App.js`.

3.  **Review Demo/Showcase Pages:** Update `DemoPage.jsx`, `SimpleUIShowcase.jsx`, `TestUIComponents.jsx` to use the new theme colors and the refactored `Button` component consistently.
    *   **Status:** `todo`
    *   **Files:** `src/pages/DemoPage.jsx`, `src/pages/SimpleUIShowcase.jsx`, `src/pages/TestUIComponents.jsx`
    *   **Suggestion:** Replace old classes/components with new theme utilities/Button component.

---

## Low Priority Tasks

1.  **Review `checklist.ts`:** Check if the suggestions mentioning `propagentic-` classes are still relevant or just outdated comments.
    *   **Status:** `todo`
    *   **File:** `src/checklist.ts`

---

/* Apply theme colors and Button component to various components */

// Example for a demo component (e.g., ContractorDashboardDemo.js)
// Replace classes like bg-propagentic-teal, text-propagentic-teal
const DemoComponent = () => (
  <div className="p-4 bg-background dark:bg-background-dark">
    <h2 className="text-lg text-content dark:text-content-dark mb-4">Demo Title</h2>
    <Button variant="primary">Action</Button>
    <p className="text-primary dark:text-primary-light">Highlighted Text</p>
  </div>
);

// Example for a table component (e.g., PropertyTable.jsx)
// Replace hardcoded button/text styles
const TableRow = ({ item }) => (
  <tr>
    <td className="px-6 py-4 whitespace-nowrap text-sm text-content dark:text-content-dark">{item.name}</td>
    {/* ... other cells ... */}
    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
      <Button variant="ghost" size="xs" onClick={() => alert('View')} className="text-primary dark:text-primary-light">View</Button>
    </td>
  </tr>
);

// Example for a feed component (e.g., RequestFeed.jsx)
// Replace hardcoded button/text styles
const FeedItem = ({ item }) => (
  <div className="p-4 border-b border-border dark:border-border-dark">
    <p className="text-content dark:text-content-dark">{item.description}</p>
    <Button variant="outline" size="xs" onClick={() => alert('Filter')}>Filter Action</Button>
    <a href="#" className="text-sm text-primary hover:underline">Details Link</a>
  </div>
); 