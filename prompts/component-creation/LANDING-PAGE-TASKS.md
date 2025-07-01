# Landing Page UI/UX Refinement Tasks

**Overall Goal:** Enhance the UI/UX of the PropAgentic landing page components (`EnhancedHeroSection`, `DashboardPreview`, `EnhancedInteractiveDemo`) for improved user engagement, clarity, and conversion.

---

## Component: EnhancedHeroSection (`src/components/landing/newComponents/EnhancedHeroSection.jsx`)

**Objective:** Make the hero section more compelling and informative for different user roles.

- [ ] **Task 1: Dynamic Sub-headline:**
  - **Goal:** Tailor the value proposition message based on the selected user role (Landlord, Tenant, Contractor).
  - **Action:** Modify the sub-headline paragraph (`<SafeMotion.p>`) to display different benefit-oriented text depending on the `selectedRole` state.
  - **Considerations:** Ensure smooth text transition (potentially using `key` prop on the paragraph for re-animation).

- [ ] **Task 2: Improve Role Selector Visuals:**
  - **Goal:** Make the role selection more intuitive and visually appealing.
  - **Action:** Investigate `EnhancedRoleSelector.jsx`. Consider adding icons for each role, improving visual feedback on selection (e.g., bolder style, background change), and ensuring clear focus states.

- [ ] **Task 3: Enhance Call-to-Action (CTA) Buttons:**
  - **Goal:** Increase the prominence of the primary CTA and ensure accessibility.
  - **Action:** Make the "Get Started Free" button slightly larger or add a subtle interactive element (e.g., pulse animation on load, more distinct hover effect). Verify focus styles and keyboard accessibility for both buttons.

- [ ] **Task 4: Optimize Background Animations:**
  - **Goal:** Ensure background elements enhance aesthetics without distracting or hindering performance.
  - **Action:** Review the background particle animation. Consider reducing the number of particles, simplifying their movement, or adjusting opacity. Test performance on different devices/browsers.

- [ ] **Task 5: Refine Scroll Indicator:**
  - **Goal:** Make the scroll indicator more engaging or brand-aligned.
  - **Action:** Explore alternative visual treatments or animations for the "Scroll to explore" indicator.

- [ ] **Task 6: Comprehensive Responsiveness Check:**
  - **Goal:** Guarantee optimal viewing experience across all screen sizes.
  - **Action:** Test the hero section layout, text sizing, spacing, and element positioning on various breakpoints (small mobile, large mobile, tablet, desktop, large desktop).

- [ ] **Task 7: Accessibility Audit:**
  - **Goal:** Ensure the hero section meets accessibility standards.
  - **Action:** Perform checks for color contrast, semantic HTML, ARIA attributes (especially for interactive elements like the role selector), and keyboard navigation flow.

---

## Component: DashboardPreview (`src/components/landing/newComponents/DashboardPreview.jsx`)

*(Tasks to be added)*

---

## Component: EnhancedInteractiveDemo (`src/components/landing/newComponents/EnhancedInteractiveDemo.jsx`)

*(Tasks to be added)* 