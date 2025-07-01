# Propagentic Brand Overhaul Tasks (Light Theme - Teal Dominant)

**Goal:** Refactor the application's styling to implement a bright, tech-forward light theme using Teal as the primary accent, while also updating and maintaining dark mode support.

**Chosen Direction (Option 3):**
- **Feel:** Innovative, energetic, modern.
- **Base:** White (`#FFFFFF`) for light mode, Dark Gray/Near-Black (e.g., `#111827`) for dark mode.
- **Accent (Primary):** Teal (`#14B8A6` - `teal-500`) with shades (`#0D9488` - `teal-600`, `#5EEAD4` - `teal-300`).
- **Accent (Secondary):** Purple (`#8B5CF6` - `violet-500`) or Orange (`#F97316` - `orange-500`) - *Decision needed during implementation*. Let's start with Purple.
- **Text/UI:** Dark Gray (`#1F2937`) for primary light text, Light Gray (`#E5E7EB` / `#F3F4F6`) for primary dark text. Standard grays for secondary text, borders, UI elements.
- **Visuals:** Clean lines, crisp sans-serif font.

---

## Phase 1: Foundation Setup

1.  **Define Color Palette in Tailwind Config:**
    *   **Action:** Modify `tailwind.config.js`.
    *   **Details:**
        *   Add/update the `colors` section to include the new palette with clear names.
        *   Define shades for `primary` (Teal), `secondary` (Purple), `neutral` (Grays), `background` (White/Near-Black), `text` (Dark/Light Grays).
        *   *Example Structure:* 
            ```javascript
            colors: {
              white: '#FFFFFF',
              black: '#000000',
              transparent: 'transparent',
              primary: {
                DEFAULT: '#14B8A6', // teal-500
                light: '#5EEAD4',  // teal-300
                dark: '#0D9488',   // teal-600
                // Add more shades if needed (e.g., 50, 100, 700, 800, 900)
              },
              secondary: {
                DEFAULT: '#8B5CF6', // violet-500
                dark: '#7C3AED',   // violet-600
              },
              neutral: {
                50: '#F9FAFB',  // gray-50
                100: '#F3F4F6', // gray-100
                200: '#E5E7EB', // gray-200
                300: '#D1D5DB', // gray-300
                400: '#9CA3AF', // gray-400
                500: '#6B7280', // gray-500
                600: '#4B5563', // gray-600
                700: '#374151', // gray-700
                800: '#1F2937', // gray-800
                900: '#111827', // gray-900
              },
              // Specific semantic colors (can use neutral or primary/secondary)
              background: {
                DEFAULT: '#FFFFFF',         // Light mode base
                subtle: '#F9FAFB',        // Light mode subtle sections (e.g., neutral-50)
                dark: '#111827',           // Dark mode base
                darkSubtle: '#1F2937',     // Dark mode subtle sections (e.g., neutral-800 or 900)
              },
              content: {
                DEFAULT: '#1F2937',        // Light mode primary text (neutral-800)
                secondary: '#4B5563',     // Light mode secondary text (neutral-600)
                dark: '#F3F4F6',           // Dark mode primary text (neutral-100)
                darkSecondary: '#9CA3AF', // Dark mode secondary text (neutral-400)
              },
              border: {
                DEFAULT: '#E5E7EB',        // Light mode borders (neutral-200)
                dark: '#374151',           // Dark mode borders (neutral-700)
              },
              // Status Colors (Example)
              success: '#10B981', // emerald-500
              warning: '#F59E0B', // amber-500
              danger: '#EF4444', // red-500
              // ... other colors ...
            }
            ```
        *   Ensure the `darkMode: 'class'` strategy is configured (or update if needed).

2.  **Update Global Styles:**
    *   **Action:** Modify `src/index.css` (or equivalent global stylesheet).
    *   **Details:**
        *   Set base `background-color` and `color` on `body` or `html` for light mode (using Tailwind config names like `bg-background`, `text-content`).
        *   Add corresponding styles within a `.dark` class selector for dark mode (e.g., `.dark body { @apply bg-background-dark text-content-dark; }`).
        *   Ensure base font styles (e.g., font family defined in `tailwind.config.js`) are applied.

3.  **Add Dark Mode Toggle (if missing):**
    *   **Action:** Implement or verify the dark mode toggle functionality.
    *   **Details:** Ensure there's a UI element (button, switch) that adds/removes the `dark` class to the `<html>` or `<body>` tag and persists the user's preference (e.g., using `localStorage`).

---

## Phase 2: Component Refactoring (Iterative)

