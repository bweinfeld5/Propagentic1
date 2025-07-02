# Prompt for Cursor

## Task
You need to remove the dark mode toggle functionality from the user's dashboard and enforce light mode by default.

## Instructions

1. **Locate Dark Mode Toggle**:
   - Search the codebase for where the theme toggle (dark mode/light mode) is implemented.
   - This is likely implemented in a context provider (e.g., `ThemeContext`, `ThemeProvider`) or directly in the user dashboard component.

2. **Remove Toggle Button**:
   - In the user's dashboard UI, find and **remove the button or switch** that lets the user toggle between light and dark mode.

3. **Enforce Light Mode**:
   - Set the application to **use light mode by default**.
   - If there are any conditionals or theme providers that switch between dark/light, update them to always apply the light theme.
   - Clean up any unused theme-related state or props.

4. **Ensure Consistent Styling**:
   - Make sure the removal of dark mode doesn't break styling on any components. All views should default to light mode styles.

5. **Clean Up**:
   - Remove any unused variables, imports, or context related to dark mode.
   - Test the dashboard and surrounding components to ensure everything displays correctly in light mode only.

---

Let me know if any theme files or global stylesheets need to be adjusted after enforcing light mode.