**General Approach:** Work through components, replacing hardcoded colors and old Tailwind classes (e.g., `bg-propagentic-slate-dark`, `text-white`) with the new semantic color names from `tailwind.config.js` (e.g., `bg-primary-dark`, `dark:bg-background-dark`, `text-content`, `dark:text-content-dark`). Apply `dark:` variants where needed.

1.  **Shared UI Components (`src/components/ui/`):**
    *   **Target Files:** `Button.jsx`, `StatusPill.jsx`, `Modal.jsx`, form elements (Input, Select, Textarea if custom), etc.
    *   **Action:** Update background, text, border, icon colors for all variants and states (default, hover, focus, active, disabled) for both light and dark modes.
    *   *Example (`Button.jsx` Primary Variant):*
        *   Light: `bg-primary text-white hover:bg-primary-dark ...`
        *   Dark: `dark:bg-primary dark:hover:bg-primary-light ...` (adjust dark mode colors for good contrast/feel)

2.  **Shared Layout/Structure Components (`src/components/shared/`, `src/layouts/`):**
    *   **Target Files:** `Header.jsx` / `HeaderTabs.jsx`, `Sidebar.jsx` (if separate), `DashboardLayout.jsx`, `ErrorBoundary.jsx`, `SafeMotion.jsx` (verify colors aren't hardcoded).
    *   **Action:** Update background colors, text colors, borders.

3.  **Landing Page Components (`src/components/landing/newComponents/`):**
    *   **Target Files:** `EnhancedHeroSection.jsx`, `DashboardPreview.jsx`, `EnhancedInteractiveDemo.jsx`.
    *   **Action:** Go through each component and apply the new theme colors systematically.
        *   Replace backgrounds (`bg-gradient-to-b from-propagentic-slate-dark` -> use neutral darks + `dark:`). 
        *   Replace text (`text-propagentic-neutral-lightest` -> `text-content`, `text-propagentic-neutral-light` -> `text-content-secondary`, apply `dark:` variants).
        *   Update button/interactive element styling (RoleSelector, StatCards, ListItems, StepIndicators) to use new primary/secondary/neutral colors.
        *   Update SVG icon colors where applicable (e.g., `text-white` -> `text-content-dark` in dark mode).

4.  **Authentication Pages (`src/pages/auth/`):**
    *   **Target Files:** `LoginPage.jsx`, `RegisterPage.jsx`, `ForgotPasswordPage.jsx`.
    *   **Action:** Update form styles, button styles, background, text colors for light and dark modes.

5.  **Dashboard Pages (`src/pages/landlord/`, `src/pages/tenant/`, `src/pages/contractor/`):**
    *   **Target Files:** `LandlordDashboard.jsx`, `TenantDashboard.jsx`, `ContractorDashboard.jsx`, related sub-pages/components (e.g., PropertyList, MaintenanceList).
    *   **Action:** This is likely the largest area. Apply new theme colors to all dashboard elements: cards, tables, lists, charts, buttons, text, backgrounds, borders.

---

## Phase 3: Dark Mode Polish

1.  **Comprehensive Dark Mode Review:**
    *   **Action:** Manually toggle between light and dark modes on all major pages and components.
    *   **Details:** Look for areas where:
        *   Contrast is poor (e.g., dark text on dark backgrounds, primary accent too dim).
        *   Colors feel muddy or clash.
        *   Elements are hard to distinguish.
    *   **Refinement:** Tweak specific `dark:` utility classes. Sometimes dark mode requires slightly less saturated or lighter accent colors, or different gray shades for backgrounds/borders than a direct inversion of the light theme.

---

## Phase 4: Testing & Refinement

1.  **Visual Regression Testing (if possible):**
    *   **Action:** Use visual testing tools (Storybook, Chromatic, Percy, etc.) if available to catch unintended visual changes.
    *   **Manual:** If no tools, manually compare key pages/components against previous versions or mockups.

2.  **Cross-Browser Testing:**
    *   **Action:** Test the application in major browsers (Chrome, Firefox, Safari, Edge).
    *   **Details:** Check for layout inconsistencies or rendering issues related to styling.

3.  **Responsiveness Testing:**
    *   **Action:** Re-test responsiveness on various screen sizes for all refactored components.
    *   **Details:** Ensure the new theme doesn't negatively impact layout adjustments.

4.  **Accessibility Testing (Contrast):**
    *   **Action:** Use browser dev tools or accessibility checker extensions.
    *   **Details:** Specifically check color contrast ratios for text/backgrounds and UI elements in both light and dark modes, ensuring they meet WCAG AA standards.

---

**Notes:**
- **Iterate:** This is a large task. Break it down, component by component or section by section.
- **Consistency:** Strive for consistent use of the defined semantic color names.
- **Communication:** Document decisions made (e.g., final choice for secondary accent color). 